/* ============================================================
   core/api.js — UÇ NOKTA HARİTASI
   ------------------------------------------------------------
   Sunucudaki HER uç burada bir satırdır. Kural: uygulamanın hiçbir
   yerinde elle URL yazılmaz, hep App.api.<alan>.<işlem>() çağrılır.
   Bir uç değiştiğinde tek satır düzeltmek yeter.

   Alan adları backend denetleyicileriyle (controller) birebir aynı
   tutuldu ki API belgesiyle karşılaştırmak kolay olsun.
   ============================================================ */

(function (App) {
    'use strict';

    var http = App.http;
    var q = function (obj) { var s = App.utils.query(obj); return s ? '?' + s : ''; };

    App.api = {

        /* ---------- KİMLİK ---------- */
        auth: {
            login:  function (email, password) {
                return http.post('/Auth/login', { Email: email, Password: password });
            },
            register:    function (body) { return http.post('/Auth/register', body); },
            preRegister: function (body) { return http.post('/Auth/pre-register', body, { skipAuth: true }); },
            changePassword: function (body) { return http.post('/Auth/change-password', body); },

            /* Şifremi unuttum akışı — üçü de anonim uçtur. */
            forgotPassword:    function (body) { return http.post('/Auth/forgot-password', body, { skipAuth: true }); },
            verifyForgotOtp:   function (body) { return http.post('/Auth/verify-forgot-password-otp', body, { skipAuth: true }); },
            resetForgotPass:   function (body) { return http.post('/Auth/reset-forgot-password', body, { skipAuth: true }); }
        },

        /* ---------- TEK KULLANIMLIK KOD ---------- */
        otp: {
            sendRegistration:   function (body) { return http.post('/otp/send-registration-otp', body); },
            verifyRegistration: function (body) { return http.post('/otp/verify-registration-otp', body); },
            checkVerification:  function (body) { return http.post('/otp/check-registration-verification', body); },
            resend:             function (body) { return http.post('/otp/resend-registration-otp', body); }
        },

        /* ---------- KULLANICI ---------- */
        user: {
            /* Fiyat kategorisi, stoksuz sipariş izni gibi yetkiler. */
            getSettings: function (userId) { return http.get('/UserSettings/' + userId); }
        },

        /* ---------- GENEL AYARLAR ----------
           🔴 ANONİM uç: kayıt ekranı tanımı gereği girişsiz açılır.
           Tam ayarlar (`GET /api/settings`) [Authorize] altındadır. */
        settings: {
            getPublic: function () { return http.get('/settings/public', { skipAuth: true }); }
        },

        /* ---------- ÜRÜN ---------- */
        products: {
            getAll:      function (params) { return http.get('/products' + q(params)); },
            getById:     function (id)     { return http.get('/products/' + id); },
            getVariants: function (id)     { return http.get('/products/' + id + '/variants'); },
            getColors:   function ()       { return http.get('/products/colors'); },
            getCategories: function ()     { return http.get('/categories'); }
        },

        /* ---------- SEPET ---------- */
        cart: {
            get:            function (userId)     { return http.get('/Cart/user/' + userId); },
            add:            function (body)       { return http.post('/Cart/add', body); },
            updateQuantity: function (body)       { return http.put('/Cart/update-quantity', body); },
            remove:         function (cartItemId) { return http.del('/Cart/remove/' + cartItemId); },
            clear:          function (userId)     { return http.del('/Cart/clear/' + userId); }
        },

        /* ---------- İSTEK LİSTESİ ---------- */
        wishlist: {
            get:    function (userId) { return http.get('/Wishlist/user/' + userId); },
            add:    function (body)   { return http.post('/Wishlist/add', body); },
            remove: function (itemId) { return http.del('/Wishlist/remove/' + itemId); },
            check:  function (userId, productId) { return http.get('/Wishlist/check/' + userId + '/' + productId); }
        },

        /* ---------- KARŞILAŞTIRMA ---------- */
        compare: {
            getLists: function (userId)       { return http.get('/compare/user/' + userId); },
            getById:  function (comparisonId) { return http.get('/compare/' + comparisonId); },
            add:      function (body)         { return http.post('/compare/add', body); },
            remove:   function (itemId)       { return http.del('/compare/remove/' + itemId); },
            clear:    function (comparisonId) { return http.del('/compare/clear/' + comparisonId); },
            check:    function (userId, productId) { return http.get('/compare/check/' + userId + '/' + productId); }
        },

        /* ---------- SİPARİŞ ---------- */
        orders: {
            create:    function (body)    { return http.post('/order/create', body); },
            getByUser: function (userId)  { return http.get('/order/user/' + userId); },
            getById:   function (orderId) { return http.get('/order/' + orderId); },
            /* Bir ödeme = bir grup + ŞİRKET BAŞINA bir sipariş.
               Düz liste (getByUser) geriye dönük uyumluluk için durur. */
            getGroupsByUser: function (userId) { return http.get('/order/groups/user/' + userId); }
        },

        /* ---------- ADRES ---------- */
        address: {
            getByUser: function (userId)     { return http.get('/Address/user/' + userId); },
            save:      function (body)       { return http.post('/Address', body); },
            update:    function (id, body)   { return http.put('/Address/' + id, body); },
            remove:    function (id)         { return http.del('/Address/' + id); }
        },

        /* ---------- DEĞERLENDİRME ---------- */
        reviews: {
            getByProduct: function (productId, page, pageSize) {
                return http.get('/reviews/product/' + productId + q({ page: page || 1, pageSize: pageSize || 10 }));
            },
            getByUser: function (userId)       { return http.get('/reviews/user/' + userId); },
            submit:    function (body)         { return http.post('/Reviews', body); },
            update:    function (id, body)     { return http.put('/reviews/' + id, body); }
        },

        /* ---------- BANKA REKVİZİTLERİ ----------
           `erpSource` verilirse yalnız o şirketin hesapları döner.
           Sipariş tek şirketlidir → tek çağrı yeter. Ödeme sayfasında
           sepette birden çok şirket olabildiği için süzgeçsiz çağrılıp
           istemcide gruplanır (daha az istek). */
        bankDetails: {
            getAll: function (includeInactive, erpSource) {
                return http.get('/bank-details' + q({
                    includeInactive: includeInactive ? 'true' : '',
                    erpSource: erpSource || ''
                }));
            }
        },

        /* ---------- ŞİRKET ---------- */
        company: {
            getByIin: function (iin) { return http.get('/company/' + iin); }
        },

        /* ---------- DESTEK SOHBETİ ---------- */
        chat: {
            getByUser:   function (userId, type) { return http.get('/chat/user/' + userId + '/type/' + (type || 'support')); },
            create:      function (body)         { return http.post('/chat', body); },
            getMessages: function (chatId)       { return http.get('/chat/' + chatId + '/messages'); },
            sendMessage: function (chatId, body) { return http.post('/chat/' + chatId + '/messages', body); },
            markSeen:    function (chatId, body) { return http.put('/chat/' + chatId + '/seen', body); },
            upload:      function (chatId, fd, onProgress) { return http.upload('/chat/' + chatId + '/upload', fd, onProgress); }
        }
    };

})(window.App);
