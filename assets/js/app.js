/* ============================================================
   app.js — AÇILIŞ (BOOTSTRAP)
   ------------------------------------------------------------
   Her sayfada EN SON yüklenen betik. Sırası bozulursa hiçbir şey
   çalışmaz, o yüzden akış burada tek yerde durur:

     1) dil sözlüğünü uygula
     2) header + footer bas
     3) katalogu yükle (önbellekten anında, ağdan arkadan)
     4) oturum varsa sepet / favori / karşılaştırma durumunu çek
     5) sayfaya özel başlatıcıyı çağır

   Sayfa betikleri kendini `App.definePage('<ad>', fn)` ile kaydeder
   (kayıt defteri core/config.js içindedir, çünkü sayfa betikleri bu
   dosyadan ÖNCE yüklenir) ve HTML'deki <body data-page="<ad>"> ile
   eşleşir. Yeni sayfa eklemek için app.js'e DOKUNULMAZ.
   ============================================================ */

(function (App) {
    'use strict';

    /**
     * Kullanıcıya bağlı durumlar. Girişsiz kullanıcıda ağ isteği
     * atılmaz — misafirin sepeti/favorisi sunucuda yoktur.
     */
    async function loadUserState() {
        if (!App.auth.isLoggedIn()) {
            App.layout.refreshBadges();
            return;
        }

        /* Üçü birbirinden bağımsız; paralel gider. Biri patlarsa
           ötekiler yine de yüklenmeli, bu yüzden allSettled. */
        await Promise.allSettled([
            App.cart.load(),
            App.wishlist.syncFromServer(),
            App.compare.load()
        ]);

        App.layout.refreshBadges();
        App.card.refreshStates();
    }

    async function boot() {
        /* --- 1. dil --- */
        App.i18n.init();

        /* --- 2. iskelet --- */
        App.layout.mount();
        App.support.mount();

        /* --- 3. sayfa başlatıcısı ---
           Katalog beklenmeden çağrılır: sayfa kendi iskeletini
           (skeleton) hemen çizsin, veri gelince doldursun. */
        var pageName = App.utils.page();
        var init = App.pages[pageName];

        /* --- 4. katalog --- */
        var catalogPromise = App.catalog.load().then(function (data) {
            App.layout.setCategories(data.categories);
            return data;
        }).catch(function (e) {
            console.error('Katalog yüklenemedi:', e);
            return { products: [], categories: [] };
        });

        /* --- 5. kullanıcı durumu --- */
        var userPromise = catalogPromise.then(loadUserState);

        if (typeof init === 'function') {
            try {
                await init({ catalog: catalogPromise, user: userPromise });
            } catch (e) {
                console.error('Sayfa başlatma hatası [' + pageName + ']:', e);
            }
        }

        /* Uzun süre açık kalan sekmede katalog tazelensin. */
        App.catalog.startAutoSync();

        /* Katalog arkadan güncellendiğinde açık ekran haberdar olsun. */
        App.bus.on(App.bus.EVENTS.CATALOG_SYNCED, function (data) {
            App.layout.setCategories(data.categories);
        });
    }

    App.utils.ready(boot);

})(window.App);


/* ============================================================
   GERİYE DÖNÜK KISAYOLLAR
   ------------------------------------------------------------
   Eski projedeki (ve konsolda elle denemek isteyenler için)
   tanıdık isimler global kapsamda da bulunur. Yeni kod DAİMA
   App.* kullanmalı; bunlar yalnız köprüdür.
   ============================================================ */
(function (App) {
    'use strict';

    window.addToCart        = function (id, qty) { return App.cart.add(id, qty); };
    window.removeFromCart   = function (itemId)  { return App.cart.remove(itemId); };
    window.updateQuantity   = function (itemId, qty) { return App.cart.updateQuantity(itemId, qty); };
    window.clearCart        = function ()        { return App.cart.clear(); };

    window.toggleWishlist   = function (e, id)   { if (e && e.preventDefault) e.preventDefault(); return App.wishlist.toggle(id); };
    window.toggleCompare    = function (e, id)   { if (e && e.preventDefault) e.preventDefault(); return App.compare.toggle(id); };

    window.getCurrentUser   = function ()        { return App.auth.user(); };
    window.isAuthenticated  = function ()        { return App.auth.isLoggedIn(); };
    window.logoutUser       = function ()        { return App.auth.logout(); };

    window.formatPrice      = function (v)       { return App.fmt.price(v); };
    window.preserveSpaces   = function (v)       { return App.fmt.preserveSpaces(v); };
    window.isPriceHidden    = function (p)       { return App.model.isPriceHidden(p); };
    window.showNotification = function (msg, type) { return App.toast.show(msg, type); };
    window.t                = function (k, f)    { return App.t(k, f); };

})(window.App);
