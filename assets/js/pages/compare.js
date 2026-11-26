/* ============================================================
   pages/compare.js — KARŞILAŞTIRMA SAYFASI
   ------------------------------------------------------------
   Sunucudaki liste kalem kimlikleriyle gelir ama ürün alanlarının
   tamamını taşımaz. Bu yüzden her kalem KATALOGDAN zenginleştirilir;
   katalogda yoksa kalemin kendi alanlarına düşülür.

   Tablo SATIR bazlı okunur: solda özellik adı, sağda her ürün için
   bir sütun. Böylece dört ürün yan yana kıyaslanır.
   ============================================================ */

App.definePage('compare', async function (ctx) {

    var root    = document.getElementById('page-root');
    var actions = document.getElementById('page-actions');

    root.innerHTML = '<div class="flex justify-c" style="padding:60px"><span class="spinner spinner--lg"></span></div>';

    await ctx.catalog;
    await ctx.user;

    render();

    App.bus.on(App.bus.EVENTS.COMPARE_CHANGED, render);
    App.bus.on(App.bus.EVENTS.LANG_CHANGED, function () { App.i18n.apply(); render(); });

    /* ============================================================
       ÇİZİM
       ============================================================ */

    function render() {
        if (!App.auth.isLoggedIn()) return renderGuest();

        var items = App.compare.items;

        if (!items.length) {
            actions.innerHTML = '';
            root.innerHTML =
                '<div class="card"><div class="empty">' +
                    '<div class="empty__icon">' + App.icon('compare', 26) + '</div>' +
                    '<h2 class="empty__title">' + App.t('compare.empty', 'Список сравнения пуст') + '</h2>' +
                    '<p class="empty__text">' + App.t('compare.emptyText', '') + '</p>' +
                    '<a class="btn btn--primary" href="shop.html">' + App.t('menu.shop', 'Магазин') + '</a>' +
                '</div></div>';
            return;
        }

        actions.innerHTML =
            '<button class="btn btn--ghost btn--sm" type="button" data-act="compare-clear">' +
                App.icon('trash', 14) +
                '<span>' + App.t('compare.clearAll', 'Очистить список') + '</span>' +
            '</button>';

        var products = items.map(enrich);

        /* `table-layout: fixed` + colgroup: sütunlar İÇERİĞE göre
           değil EŞİT bölünür. Otomatik yerleşimde uzun adlı ürün
           sütunu şişip ötekileri eziyordu. */
        root.innerHTML =
            '<div class="card"><div class="table-scroll">' +
                '<table class="table compare-table">' +
                    '<colgroup>' +
                        '<col class="compare-table__label">' +
                        products.map(function () { return '<col>'; }).join('') +
                    '</colgroup>' +
                    '<tbody>' +
                        rowImages(products) +
                        rowNames(products) +
                        rowPrices(products) +
                        rowStock(products) +
                        rowText('compare.sku',      products, function (p) { return p.Sku; }) +
                        rowText('compare.category', products, function (p) {
                            var cat = App.catalog.findCategory(p.CategoryId);
                            return cat ? cat.Name : '';
                        }) +
                        rowText('compare.company',  products, function (p) { return App.model.erpLabel(p.ErpSource); }) +
                        rowText('compare.weight',   products, function (p) { return num(p.Weight, 'кг'); }) +
                        rowText('compare.dimensions', products, function (p) { return dims(p); }) +
                        rowRating(products) +
                        rowActions(products) +
                    '</tbody>' +
                '</table>' +
            '</div></div>';
    }

    /** Kalem + katalog kaydını birleştirir. */
    function enrich(item) {
        var product = App.catalog.findById(item.ProductId);
        var merged = Object.assign({}, product || {}, {
            ProductId:        item.ProductId,
            ComparisonItemId: item.ComparisonItemId
        });

        /* Katalogda yoksa kalemin taşıdığı alanlar kullanılır.
           FAZ 36/42: kalem satış birimi alanlarını, fiyat bağlamını
           (HasPrice / PriceHidden) ve özel fiyat işaretini de taşıyor. */
        if (!product) {
            merged.Name  = item.ProductName || item.Name || '';
            merged.Price = item.ProductPrice !== undefined ? item.ProductPrice : item.Price;
            merged.Slug  = item.ProductSlug || item.Slug || '';
            merged.MainImage = item.ProductImage || item.MainImage;
            merged.StockAmount = item.StockAmount;
            merged.StockStatus = item.StockStatus;
            ['OldPrice', 'HasPrice', 'PriceHidden', 'SalesUnitName', 'SalesUnitSize', 'BaseUnit',
             'MinOrderQty', 'OrderStep', 'BasePrice', 'HasSpecialPrice'].forEach(function (key) {
                if (item[key] !== undefined) merged[key] = item[key];
            });
        }
        return merged;
    }

    /* ---------- satırlar ---------- */

    function head(key, fallback) {
        return '<td class="compare-table__head">' + App.t(key, fallback) + '</td>';
    }

    function rowImages(list) {
        return '<tr>' + head('compare.product', 'Товар') + list.map(function (p) {
            return '<td>' +
                       '<a href="' + App.model.url(p) + '">' +
                           '<img class="compare-table__img" src="' + App.utils.escape(App.model.image(p)) + '" ' +
                                'alt="" loading="lazy" ' +
                                'onerror="this.src=\'' + App.config.FALLBACK_IMAGE + '\'">' +
                       '</a>' +
                   '</td>';
        }).join('') + '</tr>';
    }

    function rowNames(list) {
        return '<tr>' + head('cart.product', 'Товар') + list.map(function (p) {
            /* Ad KIRPILMAZ: uzunsa alt satıra geçer. Karşılaştırmada
               kesilen ad iki ürünü ayırt etmeyi imkânsız kılıyordu. */
            return '<td><a class="cart-item__name compare-table__name" href="' + App.model.url(p) + '">' +
                   App.fmt.preserveSpaces(App.utils.escape(p.Name || '')) + '</a></td>';
        }).join('') + '</tr>';
    }

    function rowPrices(list) {
        return '<tr>' + head('compare.price', 'Цена') + list.map(function (p) {
            return '<td>' + App.model.priceHtml(p) + '</td>';
        }).join('') + '</tr>';
    }

    function rowStock(list) {
        return '<tr>' + head('compare.availability', 'Наличие') + list.map(function (p) {
            var stock = App.model.stock(p);
            return '<td><span class="pcard__stock pcard__stock--' + stock.level + '">' +
                       '<span class="dot dot--' + (stock.level === 'in' ? 'ok' : stock.level === 'pre' ? 'warn' : 'err') + '"></span>' +
                       App.utils.escape(stock.label) +
                   '</span></td>';
        }).join('') + '</tr>';
    }

    function rowRating(list) {
        return '<tr>' + head('compare.rating', 'Рейтинг') + list.map(function (p) {
            var pct = App.fmt.ratingPercent(p.AverageRating);
            return '<td>' +
                       '<span class="stars"><span class="stars__bg">★★★★★</span>' +
                       '<span class="stars__fg" style="width:' + pct + '">★★★★★</span></span> ' +
                       '<span class="t-xs t-dim">(' + (p.TotalReviewCount || 0) + ')</span>' +
                   '</td>';
        }).join('') + '</tr>';
    }

    /** Boş satır çizilmez: dört ürünün de boş olduğu özellik gizlenir. */
    function rowText(key, list, read) {
        var values = list.map(function (p) { return String(read(p) || '').trim(); });
        if (!values.some(Boolean)) return '';

        return '<tr>' + head(key, '') + values.map(function (v) {
            return '<td>' + App.utils.escape(v || '—') + '</td>';
        }).join('') + '</tr>';
    }

    function rowActions(list) {
        return '<tr>' + head('common.actions', '') + list.map(function (p) {
            var stock = App.model.stock(p);
            return '<td>' +
                       '<div class="flex-col gap-2">' +
                           '<button class="btn btn--primary btn--sm" type="button" ' +
                                   'data-act="add-to-cart" data-id="' + p.ProductId + '"' +
                                   (stock.canOrder ? '' : ' disabled') + '>' +
                               App.icon('cart', 13) +
                               '<span>' + (stock.canOrder
                                   ? App.t('shopList.card.addToCart', 'В корзину')
                                   : App.model.cannotAddText(stock)) + '</span>' +
                           '</button>' +
                           (App.su.rulesText(p) ? '<div class="su-rules">' + App.utils.escape(App.su.rulesText(p)) + '</div>' : '') +
                           '<button class="btn btn--plain btn--sm" type="button" ' +
                                   'data-act="compare-remove" data-item-id="' + p.ComparisonItemId + '">' +
                               App.icon('trash', 13) +
                               '<span>' + App.t('common.remove', 'Убрать') + '</span>' +
                           '</button>' +
                       '</div>' +
                   '</td>';
        }).join('') + '</tr>';
    }

    function num(value, unit) {
        var n = parseFloat(value);
        return (!n || isNaN(n)) ? '' : App.fmt.number(n) + ' ' + unit;
    }

    function dims(p) {
        var parts = [p.Width, p.Height, p.Depth].map(function (v) { return parseFloat(v) || 0; });
        if (!parts.some(Boolean)) return '';
        return parts.join(' × ') + ' мм';
    }

    function renderGuest() {
        actions.innerHTML = '';
        root.innerHTML =
            '<div class="card"><div class="empty">' +
                '<div class="empty__icon">' + App.icon('lock', 26) + '</div>' +
                '<h2 class="empty__title">' + App.t('compare.loginToView', 'Войдите, чтобы увидеть список') + '</h2>' +
                '<a class="btn btn--primary" href="login.html?redirect=compare.html">' +
                    App.t('header.signIn', 'Войти') + '</a>' +
            '</div></div>';
    }

    /* ============================================================
       TOPLU İŞLEM
       ============================================================ */

    App.actions.register('compare-clear', async function (btn) {
        var ok = await App.modal.confirm({
            title: App.t('compare.clearAll', 'Очистить список'),
            text:  App.t('cart.messages.confirmClear', ''),
            danger: true
        });
        if (!ok) return;

        btn.classList.add('is-loading');
        await App.compare.clear();
        btn.classList.remove('is-loading');
    });
});
