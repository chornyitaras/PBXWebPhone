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
        attachMediaToSession(newSess);
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

    newSess.accept();
    Session = newSess;

}

function attachMediaToSession(session) {

    var pc = session.sessionDescriptionHandler.peerConnection;
    if (pc.getReceivers) {
        Stream = new window.MediaStream();
        pc.getReceivers().forEach(function (receiver) {
            var track = receiver.track;
            if (track) {
                Stream.addTrack(track);
            }
        });
    } else {
        Stream = pc.getRemoteStreams()[0];
    }

    var domElement = document.getElementById('voice');
    domElement.srcObject = Stream;
    domElement.play();
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
        //getUserMediaStream();
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

    window.SIPPhone = phone;

    var unRegisterPhoneEvent = function (e) {
        console.info("Unregistering phone with closing event");
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
