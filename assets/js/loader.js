/* ============================================================
   loader.js — BETİK YÜKLEYİCİ
   ------------------------------------------------------------
   Her HTML sayfasında 30 tane <script> satırı tekrarlanmasın diye
   dosya listesi TEK YERDE durur. Sayfalar yalnız şunu yazar:

       <script src="assets/js/loader.js"></script>

   ve <body data-page="shop"> değerine göre o sayfanın betiği de
   listeye eklenir.

   SIRA GARANTİSİ: dinamik olarak eklenen betikler varsayılan
   olarak `async` çalışır ve sıraları karışır. `script.async = false`
   demek "ekleme sırasına göre çalıştır" anlamına gelir (standart
   'ordered async' deseni) — bağımlılık sırası böyle korunur.

   ÜRETİM NOTU: canlıya çıkarken bu dosyaların birleştirilip
   küçültülmesi (concat + minify) önerilir; liste aşağıda hazır
   durur, bir yapı betiği doğrudan bunu okuyabilir.
   ============================================================ */

(function () {
    'use strict';

    /* Kendi yolunu bulur: site alt klasörde yayınlansa da çalışsın. */
    var self = document.currentScript;
    var base = self ? self.src.replace(/loader\.js.*$/, '') : 'assets/js/';

    /* Önbellek kırıcı: dosya değiştiğinde bu sayı artırılır.
       HTML'deki loader.js / main.css bağlantıları ve main.css'in
       @import'ları da AYNI değeri taşır (hepsi birlikte artırılır). */
    var VERSION = '20261112a';

    /* ---------- ÇEKİRDEK (sıra önemlidir) ---------- */
    var CORE = [
        /* 1. temel: isim alanı ve saf yardımcılar */
        'core/config.js',
        'core/utils.js',
        'core/format.js',
        'core/storage.js',
        'core/bus.js',

        /* 2. ağ */
        'core/http.js',
        'core/api.js',

        /* 3. dil — sözlükler i18n.js'ten SONRA gelmeli.
           Önce TEMEL sözlük, sonra kaynak projeden birebir alınan
           `*.data.js`: çakışan anahtarda kaynak projedeki metin
           geçerli olsun diye sıra bu şekildedir. */
        'i18n/i18n.js',
        'i18n/tr.js',
        'i18n/en.js',
        'i18n/ru.js',
        'i18n/kz.js',
        'i18n/tr.data.js',
        'i18n/en.data.js',
        'i18n/ru.data.js',
        'i18n/kz.data.js',
        /* EN SON: bu örneğe (SIEGER) özel metinler — marka, iletişim,
           yasal metinler. Kaynak projenin Fores'e özgü cümlelerini ezer. */
        'i18n/tr.site.js',
        'i18n/en.site.js',
        'i18n/ru.site.js',
        'i18n/kz.site.js',

        /* 4. arayüz temelleri (servisler bildirim/pencere kullanır) */
        'ui/icons.js',
        'ui/toast.js',
        'ui/modal.js',

        /* 5. veri katmanı */
        'data/product-model.js',
        'data/permissions.js',      /* stoksuz sipariş yetkisi — şirket başına */
        'data/sales-unit.js',       /* FAZ 38 — satış birimi (ambalaj) */
        'data/customer-rules.js',   /* FAZ 44 — müşteri × ürün kuralları */
        'data/idb.js',
        'data/catalog.js',

        /* 6. iş servisleri */
        'services/auth.service.js',
        'services/cart.service.js',
        'services/wishlist.service.js',
        'services/compare.service.js',
        'services/address.service.js',
        'services/order.service.js',
        'services/review.service.js',
        'services/payment.service.js',
        'services/chat.service.js',

        /* 7. arayüz bileşenleri */
        'ui/product-card.js',
        'ui/variants.js',
        'ui/actions.js',
        /* quick-view eylem kaydı yapıyor: actions.js'ten SONRA gelmeli */
        'ui/quick-view.js',
        'ui/drawer.js',
        'ui/bank-details.js',
        'ui/layout.js',
        'ui/support-widget.js'
    ];

    /* ---------- SAYFA BETİKLERİ ----------
       Anahtar = <body data-page="..."> değeri.
       Değer bir dizi olabilir; büyük sayfalar parçalara bölünür ve
       parçalar YAZILDIĞI SIRAYLA yüklenir. */
    var PAGES = {
        home:     'pages/home.js',
        shop:     ['pages/shop-filters.js', 'pages/shop.js'],
        product:  ['pages/product-gallery.js', 'pages/product.js'],
        cart:     'pages/cart.js',
        wishlist: 'pages/wishlist.js',
        compare:  'pages/compare.js',
        checkout: ['pages/checkout-address.js', 'pages/checkout.js'],
        order:    'pages/order.js',
        login:    ['pages/login-register.js', 'pages/login.js'],
        account:  ['pages/checkout-address.js', 'pages/account-orders.js', 'pages/account.js'],
        content:  'pages/content.js'
    };

    var list = CORE.slice();

    var pageName = document.body ? document.body.getAttribute('data-page') : null;
    var pageScripts = pageName ? PAGES[pageName] : null;

    if (pageScripts) {
        list = list.concat(Array.isArray(pageScripts) ? pageScripts : [pageScripts]);
    }

    /* app.js DAİMA en son: her şeyin yüklendiğini varsayar. */
    list.push('app.js');

    var frag = document.createDocumentFragment();

    list.forEach(function (path) {
        var el = document.createElement('script');
        el.src = base + path + '?v=' + VERSION;
        el.async = false;          /* ← sıra garantisi */
        frag.appendChild(el);
    });

    document.head.appendChild(frag);

})();
