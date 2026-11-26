/* ============================================================
   i18n/tr.js — TÜRKÇE SÖZLÜK
   Anahtar yapısı tüm dillerde AYNIDIR. Yeni bir metin eklerken
   dört dosyaya birden eklenir; eksik anahtar ekranda anahtarın
   kendisi olarak görünür (sessizce boş kalmaz).
   ============================================================ */

App.i18n.register('tr', {

    common: {
        home: 'Ana sayfa', shop: 'Mağaza', search: 'Ara', loading: 'Yükleniyor…',
        all: 'Tümü', apply: 'Uygula', reset: 'Sıfırla', clear: 'Temizle',
        save: 'Kaydet', cancel: 'Vazgeç', confirm: 'Emin misiniz?', confirmOk: 'Evet, devam et',
        close: 'Kapat', back: 'Geri', next: 'İleri', prev: 'Önceki', of: '/',
        yes: 'Evet', no: 'Hayır', edit: 'Düzenle', delete: 'Sil', remove: 'Kaldır',
        viewAll: 'Tümünü gör', showMore: 'Daha fazla', required: 'Zorunlu', optional: 'İsteğe bağlı',
        priceOnRequest: 'Fiyat için sorunuz',
        priceOnRequestHint: 'Fiyatları görmek için giriş yapın',
        quantity: 'Adet', total: 'Toplam', subtotal: 'Ara toplam',
        error: 'Bir hata oluştu', retry: 'Tekrar dene', copy: 'Kopyala', copied: 'Kopyalandı',
        pcs: 'adet', free: 'Ücretsiz', from: 'başlangıç', notSpecified: '—'
    },

    nav: {
        home: 'Ana sayfa', catalog: 'Katalog', shop: 'Tüm ürünler',
        newArrivals: 'Yeni gelenler', bestSellers: 'Çok satanlar',
        deals: 'Fırsatlar', about: 'Hakkımızda', contact: 'İletişim',
        delivery: 'Teslimat', returns: 'İade'
    },

    header: {
        announce: 'Kazakistan geneline hızlı teslimat',
        announceStrong: '5 000 ₸ üzeri kargo bedava',
        language: 'Dil', account: 'Hesap', myAccount: 'Hesabım', orders: 'Siparişlerim',
        wishlist: 'Favoriler', compare: 'Karşılaştır', cart: 'Sepet',
        login: 'Giriş yap', register: 'Kayıt ol', logout: 'Çıkış yap',
        searchPlaceholder: 'Ürün, kod veya barkod ara…',
        allCategories: 'Tüm kategoriler', viewCart: 'Sepete git', checkout: 'Ödemeye geç',
        cartEmpty: 'Sepetiniz boş', searchMore: 'Tüm sonuçları gör',
        searchEmpty: 'Sonuç bulunamadı', greeting: 'Merhaba'
    },

    footer: {
        aboutText: 'Pencere, kapı ve alüminyum profil sistemleri için endüstriyel donanım. Doğrudan üreticiden, stoktan teslim.',
        shop: 'Mağaza', company: 'Kurumsal', help: 'Yardım', contact: 'İletişim',
        newsletter: 'Bülten', newsletterText: 'Yeni ürünler ve kampanyalardan haberdar olun.',
        emailPlaceholder: 'E-posta adresiniz', subscribe: 'Abone ol',
        subscribed: 'Bültene kaydınız alındı',
        rights: 'Tüm hakları saklıdır.', payments: 'Ödeme yöntemleri'
    },

    home: {
        heroEyebrow: 'Endüstriyel donanım',
        heroTitle: 'Profil sistemleri için',
        heroTitleStrong: 'hassas donanım',
        heroText: 'Pencere ve kapı mekanizmaları, menteşeler, kilitler ve aksesuarlar. Stoktan teslim, bayi fiyatlarıyla.',
        heroCta: 'Katalogu keşfet', heroCta2: 'Bayi ol',
        statProducts: 'Ürün', statCategories: 'Kategori', statBrands: 'Marka', statSupport: 'Destek',
        perk1: 'Hızlı teslimat', perk1s: 'Kazakistan geneli 1–3 gün',
        perk2: 'Orijinal ürün', perk2s: 'Doğrudan üreticiden',
        perk3: 'Güvenli ödeme', perk3s: 'Kart, havale veya vadeli',
        perk4: 'Uzman desteği', perk4s: 'Teknik danışmanlık',
        categories: 'Kategoriler', categoriesSub: 'Aradığınız parçaya en kısa yoldan ulaşın',
        newArrivals: 'Yeni gelenler', newArrivalsSub: 'Katalogdaki en son eklenen ürünler',
        bestSellers: 'Çok tercih edilenler', bestSellersSub: 'Ustaların en sık sipariş ettiği parçalar',
        featured: 'Öne çıkanlar', featuredSub: 'Editör seçimi ürünler',
        promoLabel: 'Bayi programı', promoTitle: 'Toplu alımda özel fiyat',
        promoText: 'Şirket hesabı açın, size özel fiyat kategorisi ve vadeli ödeme imkânından yararlanın.',
        promoCta: 'Bayi başvurusu',
        promo2Label: 'Teknik destek', promo2Title: 'Doğru parçayı birlikte seçelim',
        promo2Text: 'Projenize uygun mekanizmayı seçmek için uzman ekibimize danışın.',
        promo2Cta: 'İletişime geç'
    },

    shop: {
        title: 'Tüm ürünler', filters: 'Filtreler', categories: 'Kategoriler',
        price: 'Fiyat aralığı', priceMin: 'En az', priceMax: 'En çok',
        stock: 'Stok durumu', inStockOnly: 'Sadece stokta olanlar', outOfStock: 'Tükenenler',
        clearFilters: 'Filtreleri temizle', applyPrice: 'Uygula',
        sortBy: 'Sırala', sortDefault: 'Varsayılan', sortPriceLow: 'Fiyat: düşükten yükseğe',
        sortPriceHigh: 'Fiyat: yüksekten düşüğe', sortNewest: 'En yeni',
        sortPopular: 'En popüler', sortRating: 'En yüksek puan',
        perPage: 'Sayfa başına', showing: 'Gösterilen', results: 'ürün',
        noResults: 'Ürün bulunamadı',
        noResultsText: 'Filtreleri değiştirmeyi ya da başka bir arama yapmayı deneyin.',
        gridView: 'Izgara görünümü', listView: 'Liste görünümü',
        searchResults: 'Arama sonuçları', searchFor: 'Arama',
        minChars: 'En az 2 karakter girin'
    },

    product: {
        addToCart: 'Sepete ekle', buyNow: 'Hemen al', sku: 'Ürün kodu', barcode: 'Barkod',
        category: 'Kategori', availability: 'Durum', stockAmount: 'Stok',
        description: 'Açıklama', specifications: 'Teknik özellikler', reviews: 'Değerlendirmeler',
        related: 'Benzer ürünler', share: 'Paylaş',
        weight: 'Ağırlık', weightNet: 'Net ağırlık', weightGross: 'Brüt ağırlık',
        dimensions: 'Ölçüler', width: 'Genişlik', height: 'Yükseklik', depth: 'Derinlik',
        volume: 'Hacim', unitsPerBox: 'Kutu içi adet', size: 'Ebat', vat: 'KDV oranı',
        company: 'Tedarikçi', variants: 'Seçenekler',
        noDescription: 'Bu ürün için açıklama girilmemiş.',
        notFound: 'Ürün bulunamadı', notFoundText: 'Aradığınız ürün kaldırılmış olabilir.',
        addedToCart: 'sepete eklendi'
    },

    stock: { inStock: 'Stokta', preOrder: 'Ön sipariş', outOfStock: 'Tükendi', pieces: 'adet' },

    badge: { new: 'Yeni', featured: 'Öne çıkan', discount: 'İndirim' },

    cart: {
        title: 'Sepetim', empty: 'Sepetiniz boş',
        emptyText: 'Alışverişe başlamak için ürünlere göz atın.',
        continueShopping: 'Alışverişe devam et',
        product: 'Ürün', price: 'Fiyat', quantity: 'Adet', subtotal: 'Ara toplam',
        total: 'Genel toplam', remove: 'Kaldır', clearCart: 'Sepeti boşalt',
        checkout: 'Ödemeye geç', summary: 'Sipariş özeti', items: 'ürün',
        shipping: 'Kargo', shippingCalc: 'Ödeme adımında hesaplanır',
        splitNote: 'Siparişiniz {count} ayrı siparişe bölünecek — her şirket kendi gönderimini yapar.',
        otherCompany: 'Diğer',
        toAddToCart: 'ürünü sepete eklemek için',
        added: 'sepete eklendi', addError: 'Sepete eklenemedi',
        productNotFound: 'Ürün bulunamadı', invalidQuantity: 'Geçersiz miktar',
        updateError: 'Miktar güncellenemedi', removed: 'Ürün sepetten kaldırıldı',
        removeError: 'Ürün kaldırılamadı', cleared: 'Sepet temizlendi',
        clearError: 'Sepet temizlenemedi',
        confirmRemove: 'Bu ürünü sepetten kaldırmak istediğinize emin misiniz?',
        confirmClear: 'Sepetteki tüm ürünler kaldırılacak. Onaylıyor musunuz?',
        loginToView: 'Sepetinizi görmek için giriş yapın'
    },

    wishlist: {
        title: 'Favorilerim', empty: 'Favori listeniz boş',
        emptyText: 'Beğendiğiniz ürünleri kalp simgesiyle buraya ekleyin.',
        toAdd: 'favorilere eklemek için',
        added: 'Favorilere eklendi', removed: 'Favorilerden çıkarıldı',
        removeError: 'Çıkarılamadı', moveToCart: 'Sepete taşı',
        loginToView: 'Favorilerinizi görmek için giriş yapın',
        addedOn: 'Eklenme'
    },

    compare: {
        title: 'Karşılaştırma', empty: 'Karşılaştırma listeniz boş',
        emptyText: 'Ürün kartlarındaki karşılaştır simgesiyle en fazla 4 ürün ekleyin.',
        toCompare: 'karşılaştırmak için',
        added: 'Karşılaştırmaya eklendi', removed: 'Karşılaştırmadan çıkarıldı',
        removeError: 'Çıkarılamadı', cleared: 'Karşılaştırma listesi temizlendi',
        clearError: 'Liste temizlenemedi', clearAll: 'Listeyi temizle',
        alreadyIn: 'Ürün zaten karşılaştırma listesinde',
        sameCategory: 'Yalnız aynı kategorideki ürünler karşılaştırılabilir',
        limit: 'En fazla {n} ürün karşılaştırılabilir',
        error: 'Karşılaştırmaya eklenemedi',
        product: 'Ürün', price: 'Fiyat', availability: 'Stok durumu',
        category: 'Kategori', sku: 'Ürün kodu', weight: 'Ağırlık',
        dimensions: 'Ölçüler', rating: 'Puan', company: 'Tedarikçi',
        loginToView: 'Karşılaştırma listenizi görmek için giriş yapın'
    },

    checkout: {
        title: 'Ödeme', steps: { cart: 'Sepet', checkout: 'Ödeme', done: 'Tamamlandı' },
        shippingAddress: 'Teslimat adresi', billingAddress: 'Fatura adresi',
        sameAsShipping: 'Fatura adresi teslimat adresiyle aynı',
        addAddress: 'Adres ekle', editAddress: 'Düzenle',
        noShipping: 'Lütfen bir teslimat adresi ekleyin',
        noBilling: 'Lütfen bir fatura adresi ekleyin',
        paymentMethod: 'Ödeme yöntemi',
        payCard: 'Kredi / banka kartı', payCardDesc: 'Güvenli ödeme sayfasına yönlendirilirsiniz',
        payTransfer: 'Havale / EFT', payTransferDesc: 'Banka bilgileri sipariş sonrası iletilir',
        payCod: 'Kapıda ödeme', payCodDesc: 'Teslimatta nakit veya kart',
        payApproval: 'Vadeli (onaya tabi)', payApprovalDesc: 'Siparişiniz yönetici onayına düşer',
        orderNotes: 'Sipariş notu', orderNotesHint: 'Teslimat için özel bir talebiniz varsa yazın',
        coupon: 'İndirim kodu', applyCoupon: 'Uygula',
        orderSummary: 'Sipariş özeti', placeOrder: 'Siparişi tamamla',
        editCart: 'Sepeti düzenle', creating: 'Siparişiniz oluşturuluyor…',
        emptyCart: 'Sepetiniz boş, ödeme yapılamaz',
        transferOnlyNote: 'Şu anda yalnız havale ile ödeme kabul edilmektedir.',
        willSplit: 'Sepetiniz {count} ayrı siparişe bölünecek.'
    },

    order: {
        title: 'Sipariş', number: 'Sipariş no', groupNumber: 'Alışveriş no',
        date: 'Tarih', total: 'Tutar', items: 'Ürün', statusLabel: 'Durum',
        paymentStatus: 'Ödeme', paymentMethod: 'Ödeme yöntemi',
        thanks: 'Siparişiniz alındı', thanksText: 'Sipariş ayrıntılarını e-posta ile gönderdik.',
        splitInfo: 'Siparişiniz tedarikçiye göre {count} parçaya ayrıldı.',
        viewOrder: 'Siparişi görüntüle', trackOrder: 'Siparişi takip et',
        backToShop: 'Alışverişe devam et', createError: 'Sipariş oluşturulamadı',
        notFound: 'Sipariş bulunamadı',
        bankDetails: 'Banka bilgileri', bankName: 'Banka', account: 'Hesap / IBAN',
        bin: 'BIN', beneficiary: 'Alıcı', purpose: 'Ödeme açıklaması',
        noOrders: 'Henüz siparişiniz yok', noOrdersText: 'İlk siparişinizi vermek için katalogu inceleyin.',
        status: {
            pending: 'Beklemede', confirmed: 'Onaylandı', processing: 'Hazırlanıyor',
            shipped: 'Kargoda', delivered: 'Teslim edildi', cancelled: 'İptal edildi',
            onHold: 'Askıda', refunded: 'İade edildi'
        },
        payment: {
            paid: 'Ödendi', pending: 'Bekliyor', failed: 'Başarısız', refunded: 'İade edildi'
        },
        method: {
            cod: 'Kapıda ödeme', transfer: 'Havale / EFT',
            card: 'Kredi kartı', approval: 'Onay bekliyor'
        }
    },

    account: {
        title: 'Hesabım', dashboard: 'Özet', orders: 'Siparişlerim',
        addresses: 'Adreslerim', wishlist: 'Favorilerim', reviews: 'Değerlendirmelerim',
        settings: 'Hesap ayarları', logout: 'Çıkış yap',
        welcome: 'Hoş geldiniz', welcomeText: 'Hesap özetinizi buradan takip edebilirsiniz.',
        totalOrders: 'Toplam sipariş', pendingOrders: 'Bekleyen sipariş',
        wishlistItems: 'Favori ürün', totalSpent: 'Toplam harcama',
        recentOrders: 'Son siparişler',
        profile: 'Profil bilgileri', fullName: 'Ad soyad', email: 'E-posta',
        phone: 'Telefon', accountType: 'Hesap türü', priceCategory: 'Fiyat kategorisi',
        iin: 'BIN / İIN', companyName: 'Şirket adı',
        changePassword: 'Şifre değiştir', currentPassword: 'Mevcut şifre',
        newPassword: 'Yeni şifre', confirmPassword: 'Yeni şifre (tekrar)',
        passwordChanged: 'Şifreniz güncellendi',
        passwordMismatch: 'Şifreler eşleşmiyor',
        noReviews: 'Henüz değerlendirme yapmadınız',
        confirmLogout: 'Çıkış yapmak istediğinize emin misiniz?'
    },

    address: {
        title: 'Adreslerim', billing: 'Fatura adresi', shipping: 'Teslimat adresi',
        add: 'Adres ekle', edit: 'Adresi düzenle',
        fullName: 'Ad soyad', company: 'Şirket / başlık', addressLine: 'Adres',
        addressLine2: 'Adres devamı', city: 'Şehir', district: 'İlçe',
        neighborhood: 'Mahalle', country: 'Ülke', postcode: 'Posta kodu',
        phone: 'Telefon', email: 'E-posta',
        noAddress: 'Kayıtlı adres yok', saved: 'Adres kaydedildi',
        saveError: 'Adres kaydedilemedi', removed: 'Adres silindi',
        removeError: 'Adres silinemedi',
        fillRequired: 'Lütfen zorunlu alanları doldurun',
        noShipping: 'Önce teslimat adresi ekleyin',
        companyLocked: 'Şirket fatura adresi 1C kayıtlarından gelir ve değiştirilemez.'
    },

    review: {
        title: 'Değerlendirmeler', write: 'Değerlendirme yaz',
        rating: 'Puanınız', reviewTitle: 'Başlık', comment: 'Yorumunuz',
        submit: 'Gönder', submitted: 'Değerlendirmeniz gönderildi',
        updated: 'Değerlendirme güncellendi', error: 'Değerlendirme gönderilemedi',
        needPurchase: 'Yalnız satın aldığınız ürünleri değerlendirebilirsiniz',
        already: 'Bu ürünü zaten değerlendirdiniz',
        toReview: 'değerlendirme yapmak için',
        none: 'Henüz değerlendirme yok', noneText: 'Bu ürünü ilk değerlendiren siz olun.',
        count: 'değerlendirme', basedOn: 'değerlendirmeye göre'
    },

    auth: {
        login: 'Giriş yap', register: 'Kayıt ol', signIn: 'giriş yapın', signUp: 'kayıt olun',
        pleaseSignIn: 'Lütfen',
        email: 'E-posta', password: 'Şifre', rememberMe: 'Beni hatırla',
        forgotPassword: 'Şifremi unuttum', noAccount: 'Hesabınız yok mu?',
        haveAccount: 'Zaten hesabınız var mı?',
        loginTitle: 'Tekrar hoş geldiniz', loginSub: 'Hesabınıza giriş yaparak devam edin.',
        registerTitle: 'Hesap oluştur', registerSub: 'Bayi fiyatları ve sipariş takibi için kayıt olun.',
        loginSuccess: 'Giriş başarılı, yönlendiriliyorsunuz…',
        allFieldsRequired: 'Lütfen tüm alanları doldurun',
        sessionMissing: 'Oturum bulunamadı',
        name: 'Ad', surname: 'Soyad', phone: 'Telefon',
        accountType: 'Hesap türü', individual: 'Bireysel', company: 'Şirket / bayi',
        iin: 'BIN / İIN', iinHint: '12 haneli kimlik numarası',
        agreeTerms: 'Kullanım koşullarını ve gizlilik politikasını kabul ediyorum',
        mustAgree: 'Devam etmek için koşulları kabul etmelisiniz',
        registerSuccess: 'Kaydınız oluşturuldu',
        registrationClosed: 'Kayıt geçici olarak kapalıdır',
        registrationClosedText: 'Yeni hesap açılışı şu anda durdurulmuştur. Giriş yapabilirsiniz.',
        passwordShort: 'Şifre en az 6 karakter olmalı',
        emailInvalid: 'Geçerli bir e-posta adresi girin',
        otpTitle: 'Doğrulama kodu', otpText: '{target} adresine gönderilen 6 haneli kodu girin.',
        otpVerify: 'Doğrula', otpResend: 'Kodu tekrar gönder',
        otpResendIn: 'Tekrar gönder ({s} sn)', otpInvalid: 'Kod hatalı veya süresi dolmuş',
        otpSent: 'Doğrulama kodu gönderildi',
        forgotTitle: 'Şifre sıfırlama', forgotText: 'Kayıtlı e-posta adresinizi girin, size kod gönderelim.',
        forgotSend: 'Kod gönder', resetTitle: 'Yeni şifre belirle',
        resetSuccess: 'Şifreniz güncellendi, giriş yapabilirsiniz'
    },

    notFound: {
        title: 'Sayfa bulunamadı',
        text: 'Aradığınız sayfa taşınmış ya da silinmiş olabilir.',
        cta: 'Ana sayfaya dön'
    },

    /* FAZ 44 — sepette kalmış ama artık görünmeyen kalemler (kaynak
       projede sessizce silinir; burada gösterilir, kullanıcı siler). */
    customerRules: {
        unavailableInCartNote: 'Bu ürün artık mevcut değil. Lütfen sepetinizden çıkarın.',
        unavailableCheckout: 'Bu ürünler artık mevcut değil: {names}. Sipariş verebilmek için sepetinizden çıkarın.'
    },

    /* Henüz belli olmayan değerlerin görünür yer tutucuları (K2.17, DURUM.md §4). */
    site: {
        pending: {
            phone: '[telefon netleştirilecek]',
            email: '[e-posta netleştirilecek]',
            site: '[site adresi netleştirilecek]'
        },
        contactPending: 'Destek e-posta adresi henüz yayımlanmadı. Lütfen giriş yapıp destek sohbetinden bize yazın.'
    }
});
