/* ============================================================
   pages/account.js — HESABIM
   ------------------------------------------------------------
   Sekmeler: panel · siparişler · adresler · hesap bilgileri ·
   yorumlar · (yalnız kredili müşteride) kredi limiti.

   Sekme adresle taşınır (`?tab=orders`) — kullanıcı bağlantıyı
   paylaşabilsin ve tarayıcı geri tuşu çalışsın diye.

   🔴 Kredi limiti sekmesi HERKESTE ÇİZİLMEZ: yalnız sunucu
   `CanBypassPayment` ya da `CanOrderWithoutStock` verdiyse eklenir.
   ============================================================ */

App.definePage('account', async function (ctx) {

    var root = document.getElementById('account-root');

    if (!App.auth.isLoggedIn()) { renderGuest(); return; }

    root.innerHTML = loading();

    await ctx.catalog;
    await ctx.user;

    var user     = App.auth.user() || {};
    var settings = null;
    var addresses = { shipping: null, billing: null };

    /* Yetkiler: hata durumunda kredi bölümü hiç çizilmez. */
    try {
        var res = await App.api.user.getSettings(App.auth.userId());
        if (res.success && res.data) settings = res.data;
    } catch (e) { settings = null; }

    var hasCredit = !!settings && (settings.CanBypassPayment === true || settings.CanOrderWithoutStock === true);

    var TABS = [
        { id: 'dashboard', icon: 'home',     key: 'account.tabs.dashboard' },
        { id: 'orders',    icon: 'box',      key: 'account.tabs.orders' },
        { id: 'addresses', icon: 'pin',      key: 'account.tabs.addresses' },
        { id: 'details',   icon: 'settings', key: 'account.tabs.accountDetails' },
        { id: 'reviews',   icon: 'star',     key: 'account.tabs.reviews' }
    ];
    if (hasCredit) TABS.splice(2, 0, { id: 'credit', icon: 'wallet', key: 'account.creditLimit.title' });

    var active = App.utils.param('tab') || 'dashboard';
    if (!TABS.some(function (tab) { return tab.id === active; })) active = 'dashboard';

    renderShell();
    openTab(active);

    App.bus.on(App.bus.EVENTS.LANG_CHANGED, function () {
        App.i18n.apply();
        renderShell();
        openTab(active);
    });

    window.addEventListener('popstate', function () {
        active = App.utils.param('tab') || 'dashboard';
        openTab(active);
    });

    /* ============================================================
       İSKELET
       ============================================================ */

    function renderShell() {
        var name = [user.firstName || user.name, user.lastName || user.surname]
            .filter(Boolean).join(' ') || user.email || '';

        root.innerHTML =
            '<div class="acct-layout">' +

                '<aside class="acct-nav">' +
                    '<div class="acct-nav__user">' +
                        '<span class="avatar">' + App.utils.escape(App.utils.initials(name)) + '</span>' +
                        '<div class="grow" style="min-width:0">' +
                            '<div class="t-sm t-bold t-hi t-clamp-1">' + App.utils.escape(name) + '</div>' +
                            '<div class="t-xs t-dim t-clamp-1">' + App.utils.escape(user.email || '') + '</div>' +
                        '</div>' +
                    '</div>' +

                    TABS.map(function (tab) {
                        return '<a class="acct-nav__link" href="my-account.html?tab=' + tab.id + '" ' +
                                  'data-act="acct-tab" data-tab="' + tab.id + '">' +
                                   App.icon(tab.icon, 16) +
                                   '<span class="grow">' + App.t(tab.key, tab.id) + '</span>' +
                               '</a>';
                    }).join('') +

                    '<a class="acct-nav__link" href="wishlist.html">' + App.icon('heart', 16) +
                        '<span class="grow">' + App.t('account.tabs.wishlist', 'Избранное') + '</span></a>' +
                    '<a class="acct-nav__link" href="compare.html">' + App.icon('compare', 16) +
                        '<span class="grow">' + App.t('account.tabs.compare', 'Сравнить') + '</span></a>' +

                    '<button class="acct-nav__link" type="button" data-act="logout">' +
                        App.icon('logout', 16) +
                        '<span class="grow">' + App.t('account.tabs.logout', 'Выйти') + '</span>' +
                    '</button>' +
                '</aside>' +

                '<section id="acct-panel"></section>' +
            '</div>';
    }

    App.actions.register('acct-tab', function (btn) {
        active = btn.dataset.tab;
        App.utils.setParams({ tab: active });
        openTab(active);
    });

    function openTab(id) {
        App.utils.$$('[data-act="acct-tab"]').forEach(function (link) {
            link.classList.toggle('is-active', link.dataset.tab === id);
        });

        var panel = document.getElementById('acct-panel');
        if (!panel) return;

        if (id === 'orders')    return renderOrders(panel);
        if (id === 'addresses') return renderAddresses(panel);
        if (id === 'details')   return renderDetails(panel);
        if (id === 'reviews')   return renderReviews(panel);
        if (id === 'credit')    return renderCredit(panel);
        return renderDashboard(panel);
    }

    /* ============================================================
       PANEL
       ============================================================ */

    async function renderDashboard(panel) {
        var t = App.t;
        var name = user.firstName || user.name || user.email || '';

        panel.innerHTML =
            '<div class="card mb-4"><div class="card__body">' +
                '<h2 style="margin-bottom:6px">' + t('account.dashboard.hello', 'Здравствуйте') + ', ' +
                    App.utils.escape(name) + '</h2>' +
                '<p class="t-mut t-sm mb-0">' +
                    t('account.dashboard.intro', '') + ' ' +
                    '<a href="my-account.html?tab=orders" data-act="acct-tab" data-tab="orders">' +
                        t('account.dashboard.recentOrders', '') + '</a>, ' +
                    t('account.dashboard.manage', '') + ' ' +
                    '<a href="my-account.html?tab=addresses" data-act="acct-tab" data-tab="addresses">' +
                        t('account.dashboard.shippingBilling', '') + '</a> ' +
                    t('account.dashboard.and', '') + ' ' +
                    '<a href="my-account.html?tab=details" data-act="acct-tab" data-tab="details">' +
                        t('account.dashboard.editPassword', '') + '</a>.' +
                '</p>' +
            '</div></div>' +

            '<div class="stat-grid mb-4" id="acct-stats">' +
                statBox('—', t('account.dashboard.boxes.orders', 'Заказы')) +
                statBox(String(App.wishlist.count()), t('account.tabs.wishlist', 'Избранное')) +
                statBox(String(App.compare.count()), t('account.tabs.compare', 'Сравнить')) +
                statBox(String(App.cart.count()), t('header.cart', 'Корзина')) +
            '</div>' +

            '<div class="card">' +
                '<div class="card__head">' +
                    '<h3 class="card__title">' + t('account.dashboard.recentOrders', 'Последние заказы') + '</h3>' +
                    '<a class="btn btn--ghost btn--sm" href="my-account.html?tab=orders" ' +
                       'data-act="acct-tab" data-tab="orders">' + t('account.orders.view', 'Все') + '</a>' +
                '</div>' +
                '<div class="card__body" id="recent-orders">' +
                    '<div class="flex justify-c" style="padding:20px"><span class="spinner"></span></div>' +
                '</div>' +
            '</div>';

        /* Sipariş sayısı ve son siparişler tek çağrıyla gelir. */
        var groups = await App.order.listGroups();

        var stats = document.getElementById('acct-stats');
        if (stats) stats.firstElementChild.querySelector('.stat-box__value').textContent = String(groups.length);

        var box = document.getElementById('recent-orders');
        if (!box) return;

        if (!groups.length) {
            box.innerHTML = '<p class="t-mut t-sm mb-0">' +
                t('account.orders.noOrders', 'Заказы не найдены') + '</p>';
            return;
        }

        box.innerHTML = groups.slice(0, 5).map(function (g) {
            var f = App.order.field;
            var status = String(f(g, 'paymentStatus') || 'pending').toLowerCase();

            return '<div class="ogroup__row" style="border-bottom:1px solid var(--line-soft);padding:10px 0">' +
                       '<div class="grow">' +
                           '<b>' + App.utils.escape(String(f(g, 'groupNumber') || f(g, 'groupId'))) + '</b>' +
                           '<div class="t-xs t-dim">' + App.fmt.date(f(g, 'createdAt')) + '</div>' +
                       '</div>' +
                       '<span class="badge badge--' + App.order.paymentTone(status) + '">' +
                           App.utils.escape(App.order.paymentLabel(status)) + '</span>' +
                       '<b>' + App.fmt.price(f(g, 'totalAmount')) + '</b>' +
                       '<a class="btn btn--ghost btn--sm" href="order.html?groupId=' +
                           encodeURIComponent(f(g, 'groupId')) + '">' +
                           t('account.orders.view', 'Просмотр') + '</a>' +
                   '</div>';
        }).join('');
    }

    function statBox(value, label) {
        return '<div class="stat-box">' +
                   '<div class="stat-box__value">' + App.utils.escape(value) + '</div>' +
                   '<div class="stat-box__label">' + App.utils.escape(label) + '</div>' +
               '</div>';
    }

    /* ---------- siparişler ---------- */
    function renderOrders(panel) {
        panel.innerHTML =
            '<div class="card">' +
                '<div class="card__head"><h2 class="card__title">' +
                    App.t('account.orders.title', 'Заказы') + '</h2></div>' +
                '<div class="card__body" id="orders-host"></div>' +
            '</div>';

        App.accountOrders.mount(document.getElementById('orders-host'));
    }

    /* ---------- adresler ---------- */
    async function renderAddresses(panel) {
        var t = App.t;

        panel.innerHTML =
            '<div class="card">' +
                '<div class="card__head"><h2 class="card__title">' +
                    t('account.addresses.title', 'Адреса') + '</h2></div>' +
                '<div class="card__body">' +
                    '<p class="t-mut t-sm">' + t('account.addresses.description', '') + '</p>' +
                    '<div id="addr-section"></div>' +
                '</div>' +
            '</div>';

        addresses = await App.address.pair();
        App.addressUi.render(document.getElementById('addr-section'), addresses, async function () {
            addresses = await App.address.pair();
            renderAddresses(panel);
        });
    }

    /* ---------- hesap bilgileri ---------- */
    function renderDetails(panel) {
        var t = App.t;
        var isCompany = App.auth.isCompany();

        panel.innerHTML =
            '<div class="card mb-4">' +
                '<div class="card__head"><h2 class="card__title">' +
                    t('account.details.title', 'Детали аккаунта') + '</h2></div>' +
                '<div class="card__body">' +
                    '<div class="form-grid">' +
                        field('d-first', 'account.details.form.firstName', user.firstName || user.name || '') +
                        field('d-last',  'account.details.form.lastName',  user.lastName || user.surname || '') +
                        field('d-email', 'account.details.form.email',     user.email || '', 'email') +
                        field('d-phone', 'checkout.phone',                 user.phone || user.phoneNumber || '') +
                        (isCompany
                            ? field('d-company', 'account.details.form.companyName',
                                    App.store.get(App.keys.COMPANY_NAME, '') || '') +
                              field('d-iin', 'account.details.form.iin',
                                    App.store.get(App.keys.IIN, '') || '')
                            : '') +
                    '</div>' +
                    (isCompany
                        ? '<div class="alert alert--info">' + App.icon('info', 15) +
                              '<span>' + t('address.companyLocked', '') + '</span></div>'
                        : '') +
                '</div>' +
            '</div>' +

            '<div class="card">' +
                '<div class="card__head"><h2 class="card__title">' +
                    t('account.details.passwordChange', 'Смена пароля') + '</h2></div>' +
                '<div class="card__body">' +
                    '<div class="form-grid">' +
                        pwField('pw-current', 'account.details.form.currentPassword') +
                        '<div></div>' +
                        pwField('pw-new', 'account.details.form.newPassword') +
                        pwField('pw-confirm', 'account.details.form.confirmPassword') +
                    '</div>' +
                    '<div class="alert alert--danger mb-3" id="pw-error" hidden></div>' +
                    '<button class="btn btn--primary" type="button" data-act="change-password">' +
                        t('account.details.form.saveChanges', 'Сохранить изменения') + '</button>' +
                '</div>' +
            '</div>';

        function field(id, key, value, type) {
            return '<div class="field">' +
                       '<label class="label" for="' + id + '">' + t(key, id) + '</label>' +
                       '<input class="input" id="' + id + '" type="' + (type || 'text') + '" ' +
                              'value="' + App.utils.escape(value) + '" readonly>' +
                   '</div>';
        }
        function pwField(id, key) {
            return '<div class="field field--pw">' +
                       '<label class="label" for="' + id + '">' + t(key, id) + '</label>' +
                       '<input class="input" id="' + id + '" type="password">' +
                       '<button type="button" data-act="toggle-password">' + App.icon('eye', 16) + '</button>' +
                   '</div>';
        }
    }

    App.actions.register('change-password', async function (btn) {
        var t = App.t;
        var box = document.getElementById('pw-error');

        var current = (document.getElementById('pw-current') || {}).value || '';
        var next    = (document.getElementById('pw-new') || {}).value || '';
        var confirm = (document.getElementById('pw-confirm') || {}).value || '';

        function fail(message) {
            if (!box) return;
            box.hidden = false;
            box.textContent = message;
        }

        if (!current || !next) return fail(t('login.allFieldsRequired', ''));
        if (next.length < 6)   return fail(t('login.passwordMinLength', ''));
        if (next !== confirm)  return fail(t('login.forgotMismatch', ''));

        if (box) box.hidden = true;
        btn.classList.add('is-loading');

        try {
            var res = await App.auth.changePassword({
                UserId: App.auth.userId(),
                CurrentPassword: current,
                NewPassword: next
            });

            if (res.success) {
                App.toast.success(t('login.forgotDoneTitle', 'Пароль обновлён'));
                ['pw-current', 'pw-new', 'pw-confirm'].forEach(function (id) {
                    var el = document.getElementById(id);
                    if (el) el.value = '';
                });
            } else {
                fail(res.message || t('login.forgotError', ''));
            }
        } catch (err) {
            fail(err.message);
        }

        btn.classList.remove('is-loading');
    });

    /* ---------- yorumlar ----------
       Kaynak projedeki davranış: DEĞERLENDİRİLEBİLİR ürünler, teslim
       edilmiş siparişlerden çıkarılır. Sunucu da "satın almadığın ürüne
       yorum yazamazsın" diyor; listeyi buna göre kurmak kullanıcıyı
       reddedilecek bir forma sokmamak demektir.
       ------------------------------------------------------------ */
    async function renderReviews(panel) {
        var t = App.t;

        panel.innerHTML =
            '<div class="card">' +
                '<div class="card__head"><h2 class="card__title">' +
                    t('reviews.title', 'Отзывы') + '</h2></div>' +
                '<div class="card__body" id="reviews-host">' +
                    '<p class="t-mut t-sm">' + t('reviews.description', '') + '</p>' +
                    '<div class="flex justify-c" style="padding:20px"><span class="spinner"></span></div>' +
                '</div>' +
            '</div>';

        var host = document.getElementById('reviews-host');
        if (!host) return;

        /* İkisi bağımsız; paralel gider. */
        var pair = await Promise.all([App.review.byUser(), App.order.listOrders()]);
        var mine = pair[0] || [];
        var orders = pair[1] || [];

        /* Yorum haritası: ürün → var olan yorum. */
        var byProduct = {};
        mine.forEach(function (r) {
            byProduct[String(r.ProductId || r.productId)] = r;
        });

        /* Teslim edilmiş siparişlerdeki benzersiz ürünler. */
        var f = App.order.field;
        var products = {};

        var delivered = orders.filter(function (order) {
            return String(f(order, 'status') || '').toLowerCase() === 'delivered';
        });

        /* Liste ucu kalemleri taşımıyorsa detay çekilir. En yeni 10
           siparişle sınırlı: 60 siparişi tek tek çekmek sayfayı kilitler,
           daha eskisini değerlendirmek de pratikte istenmiyor. */
        var needsDetail = delivered.filter(function (o) { return !(f(o, 'items') || []).length; });

        if (needsDetail.length) {
            var fetched = await Promise.all(needsDetail.slice(0, 10).map(function (o) {
                return App.order.getById(f(o, 'orderId')).catch(function () { return null; });
            }));

            fetched.forEach(function (data, i) {
                if (!data) return;
                var detail = f(data, 'order') || data;
                needsDetail[i].Items = f(data, 'items') || f(detail, 'items') || [];
            });
        }

        delivered.forEach(function (order) {
            (f(order, 'items') || []).forEach(function (item) {
                var id = String(f(item, 'productId') || '');
                if (!id || products[id]) return;

                products[id] = {
                    productId: id,
                    orderId:   f(order, 'orderId'),
                    name:      f(item, 'productName') || '',
                    image:     f(item, 'productImage') || f(item, 'mainImage') || App.config.FALLBACK_IMAGE,
                    orderNo:   f(order, 'orderNumber') || ''
                };
            });
        });

        var list = Object.keys(products).map(function (id) { return products[id]; });

        if (!list.length && !mine.length) {
            host.innerHTML =
                '<div class="empty">' +
                    '<div class="empty__icon">' + App.icon('star', 22) + '</div>' +
                    '<p class="empty__text">' + t('reviews.noDeliveredToReview', '') + '</p>' +
                    '<a class="btn btn--primary" href="shop.html">' +
                        t('reviews.startShopping', 'Начать покупки') + '</a>' +
                '</div>';
            return;
        }

        host.innerHTML =
            '<p class="t-mut t-sm">' + t('reviews.description', '') + '</p>' +
            (list.length
                ? list.map(function (p) { return reviewCard(p, byProduct[p.productId]); }).join('')
                : '') +

            /* Teslim edilmiş siparişte olmayan ama yorumlanmış ürünler
               (ör. sipariş listesi kısaldı) yine de görünsün. */
            mine.filter(function (r) {
                return !products[String(r.ProductId || r.productId)];
            }).map(function (r) {
                return reviewCard({
                    productId: r.ProductId || r.productId,
                    name: r.ProductName || r.productName || '',
                    image: App.config.FALLBACK_IMAGE,
                    orderNo: ''
                }, r);
            }).join('');

        bindStars(host);
    }

    /** Tek ürünün değerlendirme kartı (yeni ya da düzenleme). */
    function reviewCard(product, existing) {
        var t = App.t;
        var rating = existing ? (parseInt(existing.Rating || existing.rating, 10) || 0) : 0;
        var body   = existing ? (existing.Body || existing.body || existing.Comment || '') : '';
        var id     = App.utils.escape(String(product.productId));

        return '<div class="review" data-review-card="' + id + '">' +
                   '<img class="cart-item__img" src="' + App.utils.escape(product.image) + '" alt="" ' +
                        'loading="lazy" onerror="this.src=\'' + App.config.FALLBACK_IMAGE + '\'">' +

                   '<div class="grow">' +
                       '<div class="flex justify-b wrap gap-2">' +
                           '<a class="review__name" href="product.html?id=' + id + '">' +
                               App.utils.escape(product.name) + '</a>' +
                           (product.orderNo
                               ? '<span class="review__date">' + t('reviews.orderPrefix', 'Заказ #') +
                                     App.utils.escape(String(product.orderNo)) + '</span>'
                               : '') +
                       '</div>' +

                       (existing
                           ? '<div class="t-xs t-ok mb-1">' + App.icon('check', 12) + ' ' +
                                 t('reviews.reviewed', 'Отзыв оставлен') + '</div>'
                           : '') +

                       '<div class="t-sm t-mut">' + t('reviews.yourRating', 'Ваш рейтинг:') + '</div>' +
                       '<div class="star-pick" data-stars="' + id + '">' +
                           [1, 2, 3, 4, 5].map(function (n) {
                               return '<button type="button" class="' + (n <= rating ? 'is-on' : '') + '" ' +
                                      'data-value="' + n + '" aria-label="' + n + '">★</button>';
                           }).join('') +
                       '</div>' +

                       '<textarea class="textarea mt-2" data-comment="' + id + '" rows="3" ' +
                                 'placeholder="' + App.utils.escape(existing
                                     ? t('reviews.editPlaceholder', '')
                                     : t('reviews.placeholder', '')) + '">' +
                           App.utils.escape(body) +
                       '</textarea>' +

                       '<button class="btn btn--primary btn--sm mt-2" type="button" data-act="review-submit" ' +
                               'data-id="' + id + '" ' +
                               'data-order="' + App.utils.escape(String(product.orderId || '')) + '" ' +
                               'data-review="' + App.utils.escape(String(
                                   existing ? (existing.ReviewId || existing.reviewId || '') : '')) + '">' +
                           (existing ? t('reviews.saveChanges', 'Сохранить изменения')
                                     : t('reviews.submitReview', 'Отправить отзыв')) +
                       '</button>' +
                   '</div>' +
               '</div>';
    }

    /** Yıldızlara tıklama — seçilen puana kadar doldurur. */
    function bindStars(host) {
        App.utils.on(host, 'click', '.star-pick button', function (e, btn) {
            var value = parseInt(btn.dataset.value, 10) || 0;
            var wrap = btn.closest('.star-pick');

            App.utils.$$('button', wrap).forEach(function (star) {
                star.classList.toggle('is-on', (parseInt(star.dataset.value, 10) || 0) <= value);
            });
            wrap.dataset.value = value;
        });
    }

    App.actions.register('review-submit', async function (btn) {
        var t = App.t;
        var id = btn.dataset.id;

        var wrap = document.querySelector('[data-stars="' + CSS.escape(id) + '"]');
        var rating = parseInt(wrap && wrap.dataset.value, 10) ||
                     App.utils.$$('.is-on', wrap || document).length;

        if (!rating) return App.toast.warning(t('reviews.selectRating', 'Выберите рейтинг'));

        var area = document.querySelector('[data-comment="' + CSS.escape(id) + '"]');
        var comment = area ? area.value.trim() : '';

        btn.classList.add('is-loading');

        var ok = btn.dataset.review
            ? await App.review.update(btn.dataset.review, { rating: rating, comment: comment })
            : await App.review.submit({
                  productId: id,
                  orderId:   btn.dataset.order || null,
                  rating:    rating,
                  comment:   comment
              });

        btn.classList.remove('is-loading');
        if (ok) openTab('reviews');
    });

    /* ---------- kredi limiti ---------- */
    function renderCredit(panel) {
        var t = App.t;

        var limit     = parseFloat(settings && settings.CreditLimit) || 0;
        var used      = parseFloat(settings && settings.UsedCredit) || 0;
        var available = limit - used;
        var pct       = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;

        panel.innerHTML =
            '<div class="card">' +
                '<div class="card__head"><h2 class="card__title">' +
                    t('account.creditLimit.title', 'Кредитный лимит') + '</h2></div>' +
                '<div class="card__body">' +
                    '<div class="stat-grid mb-4">' +
                        statBox(App.fmt.price(limit),     t('account.creditLimit.total', 'Всего')) +
                        statBox(App.fmt.price(used),      t('account.creditLimit.used', 'Использовано')) +
                        statBox(App.fmt.price(available), t('account.creditLimit.available', 'Доступно')) +
                    '</div>' +
                    '<div class="credit-bar"><span class="credit-bar__fill" style="width:' +
                        (100 - pct) + '%"></span></div>' +
                    '<div class="t-xs t-dim">' + App.fmt.number(100 - pct, 0) + '% ' +
                        t('account.creditLimit.available', 'доступно') + '</div>' +

                    (settings && settings.PriceCategory
                        ? '<div class="mt-4"><span class="badge badge--acc">' +
                              t('account.details.form.iin', '') + ' · ' +
                              App.utils.escape(String(settings.PriceCategory)) + '</span></div>'
                        : '') +
                '</div>' +
            '</div>';
    }

    /* ============================================================
       YARDIMCILAR
       ============================================================ */

    function renderGuest() {
        root.innerHTML =
            '<div class="card"><div class="empty">' +
                '<div class="empty__icon">' + App.icon('lock', 26) + '</div>' +
                '<h2 class="empty__title">' + App.t('account.loginPrompt.title', 'Войдите в аккаунт') + '</h2>' +
                '<p class="empty__text">' + App.t('account.loginPrompt.description', '') + '</p>' +
                '<a class="btn btn--primary" href="login.html?redirect=my-account.html">' +
                    App.t('account.loginPrompt.button', 'Войти') + '</a>' +
            '</div></div>';
    }

    function loading() {
        return '<div class="flex justify-c" style="padding:60px"><span class="spinner spinner--lg"></span></div>';
    }
});
