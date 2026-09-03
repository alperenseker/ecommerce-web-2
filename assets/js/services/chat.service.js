/* ============================================================
   services/chat.service.js — DESTEK SOHBETİ (veri katmanı)
   ------------------------------------------------------------
   Sohbet KULLANICI BAŞINA tektir: müşteri paneli açtığında var
   olan `support` sohbeti aranır, yoksa yeni açılır. Her açılışta
   yeni sohbet yaratmak destek ekibinde aynı kişiyi 20 ayrı konu
   hâline getiriyordu.

   Canlı bağlantı (SignalR) yerine YOKLAMA kullanılır: her sunucuda
   çalışır, kurulum gerektirmez ve destek sohbetinde birkaç saniye
   gecikme sorun değildir.
   ============================================================ */

(function (App) {
    'use strict';

    var Chat = {
        chatId: null,
        messages: [],
        unread: 0
    };

    var timer = null;

    function pick(obj, a, b, c) {
        if (!obj) return undefined;
        if (obj[a] !== undefined) return obj[a];
        if (obj[b] !== undefined) return obj[b];
        return c ? obj[c] : undefined;
    }

    /* ------------------------------------------------------------
       SOHBETİ BUL / AÇ
       ------------------------------------------------------------ */

    Chat.ensure = async function () {
        if (Chat.chatId) return Chat.chatId;

        var userId = App.auth.userId();
        if (!userId) return null;

        /* Var olanı ara — yeni sohbet açmadan önce DAİMA bu denenir. */
        try {
            var res = await App.api.chat.getByUser(userId, 'support');
            var list = res.data;
            var first = Array.isArray(list) ? list[0] : list;
            var id = first && pick(first, 'Id', 'id', 'chatId');
            if (id) { Chat.chatId = id; return id; }
        } catch (e) { /* yoksa aşağıda açılır */ }

        try {
            var created = await App.api.chat.create({
                participantIds: [userId],
                chatType: 'support',
                title: 'Support Chat'
            });
            var data = created.data || created;
            Chat.chatId = pick(data, 'Id', 'id', 'chatId') || null;
        } catch (e) {
            console.error('Sohbet açılamadı:', e);
            Chat.chatId = null;
        }

        return Chat.chatId;
    };

    /* ------------------------------------------------------------
       MESAJLAR
       ------------------------------------------------------------ */

    /** Sunucudan tüm mesajları çeker; normalleştirilmiş dizi döner. */
    Chat.load = async function () {
        var chatId = await Chat.ensure();
        if (!chatId) return [];

        try {
            var res = await App.api.chat.getMessages(chatId);
            var raw = Array.isArray(res) ? res : (res.data || res.items || res.messages || []);
            var me = String(App.auth.userId());

            Chat.messages = (raw || []).map(function (m) {
                return {
                    id:      pick(m, 'Id', 'id'),
                    content: pick(m, 'Content', 'content') || '',
                    type:    pick(m, 'Type', 'type') || 'text',
                    media:   pick(m, 'MediaUrl', 'mediaUrl') || '',
                    at:      pick(m, 'Timestamp', 'timestamp') || pick(m, 'CreatedAt', 'createdAt'),
                    mine:    String(pick(m, 'SenderId', 'senderId')) === me
                };
            });

            return Chat.messages;
        } catch (e) {
            console.error('Mesajlar yüklenemedi:', e);
            return Chat.messages;
        }
    };

    /** Metin mesajı gönderir. */
    Chat.send = async function (text) {
        var body = String(text || '').trim();
        if (!body) return false;

        var chatId = await Chat.ensure();
        if (!chatId) return false;

        try {
            await App.api.chat.sendMessage(chatId, {
                senderId: App.auth.userId(),
                content:  body,
                type:     'text'
            });
            /* Okundu bilgisi başarısız olsa da mesaj gitti sayılır. */
            App.api.chat.markSeen(chatId, { userId: App.auth.userId() }).catch(function () {});
            return true;
        } catch (e) {
            console.error('Mesaj gönderilemedi:', e);
            return false;
        }
    };

    /** Dosya eki — sunucu desteklemiyorsa sessizce false döner. */
    Chat.upload = async function (file, onProgress) {
        var chatId = await Chat.ensure();
        if (!chatId || !file) return false;

        var fd = new FormData();
        fd.append('file', file);

        try {
            var url = await App.api.chat.upload(chatId, fd, onProgress);
            await App.api.chat.sendMessage(chatId, {
                senderId: App.auth.userId(),
                content:  file.name,
                type:     'image',
                mediaUrl: typeof url === 'string' ? url : (url && (url.mediaUrl || url.url))
            });
            return true;
        } catch (e) {
            console.error('Dosya gönderilemedi:', e);
            return false;
        }
    };

    Chat.markSeen = function () {
        if (!Chat.chatId) return Promise.resolve();
        return App.api.chat.markSeen(Chat.chatId, { userId: App.auth.userId() }).catch(function () {});
    };

    /* ------------------------------------------------------------
       YOKLAMA
       Panel AÇIKKEN çalışır; kapanınca durur. Kapalı panelde
       saniyede istek atmak sunucuyu boşuna yorar.
       ------------------------------------------------------------ */

    Chat.startPolling = function (onUpdate) {
        Chat.stopPolling();
        timer = setInterval(async function () {
            var before = Chat.messages.length;
            await Chat.load();
            if (Chat.messages.length !== before && typeof onUpdate === 'function') onUpdate(Chat.messages);
        }, App.config.CHAT_POLL || 8000);
    };

    Chat.stopPolling = function () {
        if (timer) { clearInterval(timer); timer = null; }
    };

    App.chat = Chat;

})(window.App);
