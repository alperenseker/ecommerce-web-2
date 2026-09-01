/* ============================================================
   data/product-model.js — ÜRÜN VERİSİNİ OKUMA KURALLARI
   ------------------------------------------------------------
   Sunucudan gelen ürün nesnesi 1C kaynaklıdır ve alan adları yer
   yer hem PascalCase hem camelCase gelir. "Bu ürünün resmi ne?",
   "fiyatı görünür mü?", "stokta mı?" gibi sorular ekranlarda tek
   tek çözülmez — cevap HEP buradan alınır.

   Böylece bir kural değiştiğinde (ör. yeni bir stok durumu) tek
   dosya düzeltilir, 6 ekran birden doğru davranır.
   ============================================================ */

(function (App) {
    'use strict';

    var M = {};

    /** İki yazımdan hangisi geldiyse onu döndür. */
    function pick(obj, pascal, camel) {
        if (!obj) return undefined;
        return obj[pascal] !== undefined ? obj[pascal] : obj[camel];
    }

    /* ============================================================
       GÖRSEL
       ============================================================ */

    /**
     * Ürünün ana görseli.
     * Sıra: MainImage → Images dizisinin ilki → yedek görsel.
     * `Images` sunucudan JSON METNİ olarak gelebilir, çözülür.
     */
    M.image = function (product) {
        if (!product) return App.config.FALLBACK_IMAGE;

        var main = pick(product, 'MainImage', 'mainImage');
        if (main && String(main).trim()) return main;

        var images = M.images(product);
        if (images.length) return images[0];

        return App.config.FALLBACK_IMAGE;
    };

    /** Tüm görseller — her zaman DİZİ döner (boş olabilir). */
    M.images = function (product) {
        if (!product) return [];

        var raw = pick(product, 'Images', 'images');
        var list = App.utils.parseJson(raw);

        if (!Array.isArray(list)) list = [];
        list = list.filter(function (src) { return src && String(src).trim(); });

        /* MainImage listede yoksa başa eklenir — galeride kapak
           görselinin kaybolmaması için. */
        var main = pick(product, 'MainImage', 'mainImage');
        if (main && list.indexOf(main) === -1) list.unshift(main);

        return list;
    };

    /* ============================================================
       FİYAT GÖRÜNÜRLÜĞÜ
       ============================================================ */

    /**
     * Fiyat ziyaretçiden gizli mi?
     * Sunucu iki alanı birlikte gönderir:
     *   • HasPrice === false   → fiyat çözülemedi (kategori yok vb.)
     *   • PriceHidden === true → yönetici bilerek sakladı
     * İkisinde de `Price` 0 gelir. Bu yüzden "0,00 ₸" basmak yerine
     * bu soruyu sormak ZORUNLUDUR.
     */
    M.isPriceHidden = function (product) {
        if (!product) return false;

        var hidden = pick(product, 'PriceHidden', 'priceHidden');
        if (hidden === true) return true;

        var has = pick(product, 'HasPrice', 'hasPrice');
        if (has === false) return true;

        return false;
    };

    /** Fiyat yerine geçen "fiyat için sorunuz" metni (HTML). */
    M.priceOnRequestHtml = function () {
        var label = App.t('common.priceOnRequest', 'Fiyat için sorunuz');
        var hint  = App.t('common.priceOnRequestHint', 'Fiyatları görmek için giriş yapın');
        return '<span class="price-ask" title="' + App.utils.escape(hint) + '">' +
               App.utils.escape(label) + '</span>';
    };

    /**
     * Kart / detay için hazır fiyat HTML'i.
     * Tek yerde durur ki indirim gösterimi her ekranda aynı olsun.
     */
    M.priceHtml = function (product) {
        if (M.isPriceHidden(product)) return M.priceOnRequestHtml();

        var price = parseFloat(pick(product, 'Price', 'price')) || 0;
        var old   = parseFloat(pick(product, 'OldPrice', 'oldPrice')) || 0;

        var html = '<span class="price-now">' + App.fmt.price(price) + '</span>';
        if (old > price) html += '<span class="price-old">' + App.fmt.price(old) + '</span>';
        return html;
    };

    /** İndirim yüzdesi (yoksa 0). */
    M.discountPercent = function (product) {
        if (M.isPriceHidden(product)) return 0;
        var price = parseFloat(pick(product, 'Price', 'price')) || 0;
        var old   = parseFloat(pick(product, 'OldPrice', 'oldPrice')) || 0;
        if (old <= price || old <= 0) return 0;
        return Math.round((1 - price / old) * 100);
    };

    /* ============================================================
       STOK
       ============================================================ */

    /**
     * Stok durumu — ekranın ihtiyacı olan her şey tek nesnede.
     * `canOrderWithoutStock` yetkisi olan bayi stok bitse de sipariş
     * verebilir; bu yüzden "stokta yok" ile "siparişe kapalı" AYNI
     * ŞEY DEĞİLDİR.
     */
    M.stock = function (product) {
        var amount = parseInt(pick(product, 'StockAmount', 'stockAmount'), 10) || 0;
        var status = pick(product, 'StockStatus', 'stockStatus');
        var inStock = amount > 0 && status !== App.const.STOCK_OUT;

        var canOrderWithoutStock = App.store.getBool(App.keys.CAN_ORDER_NO_STOCK);

        if (inStock) {
            return { amount: amount, inStock: true, canOrder: true,
                     level: 'in', label: App.t('stock.inStock', 'Stokta') };
        }
        if (canOrderWithoutStock) {
            return { amount: amount, inStock: false, canOrder: true,
                     level: 'pre', label: App.t('stock.preOrder', 'Ön sipariş') };
        }
        return { amount: amount, inStock: false, canOrder: false,
                 level: 'out', label: App.t('stock.outOfStock', 'Tükendi') };
    };

    /* ============================================================
       ŞİRKET (1C KAYNAĞI)
       ------------------------------------------------------------
       Bir sepet, ŞİRKET BAŞINA bir siparişe bölünür. Sepet ve sipariş
       ekranları kalemin hangi şirkete ait olduğunu göstermek zorunda.

       Ad çözüm sırası:
         1) sunucudan gelen ad (sipariş uçları ErpSourceName döndürür)
         2) App.const.ERP_LABELS eşlemesi
         3) kodun baş harfi büyük hâli
       `GET /api/erp-sources` yalnız yöneticiye açık olduğu için
       müşteri tarafında adlar oradan çekilemez.
       ============================================================ */

    M.erpLabel = function (code, nameFromServer) {
        var given = String(nameFromServer || '').trim();
        if (given) return given;

        var key = String(code || '').trim();
        if (!key) return App.t('cart.otherCompany', 'Diğer');

        var known = App.const.ERP_LABELS[key.toLowerCase()];
        if (known) return known;

        return key.charAt(0).toUpperCase() + key.slice(1);
    };

    /**
     * Sepet kaleminin şirket kodu.
     * Önce kalemin anlık görüntüsüne (snapshot) bakılır; eski
     * kalemlerde snapshot olmayabilir, o zaman katalog önbelleğinden
     * ürün bulunup oradan okunur.
     */
    M.cartItemErp = function (item) {
        if (!item) return '';

        var snapshot = App.utils.parseJson(item.ProductSnapshot || item.productSnapshot);
        var fromSnapshot = snapshot && (snapshot.erpSource || snapshot.ErpSource);
        if (fromSnapshot) return String(fromSnapshot).trim();

        var cached = App.catalog ? App.catalog.findById(item.ProductId) : null;
        return String((cached && (cached.ErpSource || cached.erpSource)) || '').trim();
    };

    /**
     * Sepet kalemlerini şirkete göre grupla.
     * Grup sırası kalemlerin SEPETTEKİ sırasıdır (ilk görülen şirket
     * önce). Sunucudaki bölme sırası erp_sources.sort_order'a göredir,
     * bu yüzden ekrandaki sıra ile sipariş numarasındaki sıra aynı
     * olmak zorunda değildir.
     *
     * @returns {{code:string, label:string, items:Array, subtotal:number}[]}
     */
    M.groupByErp = function (items) {
        var groups = [];
        var index = {};

        (items || []).forEach(function (item) {
            var code = M.cartItemErp(item);
            var key  = code.toLowerCase() || '__unknown__';

            if (index[key] === undefined) {
                index[key] = groups.length;
                groups.push({ code: code, label: M.erpLabel(code), items: [], subtotal: 0 });
            }

            var group = groups[index[key]];
            var unit  = parseFloat(item.UnitPrice) || 0;
            var qty   = parseInt(item.Quantity, 10) || 0;
            var line  = (item.TotalPrice !== undefined && item.TotalPrice !== null)
                ? (parseFloat(item.TotalPrice) || 0)
                : unit * qty;

            group.items.push(item);
            group.subtotal += line;
        });

        return groups;
    };

    /* ============================================================
       ÇEŞİTLİ
       ============================================================ */

    /** Ürün detay bağlantısı — tek yerde ki URL şeması değişirse kolay olsun. */
    M.url = function (product) {
        var slug = pick(product, 'Slug', 'slug');
        return 'product.html?slug=' + encodeURIComponent(slug || '');
    };

    /** Kısa açıklama (kartlar için kırpılmış). */
    M.shortDesc = function (product, max) {
        var text = pick(product, 'ShortDescription', 'shortDescription') || '';
        return App.fmt.truncate(text, max || 90);
    };

    /** Ürün etiketleri: yeni / öne çıkan / indirim. */
    M.flags = function (product) {
        var out = [];
        var discount = M.discountPercent(product);

        if (discount > 0) out.push({ type: 'gold', text: '-' + discount + '%' });
        if (pick(product, 'IsNewArrival', 'isNewArrival')) out.push({ type: 'acc', text: App.t('badge.new', 'Yeni') });
        if (pick(product, 'IsFeatured', 'isFeatured'))     out.push({ type: 'chrome', text: App.t('badge.featured', 'Öne çıkan') });

        return out;
    };

    App.model = M;

})(window.App);
