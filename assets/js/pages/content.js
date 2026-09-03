/* ============================================================
   pages/content.js — METİN SAYFALARI
   ------------------------------------------------------------
   Hakkımızda, iletişim, teslimat, iade, gizlilik, oferta, hesap
   silme ve 404 sayfalarının ortak davranışı:

     • SSS akordiyonu,
     • iletişim formu (destek sohbetine bağlanır),
     • hesap silme talebi formu.

   Metinlerin tamamı `data-i18n` ile sözlükten gelir; bu dosya
   yalnız ETKİLEŞİMİ yönetir.
   ============================================================ */

App.definePage('content', function () {

    bindFaq();
    bindContactForm();
    bindDeleteAccount();

    /* ------------------------------------------------------------
       SSS AKORDİYONU
       İlk madde açık gelir: kullanıcı buranın açılır kapanır bir
       liste olduğunu tıklamadan anlasın.
       ------------------------------------------------------------ */
    function bindFaq() {
        var items = App.utils.$$('.faq-item');
        if (!items.length) return;

        items[0].classList.add('is-open');

        App.actions.register('faq-toggle', function (btn) {
            var item = btn.closest('.faq-item');
            if (item) item.classList.toggle('is-open');
        });

        /* Adres çubuğunda #faq varsa oraya kaydır. */
        if (window.location.hash === '#faq') {
            var box = document.getElementById('faq');
            if (box) setTimeout(function () { box.scrollIntoView({ behavior: 'smooth' }); }, 200);
        }
    }

    /* ------------------------------------------------------------
       İLETİŞİM FORMU
       Ayrı bir "mesaj" ucu yok; mesaj DESTEK SOHBETİNE düşer.
       Böylece cevap da aynı yerden gelir, e-posta kutusu aranmaz.
       ------------------------------------------------------------ */
    function bindContactForm() {
        var form = document.getElementById('contact-form');
        if (!form) return;

        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            var name    = (document.getElementById('cf-name') || {}).value || '';
            var email   = (document.getElementById('cf-email') || {}).value || '';
            var message = (document.getElementById('cf-message') || {}).value || '';
            var btn     = document.getElementById('cf-submit');

            if (!name.trim() || !email.trim() || !message.trim()) {
                App.toast.warning(App.t('login.allFieldsRequired', 'Заполните все поля'));
                return;
            }

            /* Girişsiz ziyaretçinin mesajı sunucuda kullanıcıya
               bağlanamaz; e-posta bağlantısına yönlendirilir. */
            if (!App.auth.isLoggedIn()) {
                var subject = encodeURIComponent('Fores — ' + name);
                var body = encodeURIComponent(message + '\n\n' + email);
                window.location.href = 'mailto:' + App.config.BRAND.email +
                                       '?subject=' + subject + '&body=' + body;
                return;
            }

            btn.classList.add('is-loading');
            var ok = await App.chat.send(message + '\n\n— ' + name + ' (' + email + ')');
            btn.classList.remove('is-loading');

            if (ok) {
                App.toast.success(App.t('contact.formSubmit', 'Отправлено'));
                form.reset();
                App.support.open();
            } else {
                App.toast.error(App.t('common.error', 'Ошибка'));
            }
        });
    }

    /* ------------------------------------------------------------
       HESAP SİLME TALEBİ
       Silme işlemi SUNUCUDA elle yapılır (mağazada kendi kendine
       silme ucu yok); bu form talebi destek kanalına iletir.
       ------------------------------------------------------------ */
    function bindDeleteAccount() {
        var form = document.getElementById('delete-account-form');
        if (!form) return;

        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            var email  = (document.getElementById('da-email') || {}).value || '';
            var reason = (document.getElementById('da-reason') || {}).value || '';
            var btn    = document.getElementById('da-submit');

            if (!email.trim()) {
                App.toast.warning(App.t('login.emailRequired', ''));
                return;
            }

            var ok = await App.modal.confirm({
                title: App.t('deleteAccount.pageTitle', 'Удаление аккаунта'),
                text:  App.t('deleteAccount.s2.p1', ''),
                danger: true
            });
            if (!ok) return;

            var text = 'ACCOUNT DELETION REQUEST\nE-mail: ' + email + '\n' + reason;

            btn.classList.add('is-loading');

            if (App.auth.isLoggedIn()) {
                var sent = await App.chat.send(text);
                btn.classList.remove('is-loading');

                if (sent) {
                    App.toast.success(App.t('deleteAccount.s1.processing', 'Запрос отправлен'));
                    form.reset();
                    return;
                }
            }

            btn.classList.remove('is-loading');
            window.location.href = 'mailto:' + App.config.BRAND.email +
                '?subject=' + encodeURIComponent('Account deletion request') +
                '&body=' + encodeURIComponent(text);
        });
    }
});
