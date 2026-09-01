/* ============================================================
   services/review.service.js — DEĞERLENDİRMELER
   ------------------------------------------------------------
   Yorum gönderme sunucuda SATIN ALMA ŞARTINA bağlıdır: gövdede
   OrderId beklenir. Kullanıcı ürünü almadıysa sunucu reddeder ve
   ekranda "önce satın alın" uyarısı gösterilir.
   ============================================================ */

(function (App) {
    'use strict';

    var Review = {};

    /** Bir ürünün yorumları (sayfalı). */
    Review.byProduct = async function (productId, page, pageSize) {
        try {
            var res = await App.api.reviews.getByProduct(productId, page || 1, pageSize || 10);
            return {
                items: (res.success && res.data) ? res.data : [],
                total: res.totalCount || 0,
                page:  res.page || 1
            };
        } catch (e) {
            return { items: [], total: 0, page: 1 };
        }
    };

    Review.byUser = async function () {
        if (!App.auth.isLoggedIn()) return [];
        try {
            var res = await App.api.reviews.getByUser(App.auth.userId());
            return (res.success && res.data) ? res.data : [];
        } catch (e) {
            return [];
        }
    };

    /**
     * Yeni yorum.
     * @param {Object} payload { productId, orderId, rating, title, comment }
     */
    Review.submit = async function (payload) {
        if (!App.auth.require(App.t('review.toReview', 'değerlendirme yapmak için'))) return false;

        try {
            var res = await App.api.reviews.submit({
                ProductId: payload.productId,
                UserId:    App.auth.userId(),
                OrderId:   payload.orderId,
                Rating:    payload.rating,
                Title:     payload.title || '',
                Body:      payload.comment || ''
            });

            if (!res.success) throw new Error(res.message);
            App.toast.success(App.t('review.submitted', 'Değerlendirmeniz gönderildi'));
            return true;

        } catch (error) {
            var msg = String(error.message || '').toLowerCase();

            /* Sunucu "ürünü satın almamış" durumunu 400 ile döner;
               ham mesaj yerine anlaşılır uyarı gösterilir. */
            if (msg.indexOf('purchase') !== -1 || msg.indexOf('order') !== -1) {
                App.toast.warning(App.t('review.needPurchase', 'Yalnız satın aldığınız ürünleri değerlendirebilirsiniz'));
            } else if (msg.indexOf('already') !== -1) {
                App.toast.warning(App.t('review.already', 'Bu ürünü zaten değerlendirdiniz'));
            } else {
                App.toast.error(App.t('review.error', 'Değerlendirme gönderilemedi'));
            }
            return false;
        }
    };

    Review.update = async function (reviewId, payload) {
        try {
            await App.api.reviews.update(reviewId, {
                Rating: payload.rating,
                Title:  payload.title || '',
                Body:   payload.comment || '',
                Images: []
            });
            App.toast.success(App.t('review.updated', 'Değerlendirme güncellendi'));
            return true;
        } catch (e) {
            App.toast.error(App.t('review.error', 'Değerlendirme gönderilemedi'));
            return false;
        }
    };

    /**
     * Yıldız dağılımı — "5 yıldız: %60" çubukları için.
     * @returns {{counts:number[], total:number, average:number}}
     */
    Review.distribution = function (items) {
        var counts = [0, 0, 0, 0, 0];   // index 0 → 1 yıldız
        var sum = 0;

        (items || []).forEach(function (r) {
            var rating = App.utils.clamp(parseInt(r.Rating || r.rating, 10) || 0, 1, 5);
            counts[rating - 1]++;
            sum += rating;
        });

        var total = items ? items.length : 0;
        return { counts: counts, total: total, average: total ? sum / total : 0 };
    };

    App.review = Review;

})(window.App);
