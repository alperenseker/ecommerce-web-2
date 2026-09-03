/* ============================================================
   pages/shop-filters.js — MAĞAZA SÜZGEÇLERİ
   ------------------------------------------------------------
   Kategori ağacı, fiyat aralıkları, stok süzgeci ve aktif süzgeç
   çipleri. Süzme MANTIĞI burada; ekranı çizme ve sayfalama
   pages/shop.js içindedir. İkisi `App.shopFilters` üzerinden
   konuşur — mağaza sayfası büyüdükçe iki dosya ayrı büyür.
   ============================================================ */

(function (App) {
    'use strict';

    var F = {};

    /* ============================================================
       SÜZGEÇ DURUMU
       Adres çubuğuyla eşitlenir: kullanıcı bağlantıyı paylaşınca
       karşı taraf aynı listeyi görür, geri tuşu da çalışır.
       ============================================================ */
    F.state = {
        /* ÇOKLU SEÇİM: kullanıcı birkaç kategoriyi aynı anda işaretler
           ve sonuç bunların BİRLEŞİMİ olur (VEYA mantığı). Ürünün
           hepsine birden ait olması gerekmez — "a veya b" listesi
           istendiği için kesişim yanlış olurdu. */
        categories: [],
        search:   '',
        minPrice: null,
        maxPrice: null,
        stock:    null,      // 'in' | 'out' | null
        sort:     'default',
        page:     1,
        pageSize: App.config.PAGE_SIZE,
        view:     'grid'
    };

    F.readUrl = function () {
        var p = App.utils.params();

        /* Adres çubuğunda virgülle ayrılır: shop.html?category=12,40 */
        F.state.categories = (p.category || '')
            .split(',')
            .map(function (id) { return String(id).trim(); })
            .filter(Boolean);
        F.state.search   = p.search || '';
        F.state.minPrice = p.min ? parseFloat(p.min) : null;
        F.state.maxPrice = p.max ? parseFloat(p.max) : null;
        F.state.stock    = p.stock || null;
        F.state.sort     = p.sort || 'default';
        F.state.page     = parseInt(p.page, 10) || 1;
        /* Sayfa boyutu SABİT — kullanıcıya sorulmuyor. */
        F.state.pageSize = App.config.PAGE_SIZE;
        /* Görünüm: adres çubuğu > sayfanın kendi varsayılanı.
           shop-list.html gövdesinde `data-view="list"` taşır, böylece
           iki ayrı sayfa aynı betiği paylaşır. */
        var pageDefault = document.body.getAttribute('data-view') || 'grid';
        F.state.view     = (p.view || pageDefault) === 'list' ? 'list' : 'grid';

        return F.state;
    };

    F.writeUrl = function (replace) {
        App.utils.setParams({
            category: F.state.categories.length ? F.state.categories.join(',') : null,
            search:   F.state.search,
            min:      F.state.minPrice,
            max:      F.state.maxPrice,
            stock:    F.state.stock,
            sort:     F.state.sort === 'default' ? null : F.state.sort,
            page:     F.state.page > 1 ? F.state.page : null,
            view:     F.state.view === (document.body.getAttribute('data-view') || 'grid') ? null : F.state.view
        }, replace);
    };

    /* ============================================================
       SÜZME
       ============================================================ */

    /**
     * Tüm süzgeçleri sırayla uygular ve sıralar.
     * Sıra önemli: önce daraltıp SONRA sıralamak, büyük katalogda
     * karşılaştırma sayısını ciddi düşürür.
     */
    F.apply = function () {
        var list = App.catalog.products;
        var s = F.state;

        /* --- arama --- */
        if (s.search) list = App.catalog.search(s.search, list);

        /* --- kategori (çoklu seçim, alt dallar dâhil) ---
           Seçilen her kategorinin alt ağacı toplanır; ürün bu
           kümedeki HERHANGİ bir kategoriye aitse listede kalır. */
        if (s.categories.length) {
            var allowed = {};
            s.categories.forEach(function (id) {
                App.catalog.descendantIds(id).forEach(function (child) { allowed[child] = true; });
            });

            list = list.filter(function (p) { return allowed[String(p.CategoryId)] === true; });
        }

        /* --- fiyat ---
           Fiyatı gizli ürünün Price alanı 0 gelir; fiyat süzgeci
           uygulandığında bunlar ELENİR, yoksa "0 ₸ ürün" gibi
           görünüp aralığı bozarlar. */
        if (s.minPrice !== null || s.maxPrice !== null) {
            var min = s.minPrice === null ? 0 : s.minPrice;
            var max = s.maxPrice === null ? Infinity : s.maxPrice;

            list = list.filter(function (p) {
                if (App.model.isPriceHidden(p)) return false;
                var price = parseFloat(p.Price) || 0;
                return price >= min && price <= max;
            });
        }

        /* --- stok --- */
        if (s.stock) {
            list = list.filter(function (p) {
                var amount = parseInt(p.StockAmount, 10) || 0;
                var inStock = amount > 0 && p.StockStatus !== App.const.STOCK_OUT;
                return s.stock === 'in' ? inStock : !inStock;
            });
        }

        return F.sort(list, s.sort);
    };

    /**
     * Sıralama.
     * Fiyatı olmayan/gizli ürünler YÖN NE OLURSA OLSUN sona gider:
     * ham çıkarma bunları "ucuzdan pahalıya"da en başa yığıyordu.
     * Aynı mantık puanda da var — yorumsuzlar sona.
     */
    F.sort = function (list, sortBy) {
        switch (sortBy) {
            case 'price-low':  return App.utils.sortBy(list, comparePrice(1));
            case 'price-high': return App.utils.sortBy(list, comparePrice(-1));

            case 'date':
                return App.utils.sortBy(list, function (a, b) {
                    return new Date(b.CreatedAt) - new Date(a.CreatedAt);
                });

            case 'popularity':
                return App.utils.sortBy(list, function (a, b) {
                    return (b.ViewCount || 0) - (a.ViewCount || 0);
                });

            case 'rating':
                return App.utils.sortBy(list, function (a, b) {
                    var ar = a.TotalReviewCount || 0, br = b.TotalReviewCount || 0;
                    if (ar > 0 && br === 0) return -1;
                    if (ar === 0 && br > 0) return 1;
                    if (ar === 0 && br === 0) return 0;
                    return (b.AverageRating || 0) - (a.AverageRating || 0);
                });

            default:
                return list;
        }
    };

    function comparePrice(direction) {
        return function (a, b) {
            var aHidden = App.model.isPriceHidden(a);
            var bHidden = App.model.isPriceHidden(b);

            if (aHidden !== bHidden) return aHidden ? 1 : -1;
            if (aHidden) return 0;

            return ((parseFloat(a.Price) || 0) - (parseFloat(b.Price) || 0)) * direction;
        };
    }

    /* ============================================================
       KATEGORİ AĞACI
       ============================================================ */

    F.renderTree = function (container, categories) {
        if (!container) return;

        var html = '<div class="tree__item">' +
                       '<a class="tree__link' + (F.state.categories.length ? '' : ' is-active') + '" ' +
                          'href="#" data-act="pick-category" data-id="">' +
                           '<span class="tree__box"></span>' +
                           '<span class="grow">' + App.t('common.all', 'Все') + '</span>' +
                           '<small>' + App.catalog.products.length + '</small>' +
                       '</a>' +
                   '</div>';

        html += branch(categories || [], 0);
        container.innerHTML = html;

        /* Seçili kategorinin atalarını açık başlat ki kullanıcı
           nerede olduğunu görsün. */
        openActiveBranch(container);
    };

    function branch(list, depth) {
        return (list || []).map(function (cat) {
            var subs = cat.SubCategories || [];
            var count = App.catalog.countInCategory(cat.Id);

            /* Ürünü olmayan boş dalları göstermek listeyi şişiriyor. */
            if (!count && !subs.length) return '';

            var active = F.has(cat.Id);

            return '<div class="tree__item" data-cat-id="' + cat.Id + '">' +
                       (subs.length
                           ? '<button class="tree__toggle" type="button" data-act="toggle-tree" aria-label="aç">' +
                                 App.icon('chevronRight', 10) + '</button>'
                           : '<span class="tree__toggle"></span>') +
                       '<a class="tree__link' + (active ? ' is-active' : '') + '" href="#" ' +
                          'data-act="pick-category" data-id="' + cat.Id + '" ' +
                          'aria-pressed="' + active + '">' +
                           '<span class="tree__box"></span>' +
                           '<span class="grow t-clamp-1">' + App.utils.escape(cat.Name) + '</span>' +
                           (count ? '<small>' + count + '</small>' : '') +
                       '</a>' +
                   '</div>' +
                   (subs.length
                       ? '<div class="tree__children">' + branch(subs, depth + 1) + '</div>'
                       : '');
        }).join('');
    }

    /** Seçili TÜM kategorilerin ataları açılır; kullanıcı hepsini görsün. */
    function openActiveBranch(container) {
        App.utils.$$('.tree__link.is-active', container).forEach(function (active) {
            var node = active.closest('.tree__children');
            while (node) {
                node.classList.add('is-open');
                var prev = node.previousElementSibling;
                var toggle = prev && prev.querySelector('.tree__toggle');
                if (toggle) toggle.classList.add('is-open');
                node = node.parentElement ? node.parentElement.closest('.tree__children') : null;
            }
        });
    }

    /* ============================================================
       FİYAT ARALIĞI ÖNERİLERİ
       Katalogdaki en düşük/en yüksek fiyat beşe bölünür; sabit
       aralıklar yazmak farklı katalogda anlamsız olurdu.
       ============================================================ */

    F.renderPricePresets = function (container, products) {
        if (!container) return;

        var prices = (products || [])
            .filter(function (p) { return !App.model.isPriceHidden(p); })
            .map(function (p) { return parseFloat(p.Price) || 0; })
            .filter(function (n) { return n > 0; });

        if (prices.length < 2) { container.innerHTML = ''; return; }

        var min = Math.min.apply(null, prices);
        var max = Math.max.apply(null, prices);
        var step = (max - min) / 5;

        var rows = [];
        for (var i = 0; i < 5; i++) {
            var start = Math.floor(min + step * i);
            var end   = Math.floor(min + step * (i + 1));
            if (end <= start) continue;
            rows.push({ start: start, end: end });
        }

        container.innerHTML = rows.map(function (r) {
            return '<a class="tree__link" href="#" data-act="pick-price" ' +
                      'data-min="' + r.start + '" data-max="' + r.end + '">' +
                       '<span>' + App.fmt.price(r.start) + ' — ' + App.fmt.price(r.end) + '</span>' +
                   '</a>';
        }).join('');
    };

    /* ============================================================
       AKTİF SÜZGEÇ ÇİPLERİ
       ============================================================ */

    F.renderChips = function (container) {
        if (!container) return;

        var chips = [];
        var s = F.state;

        if (s.search) {
            chips.push(chip('search', App.t('shop.searchFor', 'Поиск') + ': ' + s.search));
        }
        /* Her kategori KENDİ çipini alır: kullanıcı birini tek tek
           çıkarabilsin, hepsini birden atmak zorunda kalmasın. */
        s.categories.forEach(function (id) {
            var cat = App.catalog.findCategory(id);
            if (cat) chips.push(chip('category:' + id, cat.Name));
        });
        if (s.minPrice !== null || s.maxPrice !== null) {
            chips.push(chip('price',
                (s.minPrice !== null ? App.fmt.price(s.minPrice) : '0') + ' — ' +
                (s.maxPrice !== null ? App.fmt.price(s.maxPrice) : '∞')));
        }
        if (s.stock) {
            chips.push(chip('stock', s.stock === 'in'
                ? App.t('shop.inStockOnly', 'В наличии')
                : App.t('shop.outOfStock', 'Нет в наличии')));
        }

        container.innerHTML = chips.join('');
        container.style.display = chips.length ? 'flex' : 'none';
    };

    function chip(key, label) {
        return '<span class="chip">' +
                   App.utils.escape(App.fmt.truncate(label, 40)) +
                   '<button class="chip__x" type="button" data-act="drop-filter" data-key="' + key + '" ' +
                           'aria-label="' + App.t('common.remove', 'Убрать') + '">' +
                       App.icon('close', 11) +
                   '</button>' +
               '</span>';
    }

    /** Kategori seçili mi. */
    F.has = function (categoryId) {
        return F.state.categories.indexOf(String(categoryId)) !== -1;
    };

    /** Seçimi aç/kapa; boş kimlik TÜM seçimi temizler. */
    F.toggleCategory = function (categoryId) {
        var id = String(categoryId || '');
        if (!id) { F.state.categories = []; return; }

        var at = F.state.categories.indexOf(id);
        if (at === -1) F.state.categories.push(id);
        else F.state.categories.splice(at, 1);
    };

    F.dropCategory = function (categoryId) {
        var at = F.state.categories.indexOf(String(categoryId));
        if (at !== -1) F.state.categories.splice(at, 1);
    };

    F.reset = function () {
        F.state.categories = [];
        F.state.search   = '';
        F.state.minPrice = null;
        F.state.maxPrice = null;
        F.state.stock    = null;
        F.state.page     = 1;
    };

    App.shopFilters = F;

})(window.App);
