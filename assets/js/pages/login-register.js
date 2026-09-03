/* ============================================================
   pages/login-register.js — KAYIT AKIŞI (pencereler dahil)
   ------------------------------------------------------------
   Kayıt tek adım değildir:

     BİREYSEL : OTP gönder → doğrula → kayıt
     ŞİRKET   : ön kayıt (geçici jeton) → 1C'den şirketi çek
                → şirket doğru mu? (pencere) → OTP → kayıt
                (şirket 1C'de yoksa bilgiler ELLE girilir)

   🔴 KAYIT KAPISI: sunucu perakende/şirket kaydını ayrı ayrı
   kapatabilir. Kapalı olan seçenek EKRANA HİÇ ÇİZİLMEZ; hata
   göstermek yerine o bölüm yok sayılır. Giriş formu HER DURUMDA
   açık kalır — kaydı kapatmak girişi kapatmak değildir.

   Ağ hatası kaydı KAPATMAZ: `publicSettings` başarısız olursa
   bugünkü davranışa (ikisi de açık) dönülür.
   ============================================================ */

(function (App) {
    'use strict';

    var Reg = {};

    var OTP_COOLDOWN = 5 * 60;   /* saniye — sunucudaki süreyle aynı */

    /* ============================================================
       KAYIT KAPISI
       ============================================================ */

    /**
     * Anahtarları ekrana uygular.
     * İkisi de açıkken HİÇBİR ŞEY YAPMAZ — bu, davranışın
     * değişmediğinin garantisidir.
     */
    Reg.applyAvailability = function (settings) {
        var retail  = settings.retailRegistrationEnabled  !== false;
        var company = settings.companyRegistrationEnabled !== false;

        if (retail && company) return;

        if (!retail && !company) { showClosed(); return; }

        if (!retail) { disableOption('opt-retail'); selectOnly('acct-company'); return; }
        disableOption('opt-company'); selectOnly('acct-retail');
    };

    /**
     * Gizlenen seçeneğin girdilerini formdan ÇIKARIR.
     * `disabled` + `required` kaldırma birlikte yapılır: görünmeyen
     * ama `required` bir alan gönderimi sessizce bloklar ve tarayıcı
     * "görünmeyen alanı doldurun" der.
     */
    function disableOption(id) {
        var box = document.getElementById(id);
        if (!box) return;
        box.style.display = 'none';
        App.utils.$$('input', box).forEach(function (input) {
            input.checked = false;
            input.disabled = true;
            input.removeAttribute('required');
        });
    }

    function selectOnly(radioId) {
        var radio = document.getElementById(radioId);
        if (!radio) return;

        radio.checked = true;
        radio.disabled = false;

        /* Tek seçenek kaldıysa seçicinin kendisi de anlamsız. */
        var group = document.getElementById('acct-type-group');
        if (group) group.style.display = 'none';

        Reg.toggleAccountFields();
    }

    function showClosed() {
        var form   = document.getElementById('register-form');
        var closed = document.getElementById('registration-closed');

        if (form) {
            form.style.display = 'none';
            App.utils.$$('input, select, textarea', form).forEach(function (el) {
                el.disabled = true;
                el.removeAttribute('required');
            });
        }
        if (closed) closed.hidden = false;
    }

    /**
     * Sunucudan 403 + errorCode geldiğinde ekranı kapat.
     * Anahtar sayfa açıldıktan SONRA da çevrilebilir; o durumda
     * sunucunun tek dilli mesajını göstermek yerine ilgili bölüm
     * gizlenir.
     * @returns {boolean} hata bir kayıt kapısı hatası mıydı
     */
    Reg.handleClosedError = function (err) {
        var code = err && err.errorCode;
        if (!code) return false;

        if (code === 'registration_disabled') { showClosed(); return true; }

        if (code === 'registration_disabled_retail') {
            disableOption('opt-retail');
            var company = document.getElementById('acct-company');
            if (company && !company.disabled) selectOnly('acct-company');
            else showClosed();
            return true;
        }

        if (code === 'registration_disabled_company') {
            disableOption('opt-company');
            var retail = document.getElementById('acct-retail');
            if (retail && !retail.disabled) selectOnly('acct-retail');
            else showClosed();
            return true;
        }

        return false;
    };

    /* ============================================================
       FORM DAVRANIŞI
       ============================================================ */

    /** Hesap tipine göre alan göster/gizle (BİN yalnız şirkette). */
    Reg.toggleAccountFields = function () {
        var isCompany = accountType() === App.const.ACCOUNT_COMPANY;

        toggle('field-iin', isCompany, true);
        toggle('field-name', !isCompany, true);
        toggle('field-surname', !isCompany, true);

        function toggle(id, show, required) {
            var box = document.getElementById(id);
            if (!box) return;
            box.hidden = !show;
            App.utils.$$('input', box).forEach(function (input) {
                input.disabled = !show;
                if (required) {
                    if (show) input.setAttribute('required', 'required');
                    else input.removeAttribute('required');
                }
            });
        }
    };

    function accountType() {
        var checked = document.querySelector('input[name="account-type"]:checked');
        return (checked && checked.value) || App.const.ACCOUNT_RETAIL;
    }

    function val(id) {
        var el = document.getElementById(id);
        return el ? String(el.value || '').trim() : '';
    }

    function say(message, tone) {
        var box = document.getElementById('register-result');
        if (!box) return;
        box.hidden = false;
        box.className = 'alert alert--' + (tone || 'info') + ' mb-4';
        box.innerHTML = App.utils.escape(message);
    }

    function busy(on) {
        var btn = document.getElementById('register-submit');
        if (btn) btn.classList.toggle('is-loading', !!on);
    }

    /* ============================================================
       KAYIT
       ============================================================ */

    Reg.submit = async function () {
        var t = App.t;

        var type     = accountType();
        var iin      = val('reg-iin');
        var phone    = val('reg-phone');
        var email    = val('reg-email');
        var password = val('reg-password');
        var name     = val('reg-name');
        var surname  = val('reg-surname');

        var agreeBox = document.getElementById('reg-agree');
        var agree    = agreeBox ? agreeBox.checked : false;

        /* ---- doğrulama (kaynak projedeki sırayla) ---- */
        if (type === App.const.ACCOUNT_RETAIL && (!name || !surname)) {
            return say(t('login.allFieldsRequired', 'Заполните все поля'), 'danger');
        }
        if (!phone || !email || !password) {
            return say(t('login.allFieldsRequired', 'Заполните все поля'), 'danger');
        }
        if (!agree) {
            return say(t('login.agreePolicy', '') + ' ' + t('login.privacyPolicy', ''), 'danger');
        }
        if (type === App.const.ACCOUNT_COMPANY && !iin) {
            return say(t('login.iinRequired', 'Введите ИИН/БИН'), 'danger');
        }
        if (type === App.const.ACCOUNT_COMPANY && iin.length !== 12) {
            return say(t('login.iinInvalid', 'ИИН/БИН должен состоять из 12 цифр'), 'danger');
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return say(t('login.emailRequired', 'Введите корректный email'), 'danger');
        }
        if (password.length < 6) {
            return say(t('login.passwordMinLength', 'Минимум 6 символов'), 'danger');
        }

        hideResult();

        if (type === App.const.ACCOUNT_COMPANY) return companyFlow(email, password, phone, iin);
        return retailFlow(email, password, phone, name, surname);
    };

    function hideResult() {
        var box = document.getElementById('register-result');
        if (box) box.hidden = true;
    }

    /* ---------- BİREYSEL ---------- */
    async function retailFlow(email, password, phone, name, surname) {
        var body = {
            Name: name, Surname: surname, UserName: '',
            Email: email, Password: password, Phone: phone,
            ProfileImage: '', DeviceToken: '',
            AccountType: App.const.ACCOUNT_RETAIL, Iin: ''
        };

        busy(true);
        try {
            var res = await App.auth.sendRegistrationOtp({ Contact: email, Method: 'email' });
            busy(false);

            if (!res.success) return say(res.message || 'OTP', 'danger');
            Reg.otpModal(email, function () { doRegister(body); });

        } catch (err) {
            busy(false);
            if (Reg.handleClosedError(err)) return say(App.t('login.registrationClosedText', ''), 'danger');
            say(err.message, 'danger');
        }
    }

    /* ---------- ŞİRKET ---------- */
    async function companyFlow(email, password, phone, iin) {
        busy(true);

        try {
            /* 1) ön kayıt — sunucu geçici jeton verir. */
            var pre = await App.auth.preRegister({
                Email: email, Name: '', Surname: '',
                AccountType: App.const.ACCOUNT_COMPANY
            });

            if (!pre.success) { busy(false); return say(pre.message || '', 'danger'); }

            /* 2) geçici jeton — şirket sorgusu yetki ister. */
            var temp = pre.tempToken || (pre.data && pre.data.tempToken);
            if (temp) App.store.set(App.keys.TOKEN, temp);

            /* 3) şirketi 1C'den çek. */
            var company = null;
            try {
                var res = await App.api.company.getByIin(iin);
                if (res.success && res.data) company = res.data;
            } catch (e) { company = null; }   /* 404 → elle giriş akışı */

            busy(false);
            App.store.remove(App.keys.TOKEN);   /* geçici jeton işini bitirdi */

            /* 4a) şirket bulunamadı → bilgiler elle alınır. */
            if (!company) {
                App.store.set(App.keys.COMPANY_IIN, iin);
                return Reg.ipModal(function (form) {
                    App.store.set(App.keys.COMPANY_NAME, form.name);
                    App.store.set(App.keys.COMPANY_DIRECTOR, form.director);

                    sendOtpThenRegister(email, {
                        Name: form.name, Surname: form.director, UserName: '',
                        Email: email, Password: password, Phone: phone,
                        ProfileImage: '', DeviceToken: '',
                        AccountType: App.const.ACCOUNT_COMPANY, Iin: iin
                    });
                });
            }

            /* 4b) şirket bulundu → müşteriye doğrulat. */
            Reg.companyModal(company, function () {
                App.store.set(App.keys.COMPANY_ADDRESS, company.address || '');

                sendOtpThenRegister(email, {
                    Name: company.nameRu || company.NameRu || '',
                    Surname: company.director || company.Director || '',
                    UserName: '', Email: email, Password: password, Phone: phone,
                    ProfileImage: '', DeviceToken: '',
                    AccountType: App.const.ACCOUNT_COMPANY, Iin: iin
                });
            });

        } catch (err) {
            busy(false);
            App.store.remove(App.keys.TOKEN);
            if (Reg.handleClosedError(err)) return say(App.t('login.registrationClosedText', ''), 'danger');
            say(err.message, 'danger');
        }
    }

    async function sendOtpThenRegister(email, body) {
        try {
            var res = await App.auth.sendRegistrationOtp({ Contact: email, Method: 'email' });
            if (!res.success) return say(res.message || 'OTP', 'danger');
            Reg.otpModal(email, function () { doRegister(body); });
        } catch (err) {
            if (Reg.handleClosedError(err)) return say(App.t('login.registrationClosedText', ''), 'danger');
            say(err.message, 'danger');
        }
    }

    /** Kaydı tamamla. OTP doğrulandıktan SONRA çağrılır. */
    async function doRegister(body) {
        busy(true);
        try {
            var res = await App.auth.register(body);
            busy(false);

            if (!res.success) return say(res.message || App.t('login.registerError', ''), 'danger');

            say(App.t('login.registerSuccess', 'Регистрация выполнена'), 'success');

            var form = document.getElementById('register-form');
            if (form) form.reset();
            Reg.toggleAccountFields();

            /* Kayıt bitti; kullanıcı giriş sekmesine alınır. */
            setTimeout(function () {
                var tab = document.querySelector('[data-act="auth-tab"][data-tab="signin"]');
                if (tab) tab.click();
                var box = document.getElementById('login-result');
                if (box) {
                    box.hidden = false;
                    box.className = 'alert alert--success mb-4';
                    box.textContent = App.t('login.registerSuccess', '');
                }
            }, 1500);

        } catch (err) {
            busy(false);
            /* OTP'ye kadar gelinip burada reddedilmek, anahtar tam o
               sırada çevrildiğinde mümkündür: ekranda sessiz kalma. */
            if (Reg.handleClosedError(err)) return say(App.t('login.registrationClosedText', ''), 'danger');
            say(err.message, 'danger');
        }
    }

    /* ============================================================
       OTP PENCERESİ
       ============================================================ */

    Reg.otpModal = function (email, onVerified) {
        var t = App.t;
        var left = OTP_COOLDOWN;
        var ticker = null;

        var modal = App.modal.open({
            title: t('login.otpTitle', 'Подтверждение эл. почты'),
            closable: false,
            body:
                '<p class="t-mut t-sm">' + t('login.otpSubtitle', 'Ваш код отправлен на:') +
                    ' <b>' + App.utils.escape(email) + '</b></p>' +

                '<div class="otp-inputs mt-4" id="otp-inputs">' +
                    [0,1,2,3,4,5].map(function (i) {
                        return '<input type="text" inputmode="numeric" maxlength="1" id="otp-' + i + '">';
                    }).join('') +
                '</div>' +

                '<div class="t-center t-sm t-mut mt-3" id="otp-timer">' +
                    t('login.otpExpires', 'Код действителен:') + ' <b id="otp-countdown">5:00</b>' +
                '</div>' +

                '<div class="alert alert--danger mt-3" id="otp-error" hidden></div>',
            footer:
                '<button class="btn btn--ghost" type="button" id="otp-resend" disabled>' +
                    t('login.otpResend', 'Отправить код повторно') + '</button>' +
                '<button class="btn btn--primary" type="button" id="otp-verify">' +
                    t('login.otpVerify', 'Подтвердить') + '</button>',

            onOpen: function (el, close) {
                var digits = [0,1,2,3,4,5].map(function (i) { return el.querySelector('#otp-' + i); });
                bindDigits(digits);
                digits[0].focus();

                startTimer();

                el.querySelector('#otp-verify').addEventListener('click', async function () {
                    var btn = this;
                    var code = digits.map(function (d) { return d.value; }).join('');

                    if (code.length < 6) return error(t('login.otpInvalid', 'Введите 6-значный код.'));

                    btn.classList.add('is-loading');
                    try {
                        var res = await App.auth.verifyRegistrationOtp({
                            Contact: email, Method: 'email', Code: code
                        });

                        if (res.success) {
                            clearInterval(ticker);
                            close();
                            onVerified();
                            return;
                        }
                        error(res.message || t('login.otpWrong', 'Неверный код.'));
                    } catch (err) {
                        error(err.message);
                    }
                    btn.classList.remove('is-loading');
                });

                el.querySelector('#otp-resend').addEventListener('click', async function () {
                    var btn = this;
                    btn.disabled = true;
                    try {
                        var res = await App.auth.resendOtp({ Contact: email, Method: 'email' });
                        if (res.success) { left = OTP_COOLDOWN; startTimer(); hideError(); }
                        else { error(res.message || ''); btn.disabled = false; }
                    } catch (err) {
                        error(err.message);
                        btn.disabled = false;
                    }
                });

                function startTimer() {
                    clearInterval(ticker);
                    paint();
                    ticker = setInterval(function () {
                        left--;
                        paint();
                        if (left <= 0) {
                            clearInterval(ticker);
                            el.querySelector('#otp-timer').innerHTML =
                                '<span class="t-err">' + t('login.otpExpired', 'Срок действия кода истёк') + '</span>';
                            el.querySelector('#otp-resend').disabled = false;
                        }
                    }, 1000);
                }

                function paint() {
                    var box = el.querySelector('#otp-countdown');
                    if (box) box.textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0');
                }

                function error(message) {
                    var box = el.querySelector('#otp-error');
                    box.hidden = false;
                    box.textContent = message;
                }
                function hideError() { el.querySelector('#otp-error').hidden = true; }
            }
        });

        void modal;
    };

    /** 6 kutulu kod alanı: otomatik ilerleme, geri silme, yapıştırma. */
    function bindDigits(digits) {
        digits.forEach(function (input, index) {
            input.addEventListener('input', function (e) {
                var value = e.target.value.replace(/\D/g, '');
                e.target.value = value ? value[0] : '';
                if (value && index < 5) digits[index + 1].focus();
            });

            input.addEventListener('keydown', function (e) {
                if (e.key === 'Backspace' && !e.target.value && index > 0) digits[index - 1].focus();
            });

            input.addEventListener('paste', function (e) {
                var text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
                if (text.length < 6) return;
                e.preventDefault();
                text.slice(0, 6).split('').forEach(function (ch, i) { digits[i].value = ch; });
                digits[5].focus();
            });
        });
    }

    /* ============================================================
       ŞİRKET DOĞRULAMA PENCERESİ
       ============================================================ */

    Reg.companyModal = function (company, onConfirm) {
        var t = App.t;
        var esc = App.utils.escape;

        App.modal.open({
            title: t('login.companyModalTitle', 'Подтвердите данные компании'),
            body:
                '<p class="t-mut t-sm mb-4">' + t('login.companyModalSubtitle', '') + '</p>' +
                '<table class="specs"><tbody>' +
                    row(t('login.companyModalName', 'Компания'),  company.nameRu || company.NameRu) +
                    row(t('login.companyModalDirector', 'Директор'), company.director || company.Director) +
                    row(t('login.companyModalAddress', 'Адрес'),   company.address || company.Address) +
                '</tbody></table>',
            footer:
                '<button class="btn btn--ghost" type="button" data-modal-cancel>' +
                    t('login.companyModalCancel', 'Отмена') + '</button>' +
                '<button class="btn btn--primary" type="button" data-modal-ok>' +
                    t('login.companyModalConfirm', 'Да, это моя компания') + '</button>',
            onOpen: function (el, close) {
                el.querySelector('[data-modal-ok]').addEventListener('click', function () { close(); onConfirm(); });
                el.querySelector('[data-modal-cancel]').addEventListener('click', close);
            }
        });

        function row(label, value) {
            return '<tr><td>' + esc(label) + '</td><td>' + esc(value || '—') + '</td></tr>';
        }
    };

    /* ============================================================
       ŞİRKET ELLE GİRİŞ PENCERESİ (1C'de bulunamadı)
       ============================================================ */

    Reg.ipModal = function (onConfirm) {
        var t = App.t;

        App.modal.open({
            title: t('login.ipModalTitle', 'Введите данные компании'),
            body:
                '<p class="t-mut t-sm mb-4">' + t('login.ipModalSubtitle', '') + '</p>' +
                '<div class="field">' +
                    '<label class="label label--req" for="ip-name">' +
                        t('login.companyModalName', 'Название компании') + '</label>' +
                    '<input class="input" id="ip-name" type="text" required>' +
                '</div>' +
                '<div class="field">' +
                    '<label class="label label--req" for="ip-director">' +
                        t('login.companyModalDirector', 'Директор') + '</label>' +
                    '<input class="input" id="ip-director" type="text" required>' +
                '</div>' +
                '<div class="alert alert--danger" id="ip-error" hidden></div>',
            footer:
                '<button class="btn btn--ghost" type="button" data-modal-cancel>' +
                    t('login.companyModalCancel', 'Отмена') + '</button>' +
                '<button class="btn btn--primary" type="button" data-modal-ok>' +
                    t('login.companyModalConfirm', 'Продолжить') + '</button>',
            onOpen: function (el, close) {
                el.querySelector('[data-modal-cancel]').addEventListener('click', close);
                el.querySelector('[data-modal-ok]').addEventListener('click', function () {
                    var name     = el.querySelector('#ip-name').value.trim();
                    var director = el.querySelector('#ip-director').value.trim();

                    if (!name || !director) {
                        var box = el.querySelector('#ip-error');
                        box.hidden = false;
                        box.textContent = t('login.allFieldsRequired', 'Заполните все поля');
                        return;
                    }
                    close();
                    onConfirm({ name: name, director: director });
                });
            }
        });
    };

    App.register = Reg;

})(window.App);
