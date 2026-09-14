/* ============================================================
   ui/support-widget.js — DESTEK PENCERESİ (sağ alt köşe)
   ------------------------------------------------------------
   İki ekranı var:
     • HIZLI ERİŞİM — sipariş takibi, iade, SSS bağlantıları,
     • CANLI SOHBET — destek ekibiyle yazışma.

   Sohbet giriş ister (mesaj sunucuda kullanıcıya bağlanıyor);
   girişsiz ziyaretçiye giriş bağlantısı gösterilir, pencere
   yine de açılır — "önce giriş yap" duvarına çarpmak kullanıcıyı
   siteden çıkarıyordu.

   Her sayfada yüklenir; HTML tarafında hiçbir işaretleme yok.
   ============================================================ */

(function (App) {
    'use strict';

    var Widget = {};
    var root = null;
    var isOpen = false;
    var view = 'menu';          // 'menu' | 'chat'

    /* ------------------------------------------------------------
       İSKELET
       ------------------------------------------------------------ */

    function build() {
        if (root) return;

        var t = App.t;

        root = App.utils.el('div', { class: 'sw' });
        root.innerHTML =
            '<button class="sw-fab" type="button" data-act="sw-toggle" ' +
                    'aria-label="' + t('header.liveChat', 'Онлайн-чат') + '">' +
                App.icon('message', 22) +
            '</button>' +

            '<div class="sw-panel" id="sw-panel" role="dialog" aria-label="' +
                 t('shopList.support.brand', 'Поддержка') + '">' +

                '<div class="sw-head">' +
                    '<button class="hidden" type="button" data-act="sw-back" id="sw-back">' +
                        App.icon('arrowLeft', 16) + '</button>' +
                    '<div class="grow">' +
                        '<div class="sw-head__title">' + t('shopList.support.brand', 'Поддержка') + '</div>' +
                        '<div class="sw-head__sub">' +
                            '<span class="dot dot--ok"></span>' + t('shopList.support.online', 'Онлайн') +
                        '</div>' +
                    '</div>' +
                    '<button type="button" data-act="sw-toggle" aria-label="' + t('header.close', 'Закрыть') + '">' +
                        App.icon('close', 17) + '</button>' +
                '</div>' +

                '<div class="sw-body" id="sw-body"></div>' +

                '<div class="sw-foot hidden" id="sw-foot">' +
                    '<input class="input grow" id="sw-input" type="text" ' +
                           'placeholder="' + t('shopList.support.chatInputPlaceholder', 'Введите сообщение...') + '">' +
                    '<button class="btn btn--primary btn--icon" style="--btn-h:34px" type="button" data-act="sw-send" ' +
                            'aria-label="' + t('shopList.support.msgSection', 'Send') + '">' +
                        App.icon('send', 15) +
                    '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(root);
        bindInput();
    }

    /* ------------------------------------------------------------
       GÖRÜNÜMLER
       ------------------------------------------------------------ */

    function renderMenu() {
        view = 'menu';
        document.getElementById('sw-back').classList.add('hidden');
        document.getElementById('sw-foot').classList.add('hidden');

        var t = App.t;
        var body = document.getElementById('sw-body');

        body.innerHTML =
            '<div class="sw-quick">' +
                '<div class="t-sm t-hi t-bold mb-1">' + t('shopList.support.headline', 'Чем помочь?') + '</div>' +
                '<div class="t-xs t-dim t-upper mb-2">' + t('shopList.support.section', '') + '</div>' +

                item('sw-chat', 'headset', 'shopList.support.live', 'shopList.support.liveDesc') +
                itemLink('my-account.html?tab=orders', 'box', 'shopList.support.order', 'shopList.support.orderDesc') +
                itemLink('contact-us.html#faq', 'info', 'shopList.support.faq', 'shopList.support.faqDesc') +

                '<div class="t-xs t-dim t-center mt-3">' + t('shopList.support.footer', '') + '</div>' +
                '<a class="t-xs t-center" href="contact-us.html">' +
                    t('shopList.support.footerLink', '') + '</a>' +
            '</div>';

        function item(act, icon, titleKey, descKey) {
            return '<button class="sw-quick__item" type="button" data-act="' + act + '">' +
                       App.icon(icon, 18) +
                       '<span class="grow"><b>' + t(titleKey, '') + '</b>' +
                           '<span>' + t(descKey, '') + '</span></span>' +
                       App.icon('chevronRight', 14) +
                   '</button>';
        }
        function itemLink(href, icon, titleKey, descKey) {
            return '<a class="sw-quick__item" href="' + href + '">' +
                       App.icon(icon, 18) +
                       '<span class="grow"><b>' + t(titleKey, '') + '</b>' +
                           '<span>' + t(descKey, '') + '</span></span>' +
                       App.icon('chevronRight', 14) +
                   '</a>';
        }
    }

    async function renderChat() {
        view = 'chat';
        document.getElementById('sw-back').classList.remove('hidden');

        var body = document.getElementById('sw-body');
        var foot = document.getElementById('sw-foot');

        if (!App.auth.isLoggedIn()) {
            foot.classList.add('hidden');
            body.innerHTML =
                '<div class="empty" style="padding:32px 16px">' +
                    '<div class="empty__icon">' + App.icon('lock', 22) + '</div>' +
                    '<p class="empty__text">' + App.t('checkout.messages.pleaseLogin', 'Сначала войдите') + '</p>' +
                    '<a class="btn btn--primary btn--sm" href="login.html">' +
                        App.t('header.signIn', 'Войти') + '</a>' +
                '</div>';
            return;
        }

        foot.classList.remove('hidden');
        body.innerHTML = '<div class="flex justify-c" style="padding:24px"><span class="spinner"></span></div>';

        await App.chat.load();
        paint();
        App.chat.markSeen();
        App.chat.startPolling(paint);
    }

    /** Mesaj listesini basar ve en alta kaydırır. */
    function paint() {
        var body = document.getElementById('sw-body');
        if (!body || view !== 'chat') return;

        var msgs = App.chat.messages;

        if (!msgs.length) {
            body.innerHTML =
                '<div class="sw-msg sw-msg--in"><div class="sw-msg__bubble">' +
                    App.utils.escape(App.t('shopList.support.welcomeMessage', 'Здравствуйте!')) +
                '</div></div>';
            return;
        }

        body.innerHTML = msgs.map(function (m) {
            return '<div class="sw-msg sw-msg--' + (m.mine ? 'out' : 'in') + '">' +
                       '<div class="sw-msg__bubble">' +
                           App.utils.escape(m.content) +
                           (m.media ? '<img src="' + App.utils.escape(m.media) + '" alt="" loading="lazy">' : '') +
                           '<span class="sw-msg__time">' + App.fmt.dateTime(m.at) + '</span>' +
                       '</div>' +
                   '</div>';
        }).join('');

        body.scrollTop = body.scrollHeight;
    }

    /* ------------------------------------------------------------
       OLAYLAR
       ------------------------------------------------------------ */

    function bindInput() {
        var input = document.getElementById('sw-input');

        if (input) {
            input.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') { e.preventDefault(); send(); }
            });
        }
    }

    async function send() {
        var input = document.getElementById('sw-input');
        if (!input) return;

        var text = input.value.trim();
        if (!text) return;

        input.value = '';

        /* İyimser çizim: mesaj hemen görünsün, sunucu sonra onaylasın. */
        App.chat.messages.push({ content: text, mine: true, at: new Date().toISOString(), type: 'text', media: '' });
        paint();

        var ok = await App.chat.send(text);
        if (!ok) App.toast.error(App.t('jslanguage.messageSendFailed', 'Mesaj gönderilemedi'));
        await App.chat.load();
        paint();
    }

    App.actions.register('sw-toggle', function () {
        build();
        isOpen = !isOpen;

        var panel = document.getElementById('sw-panel');
        panel.classList.toggle('is-open', isOpen);

        if (isOpen) { if (view === 'chat') renderChat(); else renderMenu(); }
        else App.chat.stopPolling();
    });

    App.actions.register('sw-back', function () {
        App.chat.stopPolling();
        renderMenu();
    });

    App.actions.register('sw-chat', function () { renderChat(); });
    App.actions.register('sw-send',  function () { send(); });

    /* Dışarıdan açmak için (ör. "bize yazın" düğmesi). */
    Widget.open = function (message) {
        build();
        if (!isOpen) { isOpen = true; document.getElementById('sw-panel').classList.add('is-open'); }
        renderChat().then(function () {
            if (!message) return;
            var input = document.getElementById('sw-input');
            if (input) { input.value = message; input.focus(); }
        });
    };

    /* Düğme her sayfada var. app.js dil sözlüğünü uyguladıktan SONRA
       çağırır — önce çizilirse metinler yedek (Rusça) metne düşer. */
    Widget.mount = function () {
        build();
        App.bus.on(App.bus.EVENTS.LANG_CHANGED, function () {
            if (!root) return;
            root.parentNode.removeChild(root);
            root = null;
            build();
            if (isOpen) {
                document.getElementById('sw-panel').classList.add('is-open');
                renderMenu();
            }
        });
    };

    App.support = Widget;

})(window.App);
