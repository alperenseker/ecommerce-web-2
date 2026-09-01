/* ============================================================
   ui/modal.js — PENCERE + ONAY KUTUSU
   ------------------------------------------------------------
   confirm() ve prompt() kullanılmaz; tarayıcının kutusu tasarımın
   dışında kalır ve mobilde kötü görünür. Burada aynı işi yapan
   söz (Promise) tabanlı bir sürüm var:

       var ok = await App.modal.confirm({ title: 'Silinsin mi?' });
       if (ok) ...

   Erişilebilirlik: açılınca odak pencereye taşınır, ESC kapatır,
   kapanınca odak açan düğmeye geri döner.
   ============================================================ */

(function (App) {
    'use strict';

    var openCount = 0;      // üst üste açılan pencereler için sayaç
    var lastFocus = null;

    function lockScroll(lock) {
        document.body.style.overflow = lock ? 'hidden' : '';
    }

    /**
     * Genel pencere.
     * @param {Object} opts { title, body, footer, wide, onOpen, closable }
     * @returns {{ el, close }}
     */
    function open(opts) {
        opts = opts || {};
        lastFocus = document.activeElement;

        var overlay = App.utils.el('div', { class: 'modal is-open', role: 'dialog', 'aria-modal': 'true' });
        overlay.innerHTML =
            '<div class="modal__backdrop"></div>' +
            '<div class="modal__box' + (opts.wide ? ' modal__box--wide' : '') + '">' +
                (opts.title
                    ? '<div class="modal__head">' +
                          '<h3 class="modal__title">' + opts.title + '</h3>' +
                          (opts.closable === false ? '' :
                            '<button class="modal__close" type="button" aria-label="Kapat">' + App.icon('close', 16) + '</button>') +
                      '</div>'
                    : '') +
                '<div class="modal__body">' + (opts.body || '') + '</div>' +
                (opts.footer ? '<div class="modal__foot">' + opts.footer + '</div>' : '') +
            '</div>';

        document.body.appendChild(overlay);
        openCount++;
        lockScroll(true);

        function close() {
            if (!overlay.parentNode) return;
            overlay.parentNode.removeChild(overlay);
            openCount = Math.max(0, openCount - 1);
            if (!openCount) lockScroll(false);
            document.removeEventListener('keydown', onKey);
            if (lastFocus && lastFocus.focus) lastFocus.focus();
        }

        function onKey(e) {
            if (e.key === 'Escape' && opts.closable !== false) close();
        }

        var closeBtn = overlay.querySelector('.modal__close');
        if (closeBtn) closeBtn.addEventListener('click', close);

        if (opts.closable !== false) {
            overlay.querySelector('.modal__backdrop').addEventListener('click', close);
            document.addEventListener('keydown', onKey);
        }

        /* Odağı pencereye taşı — klavye kullanıcısı arkadaki sayfada
           kaybolmasın. */
        var focusable = overlay.querySelector('input, select, textarea, button:not(.modal__close)');
        (focusable || overlay.querySelector('.modal__box')).focus?.();

        if (typeof opts.onOpen === 'function') opts.onOpen(overlay, close);

        return { el: overlay, close: close };
    }

    /**
     * Onay kutusu. Kullanıcı onaylarsa true, iptal/ESC ise false.
     * @param {Object} opts { title, text, okText, cancelText, danger }
     */
    function confirm(opts) {
        opts = opts || {};

        return new Promise(function (resolve) {
            var okClass = opts.danger ? 'btn btn--danger' : 'btn btn--primary';

            var modal = open({
                title: opts.title || App.t('common.confirm', 'Emin misiniz?'),
                body:  '<p class="t-mut">' + (opts.text || '') + '</p>',
                footer:
                    '<button class="btn btn--ghost" data-modal-cancel>' +
                        (opts.cancelText || App.t('common.cancel', 'Vazgeç')) +
                    '</button>' +
                    '<button class="' + okClass + '" data-modal-ok>' +
                        (opts.okText || App.t('common.confirmOk', 'Evet, devam et')) +
                    '</button>',
                onOpen: function (el, close) {
                    el.querySelector('[data-modal-ok]').addEventListener('click', function () {
                        close(); resolve(true);
                    });
                    el.querySelector('[data-modal-cancel]').addEventListener('click', function () {
                        close(); resolve(false);
                    });
                    /* Arka plan / ESC ile kapanırsa da söz çözülmeli,
                       yoksa çağıran taraf sonsuza kadar bekler. */
                    el.querySelector('.modal__backdrop').addEventListener('click', function () { resolve(false); });
                    el.querySelector('.modal__close')?.addEventListener('click', function () { resolve(false); });
                }
            });

            document.addEventListener('keydown', function esc(e) {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', esc);
                    resolve(false);
                }
            });

            void modal;
        });
    }

    App.modal = { open: open, confirm: confirm };

})(window.App);
