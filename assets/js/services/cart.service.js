/* ============================================================
   services/cart.service.js — SEPET
   ------------------------------------------------------------
   Sepet SUNUCUDA tutulur (mobil uygulama ile paylaşılır), yerelde
   yalnız son okunan hâli bellekte durur. Her değişiklikten sonra
   'cart:changed' yayınlanır; header rozeti, çekmece ve sepet
   sayfası bu olayı dinleyerek kendini günceller.

   Stoksuz sipariş yetkisi ŞİRKET BAŞINA ve kararı SUNUCU verir
   (gövdedeki eski `CanOrderWithoutStock` bayrağını okumuyor, bu
   yüzden artık gönderilmiyor). İstemci yetkiyi yalnız ekranda
   doğru düğmeyi/üst sınırı göstermek için kullanır (App.perm).

   FAZ 38 — satış birimli üründe adet min/adım kuralına uymalı;
   geçersiz adet sunucuya GİTMEZ, sebebi kullanıcının dilinde
   yazılır. Sunucu reddi (min_order_qty, order_step,
   insufficient_stock) de çevrilir; başarısız güncellemeden sonra
   ekran sunucudaki adede döner.

   FAZ 44 — müşteriden sonradan gizlenen ürünün kalemi
   (`IsAvailable: false`) sepette "недоступен" olarak durur,
   tutara katılmaz; kullanıcı siler. Gizli ürünü ekleme / miktarını
   değiştirme 404 → "Этот товар больше недоступен."
   ============================================================ */

(function (App) {
    'use strict';

    var Cart = {
        items: [],
        data:  null
    };

    /** Sepete ekleme / miktar uçlarında stok reddi mi? */
    function isStockError(error) {
        return !!error && (error.errorCode === 'insufficient_stock' ||
            /insufficient stock|out of stock/i.test(String(error.message || '')));
    }

    /* Her değişimden sonra tek noktadan haber verilir. */
    function announce() {
        App.bus.emit(App.bus.EVENTS.CART_CHANGED, {
            items: Cart.items,
            count: Cart.count(),
            total: Cart.total()
        });
    }

    /* ============================================================
       OKUMA
       ============================================================ */

    /** Sunucudan sepeti çeker ve belleği tazeler. */
    Cart.load = async function () {
        var userId = App.auth.userId();
        if (!userId) { Cart.items = []; Cart.data = null; announce(); return []; }

        try {
            var res = await App.api.cart.get(userId);
            if (res.success && res.data) {
                Cart.data  = res.data;
                Cart.items = res.data.Items || [];
                await dropInactiveItems();
            } else {
                Cart.items = [];
            }
        } catch (e) {
            console.error('Sepet yüklenemedi:', e && e.message);
            Cart.items = [];
        }

        announce();
        return Cart.items;
    };

    /**
     * Katalogdan kalkmış (pasif) ürünler sepette kalmamalı: sipariş
     * anında sunucu bunları reddeder ve kullanıcı sebebini anlamaz.
     * Sessizce temizlenir.
     */
    async function dropInactiveItems() {
        if (!App.catalog.products.length) return;

        var dead = Cart.items.filter(function (item) {
            var product = App.catalog.findById(item.ProductId);
            return product && product.IsActive === false;
        });

        for (var i = 0; i < dead.length; i++) {
            try { await App.api.cart.remove(dead[i].CartItemId); } catch (e) {}
        }

        if (dead.length) {
            Cart.items = Cart.items.filter(function (item) {
                return dead.indexOf(item) === -1;
            });
        }
    }

    /* ============================================================
       TOPLAMLAR
       ============================================================ */

    Cart.count = function () {
        return Cart.items.reduce(function (sum, item) {
            return sum + (parseInt(item.Quantity, 10) || 0);
        }, 0);
    };

    /** Ödenecek tutar — artık görünmeyen (FAZ 44) kalem siparişe girmez, sayılmaz. */
    Cart.total = function () {
        return Cart.items.reduce(function (sum, item) {
            return App.rules.isCartItemUnavailable(item) ? sum : sum + Cart.lineTotal(item);
        }, 0);
    };

    /** FAZ 44 — sepette kalmış ama artık bu müşteriye görünmeyen kalemler. */
    Cart.unavailableItems = function () {
        return Cart.items.filter(App.rules.isCartItemUnavailable);
    };

    /** Satır tutarı — sunucu TotalPrice gönderdiyse ona güvenilir. */
    Cart.lineTotal = function (item) {
        if (item.TotalPrice !== undefined && item.TotalPrice !== null) {
            return parseFloat(item.TotalPrice) || 0;
        }
        return (parseFloat(item.UnitPrice) || 0) * (parseInt(item.Quantity, 10) || 0);
    };

    /** Şirkete göre gruplar — sepet kaç ayrı siparişe bölünecek? */
    Cart.groups = function () {
        return App.model.groupByErp(Cart.items);
    };

    Cart.isEmpty = function () { return Cart.items.length === 0; };

    Cart.findByProduct = function (productId) {
        return Cart.items.find(function (i) { return String(i.ProductId) === String(productId); }) || null;
    };

    /* ============================================================
       YAZMA
       ============================================================ */

    /**
     * Sepete ekle.
     * @param {string} productId
     * @param {number} [quantity] verilmezse ürünün en küçük geçerli adedi
     *        (satış birimli üründe MinOrderQty, değilse 1) — hızlı ekleme
     *        (kart, istek listesi, karşılaştırma) böyle çağırır.
     * @param {Object} [options] { silent: true } → bildirim gösterme.
     *        Toplu eklemede (ör. "tüm favorileri sepete at") 30 tane
     *        balon üst üste yığılmasın diye gerekli.
     * @returns {Promise<boolean>} başarılı mı (ekran bunu bilir)
     */
    Cart.add = async function (productId, quantity, options) {
        options = options || {};
        if (!App.auth.require(App.t('cart.toAddToCart', 'ürünü sepete eklemek için'))) return false;

        var say = function (kind, message) { if (!options.silent) App.toast[kind](message); };
        var product = App.catalog.findById(productId);

        /* Ürün önbellekte yoksa sunucuya sorulur — arama sonucundan
           gelen ya da yeni eklenmiş ürünler için gerekli. */
        if (!product) {
            try {
                var res = await App.api.products.getById(productId);
                if (res.success) product = res.data;
            } catch (e) {
                /* FAZ 44 — bu müşteriden gizlenmiş ürün de 404. */
                var goneLookup = App.rules.productUnavailableMessage(e, true);
                if (goneLookup) { say('warning', goneLookup); return false; }
            }
        }

        if (!product) {
            say('error', App.t('cart.productNotFound', 'Ürün bulunamadı'));
            return false;
        }

        var stock = App.model.stock(product);
        if (!stock.canOrder) {
            say('warning', stock.priceBlocked
                ? App.t('common.noPriceContactUs', 'No price is set for you for this product. Please contact us.')
                : App.t('stock.outOfStock', 'Ürün stokta yok'));
            return false;
        }

        /* FAZ 38 — adet kuralı gönderilmeden kontrol edilir; geçersiz
           adet (25, 0, 24.5) sunucuya gitmez, sebebi yazılır. */
        var rules = App.su.qtyRules(product);
        var qty = (quantity === undefined || quantity === null) ? (rules ? rules.min : 1) : Number(quantity);
        if (rules) {
            var qtyError = App.su.qtyError(qty, product, rules);
            if (qtyError) { say('warning', App.utils.escape(qtyError)); return false; }
        } else {
            qty = parseInt(qty, 10) || 1;
        }

        try {
            var response = await App.api.cart.add({
                UserId: App.auth.userId(),
                ProductId: productId,
                Quantity: qty
            });

            if (!response.success) throw new Error(response.message || 'Sepete eklenemedi');

            say('success',
                App.utils.escape(App.fmt.truncate(product.Name, 48)) + ' — ' +
                App.t('cart.added', 'sepete eklendi')
            );

            await Cart.load();
            return true;

        } catch (error) {
            /* FAZ 44 — ürün bu müşteriden gizlendi (kodsuz 404): önbellekten
               çizilen kart bir daha "sepete ekle" sunmasın. */
            var gone = App.rules.productUnavailableMessage(error, true);
            if (gone) {
                App.catalog.forget(productId);
                say('warning', gone);
                return false;
            }

            var unitError = App.su.errorMessage(error, product);
            if (unitError) {
                say('warning', App.utils.escape(unitError));
            } else if (isStockError(error)) {
                say('warning', App.t('stock.outOfStock', 'Ürün stokta yok'));
            } else {
                say('error', App.t('cart.addError', 'Sepete eklenemedi') + ': ' + App.utils.escape(error.message));
            }
            return false;
        }
    };

    /**
     * Miktar güncelle.
     * Satış birimli kalemde adet kurala uymalı; geçersizse istek gitmez.
     * Başarısız güncellemede (yerel kontrol ya da sunucu reddi) ekran
     * SUNUCUDAKİ adede döner: kalem değiştirilmeden 'cart:changed'
     * yayınlanır, sepet ekranları kendini yeniden çizer.
     * Başarıda sunucunun döndürdüğü sepet esas alınır (taban miktar,
     * tutar, kalem işaretleri sunucudan).
     */
    Cart.updateQuantity = async function (cartItemId, quantity) {
        var item = Cart.items.find(function (i) { return i.CartItemId === cartItemId; });
        var rules = item ? App.su.qtyRules(item, App.model.cartItemErp(item)) : null;
        var qty;

        if (rules) {
            qty = Number(quantity);
            var qtyError = App.su.qtyError(qty, item, rules);
            if (qtyError) {
                App.toast.warning(App.utils.escape(qtyError));
                announce();
                return false;
            }
        } else {
            qty = parseInt(quantity, 10);
            if (isNaN(qty) || qty < 1) {
                App.toast.warning(App.t('cart.invalidQuantity', 'Geçersiz miktar'));
                announce();
                return false;
            }
        }

        try {
            var res = await App.api.cart.updateQuantity({ CartItemId: cartItemId, Quantity: qty });

            if (res && res.data && Array.isArray(res.data.Items)) {
                Cart.data  = res.data;
                Cart.items = res.data.Items;
            } else if (item) {
                item.Quantity = qty;
                if (item.TotalPrice !== undefined) {
                    item.TotalPrice = (parseFloat(item.UnitPrice) || 0) * qty;
                }
            }
        } catch (error) {
            /* FAZ 44 — ürün sepete eklendikten sonra gizlendi: sepet
               sunucudan tazelenir, kalem "недоступен" olarak görünür. */
            var gone = App.rules.productUnavailableMessage(error);
            if (gone) {
                App.toast.warning(gone);
                await Cart.load();
                return false;
            }

            var message = App.su.errorMessage(error, item) ||
                (isStockError(error)
                    ? App.t('salesUnit.errors.insufficientStockNoQty', 'Not enough stock for the requested quantity.')
                    : App.t('cart.updateError', 'Miktar güncellenemedi'));
            App.toast.error(App.utils.escape(message));
            announce();
            return false;
        }

        announce();
        return true;
    };

    Cart.remove = async function (cartItemId) {
        try {
            var res = await App.api.cart.remove(cartItemId);
            if (!res.success) throw new Error(res.message);

            Cart.items = Cart.items.filter(function (i) { return i.CartItemId !== cartItemId; });
            App.toast.success(App.t('cart.removed', 'Ürün sepetten kaldırıldı'));
            announce();
            return true;

        } catch (error) {
            App.toast.error(App.t('cart.removeError', 'Ürün kaldırılamadı'));
            return false;
        }
    };

    /**
     * Sepeti boşalt.
     * @param {boolean} [silent] sipariş sonrası temizlikte true verilir:
     *        sunucu sepeti zaten tüketti, "sepet temizlendi" balonu
     *        müşteriyi "siparişim silindi mi?" diye tereddüde düşürüyor.
     */
    Cart.clear = async function (silent) {
        var userId = App.auth.userId();
        if (!userId) return false;

        try {
            var res = await App.api.cart.clear(userId);
            if (!res.success) throw new Error(res.message);

            Cart.items = [];
            if (!silent) App.toast.success(App.t('cart.messages.cartCleared', App.t('cart.cleared', 'Корзина очищена')));
            announce();
            return true;

        } catch (error) {
            /* Sipariş sonrası sessiz temizlikte hata da sessiz geçer:
               sunucu sepeti zaten tüketmiş olabilir. */
            if (!silent) App.toast.error(App.t('cart.messages.clearFailed', App.t('cart.clearError', '')));
            Cart.items = silent ? [] : Cart.items;
            announce();
            return false;
        }
    };

    App.cart = Cart;

    /* ------------------------------------------------------------
       SEKME ÖNE GELİNCE TAZELE
       Sepet sunucuda ve MOBİL uygulamayla ortak. Bu sekme açık
       dururken kullanıcı mobilden sipariş verdiyse sepet tükenmiştir;
       sekmeye dönüldüğünde yeniden okunur, yoksa ekranda sipariş
       edilemeyecek ürünler durmaya devam eder.
       ------------------------------------------------------------ */
    document.addEventListener('visibilitychange', function () {
        if (document.hidden || !App.auth.isLoggedIn()) return;
        Cart.load();
    });

})(window.App);
