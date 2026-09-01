/* ============================================================
   ui/layout.js — HEADER + FOOTER BİLEŞENİ
   ------------------------------------------------------------
   Header ve footer HER SAYFAYA kopyalanmaz. HTML'de yalnız iki
   yer tutucu bulunur:

       <div id="site-header"></div>
       <div id="site-footer"></div>

   İçerik buradan basılır. Menüye bir bağlantı eklemek 11 dosyayı
   değil TEK dosyayı değiştirmek demektir — statik sitelerde en sık
   yapılan hata budur.
   ============================================================ */

(function (App) {
    'use strict';

    var Layout = {};
    var B = App.config.BRAND;

    /* ============================================================
       HEADER
       ============================================================ */

    function headerHtml() {
        var t = App.t;

        return '' +
        '<header class="header" id="header">' +

            /* --- üst şerit --- */
            '<div class="topbar">' +
                '<div class="container topbar__inner">' +
                    '<div class="topbar__note">' +
                        App.icon('truck', 13) +
                        '<span>' + t('header.announce', '') + '</span>' +
                        '<b>' + t('header.announceStrong', '') + '</b>' +
                    '</div>' +
                    '<div class="topbar__links">' +
                        '<a href="delivery.html">' + t('nav.delivery', 'Teslimat') + '</a>' +
                        '<a href="contact.html">' + t('nav.contact', 'İletişim') + '</a>' +
                        langSwitcherHtml() +
                    '</div>' +
                '</div>' +
            '</div>' +

            /* --- ana şerit --- */
            '<div class="container header__main">' +
                '<button class="hicon burger" type="button" data-act="toggle-menu" aria-label="Menü">' +
                    App.icon('menu', 20) +
                '</button>' +

                '<a class="logo" href="index.html">' +
                    '<span class="logo__mark">' + App.icon('box', 18) + '</span>' +
                    '<span class="logo__text">' + B.name + '<em>' + B.suffix + '</em></span>' +
                '</a>' +

                '<div class="search" id="site-search">' +
                    '<form class="search__field" role="search" autocomplete="off">' +
                        '<input class="search__input" type="search" id="search-input" ' +
                               'placeholder="' + t('header.searchPlaceholder', 'Ara…') + '" ' +
                               'aria-label="' + t('common.search', 'Ara') + '">' +
                        '<button class="search__btn" type="submit" aria-label="' + t('common.search', 'Ara') + '">' +
                            App.icon('search', 15) +
                        '</button>' +
                    '</form>' +
                    '<div class="search__panel" id="search-panel"></div>' +
                '</div>' +

                '<div class="header__actions">' +
                    '<button class="hicon" type="button" data-act="toggle-search" aria-label="' + t('common.search', 'Ara') + '" ' +
                            'style="display:none" id="search-toggle">' + App.icon('search', 18) + '</button>' +

                    userMenuHtml() +

                    '<a class="hicon" href="compare.html" title="' + t('header.compare', 'Karşılaştır') + '">' +
                        App.icon('compare', 18) +
                        '<span class="hicon__badge" id="compare-badge" hidden>0</span>' +
                    '</a>' +

                    '<a class="hicon" href="wishlist.html" title="' + t('header.wishlist', 'Favoriler') + '">' +
                        App.icon('heart', 18) +
                        '<span class="hicon__badge" id="wishlist-badge" hidden>0</span>' +
                    '</a>' +

                    '<button class="hicon hicon--accent" type="button" data-act="toggle-drawer" ' +
                            'title="' + t('header.cart', 'Sepet') + '">' +
                        App.icon('cart', 18) +
                        '<span class="hicon__badge" id="cart-badge" hidden>0</span>' +
                    '</button>' +
                '</div>' +
            '</div>' +

            /* --- kategori şeridi --- */
            '<nav class="navbar">' +
                '<div class="container navbar__inner">' +
                    '<div class="catmenu" id="catmenu">' +
                        '<button class="catmenu__btn" type="button" data-act="toggle-catmenu">' +
                            App.icon('menu', 14) +
                            '<span>' + t('header.allCategories', 'Tüm kategoriler') + '</span>' +
                            App.icon('chevronDown', 12) +
                        '</button>' +
                        '<div class="catmenu__panel" id="catmenu-panel">' +
                            '<div class="t-dim t-sm" style="padding:12px">' + t('common.loading', 'Yükleniyor…') + '</div>' +
                        '</div>' +
                    '</div>' +

                    '<a class="navlink" href="shop.html">' + t('nav.shop', 'Tüm ürünler') + '</a>' +
                    '<a class="navlink" href="shop.html?sort=date">' + t('nav.newArrivals', 'Yeni gelenler') + '</a>' +
                    '<a class="navlink" href="shop.html?sort=popularity">' + t('nav.bestSellers', 'Çok satanlar') + '</a>' +
                    '<a class="navlink" href="about.html">' + t('nav.about', 'Hakkımızda') + '</a>' +
                    '<a class="navlink" href="contact.html">' + t('nav.contact', 'İletişim') + '</a>' +
                '</div>' +
            '</nav>' +
        '</header>';
    }

    function langSwitcherHtml() {
        var current = App.i18n.lang;
        return '<div class="catmenu" id="langmenu" style="position:relative">' +
                   '<button class="btn btn--plain btn--sm" type="button" data-act="toggle-lang">' +
                       App.icon('globe', 13) +
                       '<span>' + String(current || '').toUpperCase() + '</span>' +
                   '</button>' +
                   '<div class="catmenu__panel" id="langmenu-panel" style="width:170px;right:0;left:auto">' +
                       App.i18n.available().map(function (l) {
                           return '<button class="catmenu__link" type="button" data-lang="' + l.code + '" ' +
                                  'style="width:100%;text-align:left">' +
                                      '<span>' + l.name + '</span>' +
                                      (l.code === current ? App.icon('check', 13) : '') +
                                  '</button>';
                       }).join('') +
                   '</div>' +
               '</div>';
    }

    function userMenuHtml() {
        var t = App.t;

        if (!App.auth.isLoggedIn()) {
            return '<a class="hicon" href="login.html" title="' + t('header.login', 'Giriş yap') + '">' +
                       App.icon('user', 18) +
                   '</a>';
        }

        var user = App.auth.user() || {};
        var name = user.firstName || user.name || user.email || '';

        return '<div class="catmenu" id="usermenu" style="position:relative">' +
                   '<button class="hicon" type="button" data-act="toggle-user" title="' + App.utils.escape(name) + '">' +
                       App.icon('user', 18) +
                   '</button>' +
                   '<div class="catmenu__panel" id="usermenu-panel" style="width:220px;right:0;left:auto">' +
                       '<div style="padding:10px 12px;border-bottom:1px solid var(--line-soft);margin-bottom:6px">' +
                           '<div class="t-sm t-hi t-bold">' + App.utils.escape(name) + '</div>' +
                           '<div class="t-xs t-dim">' + App.utils.escape(user.email || '') + '</div>' +
                       '</div>' +
                       '<a class="catmenu__link" href="account.html">' + App.icon('user', 14) + '<span class="grow">' + t('account.dashboard', 'Özet') + '</span></a>' +
                       '<a class="catmenu__link" href="account.html?tab=orders">' + App.icon('box', 14) + '<span class="grow">' + t('account.orders', 'Siparişlerim') + '</span></a>' +
                       '<a class="catmenu__link" href="account.html?tab=addresses">' + App.icon('pin', 14) + '<span class="grow">' + t('account.addresses', 'Adreslerim') + '</span></a>' +
                       '<a class="catmenu__link" href="wishlist.html">' + App.icon('heart', 14) + '<span class="grow">' + t('header.wishlist', 'Favoriler') + '</span></a>' +
                       '<button class="catmenu__link" type="button" data-act="logout" style="width:100%;text-align:left">' +
                           App.icon('logout', 14) + '<span class="grow">' + t('header.logout', 'Çıkış yap') + '</span>' +
                       '</button>' +
                   '</div>' +
               '</div>';
    }

    /* ============================================================
       FOOTER
       ============================================================ */

    function footerHtml() {
        var t = App.t;
        var year = new Date().getFullYear();

        return '' +
        '<footer class="footer">' +
            '<div class="container footer__top">' +

                '<div>' +
                    '<a class="logo" href="index.html">' +
                        '<span class="logo__mark">' + App.icon('box', 18) + '</span>' +
                        '<span class="logo__text">' + B.name + '<em>' + B.suffix + '</em></span>' +
                    '</a>' +
                    '<p class="footer__brand-text">' + t('footer.aboutText', '') + '</p>' +
                    '<div class="social">' +
                        '<a href="#" aria-label="Telegram">' + App.icon('mail', 15) + '</a>' +
                        '<a href="#" aria-label="WhatsApp">' + App.icon('phone', 15) + '</a>' +
                        '<a href="#" aria-label="Web">' + App.icon('globe', 15) + '</a>' +
                    '</div>' +
                '</div>' +

                '<div>' +
                    '<h4 class="footer__title">' + t('footer.shop', 'Mağaza') + '</h4>' +
                    '<ul class="footer__list">' +
                        '<li><a href="shop.html">' + t('nav.shop', 'Tüm ürünler') + '</a></li>' +
                        '<li><a href="shop.html?sort=date">' + t('nav.newArrivals', 'Yeni gelenler') + '</a></li>' +
                        '<li><a href="shop.html?sort=popularity">' + t('nav.bestSellers', 'Çok satanlar') + '</a></li>' +
                        '<li><a href="wishlist.html">' + t('header.wishlist', 'Favoriler') + '</a></li>' +
                        '<li><a href="compare.html">' + t('header.compare', 'Karşılaştır') + '</a></li>' +
                    '</ul>' +
                '</div>' +

                '<div>' +
                    '<h4 class="footer__title">' + t('footer.company', 'Kurumsal') + '</h4>' +
                    '<ul class="footer__list">' +
                        '<li><a href="about.html">' + t('nav.about', 'Hakkımızda') + '</a></li>' +
                        '<li><a href="contact.html">' + t('nav.contact', 'İletişim') + '</a></li>' +
                        '<li><a href="delivery.html">' + t('nav.delivery', 'Teslimat') + '</a></li>' +
                        '<li><a href="returns.html">' + t('nav.returns', 'İade') + '</a></li>' +
                    '</ul>' +
                '</div>' +

                '<div>' +
                    '<h4 class="footer__title">' + t('footer.help', 'Yardım') + '</h4>' +
                    '<ul class="footer__list">' +
                        '<li><a href="account.html">' + t('account.title', 'Hesabım') + '</a></li>' +
                        '<li><a href="account.html?tab=orders">' + t('account.orders', 'Siparişlerim') + '</a></li>' +
                        '<li><a href="cart.html">' + t('header.cart', 'Sepet') + '</a></li>' +
                        '<li><a href="login.html">' + t('header.login', 'Giriş yap') + '</a></li>' +
                    '</ul>' +
                '</div>' +

                '<div>' +
                    '<h4 class="footer__title">' + t('footer.contact', 'İletişim') + '</h4>' +
                    '<div class="footer__contact-row">' + App.icon('phone', 14) +
                        '<a href="tel:' + B.phone.replace(/\s/g, '') + '">' + B.phone + '</a></div>' +
                    '<div class="footer__contact-row">' + App.icon('mail', 14) +
                        '<a href="mailto:' + B.email + '">' + B.email + '</a></div>' +
                    '<div class="footer__contact-row">' + App.icon('pin', 14) +
                        '<span class="t-mut">' + B.address + '</span></div>' +

                    '<h4 class="footer__title" style="margin-top:24px">' + t('footer.newsletter', 'Bülten') + '</h4>' +
                    '<form class="flex gap-2" id="newsletter-form">' +
                        '<input class="input" type="email" required ' +
                               'placeholder="' + t('footer.emailPlaceholder', 'E-posta') + '" style="height:40px">' +
                        '<button class="btn btn--steel" type="submit" style="--btn-h:40px">' +
                            App.icon('arrowRight', 15) + '</button>' +
                    '</form>' +
                '</div>' +
            '</div>' +

            '<div class="container footer__bottom">' +
                '<span>© ' + year + ' ' + B.name + B.suffix + '. ' + t('footer.rights', '') + '</span>' +
                '<div class="footer__pay">' +
                    '<span>VISA</span><span>MASTERCARD</span><span>KASPI</span><span>IBAN</span>' +
                '</div>' +
            '</div>' +
        '</footer>';
    }

    /* ============================================================
       KATEGORİ MENÜSÜ (veriye bağlı, sonradan doldurulur)
       ============================================================ */

    function renderCategoryMenu(categories) {
        var panel = document.getElementById('catmenu-panel');
        if (!panel) return;

        if (!categories || !categories.length) {
            panel.innerHTML = '<div class="t-dim t-sm" style="padding:12px">' +
                              App.t('shop.noResults', 'Kategori bulunamadı') + '</div>';
            return;
        }

        /* İki seviye gösterilir: daha derini menüde okunmaz hale gelir,
           kullanıcı zaten mağaza sayfasındaki ağaçtan inebilir. */
        panel.innerHTML = categories.map(function (cat) {
            var subs = (cat.SubCategories || []).slice(0, 8);

            return '<div class="catmenu__group">' +
                       '<a class="catmenu__link" href="shop.html?category=' + cat.Id + '">' +
                           '<span>' + App.utils.escape(cat.Name) + '</span>' +
                           App.icon('chevronRight', 11) +
                       '</a>' +
                       (subs.length
                           ? '<div class="catmenu__sub">' + subs.map(function (sub) {
                                 return '<a class="catmenu__link" href="shop.html?category=' + sub.Id + '">' +
                                            '<span>' + App.utils.escape(sub.Name) + '</span>' +
                                        '</a>';
                             }).join('') + '</div>'
                           : '') +
                   '</div>';
        }).join('');
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
        setBadge('cart-badge', App.cart.count());
        setBadge('wishlist-badge', App.wishlist.count());
        setBadge('compare-badge', App.compare.count());
    };

    /* ============================================================
       AÇILIR MENÜLER
       ============================================================ */

    function bindDropdowns() {
        var menus = [
            { act: 'toggle-catmenu', id: 'catmenu' },
            { act: 'toggle-lang',    id: 'langmenu' },
            { act: 'toggle-user',    id: 'usermenu' }
        ];

        menus.forEach(function (m) {
            App.actions.register(m.act, function () {
                var box = document.getElementById(m.id);
                if (!box) return;
                var willOpen = !box.classList.contains('is-open');

                /* Aynı anda tek menü açık kalsın. */
                menus.forEach(function (other) {
                    var el = document.getElementById(other.id);
                    if (el) el.classList.remove('is-open');
                });
                box.classList.toggle('is-open', willOpen);
            });
        });

        /* Dışarı tıklayınca kapat. */
        document.addEventListener('click', function (e) {
            if (e.target.closest('[data-act^="toggle-"]')) return;
            menus.forEach(function (m) {
                var el = document.getElementById(m.id);
                if (el && !el.contains(e.target)) el.classList.remove('is-open');
            });
        });

        /* Dil seçimi. */
        App.utils.on(document, 'click', '[data-lang]', function (e, btn) {
            App.i18n.set(btn.dataset.lang);
        });

        /* Mobil menü — kategori panelini tam ekran açar. */
        App.actions.register('toggle-menu', function () {
            var box = document.getElementById('catmenu');
            if (box) box.classList.toggle('is-open');
        });
    }

    /* ============================================================
       ARAMA ÖNERİLERİ
       ============================================================ */

    function bindSearch() {
        var input = document.getElementById('search-input');
        var panel = document.getElementById('search-panel');
        var form  = input && input.closest('form');
        if (!input || !panel) return;

        function close() { panel.classList.remove('is-open'); }

        var run = App.utils.debounce(function () {
            var term = input.value.trim();

            if (term.length < 2) { close(); return; }

            var hits = App.catalog.search(term).slice(0, 6);

            if (!hits.length) {
                panel.innerHTML = '<div class="search__empty">' +
                                  App.t('header.searchEmpty', 'Sonuç bulunamadı') + '</div>';
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
                           '<span class="search__item-price">' +
                               (App.model.isPriceHidden(p) ? '—' : App.fmt.price(p.Price)) +
                           '</span>' +
                       '</a>';
            }).join('') +
            '<a class="search__more" href="shop.html?search=' + encodeURIComponent(term) + '">' +
                App.t('header.searchMore', 'Tüm sonuçları gör') + '</a>';

            panel.classList.add('is-open');
        }, 220);

        input.addEventListener('input', run);
        input.addEventListener('focus', function () { if (input.value.trim().length >= 2) run(); });

        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                var term = input.value.trim();
                if (term.length < 2) {
                    App.toast.warning(App.t('shop.minChars', 'En az 2 karakter girin'));
                    return;
                }
                window.location.href = 'shop.html?search=' + encodeURIComponent(term);
            });
        }

        document.addEventListener('click', function (e) {
            if (!e.target.closest('.search')) close();
        });
        input.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    }

    /* ============================================================
       KURULUM
       ============================================================ */

    Layout.mount = function () {
        var headerSlot = document.getElementById('site-header');
        var footerSlot = document.getElementById('site-footer');

        if (headerSlot) headerSlot.outerHTML = headerHtml();
        if (footerSlot) footerSlot.outerHTML = footerHtml();

        bindDropdowns();
        bindSearch();
        Layout.refreshBadges();
        markActiveNav();
        bindStickyShadow();
        bindNewsletter();
    };

    /** Bulunduğun sayfanın menü bağlantısını vurgula. */
    function markActiveNav() {
        var here = window.location.pathname.split('/').pop() || 'index.html';
        App.utils.$$('.navlink').forEach(function (link) {
            var href = link.getAttribute('href').split('?')[0];
            if (href === here) link.classList.add('is-active');
        });
    }

    /** Sayfa kaydırılınca header'a gölge — katman hissi. */
    function bindStickyShadow() {
        var header = document.getElementById('header');
        if (!header) return;

        var onScroll = App.utils.throttle(function () {
            header.classList.toggle('is-stuck', window.scrollY > 8);
        }, 120);

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    function bindNewsletter() {
        var form = document.getElementById('newsletter-form');
        if (!form) return;
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            App.toast.success(App.t('footer.subscribed', 'Kaydınız alındı'));
            form.reset();
        });
    }

    /* Kategori verisi geldiğinde menü dolar. */
    Layout.setCategories = renderCategoryMenu;

    /* Durum değişimlerinde rozetler kendiliğinden tazelenir. */
    App.bus.on(App.bus.EVENTS.CART_CHANGED,     Layout.refreshBadges);
    App.bus.on(App.bus.EVENTS.WISHLIST_CHANGED, Layout.refreshBadges);
    App.bus.on(App.bus.EVENTS.COMPARE_CHANGED,  Layout.refreshBadges);

    /* Dil değişince header/footer yeniden çizilir (metinler onların içinde). */
    App.bus.on(App.bus.EVENTS.LANG_CHANGED, function () {
        var header = document.querySelector('.header');
        var footer = document.querySelector('.footer');
        if (header) header.outerHTML = headerHtml();
        if (footer) footer.outerHTML = footerHtml();

        bindSearch();
        Layout.refreshBadges();
        markActiveNav();
        bindStickyShadow();
        bindNewsletter();
        renderCategoryMenu(App.catalog.categories);
    });

    App.layout = Layout;

})(window.App);
