# PBXWebPhone
WebRTC based webphone for Vicidial.
Testet with ViciBox: 8.1 | VERSION: 2.14-701a | BUILD: 190302-1745  

## Getting Started
It is required that your Vicidial installation supports secure connection.


- Clone this project into agc directory (if you are using vicibox /srv/www/htdocs/agc/)
- Serve the project as static files and open `index.html`
- Configure asterisk ([Asterisk configuration example](https://github.com/chornyitaras/PBXWebPhone/wiki/Asterisk-configuration))  
- Configure apache ([Apache configuration example](https://github.com/chornyitaras/PBXWebPhone/wiki/Apache-configuration))  
- Configure Vicidial ([Vicidial configuration example](https://github.com/chornyitaras/PBXWebPhone/wiki/Vicidial-configuration))  
- Configure firewall (open port 8089)

## Static Usage
- The phone is now bootstrapped entirely in the browser from query parameters.
- Main entrypoint: `index.html`
- Local test page: `test.html`
- Existing integrations that linked to `index.php` should be updated to link to `index.html` with the same query parameters.

## Controlling the phone's settings
Every setting is set in VICIdial. VICIdial passes the settings to the phone when the agent logs in, so changes apply at the **agent's next login** (or a page reload). Nothing needs to be edited in this project.

### Per phone: Admin → Phones → *(select the phone)*

| VICIdial field | Values | What the agent sees |
|---|---|---|
| **Webphone Auto-Answer** | `Y` / `N` | `Y`: incoming calls are answered automatically. `N`: the phone rings and shows **Answer** and **Hang up** buttons. |
| **Webphone Dialpad** | `Y` / `N` / `TOGGLE` / `TOGGLE_OFF` | `N` hides the **Keypad** button (no DTMF). Every other value shows it, with the keypad closed until clicked. |
| **Webphone Dialbox** | `Y` / `N` | `Y` shows a number field and a **Call** button for manual dialling. |
| **Webphone Mute** | `Y` / `N` | `N` hides the **Mute** button. |
| **Webphone Volume** | `Y` / `N` | `N` hides the volume buttons (−/+ in 10% steps). |
| **Webphone Debug** | `Y` / `N` | `Y` shows a log panel under the phone and writes the SIP trace to the browser console. Use it only while troubleshooting. |
| **Webphone Layout** | blank, a name, or a URL | Loads an extra stylesheet: `https://…/my.css` as given, `mylayout` → `css/mylayout.css`, `css/x.css` as given. |
| **Webphone Extra Settings** | a Settings Container | See below. |

**Hang up** appears whenever a call is active, whatever these settings are.

### Per user group: Admin → User Groups → *(select the group)*
These override the phone values for every agent in the group:
- **Webphone Dialpad Override**: replaces *Webphone Dialpad* (set to `DISABLED` to use the phone's value).
- **Webphone Layout**: replaces *Webphone Layout* when filled in.
- **Webphone URL Override**: points the group at a different webphone URL, e.g. a test copy.

### Extra settings: Admin → Settings Containers
Create a container (type `WEBPHONE`, or any type), then choose it in the phone's **Webphone Extra Settings** field. Put one `key:value` per line. Lines starting with `#` are comments.

```
# microphone processing (1/true = on, 0/false = off; default on)
autoGain:1
echoCan:1
noiseSup:1

# 1 = after registering, call the agent's session (conference) automatically
dialRegExten:1

# status texts shown in the phone (quote values that contain spaces)
langConnected:"Connecting"
langRegistered:"Ready"
langRegFailed:"Registration failed"
langUnregistered:"Not registered"
langDisconnected:"Connection lost"
langRinging:"Incoming"
langTrying:"Trying"
langAttempting:"Calling..."
langIncall:"In call"
langReject:"Rejected"
```
The keys match [VICIphone](https://github.com/vicimikec/ViciPhone)'s, so an existing VICIphone container works unchanged. Keys this phone doesn't use (e.g. `progReg`, `langSend`) are ignored.

### System wide: Admin → System Settings
- **Webphone URL**: the URL of this phone, e.g. `https://your-server/agc/PBXWebPhone/index.php`.

### Checking what a phone received
Turn on **Webphone Debug** for the phone, have the agent log in again, and read the log panel. Or decode the `options=` parameter of the iframe URL (base64), e.g. `INITIAL_LOAD--DIALPAD_Y--AUTOANSWER_N--DIALBOX_Y--MUTE_N--VOLUME_Y--WEBSOCKETURLwss://…--SESSION8600065--SETTINGS…`.

## Documentation
- Static documentation for GitHub Pages lives in `docs/`
- GitHub Pages entrypoint: `docs/index.html`
- The screenshot used by the docs site is bundled in `docs/assets/`

# Screenshot
You should see something like this when login as agent:

![Screenshot](https://raw.githubusercontent.com/chornyitaras/PBXWebPhone/master/img1.PNG)

**PS:**  I advise to use [letsencrypt](https://letsencrypt.org/) for getting **free** ssl certificates

**PPS:**
Any comments and suggestions are welcomed. Feel free to post issue or pull request
