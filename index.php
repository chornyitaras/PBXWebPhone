<?php header('Content-type: text/html; charset=utf-8'); ?>

<?php

if (isset($_GET["phone_login"]))		{$phone_login=$_GET["phone_login"];}
        elseif (isset($_POST["phone_login"]))	{$phone_login=$_POST["phone_login"];}
if (isset($_GET["phone_pass"]))			{$phone_pass=$_GET["phone_pass"];}
        elseif (isset($_POST["phone_pass"]))    {$phone_pass=$_POST["phone_pass"];}
if (isset($_GET["server_ip"]))			{$server_ip=$_GET["server_ip"];}
        elseif (isset($_POST["server_ip"]))	{$server_ip=$_POST["server_ip"];}

$phone_pass = base64_decode($phone_pass);
$server_ip = base64_decode($server_ip);
$phone_login = base64_decode($phone_login);

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
        <script type="text/javascript" src="scripts/sip-0.7.5.min.js"></script>
		<script type="text/javascript" src="https://code.jquery.com/jquery-1.11.3.min.js"></script>
        <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min.js"></script>
        <script type="text/javascript">

            var bell = document.getElementById('bell');
            var state = document.getElementById('state');
            var Stream;
			var callActiveID;
            var url = window.location.href;
            var arr = url.split("/");
            var config = {
                password: '<?php echo $phone_pass ?>',
                authorizationUser: '<?php echo $phone_login ?>',
                displayName: '<?php echo $phone_login ?>',//,
                uri: 'sip:' + '<?php echo $phone_login ?>' + '@' + arr[2],
                wsServers: 'wss://'+ arr[2] +':8089/ws',
                hackWssInTransport: true,
                registerExpires: 30,
                iceCheckingTimeout: 10000,
                hackViaTcp: true,
                hackIpInContact: true,
                traceSip: false,
                log: {
                    level: 3
                }
            };
        </script>
        <script type="text/javascript" src="scripts/phone.js"></script>
    </body>
</html>
