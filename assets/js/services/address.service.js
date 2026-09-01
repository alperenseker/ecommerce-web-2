/* ============================================================
   services/address.service.js — ADRES DEFTERİ
   ------------------------------------------------------------
   Sunucu adresi PascalCase ve "FirstName / LastName" ayrık tutar;
   ekranlarda ise tek bir "ad soyad" alanı var. Bu çeviri iki yönlü
   olarak SADECE burada yapılır — ekranlar hep sade bir nesne görür:

     { id, name, company, address, addressLine2, city, district,
       neighborhood, country, postcode, phone, email, type }

   Tüzel kişi (company) hesaplarda FATURA adresi 1C'den gelir ve
   düzenlenemez; yalnız teslimat adresi kullanıcıya aittir.
   ============================================================ */

(function (App) {
    'use strict';

    var Addr = {};

    /* ============================================================
       DÖNÜŞTÜRME
       ============================================================ */

    /** Sunucu kaydı → ekran nesnesi. */
    Addr.fromApi = function (row) {
        if (!row) return null;
        return {
            id:           row.AddressId,
            type:         row.AddressType,
            name:         [row.FirstName, row.LastName].filter(Boolean).join(' ').trim(),
            company:      row.Title || '',
            address:      row.AddressLine1 || '',
            addressLine2: row.AddressLine2 || '',
            city:         row.City || '',
            district:     row.District || '',
            neighborhood: row.Neighborhood || '',
            country:      row.Country || '',
            postcode:     row.PostalCode || '',
            phone:        row.Phone || '',
            email:        row.Email || ''
        };
    };

    /** Ekran nesnesi → sunucu gövdesi. */
    Addr.toApi = function (type, form) {
        var user = App.auth.user() || {};

        /* Ad soyad tek alandan geliyor: ilk kelime ad, kalanı soyad.
           Tek kelime girildiyse soyad boş kalır — sunucu kabul eder. */
        var parts = String(form.name || '').trim().split(/\s+/);
        var firstName = parts[0] || '';
        var lastName  = parts.slice(1).join(' ') || '';

        return {
            UserId:       App.auth.userId(),
            AddressType:  type,
            Title:        form.company || 'Home',
            FirstName:    firstName,
            LastName:     lastName,
            Phone:        form.phone || '',
            Email:        form.email || user.email || '',
            Country:      form.country || '',
            City:         form.city || '',
            District:     form.district || '',
            Neighborhood: form.neighborhood || '',
            AddressLine1: form.address || '',
            AddressLine2: form.addressLine2 || '',
            PostalCode:   form.postcode || '',
            IsDefault:    true
        };
    };

    /* ============================================================
       OKUMA
       ============================================================ */

    /** Kullanıcının tüm adresleri (ekran biçiminde). */
    Addr.list = async function () {
        if (!App.auth.isLoggedIn()) return [];

        try {
            var res = await App.api.address.getByUser(App.auth.userId());
            return (res.data || []).map(Addr.fromApi).filter(Boolean);
        } catch (e) {
            console.error('Adresler yüklenemedi:', e && e.message);
            return [];
        }
    };

    /**
     * Fatura ve teslimat adresini ayrı ayrı döndürür.
     * @returns {Promise<{billing:Object|null, shipping:Object|null}>}
     */
    Addr.pair = async function () {
        var all = await Addr.list();
        return {
            billing:  all.find(function (a) { return a.type === App.const.ADDRESS_BILLING; })  || null,
            shipping: all.find(function (a) { return a.type === App.const.ADDRESS_SHIPPING; }) || null
        };
    };

    /* ============================================================
       YAZMA
       ============================================================ */

    /** Zorunlu alanlar — kaydetmeden önce ekran bunu çağırır. */
    Addr.validate = function (form) {
        var required = ['name', 'phone', 'country', 'city', 'address', 'postcode'];
        var missing = required.filter(function (field) {
            return !String(form[field] || '').trim();
        });
        return { ok: missing.length === 0, missing: missing };
    };

    /**
     * Kaydet. Sunucu tarafında POST /Address hem ekleme hem güncelleme
     * gibi davranır (aynı tipte adres varsa üzerine yazar), bu yüzden
     * ekran "yeni mi düzenleme mi" ayrımı yapmak zorunda değil.
     */
    Addr.save = async function (type, form) {
        if (!App.auth.isLoggedIn()) {
            App.toast.error(App.t('auth.sessionMissing', 'Oturum bulunamadı'));
            return false;
        }

        var check = Addr.validate(form);
        if (!check.ok) {
            App.toast.warning(App.t('address.fillRequired', 'Lütfen zorunlu alanları doldurun'));
            return false;
        }

        try {
            await App.api.address.save(Addr.toApi(type, form));
            App.toast.success(App.t('address.saved', 'Adres kaydedildi'));
            return true;
        } catch (e) {
            App.toast.error(App.t('address.saveError', 'Adres kaydedilemedi'));
            return false;
        }
    };

    Addr.update = async function (addressId, type, form) {
        try {
            await App.api.address.update(addressId, Addr.toApi(type, form));
            App.toast.success(App.t('address.saved', 'Adres kaydedildi'));
            return true;
        } catch (e) {
            App.toast.error(App.t('address.saveError', 'Adres kaydedilemedi'));
            return false;
        }
    };

    Addr.remove = async function (addressId) {
        try {
            await App.api.address.remove(addressId);
            App.toast.success(App.t('address.removed', 'Adres silindi'));
            return true;
        } catch (e) {
            App.toast.error(App.t('address.removeError', 'Adres silinemedi'));
            return false;
        }
    };

    /**
     * Fatura adresini teslimat adresiyle aynı yap.
     * Teslimat adresi yoksa işlem yapılmaz — kopyalanacak veri yok.
     */
    Addr.copyShippingToBilling = async function () {
        var pair = await Addr.pair();
        if (!pair.shipping) {
            App.toast.warning(App.t('address.noShipping', 'Önce teslimat adresi ekleyin'));
            return false;
        }
        return Addr.save(App.const.ADDRESS_BILLING, pair.shipping);
    };

    /** Tek satırlık okunur adres metni (özet kutuları için). */
    Addr.format = function (a) {
        if (!a) return '';
        return [a.address, a.addressLine2, a.district, a.city, a.postcode, a.country]
            .filter(function (part) { return part && String(part).trim(); })
            .join(', ');
    };

    App.address = Addr;

})(window.App);
