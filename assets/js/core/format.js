/* ============================================================
   core/format.js — BİÇİMLENDİRME
   Para, tarih, sayı ve 1C'den gelen metinlerin ekrana hazırlanması.
   Para birimi / yerel ayar core/config.js içinden okunur.
   ============================================================ */

(function (App) {
    'use strict';

    var F = {};

    /* Intl nesnesi her çağrıda yeniden kurulursa pahalıdır; önbelleklenir. */
    var _money = null;
    function money() {
        if (!_money) {
            _money = new Intl.NumberFormat(App.config.LOCALE, {
                style: 'currency',
                currency: App.config.CURRENCY,
                maximumFractionDigits: 2
            });
        }
        return _money;
    }

    /**
     * Fiyat metni: 1250 → "1 250,00 ₸"
     * Sayı olmayan/boş değerler 0 sayılır — ekranda "NaN" görünmez.
     */
    F.price = function (value) {
        var num = parseFloat(value);
        if (isNaN(num)) num = 0;
        return money().format(num);
    };

    /** Binlik ayraçlı düz sayı: 12500 → "12 500" */
    F.number = function (value, decimals) {
        var num = parseFloat(value);
        if (isNaN(num)) num = 0;
        return new Intl.NumberFormat(App.config.LOCALE, {
            minimumFractionDigits: decimals || 0,
            maximumFractionDigits: decimals === undefined ? 2 : decimals
        }).format(num);
    };

    /** Kısa tarih: "12.03.2026" */
    F.date = function (value) {
        if (!value) return '—';
        var d = new Date(value);
        if (isNaN(d.getTime())) return '—';
        return d.toLocaleDateString(App.config.LOCALE, {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    /** Tarih + saat: "12.03.2026 14:35" */
    F.dateTime = function (value) {
        if (!value) return '—';
        var d = new Date(value);
        if (isNaN(d.getTime())) return '—';
        return d.toLocaleDateString(App.config.LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric' }) +
               ' ' +
               d.toLocaleTimeString(App.config.LOCALE, { hour: '2-digit', minute: '2-digit' });
    };

    /**
     * 1C'den gelen adlarda ARDIŞIK BOŞLUKLAR olabilir; tarayıcı HTML
     * render ederken bunları teke indirir ve ad 1C'dekinden farklı
     * görünür. Çoklu boşluklar &nbsp; ile korunur, TEK boşluklar
     * normal kalır — böylece satır kaydırma bozulmaz.
     */
    F.preserveSpaces = function (text) {
        return String(text === null || text === undefined ? '' : text)
            .replace(/ {2,}/g, function (m) {
                return ' ' + ' '.repeat(m.length - 1);
            });
    };

    /**
     * Arama karşılaştırması için normalleştirme: küçük harf, çoklu
     * boşluk teke iner. YALNIZ karşılaştırmada kullanılır, ekrandaki
     * metni değiştirmez.
     */
    F.searchText = function (text) {
        return String(text === null || text === undefined ? '' : text)
            .toLowerCase().replace(/\s+/g, ' ').trim();
    };

    /** Uzun metni kes: "Lorem ipsum..." */
    F.truncate = function (text, max) {
        var str = String(text || '');
        return str.length > max ? str.slice(0, max).trimEnd() + '…' : str;
    };

    /** Baytı okunur hale getir (dosya eki için). */
    F.bytes = function (n) {
        if (!n) return '0 B';
        var units = ['B', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(n) / Math.log(1024));
        return (n / Math.pow(1024, i)).toFixed(i ? 1 : 0) + ' ' + units[i];
    };

    /** Yıldız dolgu yüzdesi: 4.2 → "84%" */
    F.ratingPercent = function (rating) {
        var r = parseFloat(rating) || 0;
        return (App.utils.clamp(r, 0, 5) / 5 * 100).toFixed(1) + '%';
    };

    App.fmt = F;

})(window.App);
