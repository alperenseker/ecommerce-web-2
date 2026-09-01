/* ============================================================
   i18n/en.js — ENGLISH DICTIONARY
   Key structure is IDENTICAL across every language file.
   ============================================================ */

App.i18n.register('en', {

    common: {
        home: 'Home', shop: 'Shop', search: 'Search', loading: 'Loading…',
        all: 'All', apply: 'Apply', reset: 'Reset', clear: 'Clear',
        save: 'Save', cancel: 'Cancel', confirm: 'Are you sure?', confirmOk: 'Yes, continue',
        close: 'Close', back: 'Back', next: 'Next', prev: 'Previous', of: 'of',
        yes: 'Yes', no: 'No', edit: 'Edit', delete: 'Delete', remove: 'Remove',
        viewAll: 'View all', showMore: 'Show more', required: 'Required', optional: 'Optional',
        priceOnRequest: 'Price on request',
        priceOnRequestHint: 'Sign in to see prices',
        quantity: 'Qty', total: 'Total', subtotal: 'Subtotal',
        error: 'Something went wrong', retry: 'Try again', copy: 'Copy', copied: 'Copied',
        pcs: 'pcs', free: 'Free', from: 'from', notSpecified: '—'
    },

    nav: {
        home: 'Home', catalog: 'Catalog', shop: 'All products',
        newArrivals: 'New arrivals', bestSellers: 'Best sellers',
        deals: 'Deals', about: 'About', contact: 'Contact',
        delivery: 'Delivery', returns: 'Returns'
    },

    header: {
        announce: 'Fast delivery across Kazakhstan',
        announceStrong: 'Free shipping over 5 000 ₸',
        language: 'Language', account: 'Account', myAccount: 'My account', orders: 'My orders',
        wishlist: 'Wishlist', compare: 'Compare', cart: 'Cart',
        login: 'Sign in', register: 'Sign up', logout: 'Sign out',
        searchPlaceholder: 'Search products, SKU or barcode…',
        allCategories: 'All categories', viewCart: 'View cart', checkout: 'Checkout',
        cartEmpty: 'Your cart is empty', searchMore: 'See all results',
        searchEmpty: 'No results found', greeting: 'Hello'
    },

    footer: {
        aboutText: 'Industrial hardware for window, door and aluminium profile systems. Straight from the manufacturer, shipped from stock.',
        shop: 'Shop', company: 'Company', help: 'Help', contact: 'Contact',
        newsletter: 'Newsletter', newsletterText: 'Get news about new products and offers.',
        emailPlaceholder: 'Your email address', subscribe: 'Subscribe',
        subscribed: 'You are subscribed',
        rights: 'All rights reserved.', payments: 'Payment methods'
    },

    home: {
        heroEyebrow: 'Industrial hardware',
        heroTitle: 'Precision hardware for',
        heroTitleStrong: 'profile systems',
        heroText: 'Window and door mechanisms, hinges, locks and accessories. In stock, at dealer prices.',
        heroCta: 'Browse catalog', heroCta2: 'Become a dealer',
        statProducts: 'Products', statCategories: 'Categories', statBrands: 'Brands', statSupport: 'Support',
        perk1: 'Fast delivery', perk1s: '1–3 days across Kazakhstan',
        perk2: 'Genuine parts', perk2s: 'Direct from the manufacturer',
        perk3: 'Secure payment', perk3s: 'Card, transfer or credit line',
        perk4: 'Expert support', perk4s: 'Technical consulting',
        categories: 'Categories', categoriesSub: 'The shortest path to the part you need',
        newArrivals: 'New arrivals', newArrivalsSub: 'Latest additions to the catalog',
        bestSellers: 'Most ordered', bestSellersSub: 'Parts professionals reorder the most',
        featured: 'Featured', featuredSub: 'Hand-picked products',
        promoLabel: 'Dealer program', promoTitle: 'Special pricing on bulk orders',
        promoText: 'Open a company account for a dedicated price category and payment terms.',
        promoCta: 'Apply now',
        promo2Label: 'Technical support', promo2Title: 'Let us pick the right part together',
        promo2Text: 'Ask our engineers which mechanism fits your project.',
        promo2Cta: 'Get in touch'
    },

    shop: {
        title: 'All products', filters: 'Filters', categories: 'Categories',
        price: 'Price range', priceMin: 'Min', priceMax: 'Max',
        stock: 'Availability', inStockOnly: 'In stock only', outOfStock: 'Out of stock',
        clearFilters: 'Clear filters', applyPrice: 'Apply',
        sortBy: 'Sort', sortDefault: 'Default', sortPriceLow: 'Price: low to high',
        sortPriceHigh: 'Price: high to low', sortNewest: 'Newest',
        sortPopular: 'Most popular', sortRating: 'Top rated',
        perPage: 'Per page', showing: 'Showing', results: 'products',
        noResults: 'No products found',
        noResultsText: 'Try changing the filters or searching for something else.',
        gridView: 'Grid view', listView: 'List view',
        searchResults: 'Search results', searchFor: 'Search',
        minChars: 'Enter at least 2 characters'
    },

    product: {
        addToCart: 'Add to cart', buyNow: 'Buy now', sku: 'SKU', barcode: 'Barcode',
        category: 'Category', availability: 'Availability', stockAmount: 'In stock',
        description: 'Description', specifications: 'Specifications', reviews: 'Reviews',
        related: 'Related products', share: 'Share',
        weight: 'Weight', weightNet: 'Net weight', weightGross: 'Gross weight',
        dimensions: 'Dimensions', width: 'Width', height: 'Height', depth: 'Depth',
        volume: 'Volume', unitsPerBox: 'Units per box', size: 'Size', vat: 'VAT rate',
        company: 'Supplier', variants: 'Options',
        noDescription: 'No description has been provided for this product.',
        notFound: 'Product not found', notFoundText: 'The product you are looking for may have been removed.',
        addedToCart: 'added to cart'
    },

    stock: { inStock: 'In stock', preOrder: 'Pre-order', outOfStock: 'Out of stock', pieces: 'pcs' },

    badge: { new: 'New', featured: 'Featured', discount: 'Sale' },

    cart: {
        title: 'Shopping cart', empty: 'Your cart is empty',
        emptyText: 'Browse the catalog to start shopping.',
        continueShopping: 'Continue shopping',
        product: 'Product', price: 'Price', quantity: 'Qty', subtotal: 'Subtotal',
        total: 'Total', remove: 'Remove', clearCart: 'Empty cart',
        checkout: 'Proceed to checkout', summary: 'Order summary', items: 'items',
        shipping: 'Shipping', shippingCalc: 'Calculated at checkout',
        splitNote: 'Your order will be split into {count} separate orders — each company ships its own.',
        otherCompany: 'Other',
        toAddToCart: 'to add products to your cart',
        added: 'added to cart', addError: 'Could not add to cart',
        productNotFound: 'Product not found', invalidQuantity: 'Invalid quantity',
        updateError: 'Could not update quantity', removed: 'Item removed from cart',
        removeError: 'Could not remove the item', cleared: 'Cart emptied',
        clearError: 'Could not empty the cart',
        confirmRemove: 'Remove this item from your cart?',
        confirmClear: 'All items will be removed from your cart. Continue?',
        loginToView: 'Sign in to view your cart'
    },

    wishlist: {
        title: 'Wishlist', empty: 'Your wishlist is empty',
        emptyText: 'Tap the heart icon on any product to save it here.',
        toAdd: 'to save products',
        added: 'Added to wishlist', removed: 'Removed from wishlist',
        removeError: 'Could not remove', moveToCart: 'Move to cart',
        loginToView: 'Sign in to view your wishlist',
        addedOn: 'Added'
    },

    compare: {
        title: 'Compare', empty: 'Your compare list is empty',
        emptyText: 'Use the compare icon on product cards to add up to 4 products.',
        toCompare: 'to compare products',
        added: 'Added to compare', removed: 'Removed from compare',
        removeError: 'Could not remove', cleared: 'Compare list cleared',
        clearError: 'Could not clear the list', clearAll: 'Clear list',
        alreadyIn: 'Product is already in the compare list',
        sameCategory: 'Only products from the same category can be compared',
        limit: 'You can compare up to {n} products',
        error: 'Could not add to compare',
        product: 'Product', price: 'Price', availability: 'Availability',
        category: 'Category', sku: 'SKU', weight: 'Weight',
        dimensions: 'Dimensions', rating: 'Rating', company: 'Supplier',
        loginToView: 'Sign in to view your compare list'
    },

    checkout: {
        title: 'Checkout', steps: { cart: 'Cart', checkout: 'Checkout', done: 'Done' },
        shippingAddress: 'Shipping address', billingAddress: 'Billing address',
        sameAsShipping: 'Billing address is the same as shipping',
        addAddress: 'Add address', editAddress: 'Edit',
        noShipping: 'Please add a shipping address',
        noBilling: 'Please add a billing address',
        paymentMethod: 'Payment method',
        payCard: 'Credit / debit card', payCardDesc: 'You will be redirected to a secure payment page',
        payTransfer: 'Bank transfer', payTransferDesc: 'Bank details are sent after the order',
        payCod: 'Cash on delivery', payCodDesc: 'Pay in cash or by card on delivery',
        payApproval: 'Credit line (needs approval)', payApprovalDesc: 'Your order goes to an administrator for approval',
        orderNotes: 'Order note', orderNotesHint: 'Any special request for the delivery',
        coupon: 'Coupon code', applyCoupon: 'Apply',
        orderSummary: 'Order summary', placeOrder: 'Place order',
        editCart: 'Edit cart', creating: 'Creating your order…',
        emptyCart: 'Your cart is empty, checkout is not possible',
        transferOnlyNote: 'Only bank transfer is accepted at the moment.',
        willSplit: 'Your cart will be split into {count} separate orders.'
    },

    order: {
        title: 'Order', number: 'Order no', groupNumber: 'Purchase no',
        date: 'Date', total: 'Amount', items: 'Items', statusLabel: 'Status',
        paymentStatus: 'Payment', paymentMethod: 'Payment method',
        thanks: 'Thank you for your order', thanksText: 'We have emailed the order details to you.',
        splitInfo: 'Your purchase was split into {count} orders by supplier.',
        viewOrder: 'View order', trackOrder: 'Track order',
        backToShop: 'Continue shopping', createError: 'Could not create the order',
        notFound: 'Order not found',
        bankDetails: 'Bank details', bankName: 'Bank', account: 'Account / IBAN',
        bin: 'BIN', beneficiary: 'Beneficiary', purpose: 'Payment reference',
        noOrders: 'No orders yet', noOrdersText: 'Browse the catalog to place your first order.',
        status: {
            pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing',
            shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled',
            onHold: 'On hold', refunded: 'Refunded'
        },
        payment: {
            paid: 'Paid', pending: 'Pending', failed: 'Failed', refunded: 'Refunded'
        },
        method: {
            cod: 'Cash on delivery', transfer: 'Bank transfer',
            card: 'Credit card', approval: 'Awaiting approval'
        }
    },

    account: {
        title: 'My account', dashboard: 'Overview', orders: 'My orders',
        addresses: 'Addresses', wishlist: 'Wishlist', reviews: 'My reviews',
        settings: 'Account settings', logout: 'Sign out',
        welcome: 'Welcome', welcomeText: 'Track your account activity here.',
        totalOrders: 'Total orders', pendingOrders: 'Pending orders',
        wishlistItems: 'Saved products', totalSpent: 'Total spent',
        recentOrders: 'Recent orders',
        profile: 'Profile', fullName: 'Full name', email: 'Email',
        phone: 'Phone', accountType: 'Account type', priceCategory: 'Price category',
        iin: 'BIN / IIN', companyName: 'Company name',
        changePassword: 'Change password', currentPassword: 'Current password',
        newPassword: 'New password', confirmPassword: 'Repeat new password',
        passwordChanged: 'Your password has been updated',
        passwordMismatch: 'Passwords do not match',
        noReviews: 'You have not written any reviews yet',
        confirmLogout: 'Do you want to sign out?'
    },

    address: {
        title: 'Addresses', billing: 'Billing address', shipping: 'Shipping address',
        add: 'Add address', edit: 'Edit address',
        fullName: 'Full name', company: 'Company / label', addressLine: 'Address',
        addressLine2: 'Address line 2', city: 'City', district: 'District',
        neighborhood: 'Neighborhood', country: 'Country', postcode: 'Postal code',
        phone: 'Phone', email: 'Email',
        noAddress: 'No saved address', saved: 'Address saved',
        saveError: 'Could not save the address', removed: 'Address deleted',
        removeError: 'Could not delete the address',
        fillRequired: 'Please fill in the required fields',
        noShipping: 'Add a shipping address first',
        companyLocked: 'The company billing address comes from 1C records and cannot be edited.'
    },

    review: {
        title: 'Reviews', write: 'Write a review',
        rating: 'Your rating', reviewTitle: 'Title', comment: 'Your review',
        submit: 'Submit', submitted: 'Your review has been submitted',
        updated: 'Review updated', error: 'Could not submit the review',
        needPurchase: 'You can only review products you have purchased',
        already: 'You have already reviewed this product',
        toReview: 'to write a review',
        none: 'No reviews yet', noneText: 'Be the first to review this product.',
        count: 'reviews', basedOn: 'based on'
    },

    auth: {
        login: 'Sign in', register: 'Sign up', signIn: 'sign in', signUp: 'sign up',
        pleaseSignIn: 'Please',
        email: 'Email', password: 'Password', rememberMe: 'Remember me',
        forgotPassword: 'Forgot password?', noAccount: 'No account yet?',
        haveAccount: 'Already have an account?',
        loginTitle: 'Welcome back', loginSub: 'Sign in to your account to continue.',
        registerTitle: 'Create an account', registerSub: 'Register for dealer prices and order tracking.',
        loginSuccess: 'Signed in, redirecting…',
        allFieldsRequired: 'Please fill in all fields',
        sessionMissing: 'Session not found',
        name: 'First name', surname: 'Last name', phone: 'Phone',
        accountType: 'Account type', individual: 'Individual', company: 'Company / dealer',
        iin: 'BIN / IIN', iinHint: '12-digit identification number',
        agreeTerms: 'I accept the terms of use and the privacy policy',
        mustAgree: 'You must accept the terms to continue',
        registerSuccess: 'Your account has been created',
        registrationClosed: 'Registration is temporarily closed',
        registrationClosedText: 'New accounts cannot be created right now. You can still sign in.',
        passwordShort: 'Password must be at least 6 characters',
        emailInvalid: 'Enter a valid email address',
        otpTitle: 'Verification code', otpText: 'Enter the 6-digit code sent to {target}.',
        otpVerify: 'Verify', otpResend: 'Resend code',
        otpResendIn: 'Resend in {s}s', otpInvalid: 'The code is wrong or has expired',
        otpSent: 'Verification code sent',
        forgotTitle: 'Reset password', forgotText: 'Enter your registered email and we will send you a code.',
        forgotSend: 'Send code', resetTitle: 'Set a new password',
        resetSuccess: 'Your password has been updated, you can sign in'
    },

    notFound: {
        title: 'Page not found',
        text: 'The page you are looking for may have been moved or deleted.',
        cta: 'Back to home'
    }
});
