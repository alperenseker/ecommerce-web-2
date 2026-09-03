/* ============================================================
   ui/bank-details.js — ŞİRKET BAŞINA HAVALE REKVİZİTLERİ
   ------------------------------------------------------------
   Aynı gösterim İKİ ekranda lazım: ödeme sayfası (sepetteki her
   şirket için) ve sipariş sayfası (siparişin şirketi için). İki
   yere kopyalansaydı biri düzeltilip öteki unutulurdu; müşteriye
   YANLIŞ HESAP göstermek bu projedeki en pahalı hatadır.

   🔴 NEDEN ŞİRKET BAŞINA:
   `bank_details` şirketleşti; her şirketin kendi hesapları var.
   Süzgeçsiz çağrıda müşteri 12 satır görüyor (3 şirket × 4 hesap)
   ve hangisine yatıracağını bilemiyor. Sepet/sipariş zaten şirkete
   göre bölünüyor (bir ödeme = şirket başına bir sipariş); rekvizit
   de aynı bölmeyi izler.

   Tek çağrı + istemcide gruplama tercih edildi: sepette üç şirket
   varsa üç ayrı istek yerine bir istek yeter.
   ============================================================ */

(function (App) {
    'use strict';

    var Bank = {};

    /** Banka adındaki para birimi ekini ayıklar: "Halyk (KZT)" → {name, currency} */
    function splitCurrency(bankName) {
        var m = String(bankName || '').match(/^(.*?)\s*\(([A-Z]{3})\)\s*$/);
        if (m) return { name: m[1], currency: m[2] };
        return { name: String(bankName || ''), currency: null };
    }

    function field(row, pascal, camel) {
        var v = row[pascal] !== undefined ? row[pascal] : row[camel];
        return v === undefined || v === null ? '' : v;
    }

    /* ------------------------------------------------------------
       VERİ
       ------------------------------------------------------------ */

    /**
     * Aktif hesapları çeker ve ŞİRKET KODUNA göre indeksler.
     * @param {string} [erpSource] tek şirket isteniyorsa kodu
     * @returns {Promise<Object|null>} { fores: [...], foral: [...] } — hata olursa null
     *          ("hesap yok" ile "okunamadı" farklı şeylerdir)
     */
    Bank.load = async function (erpSource) {
        try {
            var res = await App.api.bankDetails.getAll(false, erpSource || '');

            var rows = (res.data || [])
                .filter(function (b) { return field(b, 'IsActive', 'isActive') !== false; })
                .sort(function (a, b) {
                    return (parseInt(field(a, 'SortOrder', 'sortOrder'), 10) || 0) -
                           (parseInt(field(b, 'SortOrder', 'sortOrder'), 10) || 0);
                });

            var byCompany = {};
            rows.forEach(function (row) {
                var code = String(field(row, 'ErpSourceCode', 'erpSourceCode')).toLowerCase();
                /* Şirketsiz satırın hangi siparişe ait olduğu belirsizdir; atlanır. */
                if (!code) return;
                (byCompany[code] = byCompany[code] || []).push(row);
            });

            return byCompany;
        } catch (e) {
            console.error('Banka rekvizitleri yüklenemedi:', e);
            return null;
        }
    };

    /* ------------------------------------------------------------
       ÇİZİM
       ------------------------------------------------------------ */

    /** Tek hesap kartı. */
    function cardHtml(row, activeCurrency) {
        var split    = splitCurrency(field(row, 'BankName', 'bankName'));
        var currency = split.currency || 'OTHER';
        var iban     = field(row, 'Iban', 'iban');
        var esc      = App.utils.escape;

        var rows = [
            [App.t('checkout.bankDetails.beneficiary', 'Получатель'), field(row, 'BeneficiaryName', 'beneficiaryName')],
            [App.t('checkout.bankDetails.bin', 'БИН'), field(row, 'Bin', 'bin')],
            [App.t('checkout.bankDetails.bik', 'БИК'), field(row, 'Bik', 'bik')],
            [App.t('checkout.bankDetails.kbe', 'КБе'), field(row, 'Kbe', 'kbe')]
        ].filter(function (r) { return String(r[1]).trim(); });

        return '<div class="bank-card" data-cur="' + esc(currency) + '"' +
                   (currency === activeCurrency ? '' : ' hidden') + '>' +

                   '<div class="bank-card__head">' +
                       '<span class="bank-card__name">' + esc(split.name) + '</span>' +
                       (split.currency ? '<span class="badge badge--acc">' + esc(split.currency) + '</span>' : '') +
                   '</div>' +

                   '<div class="bank-row">' +
                       '<span class="bank-row__label">' + App.t('checkout.bankDetails.iban', 'IBAN') + '</span>' +
                       '<span class="flex items-c gap-2">' +
                           '<span class="bank-row__value">' + esc(iban) + '</span>' +
                           '<button class="btn btn--ghost btn--sm" type="button" ' +
                                   'data-act="copy" data-value="' + esc(iban) + '">' +
                               App.icon('copy', 12) +
                               '<span>' + App.t('checkout.bankDetails.copy', 'Копировать') + '</span>' +
                           '</button>' +
                       '</span>' +
                   '</div>' +

                   rows.map(function (r) {
                       return '<div class="bank-row">' +
                                  '<span class="bank-row__label">' + esc(r[0]) + '</span>' +
                                  '<span class="bank-row__value">' + esc(r[1]) + '</span>' +
                              '</div>';
                   }).join('') +
               '</div>';
    }

    /** Bir şirketin bloğu: başlık + tutar + para birimi sekmeleri + kartlar. */
    function blockHtml(block, accounts) {
        var esc = App.utils.escape;

        if (!accounts || !accounts.length) {
            return '<div class="erp-block">' +
                       '<div class="erp-block__head">' +
                           '<span class="erp-block__name">' + esc(block.label) + '</span>' +
                       '</div>' +
                       '<div class="erp-block__body">' +
                           '<div class="alert alert--warn">' + App.icon('warning', 15) +
                               '<span>' + App.t('checkout.bankDetails.missing',
                                   'Для этой компании банковские реквизиты пока не заданы.') + '</span>' +
                           '</div>' +
                       '</div>' +
                   '</div>';
        }

        /* Para birimleri: KZT varsa o açık gelir, yoksa ilki. */
        var currencies = [];
        accounts.forEach(function (row) {
            var cur = splitCurrency(field(row, 'BankName', 'bankName')).currency || 'OTHER';
            if (currencies.indexOf(cur) === -1) currencies.push(cur);
        });
        var active = currencies.indexOf('KZT') !== -1 ? 'KZT' : currencies[0];

        return '<div class="erp-block" data-erp="' + esc(block.code) + '">' +
                   '<div class="erp-block__head">' +
                       '<span class="erp-block__name">' + esc(block.label) + '</span>' +
                       (block.amount !== undefined && block.amount !== null
                           ? '<span class="t-bold" style="color:var(--price)">' + App.fmt.price(block.amount) + '</span>'
                           : '') +
                   '</div>' +
                   '<div class="erp-block__body">' +
                       (currencies.length > 1
                           ? '<div class="bank-tabs">' + currencies.map(function (cur) {
                                 return '<button class="bank-tab' + (cur === active ? ' is-active' : '') + '" ' +
                                        'type="button" data-act="bank-cur" data-cur="' + esc(cur) + '">' +
                                        esc(cur) + '</button>';
                             }).join('') + '</div>'
                           : '') +
                       accounts.map(function (row) { return cardHtml(row, active); }).join('') +
                   '</div>' +
               '</div>';
    }

    /**
     * Bölümü çizer.
     * @param {HTMLElement} container hedef kutu
     * @param {Array} blocks [{ code, label, amount }] — sepet/sipariş kırılımı
     */
    Bank.render = async function (container, blocks) {
        if (!container) return;

        container.innerHTML = '<div class="flex justify-c" style="padding:20px">' +
                              '<span class="spinner"></span></div>';

        /* Tek şirketli sipariş sunucuda süzülür (daha az veri); çok
           şirketli sepette tek çağrı + istemcide gruplama yapılır. */
        var byCompany = await Bank.load(blocks.length === 1 ? blocks[0].code : null);

        if (byCompany === null) {
            container.innerHTML = '<div class="alert alert--danger">' + App.icon('warning', 15) +
                '<span>' + App.t('checkout.bankDetails.loadError',
                    'Не удалось загрузить банковские реквизиты.') + '</span></div>';
            return;
        }

        container.innerHTML =
            (blocks.length > 1
                ? '<div class="alert alert--info mb-3">' + App.icon('info', 15) +
                      '<span>' + App.t('checkout.bankDetails.perCompanyNote',
                          '', { count: blocks.length }) + '</span></div>'
                : '') +
            blocks.map(function (block) {
                return blockHtml(block, byCompany[String(block.code).toLowerCase()]);
            }).join('');
    };

    /* Para birimi sekmesi — kartları değiştirir. */
    App.actions.register('bank-cur', function (btn) {
        var body = btn.closest('.erp-block__body');
        if (!body) return;

        App.utils.$$('.bank-tab', body).forEach(function (tab) {
            tab.classList.toggle('is-active', tab === btn);
        });
        App.utils.$$('.bank-card', body).forEach(function (card) {
            card.hidden = card.dataset.cur !== btn.dataset.cur;
        });
    });

    App.bank = Bank;

})(window.App);
