/* ============================================================
   services/cart.service.js — SEPET
   ------------------------------------------------------------
   Sepet SUNUCUDA tutulur (mobil uygulama ile paylaşılır), yerelde
   yalnız son okunan hâli bellekte durur. Her değişiklikten sonra
   'cart:changed' yayınlanır; header rozeti, çekmece ve sepet
   sayfası bu olayı dinleyerek kendini günceller.

   `canOrderWithoutStock` yetkisi olan bayi stok bitse de sepete
   ekleyebilir; bu yetki her istekte gövdeye konur çünkü kararı
   sunucu verir.
   ============================================================ */

(function (App) {
    'use strict';

    var Cart = {
        items: [],
        data:  null
    };

    function canOrderWithoutStock() {
        return App.store.getBool(App.keys.CAN_ORDER_NO_STOCK);
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

    Cart.total = function () {
        return Cart.items.reduce(function (sum, item) {
            return sum + Cart.lineTotal(item);
        }, 0);
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
     * @param {number} [quantity=1]
     * @param {Object} [options] { silent: true } → bildirim gösterme.
     *        Toplu eklemede (ör. "tüm favorileri sepete at") 30 tane
     *        balon üst üste yığılmasın diye gerekli.
     * @returns {Promise<boolean>} başarılı mı (ekran bunu bilir)
     */
    Cart.add = async function (productId, quantity, options) {
        options = options || {};
        if (!App.auth.require(App.t('cart.toAddToCart', 'ürünü sepete eklemek için'))) return false;

        var product = App.catalog.findById(productId);

        /* Ürün önbellekte yoksa sunucuya sorulur — arama sonucundan
           gelen ya da yeni eklenmiş ürünler için gerekli. */
        if (!product) {
            try {
                var res = await App.api.products.getById(productId);
                if (res.success) product = res.data;
            } catch (e) {}
        }

        if (!product) {
            if (!options.silent) App.toast.error(App.t('cart.productNotFound', 'Ürün bulunamadı'));
            return false;
        }

        var stock = App.model.stock(product);
        if (!stock.canOrder) {
            if (!options.silent) App.toast.warning(App.t('stock.outOfStock', 'Ürün stokta yok'));
            return false;
        }

        try {
            var response = await App.api.cart.add({
                UserId: App.auth.userId(),
                ProductId: productId,
                Quantity: quantity || 1,
                CanOrderWithoutStock: canOrderWithoutStock()
            });

            if (!response.success) throw new Error(response.message || 'Sepete eklenemedi');

            App.toast.success(
                App.utils.escape(App.fmt.truncate(product.Name, 48)) + ' — ' +
                App.t('cart.added', 'sepete eklendi')
            );

            await Cart.load();
            return true;

        } catch (error) {
            var msg = String(error.message || '').toLowerCase();
            if (msg.indexOf('out of stock') !== -1 || msg.indexOf('insufficient stock') !== -1) {
                App.toast.warning(App.t('stock.outOfStock', 'Ürün stokta yok'));
            } else {
                App.toast.error(App.t('cart.addError', 'Sepete eklenemedi') + ': ' + error.message);
            }
            return false;
        }
    };

    /**
     * Miktar güncelle.
     * Stoksuz sipariş yetkisi olan kullanıcıda sunucu yine de stok
     * hatası dönebiliyor; o durumda hata YUTULUR ve işlem başarılı
     * sayılır — yetkinin anlamı zaten budur.
     */
    Cart.updateQuantity = async function (cartItemId, quantity) {
        quantity = parseInt(quantity, 10);
        if (isNaN(quantity) || quantity < 1) {
            App.toast.warning(App.t('cart.invalidQuantity', 'Geçersiz miktar'));
            return false;
        }

        var body = {
            CartItemId: cartItemId,
            Quantity: quantity,
            CanOrderWithoutStock: canOrderWithoutStock()
        };

        try {
            await App.api.cart.updateQuantity(body);
        } catch (error) {
            var isStockError = String(error.message || '').toLowerCase().indexOf('insufficient stock') !== -1;
            if (!(canOrderWithoutStock() && isStockError)) {
                App.toast.error(App.t('cart.updateError', 'Miktar güncellenemedi'));
                return false;
            }
        }

        /* Beklemeden yerel kaydı da güncelle: ekran anında tepki versin. */
        var item = Cart.items.find(function (i) { return i.CartItemId === cartItemId; });
        if (item) {
            item.Quantity = quantity;
            if (item.TotalPrice !== undefined) {
                item.TotalPrice = (parseFloat(item.UnitPrice) || 0) * quantity;
            }
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

    Cart.clear = async function () {
        var userId = App.auth.userId();
        if (!userId) return false;

        try {
            var res = await App.api.cart.clear(userId);
            if (!res.success) throw new Error(res.message);

            Cart.items = [];
            App.toast.success(App.t('cart.cleared', 'Sepet temizlendi'));
            announce();
            return true;

        } catch (error) {
            App.toast.error(App.t('cart.clearError', 'Sepet temizlenemedi'));
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
