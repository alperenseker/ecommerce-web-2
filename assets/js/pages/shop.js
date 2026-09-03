/* ============================================================
   pages/shop.js — MAĞAZA SAYFASI
   ------------------------------------------------------------
   Süzgeç mantığı pages/shop-filters.js içinde. Burada yalnız:
   ekranı çizmek, sayfalamak, olayları bağlamak.

   Sayfalama SUNUCUDA değil İSTEMCİDE yapılır: katalog zaten tek
   istekte çekilip önbelleğe alındı, sayfa değiştirmek için ağa
   gitmek gereksiz gecikme olurdu.
   ============================================================ */

App.definePage('shop', async function (ctx) {

    var F = App.shopFilters;

    var elProducts = document.getElementById('products');
    var elPager    = document.getElementById('pagination');
    var elCount    = document.getElementById('result-count');
    var elChips    = document.getElementById('active-chips');
    var elTree     = document.getElementById('category-tree');
    var elPresets  = document.getElementById('price-presets');

    var results = [];

    /* --- açılış --- */
    F.readUrl();
    App.card.skeletons(elProducts, 12);
    syncControls();

    var data = await ctx.catalog;

    F.renderTree(elTree, data.categories);
    F.renderPricePresets(elPresets, data.products);
    refresh();

    ctx.user.then(function () { App.card.refreshStates(); });

    bindEvents();

    /* Katalog arkadan tazelenince liste de tazelensin. */
    App.bus.on(App.bus.EVENTS.CATALOG_SYNCED, function (fresh) {
        F.renderTree(elTree, fresh.categories);
        refresh();
    });

    App.bus.on(App.bus.EVENTS.LANG_CHANGED, function () {
        App.i18n.apply();
        F.renderTree(elTree, App.catalog.categories);
        F.renderPricePresets(elPresets, App.catalog.products);
        refresh();
    });

    /* ============================================================
       ÇİZİM
       ============================================================ */

    function refresh() {
        results = F.apply();

        var totalPages = Math.max(1, Math.ceil(results.length / F.state.pageSize));
        if (F.state.page > totalPages) F.state.page = totalPages;

        renderList();
        renderCount();
        renderPager(totalPages);
        F.renderChips(elChips);
        updateCrumb();
        applyView();
    }

    function renderList() {
        var start = (F.state.page - 1) * F.state.pageSize;
        var slice = results.slice(start, start + F.state.pageSize);

        if (!slice.length) {
            elProducts.innerHTML =
                '<div class="empty" style="grid-column:1/-1">' +
                    '<div class="empty__icon">' + App.icon('search', 26) + '</div>' +
                    '<h3 class="empty__title">' + App.t('shopList.app.noProducts', 'Товары не найдены') + '</h3>' +
                    '<p class="empty__text">' + App.t('shopList.app.noResults', '') + '</p>' +
                    '<button class="btn btn--steel" type="button" data-act="clear-filters">' +
                        App.t('shop.sidebar.cleanAll', 'Очистить все') + '</button>' +
                '</div>';
            return;
        }

        App.card.render(elProducts, slice);
        App.card.refreshStates(elProducts);
    }

    function renderCount() {
        var start = results.length ? (F.state.page - 1) * F.state.pageSize + 1 : 0;
        var end   = Math.min(F.state.page * F.state.pageSize, results.length);

        elCount.innerHTML = App.t('shop.pagination.showing', 'Показано') + ' <b>' + start + '–' + end + '</b> ' +
                            App.t('shop.pagination.of', 'из') + ' <b>' + results.length + '</b> ' +
                            App.t('shop.pagination.products', 'Товаров');
    }

    /**
     * Sayfa düğmeleri. Çok sayfalı katalogda 1..N basmak ekranı
     * doldurur; baş, son, geçerli sayfanın çevresi ve aradaki "…"
     * gösterilir.
     */
    function renderPager(totalPages) {
        if (totalPages <= 1) { elPager.innerHTML = ''; return; }

        var page = F.state.page;
        var out = [];

        out.push(btn(page - 1, App.icon('chevronLeft', 12), page === 1, 'prev'));

        var pages = [];
        if (totalPages <= 7) {
            for (var i = 1; i <= totalPages; i++) pages.push(i);
        } else if (page <= 4) {
            pages = [1, 2, 3, 4, 5, '…', totalPages];
        } else if (page >= totalPages - 3) {
            pages = [1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        } else {
            pages = [1, '…', page - 1, page, page + 1, '…', totalPages];
        }

        pages.forEach(function (p) {
            if (p === '…') { out.push('<span class="pager__gap">…</span>'); return; }
            out.push('<button class="pager__btn' + (p === page ? ' is-active' : '') + '" ' +
                     'type="button" data-act="go-page" data-page="' + p + '">' + p + '</button>');
        });

        out.push(btn(page + 1, App.icon('chevronRight', 12), page === totalPages, 'next'));

        elPager.innerHTML = '<div class="pager">' + out.join('') + '</div>';

        function btn(target, label, disabled, key) {
            return '<button class="pager__btn' + (disabled ? ' is-disabled' : '') + '" type="button" ' +
                   'data-act="go-page" data-page="' + target + '" aria-label="' + key + '"' +
                   (disabled ? ' disabled' : '') + '>' + label + '</button>';
        }
    }

    function updateCrumb() {
        var el = document.getElementById('crumb-current');
        if (!el) return;

        var picked = F.state.categories;

        if (F.state.search) {
            el.textContent = App.t('common.search', 'Поиск');
        } else if (picked.length === 1) {
            var cat = App.catalog.findCategory(picked[0]);
            el.textContent = cat ? cat.Name : App.t('menu.shop', 'Магазин');
        } else if (picked.length > 1) {
            el.textContent = App.t('menu.categories', 'Категории') + ' · ' + picked.length;
        } else {
            el.textContent = App.t('menu.shop', 'Магазин');
        }
    }

    function applyView() {
        elProducts.classList.toggle('is-list', F.state.view === 'list');
        elProducts.classList.toggle('grid', F.state.view !== 'list');
        elProducts.classList.toggle('grid--auto', F.state.view !== 'list');

        App.utils.$$('.viewtoggle button').forEach(function (b) {
            b.classList.toggle('is-active', b.dataset.act === 'view-' + F.state.view);
        });
    }

    /* ============================================================
       DENETİMLER
       ============================================================ */

    /** Durum → form alanları (sayfa yenilenince kutular dolu gelsin). */
    function syncControls() {
        document.getElementById('sort-select').value = F.state.sort;
        document.getElementById('price-min').value = F.state.minPrice === null ? '' : F.state.minPrice;
        document.getElementById('price-max').value = F.state.maxPrice === null ? '' : F.state.maxPrice;
        document.getElementById('filter-in-stock').checked  = F.state.stock === 'in';
        document.getElementById('filter-out-stock').checked = F.state.stock === 'out';
    }

    /** Süzgeç değişti: 1. sayfaya dön, adresi güncelle, yeniden çiz. */
    function changed(resetPage) {
        if (resetPage !== false) F.state.page = 1;
        F.writeUrl();
        refresh();
    }

    function bindEvents() {

        /* Kategori tıklaması SEÇİMİ AÇAR/KAPATIR; birden çok kategori
           aynı anda işaretlenebilir. Kenar çubuğu açık kalır ki
           kullanıcı üst üste birkaç dal seçebilsin. */
        App.actions.register('pick-category', function (btn) {
            F.toggleCategory(btn.dataset.id || '');
            changed();
            F.renderTree(elTree, App.catalog.categories);
        });

        App.actions.register('pick-price', function (btn) {
            F.state.minPrice = parseFloat(btn.dataset.min);
            F.state.maxPrice = parseFloat(btn.dataset.max);
            syncControls();
            changed();
        });

        App.actions.register('apply-price', function () {
            var min = document.getElementById('price-min').value;
            var max = document.getElementById('price-max').value;

            F.state.minPrice = min === '' ? null : parseFloat(min);
            F.state.maxPrice = max === '' ? null : parseFloat(max);

            /* Kullanıcı ters yazdıysa değerler takas edilir; boş sonuç
               göstermek yerine niyeti uygulamak daha yardımcı. */
            if (F.state.minPrice !== null && F.state.maxPrice !== null &&
                F.state.minPrice > F.state.maxPrice) {
                var tmp = F.state.minPrice;
                F.state.minPrice = F.state.maxPrice;
                F.state.maxPrice = tmp;
                syncControls();
            }

            changed();
            closeMobileAside();
        });

        App.actions.register('clear-filters', function () {
            F.reset();
            syncControls();
            F.writeUrl();
            refresh();
            F.renderTree(elTree, App.catalog.categories);
        });

        App.actions.register('drop-filter', function (btn) {
            var key = btn.dataset.key;

            /* 'category:<id>' → yalnız o kategoriyi çıkar. */
            if (key.indexOf('category:') === 0) {
                F.dropCategory(key.slice(9));
                syncControls();
                changed();
                F.renderTree(elTree, App.catalog.categories);
                return;
            }

            if (key === 'search')   F.state.search = '';
            if (key === 'price')    { F.state.minPrice = null; F.state.maxPrice = null; }
            if (key === 'stock')    F.state.stock = null;
            syncControls();
            changed();
        });

        App.actions.register('go-page', function (btn) {
            var page = parseInt(btn.dataset.page, 10);
            if (!page || page === F.state.page) return;

            F.state.page = page;
            F.writeUrl();
            refresh();
            App.utils.scrollTop(0);
        });

        App.actions.register('view-grid', function () { F.state.view = 'grid'; F.writeUrl(true); refresh(); });
        App.actions.register('view-list', function () { F.state.view = 'list'; F.writeUrl(true); refresh(); });

        document.getElementById('sort-select').addEventListener('change', function () {
            F.state.sort = this.value;
            changed();
        });

        /* İki stok kutusu birbirini dışlar: ikisi de işaretliyse
           süzgeç anlamsız olur (hem var hem yok). */
        var inBox  = document.getElementById('filter-in-stock');
        var outBox = document.getElementById('filter-out-stock');

        inBox.addEventListener('change', function () {
            outBox.checked = false;
            F.state.stock = this.checked ? 'in' : null;
            changed();
        });
        outBox.addEventListener('change', function () {
            inBox.checked = false;
            F.state.stock = this.checked ? 'out' : null;
            changed();
        });

        /* Tarayıcı geri/ileri tuşu. */
        window.addEventListener('popstate', function () {
            F.readUrl();
            syncControls();
            refresh();
        });
    }

    function closeMobileAside() {
        var aside = document.getElementById('shop-aside');
        if (aside) aside.classList.remove('is-open');
    }
});
