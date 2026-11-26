/* ============================================================
   pages/cart.js — SEPET SAYFASI
   ------------------------------------------------------------
   Kalemler ŞİRKETE (1C kaynağına) göre gruplanır. Sunucu sipariş
   anında sepeti tam bu gruplara böldüğü için müşteri daha sepetteyken
   kaç ayrı sipariş doğacağını görür — ödeme ekranında sürpriz olmaz.

   Miktar değişimi ve silme işlemleri App.cart üzerinden gider;
   bu sayfa yalnız çizim yapar ve 'cart:changed' olayını dinler.
   ============================================================ */

App.definePage('cart', async function (ctx) {

    var root = document.getElementById('cart-root');

    root.innerHTML = '<div class="flex justify-c" style="padding:60px">' +
                     '<span class="spinner spinner--lg"></span></div>';

    await ctx.catalog;
    await ctx.user;

    render();

    /* Sepet başka bir yerden değişirse (çekmece, başka sekme) tazele. */
    App.bus.on(App.bus.EVENTS.CART_CHANGED, render);
    App.bus.on(App.bus.EVENTS.LANG_CHANGED, function () { App.i18n.apply(); render(); });

    bindEvents();

    /* ============================================================
       ÇİZİM
       ============================================================ */

    function render() {
        if (!App.auth.isLoggedIn()) return renderGuest();
        if (App.cart.isEmpty())     return renderEmpty();

        var groups = App.cart.groups();

        root.innerHTML =
            '<div class="cart-layout">' +

                '<div>' +
                    '<div class="card">' +
                        '<div class="table-scroll">' +
                            '<table class="table">' +
                                '<thead><tr>' +
                                    '<th colspan="2" data-i18n="cart.product">Товар</th>' +
                                    '<th data-i18n="cart.price">Цена</th>' +
                                    '<th data-i18n="cart.quantity">Кол-во</th>' +
                                    '<th class="t-right" data-i18n="cart.subtotal">Сумма</th>' +
                                    '<th></th>' +
                                '</tr></thead>' +
                                '<tbody>' +
                                    groups.map(groupHtml).join('') +
                                '</tbody>' +
                            '</table>' +
                        '</div>' +
                        '<div class="card__foot flex items-c justify-b wrap gap-3">' +
                            '<a class="btn btn--ghost" href="shop.html">' +
                                App.icon('arrowLeft', 14) +
                                '<span>' + App.t('cart.continueShopping', 'Продолжить покупки') + '</span></a>' +
                            '<button class="btn btn--plain" type="button" data-act="cart-clear">' +
                                App.icon('trash', 14) +
                                '<span>' + App.t('cart.clearCart', 'Очистить корзину') + '</span></button>' +
                        '</div>' +
                    '</div>' +

                    splitNoteHtml(groups.length) +
                    unavailableNoteHtml() +
                '</div>' +

                summaryHtml() +
            '</div>';
    }

    /** FAZ 44 — artık görünmeyen kalemler varsa adlarıyla açık uyarı (sunucu metni değil). */
    function unavailableNoteHtml() {
        var note = App.rules.unavailableCartText(App.cart.items);
        if (!note) return '';
        return '<div class="alert alert--warn mt-4">' + App.icon('warning', 15) +
                   '<span>' + App.utils.escape(note) + '</span>' +
               '</div>';
    }

    /** Şirket başlığı + o şirketin kalemleri. */
    function groupHtml(group) {
        var many = App.cart.groups().length > 1;

        return (many
            ? '<tr class="cart-group"><td colspan="6">' +
                  '<div class="cart-group__inner">' +
                      '<span class="cart-group__name">' + App.utils.escape(group.label) + '</span>' +
                      '<span class="cart-group__sub">' + App.t('cart.subtotal', 'Промежуточный итог') + ': ' +
                          '<strong>' + App.fmt.price(group.subtotal) + '</strong></span>' +
                  '</div>' +
              '</td></tr>'
            : '') +
            group.items.map(rowHtml).join('');
    }

    function rowHtml(item) {
        var img = item.ProductImageUrl || item.MainImage || item.ProductImage || App.config.FALLBACK_IMAGE;
        var url = 'product.html?slug=' + encodeURIComponent(item.ProductSlug || '');
        var qtyId = 'qty-' + item.CartItemId;
        var qty = parseInt(item.Quantity, 10) || 1;

        /* FAZ 44 — artık görünmeyen kalem: soluk, adet kilitli, tutara
           katılmaz; tek eylem silmek. */
        var gone = App.rules.isCartItemUnavailable(item);

        /* FAZ 38 — satış birimli kalem: fiyat "/ ad", adet kutusu
           min/adım kurallı, altında "24 × Комплект 33 кг (792 кг)". */
        var info  = App.su.info(item);
        var rules = info ? App.su.qtyRules(item, App.model.cartItemErp(item)) : null;
        var unitLine = info ? App.su.lineText(item) : '';
        var rulesText = info ? App.su.rulesText(item) : '';

        return '<tr data-cart-item="' + item.CartItemId + '"' + (gone ? ' class="is-unavailable"' : '') + '>' +
                   '<td style="width:96px">' +
                       '<a href="' + url + '">' +
                           '<img class="cart-item__img" src="' + App.utils.escape(img) + '" alt="" ' +
                                'loading="lazy" onerror="this.src=\'' + App.config.FALLBACK_IMAGE + '\'">' +
                       '</a>' +
                   '</td>' +

                   '<td>' +
                       '<a class="cart-item__name t-clamp-2" href="' + url + '">' +
                           App.fmt.preserveSpaces(App.utils.escape(item.ProductName || '')) + '</a>' +
                       (item.Sku ? '<div class="cart-item__sku">' + App.utils.escape(item.Sku) + '</div>' : '') +
                       (unitLine ? '<div class="su-line">' + App.utils.escape(unitLine) + '</div>' : '') +
                       (gone ? '<div class="unavailable-note">' + App.icon('warning', 13) +
                                   '<span>' + App.utils.escape(App.t('customerRules.unavailableInCartNote',
                                       'This product is no longer available. Remove it from your cart.')) + '</span></div>'
                             : '') +
                   '</td>' +

                   '<td style="white-space:nowrap">' +
                       App.fmt.price(item.UnitPrice) +
                       (info ? '<span class="su-unit">/ ' + App.utils.escape(info.name) + '</span>' : '') +
                       (gone ? '' : App.rules.badgeHtml(item)) +
                   '</td>' +

                   '<td>' +
                       '<div class="qty">' +
                           '<button class="qty__btn" type="button" data-act="qty-dec" data-target="' + qtyId + '"' +
                                   (gone ? ' disabled' : '') + '>' +
                               App.icon('minus', 13) + '</button>' +
                           '<input class="qty__input" id="' + qtyId + '" type="number" max="100000"' +
                                  App.su.inputAttrs(rules, qty) +
                                  ' data-cart-item="' + item.CartItemId + '"' + (gone ? ' disabled' : '') + '>' +
                           '<button class="qty__btn" type="button" data-act="qty-inc" data-target="' + qtyId + '"' +
                                   (gone ? ' disabled' : '') + '>' +
                               App.icon('plus', 13) + '</button>' +
                       '</div>' +
                       (rulesText ? '<div class="su-rules">' + App.utils.escape(rulesText) + '</div>' : '') +
                   '</td>' +

                   '<td class="t-right t-hi t-bold" style="white-space:nowrap" data-line-total>' +
                       (gone ? '<span class="t-dim">—</span>' : App.fmt.price(App.cart.lineTotal(item))) + '</td>' +

                   '<td style="width:44px">' +
                       '<button class="btn btn--plain btn--sm btn--icon" type="button" ' +
                               'data-act="cart-remove" data-id="' + item.CartItemId + '" ' +
                               'aria-label="' + App.t('common.remove', 'Убрать') + '">' +
                           App.icon('trash', 14) + '</button>' +
                   '</td>' +
               '</tr>';
    }

    function splitNoteHtml(groupCount) {
        if (groupCount < 2) return '';
        return '<div class="alert alert--info mt-4">' + App.icon('info', 15) +
                   '<span>' + App.t('cart.splitNote', '', { count: groupCount }) + '</span>' +
               '</div>';
    }

    function summaryHtml() {
        return '<aside class="card summary panel-metal">' +
                   '<div class="card__head">' +
                       '<h3 class="card__title">' + App.t('cart.cartTotals', 'Итого в корзине') + '</h3>' +
                       '<span class="badge">' + App.cart.count() + ' ' + App.t('account.orders.items', '') + '</span>' +
                   '</div>' +
                   '<div class="card__body">' +
                       '<div class="summary__row">' +
                           '<span>' + App.t('cart.subtotal', 'Промежуточный итог') + '</span>' +
                           '<b>' + App.fmt.price(App.cart.total()) + '</b>' +
                       '</div>' +
                       '<div class="summary__row">' +
                           '<span>' + App.t('checkout.shipping', 'Доставка') + '</span>' +
                           '<span class="t-xs t-dim">' + App.t('cart.shippingCalc', '') + '</span>' +
                       '</div>' +
                       '<div class="summary__total">' +
                           '<span>' + App.t('cart.total', 'Итого') + '</span>' +
                           '<b>' + App.fmt.price(App.cart.total()) + '</b>' +
                       '</div>' +
                   '</div>' +
                   '<div class="card__foot">' +
                       '<a class="btn btn--primary btn--lg btn--block" href="checkout.html">' +
                           App.t('cart.proceedToCheckout', 'Перейти к оформлению') +
                           App.icon('arrowRight', 15) + '</a>' +
                   '</div>' +
               '</aside>';
    }

    function renderEmpty() {
        root.innerHTML =
            '<div class="card"><div class="empty">' +
                '<div class="empty__icon">' + App.icon('cart', 28) + '</div>' +
                '<h2 class="empty__title">' + App.t('cart.messages.emptyCart', 'Ваша корзина пуста') + '</h2>' +
                '<p class="empty__text">' + App.t('cart.messages.browseProducts', '') + '</p>' +
                '<a class="btn btn--primary" href="shop.html">' +
                    App.t('cart.continueShopping', 'В каталог') + '</a>' +
            '</div></div>';
    }

    function renderGuest() {
        root.innerHTML =
            '<div class="card"><div class="empty">' +
                '<div class="empty__icon">' + App.icon('lock', 26) + '</div>' +
                '<h2 class="empty__title">' + App.t('cart.loginToView', 'Войдите, чтобы увидеть корзину') + '</h2>' +
                '<p class="empty__text">' + App.t('account.loginPrompt.description', '') + '</p>' +
                '<a class="btn btn--primary" href="login.html">' +
                    App.t('header.signIn', 'Войти') + '</a>' +
            '</div></div>';
    }

    /* ============================================================
       OLAYLAR
       ============================================================ */

    function bindEvents() {
        /* Miktar girdisi: elle yazma da +/- de aynı yolu kullanır.
           Olay devriyle bağlanır çünkü satırlar yeniden çiziliyor. */
        App.utils.on(root, 'change', '.qty__input[data-cart-item]', async function (e, input) {
            var id = input.dataset.cartItem;
            var rules = App.su.inputRules(input);

            if (!rules) {
                var qty = App.utils.clamp(parseInt(input.value, 10) || 1, 1, 100000);
                input.value = qty;
                App.cart.updateQuantity(id, qty);
                return;
            }

            /* FAZ 38 — minimumun altı (minimumdayken "−" ya da elle 0/10):
               kalem silinsin mi diye TEK kez sorulur; vazgeçilirse kutu
               sunucudaki adede döner. Geçersiz adet (25) ise uyarı +
               en yakın geçerli adet önerisi, istek gitmez (servis yapar). */
            var value = Number(input.value);
            if (!(value >= rules.min)) {
                var ok = await App.modal.confirm({
                    title: App.t('common.remove', 'Убрать'),
                    text:  App.su.text('confirmRemoveBelowMin',
                        'The minimum order for this product is {min}. Remove it from the cart?', { min: rules.min }),
                    danger: true
                });
                if (ok) await App.cart.remove(id);
                else render();
                return;
            }

            App.cart.updateQuantity(id, value);
        });
    }
});
