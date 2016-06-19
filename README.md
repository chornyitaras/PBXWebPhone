# PBXWebPhone
WebRTC based webphone for Vicidial.
Testet with ViciBox: 7.0.3 | VERSION: 2.12-558a | BUILD: 160602-1450 cluster installs support will be added soon 

## Getting Started
It is recommended that your Vicidial installation supports secure connection.

- Clone this project into agc directory (if you are using vicibox /srv/www/htdocs/agc/)
- In vicidial ADMINISTRATION page change Admin->System Settings->Webphone URL: to
  PBXWebPhone/index.php
- Enable webphone in phone config 
   * Admin->Phones-><Phone exten> change "Set As Webphone" to "Y"


Check out [Wiki](https://github.com/chornyitaras/PBXWebPhone/wiki) for more information.

# Screenshot
You should see something like this if everything configured correctly:

<img src="img1.PNG">

**PS:**  I advise to use [letsencrypt](https://letsencrypt.org/) for getting **free** ssl certificates 
