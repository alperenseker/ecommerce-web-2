/* ============================================================
   i18n/i18n.js — ÇEVİRİ MOTORU
   ------------------------------------------------------------
   Sözlükler JSON DEĞİL, JS dosyasıdır (i18n/tr.js, ru.js, ...) ve
   kendilerini `App.i18n.register('tr', {...})` ile kaydeder.

   Neden JSON değil?
     • fetch gerekmez → dosya sayfa ile birlikte gelir, ilk boyamada
       "çevrilmemiş metin" titremesi olmaz,
     • file:// ile açıldığında da çalışır (JSON fetch'i CORS'a takılır),
     • eksik anahtar sözdizimi hatasıyla anında görünür.

   Metinler HTML'de `data-i18n` ile işaretlenir:
       <span data-i18n="cart.title">Sepet</span>
       <input data-i18n-attr="placeholder:search.hint">
   ============================================================ */

(function (App) {
    'use strict';

    var dicts = {};        // { tr: {...}, ru: {...} }
    var current = null;

    var I18N = {

        /** Sözlük dosyaları kendini bununla kaydeder. */
        register: function (lang, dict) {
            dicts[lang] = dict;
        },

        get lang() { return current; },

        available: function () {
            return App.config.LANGS.filter(function (l) { return !!dicts[l.code]; });
        },

        /**
         * Başlangıç dili: kullanıcının kaydettiği → tarayıcı dili →
         * varsayılan. Kayıtlı dilin sözlüğü yüklenmemişse varsayılana
         * düşülür (yoksa site boş metinlerle açılır).
         */
        init: function () {
            var saved = App.store.get(App.keys.LANG);
            var browser = (navigator.language || '').slice(0, 2).toLowerCase();
            if (browser === 'kk') browser = 'kz';

            var pick = [saved, browser, App.config.DEFAULT_LANG]
                .find(function (code) { return code && dicts[code]; });

            current = pick || Object.keys(dicts)[0] || App.config.DEFAULT_LANG;
            document.documentElement.setAttribute('lang', current);
            I18N.apply();
        },

        /**
         * Anahtardan metin. Nokta yazımı desteklenir: "cart.messages.empty".
         * Bulunamazsa `fallback`, o da yoksa anahtarın kendisi döner —
         * ekranda boşluk yerine ne eksik olduğu görünür.
         */
        t: function (key, fallback) {
            var dict = dicts[current];
            if (!dict) return fallback !== undefined ? fallback : key;

            var value = dict;
            var parts = String(key).split('.');

            for (var i = 0; i < parts.length; i++) {
                value = value ? value[parts[i]] : undefined;
                if (value === undefined) break;
            }

            if (typeof value === 'string') return value;
            return fallback !== undefined ? fallback : key;
        },

        /**
         * Dili değiştir. Sayfa YENİDEN YÜKLENMEZ; işaretli metinler
         * yerinde çevrilir ve 'lang:changed' yayınlanır. JS ile üretilen
         * içerik (ürün kartı, sepet satırı) bu olayı dinleyip kendini
         * yeniden çizer.
         */
        set: function (lang) {
            if (!dicts[lang] || lang === current) return;

            current = lang;
            App.store.set(App.keys.LANG, lang);
            document.documentElement.setAttribute('lang', lang);

            I18N.apply();
            App.bus.emit(App.bus.EVENTS.LANG_CHANGED, { lang: lang });
        },

        /** Sayfadaki tüm `data-i18n` işaretli düğümleri çevir. */
        apply: function (root) {
            var scope = root || document;

            App.utils.$$('[data-i18n]', scope).forEach(function (node) {
                var text = I18N.t(node.getAttribute('data-i18n'), null);
                if (text === null) return;

                /* İçinde etiket varsa innerHTML, yoksa textContent:
                   metni her zaman innerHTML ile yazmak XSS riskidir. */
                if (text.indexOf('<') !== -1) node.innerHTML = text;
                else node.textContent = text;
            });

            /* Öznitelik çevirisi: data-i18n-attr="placeholder:search.hint"
               Birden çok öznitelik virgülle ayrılır. */
            App.utils.$$('[data-i18n-attr]', scope).forEach(function (node) {
                node.getAttribute('data-i18n-attr').split(',').forEach(function (pair) {
                    var bits = pair.split(':');
                    if (bits.length !== 2) return;
                    var text = I18N.t(bits[1].trim(), null);
                    if (text !== null) node.setAttribute(bits[0].trim(), text);
                });
            });

            /* Sayfa başlığı da çevrilebilir. */
            var titleKey = document.body.getAttribute('data-title-i18n');
            if (titleKey) {
                var t = I18N.t(titleKey, null);
                if (t) document.title = t + ' — ' + App.config.BRAND.name + App.config.BRAND.suffix;
            }
        }
    };

    App.i18n = I18N;

    /**
     * Kısayol — uygulamanın her yerinde bu kullanılır.
     * `App.t('cart.title', 'Sepet')`
     */
    App.t = function (key, fallback) { return I18N.t(key, fallback); };

})(window.App);
