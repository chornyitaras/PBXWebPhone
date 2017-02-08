function startRingTone() {
    try {
        bell.play();
    } catch (e) {
    }
}

function stopRingTone() {
    try {
        bell.pause();
    } catch (e) {
    }
}

function setState(newState) {
    try {
        state.innerHTML = newState.toString();
    } catch (e) {
    }
}
function setCallState(newStatus) {
    $('#callState').html(newStatus);
}

function getUserMediaFailure(e) {
    window.console.error('getUserMedia failed:', e);
    setState("You must allow access to your microphone.");
}

function getUserMediaSuccess(stream) {
    Stream = stream;
}
function newSession(newSess) {

    newSess.displayName = newSess.remoteIdentity.displayName || newSess.remoteIdentity.uri.user;

    var status;

    if (newSess.direction === 'incoming') {
        status = "Incoming: " + newSess.displayName;
        startRingTone();
    } else {
        status = "Trying: " + newSess.displayName;

    }

    setCallState(status);

    // EVENT CALLBACKS

    newSess.on('progress', function (e) {
        if (e.direction === 'outgoing') {
            setCallState('Calling...');
        }
    });

    newSess.on('connecting', function (e) {
        if (e.direction === 'outgoing') {
            setCallState('Connecting...');
        }
    });

    newSess.on('accepted', function (e) {
        stopRingTone();
        setCallState('Answered');

        activeCall = true;
    });

    newSess.on('hold', function (e) {
        activeCall = false;

    });

    newSess.on('unhold', function (e) {

        activeCall = true;
    });

    newSess.on('muted', function (e) {
        isMuted = true;
        setCallState("Muted");
    });

    newSess.on('unmuted', function (e) {
        isMuted = false;
        setCallState("Answered");
    });

    newSess.on('cancel', function (e) {
        stopRingTone();
        setCallState("Canceled");
        if (this.direction === 'outgoing') {
            activeCall = false;
            newSess = null;

        }
    });

    newSess.on('bye', function (e) {
        stopRingTone();
        setState("");

        activeCall = false;
        newSess = null;
    });

    newSess.on('failed', function (e) {
        stopRingTone();
        setCallState('Terminated');
    });

    newSess.on('rejected', function (e) {
        stopRingTone();
        setCallState('Rejected');
        activeCall = false;

        newSess = null;
    });

    newSess.accept({
        media: {
            stream: Stream,
            constraints: {audio: true, video: false},
            render: {
                remote: document.getElementById('voice')
            },
            RTCConstraints: {"optional": [{'DtlsSrtpKeyAgreement': 'true'}]}
        }
    });
    Session = newSess;

}

$(document).ready(function () {

    var phone = new SIP.UA(config);
    phone.on('connected', function (e) {
        setState("Connected");
    });

    phone.on('disconnected', function (e) {
        setState('An Error occurred while connecting to the websocket.');
    });

    phone.on('registrationFailed', function (e) {
        setState('An Error occurred while registering your phone. Check your settings.');
    });

    phone.on('unregistered', function (e) {
        setState('An Error occurred while registering your phone. Check your settings.');
    });

    phone.on('registered', function (e) {

        setState("Ready");

        // Get the userMedia and cache the stream
        if (SIP.WebRTC.isSupported()) {
            SIP.WebRTC.getUserMedia({audio: true, video: false}, getUserMediaSuccess, getUserMediaFailure);
        }
    });

    phone.on('invite', function (incomingSession) {

        var s = incomingSession;
        if (activeCall) {
            s.reject();
            return;
        }
        s.direction = 'incoming';
        newSession(s);


    });

    // export a global function for un-registering the phone
    window.unRegisterPhone = function () {
        if (phone.isRegistered()) {
            phone.unregister();
        }
    };

    var unRegisterPhoneEvent = function (e) {
        window.unRegisterPhone();
    };

    // register onbeforeunload event
    if (typeof window.onbeforeunload === "function") {
        var oldUnloadEvent = window.onbeforeunload;
        window.onbeforeunload = function (e) {
            unRegisterPhoneEvent();
            oldUnloadEvent(e);
        }
    } else {
        window.onbeforeunload = unRegisterPhoneEvent;
    }

    // register onclose event
    if (typeof window.onclose === "function") {
        var oldCloseEvent = window.onclose;
        window.onclose = function (e) {
            unRegisterPhoneEvent();
            oldCloseEvent(e);
        }
    } else {
        window.onclose = unRegisterPhoneEvent;
    }

});
