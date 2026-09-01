/* ============================================================
   core/config.js — UYGULAMA AYARLARI + GLOBAL İSİM ALANI
   ------------------------------------------------------------
   Bu dosya HER SAYFADA EN ÖNCE yüklenir. Tek bir `App` nesnesi
   açar; diğer bütün modüller kendini bunun altına asar. Böylece
   global kapsam kirlenmez ve "bu fonksiyon nerede?" sorusunun
   cevabı hep aynı olur: App.<alan>.<fonksiyon>

   Başka bir projeye taşırken DEĞİŞTİRİLECEK TEK DOSYA burasıdır.
   ============================================================ */

window.App = window.App || {};

/* ------------------------------------------------------------
   SAYFA KAYIT DEFTERİ
   Sayfa betikleri (pages/*.js) app.js'ten ÖNCE yüklenir, çünkü
   app.js her şeyin hazır olduğunu varsayar. Bu yüzden kayıt
   fonksiyonu en erken dosyada — burada — tanımlanır.

       App.definePage('shop', async function (ctx) { ... });

   `ctx` iki söz taşır: { catalog, user }
   ------------------------------------------------------------ */
App.pages = {};
App.definePage = function (name, init) { App.pages[name] = init; };

/* ------------------------------------------------------------
   API
   BASE_URL sonunda /api YOKTUR; http katmanı ekler. Sunucu
   değiştiğinde yalnız bu satır değişir.
   ------------------------------------------------------------ */
App.config = {
    API_ORIGIN: 'https://ecom.aycom.kz:5006',
    API_BASE:   'https://ecom.aycom.kz:5006/api',

    /* Katalog tek istekte çekilir; bu sayı toplam ürün sayısının
       ÜSTÜNDE kalmalı. Sunucu 'ORDER BY createdat DESC' sıralıyor,
       sınır aşılırsa en ESKİ ürünler sessizce kesilir. */
    MAX_PAGE_SIZE: 20000,

    /* Para birimi ve yerel biçim — fiyat gösterimi tek yerden. */
    LOCALE:   'kk-KZ',
    CURRENCY: 'KZT',

    /* Varsayılan dil ve desteklenenler (i18n/*.js ile eşleşmeli). */
    DEFAULT_LANG: 'ru',
    LANGS: [
        { code: 'ru', label: 'RU', name: 'Русский' },
        { code: 'kz', label: 'KZ', name: 'Қазақша' },
        { code: 'en', label: 'EN', name: 'English' },
        { code: 'tr', label: 'TR', name: 'Türkçe' }
    ],

    /* Görsel bulunamadığında/boş geldiğinde kullanılacak yedek. */
    FALLBACK_IMAGE: 'assets/img/mock/product-placeholder.svg',

    /* Önbellek ömürleri (ms).
       SYNC_INTERVAL kısa tutulmamalı: katalog TEK istekte binlerce
       ürün getirir, 30 saniyede bir tazelemek megabaytlarca boşa
       trafik demektir. 5 dakika + "sekmeye dönünce tazele" davranışı
       stok doğruluğu için fazlasıyla yeterli. */
    CACHE_TTL:     30 * 60 * 1000,   // sessionStorage katalog ömrü
    SYNC_INTERVAL: 5 * 60 * 1000,    // arka plan API eşitleme aralığı

    /* Mağaza sayfası varsayılanları. */
    PAGE_SIZE: 24,
    PAGE_SIZE_OPTIONS: [12, 24, 48, 96],

    /* Karşılaştırmaya en fazla kaç ürün (sunucu da sınırlar). */
    COMPARE_LIMIT: 4,

    /* Mağaza kimliği — logo/başlık/footer metinleri. */
    BRAND: {
        name:    'NOVA',
        suffix:  'TECH',
        tagline: 'Endüstriyel donanım ve profil sistemleri',
        phone:   '+7 (700) 000 00 00',
        email:   'info@novatech.kz',
        address: 'Almatı, Kazakistan'
    }
};

/* ------------------------------------------------------------
   TARAYICI DEPOLAMA ANAHTARLARI
   Elle 'auth_token' yazmak yerine DAİMA bu sabitler kullanılır;
   yazım hatası kaynaklı "oturum açılmıyor" hataları böyle biter.
   ------------------------------------------------------------ */
App.keys = {
    TOKEN:     'auth_token',
    USER:      'user_data',
    USER_ID:   'userId',
    ACCOUNT:   'accountType',
    IIN:       'iin',
    LANG:      'site_language',
    REMEMBER:  'rememberMe',

    /* Kullanıcı ayarları — girişte UserSettings'ten doldurulur. */
    CAN_BYPASS_PAYMENT:    'canBypassPayment',
    CAN_ORDER_NO_STOCK:    'canOrderWithoutStock',
    PRICE_CATEGORY:        'priceCategory',

    /* Şirket bilgileri (bireysel girişimci / tüzel kişi). */
    COMPANY_NAME:     'ipCompanyName',
    COMPANY_DIRECTOR: 'ipCompanyDirector',
    COMPANY_ADDRESS:  'companyAddress',
    COMPANY_IIN:      'ipCompanyIin',

    /* Yerel aynalar. */
    CACHE_PRODUCTS:   'cache_products',
    CACHE_CATEGORIES: 'cache_categories',
    /* Kalp durumunun yerel aynası kullanıcıya göre ayrılır:
       wishlist_<userId>  →  App.keys.wishlist(userId) */
    wishlist: function (userId) { return 'wishlist_' + userId; }
};

/* ------------------------------------------------------------
   SABİTLER
   ------------------------------------------------------------ */
App.const = {
    PAYMENT_MODE_GATEWAY:       'gateway',
    PAYMENT_MODE_TRANSFER_ONLY: 'transfer_only',

    ACCOUNT_RETAIL:  'retail',
    ACCOUNT_COMPANY: 'company',

    ADDRESS_BILLING:  'billing',
    ADDRESS_SHIPPING: 'shipping',

    STOCK_OUT: 'out_of_stock',

    /* Şirket (1C kaynağı) kodu → ekranda görünecek ad.
       Yeni bir 1C bağlandığında buraya tek satır eklenir; eşleşme
       yoksa kodun baş harfi büyütülerek gösterilir. */
    ERP_LABELS: {
        fores: 'Fores',
        foral: 'Foral',
        stark: 'Stark Alpha'
    }
};

/* ------------------------------------------------------------
   GENEL AYAR VARSAYILANI (sunucudan okunamazsa geçerli olur)

   🔴 KURAL: ağ hatası siteyi "kayıt kapalı" ya da "ödeme kapalı"
   durumuna DÜŞÜRMEZ. Hata hâlinde bugünkü davranışa dönülür.
   ------------------------------------------------------------ */
App.publicSettingsDefault = Object.freeze({
    retailRegistrationEnabled:  true,
    companyRegistrationEnabled: true,
    paymentMode:                'gateway'
});
