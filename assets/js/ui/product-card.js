/* ============================================================
   ui/product-card.js — ÜRÜN KARTI
   ------------------------------------------------------------
   Kart TEK YERDE üretilir: ana sayfa, mağaza, arama, benzer
   ürünler, istek listesi — hepsi bunu çağırır.

   Düğmelere `onclick` YAZILMAZ; `data-act` niteliği konur ve
   tıklamalar ui/actions.js içindeki TEK dinleyicide toplanır
   (olay devri). 100 kart için 300 dinleyici yerine 1 tane yeter.

   Metinler kaynak projedeki sözlükten gelir: `shopList.card.*`
   ============================================================ */

(function (App) {
    'use strict';

    var Card = {};

    /* ------------------------------------------------------------
       YILDIZ — yalnız değerlendirme VARSA çizilir; sıfır yıldız
       satırı kartı gereksiz uzatıyor ve "kötü ürün" izlenimi veriyor.
       ------------------------------------------------------------ */
    function ratingHtml(product) {
        var count = parseInt(product.TotalReviewCount, 10) || 0;
        if (!count) return '<div class="pcard__rating">&nbsp;</div>';

        var pct = App.fmt.ratingPercent(product.AverageRating);
        return '<div class="pcard__rating">' +
                   '<span class="stars">' +
                       '<span class="stars__bg">★★★★★</span>' +
                       '<span class="stars__fg" style="width:' + pct + '">★★★★★</span>' +
                   '</span>' +
                   '<span>(' + count + ')</span>' +
               '</div>';
    }

    /* ------------------------------------------------------------
       KART
       ------------------------------------------------------------ */

    /**
     * @param {Object} product sunucudan gelen ürün kaydı
     * @returns {HTMLElement}
     */
    Card.create = function (product) {
        var id     = product.ProductId;
        var name   = product.Name || '';
        var url    = App.model.url(product);
        var img    = App.model.image(product);
        var stock  = App.model.stock(product);
        var inWish = App.wishlist.has(id);
        var inCmp  = App.compare.has(id);

        var wrap = App.utils.el('article', { class: 'pcard', dataset: { productId: id } });

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
                            'title="' + App.t('shopList.card.addWishlist', 'Избранное') + '" ' +
                            'aria-pressed="' + inWish + '">' +
                        App.icon('heart', 14) +
                    '</button>' +
                    '<button type="button" class="pact pact--compare' + (inCmp ? ' is-active' : '') + '" ' +
                            'data-act="compare" data-id="' + id + '" ' +
                            'title="' + App.t('shopList.card.compare', 'Сравнить') + '" ' +
                            'aria-pressed="' + inCmp + '">' +
                        App.icon('compare', 14) +
                    '</button>' +
                    /* Hızlı bakış: listeden çıkmadan ürünü incele. */
                    '<button type="button" class="pact pact--quick" ' +
                            'data-act="quick-view" data-id="' + id + '" ' +
                            'title="' + App.t('shopList.card.quickView', 'Быстрый просмотр') + '">' +
                        App.icon('zoom', 14) +
                    '</button>' +
                '</div>' +
            '</div>' +

            '<div class="pcard__body">' +
                (product.Sku
                    ? '<span class="pcard__cat t-mono">' + App.utils.escape(product.Sku) + '</span>'
                    : '<span class="pcard__cat">' + App.utils.escape(App.model.erpLabel(product.ErpSource)) + '</span>') +

                '<h3 class="pcard__name t-clamp-2">' +
                    '<a href="' + url + '">' + App.fmt.preserveSpaces(App.utils.escape(name)) + '</a>' +
                '</h3>' +

                '<p class="pcard__desc t-sm t-mut t-clamp-2">' +
                    App.utils.escape(App.model.shortDesc(product, 160)) + '</p>' +

                ratingHtml(product) +

                '<div class="pcard__foot">' +
                    '<div class="pcard__price">' + App.model.priceHtml(product) + '</div>' +
                    '<span class="pcard__stock pcard__stock--' + stock.level + '">' +
                        '<span class="dot dot--' + toneOf(stock.level) + '"></span>' +
                        App.utils.escape(stock.label) +
                    '</span>' +
                '</div>' +
            '</div>' +

            '<div class="pcard__cart">' +
                /* Sakin düğme: bir rafta 14 dolu indigo düğme yan yana
                   gelince ekran bağırıyor. Üzerine gelince markanın
                   rengine dönüyor. */
                '<button type="button" class="btn btn--ghost btn--sm btn--block" ' +
                        'data-act="add-to-cart" data-id="' + id + '"' +
                        (stock.canOrder ? '' : ' disabled') + '>' +
                    App.icon('cart', 13) +
                    '<span>' + (stock.canOrder
                        ? App.t('shopList.card.addToCart', 'В корзину')
                        : App.t('shopList.card.outOfStock', 'Нет в наличии')) + '</span>' +
                '</button>' +
            '</div>';

        return wrap;
    };

    function toneOf(level) {
        return level === 'in' ? 'ok' : level === 'pre' ? 'warn' : 'err';
    }

    /**
     * Listeyi kapsayıcıya bas.
     * DocumentFragment: 60 kart tek seferde eklenir, tarayıcı her
     * kart için yeniden yerleşim hesaplamaz.
     */
    Card.render = function (container, products) {
        if (!container) return;

        container.innerHTML = '';
        var frag = document.createDocumentFragment();

        (products || []).forEach(function (p) { frag.appendChild(Card.create(p)); });
        container.appendChild(frag);
    };

    /** Yükleniyor iskeleti — kartlar gelene kadar boş alan kalmasın. */
    Card.skeletons = function (container, count) {
        if (!container) return;

        var html = '';
        for (var i = 0; i < (count || 8); i++) {
            html += '<div class="pcard">' +
                        '<div style="padding:12px"><div class="skel skel--img"></div></div>' +
                        '<div class="pcard__body">' +
                            '<div class="skel skel--text" style="width:40%"></div>' +
                            '<div class="skel skel--text"></div>' +
                            '<div class="skel skel--text" style="width:70%"></div>' +
                            '<div class="skel skel--text" style="width:50%;height:18px;margin-top:10px"></div>' +
                        '</div>' +
                        '<div class="pcard__cart"><div class="skel" style="height:30px;border-radius:8px"></div></div>' +
                    '</div>';
        }
        container.innerHTML = html;
    };

    /**
     * Kalp / karşılaştır düğmelerinin durumunu tazele.
     * Giriş sonrası ya da başka sekmedeki değişiklikte çağrılır.
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

    /* Liste durumu değişince kartlar kendiliğinden hizalanır. */
    App.bus.on(App.bus.EVENTS.WISHLIST_CHANGED, function () { Card.refreshStates(); });
    App.bus.on(App.bus.EVENTS.COMPARE_CHANGED,  function () { Card.refreshStates(); });

})(window.App);
