/* ============================================================
   ui/actions.js — GENEL EYLEM YÖNLENDİRİCİSİ
   ------------------------------------------------------------
   HTML'de `onclick="addToCart('123')"` YAZILMAZ. Bunun yerine:

       <button data-act="add-to-cart" data-id="123">

   ve tıklamaların tamamı belgeye bağlı TEK dinleyicide toplanır.

   Kazancı:
     • sayfada kaç kart olursa olsun dinleyici sayısı sabit,
     • sonradan basılan içerik ek bağlama gerektirmez,
     • HTML'e JS sızmaz — içerik ile davranış ayrı durur,
     • bir eylemin ne yaptığı tek dosyada aranır.

   Yeni eylem eklemek: aşağıdaki `handlers` nesnesine bir satır.
   ============================================================ */

(function (App) {
    'use strict';

    /* Aynı düğmeye çift tıklamada iki istek gitmesin diye kilit. */
    function lock(btn, promise) {
        if (!btn || btn.dataset.busy === '1') return Promise.resolve(false);

        btn.dataset.busy = '1';
        btn.classList.add('is-loading');

        return Promise.resolve(promise).finally(function () {
            btn.dataset.busy = '0';
            btn.classList.remove('is-loading');
        });
    }

    var handlers = {

        /* ---------- SEPET ---------- */
        'add-to-cart': function (btn) {
            var qtyInput = document.getElementById(btn.dataset.qtyTarget || '');
            var qty = qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1;
            return lock(btn, App.cart.add(btn.dataset.id, qty));
        },

        'cart-remove': async function (btn) {
            var ok = await App.modal.confirm({
                title: App.t('cart.remove', 'Kaldır'),
                text:  App.t('cart.confirmRemove', 'Bu ürünü sepetten kaldırmak istediğinize emin misiniz?'),
                danger: true
            });
            if (ok) await App.cart.remove(btn.dataset.id);
        },

        'cart-clear': async function () {
            var ok = await App.modal.confirm({
                title: App.t('cart.clearCart', 'Sepeti boşalt'),
                text:  App.t('cart.confirmClear', 'Sepetteki tüm ürünler kaldırılacak. Onaylıyor musunuz?'),
                danger: true
            });
            if (ok) await App.cart.clear();
        },

        /* Miktar +/- düğmeleri. Sunucuya gitmeden önce girdi güncellenir
           ki kullanıcı gecikme hissetmesin. */
        'qty-inc': function (btn) { return stepQty(btn, +1); },
        'qty-dec': function (btn) { return stepQty(btn, -1); },

        /* ---------- FAVORİ / KARŞILAŞTIRMA ---------- */
        'wishlist': function (btn) { return lock(btn, App.wishlist.toggle(btn.dataset.id)); },
        'compare':  function (btn) { return lock(btn, App.compare.toggle(btn.dataset.id)); },

        'wishlist-remove': function (btn) {
            return lock(btn, App.wishlist.removeItem(btn.dataset.itemId, btn.dataset.id)
                .then(function (ok) { if (ok) removeRow(btn); }));
        },

        'compare-remove': function (btn) {
            return lock(btn, App.compare.removeItem(btn.dataset.itemId));
        },

        /* ---------- OTURUM ---------- */
        'logout': async function () {
            var ok = await App.modal.confirm({
                title: App.t('header.logout', 'Çıkış yap'),
                text:  App.t('account.confirmLogout', 'Çıkış yapmak istediğinize emin misiniz?')
            });
            if (ok) App.auth.logout();
        },

        /* ---------- ARAYÜZ ---------- */
        'toggle-drawer': function () { App.drawer.toggle(); },
        'close-drawer':  function () { App.drawer.close(); },

        'toggle-search': function () {
            var box = App.utils.$('.search');
            if (!box) return;
            box.classList.toggle('is-mobile-open');
            if (box.classList.contains('is-mobile-open')) box.querySelector('.search__input').focus();
        },

        'toggle-filters': function () {
            var aside = App.utils.$('.aside');
            if (aside) aside.classList.toggle('is-open');
        },

        /* Akordiyon başlığı: kendi kapsayıcısını açar/kapar. */
        'toggle-acc': function (btn) {
            var acc = btn.closest('.acc');
            if (acc) acc.classList.toggle('is-open');
        },

        /* Kategori ağacındaki ok — alt dalları açar. */
        'toggle-tree': function (btn) {
            var item = btn.closest('.tree__item');
            var children = item && item.nextElementSibling;
            if (children && children.classList.contains('tree__children')) {
                children.classList.toggle('is-open');
                btn.classList.toggle('is-open');
            }
        },

        'scroll-top': function () { App.utils.scrollTop(0); },

        /* Şifre alanını göster/gizle. */
        'toggle-password': function (btn) {
            var input = btn.parentElement.querySelector('input');
            if (!input) return;
            var show = input.type === 'password';
            input.type = show ? 'text' : 'password';
            btn.innerHTML = App.icon(show ? 'eyeOff' : 'eye', 16);
        },

        /* Panoya kopyala (banka rekvizitleri, sipariş numarası). */
        'copy': async function (btn) {
            try {
                await navigator.clipboard.writeText(btn.dataset.value || '');
                App.toast.success(App.t('common.copied', 'Kopyalandı'), 1500);
            } catch (e) {
                App.toast.error(App.t('common.error', 'Kopyalanamadı'));
            }
        }
    };

    /* ------------------------------------------------------------
       YARDIMCILAR
       ------------------------------------------------------------ */

    function stepQty(btn, delta) {
        var input = document.getElementById(btn.dataset.target);
        if (!input) return;

        var next = App.utils.clamp((parseInt(input.value, 10) || 1) + delta, 1, 100000);
        if (next === parseInt(input.value, 10)) return;

        input.value = next;
        /* 'change' olayını elle tetikle: sepet satırı bunu dinliyor. */
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function removeRow(btn) {
        var row = btn.closest('tr') || btn.closest('[data-row]');
        if (row && row.parentNode) row.parentNode.removeChild(row);
    }

    /* ------------------------------------------------------------
       TEK DİNLEYİCİ
       ------------------------------------------------------------ */
    document.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-act]');
        if (!btn) return;

        var fn = handlers[btn.dataset.act];
        if (!fn) return;

        /* Bağlantı görünümlü düğmelerde sayfa zıplamasın. */
        if (btn.tagName === 'A') e.preventDefault();

        fn(btn, e);
    });

    /** Dışarıdan yeni eylem tanımlamak için (sayfa betikleri kullanır). */
    App.actions = {
        register: function (name, fn) { handlers[name] = fn; },
        lock: lock
    };

})(window.App);
