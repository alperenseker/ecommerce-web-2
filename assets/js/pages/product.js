/* ============================================================
   pages/product.js — ÜRÜN DETAY SAYFASI
   ------------------------------------------------------------
   Ürün ya `?slug=` ya da `?id=` ile açılır. Önce ÖNBELLEKTEN
   çizilir (anında görünür), sonra sunucudan tam kayıt gelince
   açıklama/varyant gibi eksik alanlar tamamlanır.
   ============================================================ */

App.definePage('product', async function (ctx) {

    var root = document.getElementById('product-root');
    var slug = App.utils.param('slug');
    var id   = App.utils.param('id');

    root.innerHTML = skeleton();

    var data = await ctx.catalog;
    void data;

    var product = slug ? App.catalog.findBySlug(slug) : App.catalog.findById(id);

    /* Önbellekte yoksa doğrudan sunucuya sor (yeni ürün, paylaşılan
       bağlantı, farklı dilde slug vb.). */
    if (!product) {
        try {
            var res = await App.api.products.getById(id || slug);
            if (res.success) product = res.data;
        } catch (e) { /* aşağıda "bulunamadı" ekranı çizilir */ }
    }

    if (!product) { renderNotFound(); return; }

    render(product);
    App.gallery.bind();
    bindActions(product);

    ctx.user.then(function () { App.card.refreshStates(); });

    loadRelated(product);
    loadReviews(product);
    loadVariants(product);

    App.bus.on(App.bus.EVENTS.LANG_CHANGED, function () {
        render(product);
        App.gallery.bind();
        bindActions(product);
        loadRelated(product);
    });

    /* ============================================================
       ÇİZİM
       ============================================================ */

    function render(p) {
        var stock  = App.model.stock(p);
        var images = App.model.images(p);
        var cat    = App.catalog.findCategory(p.CategoryId);

        document.title = p.Name + ' — ' + App.config.BRAND.name + App.config.BRAND.suffix;
        var crumb = document.getElementById('crumb-product');
        if (crumb) crumb.textContent = App.fmt.truncate(p.Name, 60);

        root.innerHTML =
            '<div class="pdetail">' +

                '<div>' + App.gallery.html(images, p.Name) + '</div>' +

                '<div>' +
                    (cat ? '<a class="pcard__cat" href="shop.html?category=' + cat.Id + '">' +
                               App.utils.escape(cat.Name) + '</a>' : '') +

                    '<h1 class="pdetail__title">' +
                        App.fmt.preserveSpaces(App.utils.escape(p.Name)) + '</h1>' +

                    '<div class="pdetail__meta">' +
                        ratingHtml(p) +
                        (p.Sku ? '<span class="t-mono t-xs t-dim">' + App.t('product.sku', 'Артикул') +
                                 ': ' + App.utils.escape(p.Sku) + '</span>' : '') +
                        '<span class="pcard__stock pcard__stock--' + stock.level + '">' +
                            '<span class="dot dot--' + toneOf(stock.level) + '"></span>' +
                            App.utils.escape(stock.label) +
                            (stock.inStock ? ' · ' + App.fmt.number(stock.amount, 0) + ' ' +
                                             App.t('stock.pieces', 'шт') : '') +
                        '</span>' +
                    '</div>' +

                    '<div class="pdetail__price-box">' + priceBoxHtml(p) + '</div>' +

                    '<div id="variants-box"></div>' +

                    buyRowHtml(p, stock) +

                    trustHtml() +

                    '<div class="card mt-6">' +
                        '<div class="card__body">' +
                            '<div class="tabs" role="tablist">' +
                                '<button class="tab is-active" type="button" data-act="tab" data-tab="desc">' +
                                    App.t('product.description', 'Описание') + '</button>' +
                                '<button class="tab" type="button" data-act="tab" data-tab="specs">' +
                                    App.t('product.specifications', 'Характеристики') + '</button>' +
                                '<button class="tab" type="button" data-act="tab" data-tab="reviews">' +
                                    App.t('product.reviews', 'Отзывы') +
                                    ' <span class="t-dim">(' + (p.TotalReviewCount || 0) + ')</span></button>' +
                            '</div>' +

                            '<div class="tab-panel is-active" data-panel="desc">' +
                                descriptionHtml(p) + '</div>' +
                            '<div class="tab-panel" data-panel="specs">' +
                                specsHtml(p) + '</div>' +
                            '<div class="tab-panel" data-panel="reviews" id="reviews-panel">' +
                                '<div class="flex justify-c" style="padding:24px"><span class="spinner"></span></div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
    }

    function toneOf(level) {
        return level === 'in' ? 'ok' : level === 'pre' ? 'warn' : 'err';
    }

    function ratingHtml(p) {
        var pct = App.fmt.ratingPercent(p.AverageRating);
        return '<span class="flex items-c gap-2">' +
                   '<span class="stars">' +
                       '<span class="stars__bg">★★★★★</span>' +
                       '<span class="stars__fg" style="width:' + pct + '">★★★★★</span>' +
                   '</span>' +
                   '<span class="t-xs t-dim">' + (p.TotalReviewCount || 0) + ' ' +
                       App.t('review.count', 'отзывов') + '</span>' +
               '</span>';
    }

    function priceBoxHtml(p) {
        if (App.model.isPriceHidden(p)) {
            return '<div>' + App.model.priceOnRequestHtml() +
                   '<div class="t-xs t-dim mt-2">' +
                       App.t('common.priceOnRequestHint', '') + '</div></div>';
        }

        var discount = App.model.discountPercent(p);

        return '<span class="pdetail__price">' + App.fmt.price(p.Price) + '</span>' +
               (discount > 0
                   ? '<span class="pdetail__old">' + App.fmt.price(p.OldPrice) + '</span>' +
                     '<span class="badge badge--gold">-' + discount + '%</span>'
                   : '') +
               (p.VatRate ? '<span class="t-xs t-dim">' + App.t('product.vat', 'НДС') +
                            ' ' + App.utils.escape(p.VatRate) + '%</span>' : '');
    }

    function buyRowHtml(p, stock) {
        var inWish = App.wishlist.has(p.ProductId);
        var inCmp  = App.compare.has(p.ProductId);

        return '<div class="flex wrap gap-3 items-c">' +
                   '<div class="qty">' +
                       '<button class="qty__btn" type="button" data-act="qty-dec" data-target="pd-qty">' +
                           App.icon('minus', 14) + '</button>' +
                       '<input class="qty__input" id="pd-qty" type="number" value="1" min="1" max="100000">' +
                       '<button class="qty__btn" type="button" data-act="qty-inc" data-target="pd-qty">' +
                           App.icon('plus', 14) + '</button>' +
                   '</div>' +

                   '<button class="btn btn--primary btn--lg grow" type="button" ' +
                           'data-act="add-to-cart" data-id="' + p.ProductId + '" data-qty-target="pd-qty"' +
                           (stock.canOrder ? '' : ' disabled') + ' style="min-width:190px">' +
                       App.icon('cart', 16) +
                       '<span>' + (stock.canOrder
                           ? App.t('product.addToCart', 'В корзину')
                           : App.t('stock.outOfStock', 'Нет в наличии')) + '</span>' +
                   '</button>' +

                   '<button class="btn btn--ghost btn--lg btn--icon' + (inWish ? ' is-active' : '') + '" ' +
                           'type="button" data-act="wishlist" data-id="' + p.ProductId + '" ' +
                           'title="' + App.t('header.wishlist', 'Избранное') + '">' +
                       App.icon('heart', 17) + '</button>' +

                   '<button class="btn btn--ghost btn--lg btn--icon' + (inCmp ? ' is-active' : '') + '" ' +
                           'type="button" data-act="compare" data-id="' + p.ProductId + '" ' +
                           'title="' + App.t('header.compare', 'Сравнение') + '">' +
                       App.icon('compare', 17) + '</button>' +
               '</div>';
    }

    function trustHtml() {
        var rows = [
            { icon: 'truck',  b: 'home.perk1', s: 'home.perk1s' },
            { icon: 'shield', b: 'home.perk2', s: 'home.perk2s' },
            { icon: 'credit', b: 'home.perk3', s: 'home.perk3s' }
        ];
        return '<div class="trust">' + rows.map(function (r) {
            return '<div class="trust__item">' + App.icon(r.icon, 16) +
                       '<div><b>' + App.t(r.b, '') + '</b><span>' + App.t(r.s, '') + '</span></div>' +
                   '</div>';
        }).join('') + '</div>';
    }

    function descriptionHtml(p) {
        var text = p.Description || p.ShortDescription || '';
        if (!text.trim()) {
            return '<p class="t-mut">' + App.t('product.noDescription', '') + '</p>';
        }
        /* 1C metni düz metindir; satır sonları korunur, HTML kaçırılır. */
        return '<p class="t-mut" style="white-space:pre-line">' + App.utils.escape(text) + '</p>';
    }

    /** Yalnız DOLU alanlar gösterilir; boş satır tabloyu kirletir. */
    function specsHtml(p) {
        var rows = [
            [App.t('product.sku', 'Артикул'),        p.Sku],
            [App.t('product.barcode', 'Штрихкод'),   p.Barcode],
            [App.t('product.company', 'Поставщик'),  App.model.erpLabel(p.ErpSource)],
            [App.t('product.size', 'Размер'),        p.Size],
            [App.t('product.weight', 'Вес'),         num(p.Weight, 'кг')],
            [App.t('product.weightNet', 'Нетто'),    num(p.WeightNet, 'кг')],
            [App.t('product.weightGross', 'Брутто'), num(p.WeightGross, 'кг')],
            [App.t('product.width', 'Ширина'),       num(p.Width, 'мм')],
            [App.t('product.height', 'Высота'),      num(p.Height, 'мм')],
            [App.t('product.depth', 'Глубина'),      num(p.Depth, 'мм')],
            [App.t('product.volume', 'Объём'),       num(p.Volume, 'м³')],
            [App.t('product.unitsPerBox', 'В упаковке'), p.UnitsPerBox],
            [App.t('product.vat', 'НДС'),            p.VatRate ? p.VatRate + '%' : null]
        ].filter(function (r) { return r[1] !== null && r[1] !== undefined && r[1] !== '' && r[1] !== 0; });

        if (!rows.length) return '<p class="t-mut">—</p>';

        return '<table class="specs"><tbody>' + rows.map(function (r) {
            return '<tr><td>' + App.utils.escape(r[0]) + '</td>' +
                   '<td>' + App.utils.escape(String(r[1])) + '</td></tr>';
        }).join('') + '</tbody></table>';

        function num(value, unit) {
            var n = parseFloat(value);
            return (!n || isNaN(n)) ? null : App.fmt.number(n) + ' ' + unit;
        }
    }

    function renderNotFound() {
        root.innerHTML =
            '<div class="empty">' +
                '<div class="empty__icon">' + App.icon('box', 26) + '</div>' +
                '<h2 class="empty__title">' + App.t('product.notFound', 'Товар не найден') + '</h2>' +
                '<p class="empty__text">' + App.t('product.notFoundText', '') + '</p>' +
                '<a class="btn btn--primary" href="shop.html">' +
                    App.t('shop.title', 'Каталог') + '</a>' +
            '</div>';
    }

    function skeleton() {
        return '<div class="pdetail">' +
                   '<div class="skel skel--img"></div>' +
                   '<div>' +
                       '<div class="skel skel--title"></div>' +
                       '<div class="skel skel--text"></div>' +
                       '<div class="skel skel--text" style="width:60%"></div>' +
                       '<div class="skel" style="height:80px;margin:20px 0;border-radius:16px"></div>' +
                       '<div class="skel" style="height:52px;border-radius:12px"></div>' +
                   '</div>' +
               '</div>';
    }

    /* ============================================================
       EK VERİLER
       ============================================================ */

    function loadRelated(p) {
        var list = App.catalog.related(p, 6);
        var section = document.getElementById('related-section');
        if (!list.length) { section.hidden = true; return; }

        section.hidden = false;
        App.card.render(document.getElementById('related-products'), list);
        App.card.refreshStates();
    }

    async function loadReviews(p) {
        var panel = document.getElementById('reviews-panel');
        if (!panel) return;

        var res = await App.review.byProduct(p.ProductId, 1, 20);
        var dist = App.review.distribution(res.items);

        if (!res.items.length) {
            panel.innerHTML =
                '<div class="empty">' +
                    '<div class="empty__icon">' + App.icon('star', 24) + '</div>' +
                    '<p class="empty__text">' + App.t('review.noneText', '') + '</p>' +
                '</div>';
            return;
        }

        panel.innerHTML =
            '<div class="rating-summary mb-6">' +
                '<div class="t-center">' +
                    '<div class="rating-summary__score">' + dist.average.toFixed(1) + '</div>' +
                    '<div class="t-xs t-dim">' + dist.total + ' ' + App.t('review.count', '') + '</div>' +
                '</div>' +
                '<div class="grow flex-col gap-2">' +
                    [5, 4, 3, 2, 1].map(function (star) {
                        var n = dist.counts[star - 1];
                        var pct = dist.total ? (n / dist.total * 100) : 0;
                        return '<div class="rating-bar">' +
                                   '<span>' + star + '★</span>' +
                                   '<span class="rating-bar__track">' +
                                       '<span class="rating-bar__fill" style="width:' + pct + '%"></span>' +
                                   '</span>' +
                                   '<span>' + n + '</span>' +
                               '</div>';
                    }).join('') +
                '</div>' +
            '</div>' +
            res.items.map(reviewHtml).join('');
    }

    function reviewHtml(r) {
        var name = r.UserName || r.userName || 'User';
        var pct = App.fmt.ratingPercent(r.Rating || r.rating);

        return '<div class="review">' +
                   '<div class="review__avatar">' + App.utils.escape(App.utils.initials(name)) + '</div>' +
                   '<div class="grow">' +
                       '<div class="flex items-c justify-b wrap gap-2">' +
                           '<span class="review__name">' + App.utils.escape(name) + '</span>' +
                           '<span class="review__date">' + App.fmt.date(r.CreatedAt || r.createdAt) + '</span>' +
                       '</div>' +
                       '<span class="stars"><span class="stars__bg">★★★★★</span>' +
                           '<span class="stars__fg" style="width:' + pct + '">★★★★★</span></span>' +
                       (r.Title ? '<div class="t-sm t-bold mt-2">' + App.utils.escape(r.Title) + '</div>' : '') +
                       '<p class="review__text">' + App.utils.escape(r.Body || r.body || '') + '</p>' +
                   '</div>' +
               '</div>';
    }

    /** Varyantlar yoksa kutu hiç çizilmez — boş başlık kalmasın. */
    async function loadVariants(p) {
        var box = document.getElementById('variants-box');
        if (!box) return;

        var variants = await App.catalog.getVariants(p.ProductId).catch(function () { return []; });
        if (!variants.length) return;

        box.innerHTML =
            '<div class="mb-5">' +
                '<div class="label">' + App.t('product.variants', 'Варианты') + '</div>' +
                '<div class="variants">' + variants.map(function (v) {
                    var vid = v.ProductId || v.VariantId;
                    var label = v.Name || v.Size || v.Sku || '—';
                    var out = (parseInt(v.StockAmount, 10) || 0) <= 0;

                    return '<a class="variant' + (String(vid) === String(p.ProductId) ? ' is-active' : '') +
                               (out ? ' is-out' : '') + '" href="product.html?id=' + vid + '">' +
                               App.utils.escape(App.fmt.truncate(label, 30)) +
                           '</a>';
                }).join('') + '</div>' +
            '</div>';
    }

    /* ============================================================
       OLAYLAR
       ============================================================ */

    function bindActions() {
        App.actions.register('tab', function (btn) {
            var name = btn.dataset.tab;

            App.utils.$$('.tab').forEach(function (t) {
                t.classList.toggle('is-active', t === btn);
            });
            App.utils.$$('.tab-panel').forEach(function (panel) {
                panel.classList.toggle('is-active', panel.dataset.panel === name);
            });
        });
    }
});
