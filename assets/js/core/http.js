/* ============================================================
   core/http.js — MERKEZİ HTTP KATMANI
   ------------------------------------------------------------
   Uygulamadaki TEK fetch burada. Başlıklar, token, taban adres,
   hata çözümleme ve yanıt normalleştirme tek yerde toplanır.

   Sunucu bazen { Success, Data, Message } bazen { success, data,
   message } döndürüyor (PascalCase / camelCase karışık). Çağıran
   taraf bunu bilmek zorunda kalmasın diye yanıt burada tek biçime
   indirilir:  { success, data, message, token, ... }
   ============================================================ */

(function (App) {
    'use strict';

    var Http = {};

    /* ------------------------------------------------------------
       BAŞLIKLAR
       ------------------------------------------------------------ */

    /**
     * @param {Object}  extra    ek başlıklar
     * @param {boolean} skipAuth true ise Authorization eklenmez
     *        (kayıt / şifre sıfırlama gibi anonim uçlar)
     */
    Http.headers = function (extra, skipAuth) {
        var token = App.store.get(App.keys.TOKEN, '');
        var out = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        if (!skipAuth && token) out.Authorization = 'Bearer ' + token;
        return Object.assign(out, extra || {});
    };

    /* ------------------------------------------------------------
       ANA İSTEK
       ------------------------------------------------------------ */

    /**
     * @param {string} path    '/products' gibi — başına API_BASE eklenir
     * @param {Object} options { method, body, formData, signal, skipAuth, headers }
     * @returns {Promise<Object>} normalleştirilmiş yanıt
     * @throws  {Error} err.status (HTTP kodu) ve err.errorCode taşır
     */
    Http.request = async function (path, options) {
        options = options || {};

        var isFormData = options.formData instanceof FormData;

        var config = {
            method:  options.method || 'GET',
            headers: Http.headers(options.headers, options.skipAuth)
        };

        if (options.body)   config.body = options.body;
        if (options.signal) config.signal = options.signal;

        /* FormData gönderilirken Content-Type SİLİNİR: sınır (boundary)
           değerini tarayıcının kendisi üretmeli, elle yazılan başlık
           yüklemeyi bozar. */
        if (isFormData) {
            config.body = options.formData;
            delete config.headers['Content-Type'];
        }

        var response = await fetch(App.config.API_BASE + path, config);

        if (!response.ok) {
            var err = await buildError(response);
            if (response.status === 401 && config.headers.Authorization) staleSession(path);
            throw err;
        }

        /* 204 No Content gibi gövdesiz yanıtlar. */
        var text = await response.text();
        if (!text) return { success: true, data: null };

        var json = App.utils.parseJson(text);
        if (json === null) return { success: true, data: text };

        return normalize(json);
    };

    /**
     * Hata gövdesini çözer.
     * `errorCode` sunucunun MAKİNE OKUR hata kodudur
     * (`registration_disabled_retail`, `payment_disabled`, ...).
     * Mesaj sunucunun tek dilindedir; istemci kendi dilinde yazmak
     * için KODA bakar. Kod kaybolursa 403'ün sebebi ayırt edilemez.
     */
    async function buildError(response) {
        var message = 'HTTP ' + response.status;
        var errorCode = null;
        var errorDetails = null;

        /* Gövde BİR KEZ okunur: json() başarısız olunca text()
           aynı akışı ikinci kez okuyamaz. */
        var raw = await response.text().catch(function () { return ''; });
        var body = App.utils.parseJson(raw);

        if (body && typeof body === 'object') {
            message = body.Message || body.message || body.title || JSON.stringify(body);
            errorCode = body.errorCode || body.ErrorCode || null;
            /* FAZ 36/42 — kuralın ayrıntısı (min, adım, birim adı,
               önerilen adet; gizlenen kalemlerin adları). İstemci
               mesajı sunucunun tek dilindeki metinden değil BUNDAN
               kendi dilinde kurar (App.su / App.rules). */
            errorDetails = body.errorDetails || body.ErrorDetails || null;
        } else if (raw) {
            message = raw;
        }

        var err = new Error(message);
        err.status = response.status;
        err.errorCode = errorCode;
        err.errorDetails = errorDetails;
        return err;
    }

    /**
     * Token'lı istek 401 döndü → oturum bayat (süresi dolmuş ya da
     * anahtar değişmiş jeton). Girişli görünen ama her istekte
     * reddedilen kullanıcı ne sepetini görür ne giriş sayfasına
     * ulaşabilir (giriş sayfası "zaten girişli" deyip geri yollar).
     * Çıkıştaki temizliğin aynısı yapılır (App.auth.dropSession);
     * kimlik/OTP uçlarındaki 401 (yanlış parola vb.) oturumu düşürmez.
     */
    function staleSession(path) {
        if (/^\/(auth|otp)\//i.test(path)) return;
        if (!App.store.get(App.keys.USER_ID)) return;
        if (App.auth && typeof App.auth.dropSession === 'function') App.auth.dropSession();
    }

    /** PascalCase / camelCase karışıklığını tek biçime indirir. */
    function normalize(json) {
        var pick = function (a, b, fallback) {
            var v = json[a] !== undefined ? json[a] : json[b];
            return v === undefined || v === null ? fallback : v;
        };

        return {
            success:    pick('Success', 'success', true),
            data:       pick('Data', 'data', null),
            token:      pick('Token', 'token', null),
            tempToken:  pick('TempToken', 'tempToken', null),
            user:       pick('User', 'user', null),
            message:    pick('Message', 'message', ''),
            summary:    pick('Summary', 'summary', null),
            totalCount: json.Total || json.TotalCount || json.totalCount || 0,
            page:       json.Page || json.page || 1,
            pageSize:   json.PageSize || json.pageSize || 50
        };
    }

    /* ------------------------------------------------------------
       KISAYOLLAR
       ------------------------------------------------------------ */
    Http.get  = function (path, options) {
        return Http.request(path, Object.assign({ method: 'GET' }, options));
    };
    Http.post = function (path, body, options) {
        return Http.request(path, Object.assign({ method: 'POST', body: JSON.stringify(body) }, options));
    };
    Http.put  = function (path, body, options) {
        return Http.request(path, Object.assign({ method: 'PUT', body: JSON.stringify(body) }, options));
    };
    Http.del  = function (path, options) {
        return Http.request(path, Object.assign({ method: 'DELETE' }, options));
    };

    /* ------------------------------------------------------------
       DOSYA YÜKLEME (ilerleme çubuğu ile)
       fetch ilerleme bildirmediği için burada XHR kullanılır.
       ------------------------------------------------------------ */
    Http.upload = function (path, formData, onProgress) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', App.config.API_BASE + path);

            var token = App.store.get(App.keys.TOKEN, '');
            if (token) xhr.setRequestHeader('Authorization', 'Bearer ' + token);

            if (typeof onProgress === 'function') {
                xhr.upload.onprogress = function (e) {
                    if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
                };
            }

            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 300) {
                    var res = App.utils.parseJson(xhr.responseText);
                    resolve(res ? (res.mediaUrl || res.url || res.fileUrl || res) : xhr.responseText);
                } else {
                    if (xhr.status === 401 && token) staleSession(path);
                    reject(new Error('Yükleme başarısız: HTTP ' + xhr.status));
                }
            };
            xhr.onerror = function () { reject(new Error('Ağ hatası')); };
            xhr.send(formData);
        });
    };

    App.http = Http;

})(window.App);
