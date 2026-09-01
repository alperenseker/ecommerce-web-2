/* ============================================================
   ui/toast.js — BİLDİRİM BALONLARI
   ------------------------------------------------------------
   alert() kullanılmaz: sayfayı kilitler ve tasarımın dışındadır.
   Bunun yerine sağ altta yığılan, kendiliğinden kapanan balonlar.

   Mesaj İÇİNDE BAĞLANTI olabilir ("giriş yapın" gibi), bu yüzden
   innerHTML kullanılır. Metin dışarıdan (sunucu hatası, ürün adı)
   geliyorsa çağıran taraf App.utils.escape() ile kaçırmalıdır.
   ============================================================ */

(function (App) {
    'use strict';

    var container = null;
    var DEFAULT_MS = 3800;

    function root() {
        if (!container) {
            container = App.utils.el('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' });
            document.body.appendChild(container);
        }
        return container;
    }

    var ICONS = {
        success: 'check',
        error:   'close',
        warning: 'warning',
        info:    'info'
    };

    /**
     * @param {string} message HTML kabul eder
     * @param {string} [type]  success | error | warning | info
     * @param {number} [ms]    süre; 0 verilirse elle kapatılana dek kalır
     */
    function show(message, type, ms) {
        type = type || 'info';
        var duration = ms === undefined ? DEFAULT_MS : ms;

        var box = App.utils.el('div', { class: 'toast toast--' + type });
        box.innerHTML =
            '<span class="toast__icon">' + App.icon(ICONS[type] || 'info', 12) + '</span>' +
            '<div class="toast__body">' + message + '</div>' +
            '<button class="toast__close" type="button" aria-label="Kapat">' + App.icon('close', 14) + '</button>';

        var close = function () {
            box.classList.remove('is-open');
            /* Kapanma animasyonu bitmeden DOM'dan silinirse balon
               birden yok olur; geçiş süresi kadar beklenir. */
            setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 400);
        };

        box.querySelector('.toast__close').addEventListener('click', close);
        root().appendChild(box);

        /* Bir kare beklemeden sınıf eklenirse tarayıcı geçişi
           atlar ve balon animasyonsuz belirir. */
        requestAnimationFrame(function () {
            requestAnimationFrame(function () { box.classList.add('is-open'); });
        });

        if (duration > 0) {
            var timer = setTimeout(close, duration);
            /* Fare üstündeyken kapanmasın — kullanıcı okuyor olabilir. */
            box.addEventListener('mouseenter', function () { clearTimeout(timer); });
            box.addEventListener('mouseleave', function () { timer = setTimeout(close, 1200); });
        }

        return close;
    }

    App.toast = {
        show:    show,
        success: function (m, ms) { return show(m, 'success', ms); },
        error:   function (m, ms) { return show(m, 'error', ms); },
        warning: function (m, ms) { return show(m, 'warning', ms); },
        info:    function (m, ms) { return show(m, 'info', ms); },

        /** Tüm balonları kapat (sayfa değişiminde). */
        clear: function () {
            if (container) container.innerHTML = '';
        }
    };

})(window.App);
