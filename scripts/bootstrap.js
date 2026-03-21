(function (window) {
    'use strict';

    function decodeQueryComponent(value) {
        return decodeURIComponent((value || '').replace(/\+/g, '%20'));
    }

    function readQueryParams() {
        var params = {};
        var query = window.location.search.replace(/^\?/, '');
        var pairs;
        var index;

        if (!query) {
            return params;
        }

        pairs = query.split('&');
        for (index = 0; index < pairs.length; index += 1) {
            var pair = pairs[index];
            var parts;
            var key;
            var value;

            if (!pair) {
                continue;
            }

            parts = pair.split('=');
            key = decodeQueryComponent(parts.shift());
            value = decodeQueryComponent(parts.join('='));

            params[key] = value;
        }

        return params;
    }

    function normalizeBase64(value) {
        var normalized = (value || '')
            .replace(/ /g, '+')
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        while (normalized.length % 4 !== 0) {
            normalized += '=';
        }

        return normalized;
    }

    function decodeBase64Value(value) {
        if (!value) {
            return '';
        }

        try {
            return window.atob(normalizeBase64(value));
        } catch (error) {
            return '';
        }
    }

    function extractWebSocketUrl(options) {
        var prefix = 'WEBSOCKETURL';
        var webSocketUrl = '';
        var parts = (options || '').split('--');
        var index;

        for (index = 0; index < parts.length; index += 1) {
            var option = parts[index];

            if (option.indexOf(prefix) !== 0) {
                continue;
            }

            webSocketUrl = option.slice(prefix.length);
            break;
        }

        return webSocketUrl;
    }

    function buildConfig() {
        var queryParams = readQueryParams();
        var options = decodeBase64Value(queryParams.options || '');

        window.PBXWebPhoneConfig = {
            phoneLogin: decodeBase64Value(queryParams.phone_login || ''),
            phonePassword: decodeBase64Value(queryParams.phone_pass || ''),
            serverIp: decodeBase64Value(queryParams.server_ip || queryParams.serverip || ''),
            rawOptions: options,
            options: options ? options.split('--') : [],
            webSocketUrl: extractWebSocketUrl(options)
        };
    }

    buildConfig();
})(window);
