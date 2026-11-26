/* ============================================================
   data/idb.js — INDEXEDDB ÖNBELLEĞİ
   ------------------------------------------------------------
   Katalog binlerce kalem tutar; sessionStorage'a sığmaz ve sekme
   kapanınca gider. IndexedDB kalıcıdır: ikinci ziyarette site
   ürünleri ANINDA gösterir, ağı arka planda dinler.

   Bu dosya "nasıl saklanır"ı bilir, "ne saklanır"ı bilmez —
   iş kuralları data/catalog.js içindedir.
   ============================================================ */

(function (App) {
    'use strict';

    /* Ad `novatech_cache`ten DEĞİŞTİRİLDİ: o adla saklanan katalog
       bu sitenin API-1'e (Fores kataloğu) bağlı eski sürümünden
       kalmış olabilir. Aynı kökte yayınlanırsa eski kayıt ilk
       boyamada BAŞKA ÖRNEĞİN ürünlerini/fiyatlarını gösterirdi
       (eşitleme süresi dolana kadar). Yeni ad = temiz başlangıç;
       eski veritabanı açılışta bir kez silinir (aşağıda). */
    var DB_NAME  = 'sieger_cache';
    var LEGACY_DB_NAMES = ['novatech_cache'];
    var STORE    = 'cache';

    try {
        if (window.indexedDB) {
            LEGACY_DB_NAMES.forEach(function (name) { indexedDB.deleteDatabase(name); });
        }
    } catch (e) { /* desteklenmiyorsa sorun değil */ }

    /* Sürüm artırıldığında onupgradeneeded eski depoyu SİLİP yeniden
       kurar. Bayat/bozuk bir önbelleği taşımanın anlamı yok: veri
       zaten API'den yeniden doldurulabilir. */
    var DB_VERSION = 1;

    var _db = null;

    /* ------------------------------------------------------------
       BAĞLANTI
       ------------------------------------------------------------ */
    function open() {
        return new Promise(function (resolve, reject) {
            if (_db) return resolve(_db);

            /* Gizli sekmede / eski tarayıcıda IndexedDB olmayabilir. */
            if (!window.indexedDB) return reject(new Error('IndexedDB desteklenmiyor'));

            var req = indexedDB.open(DB_NAME, DB_VERSION);

            req.onupgradeneeded = function (e) {
                var db = e.target.result;
                if (db.objectStoreNames.contains(STORE)) db.deleteObjectStore(STORE);
                db.createObjectStore(STORE, { keyPath: 'key' });
            };

            req.onsuccess = function (e) { _db = e.target.result; resolve(_db); };
            req.onerror   = function (e) { reject(e.target.error); };
        });
    }

    /* ------------------------------------------------------------
       TEMEL İŞLEMLER
       Hiçbiri HATA FIRLATMAZ: önbellek çalışmazsa site yavaşlar,
       ama çökmez. Çağıran taraf null görür ve API'ye gider.
       ------------------------------------------------------------ */

    function set(key, data) {
        return open().then(function (db) {
            return new Promise(function (resolve) {
                var tx = db.transaction(STORE, 'readwrite');
                var req = tx.objectStore(STORE).put({ key: key, data: data, timestamp: Date.now() });
                req.onsuccess = function () { resolve(true); };
                req.onerror   = function () { resolve(false); };
            });
        }).catch(function () { return false; });
    }

    function get(key) {
        return open().then(function (db) {
            return new Promise(function (resolve) {
                var tx = db.transaction(STORE, 'readonly');
                var req = tx.objectStore(STORE).get(key);
                req.onsuccess = function (e) { resolve(e.target.result || null); };
                req.onerror   = function () { resolve(null); };
            });
        }).catch(function () { return null; });
    }

    function remove(key) {
        return open().then(function (db) {
            return new Promise(function (resolve) {
                var tx = db.transaction(STORE, 'readwrite');
                var req = tx.objectStore(STORE).delete(key);
                req.onsuccess = function () { resolve(true); };
                req.onerror   = function () { resolve(false); };
            });
        }).catch(function () { return false; });
    }

    function clear() {
        return open().then(function (db) {
            return new Promise(function (resolve) {
                var tx = db.transaction(STORE, 'readwrite');
                var req = tx.objectStore(STORE).clear();
                req.onsuccess = function () { resolve(true); };
                req.onerror   = function () { resolve(false); };
            });
        }).catch(function () { return false; });
    }

    /* ------------------------------------------------------------
       İSİMLENDİRİLMİŞ KAYITLAR
       ------------------------------------------------------------ */
    var KEY = {
        PRODUCTS:   'products',
        CATEGORIES: 'categories',
        LAST_SYNC:  'last_sync'
    };

    App.idb = {
        KEY: KEY,
        set: set,
        get: get,
        remove: remove,
        clear: clear,

        getProducts: function () {
            return get(KEY.PRODUCTS).then(function (rec) { return rec ? rec.data : null; });
        },
        setProducts: function (list) { return set(KEY.PRODUCTS, list); },

        getCategories: function () {
            return get(KEY.CATEGORIES).then(function (rec) { return rec ? rec.data : null; });
        },
        setCategories: function (list) { return set(KEY.CATEGORIES, list); },

        getLastSync: function () {
            return get(KEY.LAST_SYNC).then(function (rec) { return rec ? rec.data : null; });
        },
        touchSync: function () { return set(KEY.LAST_SYNC, Date.now()); },

        /** Son eşitlemeden bu yana SYNC_INTERVAL geçti mi? */
        isSyncNeeded: function () {
            return App.idb.getLastSync().then(function (last) {
                if (!last) return true;
                return (Date.now() - last) > App.config.SYNC_INTERVAL;
            });
        }
    };

})(window.App);
