/* ============================================================
   data/customer-rules.js — MÜŞTERİ × ÜRÜN KURALLARI — FAZ 44
   ------------------------------------------------------------
   Görünürlük ve özel fiyat SUNUCUDA uygulanıyor (FAZ 42):
     • müşteriden gizlenen ürün listede HİÇ gelmez; detay ve
       sepete ekleme 404 döner (kuralın varlığı sızmasın diye
       sepete eklemede kodsuz "Product not found"),
     • "her zaman göster" ürün `IsActive = true` + `ForceVisible`
       gelir (taslak ya da stoksuz olsa bile) — bu site kendi
       stok süzgeciyle ürün GİZLEMEDİĞİ için ek iş gerekmez,
     • özel fiyatlı üründe `Price` zaten özel fiyattır, yanında
       `HasSpecialPrice = true`,
     • sepete eklendikten sonra gizlenen ürünün kalemi SİLİNMEZ,
       `IsAvailable = false` işaretlenir; miktar artırma ve sipariş
       404 `product_unavailable` (sipariş kalemlerin adlarını
       `ErrorDetails`'te verir).
   İstemci süzmez, fiyat hesaplamaz; yalnız gösterir.

   İşaretler yalnız düştüğünde yazılıyor (sunucu null alanı
   göndermiyor): YOKLUK false demektir. Kuralı olmayan müşteride ve
   misafirde hiçbiri gelmez — ekranlar bugünkü gibi kalır.
   ============================================================ */

(function (App) {
    'use strict';

    var R = {};

    function field(obj, name) {
        if (!obj) return undefined;
        if (obj[name] !== undefined) return obj[name];
        return obj[name.charAt(0).toLowerCase() + name.slice(1)];
    }

    function text(key, fallback, vars) {
        return App.t('customerRules.' + key, fallback, vars);
    }

    /** "Her zaman göster" ürünü (K35.10) — yalnız açıkça true. */
    R.isForceVisible = function (product) {
        return field(product, 'ForceVisible') === true;
    };

    /** Fiyat bu müşteriye özel mi (ürün, varyant, sepet / istek listesi / karşılaştırma kalemi). */
    R.hasSpecialPrice = function (product) {
        return field(product, 'HasSpecialPrice') === true && !App.model.isPriceHidden(product);
    };

    /**
     * "Индивидуальная цена" rozeti — fiyatın ALTINDA ayrı satır; özel
     * fiyat yoksa boş metin (çağıran koşulsuz ekler, özel fiyatsız
     * üründe ekran değişmez). İpucunda uzun açıklama.
     */
    R.badgeHtml = function (product) {
        if (!R.hasSpecialPrice(product)) return '';
        return '<span class="special-price">' +
                   '<span class="badge badge--special" title="' +
                       App.utils.escape(text('specialPriceHint', 'This price has been set especially for you.')) + '">' +
                       App.utils.escape(text('specialPrice', 'Special price for you')) +
                   '</span>' +
               '</span>';
    };

    /**
     * Ürün artık bu müşteriye görünmüyor mu? Miktar güncellemede ve
     * siparişte 404 `product_unavailable`; sepete eklemede kodsuz 404.
     * [anyNotFound] = sepete ekleme / ürün detayı: o uçlarda 404'ün tek
     * sebebi ürünün bulunamaması. Başka hatada null.
     */
    R.productUnavailableMessage = function (error, anyNotFound) {
        if (!error) return null;
        var gone = error.errorCode === 'product_unavailable' ||
                   (anyNotFound === true && error.status === 404);
        return gone ? text('productUnavailable', 'This product is no longer available.') : null;
    };

    /** Sepet kalemi artık bu müşteriye görünmüyor mu (sunucu `IsAvailable: false`). */
    R.isCartItemUnavailable = function (item) {
        return field(item, 'IsAvailable') === false;
    };

    /** «Ad 1», «Ad 2» — gizlenen kalemlerin adları (sepet kalemlerinden ya da sipariş reddinden). */
    function namesText(list, nameField) {
        return (list || [])
            .map(function (row) { return String(field(row, nameField) || '').trim(); })
            .filter(Boolean)
            .map(function (n) { return '«' + n + '»'; })
            .join(', ');
    }

    /**
     * Sepette görünmeyen kalem varken ödeme kapısının metni — adlarla,
     * kullanıcının dilinde; sunucu metni gösterilmez. Kalem yoksa ''.
     */
    R.unavailableCartText = function (items) {
        var gone = (items || []).filter(R.isCartItemUnavailable);
        if (!gone.length) return '';
        return text('unavailableCheckout',
            'These products are no longer available: {names}. Remove them from your cart to place the order.',
            { names: namesText(gone, 'ProductName') });
    };

    /**
     * Sipariş kapısının `product_unavailable` reddi (kalemler sepete
     * eklendikten sonra gizlendi): ürün adlarıyla, kullanıcının
     * dilinde. Başka hatada null.
     */
    R.unavailableOrderText = function (error) {
        if (!error || error.errorCode !== 'product_unavailable') return null;
        var rows = Array.isArray(error.errorDetails) ? error.errorDetails : [];
        var names = namesText(rows, 'ProductName');
        return names
            ? text('unavailableCheckout',
                'These products are no longer available: {names}. Remove them from your cart to place the order.',
                { names: names })
            : text('productUnavailable', 'This product is no longer available.');
    };

    App.rules = R;

})(window.App);
