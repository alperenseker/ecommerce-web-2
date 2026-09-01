/* ============================================================
   pages/home.js — ANA SAYFA
   ------------------------------------------------------------
   Katalog gelmeden ekran boş kalmasın diye önce iskelet (skeleton)
   basılır, veri gelince yerine gerçek kartlar geçer.
   ============================================================ */

App.definePage('home', async function (ctx) {

    var newArrivals = document.getElementById('new-arrivals');
    var bestSellers = document.getElementById('best-sellers');
    var catGrid     = document.getElementById('categories-grid');

    /* --- 1. iskelet --- */
    App.card.skeletons(newArrivals, 6);
    App.card.skeletons(bestSellers, 6);
    catGrid.innerHTML = skeletonCategories(6);

    renderPerks();

    /* --- 2. veri --- */
    var data = await ctx.catalog;

    renderStats(data);
    renderCategories(data.categories);
    renderProducts();

    /* Kullanıcı durumu (kalpler) sonradan gelir; kartlar hizalanır. */
    ctx.user.then(function () { App.card.refreshStates(); });

    /* Katalog arkadan tazelenirse listeler de tazelensin. */
    App.bus.on(App.bus.EVENTS.CATALOG_SYNCED, function (fresh) {
        renderStats(fresh);
        renderCategories(fresh.categories);
        renderProducts();
    });

    /* Dil değişince JS ile basılan metinler yeniden çizilir. */
    App.bus.on(App.bus.EVENTS.LANG_CHANGED, function () {
        renderPerks();
        renderCategories(App.catalog.categories);
        renderProducts();
        App.i18n.apply();
    });

    /* ------------------------------------------------------------
       PARÇALAR
       ------------------------------------------------------------ */

    function renderProducts() {
        App.card.render(newArrivals, App.catalog.newArrivals(6));
        App.card.render(bestSellers, App.catalog.bestSellers(6));
        App.card.refreshStates();
    }

    function renderStats(data) {
        document.getElementById('stat-products').textContent =
            App.fmt.number(data.products.length, 0) + '+';

        /* Kategori sayısı ağacın tamamı sayılarak bulunur. */
        var total = 0;
        (function walk(list) {
            (list || []).forEach(function (c) { total++; walk(c.SubCategories); });
        })(data.categories);

        document.getElementById('stat-categories').textContent = total || '—';
    }

    /**
     * Ana kategoriler. Sunucudaki ilk seviye ŞİRKET (1C kaynağı)
     * olabildiği için, tek çocuklu üst düğümler atlanıp bir alt
     * seviye gösterilir — kullanıcı "Fores / Foral" değil gerçek
     * ürün gruplarını görsün.
     */
    function renderCategories(categories) {
        var flat = [];

        (categories || []).forEach(function (cat) {
            var subs = cat.SubCategories || [];
            if (subs.length) subs.forEach(function (s) { flat.push(s); });
            else flat.push(cat);
        });

        var top = flat.slice(0, 12);

        if (!top.length) {
            catGrid.innerHTML = '';
            return;
        }

        catGrid.innerHTML = top.map(function (cat, i) {
            var icons = ['box', 'settings', 'shield', 'tag', 'truck', 'lock',
                         'building', 'wallet', 'gift', 'file', 'home', 'headset'];
            var count = App.catalog.countInCategory(cat.Id);

            return '<a class="ccard" href="shop.html?category=' + cat.Id + '">' +
                       '<span class="ccard__icon">' + App.icon(icons[i % icons.length], 20) + '</span>' +
                       '<span class="ccard__name t-clamp-2">' + App.utils.escape(cat.Name) + '</span>' +
                       (count ? '<span class="ccard__count">' + count + ' ' +
                                App.t('shop.results', 'товаров') + '</span>' : '') +
                   '</a>';
        }).join('');
    }

    function renderPerks() {
        var items = [
            { icon: 'truck',   t: 'home.perk1', s: 'home.perk1s' },
            { icon: 'shield',  t: 'home.perk2', s: 'home.perk2s' },
            { icon: 'credit',  t: 'home.perk3', s: 'home.perk3s' },
            { icon: 'headset', t: 'home.perk4', s: 'home.perk4s' }
        ];

        document.getElementById('perks').innerHTML = items.map(function (p) {
            return '<div class="perk">' +
                       '<span class="perk__icon">' + App.icon(p.icon, 17) + '</span>' +
                       '<span><b>' + App.t(p.t, '') + '</b><span>' + App.t(p.s, '') + '</span></span>' +
                   '</div>';
        }).join('');
    }

    function skeletonCategories(n) {
        var html = '';
        for (var i = 0; i < n; i++) {
            html += '<div class="ccard">' +
                        '<div class="skel" style="width:54px;height:54px;border-radius:12px"></div>' +
                        '<div class="skel skel--text" style="width:70%"></div>' +
                    '</div>';
        }
        return html;
    }
});
