# PBXWebPhone
WebRTC based webphone for Vicidial.
Testet with Goautodial 3 and ViciBox: 7.0.3 | VERSION: 2.14-577a | BUILD: 161126-2157

## Getting Started
It is required that your Vicidial installation supports secure connection.


- Clone this project into agc directory (if you are using vicibox /srv/www/htdocs/agc/)
- Configure asterisk ([Asterisk configuration example](https://github.com/chornyitaras/PBXWebPhone/wiki/Asterisk-configuration))  
- Configure apache ([Apache configuration example](https://github.com/chornyitaras/PBXWebPhone/wiki/Apache-configuration))  
- Configure Vicidial ([Vicidial configuration example](https://github.com/chornyitaras/PBXWebPhone/wiki/Vicidial-configuration))  
- Configure firewall (open port 8089)

# Screenshot
You should see something like this when login as agent:

![Screenshot](https://raw.githubusercontent.com/chornyitaras/PBXWebPhone/master/img1.PNG)

**PS:**  I advise to use [letsencrypt](https://letsencrypt.org/) for getting **free** ssl certificates

**PPS:**
Any comments and suggestions are welcomed. Feel free to post issue or pull request
