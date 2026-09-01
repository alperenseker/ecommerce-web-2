/* ============================================================
   services/auth.service.js — OTURUM
   ------------------------------------------------------------
   Giriş, çıkış, kayıt, OTP doğrulama, şifre sıfırlama.

   Girişte YALNIZ token saklamak yetmez: sunucu fiyatı kullanıcının
   FİYAT KATEGORİSİNE göre çözüyor, stoksuz sipariş ve ödeme atlama
   yetkileri de kullanıcıya bağlı. Bu yüzden girişten hemen sonra
   UserSettings okunup yerele yazılır — ekranlar her tıklamada
   sunucuya sormak zorunda kalmasın.
   ============================================================ */

(function (App) {
    'use strict';

    var Auth = {};

    /* ============================================================
       DURUM SORGULARI
       ============================================================ */

    Auth.isLoggedIn = function () {
        return !!App.store.get(App.keys.TOKEN);
    };

    /** Giriş yapmış kullanıcı nesnesi (yoksa null). */
    Auth.user = function () {
        return App.store.getJson(App.keys.USER, null);
    };

    Auth.userId = function () {
        return App.store.get(App.keys.USER_ID, null);
    };

    Auth.isCompany = function () {
        var type = App.store.get(App.keys.ACCOUNT) || (Auth.user() || {}).accountType;
        return type === App.const.ACCOUNT_COMPANY;
    };

    /**
     * Giriş gerektiren eylemler için kapı.
     * Bildirimde giriş bağlantısı verilir; kullanıcı yönlendirilmez,
     * sepete eklemeye çalışırken sayfası kaybolmasın.
     * @returns {boolean} devam edilebilir mi
     */
    Auth.require = function (actionText) {
        if (Auth.isLoggedIn() && Auth.userId()) return true;

        App.toast.warning(
            App.t('auth.pleaseSignIn', 'Lütfen') +
            ' <a href="login.html">' + App.t('auth.signIn', 'giriş yapın') + '</a> ' +
            (actionText || '')
        );
        return false;
    };

    /* ============================================================
       GİRİŞ
       ============================================================ */

    /**
     * @returns {Promise<{user:Object}>}
     * @throws  hata mesajı sunucudan gelir (tek dilli), ekranda gösterilir
     */
    Auth.login = async function (email, password, remember) {
        var res = await App.api.auth.login(email, password);

        var token = res.token;
        var user  = res.user;

        /* Girişten önce depolama temizlenir: önceki kullanıcının
           fiyatları/sepeti/kalpleri yeni kullanıcıya sızmasın.
           Dil tercihi korunur (clearUserData beyaz listesi). */
        var company = readCompanyFields();
        App.store.clearUserData();
        writeCompanyFields(company);

        if (token) App.store.set(App.keys.TOKEN, token);

        if (user) {
            /* Bireysel girişimci bilgileri kullanıcı nesnesine gömülür ki
               tek okumayla (Auth.user()) her ekran erişebilsin. */
            if (user.accountType === App.const.ACCOUNT_RETAIL && (company.name || user.iin)) {
                user.ipCompanyName     = company.name;
                user.ipCompanyDirector = company.director;
                user.ipCompanyIin      = user.iin || company.iin;
                user.companyAddress    = company.address;
            }

            App.store.setJson(App.keys.USER, user);

            if (user.userId) {
                App.store.set(App.keys.USER_ID, user.userId);
                App.store.set(App.keys.ACCOUNT, user.accountType || App.const.ACCOUNT_RETAIL);
                if (user.iin) App.store.set(App.keys.IIN, user.iin);

                await loadCompanyAddress(user);
                await loadUserSettings(user.userId);
            }
        }

        if (remember) App.store.set(App.keys.REMEMBER, 'true');

        App.bus.emit(App.bus.EVENTS.AUTH_CHANGED, { user: user, loggedIn: true });
        return { user: user };
    };

    /**
     * Kullanıcı yetkileri. Çağrı BAŞARISIZ OLSA BİLE giriş bozulmaz:
     * en kısıtlayıcı varsayılanlara düşülür (yetki yok, fiyat A).
     */
    async function loadUserSettings(userId) {
        var fallback = function () {
            App.store.set(App.keys.CAN_BYPASS_PAYMENT, 'false');
            App.store.set(App.keys.CAN_ORDER_NO_STOCK, 'false');
            App.store.set(App.keys.PRICE_CATEGORY, 'A');
        };

        try {
            var res = await App.api.user.getSettings(userId);
            if (res.success && res.data) {
                App.store.set(App.keys.CAN_BYPASS_PAYMENT, String(res.data.CanBypassPayment || false));
                App.store.set(App.keys.CAN_ORDER_NO_STOCK, String(res.data.CanOrderWithoutStock || false));
                App.store.set(App.keys.PRICE_CATEGORY, res.data.PriceCategory || 'A');
            } else {
                fallback();
            }
        } catch (e) {
            fallback();
        }
    }

    /** Tüzel kişi hesabında şirket adresi 1C'den çekilir. */
    async function loadCompanyAddress(user) {
        if (user.accountType !== App.const.ACCOUNT_COMPANY || !user.iin) return;
        try {
            var res = await App.api.company.getByIin(user.iin);
            if (res.success && res.data && res.data.address) {
                App.store.set(App.keys.COMPANY_ADDRESS, res.data.address);
            }
        } catch (e) { /* adres yoksa ekran "-" gösterir, giriş engellenmez */ }
    }

    function readCompanyFields() {
        var user = Auth.user() || {};
        return {
            name:     App.store.get(App.keys.COMPANY_NAME)     || user.ipCompanyName     || '',
            director: App.store.get(App.keys.COMPANY_DIRECTOR) || user.ipCompanyDirector || '',
            address:  App.store.get(App.keys.COMPANY_ADDRESS)  || user.companyAddress    || '',
            iin:      App.store.get(App.keys.COMPANY_IIN)      || user.ipCompanyIin      || ''
        };
    }

    function writeCompanyFields(c) {
        if (c.name)     App.store.set(App.keys.COMPANY_NAME, c.name);
        if (c.director) App.store.set(App.keys.COMPANY_DIRECTOR, c.director);
        if (c.address)  App.store.set(App.keys.COMPANY_ADDRESS, c.address);
        if (c.iin)      App.store.set(App.keys.COMPANY_IIN, c.iin);
    }

    /* ============================================================
       ÇIKIŞ
       ============================================================ */

    Auth.logout = function (redirect) {
        App.store.clearUserData();
        App.bus.emit(App.bus.EVENTS.AUTH_CHANGED, { user: null, loggedIn: false });

        if (redirect !== false) {
            window.location.href = 'index.html';
        }
    };

    /* ============================================================
       KAYIT
       ============================================================ */

    /** Ön kayıt — sunucu geçici token üretir, ardından OTP gönderilir. */
    Auth.preRegister = function (body) {
        return App.api.auth.preRegister(body);
    };

    Auth.register = function (body) {
        return App.api.auth.register(body);
    };

    Auth.sendRegistrationOtp   = function (body) { return App.api.otp.sendRegistration(body); };
    Auth.verifyRegistrationOtp = function (body) { return App.api.otp.verifyRegistration(body); };
    Auth.resendOtp             = function (body) { return App.api.otp.resend(body); };

    /* ============================================================
       ŞİFRE
       ============================================================ */

    Auth.changePassword    = function (body) { return App.api.auth.changePassword(body); };
    Auth.forgotPassword    = function (body) { return App.api.auth.forgotPassword(body); };
    Auth.verifyForgotOtp   = function (body) { return App.api.auth.verifyForgotOtp(body); };
    Auth.resetPassword     = function (body) { return App.api.auth.resetForgotPass(body); };

    /* ============================================================
       GENEL AYARLAR (kayıt açık mı / ödeme modu)
       ------------------------------------------------------------
       İKİ KURAL:
        1) Çağrı başarısızsa BUGÜNKÜ DAVRANIŞA düşülür (kayıt açık,
           mod 'gateway'). Bir ağ hatası siteyi kayıt kapalıya ya da
           ödemesiz moda düşürmemeli.
        2) Sonuç KALICI YAZILMAZ: anahtar yönetici tarafından
           çevrildiğinde bayat değer kullanıcıyı yanlış ekrana sokar.
           Sayfa ömrü boyunca tek istek yeter.
       ============================================================ */

    var _settingsPromise = null;

    Auth.publicSettings = function () {
        if (_settingsPromise) return _settingsPromise;

        _settingsPromise = (async function () {
            try {
                var res = await App.api.settings.getPublic();
                var data = res && res.data;
                if (!data) return Object.assign({}, App.publicSettingsDefault);

                /* Alan eksikse "bugünkü davranış": kayıt AÇIK.
                   Yalnız açıkça false gelen anahtar kapalı sayılır. */
                var retail  = (data.retailRegistrationEnabled  !== undefined ? data.retailRegistrationEnabled  : data.RetailRegistrationEnabled)  !== false;
                var company = (data.companyRegistrationEnabled !== undefined ? data.companyRegistrationEnabled : data.CompanyRegistrationEnabled) !== false;

                /* Tanınmayan mod → gateway. Sunucudaki kapı burada ikinci
                   kez kuruluyor: ileride üçüncü bir değer eklenirse eski
                   istemci onu "ödeme kapalı" sanıp kart akışını kesmesin. */
                var mode = String(data.paymentMode || data.PaymentMode || App.const.PAYMENT_MODE_GATEWAY).trim().toLowerCase();
                if (mode !== App.const.PAYMENT_MODE_GATEWAY && mode !== App.const.PAYMENT_MODE_TRANSFER_ONLY) {
                    mode = App.const.PAYMENT_MODE_GATEWAY;
                }

                return {
                    retailRegistrationEnabled:  retail,
                    companyRegistrationEnabled: company,
                    paymentMode:                mode
                };
            } catch (e) {
                console.warn('Genel ayarlar okunamadı, varsayılana dönülüyor:', e && e.message);
                return Object.assign({}, App.publicSettingsDefault);
            }
        })();

        return _settingsPromise;
    };

    /** Ödeme genel olarak havaleye mi alınmış (kısayol). */
    Auth.isTransferOnly = async function () {
        var s = await Auth.publicSettings();
        return s.paymentMode === App.const.PAYMENT_MODE_TRANSFER_ONLY;
    };

    App.auth = Auth;

})(window.App);
