/* ============================================================
   i18n/ru.js — РУССКИЙ СЛОВАРЬ
   Структура ключей ОДИНАКОВА во всех языковых файлах.
   ============================================================ */

App.i18n.register('ru', {

    common: {
        home: 'Главная', shop: 'Магазин', search: 'Поиск', loading: 'Загрузка…',
        all: 'Все', apply: 'Применить', reset: 'Сбросить', clear: 'Очистить',
        save: 'Сохранить', cancel: 'Отмена', confirm: 'Вы уверены?', confirmOk: 'Да, продолжить',
        close: 'Закрыть', back: 'Назад', next: 'Далее', prev: 'Назад', of: 'из',
        yes: 'Да', no: 'Нет', edit: 'Изменить', delete: 'Удалить', remove: 'Убрать',
        viewAll: 'Смотреть все', showMore: 'Показать ещё', required: 'Обязательно', optional: 'Необязательно',
        priceOnRequest: 'Цена по запросу',
        priceOnRequestHint: 'Войдите, чтобы увидеть цены',
        quantity: 'Кол-во', total: 'Итого', subtotal: 'Подытог',
        error: 'Произошла ошибка', retry: 'Повторить', copy: 'Копировать', copied: 'Скопировано',
        pcs: 'шт', free: 'Бесплатно', from: 'от', notSpecified: '—'
    },

    nav: {
        home: 'Главная', catalog: 'Каталог', shop: 'Все товары',
        newArrivals: 'Новинки', bestSellers: 'Хиты продаж',
        deals: 'Акции', about: 'О компании', contact: 'Контакты',
        delivery: 'Доставка', returns: 'Возврат'
    },

    header: {
        announce: 'Быстрая доставка по Казахстану',
        announceStrong: 'Бесплатно от 5 000 ₸',
        language: 'Язык', account: 'Кабинет', myAccount: 'Мой кабинет', orders: 'Мои заказы',
        wishlist: 'Избранное', compare: 'Сравнение', cart: 'Корзина',
        login: 'Войти', register: 'Регистрация', logout: 'Выйти',
        searchPlaceholder: 'Поиск по названию, артикулу или штрихкоду…',
        allCategories: 'Все категории', viewCart: 'В корзину', checkout: 'Оформить заказ',
        cartEmpty: 'Корзина пуста', searchMore: 'Показать все результаты',
        searchEmpty: 'Ничего не найдено', greeting: 'Здравствуйте'
    },

    footer: {
        aboutText: 'Промышленная фурнитура для оконных, дверных и алюминиевых профильных систем. Напрямую от производителя, со склада.',
        shop: 'Магазин', company: 'Компания', help: 'Помощь', contact: 'Контакты',
        newsletter: 'Рассылка', newsletterText: 'Узнавайте о новинках и акциях первыми.',
        emailPlaceholder: 'Ваш e-mail', subscribe: 'Подписаться',
        subscribed: 'Вы подписаны на рассылку',
        rights: 'Все права защищены.', payments: 'Способы оплаты'
    },

    home: {
        heroEyebrow: 'Промышленная фурнитура',
        heroTitle: 'Точная фурнитура для',
        heroTitleStrong: 'профильных систем',
        heroText: 'Оконные и дверные механизмы, петли, замки и комплектующие. Со склада, по дилерским ценам.',
        heroCta: 'Открыть каталог', heroCta2: 'Стать дилером',
        statProducts: 'Товаров', statCategories: 'Категорий', statBrands: 'Брендов', statSupport: 'Поддержка',
        perk1: 'Быстрая доставка', perk1s: '1–3 дня по Казахстану',
        perk2: 'Оригинальные детали', perk2s: 'Напрямую от производителя',
        perk3: 'Безопасная оплата', perk3s: 'Карта, перевод или отсрочка',
        perk4: 'Поддержка специалистов', perk4s: 'Техническая консультация',
        categories: 'Категории', categoriesSub: 'Кратчайший путь к нужной детали',
        newArrivals: 'Новинки', newArrivalsSub: 'Последние поступления в каталог',
        bestSellers: 'Чаще всего заказывают', bestSellersSub: 'Детали, которые мастера берут снова и снова',
        featured: 'Рекомендуем', featuredSub: 'Отобранные товары',
        promoLabel: 'Дилерская программа', promoTitle: 'Особые цены на оптовые заказы',
        promoText: 'Откройте корпоративный счёт и получите свою ценовую категорию и отсрочку платежа.',
        promoCta: 'Оставить заявку',
        promo2Label: 'Техподдержка', promo2Title: 'Подберём нужную деталь вместе',
        promo2Text: 'Спросите наших инженеров, какой механизм подойдёт вашему проекту.',
        promo2Cta: 'Связаться'
    },

    shop: {
        title: 'Все товары', filters: 'Фильтры', categories: 'Категории',
        price: 'Цена', priceMin: 'от', priceMax: 'до',
        stock: 'Наличие', inStockOnly: 'Только в наличии', outOfStock: 'Нет в наличии',
        clearFilters: 'Сбросить фильтры', applyPrice: 'Применить',
        sortBy: 'Сортировка', sortDefault: 'По умолчанию', sortPriceLow: 'Цена: по возрастанию',
        sortPriceHigh: 'Цена: по убыванию', sortNewest: 'Сначала новые',
        sortPopular: 'По популярности', sortRating: 'По рейтингу',
        perPage: 'На странице', showing: 'Показано', results: 'товаров',
        noResults: 'Товары не найдены',
        noResultsText: 'Попробуйте изменить фильтры или поискать иначе.',
        gridView: 'Плитка', listView: 'Список',
        searchResults: 'Результаты поиска', searchFor: 'Поиск',
        minChars: 'Введите минимум 2 символа'
    },

    product: {
        addToCart: 'В корзину', buyNow: 'Купить сейчас', sku: 'Артикул', barcode: 'Штрихкод',
        category: 'Категория', availability: 'Наличие', stockAmount: 'На складе',
        description: 'Описание', specifications: 'Характеристики', reviews: 'Отзывы',
        related: 'Похожие товары', share: 'Поделиться',
        weight: 'Вес', weightNet: 'Вес нетто', weightGross: 'Вес брутто',
        dimensions: 'Габариты', width: 'Ширина', height: 'Высота', depth: 'Глубина',
        volume: 'Объём', unitsPerBox: 'В упаковке', size: 'Размер', vat: 'Ставка НДС',
        company: 'Поставщик', variants: 'Варианты',
        noDescription: 'Для этого товара описание не указано.',
        notFound: 'Товар не найден', notFoundText: 'Возможно, товар был снят с продажи.',
        addedToCart: 'добавлен в корзину'
    },

    stock: { inStock: 'В наличии', preOrder: 'Предзаказ', outOfStock: 'Нет в наличии', pieces: 'шт' },

    badge: { new: 'Новинка', featured: 'Хит', discount: 'Скидка' },

    cart: {
        title: 'Корзина', empty: 'Ваша корзина пуста',
        emptyText: 'Загляните в каталог, чтобы начать покупки.',
        continueShopping: 'Продолжить покупки',
        product: 'Товар', price: 'Цена', quantity: 'Кол-во', subtotal: 'Подытог',
        total: 'Итого', remove: 'Убрать', clearCart: 'Очистить корзину',
        checkout: 'Оформить заказ', summary: 'Ваш заказ', items: 'товаров',
        shipping: 'Доставка', shippingCalc: 'Рассчитается при оформлении',
        splitNote: 'Ваш заказ будет разделён на {count} отдельных заказа — каждая компания отгружает сама.',
        otherCompany: 'Прочее',
        toAddToCart: 'чтобы добавить товар в корзину',
        added: 'добавлен в корзину', addError: 'Не удалось добавить в корзину',
        productNotFound: 'Товар не найден', invalidQuantity: 'Неверное количество',
        updateError: 'Не удалось изменить количество', removed: 'Товар удалён из корзины',
        removeError: 'Не удалось удалить товар', cleared: 'Корзина очищена',
        clearError: 'Не удалось очистить корзину',
        confirmRemove: 'Удалить этот товар из корзины?',
        confirmClear: 'Все товары будут удалены из корзины. Продолжить?',
        loginToView: 'Войдите, чтобы увидеть корзину'
    },

    wishlist: {
        title: 'Избранное', empty: 'В избранном пока пусто',
        emptyText: 'Нажмите на сердечко у товара, чтобы сохранить его здесь.',
        toAdd: 'чтобы добавить в избранное',
        added: 'Добавлено в избранное', removed: 'Удалено из избранного',
        removeError: 'Не удалось удалить', moveToCart: 'В корзину',
        loginToView: 'Войдите, чтобы увидеть избранное',
        addedOn: 'Добавлено'
    },

    compare: {
        title: 'Сравнение', empty: 'Список сравнения пуст',
        emptyText: 'Добавьте до 4 товаров значком сравнения на карточке.',
        toCompare: 'чтобы сравнить товары',
        added: 'Добавлено к сравнению', removed: 'Удалено из сравнения',
        removeError: 'Не удалось удалить', cleared: 'Список сравнения очищен',
        clearError: 'Не удалось очистить список', clearAll: 'Очистить список',
        alreadyIn: 'Товар уже в списке сравнения',
        sameCategory: 'Сравнивать можно только товары одной категории',
        limit: 'Можно сравнить не более {n} товаров',
        error: 'Не удалось добавить к сравнению',
        product: 'Товар', price: 'Цена', availability: 'Наличие',
        category: 'Категория', sku: 'Артикул', weight: 'Вес',
        dimensions: 'Габариты', rating: 'Рейтинг', company: 'Поставщик',
        loginToView: 'Войдите, чтобы увидеть список сравнения'
    },

    checkout: {
        title: 'Оформление заказа', steps: { cart: 'Корзина', checkout: 'Оформление', done: 'Готово' },
        shippingAddress: 'Адрес доставки', billingAddress: 'Адрес для счёта',
        sameAsShipping: 'Адрес для счёта совпадает с адресом доставки',
        addAddress: 'Добавить адрес', editAddress: 'Изменить',
        noShipping: 'Пожалуйста, добавьте адрес доставки',
        noBilling: 'Пожалуйста, добавьте адрес для счёта',
        paymentMethod: 'Способ оплаты',
        payCard: 'Банковская карта', payCardDesc: 'Вы перейдёте на защищённую страницу оплаты',
        payTransfer: 'Банковский перевод', payTransferDesc: 'Реквизиты придут после оформления',
        payCod: 'Оплата при получении', payCodDesc: 'Наличными или картой курьеру',
        payApproval: 'Отсрочка (по согласованию)', payApprovalDesc: 'Заказ уйдёт на подтверждение менеджеру',
        orderNotes: 'Комментарий к заказу', orderNotesHint: 'Особые пожелания по доставке',
        coupon: 'Промокод', applyCoupon: 'Применить',
        orderSummary: 'Ваш заказ', placeOrder: 'Оформить заказ',
        editCart: 'Изменить корзину', creating: 'Создаём ваш заказ…',
        emptyCart: 'Корзина пуста, оформление недоступно',
        transferOnlyNote: 'Сейчас принимается оплата только банковским переводом.',
        willSplit: 'Корзина будет разделена на {count} заказа.'
    },

    order: {
        title: 'Заказ', number: '№ заказа', groupNumber: '№ покупки',
        date: 'Дата', total: 'Сумма', items: 'Товары', statusLabel: 'Статус',
        paymentStatus: 'Оплата', paymentMethod: 'Способ оплаты',
        thanks: 'Спасибо за заказ', thanksText: 'Детали заказа отправлены вам на почту.',
        splitInfo: 'Покупка разделена на {count} заказа по поставщикам.',
        viewOrder: 'Открыть заказ', trackOrder: 'Отследить заказ',
        backToShop: 'Продолжить покупки', createError: 'Не удалось создать заказ',
        notFound: 'Заказ не найден',
        bankDetails: 'Банковские реквизиты', bankName: 'Банк', account: 'Счёт / IBAN',
        bin: 'БИН', beneficiary: 'Получатель', purpose: 'Назначение платежа',
        noOrders: 'Заказов пока нет', noOrdersText: 'Загляните в каталог, чтобы сделать первый заказ.',
        status: {
            pending: 'В обработке', confirmed: 'Подтверждён', processing: 'Собирается',
            shipped: 'Отправлен', delivered: 'Доставлен', cancelled: 'Отменён',
            onHold: 'Приостановлен', refunded: 'Возвращён'
        },
        payment: {
            paid: 'Оплачен', pending: 'Ожидает оплаты', failed: 'Ошибка оплаты', refunded: 'Возврат'
        },
        method: {
            cod: 'При получении', transfer: 'Банковский перевод',
            card: 'Банковская карта', approval: 'Ожидает подтверждения'
        }
    },

    account: {
        title: 'Личный кабинет', dashboard: 'Обзор', orders: 'Мои заказы',
        addresses: 'Адреса', wishlist: 'Избранное', reviews: 'Мои отзывы',
        settings: 'Настройки', logout: 'Выйти',
        welcome: 'Добро пожаловать', welcomeText: 'Здесь собрана вся активность вашего аккаунта.',
        totalOrders: 'Всего заказов', pendingOrders: 'В обработке',
        wishlistItems: 'В избранном', totalSpent: 'Всего потрачено',
        recentOrders: 'Последние заказы',
        profile: 'Профиль', fullName: 'Имя и фамилия', email: 'E-mail',
        phone: 'Телефон', accountType: 'Тип аккаунта', priceCategory: 'Ценовая категория',
        iin: 'БИН / ИИН', companyName: 'Название компании',
        changePassword: 'Смена пароля', currentPassword: 'Текущий пароль',
        newPassword: 'Новый пароль', confirmPassword: 'Повторите новый пароль',
        passwordChanged: 'Пароль обновлён',
        passwordMismatch: 'Пароли не совпадают',
        noReviews: 'Вы ещё не оставляли отзывов',
        confirmLogout: 'Выйти из аккаунта?'
    },

    address: {
        title: 'Адреса', billing: 'Адрес для счёта', shipping: 'Адрес доставки',
        add: 'Добавить адрес', edit: 'Изменить адрес',
        fullName: 'Имя и фамилия', company: 'Компания / название', addressLine: 'Адрес',
        addressLine2: 'Адрес (продолжение)', city: 'Город', district: 'Район',
        neighborhood: 'Микрорайон', country: 'Страна', postcode: 'Индекс',
        phone: 'Телефон', email: 'E-mail',
        noAddress: 'Сохранённых адресов нет', saved: 'Адрес сохранён',
        saveError: 'Не удалось сохранить адрес', removed: 'Адрес удалён',
        removeError: 'Не удалось удалить адрес',
        fillRequired: 'Заполните обязательные поля',
        noShipping: 'Сначала добавьте адрес доставки',
        companyLocked: 'Адрес для счёта компании берётся из 1С и не редактируется.'
    },

    review: {
        title: 'Отзывы', write: 'Написать отзыв',
        rating: 'Ваша оценка', reviewTitle: 'Заголовок', comment: 'Ваш отзыв',
        submit: 'Отправить', submitted: 'Ваш отзыв отправлен',
        updated: 'Отзыв обновлён', error: 'Не удалось отправить отзыв',
        needPurchase: 'Оставлять отзыв можно только на купленные товары',
        already: 'Вы уже оставили отзыв на этот товар',
        toReview: 'чтобы оставить отзыв',
        none: 'Отзывов пока нет', noneText: 'Станьте первым, кто оставит отзыв.',
        count: 'отзывов', basedOn: 'на основе'
    },

    auth: {
        login: 'Вход', register: 'Регистрация', signIn: 'войдите', signUp: 'зарегистрируйтесь',
        pleaseSignIn: 'Пожалуйста,',
        email: 'E-mail', password: 'Пароль', rememberMe: 'Запомнить меня',
        forgotPassword: 'Забыли пароль?', noAccount: 'Нет аккаунта?',
        haveAccount: 'Уже есть аккаунт?',
        loginTitle: 'С возвращением', loginSub: 'Войдите в аккаунт, чтобы продолжить.',
        registerTitle: 'Создать аккаунт', registerSub: 'Регистрация даёт дилерские цены и отслеживание заказов.',
        loginSuccess: 'Вход выполнен, перенаправляем…',
        allFieldsRequired: 'Заполните все поля',
        sessionMissing: 'Сессия не найдена',
        name: 'Имя', surname: 'Фамилия', phone: 'Телефон',
        accountType: 'Тип аккаунта', individual: 'Физическое лицо', company: 'Компания / дилер',
        iin: 'БИН / ИИН', iinHint: '12-значный идентификационный номер',
        agreeTerms: 'Я принимаю условия использования и политику конфиденциальности',
        mustAgree: 'Для продолжения примите условия',
        registerSuccess: 'Аккаунт создан',
        registrationClosed: 'Регистрация временно закрыта',
        registrationClosedText: 'Новые аккаунты сейчас не создаются. Вход по-прежнему доступен.',
        passwordShort: 'Пароль должен быть не короче 6 символов',
        emailInvalid: 'Введите корректный e-mail',
        otpTitle: 'Код подтверждения', otpText: 'Введите 6-значный код, отправленный на {target}.',
        otpVerify: 'Подтвердить', otpResend: 'Отправить код заново',
        otpResendIn: 'Повтор через {s} с', otpInvalid: 'Код неверный или истёк',
        otpSent: 'Код подтверждения отправлен',
        forgotTitle: 'Восстановление пароля', forgotText: 'Укажите e-mail, и мы отправим код.',
        forgotSend: 'Отправить код', resetTitle: 'Новый пароль',
        resetSuccess: 'Пароль обновлён, можете войти'
    },

    notFound: {
        title: 'Страница не найдена',
        text: 'Возможно, страница была перемещена или удалена.',
        cta: 'На главную'
    }
});
