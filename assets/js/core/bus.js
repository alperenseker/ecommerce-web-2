/* ============================================================
   core/bus.js — OLAY YOLU (event bus)
   ------------------------------------------------------------
   Modüller birbirini DOĞRUDAN çağırmaz. Örnek: sepete ürün
   eklendiğinde header'daki rozetin güncellenmesi gerekir; ama
   sepet servisi header'ı tanımak zorunda değildir. Sepet servisi
   sadece haber verir:

        App.bus.emit('cart:changed', { count: 3 });

   Header de kendi dosyasında dinler:

        App.bus.on('cart:changed', render);

   Böylece yeni bir ekran (ör. mobil alt bar) eklemek için var olan
   hiçbir dosyaya dokunmak gerekmez.
   ============================================================ */

(function (App) {
    'use strict';

    var listeners = {};

    var Bus = {

        /**
         * Olayı dinle.
         * @returns {Function} dinlemeyi bırakan fonksiyon
         */
        on: function (event, handler) {
            (listeners[event] = listeners[event] || []).push(handler);
            return function () { Bus.off(event, handler); };
        },

        /** Yalnız bir kez dinle. */
        once: function (event, handler) {
            var stop = Bus.on(event, function () {
                stop();
                handler.apply(null, arguments);
            });
            return stop;
        },

        off: function (event, handler) {
            if (!listeners[event]) return;
            listeners[event] = listeners[event].filter(function (fn) { return fn !== handler; });
        },

        /**
         * Olayı yay. Bir dinleyicinin hatası ÖTEKİLERİ DURDURMAZ —
         * tek bir bozuk ekran parçası yüzünden sepet sayacı ölmesin.
         */
        emit: function (event, payload) {
            (listeners[event] || []).forEach(function (fn) {
                try { fn(payload); }
                catch (e) { console.error('bus[' + event + '] dinleyici hatası:', e); }
            });
        }
    };

    /* ------------------------------------------------------------
       KULLANILAN OLAY ADLARI — tek liste hâlinde dursun ki
       "hangi olaylar var?" sorusu grep gerektirmesin.
       ------------------------------------------------------------ */
    Bus.EVENTS = {
        AUTH_CHANGED:     'auth:changed',      // giriş / çıkış
        CART_CHANGED:     'cart:changed',      // { items, count, total }
        WISHLIST_CHANGED: 'wishlist:changed',  // { ids }
        COMPARE_CHANGED:  'compare:changed',   // { ids }
        LANG_CHANGED:     'lang:changed',      // { lang }
        CATALOG_SYNCED:   'catalog:synced'     // { products, categories }
    };

    App.bus = Bus;

})(window.App);
