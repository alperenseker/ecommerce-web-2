/* ============================================================
   core/storage.js — TARAYICI DEPOLAMA SARMALAYICISI
   ------------------------------------------------------------
   localStorage doğrudan kullanılmaz. Sebep:
     • gizli sekmede / kota dolduğunda setItem HATA FIRLATIR ve
       sayfayı komple durdurur — burada try/catch ile yutulur,
     • JSON çözme her yerde tekrar tekrar yazılır,
     • çıkışta "neyi silip neyi koruyacağız" kararı tek yerde durur.
   ============================================================ */

(function (App) {
    'use strict';

    var S = {};

    /* ---------- localStorage ---------- */

    S.get = function (key, fallback) {
        try {
            var raw = localStorage.getItem(key);
            return raw === null ? (fallback !== undefined ? fallback : null) : raw;
        } catch (e) {
            return fallback !== undefined ? fallback : null;
        }
    };

    S.set = function (key, value) {
        try { localStorage.setItem(key, value); return true; }
        catch (e) { console.warn('storage.set başarısız:', key, e && e.message); return false; }
    };

    S.remove = function (key) {
        try { localStorage.removeItem(key); } catch (e) {}
    };

    /** JSON olarak oku — bozuk veri hiçbir zaman sayfayı kırmaz. */
    S.getJson = function (key, fallback) {
        var parsed = App.utils.parseJson(S.get(key));
        return parsed === null ? (fallback !== undefined ? fallback : null) : parsed;
    };

    S.setJson = function (key, value) {
        try { return S.set(key, JSON.stringify(value)); }
        catch (e) { return false; }
    };

    /** 'true' / 'false' metinlerini gerçek boolean'a çevirir. */
    S.getBool = function (key) {
        return S.get(key) === 'true';
    };

    /* ---------- sessionStorage (sekme ömürlü önbellek) ---------- */

    S.session = {
        get: function (key) {
            try { return sessionStorage.getItem(key); } catch (e) { return null; }
        },
        set: function (key, value) {
            try { sessionStorage.setItem(key, value); return true; } catch (e) { return false; }
        },
        remove: function (key) {
            try { sessionStorage.removeItem(key); } catch (e) {}
        },

        /**
         * Zaman damgalı önbellek okuma. TTL dolduysa kayıt silinir ve
         * null döner — çağıran taraf "yoksa API'den çek" der.
         */
        getCache: function (key, ttl) {
            var parsed = App.utils.parseJson(S.session.get(key));
            if (!parsed || !parsed.timestamp) return null;

            if (Date.now() - parsed.timestamp > (ttl || App.config.CACHE_TTL)) {
                S.session.remove(key);
                return null;
            }
            return parsed.data;
        },

        setCache: function (key, data) {
            return S.session.set(key, JSON.stringify({ data: data, timestamp: Date.now() }));
        }
    };

    /* ---------- OTURUM TEMİZLİĞİ ---------- */

    /**
     * Çıkışta / girişte depolamayı sıfırlar ama KULLANICIDAN BAĞIMSIZ
     * tercihleri korur. Dil ayarı silinirse kullanıcı her çıkışta
     * siteyi başka dilde bulur — bu yüzden beyaz liste var.
     */
    S.clearUserData = function () {
        var keep = {};
        [App.keys.LANG].forEach(function (key) {
            var val = S.get(key);
            if (val !== null) keep[key] = val;
        });

        try { localStorage.clear(); } catch (e) {}

        /* Katalog önbelleği kullanıcıya özel FİYAT taşır; oturum
           değişince mutlaka atılmalı, yoksa yeni kullanıcı eskinin
           fiyat kategorisini görür. */
        S.session.remove(App.keys.CACHE_PRODUCTS);
        S.session.remove(App.keys.CACHE_CATEGORIES);

        Object.keys(keep).forEach(function (key) { S.set(key, keep[key]); });
    };

    App.store = S;

})(window.App);
