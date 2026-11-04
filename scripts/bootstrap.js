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

    function extractPrefixed(parts, prefix) {
        var index;

        for (index = 0; index < parts.length; index += 1) {
            if (parts[index].indexOf(prefix) === 0) {
                return parts[index].slice(prefix.length);
            }
        }

        return '';
    }

    // Settings container lines arrive joined by a literal "\n" (backslash + n), e.g.
    // autoGain:true\nechoCan:false\ndialRegExten:1\nlangRegistered:"Bereit"
    function parseSettings(raw) {
        var settings = {};
        var lines = (raw || '').split(/\\n|\r?\n/);
        var index;

        for (index = 0; index < lines.length; index += 1) {
            var line = lines[index];
            var separator = line.indexOf(':');

            if (separator < 1) {
                continue;
            }

            settings[line.slice(0, separator).trim()] = line.slice(separator + 1).replace(/"/g, '').trim();
        }

        return settings;
    }

    // VICIdial (agc/vicidial.php) builds options as INITIAL_LOAD--DIALPAD_Y--AUTOANSWER_Y--MUTE_N--VOLUME_Y--DEBUG--WEBSOCKETURL...
    function parseFlags(parts) {
        var flags = {
            dialpad: 'Y',
            autoAnswer: 'Y',
            dialbox: 'Y',
            mute: 'Y',
            volume: 'Y',
            debug: false
        };
        var map = {
            DIALPAD_Y: ['dialpad', 'Y'],
            DIALPAD_N: ['dialpad', 'N'],
            DIALPAD_TOGGLE: ['dialpad', 'TOGGLE'],
            DIALPAD_OFF_TOGGLE: ['dialpad', 'OFF_TOGGLE'],
            AUTOANSWER_Y: ['autoAnswer', 'Y'],
            AUTOANSWER_N: ['autoAnswer', 'N'],
            DIALBOX_Y: ['dialbox', 'Y'],
            DIALBOX_N: ['dialbox', 'N'],
            MUTE_Y: ['mute', 'Y'],
            MUTE_N: ['mute', 'N'],
            VOLUME_Y: ['volume', 'Y'],
            VOLUME_N: ['volume', 'N'],
            DEBUG: ['debug', true]
        };
        var index;

        for (index = 0; index < parts.length; index += 1) {
            var entry = map[parts[index]];
            if (entry) {
                flags[entry[0]] = entry[1];
            }
        }

        return flags;
    }

    function buildConfig() {
        var queryParams = readQueryParams();
        var options = decodeBase64Value(queryParams.options || '');
        var optionParts = options ? options.split('--') : [];
        var settingsRaw = extractPrefixed(optionParts, 'SETTINGS');

        window.PBXWebPhoneConfig = {
            phoneLogin: decodeBase64Value(queryParams.phone_login || ''),
            phonePassword: decodeBase64Value(queryParams.phone_pass || ''),
            serverIp: decodeBase64Value(queryParams.server_ip || queryParams.serverip || ''),
            rawOptions: options,
            options: optionParts,
            flags: parseFlags(optionParts),
            layout: extractPrefixed(optionParts, 'WEBPHONELAYOUT'),
            sessionId: extractPrefixed(optionParts, 'SESSION'),
            settingsRaw: settingsRaw,
            settings: parseSettings(settingsRaw),
            webSocketUrl: extractPrefixed(optionParts, 'WEBSOCKETURL')
        };
    }

    buildConfig();
})(window);
