/* ============================================================
   pages/login.js — GİRİŞ SAYFASI
   ------------------------------------------------------------
   İki sekme: giriş ve kayıt. Kayıt akışının tamamı
   pages/login-register.js içinde; burada yalnız sekmeler, giriş
   formu ve "şifremi unuttum" penceresi var.

   `?mode=register` ile açılırsa doğrudan kayıt sekmesi gelir
   (ana sayfadaki "bayi ol" düğmesi bunu kullanır).
   `?redirect=cart.html` verilirse giriş sonrası oraya dönülür —
   sepetten giriş yapan kullanıcı sepetine geri gelir.
   ============================================================ */

App.definePage('login', async function () {

    /* Girişli kullanıcının giriş sayfasında işi yok. */
    if (App.auth.isLoggedIn()) {
        window.location.replace(App.utils.param('redirect') || 'index.html');
        return;
    }

    bindTabs();
    bindLogin();
    bindRegister();
    bindForgot();

    /* Kayıt kapısı — ekran anahtarlara göre çizilir. */
    App.register.applyAvailability(await App.auth.publicSettings());

    if (App.utils.param('mode') === 'register') {
        var tab = document.querySelector('[data-act="auth-tab"][data-tab="signup"]');
        if (tab) tab.click();
    }

    /* ============================================================
       SEKMELER
       ============================================================ */

    function bindTabs() {
        App.actions.register('auth-tab', function (btn) {
            var name = btn.dataset.tab;

            App.utils.$$('[data-act="auth-tab"]').forEach(function (el) {
                el.classList.toggle('is-active', el === btn);
            });
            App.utils.$$('[data-auth-panel]').forEach(function (panel) {
                panel.hidden = panel.dataset.authPanel !== name;
            });
        });
    }

    /* ============================================================
       GİRİŞ
       ============================================================ */

    function bindLogin() {
        var form = document.getElementById('login-form');
        if (!form) return;

        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            var email    = document.getElementById('login-email').value.trim();
            var password = document.getElementById('login-password').value;
            var remember = document.getElementById('login-remember').checked;
            var btn      = document.getElementById('login-submit');
            var box      = document.getElementById('login-result');

            if (!email || !password) return show(box, App.t('login.allFieldsRequired', ''), 'danger');

            btn.classList.add('is-loading');
            try {
                await App.auth.login(email, password, remember);
                show(box, App.t('login.loginSuccess', 'Вход выполнен успешно!'), 'success');

                /* Sepetten/ödemeden gelindiyse oraya dön. */
                var back = App.utils.param('redirect') || 'index.html';
                setTimeout(function () { window.location.href = back; }, 600);

            } catch (err) {
                btn.classList.remove('is-loading');
                show(box, err.message || App.t('login.loginError', ''), 'danger');
            }
        });
    }

    function bindRegister() {
        var form = document.getElementById('register-form');
        if (!form) return;

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            App.register.submit();
        });

        App.utils.$$('input[name="account-type"]').forEach(function (radio) {
            radio.addEventListener('change', function () {
                App.register.toggleAccountFields();
                App.utils.$$('.pick').forEach(function (pick) {
                    var input = pick.querySelector('input');
                    pick.classList.toggle('is-active', input && input.checked);
                });
            });
        });

        App.register.toggleAccountFields();
    }

    function show(box, message, tone) {
        if (!box) return;
        box.hidden = false;
        box.className = 'alert alert--' + tone + ' mb-4';
        box.textContent = message;
    }

    /* ============================================================
       ŞİFREMİ UNUTTUM — üç adımlı tek pencere
       (e-posta → kod → yeni şifre)
       ============================================================ */

    function bindForgot() {
        App.actions.register('forgot-password', function () {
            var t = App.t;
            var email = '';
            var code  = '';

            var modal = App.modal.open({
                title: t('login.forgotTitle', 'Сброс пароля'),
                body: '<div id="fp-step"></div>',
                onOpen: function (el, close) { renderEmail(el, close); }
            });

            void modal;

            /* ---- 1. adım: e-posta ---- */
            function renderEmail(el, close) {
                el.querySelector('#fp-step').innerHTML =
                    '<p class="t-mut t-sm">' + t('login.forgotSubtitle', '') + '</p>' +
                    '<div class="field mt-3">' +
                        '<input class="input" id="fp-email" type="email" ' +
                               'placeholder="' + t('login.email', 'E-mail') + '" required>' +
                    '</div>' +
                    '<div class="alert alert--danger mb-3" id="fp-error" hidden></div>' +
                    '<button class="btn btn--primary btn--block" type="button" id="fp-send">' +
                        t('login.forgotSendCode', 'Отправить код') + '</button>';

                el.querySelector('#fp-send').addEventListener('click', async function () {
                    var btn = this;
                    email = el.querySelector('#fp-email').value.trim();
                    if (!email) return fail(el, t('login.emailRequired', ''));

                    btn.classList.add('is-loading');
                    try {
                        var res = await App.auth.forgotPassword({ Email: email });
                        if (res.success) return renderCode(el, close);
                        fail(el, res.message || t('login.forgotError', ''));
                    } catch (err) {
                        fail(el, err.message);
                    }
                    btn.classList.remove('is-loading');
                });
            }

            /* ---- 2. adım: kod ---- */
            function renderCode(el, close) {
                el.querySelector('#fp-step').innerHTML =
                    '<p class="t-mut t-sm">' + t('login.otpSubtitle', '') + ' <b>' +
                        App.utils.escape(email) + '</b></p>' +
                    '<div class="otp-inputs mt-4" id="fp-digits">' +
                        [0,1,2,3,4,5].map(function (i) {
                            return '<input type="text" inputmode="numeric" maxlength="1" id="fp-d' + i + '">';
                        }).join('') +
                    '</div>' +
                    '<div class="alert alert--danger mt-3 mb-3" id="fp-error" hidden></div>' +
                    '<button class="btn btn--primary btn--block mt-4" type="button" id="fp-verify">' +
                        t('login.otpVerify', 'Подтвердить') + '</button>' +
                    '<button class="btn btn--link btn--block mt-2" type="button" id="fp-resend">' +
                        t('login.otpResend', '') + '</button>';

                var digits = [0,1,2,3,4,5].map(function (i) { return el.querySelector('#fp-d' + i); });
                digits.forEach(function (input, index) {
                    input.addEventListener('input', function (e) {
                        var v = e.target.value.replace(/\D/g, '');
                        e.target.value = v ? v[0] : '';
                        if (v && index < 5) digits[index + 1].focus();
                    });
                    input.addEventListener('keydown', function (e) {
                        if (e.key === 'Backspace' && !e.target.value && index > 0) digits[index - 1].focus();
                    });
                });
                digits[0].focus();

                el.querySelector('#fp-verify').addEventListener('click', async function () {
                    var btn = this;
                    code = digits.map(function (d) { return d.value; }).join('');
                    if (code.length < 6) return fail(el, t('login.otpInvalid', ''));

                    btn.classList.add('is-loading');
                    try {
                        var res = await App.auth.verifyForgotOtp({ Email: email, Code: code });
                        if (res.success) return renderReset(el, close);
                        fail(el, res.message || t('login.otpWrong', ''));
                    } catch (err) {
                        fail(el, err.message);
                    }
                    btn.classList.remove('is-loading');
                });

                el.querySelector('#fp-resend').addEventListener('click', function () {
                    App.auth.forgotPassword({ Email: email })
                        .then(function () { App.toast.success(t('login.forgotSendCode', '')); })
                        .catch(function (err) { fail(el, err.message); });
                });
            }

            /* ---- 3. adım: yeni şifre ---- */
            function renderReset(el, close) {
                el.querySelector('#fp-step').innerHTML =
                    '<p class="t-mut t-sm">' + t('login.forgotNewSubtitle', '') + '</p>' +
                    '<div class="field mt-3 field--pw">' +
                        '<input class="input" id="fp-pw" type="password" minlength="6" ' +
                               'placeholder="' + t('login.password', 'Пароль') + '">' +
                        '<button type="button" data-act="toggle-password">' + App.icon('eye', 16) + '</button>' +
                    '</div>' +
                    '<div class="field">' +
                        '<input class="input" id="fp-pw2" type="password" minlength="6" ' +
                               'placeholder="' + t('login.forgotConfirm', 'Подтвердите пароль') + '">' +
                    '</div>' +
                    '<div class="alert alert--danger mb-3" id="fp-error" hidden></div>' +
                    '<button class="btn btn--primary btn--block" type="button" id="fp-reset">' +
                        t('login.forgotResetBtn', 'Сбросить пароль') + '</button>';

                el.querySelector('#fp-reset').addEventListener('click', async function () {
                    var btn = this;
                    var pw  = el.querySelector('#fp-pw').value;
                    var pw2 = el.querySelector('#fp-pw2').value;

                    if (pw.length < 6)  return fail(el, t('login.passwordMinLength', ''));
                    if (pw !== pw2)     return fail(el, t('login.forgotMismatch', ''));

                    btn.classList.add('is-loading');
                    try {
                        var res = await App.auth.resetPassword({ Email: email, Code: code, NewPassword: pw });
                        if (res.success) {
                            el.querySelector('#fp-step').innerHTML =
                                '<div class="empty">' +
                                    '<div class="empty__icon t-ok">' + App.icon('check', 24) + '</div>' +
                                    '<h3 class="empty__title">' + t('login.forgotDoneTitle', '') + '</h3>' +
                                    '<p class="empty__text">' + t('login.forgotDoneSubtitle', '') + '</p>' +
                                '</div>';
                            setTimeout(close, 2200);
                            return;
                        }
                        fail(el, res.message || t('login.forgotError', ''));
                    } catch (err) {
                        fail(el, err.message);
                    }
                    btn.classList.remove('is-loading');
                });
            }

            function fail(el, message) {
                var box = el.querySelector('#fp-error');
                if (!box) return;
                box.hidden = false;
                box.textContent = message;
            }
        });
    }
});
