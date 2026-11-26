/* ============================================================
   ui/layout.js — BAŞLIK + ALT BİLGİ + MOBİL ALT ÇUBUK
   ------------------------------------------------------------
   Sayfalarda yalnız iki yer tutucu bulunur:

       <div id="site-header"></div>
       <div id="site-footer"></div>

   İçerik buradan basılır. Menüye bağlantı eklemek 20 dosyayı
   değil TEK dosyayı değiştirmek demektir.

   BAŞLIK ÜÇ ŞERİT (pazar yeri düzeni):
     1) logo · teslimat · ARAMA · dil · hesap · siparişler · sepet
     2) "Tüm kategoriler" + hızlı bağlantılar + duyuru
     3) (dar ekran) alt gezinme çubuğu

   Metinler kaynak projedeki sözlükten (i18n/*.data.js) gelir;
   anahtarlar bilerek oradaki adlarla aynıdır ki iki sitede aynı
   cümleler görünsün.
   ============================================================ */

(function (App) {
    'use strict';

    var Layout = {};
    var B = App.config.BRAND;

    /* Bayrak dosyaları — dil kodu ile dosya adı birebir değil. */
    var FLAGS = { ru: 'ru.png', kz: 'kz.png', en: 'eng.png', tr: 'tr.png' };

    /* ============================================================
       BAŞLIK
       ============================================================ */

    function headerHtml() {
        var t = App.t;

        return '' +
        '<header class="header" id="header">' +

            /* ---------- 1. ŞERİT: KÜNYE ----------
               Telefon, teslimat notu, dil ve hesap buraya taşındı.
               Böylece ana satırda YALNIZCA logo, arama ve sepet kalır;
               sayfanın üstü kalabalık bir gezinme bandı olmaktan çıkar. */
            '<div class="utilbar">' +
                '<div class="container utilbar__inner">' +
                    '<span class="utilbar__note">' +
                        App.icon('pin', 12) +
                        '<span>' + App.utils.escape(B.address) + '</span>' +
                    '</span>' +

                    /* Destek hattı burada: ana satırda logo ile aramanın
                       arasında yer kalmıyordu, künye şeridi ise tam bu
                       tür kısa bilgiler için. Numara henüz belli değilse
                       satır hiç çizilmez (2026-11-12 kararı: boşken görünmesin). */
                    (App.site.isPending(B.phone)
                        ? ''
                        : '<a class="utilbar__note utilbar__phone" href="tel:' + B.phone.replace(/\s/g, '') + '">' +
                              App.icon('headset', 12) +
                              '<span>' + t('footer.gotQuestion', '') + '</span>' +
                              '<b>' + App.utils.escape(B.phone) + '</b>' +
                          '</a>') +

                    '<span class="utilbar__spacer"></span>' +

                    '<span class="utilbar__links">' +
                        '<a href="contact-us.html">' + t('header.contactUs', '') + '</a>' +
                        langMenuHtml() +
                        userMenuHtml() +
                    '</span>' +
                '</div>' +
            '</div>' +

            /* ---------- 2. ŞERİT: LOGO + ARAMA ---------- */
            '<div class="container header__main">' +

                '<button class="burger" type="button" data-act="toggle-menu" ' +
                        'aria-label="' + t('menu.mainMenu', 'Menu') + '">' +
                    App.icon('menu', 20) +
                '</button>' +

                logoHtml() +

                searchHtml() +

                /* Aramanın sağında: favori · karşılaştır · sepet.
                   Giriş düğmesi buradan kalktı — hesap zaten en üstteki
                   künye şeridinde duruyor, ikinci kez tekrarlamak
                   satırı kalabalıklaştırıyordu. */
                '<div class="header__actions">' +
                    '<a class="hicon" href="wishlist.html">' +
                        App.icon('heart', 22) +
                        '<span class="hicon__label">' + t('header.wishlist', 'Избранное') + '</span>' +
                        '<span class="hicon__badge" id="wishlist-badge" hidden>0</span>' +
                    '</a>' +

                    '<a class="hicon" href="compare.html">' +
                        App.icon('compare', 22) +
                        '<span class="hicon__label">' + t('header.compare', 'Сравнить') + '</span>' +
                        '<span class="hicon__badge" id="compare-badge" hidden>0</span>' +
                    '</a>' +

                    cartActionHtml() +
                '</div>' +
            '</div>' +

            /* ---------- 3. ŞERİT: KATALOG ---------- */
            '<nav class="navbar">' +
                '<div class="container navbar__inner">' +

                    '<div class="catmenu" id="catmenu">' +
                        '<button class="catmenu__btn" type="button" data-act="toggle-catmenu">' +
                            App.icon('grid', 14) +
                            '<span>' + t('menu.categories', 'Категории') + '</span>' +
                            App.icon('chevronDown', 11) +
                        '</button>' +
                        '<div class="catmenu__panel" id="catmenu-panel">' +
                            '<div class="t-dim t-sm" style="padding:12px">' +
                                t('shopList.app.loading', 'Загрузка…') + '</div>' +
                        '</div>' +
                    '</div>' +

                    /* Bağlantılar ŞERİDİN ORTASINDA: solda kategori
                       düğmesi çıpa olarak durur, bağlantı öbeği iki
                       yanındaki esnek boşlukla ortalanır. */
                    '<span class="navbar__spacer"></span>' +

                    '<a class="navlink" href="shop.html">'    + t('menu.shop', 'Магазин') + '</a>' +
                    '<a class="navlink" href="about-us.html">' + t('menu.aboutUs', 'О нас') + '</a>' +
                    '<a class="navlink" href="contact-us.html">' + t('header.contactUs', 'Контакты') + '</a>' +

                    '<span class="navbar__spacer"></span>' +
                '</div>' +
            '</nav>' +
        '</header>';
    }

    /**
     * Sepet sütunu — YALNIZ GİRİŞLİ kullanıcıda.
     *
     * Sepet sunucuda kullanıcıya bağlı; girişsiz ziyaretçide simge
     * boş bir kutuya götürür, ürün eklemek de "önce giriş yapın"
     * uyarısıyla biter. Girişsizken hiç çizilmez — giriş bağlantısı
     * zaten en üstteki künye şeridinde duruyor, aramanın yanında
     * ikinci kez tekrarlamak satırı kalabalıklaştırıyordu.
     */
    function cartActionHtml() {
        var t = App.t;

        if (!App.auth.isLoggedIn()) return '';

        return '<button class="hicon hicon--accent" type="button" data-act="toggle-drawer">' +
                   App.icon('cart', 22) +
                   '<span class="hicon__sum" id="cart-total">' +
                       App.fmt.price(App.cart.total()) + '</span>' +
                   '<span class="hicon__label">' + t('header.cart', 'Корзина') + '</span>' +
                   '<span class="hicon__badge" id="cart-badge" hidden>0</span>' +
               '</button>';
    }

    /**
     * Logo — K2.14: iki şirketin logosu YAN YANA tek görselde
     * (Sieger Kunststoff + Sieger Systems). Görsel yüklenemezse ad
     * yazı olarak görünür (alt metni). Künye (slogan) bilerek yok.
     * K2.27: görseller saydam; plaka yok.
     * @param {boolean} [onDark] alt bilgide koyu zemin: beyaz yazılı
     *        saydam sürüm (BRAND.logoDark) kullanılır.
     */
    function logoHtml(onDark) {
        var src = (onDark && B.logoDark) ? B.logoDark : B.logo;
        if (src) {
            return '<a class="logo logo--image' + (onDark ? ' logo--dark' : '') + '" href="index.html"' +
                       (B.tagline ? ' data-tag="' + App.utils.escape(B.tagline) + '"' : '') + '>' +
                       '<img class="logo__img" src="' + App.utils.escape(src) + '" ' +
                            'alt="' + App.utils.escape(B.name + (B.suffix || '')) + '" width="187" height="60">' +
                   '</a>';
        }
        return '<a class="logo" href="index.html" data-tag="' +
                   App.utils.escape(B.tagline) + '">' +
                   '<span class="logo__text">' + App.utils.escape(B.name) +
                       (B.suffix ? '<em>' + App.utils.escape(B.suffix) + '</em>' : '') +
                   '</span>' +
               '</a>';
    }

    /**
     * Telefon / e-posta bağlantısı. Değer henüz belli değilse (K2.17 ve
     * DURUM.md §4: Sieger'in destek e-postası ve tam telefonu bekleniyor)
     * bağlantı KURULMAZ, görünür bir yer tutucu yazılır.
     */
    function contactLink(kind, value) {
        if (App.site.isPending(value)) {
            return '<span class="pending">' + App.utils.escape(App.t(
                kind === 'tel' ? 'site.pending.phone' : 'site.pending.email',
                kind === 'tel' ? '[phone to be confirmed]' : '[e-mail to be confirmed]')) + '</span>';
        }
        var href = kind === 'tel' ? 'tel:' + String(value).replace(/\s/g, '') : 'mailto:' + value;
        return '<a href="' + App.utils.escape(href) + '">' + App.utils.escape(value) + '</a>';
    }
    Layout.contactLink = contactLink;

    /**
     * Alt bilgideki tek iletişim satırı (simge + bağlantı). Değer henüz
     * belli değilse satır HİÇ çizilmez (2026-11-12 kararı: "boşken hiç
     * görünmesin") — yer tutucu yalnız contactLink'i doğrudan çağıranlarda.
     */
    function contactRow(icon, kind, value) {
        if (App.site.isPending(value)) return '';
        return '<div class="footer__contact-row">' + App.icon(icon, 15) +
                   contactLink(kind, value) + '</div>';
    }

    /**
     * Arama kutusu. Soldaki seçici "nerede arayacağım" sorusunu
     * cevaplar; kategori seçiliyse arama o dalın içinde kalır.
     */
    function searchHtml() {
        var t = App.t;
        return '<div class="search" id="site-search">' +
                   '<form class="search__field" role="search" autocomplete="off">' +
                       '<select class="search__scope" id="search-scope" aria-label="' +
                               t('header.allCategories', 'Все категории') + '">' +
                           '<option value="">' + t('header.allCategories', 'Все категории') + '</option>' +
                       '</select>' +
                       '<input class="search__input" type="search" id="search-input" ' +
                              'placeholder="' + t('header.searchPlaceholder', 'Поиск...') + '" ' +
                              'aria-label="' + t('common.search', 'Поиск') + '">' +
                       '<button class="search__btn" type="submit" aria-label="' + t('common.search', 'Поиск') + '">' +
                           App.icon('search', 17) +
                       '</button>' +
                   '</form>' +
                   '<div class="search__panel" id="search-panel"></div>' +
               '</div>';
    }

    /** Dil menüsü — bayrak + kod. */
    function langMenuHtml() {
        var current = App.i18n.lang;
        var flag = FLAGS[current];

        return '<span class="catmenu" id="langmenu">' +
                   '<button class="hbtn" type="button" data-act="toggle-lang">' +
                       '<span class="hbtn__main">' +
                           (flag ? '<img src="assets/img/flags/' + flag + '" alt="" width="18" height="12" ' +
                                   'style="border-radius:2px">' : '') +
                           '<span>' + String(current || '').toUpperCase() + '</span>' +
                           App.icon('chevronDown', 11) +
                       '</span>' +
                   '</button>' +
                   '<span class="catmenu__panel" style="width:190px;right:0;left:auto">' +
                       App.i18n.available().map(function (l) {
                           return '<button class="catmenu__link" type="button" data-lang="' + l.code + '">' +
                                      (FLAGS[l.code] ? '<img src="assets/img/flags/' + FLAGS[l.code] + '" ' +
                                          'alt="" width="20" height="14" style="border-radius:2px">' : '') +
                                      '<span class="grow">' + l.name + '</span>' +
                                      (l.code === current ? App.icon('check', 14) : '') +
                                  '</button>';
                       }).join('') +
                   '</span>' +
               '</span>';
    }

    /** Hesap menüsü — girişsizken "Giriş yap", girişliyken ad + menü. */
    function userMenuHtml() {
        var t = App.t;

        if (!App.auth.isLoggedIn()) {
            return '<a class="hbtn" href="login.html">' +
                       '<span class="hbtn__main">' +
                           App.icon('user', 13) +
                           '<span>' + t('header.signIn', 'Войти') + '</span>' +
                       '</span>' +
                   '</a>';
        }

        var user = App.auth.user() || {};
        var name = user.firstName || user.name || user.fullName || user.email || '';

        return '<span class="catmenu" id="usermenu">' +
                   '<button class="hbtn" type="button" data-act="toggle-user">' +
                       '<span class="hbtn__main">' +
                           App.icon('user', 13) +
                           '<span>' + App.utils.escape(App.fmt.truncate(name, 14)) + '</span>' +
                           App.icon('chevronDown', 10) +
                       '</span>' +
                   '</button>' +

                   '<span class="catmenu__panel" style="width:240px;right:0;left:auto">' +
                       '<span style="display:block;padding:10px 16px;border-bottom:1px solid var(--line)">' +
                           '<span class="t-sm t-hi t-bold" style="display:block">' + App.utils.escape(name) + '</span>' +
                           '<span class="t-xs t-dim">' + App.utils.escape(user.email || '') + '</span>' +
                       '</span>' +
                       link('my-account.html', 'user', 'account.tabs.dashboard', 'Панель') +
                       link('my-account.html?tab=orders', 'box', 'account.tabs.orders', 'Заказы') +
                       link('my-account.html?tab=addresses', 'pin', 'account.tabs.addresses', 'Адреса') +
                       link('my-account.html?tab=details', 'settings', 'account.tabs.accountDetails', 'Детали') +
                       link('my-account.html?tab=reviews', 'star', 'account.tabs.reviews', 'Отзывы') +
                       link('wishlist.html', 'heart', 'account.tabs.wishlist', 'Избранное') +
                       '<button class="catmenu__link" type="button" data-act="logout">' +
                           App.icon('logout', 15) +
                           '<span class="grow">' + t('account.tabs.logout', 'Выйти') + '</span>' +
                       '</button>' +
                   '</span>' +
               '</span>';

        function link(href, icon, key, fallback) {
            return '<a class="catmenu__link" href="' + href + '">' +
                       App.icon(icon, 15) +
                       '<span class="grow">' + t(key, fallback) + '</span>' +
                   '</a>';
        }
    }

    /* ============================================================
       ALT BİLGİ
       ============================================================ */

    function footerHtml() {
        var t = App.t;

        return '' +
        '<footer class="footer">' +

            '<button class="footer__totop" type="button" data-act="scroll-top">' +
                App.icon('chevronUp', 14) + ' ' + t('common.top', 'Наверх') +
            '</button>' +

            '<div class="container footer__top">' +

                '<div>' +
                    logoHtml(true) +
                    /* Kaynak projenin anlamsız şablon cümlesi SIEGER katmanında
                       boşaltıldı (uydurma metin yazılmaz); boşsa paragraf hiç
                       çizilmez. */
                    (t('footer.registerDesc', '')
                        ? '<p class="footer__brand-text">' + t('footer.registerDesc', '') + '</p>'
                        : '') +
                    /* "Sorunuz mu var?" başlığı yalnız altında bir iletişim
                       satırı varsa; boş değer satırı hiç çizilmez (2026-11-12). */
                    (App.site.isPending(B.phone) && App.site.isPending(B.email) ? '' :
                        '<div class="footer__contact-row">' + App.icon('headset', 15) +
                            '<span>' + t('footer.gotQuestion', '') + '</span></div>') +
                    contactRow('phone', 'tel', B.phone) +
                    /* İkinci hat yalnız tanımlıysa (Fores/Foral'ın iki hattı vardı). */
                    contactRow('phone', 'tel', B.phone2) +
                    contactRow('mail', 'mail', B.email) +
                    '<div class="social">' +
                        (App.site.isPending(B.email) ? '' :
                            '<a href="mailto:' + App.utils.escape(B.email) + '" aria-label="E-mail">' + App.icon('mail', 15) + '</a>') +
                        (App.site.isPending(B.phone) ? '' :
                            '<a href="tel:' + App.utils.escape(B.phone.replace(/\s/g, '')) + '" aria-label="Phone">' + App.icon('phone', 15) + '</a>') +
                        '<a href="contact-us.html" aria-label="Contact">' + App.icon('globe', 15) + '</a>' +
                    '</div>' +
                '</div>' +

                '<div>' +
                    '<h4 class="footer__title">' + t('footer.company', 'Компания') + '</h4>' +
                    '<ul class="footer__list">' +
                        '<li><a href="about-us.html">' + t('menu.aboutUs', 'О нас') + '</a></li>' +
                        '<li><a href="contact-us.html">' + t('header.contactUs', 'Контакты') + '</a></li>' +
                        '<li><a href="shop.html">' + t('menu.shop', 'Магазин') + '</a></li>' +
                        '<li><a href="oferta.html">' + t('footer.offerAgreement', 'Публичная оферта') + '</a></li>' +
                        '<li><a href="privacy.html">' + t('footer.privacyPolicy', 'Политика конфиденциальности') + '</a></li>' +
                    '</ul>' +
                '</div>' +

                '<div>' +
                    '<h4 class="footer__title">' + t('footer.customerService', 'Служба поддержки') + '</h4>' +
                    '<ul class="footer__list">' +
                        '<li><a href="delivery.html">' + t('footer.deliveryInfo', 'Условия доставки') + '</a></li>' +
                        '<li><a href="returns.html">' + t('footer.returnsInfo', 'Возврат и обмен') + '</a></li>' +
                        '<li><a href="contact-us.html#faq">' + t('menu.faq', 'Вопросы и ответы') + '</a></li>' +
                        '<li><a href="delete-account.html">' + t('deleteAccount.pageTitle', 'Удаление аккаунта') + '</a></li>' +
                        '<li><a href="my-account.html?tab=orders">' + t('header.trackOrder', 'Отследить заказ') + '</a></li>' +
                    '</ul>' +
                '</div>' +

                '<div>' +
                    '<h4 class="footer__title">' + t('footer.myAccount', 'Мой аккаунт') + '</h4>' +
                    '<ul class="footer__list">' +
                        '<li><a href="my-account.html">' + t('footer.profile', 'Профиль') + '</a></li>' +
                        '<li><a href="cart.html">' + t('footer.viewCart', 'Корзина') + '</a></li>' +
                        '<li><a href="wishlist.html">' + t('footer.myWishlist', 'Избранное') + '</a></li>' +
                        '<li><a href="compare.html">' + t('footer.compareProducts', 'Сравнить товары') + '</a></li>' +
                        /* Girişli kullanıcıya "giriş yap" gösterilmez. */
                        (App.auth.isLoggedIn() ? '' :
                            '<li><a href="login.html">' + t('header.signIn', 'Войти') + '</a></li>') +
                    '</ul>' +
                '</div>' +

                '<div>' +
                    '<h4 class="footer__title">' + t('contact.pageTitle', 'Контакты') + '</h4>' +
                    '<div class="footer__contact-row">' + App.icon('pin', 15) +
                        '<span style="color:rgba(255,255,255,.68)">' + App.utils.escape(B.address) + '</span></div>' +
                    contactRow('mail', 'mail', B.email) +
                    '<div class="footer__contact-row">' + App.icon('clock', 15) +
                        '<span style="color:rgba(255,255,255,.68)">' + t('footer.support247', '') + '</span></div>' +
                    '<a class="btn btn--ghost btn--sm mt-3" href="contact-us.html">' +
                        t('contact.formTitle', 'Написать нам') + '</a>' +
                '</div>' +
            '</div>' +

            '<div class="container footer__bottom">' +
                '<span>' + t('footer.copyright', '© SIEGER') + '</span>' +
                '<span class="footer__made">' +
                    'Made by ' +
                    '<a href="https://aycom.kz" target="_blank" rel="noopener noreferrer">AYCOM</a>' +
                '</span>' +
            '</div>' +
        '</footer>' +

        tabbarHtml();
    }

    /** Dar ekranda alt gezinme çubuğu — pazar yerlerinde standart. */
    function tabbarHtml() {
        var t = App.t;
        var here = currentPage();

        function item(href, icon, key, fallback, badgeId) {
            var active = href.split('?')[0] === here ? ' is-active' : '';
            return '<a class="tabbar__item' + active + '" href="' + href + '">' +
                       App.icon(icon, 19) +
                       (badgeId ? '<span class="tabbar__badge" id="' + badgeId + '" hidden>0</span>' : '') +
                       '<span>' + t(key, fallback) + '</span>' +
                   '</a>';
        }

        var logged = App.auth.isLoggedIn();

        return '<nav class="tabbar">' +
                   item('index.html', 'home', 'stickyFooter.home', 'Главная') +
                   item('shop.html', 'grid', 'stickyFooter.shop', 'Магазин') +
                   (logged
                       ? item('wishlist.html', 'heart', 'header.wishlist', 'Избранное', 'wishlist-badge-m')
                       : '') +
                   item(logged ? 'my-account.html' : 'login.html', 'user', 'stickyFooter.account', 'Аккаунт') +
                   (logged
                       ? item('cart.html', 'cart', 'stickyFooter.cart', 'Корзина', 'cart-badge-m')
                       : '') +
               '</nav>';
    }

    /* ============================================================
       KATEGORİ MENÜSÜ (veri gelince dolar)
       ============================================================ */

    /* ============================================================
       KATEGORİ MEGAMENÜSÜ
       ------------------------------------------------------------
       Kaynak projedeki düzenin aynısı: SOLDA ana kategori listesi,
       SAĞDA geniş bir panel. Soldaki bir başlığın üstüne gelince
       panel o kategorinin alt dallarıyla dolar ve dallar SÜTUNLARA
       dizilir — menü aşağı doğru uzamak yerine YANA açılır.

       🔴 GEÇ KAPANMA: fare düğmeden panele giderken aradaki boşluğu
       geçer; menü anında kapanırsa kullanıcı panele hiç ulaşamaz.
       Bu yüzden ayrılışta 150 ms beklenir, o sırada panele girilirse
       kapanma iptal olur.
       ============================================================ */

    var catTree = [];
    var closeTimer = null;

    function renderCategoryMenu(categories) {
        catTree = categories || [];

        var panel = document.getElementById('catmenu-panel');
        var scope = document.getElementById('search-scope');

        /* Arama kutusundaki kapsam seçicisi de aynı listeden beslenir.
           Uzun adlar kırpılır: seçicinin iç genişliği en uzun seçeneğe
           göre hesaplanıyor, kırpmazsak kutu araç çubuğunu eziyor. */
        if (scope && catTree.length) {
            scope.innerHTML = '<option value="">' + App.t('header.allCategories', 'Все категории') + '</option>' +
                flatten(catTree, 0).map(function (row) {
                    var label = (row.depth ? '— '.repeat(row.depth) : '') + row.name;
                    return '<option value="' + row.id + '">' +
                           App.utils.escape(App.fmt.truncate(label, 34)) + '</option>';
                }).join('');
        }

        if (!panel) return;

        if (!catTree.length) {
            panel.innerHTML = '<div class="t-dim t-sm" style="padding:16px">' +
                              App.t('shopList.app.loading', '…') + '</div>';
            return;
        }

        panel.innerHTML =
            '<div class="megamenu">' +
                '<ul class="megamenu__side">' +
                    catTree.map(function (cat, i) {
                        var subs = cat.SubCategories || [];
                        return '<li>' +
                                   '<button class="megaitem' + (i === 0 ? ' is-active' : '') + '" type="button" ' +
                                           'data-act="mega-pick" data-id="' + cat.Id + '">' +
                                       '<span class="grow t-clamp-1">' + App.utils.escape(cat.Name) + '</span>' +
                                       (subs.length ? App.icon('chevronRight', 12) : '') +
                                   '</button>' +
                               '</li>';
                    }).join('') +
                '</ul>' +
                '<div class="megamenu__panel" id="megamenu-panel">' +
                    panelHtml(catTree[0]) +
                '</div>' +
            '</div>';
    }

    /**
     * Sağ panel: kategori başlığı + alt dallar sütunlar hâlinde.
     *
     * 🔴 AĞACIN TAMAMI ÇİZİLİR. Ağaç her kategoride aynı derinlikte
     * değil: "Fores" altında 23 yaprak var, "Foral" altında ise
     * Фурнитура → ДВЕРНЫЕ/ОКОННЫЕ → 11 yaprak şeklinde iki kat daha
     * iniyor. Sabit iki seviye basınca Foral'ın yaprakları hiç
     * görünmüyordu. Üç durum ayrı ele alınır:
     *
     *   1) SARMALAYICI DAL — dalın çocukları da dallıysa (Foral),
     *      dal tam genişlikte başlık olur, ÇOCUKLARI sütunlara dizilir.
     *   2) NORMAL DAL — her dal bir sütun: başlık + altındaki ağaç.
     *   3) YAPRAK — çocuğu olmayan dallar sade bağlantı ızgarası.
     */
    function panelHtml(cat) {
        if (!cat) return '';

        var subs = cat.SubCategories || [];

        var html = '<a class="megapanel__title" href="shop.html?category=' + cat.Id + '">' +
                       '<span>' + App.utils.escape(cat.Name) + '</span>' +
                       App.icon('arrowRight', 13) +
                   '</a>';

        if (!subs.length) {
            return html + '<p class="t-mut t-sm">' + App.t('category.noSubcategory', '—') + '</p>';
        }

        var deep = subs.filter(hasKids);
        var flat = subs.filter(function (sub) { return !hasKids(sub); });

        /* 1) Sarmalayıcı: dallı dalların çocukları da dallı mı? */
        var wrapper = deep.length > 0 && deep.every(function (sub) {
            return (sub.SubCategories || []).some(hasKids);
        });

        if (wrapper) {
            html += deep.map(function (sub) {
                return '<a class="megapanel__group" href="shop.html?category=' + sub.Id + '">' +
                           App.utils.escape(sub.Name) +
                       '</a>' +
                       '<div class="megacols">' +
                           (sub.SubCategories || []).map(columnHtml).join('') +
                       '</div>';
            }).join('');

        } else if (deep.length) {
            /* 2) Her dal bir sütun. */
            html += '<div class="megacols">' + deep.map(columnHtml).join('') + '</div>';
        }

        /* 3) Yapraklar sade ızgara. */
        if (flat.length) {
            html += '<div class="megacols megacols--flat">' + flat.map(function (leaf) {
                return '<a class="megacol__item" href="shop.html?category=' + leaf.Id + '">' +
                           App.utils.escape(leaf.Name) + '</a>';
            }).join('') + '</div>';
        }

        return html;
    }

    function hasKids(cat) {
        return !!(cat && cat.SubCategories && cat.SubCategories.length);
    }

    /** Tek sütun: başlık + altındaki ağacın tamamı. */
    function columnHtml(sub) {
        return '<div class="megacol">' +
                   '<a class="megacol__head" href="shop.html?category=' + sub.Id + '">' +
                       App.utils.escape(sub.Name) + '</a>' +
                   subtreeHtml(sub.SubCategories) +
               '</div>';
    }

    /** Sütun içindeki ağaç — dallı düğüm ara başlık, yaprak bağlantı. */
    function subtreeHtml(items) {
        return (items || []).map(function (item) {
            if (hasKids(item)) {
                return '<a class="megacol__sub" href="shop.html?category=' + item.Id + '">' +
                           App.utils.escape(item.Name) + '</a>' +
                       subtreeHtml(item.SubCategories);
            }
            return '<a class="megacol__item" href="shop.html?category=' + item.Id + '">' +
                       App.utils.escape(item.Name) + '</a>';
        }).join('');
    }

    function findCat(list, id) {
        for (var i = 0; i < (list || []).length; i++) {
            if (String(list[i].Id) === String(id)) return list[i];
            var deep = findCat(list[i].SubCategories, id);
            if (deep) return deep;
        }
        return null;
    }

    /** Soldaki başlık seçimi — hem tıklamada hem fare üstüne gelince. */
    function pickCategory(btn) {
        var cat = findCat(catTree, btn.dataset.id);
        if (!cat) return;

        var side = btn.closest('.megamenu__side');
        if (side) {
            App.utils.$$('.megaitem', side).forEach(function (item) {
                item.classList.toggle('is-active', item === btn);
            });
        }

        var panel = document.getElementById('megamenu-panel');
        if (panel) panel.innerHTML = panelHtml(cat);
    }

    App.actions.register('mega-pick', function (btn) { pickCategory(btn); });

    App.utils.on(document, 'mouseover', '.megaitem', function (e, btn) {
        if (!hasHover()) return;
        pickCategory(btn);
    });

    /** Cihaz gerçekten fareyle mi kullanılıyor. */
    function hasHover() {
        return window.matchMedia && window.matchMedia('(hover: hover)').matches;
    }

    /** Ağacı düz listeye indirir (arama kapsamı seçicisi için). */
    function flatten(list, depth) {
        var out = [];
        (list || []).forEach(function (cat) {
            out.push({ id: cat.Id, name: cat.Name, depth: depth });
            if (depth < 2) out = out.concat(flatten(cat.SubCategories, depth + 1));
        });
        return out;
    }

    /* ============================================================
       ROZETLER
       ============================================================ */

    function setBadge(id, value) {
        var el = document.getElementById(id);
        if (!el) return;
        el.textContent = value > 99 ? '99+' : value;
        el.hidden = !value;
    }

    Layout.refreshBadges = function () {
        var cart = App.cart.count();
        var wish = App.wishlist.count();

        /* Sepet sütunundaki tutar da sayaçla birlikte güncellenir. */
        var total = document.getElementById('cart-total');
        if (total) total.textContent = App.fmt.price(App.cart.total());

        setBadge('cart-badge', cart);
        setBadge('cart-badge-m', cart);
        setBadge('wishlist-badge', wish);
        setBadge('wishlist-badge-m', wish);
        setBadge('compare-badge', App.compare.count());
    };

    /* ============================================================
       AÇILIR MENÜLER
       ============================================================ */

    var MENUS = [
        { act: 'toggle-catmenu', id: 'catmenu' },
        { act: 'toggle-lang',    id: 'langmenu' },
        { act: 'toggle-user',    id: 'usermenu' }
    ];

    function bindDropdowns() {
        MENUS.forEach(function (m) {
            App.actions.register(m.act, function () {
                var box = document.getElementById(m.id);
                if (!box) return;
                var willOpen = !box.classList.contains('is-open');

                closeMenus();
                box.classList.toggle('is-open', willOpen);
            });
        });

        /* Dışarı tıklayınca kapan. */
        document.addEventListener('click', function (e) {
            if (e.target.closest('[data-act^="toggle-"]')) return;
            MENUS.forEach(function (m) {
                var el = document.getElementById(m.id);
                if (el && !el.contains(e.target)) el.classList.remove('is-open');
            });
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeMenus();
        });

        /* Dil seçimi. */
        App.utils.on(document, 'click', '[data-lang]', function (e, btn) {
            App.i18n.set(btn.dataset.lang);
            closeMenus();
        });

        /* Dar ekranda hamburger kategori panelini açar. */
        App.actions.register('toggle-menu', function () {
            var box = document.getElementById('catmenu');
            if (!box) return;
            box.classList.toggle('is-open');
        });
    }

    function closeMenus() {
        MENUS.forEach(function (m) {
            var el = document.getElementById(m.id);
            if (el) el.classList.remove('is-open');
        });
    }

    /* ============================================================
       ARAMA
       ============================================================ */

    function bindSearch() {
        var input = document.getElementById('search-input');
        var panel = document.getElementById('search-panel');
        var scope = document.getElementById('search-scope');
        var form  = input && input.closest('form');
        if (!input || !panel) return;

        function close() { panel.classList.remove('is-open'); }

        var run = App.utils.debounce(function () {
            var term = input.value.trim();
            if (term.length < 2) { close(); return; }

            var list = App.catalog.products;

            /* Kapsam seçiliyse önce o dalın ürünlerine in. */
            if (scope && scope.value) {
                var ids = App.catalog.descendantIds(scope.value, App.catalog.categories);
                list = list.filter(function (p) {
                    return ids.indexOf(String(p.CategoryId)) !== -1;
                });
            }

            var hits = App.catalog.search(term, list).slice(0, 7);

            if (!hits.length) {
                panel.innerHTML = '<div class="search__empty">' +
                                  App.t('shopList.search.noResults', 'Ничего не найдено') + '</div>';
                panel.classList.add('is-open');
                return;
            }

            panel.innerHTML = hits.map(function (p) {
                return '<a class="search__item" href="' + App.model.url(p) + '">' +
                           '<img src="' + App.utils.escape(App.model.image(p)) + '" alt="" loading="lazy" ' +
                                'onerror="this.src=\'' + App.config.FALLBACK_IMAGE + '\'">' +
                           '<span class="grow">' +
                               '<span class="search__item-name t-clamp-2">' + App.utils.escape(p.Name) + '</span>' +
                               (p.Sku ? '<span class="t-xs t-dim t-mono">' + App.utils.escape(p.Sku) + '</span>' : '') +
                           '</span>' +
                           /* FAZ 38 — satış birimli üründe "27 093,00 ₸ / Комплект 33 кг" (tek satır). */
                           '<span class="search__item-price">' +
                               (App.model.isPriceHidden(p)
                                   ? '—'
                                   : App.utils.escape(App.su.unitPriceText(p) || App.fmt.price(p.Price))) +
                           '</span>' +
                       '</a>';
            }).join('') +
            '<a class="search__more" href="' + searchUrl(input.value.trim(), scope) + '">' +
                App.t('shopList.search.resultsFound', 'Все результаты') + '</a>';

            panel.classList.add('is-open');
        }, 200);

        input.addEventListener('input', run);
        input.addEventListener('focus', function () { if (input.value.trim().length >= 2) run(); });

        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                var term = input.value.trim();
                if (term.length < 2) {
                    App.toast.warning(App.t('shopList.search.minChars', 'Введите минимум 2 символа'));
                    return;
                }
                window.location.href = searchUrl(term, scope);
            });
        }

        document.addEventListener('click', function (e) {
            if (!e.target.closest('.search')) close();
        });
        input.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    }

    function searchUrl(term, scope) {
        var url = 'shop.html?search=' + encodeURIComponent(term);
        if (scope && scope.value) url += '&category=' + encodeURIComponent(scope.value);
        return url;
    }

    /* ============================================================
       KURULUM
       ============================================================ */

    /* ------------------------------------------------------------
       KAPSAYICILAR
       ------------------------------------------------------------
       🔴 Başlık `outerHTML` ile DEĞİŞTİRİLMEZ. Dil değiştiğinde eski
       düğüm DOM'dan koparılıp yerine yenisi konuyordu; sticky başlık
       yeniden hesaplanırken düzen dağılıyor, arama alanı satırı
       taşırıyordu. Artık `#site-header` sabit bir kapsayıcı olarak
       kalır ve yalnız İÇİ yenilenir — dış düğüm hiç değişmediği için
       yerleşim de bozulmaz.
       ------------------------------------------------------------ */
    var headerSlot = null;
    var footerSlot = null;

    Layout.mount = function () {
        headerSlot = document.getElementById('site-header');
        footerSlot = document.getElementById('site-footer');

        if (headerSlot) headerSlot.innerHTML = headerHtml();
        if (footerSlot) footerSlot.innerHTML = footerHtml();

        bindDropdowns();
        bindAll();
    };

    /** Başlığı yeniden çiz (dil / oturum değişiminde). */
    function repaintHeader() {
        if (!headerSlot) return;
        headerSlot.innerHTML = headerHtml();
        bindAll();
        renderCategoryMenu(catTree);
    }

    /** Header/footer her yeniden çizildiğinde çalışacak bağlamalar. */
    function bindAll() {
        bindCatHover();
        bindSearch();
        Layout.refreshBadges();
        markActiveNav();
        bindStickyShadow();
    }

    /**
     * Kategori panelini FAREYLE aç, GEÇ kapat.
     *
     * Dokunmatik cihazda "üzerine gelme" yoktur; orada düğme eskisi
     * gibi tıklamayla açılıp kapanır. Farelı cihazda menü üzerine
     * gelince açılır ve fare ayrıldıktan 150 ms sonra kapanır —
     * düğmeyle panel arasındaki boşluğu geçerken kapanmasın diye.
     */
    function bindCatHover() {
        var box = document.getElementById('catmenu');
        if (!box || box.dataset.hoverBound === '1') return;
        box.dataset.hoverBound = '1';

        function open() {
            clearTimeout(closeTimer);
            closeMenus();
            box.classList.add('is-open');
        }
        function closeLater() {
            clearTimeout(closeTimer);
            closeTimer = setTimeout(function () { box.classList.remove('is-open'); }, 150);
        }

        box.addEventListener('mouseenter', function () { if (hasHover()) open(); });
        box.addEventListener('mouseleave', function () { if (hasHover()) closeLater(); });

        /* Panel gövdesine girildiğinde bekleyen kapanma iptal olur. */
        var panel = document.getElementById('catmenu-panel');
        if (panel) {
            panel.addEventListener('mouseenter', function () { clearTimeout(closeTimer); });
            panel.addEventListener('mouseleave', function () { if (hasHover()) closeLater(); });
        }

        var btn = box.querySelector('.catmenu__btn');
        if (btn) {
            btn.addEventListener('click', function (e) {
                if (!hasHover()) return;          /* dokunmatikte aç/kapa kalsın */
                e.preventDefault();
                e.stopPropagation();
                window.location.href = 'shop.html';
            }, true);
        }
    }

    function currentPage() {
        return window.location.pathname.split('/').pop() || 'index.html';
    }

    /** Bulunduğun sayfanın menü bağlantısını vurgula. */
    function markActiveNav() {
        var here = currentPage();
        App.utils.$$('.navlink').forEach(function (link) {
            var href = link.getAttribute('href').split('?')[0];
            if (href === here && !link.classList.contains('is-active')) link.classList.add('is-active');
        });
    }

    /** Kaydırınca başlığa gölge — katman hissi. */
    function bindStickyShadow() {
        var header = document.getElementById('header');
        if (!header) return;

        var onScroll = App.utils.throttle(function () {
            header.classList.toggle('is-stuck', window.scrollY > 8);
        }, 120);

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    /* Kategori verisi geldiğinde menü + arama kapsamı dolar. */
    Layout.setCategories = renderCategoryMenu;

    /* Durum değişimlerinde rozetler kendiliğinden tazelenir. */
    App.bus.on(App.bus.EVENTS.CART_CHANGED,     Layout.refreshBadges);
    App.bus.on(App.bus.EVENTS.WISHLIST_CHANGED, Layout.refreshBadges);
    App.bus.on(App.bus.EVENTS.COMPARE_CHANGED,  Layout.refreshBadges);
    App.bus.on(App.bus.EVENTS.AUTH_CHANGED, function () {
        repaintHeader();
        if (footerSlot) footerSlot.innerHTML = footerHtml();
    });

    /* Dil değişince başlık/alt bilgi yeniden çizilir. */
    App.bus.on(App.bus.EVENTS.LANG_CHANGED, function () {
        repaintHeader();
        if (footerSlot) footerSlot.innerHTML = footerHtml();
    });

    App.layout = Layout;

})(window.App);
