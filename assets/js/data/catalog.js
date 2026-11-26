/* ============================================================
   data/catalog.js — KATALOG (ÜRÜN + KATEGORİ) SERVİSİ
   ------------------------------------------------------------
   Katalog ÜÇ KATMANLI okunur; amaç ilk boyamayı beklemeden yapmak:

     1) sessionStorage  → aynı sekmede anlık (ms)
     2) IndexedDB       → ikinci ziyarette anlık, çevrimdışı da çalışır
     3) API             → ilk ziyaret / önbellek boş / süre dolmuş

   Hangi katmandan okunursa okunsun ARKA PLANDA API eşitlemesi
   başlatılır; değişiklik varsa 'catalog:synced' olayı yayınlanır ve
   açık ekran kendini tazeler. Kullanıcı bekletilmez.

   ÖNEMLİ: Fiyatlar ve görünürlük kullanıcıya özeldir (fiyat listesi,
   özel fiyat, gizli/"her zaman göster" ürünler — FAZ 42). Bu yüzden
   giriş/çıkışta ve bayat oturumda önbelleğin TAMAMI (sessionStorage +
   IndexedDB) C.clearCache() ile atılır ve bu BEKLENİR (FAZ 35).
   ============================================================ */

(function (App) {
    'use strict';

    var C = {
        products:   [],   // bellek içi katalog (aktif ürünler)
        categories: [],
        loaded:     false
    };

    var _syncTimer = null;

    /* Uçuştaki eşitleme. Temizlikten SONRA biterse eski oturumun
       token'ıyla indirdiği listeyi önbelleğe yazar; clearCache onu
       bekleyip bir kez daha temizler. */
    var _syncPromise = null;

    /* ============================================================
       API'DEN ÇEKME
       ============================================================ */

    /**
     * Ürünleri sunucudan çeker.
     * Sunucu fiyatı ve görünürlüğü KULLANICIYA GÖRE çözüyor (fiyat
     * listesi, özel fiyat, gizli ürünler). FAZ 35: kimlik YALNIZ
     * token'dan okunur; sorgudaki `userId` yok sayılır (eşleşmezse
     * sunucu uyarı loglar). Bu yüzden gönderilmez — token http
     * katmanında her istekte zaten var. Misafirde liste fiyatı gelir.
     */
    C.fetchProducts = async function (filters) {
        filters = filters || {};

        var params = {
            page: 1,
            pageSize: App.config.MAX_PAGE_SIZE,
            search: filters.search,
            categoryId: filters.categoryId,
            stockStatus: filters.stockStatus,
            status: filters.status
        };

        if (filters.isActive === true || filters.isActive === false) {
            params.isActive = filters.isActive;
        }

        return App.api.products.getAll(params);
    };

    C.fetchCategories = function () {
        return App.api.products.getCategories();
    };

    /* ============================================================
       YÜKLEME (üç katman)
       ============================================================ */

    /**
     * Katalogu getirir. Süzgeç verilirse önbellek ATLANIR — süzülmüş
     * sonuç genel önbelleğe yazılmamalı, yoksa sonraki sayfa eksik
     * katalog görür.
     */
    C.loadProducts = async function (filters) {
        filters = filters || {};
        var hasFilters = !!(filters.search || filters.categoryId || filters.stockStatus);

        if (!hasFilters) {
            /* 1) sekme önbelleği */
            var cached = App.store.session.getCache(App.keys.CACHE_PRODUCTS);
            if (cached && cached.length) {
                C.products = onlyActive(cached);
                C.loaded = true;
                syncInBackground();
                return C.products;
            }

            /* 2) kalıcı önbellek */
            var stored = await App.idb.getProducts();
            if (stored && stored.length) {
                C.products = onlyActive(stored);
                C.loaded = true;
                App.store.session.setCache(App.keys.CACHE_PRODUCTS, stored);
                syncInBackground();
                return C.products;
            }
        }

        /* 3) sunucu */
        var res = await C.fetchProducts(Object.assign({ isActive: true }, filters));
        if (res.success && res.data) {
            C.products = onlyActive(res.data);
            C.loaded = true;

            if (!hasFilters) {
                App.store.session.setCache(App.keys.CACHE_PRODUCTS, res.data);
                App.idb.setProducts(res.data);
                App.idb.touchSync();
            }
            return C.products;
        }

        return [];
    };

    C.loadCategories = async function () {
        var cached = App.store.session.getCache(App.keys.CACHE_CATEGORIES);
        if (cached && cached.length) { C.categories = cached; return C.categories; }

        var stored = await App.idb.getCategories();
        if (stored && stored.length) {
            C.categories = stored;
            App.store.session.setCache(App.keys.CACHE_CATEGORIES, stored);
            return C.categories;
        }

        var res = await C.fetchCategories();
        if (res.success && res.data) {
            C.categories = res.data;
            App.store.session.setCache(App.keys.CACHE_CATEGORIES, res.data);
            App.idb.setCategories(res.data);
            return C.categories;
        }

        return [];
    };

    /** Ürün + kategori birlikte (ekranların çoğu ikisini de ister). */
    C.load = async function () {
        var pair = await Promise.all([C.loadProducts(), C.loadCategories()]);
        return { products: pair[0], categories: pair[1] };
    };

    /* Pasif ürün hiçbir ekranda görünmemeli — tek yerde süzülür. */
    function onlyActive(list) {
        return (list || []).filter(function (p) { return p.IsActive !== false; });
    }

    /* ============================================================
       ARKA PLAN EŞİTLEME
       ============================================================ */

    /**
     * Neyin değiştiğini bulur. Tüm listeyi kör kör yeniden çizmek
     * yerine "değişiklik VAR MI?" sorusuna cevap verir; yoksa ekran
     * hiç dokunulmaz (kaydırma konumu, açık menüler korunur).
     */
    C.diff = function (oldList, newList) {
        var oldMap = new Map((oldList || []).map(function (p) { return [p.ProductId, p]; }));
        var newMap = new Map((newList || []).map(function (p) { return [p.ProductId, p]; }));

        var added = [], updated = [], removed = [];

        /* Kullanıcının GÖRDÜĞÜ alanlar. Tam nesne karşılaştırması
           LastSyncedAt gibi alanlar yüzünden her turda "değişti" derdi. */
        /* FAZ 36/42 alanları da izlenir: admin yalnız adet kuralını
           (min/adım) ya da özel fiyat işaretini değiştirdiğinde fiyat
           aynı kalabilir; izlenmezse ekran eski kuralı gösterirdi. */
        var watched = ['Name', 'Price', 'OldPrice', 'StockAmount', 'StockStatus',
                       'MainImage', 'Images', 'IsActive', 'IsFeatured',
                       'IsNewArrival', 'AverageRating', 'TotalReviewCount',
                       'HasPrice', 'PriceHidden', 'BasePrice', 'StockBaseQty',
                       'SalesUnitName', 'SalesUnitSize', 'BaseUnit', 'MinOrderQty',
                       'OrderStep', 'UnitsPerPallet', 'HasSpecialPrice', 'ForceVisible'];

        (newList || []).forEach(function (np) {
            var op = oldMap.get(np.ProductId);
            if (!op) { added.push(np); return; }

            var changed = watched.some(function (field) { return op[field] !== np[field]; });
            if (changed) updated.push(np);
        });

        (oldList || []).forEach(function (op) {
            if (!newMap.has(op.ProductId)) removed.push(op);
        });

        return {
            added: added, updated: updated, removed: removed,
            hasChanges: added.length > 0 || updated.length > 0 || removed.length > 0
        };
    };

    /**
     * Sunucuyla eşitle. Değişiklik varsa önbellekleri günceller ve
     * 'catalog:synced' yayınlar.
     * @param {boolean} force true ise süre kontrolü yapılmaz
     */
    C.sync = function (force) {
        var run = syncOnce(force);
        _syncPromise = run;
        run.then(function () { if (_syncPromise === run) _syncPromise = null; });
        return run;
    };

    async function syncOnce(force) {
        try {
            if (!force && !(await App.idb.isSyncNeeded())) return false;

            var oldProducts   = C.products.slice();
            var oldCategories = C.categories.slice();

            var res = await Promise.all([
                C.fetchProducts({ isActive: true }),
                C.fetchCategories()
            ]);

            var productsChanged = false, categoriesChanged = false;

            if (res[0].success && res[0].data) {
                var fresh = res[0].data;
                if (C.diff(oldProducts, onlyActive(fresh)).hasChanges || !oldProducts.length) {
                    C.products = onlyActive(fresh);
                    App.store.session.setCache(App.keys.CACHE_PRODUCTS, fresh);
                    App.idb.setProducts(fresh);
                    productsChanged = true;
                }
            }

            if (res[1].success && res[1].data) {
                var freshCats = res[1].data;
                if (JSON.stringify(oldCategories) !== JSON.stringify(freshCats) || !oldCategories.length) {
                    C.categories = freshCats;
                    App.store.session.setCache(App.keys.CACHE_CATEGORIES, freshCats);
                    App.idb.setCategories(freshCats);
                    categoriesChanged = true;
                }
            }

            App.idb.touchSync();

            if (productsChanged || categoriesChanged) {
                App.bus.emit(App.bus.EVENTS.CATALOG_SYNCED, {
                    products: C.products,
                    categories: C.categories,
                    productsChanged: productsChanged,
                    categoriesChanged: categoriesChanged
                });
            }

            return true;

        } catch (e) {
            /* Ağ hatası önbelleği BOZMAZ; kullanıcı eski veriyle devam eder. */
            console.warn('Katalog eşitlenemedi:', e && e.message);
            return false;
        }
    }

    /**
     * Kullanıcı beklemesin: eşitleme daima "ateşle ve unut".
     * `force` verilmez — son eşitlemenin üstünden SYNC_INTERVAL
     * geçmediyse istek hiç atılmaz. Sayfadan sayfaya gezerken her
     * seferinde tüm katalogu yeniden indirmenin anlamı yok.
     */
    function syncInBackground() {
        C.sync(false).catch(function () {});
    }

    /** Periyodik eşitleme — kullanıcı sayfada uzun süre kalırsa. */
    C.startAutoSync = function () {
        C.stopAutoSync();
        _syncTimer = setInterval(function () { C.sync(true); }, App.config.SYNC_INTERVAL);
    };
    C.stopAutoSync = function () {
        if (_syncTimer) { clearInterval(_syncTimer); _syncTimer = null; }
    };

    /* Sekmeye geri dönüldüğünde stok/fiyat bayat olabilir; süre
       dolduysa sessizce tazelenir (dolmadıysa istek atılmaz). */
    document.addEventListener('visibilitychange', function () {
        if (!document.hidden) syncInBackground();
    });

    /* ============================================================
       BELLEKTE ARAMA / SÜZME
       ============================================================ */

    C.findById   = function (id)   { return C.products.find(function (p) { return String(p.ProductId) === String(id); }) || null; };
    C.findBySlug = function (slug) { return C.products.find(function (p) { return p.Slug === slug; }) || null; };

    /**
     * Kategori ve TÜM ALT KATEGORİLERİNİN kimlikleri.
     * Üst kategoriye tıklayan kullanıcı alt dallardaki ürünleri de
     * görmek ister; yalnız birebir eşleşme aramak listeyi boş bırakır.
     */
    C.descendantIds = function (categoryId, categories) {
        var result = [String(categoryId)];
        var tree = categories || C.categories;

        function collectAll(list) {
            (list || []).forEach(function (cat) {
                result.push(String(cat.Id));
                collectAll(cat.SubCategories);
            });
        }
        function walk(list) {
            (list || []).forEach(function (cat) {
                if (String(cat.Id) === String(categoryId)) collectAll(cat.SubCategories);
                else walk(cat.SubCategories);
            });
        }

        walk(tree);
        return result;
    };

    /** Kategoriyi ağaçta bul. */
    C.findCategory = function (categoryId) {
        var found = null;
        (function walk(list) {
            (list || []).forEach(function (cat) {
                if (found) return;
                if (String(cat.Id) === String(categoryId)) { found = cat; return; }
                walk(cat.SubCategories);
            });
        })(C.categories);
        return found;
    };

    /** Bir kategorideki (alt dallar dâhil) ürün sayısı. */
    C.countInCategory = function (categoryId) {
        var ids = C.descendantIds(categoryId);
        return C.products.filter(function (p) {
            return ids.indexOf(String(p.CategoryId)) !== -1;
        }).length;
    };

    /**
     * Metin araması — ad, SKU, barkod ve kısa açıklamada arar.
     * Çoklu boşluk / büyük harf farkı sonucu etkilemesin diye
     * karşılaştırma normalleştirilmiş metin üzerinden yapılır.
     */
    C.search = function (term, list) {
        var needle = App.fmt.searchText(term);
        if (!needle) return [];

        var words = needle.split(' ');
        return (list || C.products).filter(function (p) {
            var hay = App.fmt.searchText(
                (p.Name || '') + ' ' + (p.Sku || '') + ' ' +
                (p.Barcode || '') + ' ' + (p.ShortDescription || '')
            );
            return words.every(function (w) { return hay.indexOf(w) !== -1; });
        });
    };

    /** Öne çıkanlar / yeni gelenler / en çok görüntülenenler. */
    C.featured    = function (n) { return C.products.filter(function (p) { return p.IsFeatured; }).slice(0, n || 8); };
    C.newArrivals = function (n) {
        var list = C.products.filter(function (p) { return p.IsNewArrival; });
        if (!list.length) {
            list = App.utils.sortBy(C.products, function (a, b) {
                return new Date(b.CreatedAt) - new Date(a.CreatedAt);
            });
        }
        return list.slice(0, n || 8);
    };
    C.bestSellers = function (n) {
        return App.utils.sortBy(C.products, function (a, b) {
            return (b.ViewCount || 0) - (a.ViewCount || 0) ||
                   (b.TotalReviewCount || 0) - (a.TotalReviewCount || 0);
        }).slice(0, n || 8);
    };

    /** Aynı kategoriden benzer ürünler (kendisi hariç). */
    C.related = function (product, n) {
        if (!product) return [];
        return C.products.filter(function (p) {
            return String(p.CategoryId) === String(product.CategoryId) &&
                   p.ProductId !== product.ProductId;
        }).slice(0, n || 6);
    };

    /* ============================================================
       TEK ÜRÜN
       ============================================================ */

    /** Detay için: önce bellek, yoksa sunucu (tam kayıt gelir). */
    C.getProduct = async function (idOrSlug) {
        var local = C.findById(idOrSlug) || C.findBySlug(idOrSlug);
        if (local) {
            /* Detay sayfası açıklama/varyant gibi alanları da ister;
               liste yanıtı bunları taşımıyor olabilir — yine de
               ekranı hemen çizebilmek için önce yerel kayıt döner. */
            return local;
        }
        var res = await App.api.products.getById(idOrSlug);
        return (res.success && res.data) ? res.data : null;
    };

    /**
     * Varyant verisi. Uç DİZİ DEĞİL NESNE döndürür
     * ({ Variants, DesignOptions, ColorOptions, ... }); normalleştirme
     * ui/variants.js içindedir, burada ham veri geçilir.
     */
    C.getVariants = async function (productId) {
        var res = await App.api.products.getVariants(productId);
        return (res.success && res.data) ? res.data : null;
    };

    /**
     * Önbelleği tümden at — FAZ 35 (giriş, çıkış, kullanıcı değişimi,
     * bayat oturum). Liste kullanıcının FİYAT LİSTESİYLE ve GÖRÜNÜRLÜK
     * kurallarıyla önbelleğe alındığı için paylaşılan bilgisayarda
     * sonraki oturum öncekinin fiyatlarını / gizli kataloğunu görmesin.
     *
     * Sayfa yönlenmeden önce BEKLENMELİ (IndexedDB işlemi yarıda
     * kalmasın). Hiç reddetmez, en geç 2 sn'de çözülür: giriş/çıkış
     * önbellek yüzünden takılmamalı.
     * @returns {Promise<void>}
     */
    C.clearCache = function () {
        C.stopAutoSync();

        function wipe() {
            C.products = []; C.categories = []; C.loaded = false;
            App.store.session.remove(App.keys.CACHE_PRODUCTS);
            App.store.session.remove(App.keys.CACHE_CATEGORIES);
            return App.idb.clear();
        }

        var work = (async function () {
            await wipe();
            /* Uçuştaki eşitleme eski token'la indirdiğini temizlikten
               SONRA yazar → bitmesini bekleyip bir kez daha temizle. */
            if (_syncPromise) {
                try { await _syncPromise; } catch (e) {}
                await wipe();
            }
        })().catch(function () {});

        return Promise.race([work, App.utils.sleep(2000)]);
    };

    /**
     * FAZ 44 — sunucu bu ürünün artık bu müşteriye GÖRÜNMEDİĞİNİ
     * söyledi (sepete ekleme / detay 404). Önbellekten çizilen kart
     * bir daha "sepete ekle" sunmasın: bellekten hemen düşer, liste
     * arka planda sunucudan tazelenir (açık ekran catalog:synced ile
     * kendini yeniden çizer; IndexedDB ve sessionStorage da yazılır).
     */
    C.forget = function (productId) {
        var id = String(productId);
        var keep = function (p) { return String(p.ProductId) !== id; };
        var before = C.products.length;

        C.products = C.products.filter(keep);

        /* Önbellekler de hemen süzülür: tazeleme "değişiklik yok"
           derse (bellek zaten süzüldü) onları yeniden yazmaz. */
        var cached = App.store.session.getCache(App.keys.CACHE_PRODUCTS);
        if (cached) App.store.session.setCache(App.keys.CACHE_PRODUCTS, cached.filter(keep));
        App.idb.getProducts().then(function (list) {
            if (list) return App.idb.setProducts(list.filter(keep));
        }).catch(function () {});

        if (C.products.length !== before) {
            App.bus.emit(App.bus.EVENTS.CATALOG_SYNCED, {
                products: C.products, categories: C.categories,
                productsChanged: true, categoriesChanged: false
            });
        }
        C.sync(true).catch(function () {});
    };

    App.catalog = C;

})(window.App);
