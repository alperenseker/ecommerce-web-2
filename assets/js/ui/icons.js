/* ============================================================
   ui/icons.js — SATIR İÇİ SVG İKONLAR
   ------------------------------------------------------------
   Dış ikon fontu / CDN YOKTUR. Sebep: site çevrimdışıyken, CDN
   engelliyken ya da yavaş bağlantıda ikonlar kare kutu olarak
   görünmesin. Hepsi 24×24 ızgarada, `currentColor` ile çizilir —
   rengi kapsayıcıdan devralır.

   Kullanım:
       App.icon('cart')             → 1em, metin rengiyle
       App.icon('cart', 20)         → 20px
       App.icon('heart', null, true)→ dolu (fill) çizim

   Yeni ikon: aşağıdaki listeye 24×24 viewBox'lı path ekle, hepsi bu.
   ============================================================ */

(function (App) {
    'use strict';

    /* Yalnız `d` (path) tutulur; sarmalayıcı <svg> tek yerde üretilir. */
    var PATHS = {
        /* --- gezinme --- */
        search:    'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.35-4.35',
        cart:      'M3 4h2l2.4 11.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
        heart:     'M20.8 5.6a5.1 5.1 0 0 0-7.2 0L12 7.2l-1.6-1.6a5.1 5.1 0 0 0-7.2 7.2l1.6 1.6L12 22l7.2-7.6 1.6-1.6a5.1 5.1 0 0 0 0-7.2Z',
        compare:   'M3 6h11M3 12h7M3 18h11M17 4l4 4-4 4M21 8h-7',
        user:      'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
        menu:      'M3 6h18M3 12h18M3 18h18',
        close:     'M18 6 6 18M6 6l12 12',
        grid:      'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
        list:      'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
        filter:    'M22 3H2l8 9.5V19l4 2v-8.5L22 3Z',

        /* --- yön --- */
        chevronDown:  'm6 9 6 6 6-6',
        chevronUp:    'm18 15-6-6-6 6',
        chevronLeft:  'm15 18-6-6 6-6',
        chevronRight: 'm9 18 6-6-6-6',
        arrowRight:   'M5 12h14M13 6l6 6-6 6',
        arrowLeft:    'M19 12H5M11 18l-6-6 6-6',
        external:     'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3',

        /* --- eylem --- */
        plus:      'M12 5v14M5 12h14',
        minus:     'M5 12h14',
        trash:     'M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6',
        edit:      'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z',
        check:     'M20 6 9 17l-5-5',
        refresh:   'M21 2v6h-6M3 22v-6h6M21 8a9 9 0 0 0-15-3.4L3 8m0 8a9 9 0 0 0 15 3.4l3-3.4',
        copy:      'M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2ZM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
        logout:    'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
        eye:       'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
        eyeOff:    'M17.9 17.9A10.1 10.1 0 0 1 12 19c-6.4 0-10-7-10-7a18.4 18.4 0 0 1 5.1-5.9m3.6-1.4A10.1 10.1 0 0 1 12 5c6.4 0 10 7 10 7a18.5 18.5 0 0 1-2.2 3.2M1 1l22 22M9.9 9.9a3 3 0 0 0 4.2 4.2',
        zoom:      'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.35-4.35M11 8v6M8 11h6',

        /* --- bilgi --- */
        info:      'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 16v-4M12 8h.01',
        warning:   'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0ZM12 9v4M12 17h.01',
        error:     'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM15 9l-6 6M9 9l6 6',
        success:   'M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14l-3-3',
        star:      'm12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2Z',

        /* --- ticaret --- */
        truck:     'M1 3h15v13H1zM16 8h4l3 3v5h-7M5.5 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm13 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
        shield:    'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z',
        tag:       'M20.6 13.4 12 22l-9-9V3h10l7.6 7.6a2 2 0 0 1 0 2.8ZM7.5 7.5h.01',
        box:       'm21 16-9 5-9-5V8l9-5 9 5v8ZM3.3 7.5 12 12.5l8.7-5M12 22v-9.5',
        credit:    'M2 5h20v14H2zM2 10h20',
        wallet:    'M20 7H5a2 2 0 0 1 0-4h13v4M2 5v14a2 2 0 0 0 2 2h16v-4M18 12a2 2 0 1 0 0 4h4v-4h-4Z',
        gift:      'M20 12v9H4v-9M2 7h20v5H2zM12 21V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7Zm0 0h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7Z',
        headset:   'M3 18v-6a9 9 0 0 1 18 0v6M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3v5ZM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3v5Z',

        /* --- iletişim / hesap --- */
        phone:     'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z',
        mail:      'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM22 7l-10 6L2 7',
        pin:       'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0ZM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
        clock:     'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 6v6l4 2',
        lock:      'M5 11h14v11H5zM8 11V7a4 4 0 0 1 8 0v4',
        home:      'm3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10Z',
        settings:  'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z',
        globe:     'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z',
        building:  'M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01',
        file:      'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6ZM14 2v6h6M16 13H8M16 17H8M10 9H8',
        spinner:   'M21 12a9 9 0 1 1-6.2-8.6',

        /* --- destek / sohbet --- */
        message:   'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z',
        send:      'M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z',
        clip:      'M21.4 11.1 12.3 20a5.5 5.5 0 0 1-7.8-7.8l9.2-9.1a3.7 3.7 0 1 1 5.2 5.2l-9.2 9.1a1.8 1.8 0 0 1-2.6-2.6l8.5-8.4',
        image:     'M3 3h18v18H3zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM21 15l-5-5L5 21',

        /* --- kurumsal sayfalar --- */
        leaf:      'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10ZM2 21c0-3 1.9-5.7 4.5-7.5',
        factory:   'M2 20h20M4 20V9l6 4V9l6 4V6h4v14M8 20v-4h4v4',
        cert:      'M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM8.2 13.8 7 22l5-3 5 3-1.2-8.2',
        chart:     'M3 3v18h18M7 15l4-4 3 3 5-6'
    };

    /* Kalp ve yıldız dolu çizilir; sınır çizgisi yerine gövde rengi. */
    var FILLED = { heart: true, star: true };

    /**
     * @param {string}  name  ikon adı (PATHS anahtarı)
     * @param {number} [size] piksel; verilmezse 1em (metinle orantılı)
     * @param {boolean}[fill] dolu çizim zorla
     * @returns {string} `<i class="ico">…</i>` HTML'i
     */
    App.icon = function (name, size, fill) {
        var d = PATHS[name];
        if (!d) {
            console.warn('Bilinmeyen ikon:', name);
            d = PATHS.info;
        }

        var isFill = fill !== undefined ? fill : !!FILLED[name];
        var cls = 'ico' + (isFill ? ' ico--fill' : '') + (name === 'spinner' ? ' ico--spin' : '');
        var style = size ? ' style="font-size:' + size + 'px"' : '';

        return '<i class="' + cls + '"' + style + ' aria-hidden="true">' +
               '<svg viewBox="0 0 24 24"><path d="' + d + '"/></svg></i>';
    };

    /** İkon adı var mı (ekranlar koşullu ikon basarken kullanır). */
    App.hasIcon = function (name) { return !!PATHS[name]; };

})(window.App);
