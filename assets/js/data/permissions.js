/* ============================================================
   data/permissions.js — STOKSUZ SİPARİŞ YETKİSİ (ŞİRKET BAŞINA)
   ------------------------------------------------------------
   Sunucu sepet ve siparişte her kalemi KENDİ ŞİRKETİNDEKİ yetkiyle
   kontrol ediyor (user_company_settings). UserSettings'teki
   `CanOrderWithoutStock` ise "herhangi bir şirkette açık" anlamına
   gelen İYİMSER birleşik bayrak — tek başına karar vermek için
   yanlış: A şirketinde açık yetki B'nin ürününde bir şey ifade
   etmez. Gerçek kırılım `CompanySettings` listesinde gelir.

   Karar veren her kod (stok etiketi, sepete ekleme düğmesi, adet
   üst sınırı) bu modülü kullanır. Kurallar web-1'deki
   `saveStockPermissions` / `canOrderWithoutStockFor` /
   `isPriceBlocked` ile birebir aynıdır (localStorage anahtarı da).
   ============================================================ */

(function (App) {
    'use strict';

    var P = {};

    /** Alanı PascalCase ya da camelCase adıyla okur. */
    function field(obj, name) {
        if (!obj) return undefined;
        if (obj[name] !== undefined) return obj[name];
        return obj[name.charAt(0).toLowerCase() + name.slice(1)];
    }

    /**
     * Kullanıcı ayarlarındaki yetkiyi yerele yazar: birleşik bayrak
     * (eski kod ve şirket haritası olmayan eski API için) ve şirket
     * haritası (şirket kodu ve kimliği küçük harfle → yetki).
     * @returns {boolean} yetki önceki kayıttan farklıysa true
     */
    P.save = function (settings) {
        var snapshot = function () {
            return App.store.get(App.keys.CAN_ORDER_NO_STOCK) + '|' + App.store.get(App.keys.COMPANY_STOCK);
        };
        var before = snapshot();

        var combined = !!settings && field(settings, 'CanOrderWithoutStock') === true;
        App.store.set(App.keys.CAN_ORDER_NO_STOCK, String(combined));

        var rows = settings && field(settings, 'CompanySettings');
        if (Array.isArray(rows)) {
            var map = {};
            rows.forEach(function (row) {
                var allowed = field(row, 'CanOrderWithoutStock') === true;
                [field(row, 'ErpSourceCode'), field(row, 'ErpSourceId')].forEach(function (key) {
                    if (key) map[String(key).trim().toLowerCase()] = allowed;
                });
            });
            App.store.setJson(App.keys.COMPANY_STOCK, map);
        } else {
            /* Eski API: şirket kırılımı yok, karar birleşik bayrağa düşer. */
            App.store.remove(App.keys.COMPANY_STOCK);
        }

        return snapshot() !== before;
    };

    /** Misafir / hata: hiçbir şirkette yetki yok. */
    P.clear = function () {
        App.store.set(App.keys.CAN_ORDER_NO_STOCK, 'false');
        App.store.remove(App.keys.COMPANY_STOCK);
    };

    /**
     * Kullanıcı bu şirketin ürününü stoksuz (ve fiyatı yoksa 0 tutarla)
     * sipariş edebilir mi. Ürün nesnesi ya da şirket kodu alır.
     * Sunucuyla aynı kural: şirketi bilinmeyen üründe yetki YOK.
     * Şirket haritası hiç kaydedilmemişse (eski oturum) birleşik
     * bayrağa düşülür.
     * Sepet kaleminde şirket alanı kalemin kendisinde değil anlık
     * görüntüdedir — çağıran App.model.cartItemErp(item) verir.
     */
    P.canOrderWithoutStockFor = function (productOrSource) {
        var map = App.store.getJson(App.keys.COMPANY_STOCK, null);
        if (!map || typeof map !== 'object') return App.store.getBool(App.keys.CAN_ORDER_NO_STOCK);

        var source = typeof productOrSource === 'string'
            ? productOrSource
            : field(productOrSource, 'ErpSource');
        var key = String(source || '').trim().toLowerCase();
        return !!key && map[key] === true;
    };

    /**
     * Fiyatı olmayan ürün, o şirkette stoksuz sipariş yetkisi olmayan
     * kullanıcıya satılmaz (sunucu reddeder; ekranda "Цена по запросу").
     * Fiyat BİLEREK gizliyse (misafir + "misafire fiyat gösterme")
     * karar girişten sonra verilir — burada engel sayılmaz.
     * Varyant nesnesinde şirket alanı yok; şirket [erpSource] ile verilir.
     */
    P.isPriceBlocked = function (product, erpSource) {
        if (!product) return false;
        if (field(product, 'PriceHidden') === true) return false;
        if (field(product, 'HasPrice') !== false) return false;
        return !P.canOrderWithoutStockFor(erpSource || product);
    };

    /**
     * Yetkiyi sunucudan yeniden okur. Admin panelinden yapılan
     * değişiklik bir sonraki girişi beklemeden görünsün diye her
     * sayfada çağrılır (app.js). Ağ hatasında mevcut kopyaya
     * dokunulmaz.
     * @returns {Promise<boolean>} yetki değiştiyse true
     */
    P.refresh = async function () {
        var userId = App.auth.userId();
        if (!userId || !App.auth.isLoggedIn()) return false;

        try {
            var res = await App.api.user.getSettings(userId);
            if (res && res.success && res.data) return P.save(res.data);
        } catch (e) { /* eldeki kopyayla devam */ }

        return false;
    };

    App.perm = P;

})(window.App);
