<?php header('Content-type: text/html; charset=utf-8'); ?>

<?php
if (isset($_GET["phone_login"])) {
    $phone_login = $_GET["phone_login"];
} elseif (isset($_POST["phone_login"])) {
    $phone_login = $_POST["phone_login"];
} else {
    $phone_login = "";
}

if (isset($_GET["phone_pass"])) {
    $phone_pass = $_GET["phone_pass"];
} elseif (isset($_POST["phone_pass"])) {
    $phone_pass = $_POST["phone_pass"];
} else {
    $phone_pass = "";
}

if (isset($_GET["server_ip"])) {
    $server_ip = $_GET["server_ip"];
} elseif (isset($_POST["server_ip"])) {
    $server_ip = $_POST["server_ip"];
} else {
    $server_ip = "";
}

if (isset($_GET["options"])) {
    $options = $_GET["options"];
} elseif (isset($_POST["options"])) {
    $options = $_POST["options"];
} else {
    $options = "";
}

$phone_pass  = base64_decode($phone_pass);
$server_ip   = base64_decode($server_ip);
$phone_login = base64_decode($phone_login);
$options     = base64_decode($options);
?>
<html>
<head>
    <title>WEB PHONE</title>
</head>
<body>
<audio id="bell" src="sounds/incoming.mp3" loop></audio>
<audio id="voice"></audio>

<p id="state"></p>
<p id="callState"></p>
<p id="errState"></p>
<button id="btn" onclick="mute_unmute()">Mute</button>
<script type="text/javascript" src="scripts/sip-0.7.7.min.js"></script>
<script type="text/javascript" src="https://code.jquery.com/jquery-1.11.3.min.js"></script>
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min.js"></script>
<script type="text/javascript">

    var bell = document.getElementById('bell');
    var state = document.getElementById('state');
    var Stream;
    var activeCall = false;
    var ws_url = "";
    var Session = null;
    var isMuted = false;
    var options = <?php echo json_encode($options) ?>;
    options = options.split("--");
    for (i in options) {
        if (options[i].search("WEBSOCKETURL") === 0)
            ws_url = options[i].split("WEBSOCKETURL")[1];

    }
    function extractDomain(url) {
        var domain;
        //find & remove protocol (http, ftp, etc.) and get domain
        if (url.indexOf("://") > -1) {
            domain = url.split('/')[2];
        } else {
            domain = url.split('/')[0];
        }

        //find & remove port number
        domain = domain.split(':')[0];

        return domain;
    }
    function mute() {

        if (Session) {
            Session.mute();
        }
    }

    function unmute() {

        if (Session) {
            Session.unmute();
        }
    }
    function mute_unmute() {
        if (activeCall) {
            if (!isMuted) {
                mute();
                $('#btn').html("Unmute");
            } else {
                unmute();
                $('#btn').html("Mute");
            }
        }
    }
    if (ws_url.length < 5) {
        $('#errState').html("Got wrong web socket url. Please check your settings");
    } else {
        $('#errState').html(null);
    }
    
    var phoneLogin = <?php echo json_encode($phone_login) ?>;
    if (!phoneLogin) {
        $('#errState').html("Phone login is not provided. Please check your settings");
    } else {
        $('#errState').html(null);
    }
    
    var config = {
        password: <?php echo json_encode($phone_pass) ?>,
        authorizationUser: phoneLogin,
        displayName: phoneLogin,
        uri: 'sip:' + phoneLogin + '@' + extractDomain(ws_url),
        wsServers: ws_url,
        hackWssInTransport: true,
        registerExpires: 30,
        iceCheckingTimeout: 10000,
        hackIpInContact: true,
        rtcpMuxPolicy: "negotiate",
        traceSip: false,
        log: {
            level: 2
        }
    };
</script>
<script type="text/javascript" src="scripts/phone.js"></script>
</body>
</html>
