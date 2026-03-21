(function (window, document) {
    'use strict';

    var elements = {};

    function byId(id) {
        return document.getElementById(id);
    }

    function cacheElements() {
        elements.form = byId('phone_form');
        elements.iframe = byId('phone_iframe');
        elements.debug = byId('console_debug');
        elements.closePhone = byId('close_phone');
        elements.clearDebug = byId('clear_debug');
    }

    function encodeValue(value) {
        if (!value) {
            return '';
        }

        return window.btoa(value);
    }

    function readFieldValue(name) {
        var field = elements.form && elements.form.elements[name];

        return field ? field.value : '';
    }

    function appendEncodedParam(parts, name, value) {
        if (!value) {
            return;
        }

        parts.push(encodeURIComponent(name) + '=' + encodeURIComponent(encodeValue(value)));
    }

    function buildPhoneUrl() {
        var websocketUrl = readFieldValue('websocket_url');
        var optionString = 'INITIAL_LOAD--DIALPAD_Y--AUTOANSWER_Y--WEBSOCKETURL' + websocketUrl;
        var queryParts = [];

        appendEncodedParam(queryParts, 'phone_login', readFieldValue('phone_login'));
        appendEncodedParam(queryParts, 'phone_pass', readFieldValue('phone_pass'));
        appendEncodedParam(queryParts, 'options', optionString);
        appendEncodedParam(queryParts, 'server_ip', readFieldValue('server_ip'));
        appendEncodedParam(queryParts, 'system_key', readFieldValue('system_key'));
        appendEncodedParam(queryParts, 'callerid', readFieldValue('callerid'));
        appendEncodedParam(queryParts, 'codecs', readFieldValue('codecs'));
        appendEncodedParam(queryParts, 'protocol', readFieldValue('protocol'));

        return 'index.html?' + queryParts.join('&');
    }

    function prependDebugLine(cssClass, message) {
        if (!elements.debug) {
            return;
        }

        elements.debug.innerHTML = '<span class="' + cssClass + '">' + message + '</span>' + elements.debug.innerHTML;
    }

    function clearDebug() {
        if (elements.debug) {
            elements.debug.innerHTML = '';
        }
    }

    function iframeDebugBind() {
        var iframeWindow = elements.iframe && (elements.iframe.contentWindow || elements.iframe);

        if (!iframeWindow) {
            prependDebugLine('error', 'Debug Not Possible');
            return;
        }

        if (iframeWindow.iframeCustomconsole || !iframeWindow.console) {
            return;
        }

        iframeWindow.console.olog = typeof iframeWindow.console.log === 'function' ? iframeWindow.console.log : function () {
        };
        iframeWindow.console.oerror = typeof iframeWindow.console.error === 'function' ? iframeWindow.console.error : function () {
        };
        iframeWindow.console.oinfo = typeof iframeWindow.console.info === 'function' ? iframeWindow.console.info : function () {
        };
        iframeWindow.console.odebug = typeof iframeWindow.console.debug === 'function' ? iframeWindow.console.debug : function () {
        };
        iframeWindow.onoerror = typeof iframeWindow.onerror === 'function' ? iframeWindow.onerror : function () {
        };

        iframeWindow.console.log = function (message) {
            iframeWindow.console.olog(message);
            prependDebugLine('log', message);
        };

        iframeWindow.console.error = function (message) {
            iframeWindow.console.oerror(message);
            prependDebugLine('error', message);
        };

        iframeWindow.console.debug = function (message) {
            iframeWindow.console.odebug(message);
            prependDebugLine('debug', message);
        };

        iframeWindow.console.info = function (message) {
            iframeWindow.console.oinfo(message);
            prependDebugLine('info', message);
        };

        iframeWindow.onerror = function (errorMessage, url, line) {
            iframeWindow.onoerror(errorMessage, url, line);
            prependDebugLine('error', '<b>Line ' + line + '</b> : ' + errorMessage);
        };

        iframeWindow.iframeCustomconsole = true;
    }

    function handleSubmit(event) {
        event.preventDefault();
        clearDebug();
        elements.iframe.src = buildPhoneUrl();
    }

    function handleClosePhone() {
        if (elements.iframe) {
            elements.iframe.src = 'about:blank';
        }
    }

    function bindEvents() {
        if (elements.form) {
            elements.form.addEventListener('submit', handleSubmit);
        }

        if (elements.closePhone) {
            elements.closePhone.addEventListener('click', handleClosePhone);
        }

        if (elements.clearDebug) {
            elements.clearDebug.addEventListener('click', clearDebug);
        }

        window.setInterval(iframeDebugBind, 100);
    }

    function init() {
        cacheElements();
        bindEvents();
        window.clearDebug = clearDebug;
    }

    document.addEventListener('DOMContentLoaded', init);
})(window, document);
