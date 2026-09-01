/* ============================================================
   ui/product-card.js — ÜRÜN KARTI
   ------------------------------------------------------------
   Kart TEK YERDE üretilir. Ana sayfa, mağaza, arama, benzer
   ürünler — hepsi bu fonksiyonu çağırır; kart görünümü değişince
   altı ekran birden değişir.

   Butonlara `onclick` YAZILMAZ. Bunun yerine `data-act` niteliği
   konur ve tıklamalar ui/actions.js içinde TEK dinleyiciyle
   yakalanır (olay devri). Sebep: sayfada 100 kart varken 300
   dinleyici bağlamak yerine 1 dinleyici yeter ve sonradan basılan
   kartlar da kendiliğinden çalışır.
   ============================================================ */

(function (App) {
    'use strict';

    var Card = {};

    /* ------------------------------------------------------------
       YILDIZ
       ------------------------------------------------------------ */
    function starsHtml(rating, count) {
        var pct = App.fmt.ratingPercent(rating);
        return '<div class="pcard__rating">' +
                   '<span class="stars">' +
                       '<span class="stars__bg">★★★★★</span>' +
                       '<span class="stars__fg" style="width:' + pct + '">★★★★★</span>' +
                   '</span>' +
                   '<span>(' + (count || 0) + ')</span>' +
               '</div>';
    }

    /* ------------------------------------------------------------
       KART
       ------------------------------------------------------------ */

    /**
     * @param {Object} product sunucudan gelen ürün
     * @returns {HTMLElement}
     */
    Card.create = function (product) {
        var id      = product.ProductId;
        var name    = product.Name || '';
        var url     = App.model.url(product);
        var img     = App.model.image(product);
        var stock   = App.model.stock(product);
        var inWish  = App.wishlist.has(id);
        var inCmp   = App.compare.has(id);

        var wrap = App.utils.el('article', {
            class: 'pcard',
            dataset: { productId: id }
        });

        var flags = App.model.flags(product).map(function (f) {
            return '<span class="badge badge--' + f.type + '">' + App.utils.escape(f.text) + '</span>';
        }).join('');

        wrap.innerHTML =
            '<div class="pcard__media">' +
                '<a href="' + url + '" aria-label="' + App.utils.escape(name) + '">' +
                    '<img class="pcard__img" src="' + App.utils.escape(img) + '" ' +
                         'alt="' + App.utils.escape(name) + '" loading="lazy" ' +
                         'onerror="this.src=\'' + App.config.FALLBACK_IMAGE + '\'">' +
                '</a>' +

                (flags ? '<div class="pcard__flags">' + flags + '</div>' : '') +

                '<div class="pcard__acts">' +
                    '<button type="button" class="pact pact--wish' + (inWish ? ' is-active' : '') + '" ' +
                            'data-act="wishlist" data-id="' + id + '" ' +
                            'title="' + App.t('header.wishlist', 'Favoriler') + '" ' +
                            'aria-pressed="' + inWish + '">' +
                        App.icon('heart', 14) +
                    '</button>' +
                    '<button type="button" class="pact pact--compare' + (inCmp ? ' is-active' : '') + '" ' +
                            'data-act="compare" data-id="' + id + '" ' +
                            'title="' + App.t('header.compare', 'Karşılaştır') + '" ' +
                            'aria-pressed="' + inCmp + '">' +
                        App.icon('compare', 14) +
                    '</button>' +
                '</div>' +

                '<div class="pcard__cart">' +
                    '<button type="button" class="btn btn--primary btn--sm btn--block" ' +
                            'data-act="add-to-cart" data-id="' + id + '"' +
                            (stock.canOrder ? '' : ' disabled') + '>' +
                        App.icon('cart', 13) +
                        '<span>' + (stock.canOrder
                            ? App.t('product.addToCart', 'Sepete ekle')
                            : App.t('stock.outOfStock', 'Tükendi')) + '</span>' +
                    '</button>' +
                '</div>' +
            '</div>' +

            '<div class="pcard__body">' +
                (product.CategoryName
                    ? '<span class="pcard__cat">' + App.utils.escape(product.CategoryName) + '</span>'
                    : '') +

                '<h3 class="pcard__name">' +
                    '<a href="' + url + '">' + App.fmt.preserveSpaces(App.utils.escape(name)) + '</a>' +
                '</h3>' +

                '<p class="pcard__desc t-sm t-mut">' + App.utils.escape(App.model.shortDesc(product, 110)) + '</p>' +

                starsHtml(product.AverageRating, product.TotalReviewCount) +

                '<div class="pcard__foot">' +
                    '<div class="pcard__price">' + App.model.priceHtml(product) + '</div>' +
                    '<span class="pcard__stock pcard__stock--' + stock.level + '">' +
                        '<span class="dot dot--' + (stock.level === 'in' ? 'ok' : stock.level === 'pre' ? 'warn' : 'err') + '"></span>' +
                        App.utils.escape(stock.label) +
                    '</span>' +
                '</div>' +
            '</div>';

        return wrap;
    };

    /**
     * Listeyi kapsayıcıya bas.
     * DocumentFragment kullanılır: 60 kart tek seferde eklenir,
     * tarayıcı her kart için yeniden yerleşim hesaplamaz.
     */
    Card.render = function (container, products) {
        if (!container) return;

        container.innerHTML = '';
        var frag = document.createDocumentFragment();

        (products || []).forEach(function (p) { frag.appendChild(Card.create(p)); });
        container.appendChild(frag);
    };

    /** Yükleniyor iskeleti — ürünler gelene kadar boş beyaz alan kalmasın. */
    Card.skeletons = function (container, count) {
        if (!container) return;

        var html = '';
        for (var i = 0; i < (count || 8); i++) {
            html += '<div class="pcard">' +
                        '<div class="skel skel--img"></div>' +
                        '<div class="pcard__body">' +
                            '<div class="skel skel--text" style="width:40%"></div>' +
                            '<div class="skel skel--text"></div>' +
                            '<div class="skel skel--text" style="width:70%"></div>' +
                            '<div class="skel skel--text" style="width:50%;height:18px;margin-top:12px"></div>' +
                        '</div>' +
                    '</div>';
        }
        container.innerHTML = html;
    };

    /**
     * Kalp / karşılaştır düğmelerinin durumunu tazele.
     * Sayfadaki tüm kartlar taranır; giriş sonrası ya da başka
     * sekmede değişiklik olduğunda çağrılır.
     */
    Card.refreshStates = function (root) {
        var wishIds = App.wishlist.getIds();

        App.utils.$$('[data-act="wishlist"]', root || document).forEach(function (btn) {
            var on = wishIds.indexOf(String(btn.dataset.id)) !== -1;
            btn.classList.toggle('is-active', on);
            btn.setAttribute('aria-pressed', on);
        });

        App.utils.$$('[data-act="compare"]', root || document).forEach(function (btn) {
            var on = App.compare.has(btn.dataset.id);
            btn.classList.toggle('is-active', on);
            btn.setAttribute('aria-pressed', on);
        });
    };

    App.card = Card;

    /* Liste durumu değiştiğinde kartlar kendiliğinden hizalanır. */
    App.bus.on(App.bus.EVENTS.WISHLIST_CHANGED, function () { Card.refreshStates(); });
    App.bus.on(App.bus.EVENTS.COMPARE_CHANGED,  function () { Card.refreshStates(); });

})(window.App);
