/* ============================================================
   i18n/kz.site.js — SIEGER ÖRNEĞİNE ÖZEL METİNLER (KAZAKÇA)
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

App.i18n.merge('kz', {
    "meta": {
        "notFound": "Бет табылмады — SIEGER",
        "about": "Компания туралы — SIEGER",
        "cart": "Себет — SIEGER",
        "checkout": "Тапсырысты рәсімдеу — SIEGER",
        "compare": "Тауарларды салыстыру — SIEGER",
        "contact": "Байланыс — SIEGER",
        "login": "Кіру және тіркелу — SIEGER",
        "account": "Жеке кабинет — SIEGER",
        "order": "Тапсырыс рәсімделді — SIEGER",
        "privacy": "Құпиялылық саясаты — SIEGER",
        "delivery": "Жеткізу шарттары — SIEGER",
        "returns": "Қайтару және айырбастау — SIEGER",
        "oferta": "Жария оферта — SIEGER",
        "deleteAccount": "Аккаунтты жою сұрауы — SIEGER",
        "product": "Тауар сипаттамасы — SIEGER",
        "wishlist": "Таңдаулылар — SIEGER"
    },
    "home": {
        "pageTitle": "SIEGER - Дүкен",
        "slider1": {
            "subtitle": "«Sieger Kunststoff» ЖШС",
            "subtitleSpan": "",
            "title": "Sieger",
            "titleSpan": "Kunststoff",
            "description": "",
            "descriptionSpan": "",
            "shopNow": "Каталогқа өту"
        },
        "slider2": {
            "subtitle": "«Sieger Systems» ЖШС",
            "subtitleSpan": "",
            "title": "Sieger",
            "titleSpan": "Systems",
            "description": "",
            "descriptionSpan": "",
            "shopNow": "Каталогқа өту"
        },
        "slider3": {
            "subtitle": "Sieger Kunststoff · Sieger Systems",
            "subtitleSpan": "",
            "title": "Жаңа келгендер",
            "titleSpan": "",
            "description": "",
            "descriptionSpan": "",
            "shopNow": "Жаңа келгендерді көру"
        }
    },
    "shop": {
        "pageTitle": "SIEGER - Дүкен"
    },
    "shopList": {
        "pageTitle": "SIEGER - Өнімдер тізімі",
        "support": {
            "brand": "SIEGER Қолдауы",
            "welcomeMessage": "Sieger тұтынушылар қызметіне қош келдіңіз, сізге қалай көмектесе аламыз?"
        }
    },
    "footer": {
        "copyright": "Авторлық құқық © 2026 SIEGER. Барлық құқықтар қорғалған.",
        "registerDesc": ""
    },
    "contact": {
        "addressText": "Қазақстан Республикасы, 050019, Алматы қаласы,<br>Медеу ауданы, Гурилев көшесі, 110А үй"
    },
    "privacy": {
        "intro": {
            "description": "Бұл Құпиялылық саясаты Sieger («Sieger Kunststoff» ЖШС және «Sieger Systems» ЖШС) сіз веб-сайтымызды және қызметтерімізді пайдаланған кезде жеке деректеріңізді қалай жинайтынын, пайдаланатынын және қорғайтынын түсіндіреді. Қолданыстағы заңнамаға сәйкес құпиялылығыңыздың қорғалуын қамтамасыз етуге міндеттіміз."
        },
        "s1": {
            "p1": "Жеке деректеріңізді өңдеуге жауапты операторлар — Қазақстан Республикасында тіркелген «Sieger Kunststoff» ЖШС (БСН 260440027925) және «Sieger Systems» ЖШС. Осы Құпиялылық саясаты {site} веб-сайтымызға және iOS пен Android арналған Sieger мобильді қосымшаларымызға қолданылады. Олардың кез келгенін пайдалана отырып, сіз осы Құпиялылық саясатының шарттарымен келісесіз."
        },
        "s8": {
            "hours": ""
        }
    },
    "delivery": {
        "intro": {
            "description": "Бұл бетте Sieger интернет-дүкенінде берілген тапсырыстардың қай аймақтарға, қандай мерзімде және қандай ақыға жеткізілетіні туралы ақпаратты таба аласыз."
        },
        "s6": {
            "hours": ""
        }
    },
    "returns": {
        "s4": {
            "p1": "Қайтару туралы өтінішіңізді жеке кабинеттегі қолдау чаты арқылы хабарлаңыз. Өтінішіңіз мақұлданғаннан кейін тауарды көрсетілген мекенжайға жіберуіңіз сұралады. Тауар бізге жетіп, тексерілгеннен кейін қайтару аяқталады."
        },
        "s7": {
            "hours": ""
        }
    },
    "oferta": {
        "intro": {
            "description": "Осы жария оферта {site} сайты және iOS пен Android арналған Sieger мобильді қосымшалары арқылы сатып алу жасайтын барлық тұтынушылар үшін Сатушы мен Сатып алушы арасындағы құқықтар мен міндеттерді реттейді. Сайтта немесе қосымшада тапсырыс беру арқылы сіз осы шарттарды қабылдаған болып саналасыз."
        },
        "s1": {
            "p2": "Сатушылар: «Sieger Kunststoff» ЖШС, БСН 260440027925, заңды мекенжайы: Қазақстан Республикасы, 050019, Алматы қаласы, Медеу ауданы, Гурилев көшесі, 110А үй; «Sieger Systems» ЖШС (деректемелері осы офертаның соңында көрсетілген). Тапсырыстың Сатушысы — тапсырыстағы тауарлар тиесілі компания: себетте екі компанияның да тауарлары болса, әр Сатушыға жеке тапсырыс ресімделеді.",
            "p3": "Сатып алушы {site} сайтында тапсырыс беру арқылы осы шарттардың барлығын оқып, қабылдағанын растайды."
        },
        "s4": {
            "p2": "Төлем тапсырысты ресімдеу кезінде көрсетілетін Сатушы деректемелері бойынша банктік аударыммен жүзеге асырылады."
        },
        "s11": {
            "p1": "«Sieger Kunststoff» ЖШС<br>БСН: 260440027925<br>БеК: 17<br>Заңды және нақты мекенжайы: Қазақстан Республикасы, 050019, Алматы қаласы, Медеу ауданы, Гурилев көшесі, 110А үй<br>Басшы: ____________<br>Банк деректемелері: тапсырысты ресімдеу кезінде көрсетіледі<br><br>«Sieger Systems» ЖШС<br>БСН: ____________<br>Заңды мекенжайы: ____________<br>Басшы: ____________<br>Банк деректемелері: тапсырысты ресімдеу кезінде көрсетіледі"
        }
    },
    "deleteAccount": {
        "intro": {
            "title": "Аккаунтты жою сұрауы — SIEGER",
            "description": "Sieger қолданбасындағы аккаунтыңызды және онымен байланысты деректерді жойғыңыз келсе, төмендегі қадамдарды орындай отырып сұрауыңызды бізге жібере аласыз."
        },
        "s1": {
            "step2": "НЕМЕСЕ жеке кабинеттегі қолдау чатына «Тіркелгіні жою сұрауы» тақырыбымен жазыңыз."
        },
        "s4": {
            "hours": ""
        }
    },
    "site": {
        "about": {
            "text": "Sieger екі қазақстандық компанияны біріктіреді — «Sieger Kunststoff» ЖШС және «Sieger Systems» ЖШС. Sieger интернет-дүкенінде тауарлар ассортиментімен танысып, бағаларды біліп, тапсырыс бере аласыз."
        },
        "companies": {
            "kf": {
                "name": "«Sieger Kunststoff» ЖШС",
                "details": "БСН 260440027925<br>Қазақстан Республикасы, 050019, Алматы қаласы, Медеу ауданы, Гурилев көшесі, 110А үй"
            },
            "sys": {
                "name": "«Sieger Systems» ЖШС",
                "details": "Қазақстан Республикасы"
            }
        }
    }
});
