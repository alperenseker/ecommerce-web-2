/* ============================================================
   i18n/tr.site.js — SIEGER ÖRNEĞİNE ÖZEL METİNLER (TÜRKÇE)
   ------------------------------------------------------------
   *.data.js kaynak projenin (Fores) sözlüğünün birebir aynasıdır;
   oradaki Fores'e özgü cümleler (marka, adres, ТОО, БИН, e-posta,
   yasal metinler, ana sayfa sahneleri) bu katmanla EZİLİR.
   Yükleme sırası: temel sözlük → *.data.js → *.site.js (loader.js).

   🔴 Yasal metinler (оферта, конфиденциальность, возврат, доставка,
   удаление аккаунта) ŞABLONDUR: Fores metni Sieger bilgileriyle
   uyarlandı, iki ТОО ayrı satıcı (K2.16). Köşeli parantezli değerler
   henüz BİLİNMEYEN verilerdir; son metin sahibin onayıyla yayına girer.
   Sieger Kunststoff: 1C'den salt okunur (DURUM.md §2) — БИН, КБЕ, adres.
   Sieger Systems: hiçbir veri bilinmiyor (1C servisi kapalı).
   {site} = App.config.SITE_BASE'ten (K2.17); boşken yer tutucu.
   footer.registerDesc bilerek BOŞ: kaynaktaki şablon cümlesi anlamsızdı.
   ============================================================ */

App.i18n.merge('tr', {
    "meta": {
        "notFound": "Sayfa Bulunamadı — SIEGER",
        "about": "Hakkımızda — SIEGER",
        "cart": "Sepet — SIEGER",
        "checkout": "Ödeme — SIEGER",
        "compare": "Ürün Karşılaştırma — SIEGER",
        "contact": "İletişim — SIEGER",
        "login": "Giriş ve Kayıt — SIEGER",
        "account": "Hesabım — SIEGER",
        "order": "Sipariş Tamamlandı — SIEGER",
        "privacy": "Gizlilik Politikası — SIEGER",
        "delivery": "Teslimat Koşulları — SIEGER",
        "returns": "İade ve Değişim — SIEGER",
        "oferta": "Teklif Sözleşmesi — SIEGER",
        "deleteAccount": "Hesap Silme Talebi — SIEGER",
        "product": "Ürün Detayı — SIEGER",
        "wishlist": "Favoriler — SIEGER"
    },
    "home": {
        "pageTitle": "SIEGER - Mağaza",
        "slider1": {
            "subtitle": "Sieger Kunststoff LLP",
            "subtitleSpan": "",
            "title": "Sieger",
            "titleSpan": "Kunststoff",
            "description": "",
            "descriptionSpan": "",
            "shopNow": "Kataloğa Git"
        },
        "slider2": {
            "subtitle": "Sieger Systems LLP",
            "subtitleSpan": "",
            "title": "Sieger",
            "titleSpan": "Systems",
            "description": "",
            "descriptionSpan": "",
            "shopNow": "Kataloğa Git"
        },
        "slider3": {
            "subtitle": "Sieger Kunststoff · Sieger Systems",
            "subtitleSpan": "",
            "title": "Yeni Gelenler",
            "titleSpan": "",
            "description": "",
            "descriptionSpan": "",
            "shopNow": "Yeni gelenleri gör"
        }
    },
    "shop": {
        "pageTitle": "SIEGER - Mağaza"
    },
    "shopList": {
        "pageTitle": "SIEGER - Ürün Listesi",
        "support": {
            "brand": "SIEGER Destek",
            "welcomeMessage": "Sieger müşteri hizmetlerine hoş geldiniz, size nasıl yardımcı olabiliriz?"
        }
    },
    "footer": {
        "copyright": "Telif Hakkı © 2026 SIEGER. Tüm Hakları Saklıdır.",
        "registerDesc": ""
    },
    "contact": {
        "addressText": "Kazakistan Cumhuriyeti, 050019, Almatı,<br>Medeu ilçesi, Gurilev caddesi, 110A numaralı bina"
    },
    "privacy": {
        "intro": {
            "description": "Bu Gizlilik Politikası, web sitemizi ve hizmetlerimizi kullandığınızda Sieger'in (Sieger Kunststoff LLP ve Sieger Systems LLP) kişisel verilerinizi nasıl topladığını, kullandığını ve koruduğunu açıklamaktadır. Gizliliğinizin yürürlükteki yasalara uygun şekilde korunmasını sağlamaya kararlıyız."
        },
        "s1": {
            "p1": "Kişisel verilerinizden sorumlu veri sorumluları, Kazakistan Cumhuriyeti'nde kayıtlı Sieger Kunststoff LLP (ТОО «Sieger Kunststoff», BIN 260440027925) ve Sieger Systems LLP'dir (ТОО «Sieger Systems»). Bu Gizlilik Politikası {site} web sitemizi ve iOS ile Android için Sieger mobil uygulamalarımızı kapsar. Bunlardan herhangi birini kullanarak bu Gizlilik Politikası'nın şartlarını kabul etmiş olursunuz."
        },
        "s8": {
            "hours": ""
        }
    },
    "delivery": {
        "intro": {
            "description": "Bu sayfada Sieger online mağazasında verdiğiniz siparişlerin hangi bölgelere, ne kadar sürede ve hangi ücretle teslim edildiğini bulabilirsiniz."
        },
        "s6": {
            "hours": ""
        }
    },
    "returns": {
        "s4": {
            "p1": "İade talebinizi hesabınızdaki destek sohbeti üzerinden bildirin. Talebiniz onaylandıktan sonra ürünü size bildirilen adrese göndermeniz istenir. Ürün tarafımıza ulaşıp kontrol edildikten sonra iade işlemi tamamlanır."
        },
        "s7": {
            "hours": ""
        }
    },
    "oferta": {
        "intro": {
            "description": "Bu Teklif Sözleşmesi (оферта), {site} web sitesi ve iOS ile Android için Sieger mobil uygulamaları üzerinden alışveriş yapan tüm müşteriler için Satıcı ile Alıcı arasındaki hak ve yükümlülükleri düzenler. Sitede veya uygulamada sipariş vererek bu sözleşmenin şartlarını kabul etmiş sayılırsınız."
        },
        "s1": {
            "p2": "Satıcılar: Sieger Kunststoff LLP (ТОО «Sieger Kunststoff»), BIN 260440027925, yasal adres: Kazakistan Cumhuriyeti, 050019, Almatı, Medeu ilçesi, Gurilev caddesi, 110A numaralı bina; Sieger Systems LLP (ТОО «Sieger Systems»; bilgileri bu teklifin sonundadır). Bir siparişin Satıcısı, siparişteki ürünlerin ait olduğu şirkettir: sepette iki şirketin de ürünleri varsa her Satıcı için ayrı bir sipariş oluşturulur.",
            "p3": "Alıcı, {site} üzerinden sipariş vererek bu sözleşmenin tüm şartlarını okuduğunu ve kabul ettiğini beyan eder."
        },
        "s4": {
            "p2": "Ödeme, sipariş sırasında gösterilen Satıcı banka bilgilerine havale (banka transferi) ile yapılır."
        },
        "s11": {
            "p1": "Sieger Kunststoff LLP (ТОО «Sieger Kunststoff»)<br>BIN: 260440027925<br>Alıcı kodu (KBE): 17<br>Yasal ve fiili adres: Kazakistan Cumhuriyeti, 050019, Almatı, Medeu ilçesi, Gurilev caddesi, 110A numaralı bina<br>Müdür: ____________<br>Banka bilgileri: sipariş sırasında gösterilir<br><br>Sieger Systems LLP (ТОО «Sieger Systems»)<br>BIN: ____________<br>Yasal adres: ____________<br>Müdür: ____________<br>Banka bilgileri: sipariş sırasında gösterilir"
        }
    },
    "deleteAccount": {
        "intro": {
            "title": "Hesap Silme Talebi — SIEGER",
            "description": "Sieger uygulamasındaki hesabınızı ve ilişkili verilerinizi silmek istiyorsanız, aşağıdaki adımları izleyerek talebinizi bize iletebilirsiniz."
        },
        "s1": {
            "step2": "VEYA hesabınızdaki destek sohbetine \"Hesap Silme Talebi\" konulu bir mesaj yazın."
        },
        "s4": {
            "hours": ""
        }
    },
    "site": {
        "about": {
            "text": "Sieger, iki Kazakistan şirketini bir araya getirir: Sieger Kunststoff LLP ve Sieger Systems LLP. Sieger çevrimiçi mağazasında ürün yelpazesini inceleyebilir, fiyatları görebilir ve sipariş verebilirsiniz."
        },
        "companies": {
            "kf": {
                "name": "Sieger Kunststoff LLP",
                "details": "BIN 260440027925<br>Kazakistan Cumhuriyeti, 050019, Almatı, Medeu ilçesi, Gurilev caddesi, 110A numaralı bina"
            },
            "sys": {
                "name": "Sieger Systems LLP",
                "details": "Kazakistan Cumhuriyeti"
            }
        }
    }
});
