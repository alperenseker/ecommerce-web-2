/* ============================================================
   pages/home.js — ANA SAYFA
   ------------------------------------------------------------
   Sayfa üç parçadan oluşur:
     1) üstteki SLIDER (üç sahne, kendi kendine ilerler),
     2) YENİ GELENLER ve ÖNE ÇIKANLAR — yan yana kayan raflar,
     3) EN DOLU KATEGORİLERDEN raflar (kategori başına bir sıra).

   🔴 NEDEN RAF, NEDEN IZGARA DEĞİL: her bloğu alt alta ızgara
   olarak dizmek sayfayı metrelerce uzatıyor ve kullanıcı ikinci
   bloğu hiç görmüyordu. Raf, bloğu tek ekrana sığdırır; ilgilenen
   kullanıcı yana kaydırır, ilgilenmeyen bir sonraki bloğa geçer.

   Metin anahtarları kaynak projeyle aynı.
   ============================================================ */

App.definePage('home', async function (ctx) {

    /* ------------------------------------------------------------
       SLIDER SAHNELERİ
       `var` bildirimi yukarı taşınır ama ATAMASI taşınmaz: bu liste
       renderHero()'dan SONRA tanımlanırsa çağrı anında `undefined`
       olur. Bu yüzden en başta duruyor.
       ------------------------------------------------------------ */
    var SLIDES = [
        { key: 'home.slider1', image: 'assets/img/about/about-us1.webp', href: 'shop.html?sort=date' },
        { key: 'home.slider2', image: 'assets/img/about/about-us2.webp', href: 'shop.html' },
        { key: 'home.slider3', image: 'assets/img/about/about-us3.webp', href: 'shop.html?sort=popularity' }
    ];

    /* Her blokta TAM 5 ürün; gerisi "daha fazla" düğmesinin ardında. */
    var ROW_SIZE = 5;

    /* Ana kategori bloğu sayısı üst sınırı (Fores, Foral, Stark…). */
    var CATEGORY_ROWS = 4;

    var heroBox = document.getElementById('hero');
    var rowsBox = document.getElementById('rails');

    /* Kart listeleri HTML dizesine gömülemez (kart DOM üretiyor);
       raf gövdeleri boş basılır, ürünler buradan doldurulur.

       🔴 Atama GÖVDENİN BAŞINDA: `var` bildirimi yukarı taşınır ama
       ataması taşınmaz. Aşağıda, `await`ten sonra tanımlansaydı
       renderRails() çağrıldığında `undefined` olurdu. */
    var pending = {};

    /* --- 1. iskelet --- */
    renderHero();
    rowsBox.innerHTML = rowSkeleton() + rowSkeleton();

    /* --- 2. veri --- */
    var data = await ctx.catalog;

    renderStats(data);
    renderRows();

    ctx.user.then(function () { App.card.refreshStates(); });

    App.bus.on(App.bus.EVENTS.CATALOG_SYNCED, function (fresh) {
        renderStats(fresh);
        renderRows();
    });

    App.bus.on(App.bus.EVENTS.LANG_CHANGED, function () {
        renderHero();
        renderStats(App.catalog);
        renderRows();
        App.i18n.apply();
    });

    /* ============================================================
       SLIDER
       ------------------------------------------------------------
       Sahneler `opacity` ile geçer, `display` ile değil: yükseklik
       sabit kalır ve geçişte sayfa zıplamaz. Otomatik ilerleme fare
       üstündeyken DURUR.
       ============================================================ */

    var index = 0;
    var timer = null;

    function renderHero() {
        if (!heroBox) return;
        var t = App.t;

        heroBox.innerHTML =
            SLIDES.map(function (slide, i) {
                var eyebrow = [t(slide.key + '.subtitle', ''), t(slide.key + '.subtitleSpan', '')]
                    .filter(Boolean).join(' ');
                var title  = t(slide.key + '.title', '');
                var strong = t(slide.key + '.titleSpan', '');
                var text   = [t(slide.key + '.description', ''), t(slide.key + '.descriptionSpan', '')]
                    .filter(Boolean).join(' ');

                return '<div class="hero__slide' + (i === 0 ? ' is-active' : '') + '" data-slide="' + i + '">' +
                           '<div>' +
                               (eyebrow ? '<span class="eyebrow">' + App.utils.escape(eyebrow) + '</span>' : '') +
                               '<h1 class="hero__title">' +
                                   App.utils.escape(title) +
                                   (strong ? ' <b>' + App.utils.escape(strong) + '</b>' : '') +
                               '</h1>' +
                               (text ? '<p class="hero__text">' + App.utils.escape(text) + '</p>' : '') +

                               '<div class="hero__actions">' +
                                   '<a class="btn btn--primary btn--lg" href="' + slide.href + '">' +
                                       App.utils.escape(t(slide.key + '.shopNow', '')) + '</a>' +
                                   '<a class="btn btn--ghost btn--lg" href="about-us.html">' +
                                       App.utils.escape(t('menu.aboutUs', '')) + '</a>' +
                               '</div>' +

                               (i === 0 ? statsHtml() : '') +
                           '</div>' +

                           '<div class="hero__visual">' +
                               '<img src="' + slide.image + '" alt="" width="720" height="460"' +
                                    (i === 0 ? '' : ' loading="lazy"') + '>' +
                           '</div>' +
                       '</div>';
            }).join('') +

            '<button class="hero__nav hero__nav--prev" type="button" data-act="hero-prev" ' +
                    'aria-label="' + t('shop.pagination.prev', 'Назад') + '">' +
                App.icon('chevronLeft', 17) + '</button>' +
            '<button class="hero__nav hero__nav--next" type="button" data-act="hero-next" ' +
                    'aria-label="' + t('shop.pagination.next', 'Вперед') + '">' +
                App.icon('chevronRight', 17) + '</button>' +

            '<div class="hero__dots">' +
                SLIDES.map(function (s, i) {
                    return '<button class="hero__dot' + (i === 0 ? ' is-active' : '') + '" type="button" ' +
                           'data-act="hero-go" data-index="' + i + '" aria-label="' + (i + 1) + '"></button>';
                }).join('') +
            '</div>';

        index = 0;
        bindHero();
        startAuto();
    }

    function statsHtml() {
        return '<div class="hero__stats">' +
                   '<div class="hero__stat"><b id="stat-products">—</b>' +
                       '<span>' + App.t('shop.pagination.products', 'Товаров') + '</span></div>' +
                   '<div class="hero__stat"><b id="stat-categories">—</b>' +
                       '<span>' + App.t('home.categories', 'Категории') + '</span></div>' +
                   '<div class="hero__stat"><b>24/7</b>' +
                       '<span>' + App.t('footer.support247', 'Поддержка') + '</span></div>' +
               '</div>';
    }

    function show(next) {
        var slides = App.utils.$$('.hero__slide', heroBox);
        var dots   = App.utils.$$('.hero__dot', heroBox);
        if (!slides.length) return;

        index = (next + slides.length) % slides.length;
        slides.forEach(function (el, i) { el.classList.toggle('is-active', i === index); });
        dots.forEach(function (el, i) { el.classList.toggle('is-active', i === index); });
    }

    function startAuto() { stopAuto(); timer = setInterval(function () { show(index + 1); }, 6500); }
    function stopAuto()  { if (timer) { clearInterval(timer); timer = null; } }

    function bindHero() {
        if (!heroBox || heroBox.dataset.bound === '1') return;
        heroBox.dataset.bound = '1';

        App.actions.register('hero-prev', function () { show(index - 1); startAuto(); });
        App.actions.register('hero-next', function () { show(index + 1); startAuto(); });
        App.actions.register('hero-go',   function (btn) { show(parseInt(btn.dataset.index, 10) || 0); startAuto(); });

        heroBox.addEventListener('mouseenter', stopAuto);
        heroBox.addEventListener('mouseleave', startAuto);

        var startX = null;
        heroBox.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; stopAuto(); }, { passive: true });
        heroBox.addEventListener('touchend', function (e) {
            if (startX === null) return;
            var delta = e.changedTouches[0].clientX - startX;
            if (Math.abs(delta) > 40) show(index + (delta < 0 ? 1 : -1));
            startX = null;
            startAuto();
        });

        document.addEventListener('visibilitychange', function () {
            if (document.hidden) stopAuto(); else startAuto();
        });
    }

    /* ============================================================
       ÜRÜN BLOKLARI
       ------------------------------------------------------------
       Her blok: başlık + 5 ürün + "daha fazla" düğmesi. Düğme,
       kullanıcıyı mağaza sayfasına O BLOĞUN SÜZGECİYLE götürür —
       yeni gelenler sıralamasıyla, çok satanlar sıralamasıyla,
       kategori bloğu ise o kategori seçili hâlde.
       ============================================================ */

    function renderRows() {
        var t = App.t;
        var blocks = [];

        blocks.push(row('new', t('home.newArrivals', 'Новинки'),
                        'shop.html?sort=date', App.catalog.newArrivals(ROW_SIZE)));

        blocks.push(row('top', t('home.topFeatured', 'Лучшие товары'),
                        'shop.html?sort=popularity', App.catalog.bestSellers(ROW_SIZE)));

        /* ANA kategoriler (1C kaynakları: Fores, Foral, …) — alt dalları
           tek tek listelemek yerine üst düğümü gösteriyoruz; müşteri
           markayı arıyor, alt dalı mağaza sayfasında seçiyor. */
        mainCategories(CATEGORY_ROWS).forEach(function (cat) {
            blocks.push(row('cat-' + cat.id, cat.name,
                            'shop.html?category=' + encodeURIComponent(cat.id), cat.products));
        });

        rowsBox.innerHTML = blocks.join('');

        App.utils.$$('.row5', rowsBox).forEach(function (box) {
            App.card.render(box, pending[box.dataset.row] || []);
        });

        App.card.refreshStates(rowsBox);
    }

    function row(id, title, href, products) {
        pending[id] = products || [];
        if (!products || !products.length) return '';

        return '<section class="section--tight">' +
                   '<div class="section-head">' +
                       '<h2 class="section-head__title">' + App.utils.escape(title) + '</h2>' +
                       '<a class="section-head__link" href="' + href + '">' +
                           App.t('common.moreProducts', 'Больше товаров') + '</a>' +
                   '</div>' +

                   '<div class="row5 products" data-row="' + id + '"></div>' +

                   '<div class="row5__more">' +
                       '<a class="btn btn--ghost" href="' + href + '">' +
                           App.t('common.showMore', App.t('common.moreProducts', 'Показать ещё')) +
                       '</a>' +
                   '</div>' +
               '</section>';
    }

    /**
     * Ana (ilk seviye) kategoriler ve her birinden 5 ürün.
     * Ürünü olmayan dal gösterilmez — boş blok kullanıcıya "burada
     * bir şey yok" demekten başka bir şey yapmaz.
     */
    function mainCategories(count) {
        return (App.catalog.categories || [])
            .map(function (cat) {
                var ids = App.catalog.descendantIds(cat.Id);
                var products = App.catalog.products.filter(function (p) {
                    return ids.indexOf(String(p.CategoryId)) !== -1;
                });
                return {
                    id: cat.Id,
                    name: cat.Name,
                    products: products.slice(0, ROW_SIZE),
                    total: products.length
                };
            })
            .filter(function (row) { return row.total > 0; })
            .sort(function (a, b) { return b.total - a.total; })
            .slice(0, count);
    }

    function rowSkeleton() {
        var cards = '';
        for (var i = 0; i < 5; i++) {
            cards += '<div class="pcard">' +
                         '<div style="padding:12px"><div class="skel skel--img"></div></div>' +
                         '<div class="pcard__body">' +
                             '<div class="skel skel--text" style="width:40%"></div>' +
                             '<div class="skel skel--text"></div>' +
                             '<div class="skel skel--text" style="width:60%"></div>' +
                         '</div>' +
                     '</div>';
        }
        return '<section class="section--tight">' +
                   '<div class="section-head">' +
                       '<div class="skel skel--text" style="width:180px;height:18px"></div>' +
                   '</div>' +
                   '<div class="row5 products">' + cards + '</div>' +
               '</section>';
    }

    /* ============================================================
       SAYAÇLAR
       ============================================================ */

    function renderStats(data) {
        var products = document.getElementById('stat-products');
        if (products) products.textContent = App.fmt.number((data.products || []).length, 0) + '+';

        var total = 0;
        (function walk(list) {
            (list || []).forEach(function (c) { total++; walk(c.SubCategories); });
        })(data.categories);

        var cats = document.getElementById('stat-categories');
        if (cats) cats.textContent = total || '—';
    }
});
