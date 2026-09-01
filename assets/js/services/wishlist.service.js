/* ============================================================
   services/wishlist.service.js — İSTEK LİSTESİ (FAVORİLER)
   ------------------------------------------------------------
   İstek listesinin ASIL yeri SUNUCUDUR. Ancak kalp ikonunun dolu mu
   boş mu olduğu her kartta anında bilinmeli — her kart için ayrı
   istek atmak kabul edilemez. Bu yüzden sunucudaki liste
   `wishlist_<userId>` anahtarında YEREL AYNA olarak tutulur:

     • ekran ayna üzerinden çizilir (anında),
     • tıklama önce aynayı çevirir (anında geri bildirim),
     • sunucuya istek arkadan gider.

   🔴 Sunucuya ulaşılamazsa AYNAYA DOKUNULMAZ. "İstek hatası" ile
      "liste boş" aynı şey değildir; karıştırılırsa kullanıcının
      kalpleri sebepsiz söner.
   ============================================================ */

(function (App) {
    'use strict';

    var Wish = { ids: [] };

    function key() {
        var userId = App.auth.userId();
        return userId ? App.keys.wishlist(userId) : null;
    }

    function readMirror() {
        var k = key();
        if (!k) return [];
        var list = App.store.getJson(k, []);
        return Array.isArray(list) ? list.map(String) : [];
    }

    function writeMirror(ids) {
        var k = key();
        if (!k) return;
        App.store.setJson(k, ids);
        Wish.ids = ids;
        App.bus.emit(App.bus.EVENTS.WISHLIST_CHANGED, { ids: ids, count: ids.length });
    }

    /* ============================================================
       OKUMA
       ============================================================ */

    Wish.getIds = function () {
        Wish.ids = readMirror();
        return Wish.ids;
    };

    Wish.has = function (productId) {
        return Wish.getIds().indexOf(String(productId)) !== -1;
    };

    /**
     * Sayaç — aynadaki kimliklerden YALNIZ katalogda hâlâ duranlar
     * sayılır. Katalog henüz yüklenmediyse süzme yapılmaz, yoksa
     * sayaç haksız yere 0 görünür.
     */
    Wish.count = function () {
        var ids = Wish.getIds();
        if (!App.catalog.products.length) return ids.length;

        return ids.filter(function (id) { return !!App.catalog.findById(id); }).length;
    };

    /**
     * Sunucudaki listeyi aynaya yazar.
     * Yeni tarayıcıda, gizli sekmede veya giriş sonrası localStorage
     * temizlendiğinde ayna boş kalır; bu çağrı olmadan sunucuda ürün
     * olmasına rağmen sayaç 0 ve kalpler boş görünür.
     */
    Wish.syncFromServer = async function () {
        if (!App.auth.isLoggedIn()) return [];

        try {
            var res = await App.api.wishlist.get(App.auth.userId());
            if (!res.success || !res.data) return Wish.ids;

            var payload = Array.isArray(res.data) ? res.data[0] : res.data;
            var items = (payload && payload.Items) || [];

            var ids = items
                .filter(function (item) { return item.IsActive !== false; })
                .map(function (item) { return String(item.ProductId); });

            writeMirror(ids);
            return ids;

        } catch (e) {
            /* 🔴 Ayna korunur — bkz. dosya başı notu. */
            console.warn('İstek listesi sunucudan alınamadı:', e && e.message);
            return Wish.ids;
        }
    };

    /** Sayfa için tam kayıtlar (ad, fiyat, görsel ile birlikte). */
    Wish.loadItems = async function () {
        if (!App.auth.isLoggedIn()) return [];

        var res = await App.api.wishlist.get(App.auth.userId());
        if (!res.success || !res.data) return [];

        var payload = Array.isArray(res.data) ? res.data[0] : res.data;
        var items = (payload && payload.Items) || [];

        /* Katalogdan kalkmış kalemler listeden düşürülür. */
        var dead = items.filter(function (i) { return i.IsActive === false; });
        for (var n = 0; n < dead.length; n++) {
            try { await App.api.wishlist.remove(dead[n].WishlistItemId); } catch (e) {}
        }

        var alive = items.filter(function (i) { return i.IsActive !== false; });
        writeMirror(alive.map(function (i) { return String(i.ProductId); }));

        return alive;
    };

    /* ============================================================
       YAZMA
       ============================================================ */

    /**
     * Ekle / çıkar. Ayna ÖNCE çevrilir (iyimser güncelleme), sunucu
     * arkadan takip eder — kullanıcı ağ gecikmesini hissetmez.
     */
    Wish.toggle = async function (productId) {
        if (!App.auth.require(App.t('wishlist.toAdd', 'favorilere eklemek için'))) return false;

        productId = String(productId);
        var ids = Wish.getIds();
        var index = ids.indexOf(productId);
        var willAdd = index === -1;

        if (willAdd) ids.push(productId);
        else ids.splice(index, 1);
        writeMirror(ids);

        App.toast.success(willAdd
            ? App.t('wishlist.added', 'Favorilere eklendi')
            : App.t('wishlist.removed', 'Favorilerden çıkarıldı'));

        try {
            if (willAdd) {
                await App.api.wishlist.add({
                    userId: String(App.auth.userId()),
                    productId: productId,
                    note: '',
                    priority: 0
                });
            } else {
                await removeOnServer(productId);
            }
        } catch (e) {
            console.error('İstek listesi eşitlenemedi:', e && e.message);
        }

        return willAdd;
    };

    /**
     * Sunucudaki kaydı silmek için WishlistItemId gerekir; elimizde
     * yalnız ProductId var, o yüzden önce liste okunur.
     */
    async function removeOnServer(productId) {
        var res = await App.api.wishlist.get(App.auth.userId());
        if (!res.success || !res.data) return;

        var payload = Array.isArray(res.data) ? res.data[0] : res.data;
        var items = (payload && payload.Items) || [];

        var found = items.find(function (i) { return String(i.ProductId) === String(productId); });
        if (found && found.WishlistItemId) await App.api.wishlist.remove(found.WishlistItemId);
    }

    /** Liste sayfasındaki "sil" düğmesi — kayıt kimliği elde. */
    Wish.removeItem = async function (wishlistItemId, productId) {
        try {
            await App.api.wishlist.remove(wishlistItemId);

            var ids = Wish.getIds().filter(function (id) { return id !== String(productId); });
            writeMirror(ids);

            App.toast.success(App.t('wishlist.removed', 'Favorilerden çıkarıldı'));
            return true;
        } catch (e) {
            App.toast.error(App.t('wishlist.removeError', 'Çıkarılamadı'));
            return false;
        }
    };

    /** Yerel aynayı sıfırla (çıkışta). */
    Wish.clearMirror = function () {
        var k = key();
        if (k) App.store.remove(k);
        Wish.ids = [];
    };

    App.wishlist = Wish;

})(window.App);
