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
        <audio id="ringtone" src="sounds/incoming.mp3" loop></audio>
        <audio id="audioRemote"></audio>

        <p id="status"></p>
        <script type="text/javascript" src="scripts/sip-0.7.5.min.js"></script>
    </body>
</html>
