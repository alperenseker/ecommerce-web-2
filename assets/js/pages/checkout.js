/* ============================================================
   pages/checkout.js — ÖDEME SAYFASI
   ------------------------------------------------------------
   BİR ÖDEME = BİR GRUP + ŞİRKET BAŞINA BİR SİPARİŞ.
   Sepette iki şirketin ürünü varsa sunucu siparişi ikiye böler;
   ikisi de aynı `GroupId` altında toplanır ve TEK çekimle ödenir.
   Müşteri bunu daha ödeme ekranında görür — sürpriz olmasın.

   ÖDEME DALLARI
   ─────────────
   • `transfer_only` (genel anahtar) → herkes havale yapar, kart
     ekranına HİÇ gidilmez (sunucu ePay ucuna 409 döner).
   • kredili müşteri (HasCreditLine) → sipariş `pending_approval`
     ile açılır, yönetici onaylar; rekvizitler ekranda gösterilir.
   • diğer herkes → kart (Halyk ePay) / havale / kapıda ödeme.

   🔴 "Özel kullanıcı" ayrımı `HasCreditLine`e bakar, CanBypassPayment'a
   DEĞİL: `transfer_only` modunda sunucu CanBypassPayment'ı HERKES için
   true döndürüyor; ona bakan kod minimum sipariş tutarı kontrolünü
   tümden düşürür.
   ============================================================ */

App.definePage('checkout', async function (ctx) {

    var root = document.getElementById('checkout-root');

    /* Girişsiz kullanıcı ödeme yapamaz. */
    if (!App.auth.isLoggedIn()) {
        window.location.replace('login.html?redirect=checkout.html');
        return;
    }

    root.innerHTML = loading();

    await ctx.catalog;
    await ctx.user;

    /* ---- sayfa ömrü boyunca sabit kalan durum ---- */
    var settings     = await App.auth.publicSettings();
    var paymentMode  = settings.paymentMode;
    var hasCreditLine = false;
    var canBypass     = false;
    var userLimits    = null;
    var addresses     = { shipping: null, billing: null };

    if (App.cart.isEmpty()) { renderEmpty(); return; }

    userLimits = await checkLimits();
    addresses  = await App.address.pair();

    render();

    App.bus.on(App.bus.EVENTS.CART_CHANGED, function () {
        if (App.cart.isEmpty()) renderEmpty(); else render();
    });
    App.bus.on(App.bus.EVENTS.LANG_CHANGED, function () { App.i18n.apply(); render(); });

    /* ============================================================
       LİMİT KONTROLÜ
       ============================================================ */

    /**
     * Kredi limiti / minimum sipariş tutarı kontrolü.
     * Ayarlar okunamazsa EN AZ KISITLAYICI yola gidilir (minimum 0):
     * bir ağ hatası müşterinin sipariş vermesini engellememeli.
     */
    async function checkLimits() {
        var userId = App.auth.userId();

        try {
            var res = await App.api.user.getSettings(userId);
            if (!res.success || !res.data) return { canProceed: true };

            var s = res.data;
            canBypass     = s.CanBypassPayment === true;
            hasCreditLine = s.HasCreditLine === true;

            App.store.set(App.keys.CAN_BYPASS_PAYMENT, String(canBypass));

            var special = hasCreditLine || s.CanOrderWithoutStock === true;
            if (special) return creditCheck(s);

            /* Kredisi olmayan müşteride minimum tutar kontrolü
               `transfer_only` modunda DA koşar. */
            return minimumCheck(parseFloat(s.MinimumOrderAmount) || 0);

        } catch (e) {
            console.warn('Kullanıcı limitleri okunamadı:', e && e.message);
            return { canProceed: true };
        }
    }

    function creditCheck(s) {
        var total     = App.cart.total();
        var limit     = parseFloat(s.CreditLimit) || 0;
        var used      = parseFloat(s.UsedCredit) || 0;
        var available = limit - used;

        if (limit === 0) {
            return { canProceed: true, special: true, limit: 0, used: 0, available: 0, total: total };
        }

        if (total > available) {
            return {
                canProceed: false, special: true,
                limit: limit, used: used, available: available, total: total,
                error: App.t('jslanguage.insufficientCredit',
                    'Kredi limiti yetersiz: {cartTotal} / {available}')
                    .replace('{cartTotal}', App.fmt.price(total))
                    .replace('{available}', App.fmt.price(available))
            };
        }

        return { canProceed: true, special: true, limit: limit, used: used, available: available, total: total };
    }

    function minimumCheck(minimum) {
        var total = App.cart.total();
        if (!minimum) return { canProceed: true, special: false, minimum: 0, total: total };

        if (total < minimum) {
            return {
                canProceed: false, special: false, minimum: minimum, total: total,
                error: App.t('jslanguage.minimumOrderError',
                    'Minimum sipariş tutarı {min}; {remaining} eksik.')
                    .replace('{min}', App.fmt.price(minimum))
                    .replace('{remaining}', App.fmt.price(minimum - total))
            };
        }
        return { canProceed: true, special: false, minimum: minimum, total: total };
    }

    /** Havale rekvizitleri gösterilmeli mi (iki bağımsız sebep). */
    function showBankTransfer() {
        return hasCreditLine || paymentMode === App.const.PAYMENT_MODE_TRANSFER_ONLY;
    }

    /* ============================================================
       ÇİZİM
       ============================================================ */

    function render() {
        var t = App.t;
        var groups = App.cart.groups();

        root.innerHTML =
            '<div class="checkout-layout">' +

                '<div>' +
                    /* ---- adres ---- */
                    '<div class="card mb-4">' +
                        '<div class="card__head">' +
                            '<h2 class="card__title">' + t('checkout.shippingAddress', 'Адрес доставки') + '</h2>' +
                        '</div>' +
                        '<div class="card__body" id="addr-section"></div>' +
                    '</div>' +

                    /* ---- ürünler ---- */
                    '<div class="card mb-4">' +
                        '<div class="card__head">' +
                            '<h2 class="card__title">' + t('checkout.yourOrder', 'Ваш заказ') + '</h2>' +
                            '<span class="badge">' + App.cart.count() + '</span>' +
                        '</div>' +
                        '<div class="card__body">' +
                            (groups.length > 1 ? splitNote(groups.length) : '') +
                            groups.map(groupHtml).join('') +
                        '</div>' +
                    '</div>' +

                    /* ---- ödeme yöntemi ---- */
                    '<div class="card mb-4">' +
                        '<div class="card__head">' +
                            '<h2 class="card__title">' + t('checkout.paymentMethods', 'Способы оплаты') + '</h2>' +
                        '</div>' +
                        '<div class="card__body">' + paymentHtml() + '</div>' +
                    '</div>' +

                    /* ---- havale rekvizitleri ---- */
                    (showBankTransfer()
                        ? '<div class="card mb-4" id="bank-section">' +
                              '<div class="card__head">' +
                                  '<h2 class="card__title">' +
                                      t('checkout.bankDetails.title', 'Оплата банковским переводом') + '</h2>' +
                              '</div>' +
                              '<div class="card__body">' +
                                  '<p class="t-sm t-mut" id="bank-note">' +
                                      t(hasCreditLine ? 'checkout.bankDetails.note'
                                                      : 'checkout.bankDetails.transferOnlyNote', '') +
                                  '</p>' +
                                  '<div id="bank-list"></div>' +
                              '</div>' +
                          '</div>'
                        : '') +

                    /* ---- not + kupon ---- */
                    '<div class="card">' +
                        '<div class="card__body">' +
                            '<div class="field">' +
                                '<label class="label" for="order-notes">' +
                                    t('checkout.orderNotes', 'Примечания к заказу') + '</label>' +
                                '<textarea class="textarea" id="order-notes" ' +
                                          'placeholder="' + t('checkout.orderNotesPlaceholder', '') + '"></textarea>' +
                            '</div>' +
                            '<div class="field mb-0">' +
                                '<label class="label" for="coupon-code">' +
                                    t('checkout.couponCode', 'Код купона') + '</label>' +
                                '<div class="flex gap-2">' +
                                    '<input class="input" id="coupon-code" type="text" ' +
                                           'placeholder="' + t('checkout.enterCode', 'Введите код') + '">' +
                                    '<button class="btn btn--ghost" type="button" data-act="apply-coupon">' +
                                        t('checkout.applyCoupon', 'Применить') + '</button>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +

                summaryHtml() +
            '</div>';

        App.addressUi.render(document.getElementById('addr-section'), addresses, async function () {
            addresses = await App.address.pair();
            render();
        });

        if (showBankTransfer()) {
            App.bank.render(document.getElementById('bank-list'), erpBlocks());
        }

        bindPaymentPicks();
    }

    /** Sepetin şirket kırılımı — rekvizitler ile ürün listesi ayrışmasın. */
    function erpBlocks() {
        return App.cart.groups().map(function (g) {
            return { code: g.code, label: g.label, amount: g.subtotal };
        });
    }

    function splitNote(count) {
        return '<div class="alert alert--info mb-3">' + App.icon('info', 15) +
                   '<span>' + App.t('checkout.splitNote', '', { count: count }) + '</span>' +
               '</div>';
    }

    function groupHtml(group) {
        var many = App.cart.groups().length > 1;

        return (many
            ? '<div class="erp-block">' +
                  '<div class="erp-block__head">' +
                      '<span class="erp-block__name">' + App.utils.escape(group.label) + '</span>' +
                      '<span class="t-bold">' + App.fmt.price(group.subtotal) + '</span>' +
                  '</div>' +
                  '<div class="erp-block__body">' + group.items.map(lineHtml).join('') + '</div>' +
              '</div>'
            : group.items.map(lineHtml).join(''));
    }

    function lineHtml(item) {
        var img = item.ProductImageUrl || item.MainImage || item.ProductImage || App.config.FALLBACK_IMAGE;
        var unitLine = App.su.lineText(item);
        var gone = App.rules.isCartItemUnavailable(item);

        return '<div class="co-line' + (gone ? ' is-unavailable' : '') + '">' +
                   '<img src="' + App.utils.escape(img) + '" alt="" loading="lazy" ' +
                        'onerror="this.src=\'' + App.config.FALLBACK_IMAGE + '\'">' +
                   '<div class="grow">' +
                       '<div class="t-clamp-2">' +
                           App.fmt.preserveSpaces(App.utils.escape(item.ProductName || '')) + '</div>' +
                       /* FAZ 38 — "48 × Комплект 33 кг (1 584 кг)" (taban miktar sunucudan). */
                       '<div class="co-line__qty">' +
                           (unitLine
                               ? App.utils.escape(unitLine) + ' · ' + App.fmt.price(item.UnitPrice) +
                                 ' / ' + App.utils.escape(App.su.info(item).name)
                               : (parseInt(item.Quantity, 10) || 1) + ' × ' + App.fmt.price(item.UnitPrice)) +
                       '</div>' +
                       (gone
                           ? '<div class="unavailable-note">' + App.icon('warning', 12) + '<span>' +
                                 App.utils.escape(App.t('customerRules.productUnavailable',
                                     'This product is no longer available.')) + '</span>' +
                                 '<button class="btn btn--link btn--sm" type="button" data-act="cart-remove" ' +
                                         'data-id="' + item.CartItemId + '">' +
                                     App.t('common.remove', 'Убрать') + '</button>' +
                             '</div>'
                           : '') +
                   '</div>' +
                   '<span class="co-line__sum">' +
                       (gone ? '<span class="t-dim">—</span>' : App.fmt.price(App.cart.lineTotal(item))) +
                   '</span>' +
               '</div>';
    }

    /**
     * FAZ 44 — sepette artık görünmeyen kalem varken sipariş verilemez
     * (sunucu da 404 product_unavailable ile reddeder). Kapı ekranda
     * önceden, adlarla ve kullanıcının dilinde görünür.
     */
    function unavailableBlockHtml() {
        var note = App.rules.unavailableCartText(App.cart.items);
        if (!note) return '';
        return '<div class="alert alert--danger mt-3">' + App.icon('warning', 15) +
                   '<span>' + App.utils.escape(note) + '</span></div>';
    }

    /**
     * Sipariş reddinin kullanıcıya gösterilecek metni (sunucu mesajı tek
     * dilde). FAZ 44: gizlenen kalemler (adlarla) → sepet tazelenir, kalemler
     * "недоступен" olarak görünür. FAZ 38: min / adım / bayat sepet / stok →
     * çevrilmiş; bayat sepette sepet sunucudan yenilenir (GET fiyatı tazeler).
     * Tanınmayan hatada sunucunun metni (bugünkü davranış).
     */
    function orderErrorText(error) {
        var gone = App.rules.unavailableOrderText(error);
        if (gone) {
            App.cart.load();
            return gone;
        }

        if (error && error.errorCode === 'cart_stale') App.cart.load();

        var unit = App.su.errorMessage(error, null);
        if (unit) return unit;

        if (error && error.errorCode === 'insufficient_stock') {
            return App.t('salesUnit.errors.insufficientStockNoQty', 'Not enough stock for the requested quantity.');
        }
        return (error && error.message) || '';
    }

    /* ---------- ödeme yöntemleri ---------- */

    function paymentHtml() {
        var t = App.t;

        /* Genel anahtar havaleye alınmışsa tek seçenek vardır. */
        if (paymentMode === App.const.PAYMENT_MODE_TRANSFER_ONLY) {
            return pick(App.const.PAY_TRANSFER, 'wallet',
                        'checkout.bankTransfer', 'checkout.bankTransferText', true) +
                   '<div class="alert alert--info mt-3">' + App.icon('info', 15) +
                       '<span>' + t('checkout.bankDetails.transferOnlyNote', '') + '</span></div>';
        }

        /* Kredili müşteri yöneticinin onayına gider. */
        if (hasCreditLine) {
            return pick(App.const.PAY_APPROVAL, 'shield',
                        'orderPage.paymentPendingApproval', 'checkout.bankTransferText', true);
        }

        return pick(App.const.PAY_CARD, 'credit',
                    'checkout.creditCard', 'checkout.creditCardText', true) +
               pick(App.const.PAY_TRANSFER, 'wallet',
                    'checkout.bankTransfer', 'checkout.bankTransferText', false) +
               pick(App.const.PAY_COD, 'truck',
                    'checkout.cashOnDelivery', 'checkout.cashOnDeliveryText', false);

        function pick(value, icon, titleKey, descKey, checked) {
            return '<label class="pick' + (checked ? ' is-active' : '') + '">' +
                       '<input type="radio" name="payment-method" value="' + value + '"' +
                              (checked ? ' checked' : '') + ' hidden>' +
                       '<span class="pick__icon">' + App.icon(icon, 20) + '</span>' +
                       '<span class="grow">' +
                           '<span class="pick__title">' + t(titleKey, value) + '</span>' +
                           '<span class="pick__desc">' + t(descKey, '') + '</span>' +
                       '</span>' +
                   '</label>';
        }
    }

    function bindPaymentPicks() {
        App.utils.$$('input[name="payment-method"]').forEach(function (radio) {
            radio.addEventListener('change', function () {
                App.utils.$$('.pick').forEach(function (pickEl) {
                    var input = pickEl.querySelector('input[name="payment-method"]');
                    if (input) pickEl.classList.toggle('is-active', input.checked);
                });
            });
        });
    }

    /* ---------- özet ---------- */

    function summaryHtml() {
        var t = App.t;
        var unavailable = App.cart.unavailableItems().length > 0;
        var blocked = (userLimits && userLimits.canProceed === false) || unavailable;

        return '<aside class="card summary">' +
                   '<div class="card__head">' +
                       '<h3 class="card__title">' + t('checkout.yourOrder', 'Ваш заказ') + '</h3>' +
                   '</div>' +
                   '<div class="card__body">' +

                       creditBoxHtml() +

                       '<div class="summary__row">' +
                           '<span>' + t('checkout.subtotal', 'Промежуточный итог') + '</span>' +
                           '<b>' + App.fmt.price(App.cart.total()) + '</b>' +
                       '</div>' +
                       '<div class="summary__row">' +
                           '<span>' + t('checkout.shipping', 'Доставка') + '</span>' +
                           '<span class="t-xs t-dim">' + t('cart.shippingCalc', '') + '</span>' +
                       '</div>' +
                       '<div class="summary__total">' +
                           '<span>' + t('checkout.total', 'Итого') + '</span>' +
                           '<b>' + App.fmt.price(App.cart.total()) + '</b>' +
                       '</div>' +

                       (userLimits && userLimits.canProceed === false
                           ? '<div class="alert alert--danger mt-3">' + App.icon('warning', 15) +
                                 '<span>' + App.utils.escape(userLimits.error) + '</span></div>'
                           : '') +

                       unavailableBlockHtml() +
                   '</div>' +

                   '<div class="card__foot flex-col gap-2">' +
                       '<button class="btn btn--primary btn--lg btn--block" type="button" ' +
                               'data-act="place-order"' + (blocked ? ' disabled' : '') + '>' +
                           t('checkout.placeOrder', 'Оформить заказ') +
                       '</button>' +
                       '<a class="btn btn--ghost btn--block" href="cart.html">' +
                           App.icon('arrowLeft', 14) +
                           '<span>' + t('checkout.shoppingCart', 'Корзина') + '</span>' +
                       '</a>' +
                   '</div>' +
               '</aside>';
    }

    /** Kredili müşteriye limit özeti — kalan tutar ödeme öncesi görünsün. */
    function creditBoxHtml() {
        if (!userLimits || !userLimits.special || !userLimits.limit) return '';

        var t = App.t;
        var used = userLimits.used;
        var pct = userLimits.limit ? Math.min(100, (used / userLimits.limit) * 100) : 0;

        return '<div class="mb-4">' +
                   '<div class="label">' + t('account.creditLimit.title', 'Кредитный лимит') + '</div>' +
                   '<div class="credit-bar"><span class="credit-bar__fill" style="width:' + (100 - pct) + '%"></span></div>' +
                   '<div class="flex justify-b t-xs t-mut">' +
                       '<span>' + t('account.creditLimit.used', 'Использовано') + ': ' + App.fmt.price(used) + '</span>' +
                       '<span>' + t('account.creditLimit.available', 'Доступно') + ': ' +
                           App.fmt.price(userLimits.available) + '</span>' +
                   '</div>' +
               '</div>';
    }

    function renderEmpty() {
        root.innerHTML =
            '<div class="card"><div class="empty">' +
                '<div class="empty__icon">' + App.icon('cart', 26) + '</div>' +
                '<h2 class="empty__title">' + App.t('checkout.messages.emptyCart', 'Ваша корзина пуста') + '</h2>' +
                '<p class="empty__text">' + App.t('checkout.messages.emptyCartCheckout', '') + '</p>' +
                '<a class="btn btn--primary" href="shop.html">' +
                    App.t('checkout.messages.continueShopping', 'Продолжить покупки') + '</a>' +
            '</div></div>';
    }

    function loading() {
        return '<div class="flex justify-c" style="padding:60px"><span class="spinner spinner--lg"></span></div>';
    }

    /* ============================================================
       SİPARİŞ OLUŞTURMA
       ============================================================ */

    App.actions.register('apply-coupon', function () {
        /* Kupon sunucuda sipariş anında değerlendiriliyor; burada
           yalnız girildiği bilgisi verilir. */
        var code = (document.getElementById('coupon-code') || {}).value || '';
        if (!code.trim()) return;
        App.toast.info(App.t('checkout.applyCoupon', 'Применить') + ': ' + code.trim());
    });

    App.actions.register('place-order', async function (btn) {
        var t = App.t;

        if (App.cart.isEmpty()) return App.toast.error(t('checkout.messages.emptyCart', ''));

        /* FAZ 44 — artık görünmeyen kalem varken istek gönderilmez. */
        var goneText = App.rules.unavailableCartText(App.cart.items);
        if (goneText) {
            App.toast.error(App.utils.escape(goneText));
            render();
            return;
        }

        /* Limit kontrolü sipariş anında TEKRAR koşar: sepet bu arada
           değişmiş olabilir. */
        userLimits = await checkLimits();
        if (userLimits.canProceed === false) {
            App.toast.error(userLimits.error);
            render();
            return;
        }

        /* ---- adres kontrolü ---- */
        addresses = await App.address.pair();
        var isCompany = App.auth.isCompany();

        if (!addresses.shipping || !addresses.shipping.id) {
            return App.toast.error(t('checkout.messages.addShippingAddress', 'Добавьте адрес доставки'));
        }
        if (!isCompany && (!addresses.billing || !addresses.billing.id)) {
            return App.toast.error(t('checkout.messages.addBillingAddress', 'Добавьте адрес для счета'));
        }

        var method = selectedMethod();
        btn.classList.add('is-loading');

        try {
            /* Kart seçildiyse önce sipariş, sonra ödeme ekranı. */
            if (method === App.const.PAY_CARD &&
                paymentMode !== App.const.PAYMENT_MODE_TRANSFER_ONLY) {
                await cardFlow(isCompany);
            } else {
                await directFlow(method, isCompany);
            }
        } catch (err) {
            App.toast.error(t('checkout.messages.orderError', 'Ошибка при создании заказа') + ': ' +
                            App.utils.escape(orderErrorText(err)));
        }

        btn.classList.remove('is-loading');
    });

    function selectedMethod() {
        var radio = document.querySelector('input[name="payment-method"]:checked');
        return (radio && radio.value) || App.const.PAY_COD;
    }

    function orderBody(method, isCompany) {
        return {
            shippingAddressId: addresses.shipping.id,
            /* Şirkette fatura adresi 1C'den; sunucuya teslimat kimliği gider. */
            billingAddressId:  isCompany ? addresses.shipping.id : addresses.billing.id,
            paymentMethod:     method,
            customerNote:      (document.getElementById('order-notes') || {}).value || '',
            couponCode:        (document.getElementById('coupon-code') || {}).value || ''
        };
    }

    /* ---------- kart (Halyk ePay) ---------- */
    async function cardFlow(isCompany) {
        App.toast.info(App.t('checkout.messages.creatingOrder', 'Создание вашего заказа...'));

        var data = await App.order.create(orderBody(App.const.PAY_CARD, isCompany));

        var orderId = App.order.field(data, 'orderId');
        var groupId = App.order.field(data, 'groupId');
        var amount  = Math.round(parseFloat(App.order.field(data, 'totalAmount')) || App.cart.total());

        /* Sunucu sepeti tüketti; yereldeki de HEMEN temizlenir ki
           kullanıcı ödemeyi kapatsa bile bayat sepetle kalmasın. */
        await App.cart.clear(true);

        showCreatedPanel(data, amount);

        var started = await App.pay.start({
            orderId: orderId,
            groupId: groupId,
            amount:  amount,
            reference: App.order.field(data, 'groupNumber') || App.order.field(data, 'orderNumber')
        });

        /* Ödeme ekranı açılamadıysa müşteri siparişini yine de görsün. */
        if (!started) {
            setTimeout(function () { window.location.href = App.order.resultUrl(data); }, 1500);
        }
    }

    /* ---------- havale / kapıda / onay ---------- */
    async function directFlow(method, isCompany) {
        App.toast.info(App.t('checkout.messages.creatingOrder', 'Создание вашего заказа...'));

        /* Kredisiz müşteri `transfer_only` modunda havale yapar;
           kredili müşteri yönetici onayına gider. Sunucu da aynı
           dönüşümü yapıyor — doğru değeri göndermek onun düzeltmesine
           bel bağlamamak içindir. */
        var finalMethod = method;
        if (paymentMode === App.const.PAYMENT_MODE_TRANSFER_ONLY && !hasCreditLine) {
            finalMethod = App.const.PAY_TRANSFER;
        } else if (hasCreditLine && method === App.const.PAY_APPROVAL) {
            finalMethod = App.const.PAY_APPROVAL;
        }

        var data = await App.order.create(orderBody(finalMethod, isCompany));

        await App.cart.clear(true);
        App.toast.success(App.t('checkout.messages.orderCreated', 'Заказ успешно создан!'));

        showCreatedPanel(data);

        var wait = App.order.resultOrders(data).length > 1 ? 2600 : 1200;
        setTimeout(function () { window.location.href = App.order.resultUrl(data); }, wait);
    }

    /** Kaç sipariş doğdu + ödenecek tutar — yönlendirmeden önce göster. */
    function showCreatedPanel(data, chargeAmount) {
        var t = App.t;
        var orders = App.order.resultOrders(data);
        var groupNumber = App.order.field(data, 'groupNumber') || App.order.field(data, 'orderNumber') || '';

        root.innerHTML =
            '<div class="card"><div class="empty">' +
                '<div class="empty__icon" style="background:var(--success-soft);color:var(--success)">' +
                    App.icon('check', 26) + '</div>' +
                '<h2 class="empty__title">' + t('checkout.messages.orderCreated', 'Заказ создан') + '</h2>' +
                (groupNumber
                    ? '<p class="empty__text">' + t('checkout.purchaseNumber', 'Номер покупки') + ': <b>' +
                          App.utils.escape(String(groupNumber)) + '</b></p>'
                    : '') +
                (orders.length > 1
                    ? '<p class="empty__text">' + t('checkout.ordersCreated', '', { count: orders.length }) + '</p>'
                    : '') +
                (chargeAmount
                    ? '<p class="empty__text">' + t('checkout.totalPayment', 'Сумма к оплате') + ': <b>' +
                          App.fmt.price(chargeAmount) + '</b></p>'
                    : '') +
                '<span class="spinner"></span>' +
            '</div></div>';
    }
});
