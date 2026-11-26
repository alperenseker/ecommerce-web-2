/* ============================================================
   pages/order.js — SİPARİŞ / ALIŞVERİŞ SAYFASI
   ------------------------------------------------------------
   İki görünüm, tek dosya:
     • ?groupId=…  ALIŞVERİŞ görünümü (bir ödeme = bir grup)
     • ?orderId=…  tek sipariş görünümü (eski bağlantılar çalışsın)

   ePay dönüşünde (?epay=return|fail) üstte bir ödeme şeridi çizilir.
   PostLink sunucuya server-to-server geldiği için durum birkaç saniye
   gecikebilir; bu yüzden 'paid' olana kadar YOKLANIR (8 × 3 sn).

   🔴 `transfer_only` modunda "Ödemeyi tamamla" düğmesi HİÇ çizilmez:
   sunucu ePay ucuna 409 (`payment_disabled`) döndürüyor ve müşteri o
   hata ekranını görmemeli. O modda rekvizitler gösterilir.
   ============================================================ */

App.definePage('order', async function (ctx) {

    var root = document.getElementById('order-root');

    if (!App.auth.isLoggedIn()) {
        root.innerHTML = guard(App.t('orderPage.pleaseLogin', 'Пожалуйста, войдите'));
        setTimeout(function () { window.location.href = 'login.html?redirect=' +
            encodeURIComponent(location.pathname.split('/').pop() + location.search); }, 1800);
        return;
    }

    root.innerHTML = loading();

    await ctx.catalog;
    await ctx.user;

    var groupId = App.utils.param('groupId');
    var orderId = App.utils.param('orderId');
    var epay    = App.utils.param('epay');

    var paymentMode = (await App.auth.publicSettings()).paymentMode;
    var current = null;          // grup ya da sipariş kaydı

    if (groupId) {
        current = await App.order.getGroup(groupId);
        if (!current) { root.innerHTML = guard(App.t('orderPage.groupNotFound', 'Покупка не найдена')); return; }
        renderGroup(current);
    } else if (orderId) {
        current = await App.order.getById(orderId);
        if (!current) { root.innerHTML = guard(App.t('orderPage.orderNotFound', 'Заказ не найден')); return; }
        renderOrder(current);
    } else {
        root.innerHTML = guard(App.t('orderPage.orderIdNotFound', 'ID заказа не найден'));
        return;
    }

    if (epay) trackPayment();

    /* Sipariş listesinden "ödemeyi tamamla" ile gelindiyse otomatik başlat. */
    if (App.utils.param('pay') === '1' && paymentMode !== App.const.PAYMENT_MODE_TRANSFER_ONLY) {
        autoPay();
    }

    App.bus.on(App.bus.EVENTS.LANG_CHANGED, function () {
        App.i18n.apply();
        if (groupId) renderGroup(current); else renderOrder(current);
    });

    /* ============================================================
       ALIŞVERİŞ (GRUP) GÖRÜNÜMÜ
       ============================================================ */

    function renderGroup(group) {
        var t = App.t;
        var f = App.order.field;

        var orders  = f(group, 'orders') || [];
        var status  = String(f(group, 'paymentStatus') || 'pending').toLowerCase();
        var total   = parseFloat(f(group, 'totalAmount')) || 0;
        var method  = String(f(group, 'paymentMethod') || '').toLowerCase();

        root.innerHTML =
            '<div id="pay-banner"></div>' +

            heroHtml(t('orderPage.thankYou', 'Спасибо. Ваш заказ принят.'),
                     t('orderPage.purchaseNumber', 'Номер покупки'),
                     f(group, 'groupNumber') || f(group, 'groupId')) +

            '<div class="card mb-4"><div class="card__body">' +
                metaHtml([
                    [t('orderPage.date', 'Дата'),          App.fmt.date(f(group, 'createdAt'))],
                    [t('orderPage.total', 'Итого'),        App.fmt.price(total)],
                    [t('orderPage.orderCount', 'Заказы'),  String(orders.length || 1)],
                    [t('orderPage.paymentStatus', 'Статус оплаты'),
                     '<span class="badge badge--' + App.order.paymentTone(status) + '">' +
                        App.utils.escape(App.order.paymentLabel(status)) + '</span>']
                ]) +

                (orders.length > 1
                    ? '<div class="alert alert--info mt-4">' + App.icon('info', 15) +
                          '<span>' + t('orderPage.groupSplitNote', '', { count: orders.length }) + '</span></div>'
                    : '') +
            '</div></div>' +

            /* Alt siparişler — her şirketin kendi kartı. */
            (orders.length
                ? '<div class="card mb-4">' +
                      '<div class="card__head"><h2 class="card__title">' +
                          t('orderPage.subOrders', 'Заказы') + '</h2></div>' +
                      '<div class="card__body">' + orders.map(orderCardHtml).join('') + '</div>' +
                  '</div>'
                : '') +

            payActionHtml(group, status, method, total) +
            bankSectionHtml(status, method) +
            backHtml();

        if (bankVisible(status, method)) {
            App.bank.render(document.getElementById('bank-list'), groupBlocks(group));
        }
    }

    /** Grubun şirket kırılımı — her alt sipariş bir şirket. */
    function groupBlocks(group) {
        var f = App.order.field;
        var orders = f(group, 'orders') || [];

        if (!orders.length) {
            return [{ code: f(group, 'erpSource') || '', label: App.model.erpLabel(f(group, 'erpSource')),
                      amount: parseFloat(f(group, 'totalAmount')) || 0 }];
        }

        return orders.map(function (o) {
            var code = f(o, 'erpSource') || '';
            return {
                code:   code,
                label:  App.model.erpLabel(code, f(o, 'erpSourceName')),
                amount: parseFloat(f(o, 'totalAmount')) || 0
            };
        });
    }

    function orderCardHtml(order) {
        var t = App.t;
        var f = App.order.field;

        var id     = f(order, 'orderId');
        var number = f(order, 'orderNumber') || id;
        var status = String(f(order, 'status') || 'pending').toLowerCase();
        var code   = f(order, 'erpSource');
        var items  = f(order, 'items') || [];

        return '<div class="erp-block">' +
                   '<div class="erp-block__head">' +
                       '<span class="erp-block__name">' +
                           App.utils.escape(App.model.erpLabel(code, f(order, 'erpSourceName'))) +
                       '</span>' +
                       '<span class="badge badge--' + App.order.statusTone(status) + '">' +
                           App.utils.escape(App.order.statusLabel(status)) + '</span>' +
                   '</div>' +
                   '<div class="erp-block__body">' +
                       '<div class="flex justify-b wrap gap-3 t-sm mb-3">' +
                           '<span>' + t('orderPage.orderNumber', 'Номер заказа') + ': <b>' +
                               App.utils.escape(String(number)) + '</b></span>' +
                           '<span>' + t('orderPage.total', 'Итого') + ': <b>' +
                               App.fmt.price(f(order, 'totalAmount')) + '</b></span>' +
                       '</div>' +
                       statusFlowHtml(status) +
                       (items.length ? itemsHtml(items) : '') +
                       '<a class="btn btn--ghost btn--sm mt-3" href="order.html?orderId=' +
                           encodeURIComponent(id) + '">' +
                           App.icon('external', 13) +
                           '<span>' + t('orderPage.view', 'Просмотр') + '</span>' +
                       '</a>' +
                   '</div>' +
               '</div>';
    }

    /* ============================================================
       TEK SİPARİŞ GÖRÜNÜMÜ
       ============================================================ */

    function renderOrder(data) {
        var t = App.t;
        var f = App.order.field;

        /* Sunucu bazen { Order, Items } sarmalar, bazen düz gönderir. */
        var order = f(data, 'order') || data;
        var items = f(data, 'items') || f(order, 'items') || [];

        var status  = String(f(order, 'status') || 'pending').toLowerCase();
        var payStat = String(f(order, 'paymentStatus') || 'pending').toLowerCase();
        var method  = String(f(order, 'paymentMethod') || '').toLowerCase();
        var total   = parseFloat(f(order, 'totalAmount')) || 0;
        var group   = f(order, 'groupId');

        root.innerHTML =
            '<div id="pay-banner"></div>' +

            heroHtml(t('orderPage.thankYou', 'Спасибо. Ваш заказ принят.'),
                     t('orderPage.orderNumber', 'Номер заказа'),
                     f(order, 'orderNumber') || f(order, 'orderId')) +

            '<div class="card mb-4"><div class="card__body">' +
                metaHtml([
                    [t('orderPage.date', 'Дата'),   App.fmt.date(f(order, 'createdAt'))],
                    [t('orderPage.total', 'Итого'), App.fmt.price(total)],
                    [t('orderPage.paymentMethod', 'Способ оплаты'), App.order.methodLabel(method)],
                    [t('orderPage.status', 'Статус'),
                     '<span class="badge badge--' + App.order.statusTone(status) + '">' +
                        App.utils.escape(App.order.statusLabel(status)) + '</span>'],
                    [t('orderPage.paymentStatus', 'Статус оплаты'),
                     '<span class="badge badge--' + App.order.paymentTone(payStat) + '">' +
                        App.utils.escape(App.order.paymentLabel(payStat)) + '</span>']
                ]) +
                statusFlowHtml(status) +
            '</div></div>' +

            (group
                ? '<div class="alert alert--info mb-4">' + App.icon('info', 15) +
                      '<span>' + t('orderPage.partOfPurchase', '', { count: '' }) + ' ' +
                      '<a href="order.html?groupId=' + encodeURIComponent(group) + '">' +
                          t('orderPage.viewWholePurchase', 'Посмотреть всю покупку') + '</a></span></div>'
                : '') +

            /* ---- kalemler ---- */
            '<div class="card mb-4">' +
                '<div class="card__head"><h2 class="card__title">' +
                    t('orderPage.orderDetails', 'Детали Заказа') + '</h2></div>' +
                '<div class="card__body">' +
                    (items.length ? itemsHtml(items)
                                  : '<p class="t-mut">' + t('orderPage.noItems', 'Товары не найдены') + '</p>') +
                    summaryHtml(order) +
                '</div>' +
            '</div>' +

            /* ---- kargo bilgisi ---- */
            trackingHtml(order) +

            /* ---- adresler ---- */
            addressesHtml(order) +

            payActionHtml(order, payStat, method, total) +
            bankSectionHtml(payStat, method) +
            backHtml();

        if (bankVisible(payStat, method)) {
            var code = f(order, 'erpSource') || '';
            App.bank.render(document.getElementById('bank-list'), [{
                code: code,
                label: App.model.erpLabel(code, f(order, 'erpSourceName')),
                amount: total
            }]);
        }
    }

    /* ============================================================
       PARÇALAR
       ============================================================ */

    function heroHtml(title, label, value) {
        return '<div class="order-hero">' +
                   '<span class="order-hero__icon">' + App.icon('check', 24) + '</span>' +
                   '<div class="grow">' +
                       '<h1>' + App.utils.escape(title) + '</h1>' +
                       '<div class="t-sm t-mut">' + App.utils.escape(label) + ': <b>' +
                           App.utils.escape(String(value || '—')) + '</b></div>' +
                   '</div>' +
               '</div>';
    }

    function metaHtml(rows) {
        return '<div class="order-meta">' + rows.map(function (r) {
            return '<div class="order-meta__item">' +
                       '<span class="order-meta__label">' + App.utils.escape(r[0]) + '</span>' +
                       '<span class="order-meta__value">' + r[1] + '</span>' +
                   '</div>';
        }).join('') + '</div>';
    }

    /** Sipariş ilerlemesi — iptal/iade durumunda çizilmez. */
    function statusFlowHtml(status) {
        if (status === 'cancelled' || status === 'refunded') return '';

        var index = App.order.FLOW.indexOf(status);
        if (index === -1) index = 0;

        return '<div class="oflow">' + App.order.FLOW.map(function (step, i) {
            var cls = i < index ? 'is-done' : (i === index ? 'is-current' : '');
            return '<div class="oflow__step ' + cls + '">' +
                       '<span class="oflow__dot">' + (i < index ? '✓' : (i + 1)) + '</span>' +
                       '<span class="oflow__label">' + App.utils.escape(App.order.statusLabel(step)) + '</span>' +
                   '</div>';
        }).join('') + '</div>';
    }

    function itemsHtml(items) {
        var t = App.t;
        return '<div class="table-scroll"><table class="table">' +
                   '<thead><tr>' +
                       '<th colspan="2">' + t('orderPage.product', 'Товар') + '</th>' +
                       '<th>' + t('cart.quantity', 'Количество') + '</th>' +
                       '<th class="t-right">' + t('orderPage.total', 'Итого') + '</th>' +
                   '</tr></thead>' +
                   '<tbody>' + items.map(function (item) {
                       var f = App.order.field;
                       var img = f(item, 'productImage') || f(item, 'mainImage') || App.config.FALLBACK_IMAGE;
                       var qty = parseInt(f(item, 'quantity'), 10) || 1;
                       var line = parseFloat(f(item, 'totalPrice'));
                       if (isNaN(line)) line = (parseFloat(f(item, 'unitPrice')) || 0) * qty;
                       /* FAZ 38 — sipariş anının kopyası: "24 × Комплект 29,7 кг (712,8 кг)".
                          Satış birimsiz (ya da FAZ 36 öncesi) kalemde yalnız adet. */
                       var unitLine = App.su.lineText(item);

                       return '<tr>' +
                                  '<td style="width:74px"><img class="cart-item__img" ' +
                                      'src="' + App.utils.escape(img) + '" alt="" loading="lazy" ' +
                                      'onerror="this.src=\'' + App.config.FALLBACK_IMAGE + '\'"></td>' +
                                  '<td><span class="cart-item__name">' +
                                      App.fmt.preserveSpaces(App.utils.escape(f(item, 'productName') || '')) +
                                      '</span></td>' +
                                  '<td>' + (unitLine ? App.utils.escape(unitLine) : qty) + '</td>' +
                                  '<td class="t-right t-bold">' + App.fmt.price(line) + '</td>' +
                              '</tr>';
                   }).join('') + '</tbody>' +
               '</table></div>';
    }

    function summaryHtml(order) {
        var t = App.t;
        var f = App.order.field;

        var sub      = parseFloat(f(order, 'subTotal') || f(order, 'subtotal'));
        var shipping = parseFloat(f(order, 'shippingCost')) || 0;
        var discount = parseFloat(f(order, 'discountAmount')) || 0;
        var total    = parseFloat(f(order, 'totalAmount')) || 0;

        return '<div class="mt-4" style="max-width:340px;margin-left:auto">' +
                   (isNaN(sub) ? '' :
                       '<div class="summary__row"><span>' + t('orderPage.subtotal', 'Промежуточный итог') +
                       '</span><b>' + App.fmt.price(sub) + '</b></div>') +
                   '<div class="summary__row"><span>' + t('orderPage.shipping', 'Доставка') +
                       '</span><b>' + (shipping ? App.fmt.price(shipping) : App.t('common.free', '—')) + '</b></div>' +
                   (discount
                       ? '<div class="summary__row"><span>' + t('orderPage.discount', 'Скидка') +
                         '</span><b class="t-deal">−' + App.fmt.price(discount) + '</b></div>'
                       : '') +
                   '<div class="summary__total"><span>' + t('orderPage.total', 'Итого') +
                       '</span><b>' + App.fmt.price(total) + '</b></div>' +
               '</div>';
    }

    /** Kargo bilgisi — yalnız sunucu doldurduysa çizilir. */
    function trackingHtml(order) {
        var t = App.t;
        var f = App.order.field;

        var company  = f(order, 'shippingCompany');
        var tracking = f(order, 'trackingNumber');
        var shipped  = f(order, 'shippedAt');
        var delivered= f(order, 'deliveredAt');

        if (!company && !tracking && !shipped && !delivered) return '';

        var rows = [];
        if (company)   rows.push([t('orderPage.shippingCompany', 'Служба доставки'), App.utils.escape(company)]);
        if (tracking)  rows.push([t('orderPage.trackingNumber', 'Трек-номер'),
                                  '<span class="t-mono">' + App.utils.escape(tracking) + '</span>']);
        if (shipped)   rows.push([t('orderPage.shippedAt', 'Отправлен'), App.fmt.dateTime(shipped)]);
        if (delivered) rows.push([t('orderPage.deliveredAt', 'Доставлен'), App.fmt.dateTime(delivered)]);

        return '<div class="card mb-4">' +
                   '<div class="card__head"><h2 class="card__title">' +
                       t('orderPage.shippingCompany', 'Доставка') + '</h2></div>' +
                   '<div class="card__body">' + metaHtml(rows) + '</div>' +
               '</div>';
    }

    function addressesHtml(order) {
        var t = App.t;
        var f = App.order.field;

        var shipping = f(order, 'shippingAddress');
        var billing  = f(order, 'billingAddress');
        if (!shipping && !billing) return '';

        return '<div class="card mb-4"><div class="card__body">' +
                   '<div class="grid grid--2 gap-4">' +
                       box(t('orderPage.shippingAddress', 'Адрес доставки'), shipping) +
                       box(t('orderPage.billingAddress', 'Адрес для счета'), billing) +
                   '</div>' +
               '</div></div>';

        function box(label, addr) {
            if (!addr) return '';
            var text = typeof addr === 'string' ? addr : [
                f(addr, 'firstName') + ' ' + (f(addr, 'lastName') || ''),
                f(addr, 'addressLine1'), f(addr, 'addressLine2'),
                f(addr, 'district'), f(addr, 'city'),
                f(addr, 'postalCode'), f(addr, 'country'), f(addr, 'phone')
            ].filter(function (p) { return p && String(p).trim(); }).join(', ');

            return '<div>' +
                       '<div class="label">' + App.utils.escape(label) + '</div>' +
                       '<div class="addr-card t-sm">' + App.utils.escape(text) + '</div>' +
                   '</div>';
        }
    }

    /* ---------- ödemeyi tamamla ---------- */

    function payActionHtml(source, payStatus, method, amount) {
        /* Havale modunda ePay'e HİÇ gidilmez. */
        if (paymentMode === App.const.PAYMENT_MODE_TRANSFER_ONLY) return '';
        if (method !== App.const.PAY_CARD && method !== 'credit_card') return '';
        if (payStatus === 'paid' || payStatus === 'refunded') return '';
        if (!(amount > 0)) return '';

        var f = App.order.field;
        return '<div class="card mb-4"><div class="card__body flex items-c justify-b wrap gap-3">' +
                   '<div>' +
                       '<div class="t-bold t-hi">' + App.t('checkout.totalPayment', 'Сумма к оплате') + '</div>' +
                       '<div class="t-sm t-mut">' + App.fmt.price(amount) + '</div>' +
                   '</div>' +
                   '<button class="btn btn--primary btn--lg" type="button" data-act="complete-payment" ' +
                           'data-order="' + App.utils.escape(String(f(source, 'orderId') || '')) + '" ' +
                           'data-group="' + App.utils.escape(String(f(source, 'groupId') || '')) + '" ' +
                           'data-amount="' + amount + '">' +
                       App.icon('credit', 16) +
                       '<span>' + App.t('checkout.placeOrder', 'Оплатить') + '</span>' +
                   '</button>' +
               '</div></div>';
    }

    /* ---------- havale rekvizitleri ---------- */

    function bankVisible(payStatus, method) {
        if (payStatus === 'paid' || payStatus === 'refunded') return false;
        return method === App.const.PAY_TRANSFER ||
               method === App.const.PAY_APPROVAL ||
               paymentMode === App.const.PAYMENT_MODE_TRANSFER_ONLY;
    }

    function bankSectionHtml(payStatus, method) {
        if (!bankVisible(payStatus, method)) return '';

        return '<div class="card mb-4">' +
                   '<div class="card__head"><h2 class="card__title">' +
                       App.t('checkout.bankDetails.title', 'Оплата банковским переводом') + '</h2></div>' +
                   '<div class="card__body">' +
                       '<p class="t-sm t-mut">' + App.t('orderPage.bankTransferNote', '') + '</p>' +
                       '<div id="bank-list"></div>' +
                   '</div>' +
               '</div>';
    }

    function backHtml() {
        return '<div class="flex gap-3 wrap">' +
                   '<a class="btn btn--ghost" href="my-account.html?tab=orders">' +
                       App.icon('arrowLeft', 14) +
                       '<span>' + App.t('orderPage.backToOrders', 'Вернуться к заказам') + '</span></a>' +
                   '<a class="btn btn--steel" href="shop.html">' +
                       App.t('checkout.messages.continueShopping', 'Продолжить покупки') + '</a>' +
               '</div>';
    }

    function guard(message) {
        return '<div class="card"><div class="empty">' +
                   '<div class="empty__icon">' + App.icon('warning', 24) + '</div>' +
                   '<h2 class="empty__title">' + App.utils.escape(message) + '</h2>' +
                   '<a class="btn btn--primary" href="my-account.html?tab=orders">' +
                       App.t('orderPage.backToOrders', 'Заказы') + '</a>' +
               '</div></div>';
    }

    function loading() {
        return '<div class="flex justify-c" style="padding:60px"><span class="spinner spinner--lg"></span></div>';
    }

    /* ============================================================
       ÖDEME TAKİBİ (ePay dönüşü)
       ============================================================ */

    function banner(state) {
        var box = document.getElementById('pay-banner');
        if (!box) return;

        var map = {
            ok:   { cls: 'ok',   icon: 'check',   key: 'orderPage.paymentSuccess' },
            wait: { cls: 'wait', icon: 'clock',   key: 'orderPage.paymentVerifying' },
            fail: { cls: 'fail', icon: 'warning', key: 'orderPage.paymentFailed' }
        };
        var conf = map[state] || map.wait;

        box.innerHTML = '<div class="pay-banner pay-banner--' + conf.cls + '">' +
                            App.icon(conf.icon, 20) +
                            '<span>' + App.t(conf.key, '') + '</span>' +
                        '</div>';
    }

    /**
     * PostLink birkaç saniye gecikebilir; 'paid' olana kadar sorulur.
     * 8 deneme × 3 sn ≈ 24 sn — bankanın tipik gecikmesinin üstünde.
     */
    async function trackPayment() {
        if (epay === 'fail') { banner('fail'); return; }

        banner('wait');

        var attempts = 0;

        (async function poll() {
            var status = 'pending';

            try {
                if (groupId) {
                    var group = await App.order.getGroup(groupId);
                    if (group) {
                        current = group;
                        status = String(App.order.field(group, 'paymentStatus') || 'pending').toLowerCase();
                        renderGroup(group);
                    }
                } else {
                    var data = await App.order.getById(orderId);
                    if (data) {
                        current = data;
                        var order = App.order.field(data, 'order') || data;
                        status = String(App.order.field(order, 'paymentStatus') || 'pending').toLowerCase();
                        renderOrder(data);
                    }
                }
            } catch (e) { /* geçici hata → tekrar denenir */ }

            banner(status === 'paid' ? 'ok' : (status === 'failed' ? 'fail' : 'wait'));

            if (status === 'paid' || status === 'failed') return;
            if (++attempts < 8) setTimeout(poll, 3000);
        })();
    }

    /** `?pay=1` ile gelindiyse ödemeyi kendiliğinden başlat. */
    function autoPay() {
        var f = App.order.field;
        var source = current && (f(current, 'order') || current);
        if (!source) return;

        var status = String(f(source, 'paymentStatus') || '').toLowerCase();
        var method = String(f(source, 'paymentMethod') || '').toLowerCase();
        var amount = Math.round(parseFloat(f(source, 'totalAmount')) || 0);

        if (method !== App.const.PAY_CARD && method !== 'credit_card') return;
        if (status === 'paid' || status === 'refunded' || amount <= 0) return;

        App.pay.start({
            orderId: groupId ? null : (f(source, 'orderId') || orderId),
            groupId: groupId || f(source, 'groupId') || null,
            amount:  amount
        });
    }

    App.actions.register('complete-payment', function (btn) {
        return App.actions.lock(btn, App.pay.start({
            orderId: btn.dataset.group ? null : btn.dataset.order,
            groupId: btn.dataset.group || null,
            amount:  parseFloat(btn.dataset.amount) || 0
        }));
    });
});
