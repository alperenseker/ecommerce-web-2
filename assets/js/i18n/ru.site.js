/* ============================================================
   i18n/ru.site.js — SIEGER ÖRNEĞİNE ÖZEL METİNLER (RUSÇA)
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

App.i18n.merge('ru', {
    "meta": {
        "notFound": "Страница не найдена — SIEGER",
        "about": "О компании — SIEGER",
        "cart": "Корзина — SIEGER",
        "checkout": "Оформление заказа — SIEGER",
        "compare": "Сравнение товаров — SIEGER",
        "contact": "Контакты — SIEGER",
        "login": "Вход и регистрация — SIEGER",
        "account": "Личный кабинет — SIEGER",
        "order": "Заказ оформлен — SIEGER",
        "privacy": "Политика конфиденциальности — SIEGER",
        "delivery": "Условия доставки — SIEGER",
        "returns": "Возврат и обмен — SIEGER",
        "oferta": "Публичная оферта — SIEGER",
        "deleteAccount": "Запрос на удаление аккаунта — SIEGER",
        "product": "Описание товара — SIEGER",
        "wishlist": "Избранное — SIEGER"
    },
    "home": {
        "pageTitle": "SIEGER - Магазин",
        "slider1": {
            "subtitle": "ТОО «Sieger Kunststoff»",
            "subtitleSpan": "",
            "title": "Sieger",
            "titleSpan": "Kunststoff",
            "description": "",
            "descriptionSpan": "",
            "shopNow": "Перейти в каталог"
        },
        "slider2": {
            "subtitle": "ТОО «Sieger Systems»",
            "subtitleSpan": "",
            "title": "Sieger",
            "titleSpan": "Systems",
            "description": "",
            "descriptionSpan": "",
            "shopNow": "Перейти в каталог"
        },
        "slider3": {
            "subtitle": "Sieger Kunststoff · Sieger Systems",
            "subtitleSpan": "",
            "title": "Новинки",
            "titleSpan": "",
            "description": "",
            "descriptionSpan": "",
            "shopNow": "Смотреть новинки"
        }
    },
    "shop": {
        "pageTitle": "SIEGER - Магазин"
    },
    "shopList": {
        "pageTitle": "SIEGER - Список товаров",
        "support": {
            "brand": "Поддержка SIEGER",
            "welcomeMessage": "Добро пожаловать в службу поддержки Sieger, чем мы можем вам помочь?"
        }
    },
    "footer": {
        "copyright": "Авторские права © 2026 SIEGER. Все права защищены.",
        "registerDesc": ""
    },
    "contact": {
        "addressText": "Республика Казахстан, 050019, г. Алматы,<br>Медеуский район, ул. Гурилева, дом 110А"
    },
    "privacy": {
        "intro": {
            "description": "Настоящая Политика конфиденциальности объясняет, как Sieger (ТОО «Sieger Kunststoff» и ТОО «Sieger Systems») собирает, использует и защищает ваши персональные данные при использовании нашего сайта и услуг. Мы обязуемся обеспечивать защиту вашей конфиденциальности в соответствии с действующим законодательством."
        },
        "s1": {
            "p1": "Операторами, ответственными за обработку ваших персональных данных, являются ТОО «Sieger Kunststoff» (БИН 260440027925) и ТОО «Sieger Systems», зарегистрированные в Республике Казахстан. Настоящая Политика конфиденциальности распространяется на наш сайт {site} и на мобильные приложения Sieger для iOS и Android. Используя любой из этих сервисов, вы соглашаетесь с условиями настоящей Политики конфиденциальности."
        },
        "s8": {
            "hours": ""
        }
    },
    "delivery": {
        "intro": {
            "description": "На этой странице вы найдёте информацию о том, в какие регионы, в какие сроки и по какой стоимости доставляются заказы, оформленные в интернет-магазине Sieger."
        },
        "s6": {
            "hours": ""
        }
    },
    "returns": {
        "s4": {
            "p1": "Сообщите о своём намерении вернуть товар через чат поддержки в личном кабинете. После одобрения заявки вам будет предложено отправить товар по указанному адресу. Возврат завершается после получения и проверки товара."
        },
        "s7": {
            "hours": ""
        }
    },
    "oferta": {
        "intro": {
            "description": "Настоящая публичная оферта регулирует права и обязанности между Продавцом и Покупателем при совершении покупок на сайте {site} и в мобильных приложениях Sieger для iOS и Android. Оформляя заказ на сайте или в приложении, вы принимаете условия настоящей оферты."
        },
        "s1": {
            "p2": "Продавцы: ТОО «Sieger Kunststoff», БИН 260440027925, юридический адрес: Республика Казахстан, 050019, г. Алматы, Медеуский район, ул. Гурилева, дом 110А; ТОО «Sieger Systems» (реквизиты указаны в конце настоящей оферты). Продавцом по заказу является компания, товары которой в него входят: если в корзине есть товары обеих компаний, для каждого Продавца оформляется отдельный заказ.",
            "p3": "Оформляя заказ на сайте {site}, Покупатель подтверждает, что ознакомился с условиями настоящей оферты и принимает их в полном объёме."
        },
        "s4": {
            "p2": "Оплата производится банковским переводом на счёт Продавца по реквизитам, которые показываются при оформлении заказа."
        },
        "s11": {
            "p1": "ТОО «Sieger Kunststoff»<br>БИН: 260440027925<br>КБЕ: 17<br>Юридический и фактический адрес: Республика Казахстан, 050019, г. Алматы, Медеуский район, ул. Гурилева, дом 110А<br>Руководитель: ____________<br>Банковские реквизиты: указываются при оформлении заказа<br><br>ТОО «Sieger Systems»<br>БИН: ____________<br>Юридический адрес: ____________<br>Руководитель: ____________<br>Банковские реквизиты: указываются при оформлении заказа"
        }
    },
    "deleteAccount": {
        "intro": {
            "title": "Запрос на удаление аккаунта — SIEGER",
            "description": "Если вы хотите удалить свой аккаунт в приложении Sieger и связанные с ним данные, вы можете направить запрос, выполнив указанные ниже шаги."
        },
        "s1": {
            "step2": "ИЛИ напишите в чат поддержки в личном кабинете с темой «Запрос на удаление аккаунта»."
        },
        "s4": {
            "hours": ""
        }
    },
    "site": {
        "about": {
            "text": "Sieger объединяет две казахстанские компании — ТОО «Sieger Kunststoff» и ТОО «Sieger Systems». В интернет-магазине Sieger можно ознакомиться с ассортиментом, узнать цены и оформить заказ."
        },
        "companies": {
            "kf": {
                "name": "ТОО «Sieger Kunststoff»",
                "details": "БИН 260440027925<br>Республика Казахстан, 050019, г. Алматы, Медеуский район, ул. Гурилева, дом 110А"
            },
            "sys": {
                "name": "ТОО «Sieger Systems»",
                "details": "Республика Казахстан"
            }
        }
    }
});
