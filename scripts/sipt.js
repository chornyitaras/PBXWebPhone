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



$(document).ready(function () {
    // Initialize the library (all console debuggers enabled)
    Janus.init({debug: "all", callback: function () {

            if (started)
                return;
            started = true;

            // Make sure the browser supports WebRTC
            if (!Janus.isWebrtcSupported()) {
               setState("No WebRTC support... ");
                return;
            }
            // Create session
            janus = new Janus(
                    {
                        server: server,
                        success: function () {
                            // Attach to echo test plugin
                            janus.attach(
                                    {
                                        plugin: "janus.plugin.sip",
                                        opaqueId: opaqueId,
                                        success: function (pluginHandle) {
                                            $('#details').remove();
                                            sipcall = pluginHandle;
                                            Janus.log("Plugin attached! (" + sipcall.getPlugin() + ", id=" + sipcall.getId() + ")");
                                            registerUsername();

                                        },
                                        error: function (error) {
                                            Janus.error("  -- Error attaching plugin...", error);
                                            setState("Error attaching plugin... " + error);
                                        },
                                        onmessage: function (msg, jsep) {
                                            Janus.debug(" ::: Got a message :::");
                                            Janus.debug(JSON.stringify(msg));
                                            // Any error?
                                            var error = msg["error"];
                                            if (error != null && error != undefined) {
                                                if (!registered) {

                                                } else {
                                                    // Reset status
                                                    sipcall.hangup();

                                                }
                                                return;
                                            }
                                            var result = msg["result"];
                                            if (result !== null && result !== undefined && result["event"] !== undefined && result["event"] !== null) {
                                                var event = result["event"];
                                                if (event === 'registration_failed') {
                                                    Janus.warn("Registration failed: " + result["code"] + " " + result["reason"]);

                                                    setState(result["code"] + " " + result["reason"]);
                                                    return;
                                                }
                                                if (event === 'registered') {
                                                    Janus.log("Successfully registered as " + result["username"] + "!");
                                                    setState("Successfully registered as " + result["username"] + "!");
                                                    if (!registered) {
                                                        registered = true;
                                                    }
                                                } else if (event === 'calling') {
                                                    Janus.log("Waiting for the peer to answer...");
                                                    startRingTone();

                                                } else if (event === 'incomingcall') {
                                                    Janus.log("Incoming call from " + result["username"] + "!");
                                                    setCallState("Incoming call from " + result["username"] + "!");
                                                    var doAudio = true, doVideo = true;
                                                    if (jsep !== null && jsep !== undefined) {
                                                        // What has been negotiated?
                                                        doAudio = (jsep.sdp.indexOf("m=audio ") > -1);
                                                        doVideo = false;
                                                        Janus.debug("Audio " + (doAudio ? "has" : "has NOT") + " been negotiated");
                                                        Janus.debug("Video " + (doVideo ? "has" : "has NOT") + " been negotiated");
                                                    }
                                                    // Any security offered? A missing "srtp" attribute means plain RTP
                                                    var rtpType = "";
                                                    var srtp = result["srtp"];
                                                    if (srtp === "sdes_optional")
                                                        rtpType = " (SDES-SRTP offered)";
                                                    else if (srtp === "sdes_mandatory")
                                                        rtpType = " (SDES-SRTP mandatory)";
                                                    incoming = null;

                                                    sipcall.createAnswer(
                                                            {
                                                                jsep: jsep,
                                                                media: {audio: doAudio, video: doVideo},
                                                                success: function (jsep) {
                                                                    Janus.debug("Got SDP! audio=" + doAudio + ", video=" + doVideo);
                                                                    Janus.debug(jsep);
                                                                    var body = {request: "accept"};
                                                                    // Note: as with "call", you can add a "srtp" attribute to
                                                                    // negotiate/mandate SDES support for this incoming call.
                                                                    // The default behaviour is to automatically use it if
                                                                    // the caller negotiated it, but you may choose to require
                                                                    // SDES support by setting "srtp" to "sdes_mandatory", e.g.:
                                                                    //		var body = { request: "accept", srtp: "sdes_mandatory" };
                                                                    // This way you'll tell the plugin to accept the call, but ONLY
                                                                    // if SDES is available, and you don't want plain RTP. If it
                                                                    // is not available, you'll get an error (452) back.
                                                                    sipcall.send({"message": body, "jsep": jsep});

                                                                },
                                                                error: function (error) {
                                                                    Janus.error("WebRTC error:", error);
                                                                  //  bootbox.alert("WebRTC error... " + JSON.stringify(error));
                                                                    // Don't keep the caller waiting any longer, but use a 480 instead of the default 486 to clarify the cause
                                                                    var body = {"request": "decline", "code": 480};
                                                                    sipcall.send({"message": body});
                                                                }
                                                            });

                                                } else if (event === 'accepted') {
                                                    Janus.log(result["username"] + " accepted the call!");
                                                    setCallState("Answered");
                                                    stopRingTone();
                                                    // TODO Video call can start
                                                    if (jsep !== null && jsep !== undefined) {
                                                        sipcall.handleRemoteJsep({jsep: jsep, error: doHangup});
                                                    }
                                                } else if (event === 'hangup') {
                                                    setCallState("Call hung up (" + result["code"] + " " + result["reason"] + ")!");
                                                    if (incoming != null) {
                                                        incoming.modal('hide');
                                                        incoming = null;
                                                    }
                                                    Janus.log("Call hung up (" + result["code"] + " " + result["reason"] + ")!");
                                                    // Reset status
                                                    sipcall.hangup();
                                                }
                                            }
                                        },
                                        onlocalstream: function (stream) {
                                            Janus.debug(" ::: Got a local stream :::");
                                            Janus.debug(JSON.stringify(stream));
                                            Janus.attachMediaStream($('#voice').get(0), stream);
                                            $("#voice").get(0).muted = "muted";
                                        },
                                        onremotestream: function (stream) {
                                            Janus.debug(" ::: Got a remote stream :::");
                                            Janus.debug(JSON.stringify(stream));
                                            Janus.attachMediaStream($('#voice1').get(0), stream);
                                            var videoTracks = stream.getVideoTracks();

                                        },
                                        oncleanup: function () {
                                            Janus.log(" ::: Got a cleanup notification :::");
                                        }
                                    });
                        },
                        error: function (error) {
                            Janus.error(error);
                           /* bootbox.alert(error, function () {
                                window.location.reload();
                            });*/
                        },
                        destroyed: function () {
                            window.location.reload();
                        }
                    });

        }});

});

















function registerUsername() {

    /*	var sipserver = "sip:vici.erplars.com"; 
     
     var username = "sip:150@vici.erplars.com"; 
     
     var password = "GOdOygiELE7S4Xr";*/
    /* var sipserver = "sip:myvici.com.ua";
     
     var username = "sip:8002@myvici.com.ua";
     
     var password = "fYsAlwh8K8oTn7T"; 
     
     var register = {
     "request" : "register",
     "username" : username
     };*/
    var displayname = "150"
    if (displayname) {
        register.display_name = displayname;
    }

    register["secret"] = password;


    register["proxy"] = sipserver;
    sipcall.send({"message": register});

}
