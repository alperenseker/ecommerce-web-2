/* ============================================================
   services/compare.service.js — KARŞILAŞTIRMA
   ------------------------------------------------------------
   Karşılaştırma listesi tümüyle SUNUCUDA yaşar; istek listesindeki
   gibi yerel ayna tutulmaz çünkü liste küçüktür (en çok 4 ürün) ve
   kalem kimlikleri (ComparisonItemId) silme için zaten gerekir.

   Sunucu iki kural uygular ve ikisi de hata mesajıyla döner:
     • aynı kategori şartı (istemci `ignoreCategory: true` gönderir),
     • en fazla 4 ürün.
   Mesaj sunucunun tek dilindedir; bu yüzden İÇERİĞİNE bakıp kendi
   dilimizde yazıyoruz.
   ============================================================ */

(function (App) {
    'use strict';

    var Cmp = {
        list:  null,   // sunucudaki karşılaştırma listesi (ilk liste)
        items: []
    };

    function announce() {
        App.bus.emit(App.bus.EVENTS.COMPARE_CHANGED, {
            items: Cmp.items,
            count: Cmp.items.length,
            ids: Cmp.items.map(function (i) { return String(i.ProductId); })
        });
    }

    /* ============================================================
       OKUMA
       ============================================================ */

    Cmp.load = async function () {
        if (!App.auth.isLoggedIn()) { Cmp.items = []; announce(); return []; }

        try {
            var res = await App.api.compare.getLists(App.auth.userId());

            if (res.success && res.data && res.data.length) {
                Cmp.list  = res.data[0];
                Cmp.items = Cmp.list.Items || [];

                /* Katalogdan kalkmış ürünler listede kalmasın. */
                var dead = Cmp.items.filter(function (i) { return i.IsActive === false; });
                for (var n = 0; n < dead.length; n++) {
                    try { await App.api.compare.remove(dead[n].ComparisonItemId); } catch (e) {}
                }
                Cmp.items = Cmp.items.filter(function (i) { return i.IsActive !== false; });
            } else {
                Cmp.list = null;
                Cmp.items = [];
            }
        } catch (e) {
            console.error('Karşılaştırma listesi yüklenemedi:', e && e.message);
            Cmp.items = [];
        }

        announce();
        return Cmp.items;
    };

    Cmp.count = function () { return Cmp.items.length; };

    Cmp.has = function (productId) {
        return Cmp.items.some(function (i) { return String(i.ProductId) === String(productId); });
    };

    Cmp.itemOf = function (productId) {
        return Cmp.items.find(function (i) { return String(i.ProductId) === String(productId); }) || null;
    };

    /* ============================================================
       YAZMA
       ============================================================ */

    Cmp.toggle = async function (productId) {
        if (!App.auth.require(App.t('compare.toCompare', 'karşılaştırmak için'))) return false;

        /* Liste bellekte yoksa (sayfa yeni açıldı) önce okunur —
           yoksa "ekli mi?" sorusuna yanlış cevap verilir. */
        if (!Cmp.items.length && !Cmp.list) await Cmp.load();

        return Cmp.has(productId) ? Cmp.remove(productId) : Cmp.add(productId);
    };

    Cmp.add = async function (productId) {
        try {
            var res = await App.api.compare.add({
                userId: String(App.auth.userId()),
                productId: String(productId),
                ignoreCategory: true
            });

            if (res.success) {
                App.toast.success(App.t('compare.added', 'Karşılaştırmaya eklendi'));
                await Cmp.load();
                return true;
            }
            throw new Error(res.message || '');

        } catch (error) {
            handleAddError(error, productId);
            return false;
        }
    };

    /**
     * Sunucu hata mesajları tek dilli; içeriğine bakıp kendi dilimizde
     * anlamlı bir uyarı gösteriyoruz.
     */
    function handleAddError(error, productId) {
        var msg = String(error.message || '').toLowerCase();

        if (msg.indexOf('same category') !== -1) {
            App.toast.error(App.t('compare.sameCategory', 'Yalnız aynı kategorideki ürünler karşılaştırılabilir'));
        } else if (msg.indexOf('limit') !== -1 || msg.indexOf('maximum') !== -1 || msg.indexOf('4') !== -1) {
            App.toast.error(App.t('compare.limit', 'En fazla {n} ürün karşılaştırılabilir')
                .replace('{n}', App.config.COMPARE_LIMIT));
        } else if (msg.indexOf('already') !== -1) {
            /* Sunucuda zaten varmış — ekranı gerçekle hizala. */
            App.toast.info(App.t('compare.alreadyIn', 'Ürün zaten karşılaştırma listesinde'));
            Cmp.load();
        } else {
            App.toast.error(error.message || App.t('compare.error', 'Karşılaştırmaya eklenemedi'));
        }
    }

    Cmp.remove = async function (productId) {
        var item = Cmp.itemOf(productId);
        if (!item) return false;
        return Cmp.removeItem(item.ComparisonItemId);
    };

    Cmp.removeItem = async function (comparisonItemId) {
        try {
            await App.api.compare.remove(comparisonItemId);
            Cmp.items = Cmp.items.filter(function (i) { return i.ComparisonItemId !== comparisonItemId; });
            App.toast.success(App.t('compare.removed', 'Karşılaştırmadan çıkarıldı'));
            announce();
            return true;
        } catch (e) {
            App.toast.error(App.t('compare.removeError', 'Çıkarılamadı'));
            return false;
        }
    };

    Cmp.clear = async function () {
        if (!Cmp.list) return false;
        try {
            await App.api.compare.clear(Cmp.list.ComparisonId || Cmp.list.Id);
            Cmp.items = [];
            App.toast.success(App.t('compare.cleared', 'Karşılaştırma listesi temizlendi'));
            announce();
            return true;
        } catch (e) {
            App.toast.error(App.t('compare.clearError', 'Liste temizlenemedi'));
            return false;
        }
    };

    App.compare = Cmp;

})(window.App);
