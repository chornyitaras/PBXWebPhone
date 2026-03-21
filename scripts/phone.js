(function (window, document) {
    'use strict';

    var appConfig = window.PBXWebPhoneConfig || {};
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
        elements.dtmfTone = byId('dtmfTone');
        elements.dtmfButtons = document.querySelectorAll('[data-dtmf]');
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

    function setState(message) {
        setText(elements.connectionState, message);
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
    }

    function setMuteState(isMuted) {
        state.isMuted = Boolean(isMuted);
        updateMuteButtonLabel();
        syncLegacyGlobals();
    }

    function setCurrentSession(session) {
        state.currentSession = session || null;
        syncLegacyGlobals();
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

        elements.keyPad.style.visibility = isVisible ? 'visible' : 'hidden';
        elements.keyPad.setAttribute('aria-hidden', isVisible ? 'false' : 'true');
    }

    function openKeyPad() {
        showKeyPad(true);
    }

    function closeKeyPad() {
        showKeyPad(false);
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
            playAudio(elements.dtmfTone);
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
            setCallState('Answered');
        }
    }

    function toggleMute() {
        if (!state.activeCall || !state.currentSession) {
            return;
        }

        if (state.isMuted) {
            unmute();
            return;
        }

        mute();
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
        var initialStatus = session.direction === 'incoming' ? 'Incoming: ' + displayName : 'Trying: ' + displayName;

        setCallState(initialStatus);
        setCurrentSession(session);

        if (session.direction === 'incoming') {
            startRingTone();
        }

        session.on('progress', function (event) {
            if (event.direction === 'outgoing') {
                setCallState('Calling...');
            }
        });

        session.on('connecting', function (event) {
            if (event.direction === 'outgoing') {
                setCallState('Connecting...');
            }
        });

        session.on('accepted', function () {
            attachMediaToSession(session);
            stopRingTone();
            setCallState('Answered');
            setActiveCall(true);
            setMuteState(false);
        });

        session.on('hold', function () {
            setActiveCall(false);
            setCallState('On hold');
        });

        session.on('unhold', function () {
            setActiveCall(true);
            setCallState(state.isMuted ? 'Muted' : 'Answered');
        });

        session.on('muted', function () {
            setMuteState(true);
            setCallState('Muted');
        });

        session.on('unmuted', function () {
            setMuteState(false);
            setCallState('Answered');
        });

        session.on('cancel', function () {
            resetCallState('Canceled');
        });

        session.on('bye', function () {
            setState('');
            resetCallState('');
        });

        session.on('failed', function () {
            resetCallState('Terminated');
        });

        session.on('rejected', function () {
            resetCallState('Rejected');
        });

        if (session.direction === 'incoming') {
            session.accept();
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
                traceSip: false
            },
            hackWssInTransport: true,
            registerExpires: 30,
            hackIpInContact: true,
            log: {
                level: 2
            },
            sessionDescriptionHandlerFactoryOptions: {
                constraints: {
                    audio: true,
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
            elements.keyPadToggle.addEventListener('click', openKeyPad);
        }

        if (elements.keyPadClose) {
            elements.keyPadClose.addEventListener('click', closeKeyPad);
        }

        if (elements.muteButton) {
            elements.muteButton.addEventListener('click', toggleMute);
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
            setState('Connected');
        });

        state.phone.on('disconnected', function () {
            setState('An error occurred while connecting to the WebSocket.');
        });

        state.phone.on('registrationFailed', function () {
            setState('An error occurred while registering your phone. Check your settings.');
        });

        state.phone.on('unregistered', function () {
            setState('An error occurred while registering your phone. Check your settings.');
        });

        state.phone.on('registered', function () {
            setState('Ready');
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
        bindUiEvents();
        bindLifecycleEvents();
        initializePhone();

        window.openKeyPad = openKeyPad;
        window.closeKeyPad = closeKeyPad;
        window.sipSendDTMF = sendDtmf;
        window.mute_unmute = toggleMute;
        window.unRegisterPhone = unregisterPhone;
    }

    document.addEventListener('DOMContentLoaded', init);
})(window, document);
