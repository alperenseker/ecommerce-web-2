/* ============================================================
   ui/quick-view.js — HIZLI BAKIŞ PENCERESİ
   ------------------------------------------------------------
   Kullanıcı listeden çıkmadan ürünü görsün: görsel, fiyat, stok,
   kısa açıklama, varyant seçimi, miktar ve sepete ekleme.

   Neden var: bir mekanizmanın "hangi ölçü / hangi renk" olduğunu
   anlamak için her seferinde detay sayfasına gidip geri dönmek
   listedeki yeri kaybettiriyordu.

   Ürün önce KATALOG ÖNBELLEĞİNDEN çizilir (anında açılır), tam
   kayıt sunucudan gelince açıklama ve ölçüler tamamlanır.
   ============================================================ */

(function (App) {
    'use strict';

    App.actions.register('quick-view', async function (btn) {
        var id = btn.dataset.id;
        if (!id) return;

        var product = App.catalog.findById(id);
        var t = App.t;

        var modal = App.modal.open({
            wide: true,
            title: t('shopList.card.quickView', 'Быстрый просмотр'),
            body: product
                ? bodyHtml(product)
                : '<div class="flex justify-c" style="padding:40px"><span class="spinner spinner--lg"></span></div>'
        });

        /* Tam kayıt: açıklama, ölçüler, varyantlar liste yanıtında yok. */
        var full = product;
        try {
            var res = await App.api.products.getById(id);
            if (res.success && res.data) full = res.data;
        } catch (e) { /* önbellekteki kayıtla devam */ }

        if (!full) {
            modal.el.querySelector('.modal__body').innerHTML =
                '<p class="t-mut">' + t('shopList.modal.notFound', 'Товар не найден.') + '</p>';
            return;
        }

        modal.el.querySelector('.modal__body').innerHTML = bodyHtml(full);

        /* Varyantlar en son gelir; kutusu hazırdır, sessizce dolar. */
        var data = await App.variants.load(id);
        var box = modal.el.querySelector('#qv-variants');
        if (data && box) box.innerHTML = App.variants.html(data);

        App.card.refreshStates(modal.el);
    });

    function bodyHtml(p) {
        var t = App.t;
        var stock = App.model.stock(p);
        var cat = App.catalog.findCategory(p.CategoryId);
        var desc = String(p.Description || p.ShortDescription || '').trim();

        var inWish = App.wishlist.has(p.ProductId);
        var inCmp  = App.compare.has(p.ProductId);

        return '<div class="pdetail" style="border:0;padding:0;gap:var(--sp-5)">' +

                   '<div class="gallery__main">' +
                       '<img src="' + App.utils.escape(App.model.image(p)) + '" ' +
                            'alt="' + App.utils.escape(p.Name || '') + '" ' +
                            'onerror="this.src=\'' + App.config.FALLBACK_IMAGE + '\'">' +
                   '</div>' +

                   '<div>' +
                       (cat ? '<a class="pcard__cat" href="shop.html?category=' + cat.Id + '">' +
                                  App.utils.escape(cat.Name) + '</a>' : '') +

                       '<h3 style="font-size:var(--fs-xl);margin:4px 0 10px">' +
                           App.fmt.preserveSpaces(App.utils.escape(p.Name || '')) + '</h3>' +

                       '<div class="pdetail__meta" style="margin-bottom:12px;padding-bottom:10px">' +
                           (p.Sku ? '<span class="t-mono t-xs t-dim">' + t('productDetail.sku', 'Артикул') +
                                    ': ' + App.utils.escape(p.Sku) + '</span>' : '') +
                           '<span class="pcard__stock pcard__stock--' + stock.level + '">' +
                               '<span class="dot dot--' + (stock.level === 'in' ? 'ok' :
                                    stock.level === 'pre' ? 'warn' : 'err') + '"></span>' +
                               App.utils.escape(stock.label) +
                               (stock.inStock ? ' · ' + App.fmt.number(stock.amount, 0) + ' ' +
                                                t('stock.pieces', 'шт') : '') +
                           '</span>' +
                       '</div>' +

                       '<div class="pdetail__price-box" style="padding:12px;margin-bottom:16px">' +
                           App.model.priceHtml(p) +
                       '</div>' +

                       '<div id="qv-variants"></div>' +

                       (desc ? '<p class="t-sm t-mut t-clamp-3">' + App.utils.escape(desc) + '</p>' : '') +

                       '<div class="flex wrap gap-2 items-c mt-3">' +
                           '<div class="qty">' +
                               '<button class="qty__btn" type="button" data-act="qty-dec" data-target="qv-qty">' +
                                   App.icon('minus', 13) + '</button>' +
                               '<input class="qty__input" id="qv-qty" type="number" value="1" min="1" max="100000">' +
                               '<button class="qty__btn" type="button" data-act="qty-inc" data-target="qv-qty">' +
                                   App.icon('plus', 13) + '</button>' +
                           '</div>' +

                           '<button class="btn btn--primary grow" type="button" data-act="add-to-cart" ' +
                                   'data-id="' + p.ProductId + '" data-qty-target="qv-qty"' +
                                   (stock.canOrder ? '' : ' disabled') + ' style="min-width:150px">' +
                               App.icon('cart', 14) +
                               '<span>' + (stock.canOrder
                                   ? t('shopList.card.addToCart', 'В корзину')
                                   : t('shopList.card.outOfStock', 'Нет в наличии')) + '</span>' +
                           '</button>' +

                           '<button class="btn btn--ghost btn--icon' + (inWish ? ' is-active' : '') + '" ' +
                                   'type="button" data-act="wishlist" data-id="' + p.ProductId + '" ' +
                                   'title="' + t('shopList.card.addWishlist', 'Избранное') + '">' +
                               App.icon('heart', 15) + '</button>' +

                           '<button class="btn btn--ghost btn--icon' + (inCmp ? ' is-active' : '') + '" ' +
                                   'type="button" data-act="compare" data-id="' + p.ProductId + '" ' +
                                   'title="' + t('shopList.card.compare', 'Сравнить') + '">' +
                               App.icon('compare', 15) + '</button>' +
                       '</div>' +

                       '<a class="btn btn--link mt-3" href="' + App.model.url(p) + '">' +
                           t('shopList.modal.goToDetail', 'Перейти к товару') +
                           App.icon('arrowRight', 13) +
                       '</a>' +
                   '</div>' +
               '</div>';
    }

})(window.App);
