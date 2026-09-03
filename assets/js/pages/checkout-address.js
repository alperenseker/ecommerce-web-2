/* ============================================================
   pages/checkout-address.js — ADRES BÖLÜMÜ
   ------------------------------------------------------------
   Hem ödeme sayfası hem hesap sayfası aynı adres kutusunu
   kullanır; iki yere kopyalanmasın diye ayrı dosya.

   🔴 TÜZEL KİŞİ KURALI: şirket hesabında FATURA adresi 1C'den
   gelir ve düzenlenemez. Sipariş gönderilirken fatura adresi
   olarak teslimat adresinin kimliği yollanır — sunucu şirketin
   kayıtlı adresini zaten kendisi biliyor.
   ============================================================ */

(function (App) {
    'use strict';

    var AddrUI = {};

    /* Ekranda gösterilen adres alanları — sıra ekrandaki sırayla. */
    var FIELDS = [
        { key: 'name',     label: 'checkout.name',     required: true },
        { key: 'company',  label: 'checkout.company',  required: false },
        { key: 'phone',    label: 'checkout.phone',    required: true },
        { key: 'country',  label: 'checkout.country',  required: true },
        { key: 'city',     label: 'checkout.city',     required: true },
        { key: 'postcode', label: 'checkout.postcode', required: true },
        { key: 'address',  label: 'checkout.address',  required: true, full: true }
    ];

    /* ------------------------------------------------------------
       GÖRÜNÜM
       ------------------------------------------------------------ */

    /** Kayıtlı adres kartı (yoksa "adres yok" kutusu). */
    AddrUI.cardHtml = function (address, type, editable) {
        var t = App.t;

        if (!address) {
            return '<div class="addr-card">' +
                       '<div class="t-mut t-sm mb-3">' + t('checkout.noAddressAdded', 'Адрес не добавлен') + '</div>' +
                       (editable !== false
                           ? '<button class="btn btn--ghost btn--sm" type="button" ' +
                                     'data-act="addr-edit" data-type="' + type + '">' +
                                 App.icon('plus', 13) +
                                 '<span>' + t('checkout.saveAddress', 'Добавить адрес') + '</span>' +
                             '</button>'
                           : '') +
                   '</div>';
        }

        return '<div class="addr-card">' +
                   (editable !== false
                       ? '<div class="addr-card__tools">' +
                             '<button class="btn btn--plain btn--sm btn--icon" type="button" ' +
                                     'data-act="addr-edit" data-type="' + type + '" ' +
                                     'title="' + t('checkout.editShippingAddress', 'Изменить') + '">' +
                                 App.icon('edit', 14) +
                             '</button>' +
                         '</div>'
                       : '') +
                   '<div class="addr-card__name">' + App.utils.escape(address.name || '') + '</div>' +
                   (address.company ? '<div class="t-sm t-mut">' + App.utils.escape(address.company) + '</div>' : '') +
                   '<div class="t-sm">' + App.utils.escape(App.address.format(address)) + '</div>' +
                   (address.phone ? '<div class="t-sm t-mut mt-1">' + App.icon('phone', 12) + ' ' +
                                    App.utils.escape(address.phone) + '</div>' : '') +
               '</div>';
    };

    /* ------------------------------------------------------------
       DÜZENLEME PENCERESİ
       ------------------------------------------------------------ */

    /**
     * @param {string}   type     'shipping' | 'billing'
     * @param {Object}   current  varsa mevcut adres
     * @param {Function} onSaved  kaydedince çağrılır
     */
    AddrUI.openForm = function (type, current, onSaved) {
        var t = App.t;
        var data = current || {};

        var title = type === App.const.ADDRESS_SHIPPING
            ? t('checkout.editShippingAddress', 'Адрес доставки')
            : t('checkout.editBillingAddress', 'Адрес для счета');

        App.modal.open({
            title: title,
            wide: true,
            body:
                '<form id="addr-form" class="form-grid">' +
                    FIELDS.map(function (f) {
                        return '<div class="field' + (f.full ? ' field--full' : '') + '">' +
                                   '<label class="label' + (f.required ? ' label--req' : '') + '" ' +
                                          'for="af-' + f.key + '">' + t(f.label, f.key) + '</label>' +
                                   '<input class="input" id="af-' + f.key + '" type="text" ' +
                                          'value="' + App.utils.escape(data[f.key] || '') + '"' +
                                          (f.required ? ' required' : '') + '>' +
                               '</div>';
                    }).join('') +
                '</form>' +
                '<div class="alert alert--danger mt-2" id="addr-error" hidden></div>',
            footer:
                '<button class="btn btn--ghost" type="button" data-modal-cancel>' +
                    t('checkout.cancel', 'Отмена') + '</button>' +
                '<button class="btn btn--primary" type="button" id="addr-save">' +
                    t('checkout.saveAddress', 'Сохранить адрес') + '</button>',

            onOpen: function (el, close) {
                el.querySelector('[data-modal-cancel]').addEventListener('click', close);

                el.querySelector('#addr-save').addEventListener('click', async function () {
                    var btn = this;
                    var form = {};
                    FIELDS.forEach(function (f) {
                        form[f.key] = el.querySelector('#af-' + f.key).value.trim();
                    });

                    var check = App.address.validate(form);
                    if (!check.ok) {
                        var box = el.querySelector('#addr-error');
                        box.hidden = false;
                        box.textContent = t('address.errors.requiredFields', 'Заполните обязательные поля');
                        return;
                    }

                    btn.classList.add('is-loading');

                    /* POST /Address aynı tipte adres varsa üzerine yazar;
                       ekranın "yeni mi düzenleme mi" ayrımı yapmasına gerek yok. */
                    var ok = data.id
                        ? await App.address.update(data.id, type, form)
                        : await App.address.save(type, form);

                    btn.classList.remove('is-loading');
                    if (ok) { close(); if (onSaved) onSaved(); }
                });
            }
        });
    };

    /* ------------------------------------------------------------
       BÖLÜMÜ ÇİZ
       ------------------------------------------------------------ */

    /**
     * Teslimat + fatura adresi kutularını basar.
     * @param {HTMLElement} container
     * @param {Object} pair { shipping, billing }
     * @param {Function} onChange adres değişince çağrılır
     */
    AddrUI.render = function (container, pair, onChange) {
        if (!container) return;

        var t = App.t;
        var isCompany = App.auth.isCompany();

        container.innerHTML =
            '<div class="grid grid--2 gap-4">' +

                '<div>' +
                    '<div class="label">' + t('checkout.shippingAddress', 'Адрес доставки') + '</div>' +
                    AddrUI.cardHtml(pair.shipping, App.const.ADDRESS_SHIPPING, true) +
                '</div>' +

                '<div>' +
                    '<div class="label">' + t('checkout.billingAddress', 'Адрес для счета') + '</div>' +
                    (isCompany
                        /* Şirket faturası 1C'den; düzenleme kapalı. */
                        ? '<div class="addr-card">' +
                              '<div class="addr-card__name">' +
                                  App.utils.escape(App.store.get(App.keys.COMPANY_NAME, '') ||
                                                   (App.auth.user() || {}).name || '') + '</div>' +
                              '<div class="t-sm">' +
                                  App.utils.escape(App.store.get(App.keys.COMPANY_ADDRESS, '') || '—') + '</div>' +
                              '<div class="t-xs t-dim mt-2">' + App.icon('lock', 11) + ' ' +
                                  t('address.companyLocked',
                                    'Адрес для счёта компании берётся из 1С.') + '</div>' +
                          '</div>'
                        : AddrUI.cardHtml(pair.billing, App.const.ADDRESS_BILLING, true) +
                          '<label class="check mt-3">' +
                              '<input type="checkbox" id="same-address">' +
                              '<span class="check__box"></span>' +
                              '<span>' + t('checkout.useForBilling',
                                  'Использовать адрес доставки для счета') + '</span>' +
                          '</label>') +
                '</div>' +
            '</div>';

        /* Aynı adres kutusu — teslimatı faturaya kopyalar. */
        var same = container.querySelector('#same-address');
        if (same) {
            same.addEventListener('change', async function () {
                if (!this.checked) return;
                var ok = await App.address.copyShippingToBilling();
                this.checked = false;
                if (ok && onChange) onChange();
            });
        }

        AddrUI._onChange = onChange;
        AddrUI._pair = pair;
    };

    /* Düzenle düğmesi — pencereyi açar. */
    App.actions.register('addr-edit', function (btn) {
        var type = btn.dataset.type;
        var pair = AddrUI._pair || {};
        var current = type === App.const.ADDRESS_SHIPPING ? pair.shipping : pair.billing;

        AddrUI.openForm(type, current, function () {
            if (AddrUI._onChange) AddrUI._onChange();
        });
    });

    App.addressUi = AddrUI;

})(window.App);
