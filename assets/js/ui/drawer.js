/* ============================================================
   ui/drawer.js — SEPET ÇEKMECESİ
   ------------------------------------------------------------
   Sepete ekleyen kullanıcıyı sepet sayfasına GÖTÜRMEK alışverişi
   böler. Bunun yerine sağdan bir panel açılır: kullanıcı ne
   eklediğini görür, isterse ödemeye geçer, istemezse kaldığı
   yerden devam eder.

   İçerik 'cart:changed' olayıyla kendini yeniler; panel açıkken
   miktar değişse bile ekran gerçekle uyumlu kalır.
   ============================================================ */

(function (App) {
    'use strict';

    var Drawer = {};
    var root = null;

    function build() {
        if (root) return root;

        root = App.utils.el('div', { class: 'drawer', id: 'cart-drawer' });
        root.innerHTML =
            '<div class="drawer__backdrop" data-act="close-drawer"></div>' +
            '<aside class="drawer__panel" role="dialog" aria-label="' + App.t('header.shoppingCart', 'Корзина покупок') + '">' +
                '<div class="drawer__head">' +
                    '<h3 class="card__title">' + App.t('header.shoppingCart', 'Корзина покупок') +
                        ' <span class="t-mut t-sm" id="drawer-count"></span>' +
                    '</h3>' +
                    '<button class="modal__close" type="button" data-act="close-drawer" aria-label="' +
                        App.t('header.close', 'Закрыть') + '">' + App.icon('close', 16) + '</button>' +
                '</div>' +
                '<div class="drawer__body" id="drawer-body"></div>' +
                '<div class="drawer__foot" id="drawer-foot"></div>' +
            '</aside>';

        document.body.appendChild(root);
        return root;
    }

    /* ------------------------------------------------------------
       İÇERİK
       ------------------------------------------------------------ */

    function render() {
        if (!root) return;

        var body  = document.getElementById('drawer-body');
        var foot  = document.getElementById('drawer-foot');
        var count = document.getElementById('drawer-count');
        if (!body) return;

        count.textContent = App.cart.isEmpty() ? '' : '(' + App.cart.count() + ')';

        if (!App.auth.isLoggedIn()) {
            body.innerHTML = emptyHtml(App.t('cart.loginToView', 'Войдите, чтобы увидеть корзину'),
                                       'login.html', App.t('header.signIn', 'Войти'));
            foot.innerHTML = '';
            return;
        }

        if (App.cart.isEmpty()) {
            body.innerHTML = emptyHtml(App.t('cart.messages.emptyCart', 'Ваша корзина пуста'),
                                       'shop.html', App.t('cart.continueShopping', 'Продолжить покупки'));
            foot.innerHTML = '';
            return;
        }

        /* Şirket başına gruplama sepet sayfasındaki ile aynı: kullanıcı
           siparişin kaça bölüneceğini burada da görür. */
        var groups = App.cart.groups();

        body.innerHTML = groups.map(function (group) {
            return (groups.length > 1
                    ? '<div class="t-xs t-upper t-dim" style="margin:14px 0 6px">' +
                          App.utils.escape(group.label) + '</div>'
                    : '') +
                   group.items.map(lineHtml).join('');
        }).join('');

        foot.innerHTML =
            (groups.length > 1
                ? '<div class="alert alert--info t-xs mb-3">' + App.icon('info', 14) +
                  '<span>' + App.t('checkout.splitNote', '', { count: groups.length }) + '</span></div>'
                : '') +
            '<div class="summary__total mb-4" style="border:0;padding:0;margin:0 0 16px">' +
                '<span>' + App.t('cart.total', 'Итого') + '</span>' +
                '<b>' + App.fmt.price(App.cart.total()) + '</b>' +
            '</div>' +
            '<div class="flex-col gap-2">' +
                '<a class="btn btn--primary btn--block" href="checkout.html">' +
                    App.t('header.checkout', 'Оформить заказ') + '</a>' +
                '<a class="btn btn--ghost btn--block" href="cart.html">' +
                    App.t('header.viewCart', 'Просмотр корзины') + '</a>' +
            '</div>';
    }

    function lineHtml(item) {
        var img = item.ProductImageUrl || item.MainImage || item.ProductImage || App.config.FALLBACK_IMAGE;

        return '<div class="dline">' +
                   '<img class="dline__img" src="' + App.utils.escape(img) + '" alt="" loading="lazy" ' +
                        'onerror="this.src=\'' + App.config.FALLBACK_IMAGE + '\'">' +
                   '<div class="grow">' +
                       '<a class="dline__name t-clamp-2" href="product.html?slug=' +
                            encodeURIComponent(item.ProductSlug || '') + '">' +
                           App.fmt.preserveSpaces(App.utils.escape(item.ProductName || '')) +
                       '</a>' +
                       '<div class="dline__meta">' + (parseInt(item.Quantity, 10) || 1) + ' × ' +
                            App.fmt.price(item.UnitPrice) + '</div>' +
                       '<div class="dline__price">' + App.fmt.price(App.cart.lineTotal(item)) + '</div>' +
                   '</div>' +
                   '<button class="btn btn--plain btn--sm btn--icon" type="button" ' +
                           'data-act="cart-remove" data-id="' + item.CartItemId + '" ' +
                           'aria-label="' + App.t('common.remove', 'Убрать') + '">' +
                       App.icon('trash', 14) +
                   '</button>' +
               '</div>';
    }

    function emptyHtml(text, href, cta) {
        return '<div class="empty">' +
                   '<div class="empty__icon">' + App.icon('cart', 26) + '</div>' +
                   '<p class="empty__text">' + App.utils.escape(text) + '</p>' +
                   '<a class="btn btn--steel" href="' + href + '">' + App.utils.escape(cta) + '</a>' +
               '</div>';
    }

    /* ------------------------------------------------------------
       AÇ / KAPA
       ------------------------------------------------------------ */

    Drawer.open = function () {
        build();
        render();
        root.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKey);
    };

    Drawer.close = function () {
        if (!root) return;
        root.classList.remove('is-open');
        document.body.style.overflow = '';
        document.removeEventListener('keydown', onKey);
    };

    Drawer.toggle = function () {
        if (root && root.classList.contains('is-open')) Drawer.close();
        else Drawer.open();
    };

    Drawer.isOpen = function () { return !!root && root.classList.contains('is-open'); };

    function onKey(e) { if (e.key === 'Escape') Drawer.close(); }

    /* Panel açıkken sepet değişirse içerik tazelenir. */
    App.bus.on(App.bus.EVENTS.CART_CHANGED, function () {
        if (Drawer.isOpen()) render();
    });

    App.drawer = Drawer;

})(window.App);
