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
	<audio id="dtmf_1" src="sounds/dtmf/1.wav"></audio>
	<audio id="dtmf_2" src="sounds/dtmf/2.wav"></audio>
	<audio id="dtmf_3" src="sounds/dtmf/3.wav"></audio>
	<audio id="dtmf_4" src="sounds/dtmf/4.wav"></audio>
	<audio id="dtmf_5" src="sounds/dtmf/5.wav"></audio>
	<audio id="dtmf_6" src="sounds/dtmf/6.wav"></audio>
	<audio id="dtmf_7" src="sounds/dtmf/7.wav"></audio>
	<audio id="dtmf_8" src="sounds/dtmf/8.wav"></audio>
	<audio id="dtmf_9" src="sounds/dtmf/9.wav"></audio>
	<audio id="dtmf_0" src="sounds/dtmf/0.wav"></audio>
	<audio id="dtmf_*" src="sounds/dtmf/s.wav"></audio>
	<audio id="dtmf_#" src="sounds/dtmf/h.wav"></audio>

	<audio id="dtmfTone" src="sounds/dtmf.wav"> </audio>
	<p id="state"></p>
	<p id="callState"></p>
	<p id="errState"></p>

	<div id='divKeyPad' class='span2 well div-keypad' style="left:0px; top:0px; width:250; height:240; visibility:hidden">
		<table style="width: 100%; height: 100%">
			<tr>
				<td><input type="button" style="width: 33%" class="btn" value="1" onclick="sipSendDTMF('1');" /><input type="button" style="width: 33%" class="btn" value="2" onclick="sipSendDTMF('2');" /><input type="button" style="width: 33%" class="btn" value="3" onclick="sipSendDTMF('3');" /></td>
			</tr>
			<tr>
				<td><input type="button" style="width: 33%" class="btn" value="4" onclick="sipSendDTMF('4');" /><input type="button" style="width: 33%" class="btn" value="5" onclick="sipSendDTMF('5');" /><input type="button" style="width: 33%" class="btn" value="6" onclick="sipSendDTMF('6');" /></td>
			</tr>
			<tr>
				<td><input type="button" style="width: 33%" class="btn" value="7" onclick="sipSendDTMF('7');" /><input type="button" style="width: 33%" class="btn" value="8" onclick="sipSendDTMF('8');" /><input type="button" style="width: 33%" class="btn" value="9" onclick="sipSendDTMF('9');" /></td>
			</tr>
			<tr>
				<td><input type="button" style="width: 33%" class="btn" value="*" onclick="sipSendDTMF('*');" /><input type="button" style="width: 33%" class="btn" value="0" onclick="sipSendDTMF('0');" /><input type="button" style="width: 33%" class="btn" value="#" onclick="sipSendDTMF('#');" /></td>
			</tr>
			<tr>
				<td colspan=3><input type="button" style="width: 100%" class="btn btn-medium btn-danger" value="close" onclick="closeKeyPad();" /></td>
			</tr>
		</table>
	</div>


	<button id="btn" onclick="mute_unmute()">Mute</button>
	<input type="button" class="btn" style="" id="btnKeyPad" value="KeyPad" onclick='openKeyPad();' />
	<script type="text/javascript" src="scripts/sip-0.11.6.min.js"></script>
	<script type="text/javascript" src="https://code.jquery.com/jquery-1.11.3.min.js"></script>
	<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min.js"></script>
	<script type="text/javascript">
		var bell = document.getElementById('bell');
		var state = document.getElementById('state');
		var Stream;
		var audioCtx;
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

		//--------------------------------------------//
		function openKeyPad() {
			divKeyPad.style.visibility = 'visible';
			divKeyPad.style.left = ((document.body.clientWidth - C.divKeyPadWidth) >> 1) + 'px';
			divKeyPad.style.top = '70px';
			divGlassPanel.style.visibility = 'visible';
		}

		function closeKeyPad() {
			divKeyPad.style.left = '0px';
			divKeyPad.style.top = '0px';
			divKeyPad.style.visibility = 'hidden';
			divGlassPanel.style.visibility = 'hidden';
		}

		function sipSendDTMF(c) {
			if (Session && c) {
				if (Session.dtmf(c) == 0) {
					try {
						dtmfTone.play();
					} catch (e) {}
				}
			}
		}
		//--------------------------------------------------//


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


		// uri: 'sip:' + phoneLogin + '@' + extractDomain(ws_url),

		var config = {
			password: <?php echo json_encode($phone_pass) ?>,
			authorizationUser: phoneLogin,
			displayName: phoneLogin,
			uri: 'sip:' + phoneLogin + '@' + extractDomain(ws_url),
			transportOptions: {
				wsServers: [ws_url],
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
						"rtcpMuxPolicy": "negotiate"
					}
				},
				iceCheckingTimeout: 10000
			}
		};

		var browserUa = navigator.userAgent.toLowerCase();
		var isSafari = false;
		var isFirefox = false;
		if (browserUa.indexOf('safari') > -1 && browserUa.indexOf('chrome') < 0) {
			isSafari = true;
		} else if (browserUa.indexOf('firefox') > -1 && browserUa.indexOf('chrome') < 0) {
			isFirefox = true;
		}
		if (isSafari) {
			config.sessionDescriptionHandlerFactoryOptions.modifiers = [SIP.Web.Modifiers.stripG722];
		}

		if (isFirefox) {
			config.sessionDescriptionHandlerFactoryOptions.alwaysAcquireMediaFirst = true;
			config.sessionDescriptionHandlerFactoryOptions.modifiers = [SIP.Web.Modifiers.addMidLines];

		}
	</script>
	<script type="text/javascript" src="scripts/phone.js?0.11.3e"></script>
</body>

</html>