/* ============================================================
   data/sales-unit.js — SATIŞ BİRİMİ (AMBALAJ) KURALLARI — FAZ 38
   ------------------------------------------------------------
   Sunucu (FAZ 36) satış birimli üründe `Price`'ı AMBALAJ fiyatı,
   `StockAmount`'u AMBALAJ cinsinden stok olarak gönderir;
   `BasePrice` taban birim fiyatıdır (821 ₸/кг), `MinOrderQty` /
   `OrderStep` adet kuralıdır (geçerli adetler: min, min+adım, …).
   İstemci bunları addan ya da kendi hesabıyla TÜRETMEZ; yalnız
   yazar ve kuralı uygular. Son sözü sunucu söyler: kurala uymayan
   adedi açık hata koduyla reddeder (min_order_qty, order_step,
   insufficient_stock, cart_stale).

   Satış birimi OLMAYAN üründe (`SalesUnitSize` yok — sunucu null
   alanı hiç yazmıyor) yardımcılar null / '' döner ve çağıran
   bugünkü yazımı kullanır: o ürünlerde ekranlar aynı kalır.

   Kurallar web-1'in apiClient.js "FAZ 38" bloğuyla birebir
   aynıdır (aynı sınır durumları, aynı öneri hesabı); yalnız HTML
   bu sitenin sınıflarıyla üretilir.
   ============================================================ */

(function (App) {
    'use strict';

    var SU = {};

    /** Alanı PascalCase ya da camelCase adıyla okur. */
    function field(obj, name) {
        if (!obj) return undefined;
        if (obj[name] !== undefined) return obj[name];
        return obj[name.charAt(0).toLowerCase() + name.slice(1)];
    }
    SU.field = field;

    /** Çeviri + {değişken}. Tanımsız değişken boş metin olur ("undefined" yazılmaz). */
    function text(key, fallback, vars) {
        var safe = {};
        Object.keys(vars || {}).forEach(function (k) {
            var v = vars[k];
            safe[k] = (v === undefined || v === null) ? '' : String(v);
        });
        return App.t('salesUnit.' + key, fallback, safe);
    }
    SU.text = text;

    function esc(value) { return App.utils.escape(value); }

    /* ============================================================
       BİÇİM
       ============================================================ */

    /** Para — sitenin bütün fiyatlarıyla aynı biçim ("27 093,00 ₸"). */
    SU.money = function (amount) {
        return App.fmt.price(amount);
    };

    /**
     * "712,8", "1 584", "4,95" — taban birim miktarı (en çok 3 ondalık,
     * sunucuyla aynı). Elle yazılır: tarayıcıların kk-KZ sayı verisi
     * tutarsız ("712.8" yazan var), ambalaj adı ise panelde virgüllü
     * ("Комплект 29,7 кг").
     */
    SU.qty = function (value) {
        var n = Math.round((parseFloat(value) || 0) * 1000) / 1000;
        var parts = Math.abs(n).toFixed(3).replace(/\.?0+$/, '').split('.');
        var whole = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        return (n < 0 ? '-' : '') + whole + (parts[1] ? ',' + parts[1] : '');
    };

    /* ============================================================
       BİLGİ
       ============================================================ */

    /**
     * Ürünün (varyantın, sepet / istek listesi / sipariş kaleminin)
     * satış birimi. Satış birimi yoksa null.
     * @returns {{name:string, size:number, baseUnit:string, min:number,
     *            step:number, pallet:number|null, basePrice:number|null,
     *            basePriceText:string}|null}
     */
    SU.info = function (product) {
        var size = parseFloat(field(product, 'SalesUnitSize'));
        if (!(size > 0)) return null;

        var baseUnit = String(field(product, 'BaseUnit') || '').trim();
        var name     = String(field(product, 'SalesUnitName') || '').trim();
        var min      = parseInt(field(product, 'MinOrderQty'), 10);
        var step     = parseInt(field(product, 'OrderStep'), 10);
        var pallet   = parseInt(field(product, 'UnitsPerPallet'), 10);
        var rawBase  = field(product, 'BasePrice');
        var basePrice = (rawBase === undefined || rawBase === null || rawBase === '') ? NaN : parseFloat(rawBase);
        var hasBase  = isFinite(basePrice);

        return {
            /* Panel adı miktarla birlikte zorunlu tutuyor; yine de boş
               gelirse miktar + birim yazılır, ad uydurulmaz. */
            name:      name || (SU.qty(size) + (baseUnit ? ' ' + baseUnit : '')),
            size:      size,
            baseUnit:  baseUnit,
            min:       min > 0 ? min : 1,
            step:      step > 0 ? step : 1,
            pallet:    pallet > 0 ? pallet : null,
            basePrice: hasBase ? basePrice : null,
            /* Fiyat gizliyse (misafir / listede yok) taban fiyat da yazılmaz. */
            basePriceText: (hasBase && !App.model.isPriceHidden(product))
                ? SU.money(basePrice) + (baseUnit ? '/' + baseUnit : '')
                : ''
        };
    };

    /** Kalemin fiyat alanı: ürün `Price`, istek listesi `ProductPrice`, sepet `UnitPrice`. */
    function rawPrice(product) {
        var p = field(product, 'Price');
        if (p === undefined || p === null) p = field(product, 'ProductPrice');
        if (p === undefined || p === null) p = field(product, 'UnitPrice');
        return p === undefined || p === null ? 0 : p;
    }
    SU.rawPrice = rawPrice;

    /** "27 093,00 ₸ / Комплект 33 кг" (düz metin). Satış birimi yoksa null. */
    SU.unitPriceText = function (product, price) {
        var info = SU.info(product);
        if (!info) return null;
        return SU.money(price !== undefined ? price : rawPrice(product)) + ' / ' + info.name;
    };

    /**
     * Satış birimli fiyat HTML'i: ambalaj fiyatı + "/ birim adı", altında
     * taban birim fiyatı ("821,00 ₸/кг"). Satış birimi yoksa null —
     * çağıran bugünkü yazımı kullanır. Fiyat gizliyse "Цена по запросу".
     * @param {Object} [opts]
     *   price — `Price` yerine yazılacak tutar
     *   old   — eski fiyat (indirimde çizili; yalnız fiyattan büyükse)
     *   unit  — "/ ad" (varsayılan açık; ambalaj satırında ad zaten etiket)
     *   base  — taban fiyat satırı (varsayılan açık)
     *   cls   — ana fiyatın sınıfı (varsayılan price-now)
     */
    SU.priceHtml = function (product, opts) {
        var info = SU.info(product);
        if (!info) return null;
        if (App.model.isPriceHidden(product)) return App.model.priceOnRequestHtml();

        var o = opts || {};
        var price = o.price !== undefined ? o.price : rawPrice(product);
        var old = parseFloat(o.old);

        var html = '<span class="' + (o.cls === undefined ? 'price-now' : o.cls) + '">' + SU.money(price) + '</span>';
        if (o.unit !== false) html += '<span class="su-unit">/ ' + esc(info.name) + '</span>';
        if (old > (parseFloat(price) || 0)) html += '<span class="price-old">' + SU.money(old) + '</span>';
        if (o.base !== false && info.basePriceText) html += '<span class="su-base">' + esc(info.basePriceText) + '</span>';
        return html;
    };

    /**
     * "24 × Комплект 33 кг (792 кг)" — sepet, ödeme ve sipariş satırı.
     * Taban miktar kalemde varsa sunucudan (`BaseQuantity`); adet ayrıca
     * verildiyse (ürün sayfası: minimum, palet, stok) adet × ambalaj
     * miktarı. Satış birimi yoksa null.
     */
    SU.lineText = function (item, quantity) {
        var info = SU.info(item);
        if (!info) return null;

        var qty = quantity !== undefined ? quantity : (parseInt(field(item, 'Quantity'), 10) || 0);
        var serverBase = quantity === undefined ? parseFloat(field(item, 'BaseQuantity')) : NaN;
        var base = (isFinite(serverBase) && serverBase > 0) ? serverBase : qty * info.size;

        /* 1C birimi senkrondan önce bilinmeyebilir: o zaman yalnız adet × ad. */
        return qty + ' × ' + info.name +
               (info.baseUnit ? ' (' + SU.qty(base) + ' ' + info.baseUnit + ')' : '');
    };

    /** "мин. 24 · шаг 24" — adet kuralının kısa yazımı (min 1 ve adım 1 ise boş). */
    SU.rulesText = function (product) {
        var info = SU.info(product);
        if (!info || (info.min === 1 && info.step === 1)) return '';
        var parts = [];
        if (info.min > 1) parts.push(text('rulesMin', 'min. {min}', { min: info.min }));
        if (info.step > 1) parts.push(text('rulesStep', 'step {step}', { step: info.step }));
        return parts.join(' · ');
    };

    /**
     * Ürün sayfası / hızlı bakış: "Минимальный заказ: 24 × Комплект 33 кг
     * (792 кг) · Шаг заказа: 24". Kural yoksa boş.
     */
    SU.rulesLine = function (product) {
        var info = SU.info(product);
        if (!info || (info.min === 1 && info.step === 1)) return '';
        var parts = [];
        if (info.min > 1) parts.push(text('minOrder', 'Minimum order') + ': ' + SU.lineText(product, info.min));
        if (info.step > 1) parts.push(text('orderStep', 'Order step') + ': ' + info.step);
        return parts.join(' · ');
    };

    /**
     * Stok satırına ek: "48 × Комплект 33 кг (1 584 кг)". Sunucu
     * StockAmount'u zaten ambalaj cinsinden gönderiyor. Stok minimumun
     * altındaysa (ve şirkette stoksuz yetki yoksa) "меньше минимального
     * заказа (24)" eklenir. Satış birimsiz / stoksuz üründe ''.
     */
    SU.stockText = function (product, erpSource) {
        var info = SU.info(product);
        var stock = parseInt(field(product, 'StockAmount'), 10) || 0;
        if (!info || stock <= 0) return '';

        var out = SU.lineText(product, stock);
        if (stock < info.min && !App.perm.canOrderWithoutStockFor(erpSource || product)) {
            out += ' · ' + text('belowMin', 'less than the minimum order ({min})', { min: info.min });
        }
        return out;
    };

    /**
     * Özellikler sekmesinin satış birimi satırları ([etiket, değer]).
     * Boş değerli satır çağıranın süzgecinde düşer.
     */
    SU.specRows = function (product) {
        var info = SU.info(product);
        if (!info) return [];
        return [
            [text('salesUnit', 'Sales unit'),
             info.name + (info.baseUnit ? ' = ' + SU.qty(info.size) + ' ' + info.baseUnit : '')],
            [text('pricePerBase', 'Price per {unit}', { unit: info.baseUnit }),
             info.baseUnit && info.basePriceText ? info.basePriceText : null],
            [text('minOrder', 'Minimum order'), info.min > 1 ? SU.lineText(product, info.min) : null],
            [text('orderStep', 'Order step'), info.step > 1 ? String(info.step) : null],
            [text('pallet', 'Pallet'),
             info.pallet ? text('palletValue', '1 pallet = {line}', { line: SU.lineText(product, info.pallet) }) : null]
        ];
    };

    /* ============================================================
       ADET KURALI
       ============================================================ */

    /**
     * `{min, step, max}`. `max` stoksuz sipariş yetkisi YOKSA stoktaki
     * ambalaj sayısıdır (sunucu da fazlasını reddeder), yetki varsa
     * ya da stok bilinmiyorsa (sepet kalemi) null. Satış birimi yoksa
     * null: çağıran bugünkü (adım 1) davranışı sürdürür.
     * Varyant / sepet kaleminde şirket alanı yok; şirket [erpSource] ile verilir.
     */
    SU.qtyRules = function (product, erpSource) {
        var info = SU.info(product);
        if (!info) return null;

        var rawStock = field(product, 'StockAmount');
        var known = rawStock !== undefined && rawStock !== null && rawStock !== '';
        var stock = parseInt(rawStock, 10);
        var limited = known && !App.perm.canOrderWithoutStockFor(erpSource || product);

        return {
            min:  info.min,
            step: info.step,
            max:  limited ? Math.max(0, isFinite(stock) ? stock : 0) : null
        };
    };

    /** Adet kurala uyuyor mu: adet ≥ min ve (adet − min) adımın katı — sunucuyla aynı. */
    SU.isValidQty = function (qty, rules) {
        return typeof qty === 'number' && isFinite(qty) && Math.floor(qty) === qty &&
               qty >= rules.min && (qty - rules.min) % rules.step === 0;
    };

    /** Stok sınırı içindeki en büyük geçerli adet; sınır yoksa null, minimum bile sığmıyorsa 0. */
    SU.maxQty = function (rules) {
        if (rules.max === null || rules.max === undefined) return null;
        if (rules.max < rules.min) return 0;
        return rules.min + Math.floor((rules.max - rules.min) / rules.step) * rules.step;
    };

    /** En yakın geçerli adet (yukarı doğru) — sunucunun `SuggestedQuantity` kuralı. */
    SU.suggestQty = function (qty, rules) {
        if (!(qty > rules.min)) return rules.min;
        return rules.min + Math.ceil((qty - rules.min) / rules.step) * rules.step;
    };

    /**
     * ± düğmesi için bir sonraki geçerli adet. Elle yazılmış geçersiz
     * değerden (25) yukarıda bir sonraki, aşağıda bir önceki geçerli
     * adede gider. Alt sınır minimum: minimumun altına inmek (sepette
     * silme) kararını çağıran verir.
     */
    SU.stepQty = function (current, rules, direction) {
        var cur = parseInt(current, 10);
        var next;
        if (!isFinite(cur) || cur < rules.min) {
            next = rules.min;
        } else if (!SU.isValidQty(cur, rules)) {
            var below = rules.min + Math.floor((cur - rules.min) / rules.step) * rules.step;
            next = direction > 0 ? below + rules.step : below;
        } else {
            next = cur + (direction > 0 ? rules.step : -rules.step);
        }
        if (next < rules.min) next = rules.min;

        var maxQty = SU.maxQty(rules);
        if (maxQty !== null && next > maxQty) next = Math.max(maxQty, rules.min);
        return next;
    };

    function ruleMessage(code, d) {
        var vars = {
            min: d.min, step: d.step, unit: d.unit, qty: d.quantity, suggested: d.suggested,
            sequence: d.min + ', ' + (d.min + d.step) + ', ' + (d.min + 2 * d.step) + ' …'
        };
        var head = code === 'min_order_qty'
            ? text('errors.minOrderQty', 'Minimum order: {min} × {unit}. Valid quantities: {sequence}', vars)
            : text('errors.orderStep', 'Valid quantities ({unit}): {sequence} You entered {qty}.', vars);
        return d.suggested
            ? head + ' ' + text('errors.suggest', 'Nearest valid quantity: {suggested}.', vars)
            : head;
    }

    function stockMessage(available, unitName) {
        return text('errors.insufficientStock', 'Not enough stock. Available: {available} × {unit}.',
                    { available: available, unit: unitName });
    }

    /**
     * Göndermeden önce adet kontrolü. Geçerliyse null, değilse kullanıcıya
     * gösterilecek (çevrilmiş) mesaj. Stok sınırı yalnız yetkisi olmayan
     * müşteride (`rules.max`).
     */
    SU.qtyError = function (qty, product, rules) {
        var info = SU.info(product);
        if (!info || !rules) return null;

        var isInt = typeof qty === 'number' && isFinite(qty) && Math.floor(qty) === qty;
        if (!SU.isValidQty(qty, rules)) {
            return ruleMessage((!isInt || qty < rules.min) ? 'min_order_qty' : 'order_step', {
                quantity:  isInt ? qty : '—',
                min:       rules.min,
                step:      rules.step,
                unit:      info.name,
                suggested: isInt && qty > rules.min ? SU.suggestQty(qty, rules) : null
            });
        }
        if (rules.max !== null && rules.max !== undefined && qty > rules.max) {
            return stockMessage(rules.max, info.name);
        }
        return null;
    };

    /**
     * Sepet / sipariş ucunun FAZ 36 hata kodunu kullanıcının dilinde
     * yazar (sunucu mesajı tek dilde). Tanınmayan kodda ve satış birimsiz
     * üründe null döner: çağıran kendi (çevrilmiş) genel mesajını gösterir.
     * @param {Error}  error   http hatası (`errorCode`, `errorDetails`)
     * @param {Object} [product] ürün ya da kalem — stok hatasında birim adı için
     */
    SU.errorMessage = function (error, product) {
        if (!error) return null;
        var code = error.errorCode;
        var d = error.errorDetails || {};

        if (code === 'min_order_qty' || code === 'order_step') {
            var unit = field(d, 'SalesUnitName') || (SU.info(product) || {}).name || '';
            /* Satış birimsiz üründe sunucu 0 / eksi adedi de min_order_qty
               ile reddediyor; orada çağıranın genel mesajı kalsın. */
            if (!unit) return null;
            return ruleMessage(code, {
                quantity:  field(d, 'Quantity'),
                min:       parseInt(field(d, 'MinOrderQty'), 10) || 1,
                step:      parseInt(field(d, 'OrderStep'), 10) || 1,
                unit:      unit,
                suggested: parseInt(field(d, 'SuggestedQuantity'), 10) || null
            });
        }
        if (code === 'insufficient_stock') {
            var info = SU.info(product);
            if (!info) return null;
            var m = /Available:\s*(\d+)/i.exec(error.message || '');
            return m
                ? stockMessage(parseInt(m[1], 10), info.name)
                : text('errors.insufficientStockNoQty', 'Not enough stock for the requested quantity.');
        }
        if (code === 'cart_stale') {
            return text('errors.cartStale',
                '"{name}": the price or packaging changed after it was added to the cart. Please check your cart and try again.',
                { name: field(d, 'ProductName') || '' });
        }
        return null;
    };

    /* ============================================================
       ADET KUTUSU
       ------------------------------------------------------------
       Kural kutunun `data-su-*` özniteliklerinde taşınır; ± düğmeleri
       (ui/actions.js) ve gönderim kontrolü oradan okur. Kuralsız
       kutuya dokunulmaz (min 1, adım 1).
       ============================================================ */

    /** Kutuya yazılacak öznitelikler (HTML metni). Kural yoksa bugünkü min=1 value=1. */
    SU.inputAttrs = function (rules, value) {
        if (!rules) return ' min="1" value="' + (value || 1) + '"';
        var maxQty = SU.maxQty(rules);
        return ' min="' + rules.min + '" step="' + rules.step + '"' +
               ' value="' + (value !== undefined ? value : rules.min) + '"' +
               ' data-su-min="' + rules.min + '" data-su-step="' + rules.step + '"' +
               (maxQty !== null ? ' data-su-max="' + maxQty + '"' : '');
    };

    /** Kutunun taşıdığı kural; satış birimsiz kutuda null. */
    SU.inputRules = function (input) {
        if (!input || !input.hasAttribute || !input.hasAttribute('data-su-step')) return null;
        var max = input.getAttribute('data-su-max');
        return {
            min:  parseInt(input.getAttribute('data-su-min'), 10) || 1,
            step: parseInt(input.getAttribute('data-su-step'), 10) || 1,
            max:  max === null ? null : (parseInt(max, 10) || 0)
        };
    };

    App.su = SU;

})(window.App);
