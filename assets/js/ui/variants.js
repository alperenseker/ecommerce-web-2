/* ============================================================
   ui/variants.js — VARYANT SEÇİCİ (model / renk)
   ------------------------------------------------------------
   `GET /products/{id}/variants` DİZİ DEĞİL, NESNE döndürür:

       { ParentProductId, CurrentProductId, TotalVariants, HasVariants,
         Variants[], DesignOptions[], ColorOptions[], DesignColorMap,
         SelectedDesign, SelectedColor }

   Aynı seçici iki yerde lazım: ürün detayı ve hızlı bakış penceresi.
   İkisine kopyalanmasın diye burada duruyor.

   🔴 SEÇENEK NORMALLEŞTİRME: elle kurulan varyant gruplarında sunucu
   `ColorOptions`'ı RENK ADINA göre grupluyor. Üyelerin rengi yoksa
   hepsi tek boş seçeneğe çöküyor ve kullanıcı üç ürünü tek düğme
   olarak görüyor. Seçenekler bütün varyantları kapsamıyorsa liste
   `Variants` üzerinden yeniden kuruluyor — her üye kendi düğmesini
   alsın.
   ============================================================ */

(function (App) {
    'use strict';

    var V = {};

    function pick(obj, pascal, camel) {
        if (!obj) return undefined;
        return obj[pascal] !== undefined ? obj[pascal] : obj[camel];
    }

    /* ------------------------------------------------------------
       VERİ
       ------------------------------------------------------------ */

    /**
     * @returns {Promise<Object|null>} normalleştirilmiş varyant verisi
     *          (varyant yoksa null)
     */
    V.load = async function (productId) {
        var data;

        try {
            var res = await App.api.products.getVariants(productId);
            data = res && res.data;
        } catch (e) {
            return null;
        }

        if (!data) return null;

        var variants = pick(data, 'Variants', 'variants') || [];
        var designs  = pick(data, 'DesignOptions', 'designOptions') || [];
        var colors   = pick(data, 'ColorOptions', 'colorOptions') || [];

        /* Tek üye varsa seçilecek bir şey yok. */
        if (variants.length <= 1 && designs.length <= 1 && colors.length <= 1) return null;

        colors = normalizeColors(variants, designs, colors);

        return {
            current:  pick(data, 'CurrentProductId', 'currentProductId') || productId,
            variants: variants,
            designs:  designs,
            colors:   colors,
            map:      pick(data, 'DesignColorMap', 'designColorMap') || {},
            selectedDesign: pick(data, 'SelectedDesign', 'selectedDesign') || null,
            selectedColor:  cleanColor(pick(data, 'SelectedColor', 'selectedColor'))
        };
    };

    /** 'undefined' metni ve boş değer aynı şey: renk yok. */
    function cleanColor(value) {
        var v = String(value === undefined || value === null ? '' : value).trim();
        return (!v || v === 'undefined') ? null : v;
    }

    /** Renk seçenekleri bütün varyantları kapsamıyorsa yeniden kur. */
    function normalizeColors(variants, designs, colors) {
        if (variants.length <= 1) return colors;
        if (designs.length > 1) return colors;

        var covered = {};
        colors.forEach(function (o) {
            var id = pick(o, 'ProductId', 'productId');
            if (id) covered[id] = true;
        });

        var coversAll = variants.every(function (v) {
            return covered[pick(v, 'ProductId', 'productId')];
        });
        if (coversAll) return colors;

        return variants.map(function (v) {
            var amount = parseInt(pick(v, 'StockAmount', 'stockAmount'), 10) || 0;
            return {
                Type: 'color',
                Color: pick(v, 'Color', 'color') || pick(v, 'Name', 'name') || '',
                ProductId: pick(v, 'ProductId', 'productId'),
                IsAvailable: amount > 0 && pick(v, 'StockStatus', 'stockStatus') !== App.const.STOCK_OUT
            };
        });
    }

    /* ------------------------------------------------------------
       ÇİZİM
       ------------------------------------------------------------ */

    /**
     * Seçici HTML'i. Seçenekler BAĞLANTIDIR (ürün sayfasına gider):
     * her varyant ayrı bir üründür, sepete eklenirken de öyle gider.
     *
     * @param {Object} data V.load() sonucu
     * @returns {string}
     */
    V.html = function (data) {
        if (!data) return '';

        var t = App.t;
        var blocks = [];

        /* ---- model ---- */
        if (data.designs.length > 1) {
            blocks.push(group(
                t('shopList.modal.model', 'Модель'),
                data.selectedDesign,
                data.designs.map(function (option) {
                    var label = pick(option, 'Design', 'design') || pick(option, 'Name', 'name') || '—';
                    return chip(pick(option, 'ProductId', 'productId'), label,
                                label === data.selectedDesign,
                                pick(option, 'IsAvailable', 'isAvailable'));
                }).join('')
            ));
        }

        /* ---- renk ----
           Model seçiliyse yalnız O MODELE ait renkler gösterilir;
           yoksa kullanıcı olmayan bir birleşimi seçebilir. */
        var colorList = (data.selectedDesign && data.map[data.selectedDesign])
            ? data.map[data.selectedDesign]
            : data.colors;

        if (colorList && colorList.length > 1) {
            blocks.push(group(
                t('shopList.modal.color', 'Цвет'),
                data.selectedColor,
                colorList.map(function (option) {
                    var label = cleanColor(pick(option, 'Color', 'color')) || '—';
                    var id = pick(option, 'ProductId', 'productId');
                    return chip(id, label,
                                String(id) === String(data.current) ||
                                    (data.selectedColor && label === data.selectedColor),
                                pick(option, 'IsAvailable', 'isAvailable'));
                }).join('')
            ));
        }

        /* ---- model/renk yoksa düz varyant listesi ---- */
        if (!blocks.length && data.variants.length > 1) {
            blocks.push(group(
                t('shopList.modal.model', 'Варианты'),
                null,
                data.variants.map(function (v) {
                    var id = pick(v, 'ProductId', 'productId');
                    var amount = parseInt(pick(v, 'StockAmount', 'stockAmount'), 10) || 0;
                    var label = pick(v, 'Sku', 'sku') || pick(v, 'Name', 'name') || '—';
                    return chip(id, App.fmt.truncate(label, 28),
                                String(id) === String(data.current), amount > 0);
                }).join('')
            ));
        }

        return blocks.join('');

        function group(label, selected, body) {
            return '<div class="mb-4">' +
                       '<div class="label">' + App.utils.escape(label) +
                           (selected ? ': <span class="t-mut">' + App.utils.escape(selected) + '</span>' : '') +
                       '</div>' +
                       '<div class="variants">' + body + '</div>' +
                   '</div>';
        }

        function chip(productId, label, active, available) {
            if (!productId) {
                return '<span class="variant' + (available === false ? ' is-out' : '') + '">' +
                       App.utils.escape(label) + '</span>';
            }
            return '<a class="variant' + (active ? ' is-active' : '') +
                       (available === false ? ' is-out' : '') + '" ' +
                       'href="product.html?id=' + encodeURIComponent(productId) + '">' +
                       App.utils.escape(label) +
                   '</a>';
        }
    };

    App.variants = V;

})(window.App);
