<?php
/**
 * User: Bahadir Malkoc
 * Date: 08/02/2017
 * Time: 18:15
 * Purpose: Provide interactive test without a vicidial instance
 */

if (!empty($_REQUEST['test_form'])) {

    $phone_login   = "";
    $phone_pass    = "";
    $server_ip     = "";
    $websocket_url = "";
    $system_key    = "";
    $callerid      = "";
    $codecs        = "";
    $protocol      = "SIP";

    if (!empty($_REQUEST['phone_login'])) {
        $phone_login = trim($_REQUEST['phone_login']);
    }

    if (!empty($_REQUEST['phone_pass'])) {
        $phone_pass = trim($_REQUEST['phone_pass']);
    }

    if (!empty($_REQUEST['server_ip'])) {
        $server_ip = trim($_REQUEST['server_ip']);
    }

    if (!empty($_REQUEST['websocket_url'])) {
        $websocket_url = trim($_REQUEST['websocket_url']);
    }

    if (!empty($_REQUEST['system_key'])) {
        $system_key = trim($_REQUEST['system_key']);
    }

    if (!empty($_REQUEST['callerid'])) {
        $callerid = trim($_REQUEST['callerid']);
    }

    if (!empty($_REQUEST['codecs'])) {
        $codecs = trim($_REQUEST['codecs']);
    }

    if (!empty($_REQUEST['protocol'])) {
        $protocol = trim($_REQUEST['protocol']);
    }


    $optionstr = "INITIAL_LOAD--DIALPAD_Y--AUTOANSWER_Y--WEBSOCKETURL$websocket_url";

    $query = http_build_query(array(
        'phone_login' => $phone_login ? base64_encode($phone_login) : '',
        'phone_pass'  => $phone_pass ? base64_encode($phone_pass) : '',
        'options'     => base64_encode($optionstr),
        'serverip'    => $server_ip ? base64_encode($server_ip) : '',
        'system_key'  => $system_key ? base64_encode($system_key) : '',
        'callerid'    => $callerid ? base64_encode($callerid) : '',
        'codecs'      => $codecs ? base64_encode($codecs) : '',
        'protocol'    => $protocol ? base64_encode($protocol) : ''
    ));

    $uri = 'index.php?' . $query;

    header('Location: ' . $uri);

    exit;
}

?>

<style>
    div.main {
        float: left;
        width: 48%;
        border: 1px solid black
    }

    div.main label {
        width: 200px;
        display: inline-block;
    }

    div.main form > div {
        padding: 5px;
    }

    iframe.phone {
        width: 100%;
        height: 400px;
        overflow: auto;
        border: 1px solid red;
    }

    div.debug {
        width: 100%;
        height: 300px;
        overflow-y: scroll;
        font-size: 12px;
        border: 1px solid red;
    }

    div span.log {
        color: #333;
        background-color: #fff;
        border: 1px solid #ccc;
        padding: 2px;
        display: block;
    }

    div span.info {
        color: #fff;
        background-color: #5bc0de;
        border: 1px solid #46b8da;
        padding: 2px;
        display: block;
    }

    div span.error {
        color: #fff;
        background-color: #d9534f;
        border: 1px solid #d43f3a;
        padding: 2px;
        display: block;
    }

    div span.debug {
        color: #fff;
        background-color: #f0ad4e;
        border: 1px solid #eea236;
        padding: 2px;
        display: block;
    }

    div.legend span {
        padding: 3px;
        display: inline-block !important;
    }
</style>

<div class="main">
    <h2>Test Phone Variables:</h2>

    <p>After you send the form, phone page will be displayed in the right frame.</p>

    <form method="get" action="test.php" target="phone_iframe" id="phone_form">
        <input type="hidden" name="test_form" value="1">

        <div>
            <label for="phone_login">
                <strong>Phone Login:</strong>
            </label>

            <input type="text" placeholder="Enter phone login" id="phone_login" name="phone_login">
        </div>

        <div>
            <label for="phone_pass">
                <strong>Phone Pass:</strong>
            </label>

            <input type="text" placeholder="Enter phone password" id="phone_pass" name="phone_pass">
        </div>

        <!-- No need for this at this time -->
        <!--        <div>
                    <label for="server_ip">
                        <strong>Server IP:</strong>
                    </label>
        
                    <input type="text" placeholder="Enter server ip (optional)" id="server_ip" name="server_ip">
                </div>-->

        <div>
            <label for="websocket_url">
                <strong>WebSocket URL:</strong>
            </label>

            <input type="text" placeholder="Enter server ip (optional)" id="websocket_url" name="websocket_url">
        </div>

        <div>
            <button type="submit">
                Test Now
            </button>
        </div>
    </form>

    <div class="legend">
        <h3>Console:</h3>

        <strong>
            Legend:

            <span class="log">Log</span>
            <span class="error">Error</span>
            <span class="info">Info</span>
            <span class="debug">Debug</span>

        </strong>
    </div>
    <div class="debug" id="console_debug">

    </div>

    <button type="button" onclick="clearDebug()">
        Clear Console
    </button>
</div>
<div class="main">
    <h2>Test Phone Iframe:</h2>

    <iframe name="phone_iframe" src="about:blank" class="phone" id="phone_iframe">

    </iframe>

    <button type="button" onclick="document.getElementById('phone_iframe').src='about:blank'">
        Close Phone
    </button>
</div>

<script>
    // Inline debug

    function iframeDebugBind() {
        var iframe = document.getElementById('phone_iframe');

        var win = iframe.contentWindow || iframe;
        if (!win) {
            var debugEl = document.getElementById('console_debug');
            debugEl.innerHTML = '<span class="error">Debug Not Possible</span>';
        }

        if (win.iframeCustomconsole) {
            return;
        }


        if (typeof win.console != "undefined") {
            if (typeof win.console.log != 'undefined') {
                win.console.olog = win.console.log;
            } else {
                win.console.olog = function () {
                };
            }

            if (typeof win.console.error != 'undefined') {
                win.console.oerror = win.console.error;
            } else {
                win.console.oerror = function () {
                };
            }

            if (typeof win.console.info != 'undefined') {
                win.console.oinfo = win.console.info;
            } else {
                win.console.oinfo = function () {
                };
            }

            if (typeof win.console.debug != 'undefined') {
                win.console.odebug = win.console.debug;
            } else {
                win.console.odebug = function () {
                };
            }
        }

        if (typeof win.onerror == 'function') {
            win.onoerror = win.onerror;
        } else {
            win.onoerror = function () {
            };
        }


        win.console.log = function (message) {
            win.console.olog(message);
            var debugEl = document.getElementById('console_debug');
            debugEl.innerHTML = '<span class="log">' + message + '</span>' + debugEl.innerHTML;
        };

        win.console.error = function (message) {
            win.console.oerror(message);
            var debugEl = document.getElementById('console_debug');
            debugEl.innerHTML = '<span class="error">' + message + '</span>' + debugEl.innerHTML;
        };

        win.console.debug = function (message) {
            win.console.odebug(message);
            var debugEl = document.getElementById('console_debug');
            debugEl.innerHTML = '<span class="debug">' + message + '</span>' + debugEl.innerHTML;
        };

        win.console.info = function (message) {
            win.console.oinfo(message);
            var debugEl = document.getElementById('console_debug');
            debugEl.innerHTML = '<span class="info">' + message + '</span>' + debugEl.innerHTML;
        };

        win.onerror = function ConsoleError(err, url, line) {
            win.onoerror(err, url, line);
            var debugEl = document.getElementById('console_debug');
            debugEl.innerHTML = '<span class="error"><b>Line ' + line + '</b> : ' + err + '</span>' + debugEl.innerHTML;
        };

        win.iframeCustomconsole = true;
    }

    setInterval(iframeDebugBind, 100);

    clearDebug = function () {
        // clear debug
        var debugEl = document.getElementById('console_debug');
        debugEl.innerHTML = '';
    };

    document.getElementById('phone_form').addEventListener('submit', function () {
        clearDebug();
    });

</script>