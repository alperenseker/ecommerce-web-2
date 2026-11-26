/* ============================================================
   services/order.service.js — SİPARİŞ
   ------------------------------------------------------------
   BİR ÖDEME = BİR GRUP + ŞİRKET BAŞINA BİR SİPARİŞ.

   Sepette iki farklı şirketin (1C kaynağının) ürünü varsa sunucu
   siparişi ikiye böler; ikisi de aynı `GroupId` altında toplanır.
   Bu yüzden "sipariş sayfası" aslında GRUP sayfasıdır ve müşteri
   listesinde grup gösterilir. Düz liste (getByUser) yalnız geriye
   dönük uyumluluk içindir.

   Yanıt alanları hem PascalCase hem camelCase gelebildiği için
   okuma daima `pickField` üzerinden yapılır.
   ============================================================ */

(function (App) {
    'use strict';

    var Order = {};

    function pickField(obj, name) {
        if (!obj) return undefined;
        var pascal = name.charAt(0).toUpperCase() + name.slice(1);
        var camel  = name.charAt(0).toLowerCase() + name.slice(1);
        return obj[pascal] !== undefined ? obj[pascal] : obj[camel];
    }
    Order.field = pickField;

    /* ============================================================
       DURUM SÖZLÜKLERİ
       Sunucu durumları İngilizce sabit kodlar döner; ekranda dile
       çevrilir ve renk sınıfı buradan gelir.
       ============================================================ */

    Order.STATUS = {
        pending:    { key: 'orderPage.statusPending',    tone: 'warn' },
        confirmed:  { key: 'orderPage.statusConfirmed',  tone: 'acc'  },
        processing: { key: 'orderPage.statusProcessing', tone: 'acc'  },
        shipped:    { key: 'orderPage.statusShipped',    tone: 'acc'  },
        delivered:  { key: 'orderPage.statusDelivered',  tone: 'ok'   },
        cancelled:  { key: 'orderPage.statusCancelled',  tone: 'err'  },
        on_hold:    { key: 'orderPage.statusOnHold',     tone: 'warn' },
        refunded:   { key: 'orderPage.statusRefunded',   tone: 'err'  }
    };

    Order.PAYMENT_STATUS = {
        paid:     { key: 'order.payment.paid',     tone: 'ok'   },
        pending:  { key: 'order.payment.pending',  tone: 'warn' },
        unpaid:   { key: 'order.payment.pending',  tone: 'warn' },
        failed:   { key: 'order.payment.failed',   tone: 'err'  },
        refunded: { key: 'order.payment.refunded', tone: 'err'  }
    };

    Order.PAYMENT_METHOD = {
        cash_on_delivery: 'orderPage.paymentCOD',
        bank_transfer:    'orderPage.paymentBankTransfer',
        credit_card:      'orderPage.paymentCreditCard',
        card:             'orderPage.paymentCreditCard',   /* checkout 'card' yazar */
        pending_approval: 'orderPage.paymentPendingApproval'
    };

    /** Siparişin ilerleyişi — ilerleme çubuğu bu sırayı kullanır. */
    Order.FLOW = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

    Order.statusLabel = function (status) {
        var entry = Order.STATUS[String(status || '').toLowerCase()];
        return entry ? App.t(entry.key, status) : (status || '—');
    };
    Order.statusTone = function (status) {
        var entry = Order.STATUS[String(status || '').toLowerCase()];
        return entry ? entry.tone : '';
    };
    Order.paymentLabel = function (status) {
        var entry = Order.PAYMENT_STATUS[String(status || '').toLowerCase()];
        return entry ? App.t(entry.key, status) : (status || '—');
    };
    Order.paymentTone = function (status) {
        var entry = Order.PAYMENT_STATUS[String(status || '').toLowerCase()];
        return entry ? entry.tone : '';
    };
    Order.methodLabel = function (method) {
        var key = Order.PAYMENT_METHOD[String(method || '').toLowerCase()];
        return key ? App.t(key, method) : (method || '—');
    };

    /* ============================================================
       SİPARİŞ OLUŞTURMA
       ============================================================ */

    /**
     * @param {Object} data { shippingAddressId, billingAddressId,
     *                        paymentMethod, customerNote, couponCode }
     * @returns {Promise<Object|null>} sunucudan dönen Data (grup bilgisi)
     */
    Order.create = async function (data) {
        /* Stoksuz sipariş yetkisi gövdede GÖNDERİLMEZ: sunucu her kalemi
           kendi şirketindeki yetkiyle denetliyor (CreateOrderRequest'te
           böyle bir alan yok). Kimlik token'dan; UserId eşleşmezse 403. */
        var body = {
            UserId:            App.auth.userId(),
            ShippingAddressId: data.shippingAddressId,
            BillingAddressId:  data.billingAddressId,
            PaymentMethod:     data.paymentMethod,
            CustomerNote:      data.customerNote || '',
            CouponCode:        data.couponCode || ''
        };

        var res = await App.api.orders.create(body);
        if (!res.success || !res.data) {
            throw new Error(res.message || App.t('order.createError', 'Sipariş oluşturulamadı'));
        }
        return res.data;
    };

    /** Sipariş sonucundaki alt siparişler — HER ZAMAN dizi döner. */
    Order.resultOrders = function (data) {
        var list = pickField(data, 'orders');
        return Array.isArray(list) ? list : [];
    };

    /** Sipariş sonrası gidilecek adres: grup varsa grup, yoksa tek sipariş. */
    Order.resultUrl = function (data, extraQuery) {
        var groupId = pickField(data, 'groupId');
        var orderId = pickField(data, 'orderId');

        var base = groupId
            ? 'order.html?groupId=' + encodeURIComponent(groupId)
            : 'order.html?orderId=' + encodeURIComponent(orderId);

        return extraQuery ? base + '&' + extraQuery : base;
    };

    /* ============================================================
       OKUMA
       ============================================================ */

    /**
     * Kullanıcının sipariş GRUPLARI.
     * Ana yol `/order/groups/user/{id}`. Bu uç yoksa ya da hata
     * verirse düz listeden gruplar İSTEMCİDE toplanır — düz listenin
     * her satırı GroupId/GroupNumber taşır.
     */
    Order.listGroups = async function () {
        if (!App.auth.isLoggedIn()) return [];

        try {
            var res = await App.api.orders.getGroupsByUser(App.auth.userId());
            if (res.success && Array.isArray(res.data)) return res.data;
        } catch (e) {
            console.warn('Grup listesi alınamadı, düz listeye düşülüyor:', e && e.message);
        }

        return Order.groupsFromFlatList(await Order.listOrders());
    };

    Order.listOrders = async function () {
        if (!App.auth.isLoggedIn()) return [];
        try {
            var res = await App.api.orders.getByUser(App.auth.userId());
            return (res.success && res.data) ? res.data : [];
        } catch (e) {
            console.error('Siparişler yüklenemedi:', e && e.message);
            return [];
        }
    };

    /**
     * Düz sipariş listesini gruplara toplar (yedek yol).
     * Grubun ödeme durumu, ALT SİPARİŞLERİN HEPSİ ödenmişse 'paid'
     * sayılır; biri bile beklemedeyse grup beklemededir.
     */
    Order.groupsFromFlatList = function (orders) {
        var map = {};

        (orders || []).forEach(function (o) {
            var groupId = pickField(o, 'groupId') || pickField(o, 'orderId');

            if (!map[groupId]) {
                map[groupId] = {
                    GroupId:       groupId,
                    GroupNumber:   pickField(o, 'groupNumber') || pickField(o, 'orderNumber'),
                    CreatedAt:     pickField(o, 'createdAt'),
                    PaymentStatus: pickField(o, 'paymentStatus') || 'pending',
                    TotalAmount:   0,
                    Orders:        []
                };
            }

            map[groupId].Orders.push(o);
            map[groupId].TotalAmount += parseFloat(pickField(o, 'totalAmount')) || 0;
        });

        return Object.keys(map).map(function (id) {
            var group = map[id];
            var allPaid = group.Orders.every(function (o) {
                return String(pickField(o, 'paymentStatus') || '').toLowerCase() === 'paid';
            });
            if (allPaid) group.PaymentStatus = 'paid';
            return group;
        }).sort(function (a, b) { return new Date(b.CreatedAt) - new Date(a.CreatedAt); });
    };

    Order.getById = async function (orderId) {
        var res = await App.api.orders.getById(orderId);
        return (res.success && res.data) ? res.data : null;
    };

    /** Tek grubu getir (grup uçtan gelmiyorsa düz listeden kurulur). */
    Order.getGroup = async function (groupId) {
        var groups = await Order.listGroups();
        return groups.find(function (g) {
            return String(pickField(g, 'groupId')) === String(groupId);
        }) || null;
    };

    /* ============================================================
       BANKA REKVİZİTLERİ (havale ödemesi)
       ============================================================ */

    Order.bankDetails = async function (erpSource) {
        try {
            var res = await App.api.bankDetails.getAll(false, erpSource);
            return (res.success && res.data) ? res.data : [];
        } catch (e) {
            return [];
        }
    };

    App.order = Order;

})(window.App);
