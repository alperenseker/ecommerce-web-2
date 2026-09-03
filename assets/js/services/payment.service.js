/* ============================================================
   services/payment.service.js — HALYK ePay ÖDEMESİ
   ------------------------------------------------------------
   Kart bilgisi SİTEDE alınmaz. Akış:

     1) sipariş oluşturulur (durum: ödeme bekliyor),
     2) sunucudan ödeme jetonu istenir  → POST /payments/epay-token
     3) sunucunun döndürdüğü `widgetUrl`den Halyk betiği yüklenir,
     4) Halyk'ın kendi güvenli ekranı açılır,
     5) banka sunucumuza postLink gönderir (server-to-server),
        müşteri de `backLink` ile sipariş sayfasına döner.

   🔴 İKİ KURAL:
   • Widget'a verilen TUTAR, jetonun üretildiği tutarla birebir aynı
     olmalıdır; farklıysa Halyk ödemeyi reddeder. Bu yüzden çağıranın
     verdiği tutar yalnız ön kontrol içindir, ekrana giden tutar
     DAİMA sunucunun döndürdüğü `amount`tır.
   • `invoiceId` istemcide ÜRETİLMEZ: sunucu üretir ve sipariş
     grubuna yazar; postLink geldiğinde alışverişi onunla bulur.

   FAZ 25 — bir ödeme = bir GRUP. Karışık sepetten doğan N sipariş
   tek çekimle kapanır; bu yüzden `groupId` varsa o gönderilir.
   ============================================================ */

(function (App) {
    'use strict';

    var Pay = {};
    var widgetPromise = null;

    /* ------------------------------------------------------------
       WIDGET BETİĞİ
       Adres SABİT GÖMÜLMEZ: test/canlı ayrımını sunucu yapar ve
       jeton yanıtında `widgetUrl` olarak söyler.
       ------------------------------------------------------------ */
    Pay.loadWidget = function (widgetUrl) {
        if (typeof window.halyk !== 'undefined') return Promise.resolve();
        if (widgetPromise) return widgetPromise;
        if (!widgetUrl) return Promise.reject(new Error('widgetUrl boş (sunucu /epay-token dönmedi)'));

        widgetPromise = new Promise(function (resolve, reject) {
            var el = document.createElement('script');
            el.src = widgetUrl;
            el.async = true;

            el.onload = function () {
                if (typeof window.halyk !== 'undefined') resolve();
                else { widgetPromise = null; reject(new Error('payment-api.js yüklendi ama `halyk` bulunamadı')); }
            };
            el.onerror = function () {
                widgetPromise = null;
                reject(new Error('ePay betiği yüklenemedi: ' + widgetUrl));
            };

            document.head.appendChild(el);
        });

        return widgetPromise;
    };

    /** Site dilini ePay dil koduna çevirir. */
    function epayLang() {
        var lang = String(App.i18n.lang || 'ru').toLowerCase();
        if (lang.indexOf('kz') === 0 || lang.indexOf('kk') === 0) return 'kaz';
        if (lang.indexOf('en') === 0) return 'eng';
        return 'rus';
    }

    /** Sitenin bulunduğu klasör — alt klasörde yayınlansa da dönüş adresi doğru olsun. */
    function baseUrl() {
        return window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
    }

    /* ------------------------------------------------------------
       JETON
       ------------------------------------------------------------ */

    /**
     * @param {Object} p { orderId, groupId, amount }
     * @returns {Promise<Object>} sunucudan gelen jeton verisi
     */
    Pay.token = async function (p) {
        var res = await App.http.post('/payments/epay-token', Object.assign({
            amount:      Math.round(p.amount || 0),
            currency:    App.config.EPAY.currency,
            description: 'Order #' + (p.reference || p.groupId || p.orderId)
        },
        p.orderId ? { orderId: String(p.orderId) } : {},
        p.groupId ? { groupId: String(p.groupId) } : {}));

        return res.data || null;
    };

    /* ------------------------------------------------------------
       ÖDEME BAŞLAT
       ------------------------------------------------------------ */

    /**
     * VAR OLAN bir sipariş / alışveriş için güvenli ödeme ekranını açar.
     *
     * @param {Object}  p
     * @param {string} [p.orderId] tek sipariş kimliği
     * @param {string} [p.groupId] alışveriş (grup) kimliği — tercih edilen
     * @param {number}  p.amount   ödenecek tutar (ön kontrol için)
     * @param {string} [p.reference] açıklamada görünecek numara
     * @returns {Promise<boolean>} ekran açıldıysa true
     */
    Pay.start = async function (p) {
        var user = App.auth.user();

        if (!user || !user.userId) {
            App.toast.warning(App.t('checkout.messages.pleaseLogin', 'Пожалуйста, сначала войдите'));
            return false;
        }

        var amount = Math.round(p.amount || 0);
        if ((!p.orderId && !p.groupId) || amount <= 0) {
            App.toast.error(App.t('jslanguage.paymentTokenFailed', 'Ödeme başlatılamadı'));
            return false;
        }

        /* 1) jeton */
        var data;
        try {
            data = await Pay.token(p);
        } catch (e) {
            App.toast.error(App.t('jslanguage.paymentStartFailed', 'Ödeme başlatılamadı') + ': ' + e.message);
            return false;
        }

        if (!data || !data.auth || !data.terminal || !data.invoiceId || !data.widgetUrl) {
            App.toast.error(App.t('jslanguage.paymentTokenFailed', 'Ödeme jetonu alınamadı.'));
            return false;
        }

        /* Jeton hangi tutar için üretildiyse ekran da onu göstermeli. */
        var tokenAmount = Math.round(Number(data.amount !== undefined ? data.amount : amount) || 0);
        if (tokenAmount > 0) amount = tokenAmount;

        /* Bu ödeme birden çok siparişi kapatıyorsa müşteriye söyle. */
        var orderCount = Number(data.orderCount) || 0;
        if (orderCount > 1) {
            App.toast.info(App.t('orderPage.paymentCoversOrders',
                'Bu ödeme {count} siparişi kapatıyor.', { count: orderCount }));
        }

        /* 2) dönüş adresleri — her hâlükârda sipariş sayfasına. */
        var paidGroupId = data.groupId || p.groupId || null;
        var query = paidGroupId
            ? 'groupId=' + encodeURIComponent(paidGroupId)
            : 'orderId=' + encodeURIComponent(p.orderId);

        var payment = {
            invoiceId:       data.invoiceId,
            backLink:        baseUrl() + 'order.html?' + query + '&epay=return',
            failureBackLink: baseUrl() + 'order.html?' + query + '&epay=fail',
            postLink:        App.config.EPAY.postLink,
            failurePostLink: App.config.EPAY.postLink,
            language:        epayLang(),
            description:     'Order #' + (data.groupNumber || p.reference || paidGroupId || p.orderId),
            accountId:       String(user.userId),
            terminal:        data.terminal,
            amount:          amount,
            currency:        App.config.EPAY.currency,
            name:            user.name || user.fullName || '',
            email:           user.email || '',
            phone:           user.phone || user.phoneNumber || '',
            auth:            data.auth
        };

        /* 3) widget */
        try {
            await Pay.loadWidget(data.widgetUrl);
        } catch (e) {
            App.toast.error(App.t('jslanguage.paymentModuleNotLoaded', 'Ödeme modülü yüklenemedi') + ': ' + e.message);
            return false;
        }

        App.toast.info(App.t('jslanguage.redirectingToPayment', 'Güvenli ödeme ekranı açılıyor…'));

        /* Widget sürümüne göre iki API de desteklenir. */
        if (typeof window.halyk.pay === 'function') {
            window.halyk.pay(payment);
        } else if (typeof window.halyk.showPaymentWidget === 'function') {
            window.halyk.showPaymentWidget(payment, function (result) {
                var ok = result && (result.success === true || result.code === 'ok');
                window.location.href = ok ? payment.backLink : payment.failureBackLink;
            });
        } else {
            App.toast.error(App.t('jslanguage.paymentModuleNotLoaded', 'Ödeme modülü beklenen API\'yi sağlamıyor.'));
            return false;
        }

        return true;
    };

    /** Grup kısayolu — sipariş listesi ve sipariş takibi bunu kullanır. */
    Pay.startForGroup = function (groupId, amount, reference) {
        return Pay.start({ groupId: groupId, amount: amount, reference: reference });
    };

    /** Tek sipariş kısayolu (grubu olmayan eski kayıtlar). */
    Pay.startForOrder = function (orderId, amount, reference) {
        return Pay.start({ orderId: orderId, amount: amount, reference: reference });
    };

    App.pay = Pay;

})(window.App);
