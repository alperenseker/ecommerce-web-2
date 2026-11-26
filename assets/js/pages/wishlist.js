/* ============================================================
   pages/wishlist.js — FAVORİLER SAYFASI
   ------------------------------------------------------------
   Liste SUNUCUDAN tam kayıtlarla çekilir (ad, fiyat, görsel,
   stok). Yerel ayna yalnız kalp ikonlarının anında doğru
   görünmesi içindir; bu sayfada kaynak daima sunucudur.
   ============================================================ */

App.definePage('wishlist', async function (ctx) {

    var root = document.getElementById('page-root');
    var actionsBox = document.getElementById('page-actions');

    root.innerHTML = loading();

    await ctx.catalog;
    await ctx.user;

    var items = [];

    await load();

    App.bus.on(App.bus.EVENTS.LANG_CHANGED, function () { App.i18n.apply(); render(); });

    /* Kalp kartlardan da kapatılabilir; liste kendini tazeler. */
    App.bus.on(App.bus.EVENTS.WISHLIST_CHANGED, function (e) {
        var ids = e.ids || [];
        items = items.filter(function (i) { return ids.indexOf(String(i.ProductId)) !== -1; });
        render();
    });

    async function load() {
        if (!App.auth.isLoggedIn()) { renderGuest(); return; }

        try {
            items = await App.wishlist.loadItems();
        } catch (e) {
            items = [];
        }
        render();
    }

    /* ============================================================
       ÇİZİM
       ============================================================ */

    function render() {
        if (!App.auth.isLoggedIn()) return renderGuest();

        if (!items.length) {
            actionsBox.innerHTML = '';
            root.innerHTML =
                '<div class="card"><div class="empty">' +
                    '<div class="empty__icon">' + App.icon('heart', 26) + '</div>' +
                    '<h2 class="empty__title">' + App.t('wishlist.emptyTitle', App.t('wishlist.empty', 'В избранном пока пусто')) + '</h2>' +
                    '<p class="empty__text">' + App.t('wishlist.emptyText', '') + '</p>' +
                    '<a class="btn btn--primary" href="shop.html">' +
                        App.t('menu.shop', 'Магазин') + '</a>' +
                '</div></div>';
            return;
        }

        actionsBox.innerHTML =
            '<button class="btn btn--steel btn--sm" type="button" data-act="wishlist-all-to-cart">' +
                App.icon('cart', 14) +
                '<span>' + App.t('shopList.card.addToCart', 'В корзину') + '</span>' +
            '</button>';

        root.innerHTML =
            '<div class="card"><div class="table-scroll">' +
                '<table class="table">' +
                    '<thead><tr>' +
                        '<th colspan="2" data-i18n="cart.product">Товар</th>' +
                        '<th data-i18n="cart.price">Цена</th>' +
                        '<th data-i18n="product.availability">Наличие</th>' +
                        '<th></th><th></th>' +
                    '</tr></thead>' +
                    '<tbody>' + items.map(rowHtml).join('') + '</tbody>' +
                '</table>' +
            '</div></div>';
    }

    function rowHtml(item) {
        var img = item.ProductImage || item.MainImage || App.config.FALLBACK_IMAGE;
        var url = 'product.html?slug=' + encodeURIComponent(item.ProductSlug || '');

        /* Sunucu istek listesi kaleminde de HasPrice/PriceHidden
           gönderiyor; fiyat gizliyse "0,00 ₸" yerine bilgi metni.
           FAZ 38: satış birimli kalemde ambalaj fiyatı + "/ ad" + taban
           fiyat (kalemin fiyat alanı ProductPrice). FAZ 44: özel fiyat rozeti. */
        var priceHtml = App.model.isPriceHidden(item)
            ? App.model.priceOnRequestHtml()
            : (App.su.priceHtml(item, { price: item.ProductPrice, old: item.ProductOldPrice }) ||
               '<span class="price-now">' + App.fmt.price(item.ProductPrice) + '</span>') +
              App.rules.badgeHtml(item);

        /* Katalogdaki güncel kayıt varsa stok ondan okunur: istek
           listesi anlık görüntüsü bayat olabilir. */
        var product = App.catalog.findById(item.ProductId) || {
            StockAmount: item.StockAmount,
            StockStatus: item.StockStatus
        };
        var stock = App.model.stock(product);

        return '<tr data-row>' +
                   '<td style="width:96px">' +
                       '<a href="' + url + '"><img class="cart-item__img" ' +
                           'src="' + App.utils.escape(img) + '" alt="" loading="lazy" ' +
                           'onerror="this.src=\'' + App.config.FALLBACK_IMAGE + '\'"></a>' +
                   '</td>' +

                   '<td><a class="cart-item__name t-clamp-2" href="' + url + '">' +
                       App.fmt.preserveSpaces(App.utils.escape(item.ProductName || '')) + '</a></td>' +

                   '<td style="white-space:nowrap">' + priceHtml +
                       (App.su.rulesText(item) ? '<div class="su-rules">' + App.utils.escape(App.su.rulesText(item)) + '</div>' : '') +
                   '</td>' +

                   '<td><span class="pcard__stock pcard__stock--' + stock.level + '">' +
                       '<span class="dot dot--' + (stock.level === 'in' ? 'ok' : stock.level === 'pre' ? 'warn' : 'err') + '"></span>' +
                       App.utils.escape(stock.label) + '</span></td>' +

                   '<td>' +
                       /* Adet verilmez: sepet servisi en küçük geçerli adedi
                          ekler (satış birimli üründe MinOrderQty — FAZ 38). */
                       '<button class="btn btn--primary btn--sm" type="button" ' +
                               'data-act="add-to-cart" data-id="' + item.ProductId + '"' +
                               (stock.canOrder ? '' : ' disabled') + '>' +
                           App.icon('cart', 13) +
                           '<span>' + (stock.canOrder
                               ? App.t('shopList.card.addToCart', 'В корзину')
                               : App.model.cannotAddText(stock)) + '</span>' +
                       '</button>' +
                   '</td>' +

                   '<td style="width:44px">' +
                       '<button class="btn btn--plain btn--sm btn--icon" type="button" ' +
                               'data-act="wishlist-remove" ' +
                               'data-item-id="' + item.WishlistItemId + '" ' +
                               'data-id="' + item.ProductId + '" ' +
                               'aria-label="' + App.t('common.remove', 'Убрать') + '">' +
                           App.icon('trash', 14) + '</button>' +
                   '</td>' +
               '</tr>';
    }

    function renderGuest() {
        actionsBox.innerHTML = '';
        root.innerHTML =
            '<div class="card"><div class="empty">' +
                '<div class="empty__icon">' + App.icon('lock', 26) + '</div>' +
                '<h2 class="empty__title">' + App.t('wishlist.loginToView', '') + '</h2>' +
                '<a class="btn btn--primary" href="login.html">' +
                    App.t('header.signIn', 'Войти') + '</a>' +
            '</div></div>';
    }

    function loading() {
        return '<div class="flex justify-c" style="padding:60px"><span class="spinner spinner--lg"></span></div>';
    }

    /* ============================================================
       TOPLU İŞLEM
       ============================================================ */

    /**
     * Stokta olan tüm favorileri sepete atar.
     * Sıralı gönderilir: aynı anda 30 istek atmak sunucuyu
     * gereksiz zorlar ve hata durumunda hangisinin başarısız
     * olduğu anlaşılmaz.
     */
    App.actions.register('wishlist-all-to-cart', async function (btn) {
        var addable = items.filter(function (item) {
            var product = App.catalog.findById(item.ProductId);
            return product && App.model.stock(product).canOrder;
        });

        if (!addable.length) {
            App.toast.warning(App.t('shopList.card.outOfStock', 'Нет в наличии'));
            return;
        }

        btn.classList.add('is-loading');
        var added = 0;

        /* Adet verilmez: her ürün kendi en küçük geçerli adediyle girer
           (satış birimli üründe MinOrderQty, değilse 1). */
        for (var i = 0; i < addable.length; i++) {
            var ok = await App.cart.add(addable[i].ProductId);
            if (ok) added++;
        }

        btn.classList.remove('is-loading');
        if (added) App.toast.success(added + ' × ' + App.t('shopList.card.added', 'Добавлено'));
    });
});
