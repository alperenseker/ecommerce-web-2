/* ============================================================
   i18n/en.site.js — SIEGER ÖRNEĞİNE ÖZEL METİNLER (İNGİLİZCE)
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

App.i18n.merge('en', {
    "meta": {
        "notFound": "Page Not Found — SIEGER",
        "about": "About Us — SIEGER",
        "cart": "Shopping Cart — SIEGER",
        "checkout": "Checkout — SIEGER",
        "compare": "Compare Products — SIEGER",
        "contact": "Contact Us — SIEGER",
        "login": "Sign In & Register — SIEGER",
        "account": "My Account — SIEGER",
        "order": "Order Complete — SIEGER",
        "privacy": "Privacy Policy — SIEGER",
        "delivery": "Delivery Terms — SIEGER",
        "returns": "Returns & Exchange — SIEGER",
        "oferta": "Public Offer Agreement — SIEGER",
        "deleteAccount": "Delete Account Request — SIEGER",
        "product": "Product Details — SIEGER",
        "wishlist": "Wishlist — SIEGER"
    },
    "home": {
        "pageTitle": "SIEGER - Store",
        "slider1": {
            "subtitle": "Sieger Kunststoff LLP",
            "subtitleSpan": "",
            "title": "Sieger",
            "titleSpan": "Kunststoff",
            "description": "",
            "descriptionSpan": "",
            "shopNow": "Go to Catalog"
        },
        "slider2": {
            "subtitle": "Sieger Systems LLP",
            "subtitleSpan": "",
            "title": "Sieger",
            "titleSpan": "Systems",
            "description": "",
            "descriptionSpan": "",
            "shopNow": "Go to Catalog"
        },
        "slider3": {
            "subtitle": "Sieger Kunststoff · Sieger Systems",
            "subtitleSpan": "",
            "title": "New Arrivals",
            "titleSpan": "",
            "description": "",
            "descriptionSpan": "",
            "shopNow": "See new arrivals"
        }
    },
    "shop": {
        "pageTitle": "SIEGER - Shop"
    },
    "shopList": {
        "pageTitle": "SIEGER - Shop List",
        "support": {
            "brand": "SIEGER Support",
            "welcomeMessage": "Welcome to Sieger customer service, how can we help you?"
        }
    },
    "footer": {
        "copyright": "Copyright © 2026 SIEGER. All Rights Reserved.",
        "registerDesc": ""
    },
    "contact": {
        "addressText": "Republic of Kazakhstan, 050019, Almaty,<br>Medeu district, Gurilev street, building 110A"
    },
    "privacy": {
        "intro": {
            "description": "This Privacy Policy explains how Sieger (Sieger Kunststoff LLP and Sieger Systems LLP) collects, uses, and protects your personal data when you use our website and services. We are committed to ensuring your privacy is protected in accordance with applicable laws."
        },
        "s1": {
            "p1": "The data controllers responsible for your personal data are Sieger Kunststoff LLP (BIN 260440027925) and Sieger Systems LLP, registered in the Republic of Kazakhstan. This Privacy Policy covers our website at {site} and our Sieger mobile applications for iOS and Android. By using any of them, you agree to the terms of this Privacy Policy."
        },
        "s8": {
            "hours": ""
        }
    },
    "delivery": {
        "intro": {
            "description": "On this page you will find information about which regions we deliver to, how long delivery takes, and what it costs for orders placed in the Sieger online store."
        },
        "s6": {
            "hours": ""
        }
    },
    "returns": {
        "s4": {
            "p1": "Notify us of your return request via the support chat in your account. Once your request is approved, you will be asked to send the product to the address provided. The return is completed once the product reaches us and is inspected."
        },
        "s7": {
            "hours": ""
        }
    },
    "oferta": {
        "intro": {
            "description": "This Public Offer Agreement governs the rights and obligations between the Seller and the Buyer for purchases made through the {site} website and the Sieger mobile applications for iOS and Android. By placing an order on the site or in the app, you accept the terms of this agreement."
        },
        "s1": {
            "p2": "Sellers: Sieger Kunststoff LLP, BIN 260440027925, registered address: Republic of Kazakhstan, 050019, Almaty, Medeu district, Gurilev street, building 110A; Sieger Systems LLP (details at the end of this offer). The Seller of an order is the company whose products it contains: if the cart contains products of both companies, a separate order is placed with each Seller.",
            "p3": "By placing an order on {site}, the Buyer declares that they have read and accept all terms of this agreement."
        },
        "s4": {
            "p2": "Payment is made by bank transfer to the Seller's account, using the bank details shown when the order is placed."
        },
        "s11": {
            "p1": "Sieger Kunststoff LLP<br>BIN: 260440027925<br>Beneficiary code (KBE): 17<br>Registered and actual address: Republic of Kazakhstan, 050019, Almaty, Medeu district, Gurilev street, building 110A<br>Director: ____________<br>Bank details: shown when the order is placed<br><br>Sieger Systems LLP<br>BIN: ____________<br>Registered address: ____________<br>Director: ____________<br>Bank details: shown when the order is placed"
        }
    },
    "deleteAccount": {
        "intro": {
            "title": "Delete Account Request — SIEGER",
            "description": "If you wish to delete your Sieger account and associated data, you can submit your request by following the steps below."
        },
        "s1": {
            "step2": "OR write to the support chat in your account with the subject \"Account Deletion Request\"."
        },
        "s4": {
            "hours": ""
        }
    },
    "site": {
        "about": {
            "text": "Sieger brings together two Kazakhstan companies — Sieger Kunststoff LLP and Sieger Systems LLP. In the Sieger online store you can browse the range, check prices and place an order."
        },
        "companies": {
            "kf": {
                "name": "Sieger Kunststoff LLP",
                "details": "BIN 260440027925<br>Republic of Kazakhstan, 050019, Almaty, Medeu district, Gurilev street, building 110A"
            },
            "sys": {
                "name": "Sieger Systems LLP",
                "details": "Republic of Kazakhstan"
            }
        }
    }
});
