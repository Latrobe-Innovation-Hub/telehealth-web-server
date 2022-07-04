# telehealth-web-server

## NGINX WEB PROXY
telehealth.mywire.org.conf gets placed into /etc/nginx/conf.d/
and the default file located at /etc/nginx/sites-available/default either gets deleted, or commentted out.

Once the respective files have been placed and edited, simply run
```bash
sudo nginx -t
```
to confirm files have been confured correctly.

Then run
```bash
sudo nginx -s reload
```
to load the new configuration file.

## WEB HTML FILES
telehealth-index.html gets placed into /var/www/html/ as this is where NGINX looks for its root index file...
