/* ============================================================
   core/utils.js — GENEL YARDIMCILAR
   DOM seçimi, olay bağlama, güvenli metin, URL, zamanlama.
   Hiçbir iş kuralı içermez; her projeye olduğu gibi taşınabilir.
   ============================================================ */

(function (App) {
    'use strict';

    var U = {};

    /* ---------- DOM SEÇİMİ ---------- */

    /** Tek eleman seç. `$('.foo')` veya `$('.foo', kapsayici)` */
    U.$ = function (sel, root) {
        return (root || document).querySelector(sel);
    };

    /** Çok eleman seç — GERÇEK dizi döner, forEach/map/filter çalışır. */
    U.$$ = function (sel, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(sel));
    };

    /**
     * Eleman üret.
     * @example U.el('div', { class: 'card', html: '<b>x</b>' }, [child])
     */
    U.el = function (tag, attrs, children) {
        var node = document.createElement(tag);
        attrs = attrs || {};

        Object.keys(attrs).forEach(function (key) {
            var val = attrs[key];
            if (val === null || val === undefined || val === false) return;

            if (key === 'class')      node.className = val;
            else if (key === 'html')  node.innerHTML = val;
            else if (key === 'text')  node.textContent = val;
            else if (key === 'style' && typeof val === 'object') Object.assign(node.style, val);
            else if (key.indexOf('on') === 0 && typeof val === 'function') {
                node.addEventListener(key.slice(2).toLowerCase(), val);
            }
            else if (key === 'dataset' && typeof val === 'object') Object.assign(node.dataset, val);
            else node.setAttribute(key, val);
        });

        (children || []).forEach(function (child) {
            if (child) node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
        });

        return node;
    };

    /**
     * Olay devri (event delegation).
     * Kart/satır gibi sonradan basılan içeriğe tek tek dinleyici
     * bağlamak yerine kapsayıcıya BİR kez bağlanır.
     * @example U.on(document, 'click', '[data-act="cart"]', handler)
     */
    U.on = function (root, type, selector, handler, options) {
        (root || document).addEventListener(type, function (e) {
            var match = e.target.closest(selector);
            if (match && (root || document).contains(match)) handler.call(match, e, match);
        }, options);
    };

    /* ---------- GÜVENLİK ---------- */

    /**
     * HTML'e basılacak metni kaçır.
     * Ürün adları 1C'den geliyor; ham basmak XSS kapısıdır.
     */
    U.escape = function (text) {
        return String(text === null || text === undefined ? '' : text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };

    /** JSON metnini güvenle çözer; bozuksa null döner (asla patlamaz). */
    U.parseJson = function (raw) {
        if (!raw) return null;
        if (typeof raw === 'object') return raw;
        try { return JSON.parse(raw); } catch (e) { return null; }
    };

    /* ---------- ZAMANLAMA ---------- */

    /** Son çağrıdan `wait` ms sonra çalıştır (arama kutusu için). */
    U.debounce = function (fn, wait) {
        var timer = null;
        return function () {
            var ctx = this, args = arguments;
            clearTimeout(timer);
            timer = setTimeout(function () { fn.apply(ctx, args); }, wait || 250);
        };
    };

    /** En çok `wait` ms'de bir çalıştır (scroll/resize için). */
    U.throttle = function (fn, wait) {
        var last = 0, timer = null;
        return function () {
            var ctx = this, args = arguments, now = Date.now();
            var remain = wait - (now - last);
            if (remain <= 0) {
                clearTimeout(timer); timer = null; last = now;
                fn.apply(ctx, args);
            } else if (!timer) {
                timer = setTimeout(function () {
                    last = Date.now(); timer = null;
                    fn.apply(ctx, args);
                }, remain);
            }
        };
    };

    U.sleep = function (ms) {
        return new Promise(function (resolve) { setTimeout(resolve, ms); });
    };

    /* ---------- URL ---------- */

    /** Adres çubuğundaki tek parametre. */
    U.param = function (name) {
        return new URLSearchParams(window.location.search).get(name);
    };

    /** Tüm parametreler düz nesne olarak. */
    U.params = function () {
        var out = {};
        new URLSearchParams(window.location.search).forEach(function (v, k) { out[k] = v; });
        return out;
    };

    /** Sayfayı yenilemeden adres çubuğunu güncelle. */
    U.setParams = function (patch, replace) {
        var url = new URL(window.location.href);
        Object.keys(patch).forEach(function (key) {
            var val = patch[key];
            if (val === null || val === undefined || val === '') url.searchParams.delete(key);
            else url.searchParams.set(key, val);
        });
        window.history[replace ? 'replaceState' : 'pushState']({}, '', url);
    };

    /** Nesneden sorgu dizesi (boş değerler atılır). */
    U.query = function (obj) {
        var sp = new URLSearchParams();
        Object.keys(obj || {}).forEach(function (key) {
            var val = obj[key];
            if (val !== null && val !== undefined && val !== '') sp.append(key, val);
        });
        return sp.toString();
    };

    /* ---------- ÇEŞİTLİ ---------- */

    /** Aynı listeyi bozmadan sırala (Array.sort yerinde sıralar). */
    U.sortBy = function (list, compare) {
        return list.slice().sort(compare);
    };

    /** Diziyi n'lik parçalara böl. */
    U.chunk = function (list, size) {
        var out = [];
        for (var i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
        return out;
    };

    /** Sayıyı alt/üst sınır arasına sıkıştır. */
    U.clamp = function (num, min, max) {
        return Math.min(Math.max(num, min), max);
    };

    /** Ada göre baş harf (avatar için): "Ali Veli" → "AV" */
    U.initials = function (name) {
        return String(name || '?')
            .trim().split(/\s+/).slice(0, 2)
            .map(function (w) { return w.charAt(0).toUpperCase(); })
            .join('') || '?';
    };

    /** Sayfa hangi sayfa? <body data-page="shop"> okur. */
    U.page = function () {
        return document.body.getAttribute('data-page') || '';
    };

    /** DOM hazır olduğunda çalıştır (script defer ile zaten hazır olabilir). */
    U.ready = function (fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn, { once: true });
        } else {
            fn();
        }
    };

    /** Sayfa üstüne yumuşak kaydır. */
    U.scrollTop = function (offset) {
        window.scrollTo({ top: offset || 0, behavior: 'smooth' });
    };

    App.utils = U;

    /* En sık kullanılan üçü kısayol olarak App üstünde de durur. */
    App.$  = U.$;
    App.$$ = U.$$;
    App.el = U.el;

})(window.App);
