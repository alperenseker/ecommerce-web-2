/* ============================================================
   pages/account-orders.js — SİPARİŞ LİSTESİ (hesap sekmesi)
   ------------------------------------------------------------
   Liste ALIŞVERİŞ (sipariş grubu) başına sayfalanır: bir ödeme
   şirket başına bir sipariş doğurduğu için grup başlığının altında
   N satır görünür — her satır bir şirketin siparişidir.

   Detay satırı TALEP ÜZERİNE açılır (accordion): 40 siparişin
   kalemlerini önden çekmek hem yavaş hem gereksiz.

   🔴 `transfer_only` modunda "Ödemeyi tamamla" düğmesi çizilmez:
   sunucu ePay ucuna 409 döndürüyor.
   ============================================================ */

(function (App) {
    'use strict';

    var Orders = {};

    var PER_PAGE = 10;
    var groups = [];
    var page = 1;
    var mode = 'gateway';
    var host = null;
    var details = {};      // orderId → kalemler (bir kez çekilir)

    /* ------------------------------------------------------------
       YÜKLE + ÇİZ
       ------------------------------------------------------------ */

    Orders.mount = async function (container) {
        host = container;
        if (!host) return;

        host.innerHTML = '<div class="flex justify-c" style="padding:40px">' +
                         '<span class="spinner spinner--lg"></span></div>';

        mode = (await App.auth.publicSettings()).paymentMode;
        groups = await App.order.listGroups();

        Orders.render();
    };

    Orders.render = function () {
        if (!host) return;
        var t = App.t;

        if (!groups.length) {
            host.innerHTML =
                '<div class="empty">' +
                    '<div class="empty__icon">' + App.icon('box', 24) + '</div>' +
                    '<h3 class="empty__title">' + t('account.orders.noOrders', 'Заказы не найдены') + '</h3>' +
                    '<a class="btn btn--primary" href="shop.html">' +
                        t('account.orders.goShop', 'Перейти в магазин') + '</a>' +
                '</div>';
            return;
        }

        var totalPages = Math.max(1, Math.ceil(groups.length / PER_PAGE));
        if (page > totalPages) page = totalPages;

        var slice = groups.slice((page - 1) * PER_PAGE, page * PER_PAGE);

        host.innerHTML =
            slice.map(groupHtml).join('') +
            (totalPages > 1 ? pagerHtml(totalPages) : '');
    };

    /* ------------------------------------------------------------
       PARÇALAR
       ------------------------------------------------------------ */

    function groupHtml(group) {
        var t = App.t;
        var f = App.order.field;

        var groupId = f(group, 'groupId');
        var number  = f(group, 'groupNumber') || groupId;
        var orders  = f(group, 'orders') || [];
        var payStat = String(f(group, 'paymentStatus') || 'pending').toLowerCase();
        var total   = parseFloat(f(group, 'totalAmount')) || 0;
        var method  = String(f(group, 'paymentMethod') || '').toLowerCase();

        return '<div class="ogroup">' +

                   '<div class="ogroup__head">' +
                       '<div>' +
                           '<div class="ogroup__num">' + t('orderPage.purchaseNumber', 'Номер покупки') +
                               ': ' + App.utils.escape(String(number)) + '</div>' +
                           '<div class="t-xs t-dim">' + App.fmt.date(f(group, 'createdAt')) +
                               (orders.length > 1
                                   ? ' · ' + t('account.orders.ordersInPurchase', '', { count: orders.length })
                                   : '') +
                           '</div>' +
                       '</div>' +
                       '<div class="flex items-c gap-3 wrap">' +
                           '<span class="badge badge--' + App.order.paymentTone(payStat) + '">' +
                               App.utils.escape(App.order.paymentLabel(payStat)) + '</span>' +
                           '<b style="color:var(--price)">' + App.fmt.price(total) + '</b>' +
                           '<a class="btn btn--ghost btn--sm" href="order.html?groupId=' +
                               encodeURIComponent(groupId) + '">' +
                               t('account.orders.view', 'Просмотр') + '</a>' +
                           payButton(groupId, payStat, method, total) +
                       '</div>' +
                   '</div>' +

                   (orders.length ? orders.map(function (o) { return rowHtml(o, orders.length); }).join('')
                                  : rowHtml(group, 1)) +
               '</div>';
    }

    function rowHtml(order, siblings) {
        var t = App.t;
        var f = App.order.field;

        var orderId = f(order, 'orderId');
        var status  = String(f(order, 'status') || 'pending').toLowerCase();
        var code    = f(order, 'erpSource');

        return '<div class="ogroup__row" data-order-row="' + App.utils.escape(String(orderId)) + '">' +
                   '<div class="flex items-c gap-3 wrap grow">' +
                       (siblings > 1
                           ? '<span class="badge">' +
                                 App.utils.escape(App.model.erpLabel(code, f(order, 'erpSourceName'))) + '</span>'
                           : '') +
                       '<span class="t-mono t-xs t-dim">' +
                           App.utils.escape(String(f(order, 'orderNumber') || orderId || '')) + '</span>' +
                       '<span class="badge badge--' + App.order.statusTone(status) + '">' +
                           App.utils.escape(App.order.statusLabel(status)) + '</span>' +
                   '</div>' +
                   '<div class="flex items-c gap-3">' +
                       '<b>' + App.fmt.price(f(order, 'totalAmount')) + '</b>' +
                       '<button class="btn btn--plain btn--sm" type="button" ' +
                               'data-act="order-details" data-id="' + App.utils.escape(String(orderId)) + '">' +
                           App.icon('chevronDown', 13) +
                           '<span>' + t('account.orders.detail.orderItems', 'Товары') + '</span>' +
                       '</button>' +
                   '</div>' +
               '</div>' +
               '<div class="ogroup__row hidden" data-order-detail="' + App.utils.escape(String(orderId)) + '"></div>';
    }

    /** Kart ile açılmış ve ödenmemiş siparişte "ödemeyi tamamla". */
    function payButton(groupId, payStatus, method, amount) {
        if (mode === App.const.PAYMENT_MODE_TRANSFER_ONLY) return '';
        if (payStatus === 'paid' || payStatus === 'refunded') return '';
        if (method && method !== App.const.PAY_CARD && method !== 'credit_card') return '';
        if (!(amount > 0)) return '';

        return '<button class="btn btn--primary btn--sm" type="button" data-act="pay-group" ' +
                       'data-group="' + App.utils.escape(String(groupId)) + '" data-amount="' + amount + '">' +
                   App.icon('credit', 13) +
                   '<span>' + App.t('checkout.placeOrder', 'Оплатить') + '</span>' +
               '</button>';
    }

    function pagerHtml(totalPages) {
        var out = [];
        for (var i = 1; i <= totalPages; i++) {
            out.push('<button class="pager__btn' + (i === page ? ' is-active' : '') + '" type="button" ' +
                     'data-act="orders-page" data-page="' + i + '">' + i + '</button>');
        }
        return '<div class="pager mt-4">' + out.join('') + '</div>';
    }

    /* ------------------------------------------------------------
       EYLEMLER
       ------------------------------------------------------------ */

    App.actions.register('orders-page', function (btn) {
        page = parseInt(btn.dataset.page, 10) || 1;
        Orders.render();
        App.utils.scrollTop(0);
    });

    App.actions.register('pay-group', function (btn) {
        return App.actions.lock(btn, App.pay.startForGroup(
            btn.dataset.group, parseFloat(btn.dataset.amount) || 0));
    });

    /** Detay satırını aç/kapa; kalemler bir kez çekilir. */
    App.actions.register('order-details', async function (btn) {
        var id = btn.dataset.id;
        var box = document.querySelector('[data-order-detail="' + CSS.escape(id) + '"]');
        if (!box) return;

        if (!box.classList.contains('hidden')) { box.classList.add('hidden'); return; }

        box.classList.remove('hidden');

        if (details[id]) { box.innerHTML = detailHtml(details[id]); return; }

        box.innerHTML = '<div class="flex justify-c" style="padding:16px;width:100%">' +
                        '<span class="spinner"></span></div>';

        try {
            var data = await App.order.getById(id);
            var order = App.order.field(data, 'order') || data;
            details[id] = App.order.field(data, 'items') || App.order.field(order, 'items') || [];
            box.innerHTML = detailHtml(details[id]);
        } catch (e) {
            box.innerHTML = '<div class="t-sm t-err">' +
                App.t('account.orders.detail.errorLoading', 'Ошибка загрузки') + '</div>';
        }
    });

    function detailHtml(items) {
        var t = App.t;

        if (!items.length) {
            return '<div class="t-sm t-mut">' + t('orderPage.noItems', 'Товары не найдены') + '</div>';
        }

        return '<div style="width:100%">' + items.map(function (item) {
            var f = App.order.field;
            var img = f(item, 'productImage') || f(item, 'mainImage') || App.config.FALLBACK_IMAGE;
            var qty = parseInt(f(item, 'quantity'), 10) || 1;
            var line = parseFloat(f(item, 'totalPrice'));
            if (isNaN(line)) line = (parseFloat(f(item, 'unitPrice')) || 0) * qty;
            /* FAZ 38 — sipariş anının kopyası: "24 × Комплект 29,7 кг (712,8 кг)". */
            var unitLine = App.su.lineText(item);

            return '<div class="co-line">' +
                       '<img src="' + App.utils.escape(img) + '" alt="" loading="lazy" ' +
                            'onerror="this.src=\'' + App.config.FALLBACK_IMAGE + '\'">' +
                       '<div class="grow">' +
                           '<div class="t-clamp-2 t-sm">' +
                               App.fmt.preserveSpaces(App.utils.escape(f(item, 'productName') || '')) + '</div>' +
                           '<div class="co-line__qty">' +
                               (unitLine
                                   ? App.utils.escape(unitLine) + ' · ' + App.fmt.price(f(item, 'unitPrice')) +
                                     ' / ' + App.utils.escape(App.su.info(item).name)
                                   : qty + ' × ' + App.fmt.price(f(item, 'unitPrice'))) +
                           '</div>' +
                       '</div>' +
                       '<span class="co-line__sum">' + App.fmt.price(line) + '</span>' +
                   '</div>';
        }).join('') + '</div>';
    }

    App.accountOrders = Orders;

})(window.App);
