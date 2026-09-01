/* ============================================================
   pages/product-gallery.js — ÜRÜN GÖRSEL GALERİSİ
   ------------------------------------------------------------
   Küçük resimler + büyük görsel + tam ekran büyütme.
   Ürün sayfasının geri kalanından bağımsızdır; başka bir yerde
   (ör. hızlı bakış penceresi) aynı bileşen kullanılabilir.
   ============================================================ */

(function (App) {
    'use strict';

    var Gallery = {};

    /**
     * @param {string[]} images görsel adresleri (boş olabilir)
     * @param {string}   alt    erişilebilirlik metni
     * @returns {string} HTML
     */
    Gallery.html = function (images, alt) {
        var list = (images && images.length) ? images : [App.config.FALLBACK_IMAGE];
        var safeAlt = App.utils.escape(alt || '');

        var thumbs = list.length > 1
            ? '<div class="gallery__thumbs">' + list.map(function (src, i) {
                  return '<button class="gallery__thumb' + (i === 0 ? ' is-active' : '') + '" type="button" ' +
                         'data-act="gallery-pick" data-src="' + App.utils.escape(src) + '" ' +
                         'aria-label="' + (i + 1) + '">' +
                             '<img src="' + App.utils.escape(src) + '" alt="" loading="lazy" ' +
                                  'onerror="this.src=\'' + App.config.FALLBACK_IMAGE + '\'">' +
                         '</button>';
              }).join('') + '</div>'
            : '<div></div>';   /* ızgara iki sütunlu; boş sütun yerini korur */

        return '<div class="gallery">' +
                   thumbs +
                   '<div class="gallery__main">' +
                       '<img id="gallery-main-img" src="' + App.utils.escape(list[0]) + '" ' +
                            'alt="' + safeAlt + '" ' +
                            'onerror="this.src=\'' + App.config.FALLBACK_IMAGE + '\'">' +
                       '<button class="gallery__zoom" type="button" data-act="gallery-zoom" ' +
                               'aria-label="' + App.t('product.share', 'Büyüt') + '">' +
                           App.icon('zoom', 16) +
                       '</button>' +
                   '</div>' +
               '</div>';
    };

    /** Olayları bağla — ürün HTML'i basıldıktan SONRA çağrılır. */
    Gallery.bind = function () {

        App.actions.register('gallery-pick', function (btn) {
            var img = document.getElementById('gallery-main-img');
            if (img) img.src = btn.dataset.src;

            App.utils.$$('.gallery__thumb').forEach(function (t) {
                t.classList.toggle('is-active', t === btn);
            });
        });

        App.actions.register('gallery-zoom', function () {
            var img = document.getElementById('gallery-main-img');
            if (!img) return;

            App.modal.open({
                wide: true,
                body: '<img src="' + App.utils.escape(img.src) + '" alt="" ' +
                      'style="width:100%;border-radius:var(--r-md)">'
            });
        });
    };

    App.gallery = Gallery;

})(window.App);
