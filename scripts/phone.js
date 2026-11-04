(function (window, document) {
    'use strict';

    var appConfig = window.PBXWebPhoneConfig || {};
    var flags = appConfig.flags || {};
    var settings = appConfig.settings || {};
    var VOLUME_STEP = 0.1;

    function readBooleanSetting(key, fallback) {
        var value = String(settings[key] === undefined ? '' : settings[key]).toLowerCase();

        if (value === 'true' || value === '1' || value === 'y' || value === 'yes') {
            return true;
        }

        if (value === 'false' || value === '0' || value === 'n' || value === 'no') {
            return false;
        }

        return fallback;
    }

    // Status texts; overridable through the VICIdial "Webphone Extra Settings" container (lang* keys, as in VICIphone).
    var lang = {
        connected: settings.langConnected || 'Connected',
        disconnected: settings.langDisconnected || 'An error occurred while connecting to the WebSocket.',
        registered: settings.langRegistered || 'Ready',
        regFailed: settings.langRegFailed || 'An error occurred while registering your phone. Check your settings.',
        unregistered: settings.langUnregistered || 'An error occurred while registering your phone. Check your settings.',
        ringing: settings.langRinging || 'Incoming',
        trying: settings.langTrying || 'Trying',
        attempting: settings.langAttempting || 'Calling...',
        incall: settings.langIncall || 'Answered',
        reject: settings.langReject || 'Rejected'
    };

    var audioConstraints = {
        autoGainControl: readBooleanSetting('autoGain', true),
        echoCancellation: readBooleanSetting('echoCan', true),
        noiseSuppression: readBooleanSetting('noiseSup', true)
    };
    var state = {
        activeCall: false,
        isMuted: false,
        currentSession: null,
        phone: null,
        remoteStream: null
    };
    var elements = {};

    function byId(id) {
        return document.getElementById(id);
    }

    function cacheElements() {
        elements.bell = byId('bell');
        elements.voice = byId('voice');
        elements.connectionState = byId('state');
        elements.callState = byId('callState');
        elements.errorState = byId('errState');
        elements.keyPad = byId('divKeyPad');
        elements.keyPadToggle = byId('btnKeyPad');
        elements.keyPadClose = byId('closeKeyPad');
        elements.muteButton = byId('btn');
        elements.dtmfButtons = document.querySelectorAll('[data-dtmf]');
        elements.answerButton = byId('btnAnswer');
        elements.hangupButton = byId('btnHangup');
        elements.volumeDown = byId('btnVolDown');
        elements.volumeUp = byId('btnVolUp');
        elements.volumeGroup = byId('volGroup');
        elements.dialBox = byId('dialBox');
        elements.dialDigits = byId('dialDigits');
        elements.dialButton = byId('btnDial');
        elements.debugLog = byId('debugLog');
    }

    function debugOut(message) {
        if (!flags.debug) {
            return;
        }

        console.debug('[PBXWebPhone] ' + message);

        if (elements.debugLog) {
            elements.debugLog.textContent += new Date().toISOString().slice(11, 19) + ' ' + message + '\n';
            elements.debugLog.scrollTop = elements.debugLog.scrollHeight;
        }
    }

    function getMediaOptions() {
        return {
            sessionDescriptionHandlerOptions: {
                constraints: {
                    audio: audioConstraints,
                    video: false
                }
            }
        };
    }

    function syncLegacyGlobals() {
        window.Session = state.currentSession;
        window.activeCall = state.activeCall;
        window.isMuted = state.isMuted;
        window.Stream = state.remoteStream;
        window.SIPPhone = state.phone;
    }

    function setText(element, value) {
        if (!element) {
            return;
        }

        element.textContent = value || '';
    }

    function setState(message, level) {
        setText(elements.connectionState, message);

        if (elements.connectionState) {
            elements.connectionState.setAttribute('data-level', level || '');
        }
    }

    function setCallState(message) {
        setText(elements.callState, message);
    }

    function setErrorState(message) {
        setText(elements.errorState, message);
    }

    function updateMuteButtonLabel() {
        if (!elements.muteButton) {
            return;
        }

        elements.muteButton.textContent = state.isMuted ? 'Unmute' : 'Mute';
    }

    function setActiveCall(isActive) {
        state.activeCall = Boolean(isActive);
        syncLegacyGlobals();
        updateCallButtons();
    }

    // Answer is shown only while an incoming call rings (AUTOANSWER_N); Hang up whenever a session exists.
    function updateCallButtons() {
        var session = state.currentSession;
        var isRinging = Boolean(session && session.direction === 'incoming' && !state.activeCall && !session.pbxAnswered);

        setHidden(elements.answerButton, !isRinging);
        setHidden(elements.hangupButton, !session);

        if (elements.dialButton) {
            elements.dialButton.disabled = Boolean(session);
        }
    }

    function setMuteState(isMuted) {
        state.isMuted = Boolean(isMuted);
        updateMuteButtonLabel();
        syncLegacyGlobals();
    }

    function setCurrentSession(session) {
        state.currentSession = session || null;
        syncLegacyGlobals();
        updateCallButtons();
    }

    function clearRemoteAudio() {
        if (elements.voice) {
            try {
                elements.voice.pause();
            } catch (error) {
            }

            elements.voice.srcObject = null;
        }

        state.remoteStream = null;
        syncLegacyGlobals();
    }

    function resetCallState(message) {
        stopRingTone();
        setCallState(message || '');
        setActiveCall(false);
        setMuteState(false);
        setCurrentSession(null);
        clearRemoteAudio();
    }

    function playAudio(element) {
        if (!element) {
            return;
        }

        try {
            var promise = element.play();
            if (promise && typeof promise.catch === 'function') {
                promise.catch(function () {
                });
            }
        } catch (error) {
        }
    }

    function pauseAudio(element) {
        if (!element) {
            return;
        }

        try {
            element.pause();
            element.currentTime = 0;
        } catch (error) {
        }
    }

    function startRingTone() {
        playAudio(elements.bell);
    }

    function stopRingTone() {
        pauseAudio(elements.bell);
    }

    function showKeyPad(isVisible) {
        if (!elements.keyPad) {
            return;
        }

        elements.keyPad.hidden = !isVisible;

        if (elements.keyPadToggle) {
            elements.keyPadToggle.setAttribute('aria-expanded', isVisible ? 'true' : 'false');
        }
    }

    function toggleKeyPad() {
        showKeyPad(Boolean(elements.keyPad && elements.keyPad.hidden));
    }

    function openKeyPad() {
        showKeyPad(true);
    }

    function closeKeyPad() {
        showKeyPad(false);
    }

    function setHidden(element, isHidden) {
        if (!element) {
            return;
        }

        element.hidden = Boolean(isHidden);
    }

    function applyLayout() {
        var layout = (appConfig.layout || '').trim();
        var href;
        var link;

        if (!layout) {
            return;
        }

        // Same resolution rules as VICIphone: full http(s) URL, or a name/path under css/ with .css appended.
        if (/^https?:\/\//i.test(layout)) {
            href = layout;
        } else {
            if (!/^[A-Za-z0-9_\-./]+$/.test(layout) || layout.indexOf('..') !== -1) {
                debugOut('Ignoring invalid layout: ' + layout);
                return;
            }

            href = /^css\//i.test(layout) ? layout : 'css/' + layout;
            if (!/\.css$/i.test(href)) {
                href += '.css';
            }
        }

        link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
        debugOut('Loaded layout ' + href);
    }

    function applyFeatureFlags() {
        setHidden(elements.muteButton, flags.mute === 'N');
        setHidden(elements.volumeGroup, flags.volume === 'N');
        setHidden(elements.dialBox, flags.dialbox === 'N');
        setHidden(elements.debugLog, !flags.debug);

        if (flags.dialpad === 'N') {
            closeKeyPad();
            setHidden(elements.keyPad, true);
            setHidden(elements.keyPadToggle, true);
        }
    }

    function extractDomain(url) {
        if (!url) {
            return '';
        }

        try {
            return new window.URL(url).hostname;
        } catch (error) {
            return url.split('/')[0].split(':')[0];
        }
    }

    function sendDtmf(character) {
        if (!state.currentSession || !character) {
            return;
        }

        try {
            state.currentSession.dtmf(character);
            pauseAudio(byId('dtmf_' + character));
            playAudio(byId('dtmf_' + character));
        } catch (error) {
            console.error('Failed to send DTMF');
        }
    }

    function withPeerConnection(callback) {
        var sessionDescriptionHandler;
        var peerConnection;

        if (!state.currentSession || !state.currentSession.sessionDescriptionHandler) {
            return false;
        }

        sessionDescriptionHandler = state.currentSession.sessionDescriptionHandler;
        peerConnection = sessionDescriptionHandler.peerConnection;

        if (!peerConnection) {
            return false;
        }

        callback(peerConnection);
        return true;
    }

    function setLocalTracksMuted(isMuted) {
        return withPeerConnection(function (peerConnection) {
            if (peerConnection.getSenders) {
                peerConnection.getSenders().forEach(function (sender) {
                    if (sender.track && sender.track.kind === 'audio') {
                        sender.track.enabled = !isMuted;
                    }
                });

                return;
            }

            if (!peerConnection.getLocalStreams) {
                return;
            }

            peerConnection.getLocalStreams().forEach(function (stream) {
                stream.getAudioTracks().forEach(function (track) {
                    track.enabled = !isMuted;
                });
            });
        });
    }

    function mute() {
        if (!state.currentSession) {
            return;
        }

        if (typeof state.currentSession.mute === 'function') {
            state.currentSession.mute();
            return;
        }

        if (setLocalTracksMuted(true)) {
            setMuteState(true);
            setCallState('Muted');
        }
    }

    function unmute() {
        if (!state.currentSession) {
            return;
        }

        if (typeof state.currentSession.unmute === 'function') {
            state.currentSession.unmute();
            return;
        }

        if (setLocalTracksMuted(false)) {
            setMuteState(false);
            setCallState(lang.incall);
        }
    }

    function toggleMute() {
        if (flags.mute === 'N' || !state.activeCall || !state.currentSession) {
            return;
        }

        if (state.isMuted) {
            unmute();
            return;
        }

        mute();
    }

    function answerCall() {
        var session = state.currentSession;

        if (!session || session.direction !== 'incoming' || state.activeCall || session.pbxAnswered) {
            return;
        }

        debugOut('Answering call');
        session.pbxAnswered = true;
        stopRingTone();
        updateCallButtons();
        session.accept(getMediaOptions());
    }

    function hangupCall() {
        var session = state.currentSession;

        if (!session) {
            return;
        }

        debugOut('Hang up pressed');

        try {
            session.terminate();
        } catch (error) {
            debugOut('Terminate failed: ' + error);
        }

        resetCallState('');
    }

    function dialNumber(target) {
        var number = String(target || '').replace(/[^0-9A-Za-z*#+_.\-]/g, '');

        if (!number || !state.phone || state.currentSession) {
            return;
        }

        debugOut('Dialing ' + number);

        try {
            var session = state.phone.invite(number, getMediaOptions());
            session.direction = 'outgoing';
            bindSessionEvents(session);
        } catch (error) {
            setErrorState('Unable to place call: ' + error.message);
        }
    }

    function dialFromBox() {
        if (flags.dialbox === 'N' || !elements.dialDigits) {
            return;
        }

        dialNumber(elements.dialDigits.value);
    }

    function adjustVolume(delta) {
        var voice = elements.voice;
        var volume;

        if (flags.volume === 'N' || !voice) {
            return;
        }

        volume = Math.min(1, Math.max(0, Math.round((voice.volume + delta) * 10) / 10));
        voice.volume = volume;
        debugOut('Volume ' + Math.round(volume * 100) + '%');
    }

    function getSessionDisplayName(session) {
        if (!session || !session.remoteIdentity) {
            return 'Unknown';
        }

        if (session.remoteIdentity.displayName) {
            return session.remoteIdentity.displayName;
        }

        if (session.remoteIdentity.uri && session.remoteIdentity.uri.user) {
            return session.remoteIdentity.uri.user;
        }

        return 'Unknown';
    }

    function attachMediaToSession(session) {
        if (!session || !session.sessionDescriptionHandler) {
            return;
        }

        var peerConnection = session.sessionDescriptionHandler.peerConnection;
        if (!peerConnection) {
            return;
        }

        if (peerConnection.getReceivers) {
            state.remoteStream = new window.MediaStream();
            peerConnection.getReceivers().forEach(function (receiver) {
                if (receiver.track) {
                    state.remoteStream.addTrack(receiver.track);
                }
            });
        } else {
            state.remoteStream = peerConnection.getRemoteStreams()[0] || null;
        }

        syncLegacyGlobals();

        if (!elements.voice || !state.remoteStream) {
            return;
        }

        elements.voice.srcObject = state.remoteStream;
        playAudio(elements.voice);
    }

    function bindSessionEvents(session) {
        var displayName = getSessionDisplayName(session);
        var initialStatus = (session.direction === 'incoming' ? lang.ringing : lang.trying) + ': ' + displayName;

        setCallState(initialStatus);
        setCurrentSession(session);

        if (session.direction === 'incoming') {
            startRingTone();
        }

        session.on('progress', function () {
            if (session.direction === 'outgoing') {
                setCallState(lang.attempting);
            }
        });

        session.on('connecting', function () {
            if (session.direction === 'outgoing') {
                setCallState('Connecting...');
            }
        });

        session.on('accepted', function () {
            attachMediaToSession(session);
            stopRingTone();
            setCallState(lang.incall);
            setActiveCall(true);
            setMuteState(false);
        });

        session.on('hold', function () {
            setActiveCall(false);
            setCallState('On hold');
        });

        session.on('unhold', function () {
            setActiveCall(true);
            setCallState(state.isMuted ? 'Muted' : lang.incall);
        });

        session.on('muted', function () {
            setMuteState(true);
            setCallState('Muted');
        });

        session.on('unmuted', function () {
            setMuteState(false);
            setCallState(lang.incall);
        });

        function endIfCurrent(message) {
            if (state.currentSession === session) {
                resetCallState(message);
            }
        }

        session.on('cancel', function () {
            endIfCurrent('Canceled');
        });

        session.on('bye', function () {
            endIfCurrent('');
        });

        session.on('failed', function () {
            endIfCurrent('Terminated');
        });

        session.on('rejected', function () {
            endIfCurrent(lang.reject);
        });

        session.on('terminated', function () {
            endIfCurrent(elements.callState ? elements.callState.textContent : '');
        });

        if (session.direction === 'incoming') {
            if (flags.autoAnswer === 'N') {
                debugOut('Incoming call from ' + displayName + ', waiting for Answer');
                return;
            }

            debugOut('Auto-answering call from ' + displayName);
            session.pbxAnswered = true;
            session.accept(getMediaOptions());
        }
    }

    function applyBrowserSpecificConfig(sipConfig) {
        var browserUa = window.navigator.userAgent.toLowerCase();
        var modifiers = null;

        if (browserUa.indexOf('safari') > -1 && browserUa.indexOf('chrome') < 0) {
            if (window.SIP.Web && window.SIP.Web.Modifiers && window.SIP.Web.Modifiers.stripG722) {
                modifiers = [window.SIP.Web.Modifiers.stripG722];
            }
        }

        if (browserUa.indexOf('firefox') > -1 && browserUa.indexOf('chrome') < 0) {
            sipConfig.sessionDescriptionHandlerFactoryOptions.alwaysAcquireMediaFirst = true;
            if (window.SIP.Web && window.SIP.Web.Modifiers && window.SIP.Web.Modifiers.addMidLines) {
                modifiers = [window.SIP.Web.Modifiers.addMidLines];
            }
        }

        if (modifiers) {
            sipConfig.sessionDescriptionHandlerFactoryOptions.modifiers = modifiers;
        }
    }

    function buildSipConfig() {
        var wsUrl = appConfig.webSocketUrl || '';
        var phoneLogin = appConfig.phoneLogin || '';
        var sipConfig = {
            password: appConfig.phonePassword || '',
            authorizationUser: phoneLogin,
            displayName: phoneLogin,
            uri: 'sip:' + phoneLogin + '@' + extractDomain(wsUrl),
            transportOptions: {
                wsServers: [wsUrl],
                traceSip: Boolean(flags.debug)
            },
            hackWssInTransport: true,
            registerExpires: 30,
            hackIpInContact: true,
            log: {
                level: flags.debug ? 3 : 2
            },
            sessionDescriptionHandlerFactoryOptions: {
                constraints: {
                    audio: audioConstraints,
                    video: false
                },
                peerConnectionOptions: {
                    rtcConfiguration: {
                        rtcpMuxPolicy: 'negotiate'
                    }
                },
                iceCheckingTimeout: 10000
            }
        };

        applyBrowserSpecificConfig(sipConfig);

        return sipConfig;
    }

    function getValidationError() {
        var errors = [];

        if (!appConfig.webSocketUrl || appConfig.webSocketUrl.length < 5) {
            errors.push('WebSocket URL is missing or invalid. Please check your settings.');
        }

        if (!appConfig.phoneLogin) {
            errors.push('Phone login is not provided. Please check your settings.');
        }

        return errors.join(' ');
    }

    function unregisterPhone() {
        if (state.phone && state.phone.isRegistered()) {
            state.phone.unregister();
        }
    }

    function bindLifecycleEvents() {
        function handleUnload() {
            console.info('Unregistering phone with closing event');
            unregisterPhone();
        }

        window.addEventListener('beforeunload', handleUnload);
        window.addEventListener('pagehide', handleUnload);
    }

    function bindUiEvents() {
        if (elements.keyPadToggle) {
            elements.keyPadToggle.addEventListener('click', toggleKeyPad);
        }

        if (elements.keyPadClose) {
            elements.keyPadClose.addEventListener('click', closeKeyPad);
        }

        if (elements.muteButton) {
            elements.muteButton.addEventListener('click', toggleMute);
        }

        if (elements.answerButton) {
            elements.answerButton.addEventListener('click', answerCall);
        }

        if (elements.hangupButton) {
            elements.hangupButton.addEventListener('click', hangupCall);
        }

        if (elements.volumeDown) {
            elements.volumeDown.addEventListener('click', function () {
                adjustVolume(-VOLUME_STEP);
            });
        }

        if (elements.volumeUp) {
            elements.volumeUp.addEventListener('click', function () {
                adjustVolume(VOLUME_STEP);
            });
        }

        if (elements.dialButton) {
            elements.dialButton.addEventListener('click', dialFromBox);
        }

        if (elements.dialDigits) {
            elements.dialDigits.addEventListener('keydown', function (event) {
                if (event.key === 'Enter') {
                    dialFromBox();
                }
            });
        }

        Array.prototype.forEach.call(elements.dtmfButtons, function (button) {
            button.addEventListener('click', function () {
                sendDtmf(button.getAttribute('data-dtmf'));
            });
        });
    }

    function initializePhone() {
        var validationError = getValidationError();
        if (validationError) {
            setErrorState(validationError);
            return;
        }

        setErrorState('');

        if (!window.SIP || !window.SIP.UA) {
            setErrorState('SIP library failed to load.');
            return;
        }

        state.phone = new window.SIP.UA(buildSipConfig());
        syncLegacyGlobals();

        state.phone.on('connected', function () {
            debugOut('WebSocket connected');
            setState(lang.connected, 'pending');
        });

        state.phone.on('disconnected', function () {
            debugOut('WebSocket disconnected');
            setState(lang.disconnected, 'error');
        });

        state.phone.on('registrationFailed', function () {
            debugOut('Registration failed');
            setState(lang.regFailed, 'error');
        });

        state.phone.on('unregistered', function () {
            debugOut('Unregistered');
            setState(lang.unregistered, 'error');
        });

        state.phone.on('registered', function () {
            debugOut('Registered');
            setState(lang.registered, 'ok');

            // VICIphone dialRegExten: call the agent's conference (SESSION option) once registered.
            if (!state.regExtenDialed && readBooleanSetting('dialRegExten', false) && appConfig.sessionId) {
                state.regExtenDialed = true;
                dialNumber(appConfig.sessionId);
            }
        });

        state.phone.on('invite', function (incomingSession) {
            if (state.currentSession) {
                incomingSession.reject();
                return;
            }

            incomingSession.direction = 'incoming';
            bindSessionEvents(incomingSession);
        });
    }

    function init() {
        cacheElements();
        syncLegacyGlobals();
        updateMuteButtonLabel();
        applyLayout();
        applyFeatureFlags();
        updateCallButtons();
        bindUiEvents();
        bindLifecycleEvents();
        initializePhone();

        window.openKeyPad = openKeyPad;
        window.closeKeyPad = closeKeyPad;
        window.sipSendDTMF = sendDtmf;
        window.mute_unmute = toggleMute;
        window.answerCall = answerCall;
        window.hangupCall = hangupCall;
        window.dialNumber = dialNumber;
        window.unRegisterPhone = unregisterPhone;
    }

    document.addEventListener('DOMContentLoaded', init);
})(window, document);
