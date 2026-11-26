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
   Bu site İKİNCİ örneğin (ecommerce-api-2, Sieger) mağazasıdır.
   API-2, API-1'in sunucusunda `/ecommerce2` öneki altında yaşar
   (YARP); önek kırpılmadan iletilir. API-1'e (`:5006/api`) ASLA
   bağlanmamalı — başka veritabanı, başka şirketler.
   Sunucu değiştiğinde yalnız bu satırlar değişir.
   ------------------------------------------------------------ */
App.config = {
    API_ORIGIN: 'https://ecom.aycom.kz:5006/ecommerce2',
    API_BASE:   'https://ecom.aycom.kz:5006/ecommerce2/api',

    /* K2.17 — SİTENİN KENDİ ADRESİ (alan adı henüz belli değil).
       Mutlak site bağlantısı gereken HER yer (privacy-deleteacc
       sayfalarının "Ana sayfa" bağlantısı, metinlerdeki {site}
       yer tutucusu) bunu okur. Boşken bağlantılar göreli kalır,
       metinlerde görünür bir yer tutucu yazılır.
       Örnek: 'https://sieger.kz' (sonda / yok). */
    SITE_BASE: 'https://m.sieger.one',

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

    /* Mağaza sayfasında SABİT sayfa boyutu.
       Müşteriye "kaç ürün görünsün" sorusu sorulmuyor: seçici araç
       çubuğunda yer kaplıyordu ve kimse değiştirmiyordu. 48, tek
       ekranda birkaç satır + hızlı sayfalama için dengeli sayı. */
    PAGE_SIZE: 48,

    /* Karşılaştırmaya en fazla kaç ürün (sunucu da sınırlar). */
    COMPARE_LIMIT: 4,

    /* Mağaza kimliği — logo/başlık/footer metinleri (SIEGER).
       K2.14: başlıkta iki şirketin logosu YAN YANA (tek görsel).
       K2.27: logolar SAYDAM — açık zeminde siyah yazılı `logo`,
       koyu zeminde (alt bilgi) beyaz yazılı `logoDark`; beyaz plaka yok.
       Slogan bilerek YOK (uydurulmaz). Telefon ve e-posta henüz
       belli değil: boş bırakıldı, ekranda görünür yer tutucu yazılır
       (App.layout.contactLink). Değer gelince yalnız bu satırlar dolar.
       Adres: Sieger Kunststoff'un 1C'deki yasal (= fiili) adresi. */
    BRAND: {
        name:    'SIEGER',
        suffix:  '',
        logo:     'assets/img/logo/sieger-logolar-saydam.png',
        logoDark: 'assets/img/logo/sieger-logolar-saydam-koyu.png',
        tagline: '',
        phone:   '',
        phone2:  '',
        email:   '',
        address: 'Республика Казахстан, 050019, г. Алматы, Медеуский район, ул. Гурилева, дом 110А'
    },

    /* ---- HALYK ePay ----
       PostLink SUNUCUYA gider (server-to-server); widget adresini
       (test/canlı) backend `/payments/epay-token` yanıtında
       `widgetUrl` alanıyla söyler, istemci sabit adres GÖMMEZ.
       PostLink API-2'nin ucudur (önekli); API-1'inki olursa banka
       ödemeyi başka örneğe bildirir ve sipariş "ödenmedi" kalır.
       K2.13: Sieger şimdilik `transfer_only` (havale) — ePay akışı
       /settings/public `gateway` dönene kadar hiç açılmaz. */
    EPAY: {
        postLink: 'https://ecom.aycom.kz:5006/ecommerce2/api/payments/epay-postlink',
        currency: 'KZT'
    },

    /* Destek sohbeti: yeni mesaj yoklama aralığı (ms).
       SignalR yok; basit yoklama yeterli ve her sunucuda çalışır. */
    CHAT_POLL: 8000
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

    /* Stoksuz sipariş yetkisi ŞİRKET BAŞINA (web-1 ile aynı ad):
       { "<şirket kodu/kimliği küçük harfle>": true|false }.
       Yoksa (eski oturum) birleşik CAN_ORDER_NO_STOCK'a düşülür. */
    COMPANY_STOCK:         'companyStockPermissions',

    /* Şirket bilgileri (bireysel girişimci / tüzel kişi). */
    COMPANY_NAME:     'ipCompanyName',
    COMPANY_DIRECTOR: 'ipCompanyDirector',
    COMPANY_ADDRESS:  'companyAddress',
    COMPANY_IIN:      'ipCompanyIin',

    /* Yerel aynalar (sessionStorage). */
    CACHE_PRODUCTS:   'cache_products',
    CACHE_CATEGORIES: 'cache_categories',
    /* Kalp durumunun yerel aynası kullanıcıya göre ayrılır:
       wishlist_<userId>  →  App.keys.wishlist(userId) */
    WISHLIST_PREFIX: 'wishlist_',
    wishlist: function (userId) { return App.keys.WISHLIST_PREFIX + userId; }
};

/* ------------------------------------------------------------
   BU SİTENİN localStorage ANAHTARLARI — TAM LİSTE
   🔴 K2.18: admin-2 AYNI kökte (/admin/) yaşar; Flutter kendi
   anahtarlarını (`flutter.*`, GetStorage) aynı localStorage'a
   yazar. Çıkış/girişte `localStorage.clear()` admin oturumunu ve
   kayıtlı hesaplarını da silerdi. Temizlik YALNIZ bu listeyi ve
   `wishlist_<userId>` aynalarını siler (App.store.clearUserData).
   Yeni bir anahtar eklendiğinde buraya da eklenir.
   ------------------------------------------------------------ */
App.keys.OWNED = [
    App.keys.TOKEN, App.keys.USER, App.keys.USER_ID, App.keys.ACCOUNT,
    App.keys.IIN, App.keys.LANG, App.keys.REMEMBER,
    App.keys.CAN_BYPASS_PAYMENT, App.keys.CAN_ORDER_NO_STOCK,
    App.keys.PRICE_CATEGORY, App.keys.COMPANY_STOCK,
    App.keys.COMPANY_NAME, App.keys.COMPANY_DIRECTOR,
    App.keys.COMPANY_ADDRESS, App.keys.COMPANY_IIN
];

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

    /* Sipariş ödeme yöntemleri — sunucunun beklediği kodlar. */
    PAY_CARD:     'card',
    PAY_TRANSFER: 'bank_transfer',
    PAY_COD:      'cash_on_delivery',
    PAY_APPROVAL: 'pending_approval',

    /* Şirket (1C kaynağı) kodu → ekranda görünecek ad.
       Yeni bir 1C bağlandığında buraya tek satır eklenir; eşleşme
       yoksa kodun baş harfi büyütülerek gösterilir.
       Kodlar ecommerce2 tabanındaki erp_sources.code ile aynı. */
    ERP_LABELS: {
        siegerkf:  'Sieger Kunststoff',
        siegersys: 'Sieger Systems'
    }
};

/* ------------------------------------------------------------
   SİTE ADRESİ YARDIMCILARI (K2.17)
   Alan adı tek satırda (App.config.SITE_BASE). Bu yardımcılar
   config.js içinde durur çünkü privacy-deleteacc sayfaları
   uygulamanın geri kalanını YÜKLEMEDEN yalnız bu dosyayı okur.
   ------------------------------------------------------------ */
App.site = {
    /** 'https://sieger.kz' gibi kök; boşsa ''. Sondaki / atılır. */
    base: function () {
        return String(App.config.SITE_BASE || '').trim().replace(/\/+$/, '');
    },

    /** Sitedeki bir sayfanın adresi: kök tanımlıysa mutlak, değilse verilen göreli yol. */
    url: function (path, relativeFallback) {
        var base = App.site.base();
        var clean = String(path || '').replace(/^\/+/, '');
        return base ? base + '/' + clean : (relativeFallback !== undefined ? relativeFallback : clean);
    },

    /** Metinlerde görünen alan adı ("sieger.kz"); kök tanımlı değilse ''. */
    host: function () {
        var base = App.site.base();
        return base.replace(/^[a-z]+:\/\//i, '').replace(/\/.*$/, '');
    },

    /** Değer bilinmiyor mu (boş)? Ekranda yer tutucu yazılır, bağlantı kurulmaz. */
    isPending: function (value) {
        return !String(value === null || value === undefined ? '' : value).trim();
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
