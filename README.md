# GameStatus
Show my SourceServer server game status!

[Benny's Status Page](https://status.bennythink.com)

**Warning: The current version of paramiko(2.4.2) has some serious multiple connection issue.Use my [personal fork](https://github.com/BennyThink/paramiko) to fix this issue**
# Demo
## Game Status
![](/assets/game.jpg)
## Web Status
![](/assets/web.jpg)
## Shadowsocks Status(require simple password authentication)
![](/assets/ss.jpg)


# Requirements
## Framework
**About paramiko**
```bash
pip uninstall paramiko
git clone https://github.com/BennyThink/paramiko
cd paramiko
python setup.py install
```

* Python 3 ONLY
* pypi package: tornado, python-valve, apscheduler, paramiko, passlib
* A browser that supports [ECMAScript 6](https://en.wikipedia.org/wiki/ECMAScript#Conformance)(most modern recently browser will do)
## ServerStatus
* MongoDB(default auth mechanism)


# Deployment
## Application and system requirements
1. All your program must be supervised by systemd.
2. Enable systemd's accouting on CPU, Memory, Tasks and IP. Usually just edit `/etc/systemd/system.conf` and enable them. For example:
```bash
DefaultCPUAccounting=yes
DefaultIOAccounting=yes
DefaultIPAccounting=yes
DefaultBlockIOAccounting=yes
DefaultMemoryAccounting=yes
DefaultTasksAccounting=yes

```
Then reload systemd `sudo systemctl daemon-reload`or reboot.

Make sure IP, Memory and CPU fields are displayed on your `systemctl status some_service.service`

## ServerStatus settings
1. Install and start MongoDB. [Reference](https://docs.mongodb.com/manual/administration/install-community/)
Be aware that you don't have to explicitly set any authentication mechanism.
If you do need authentication mechanism, please add auth credentials in `serverstatus/database.py` near L16 like`self.db.authenticate()` 

2. Make sure you have Python 3 and pip installed. 

3. Run `pip install -U tornado python-valve apscheduler paramiko passlib`. Provides root privilege if necessary.

4. Clone this project, and then edit `serverstatus/config.py`.  
Simply you have to replace `host`, `username`, `password` and `cmd`.
Each variables' format shall not be changed and `app_id` is very important to source engine games.

5. [Optional] If you need Shadowsocks status, execute `python serverstatus/ss.py 123456` 
Replace `123456` with your own complicated password. If no password is provided, it would generate a random secure password.
However, if this script has not been run once, no password is permitted when prompt login to Shadowsocks status.

6. Run `python /path/to/project/main.py`. Wait a few minutes for cron job execution. You could observe the output when it's complete.
By default, this server listens on localhost:8888, to change it, simply use command line arguments,
``python main.py -p=9999 -h=0.0.0.0``

7. After cron job, open your browser and navigate to the url. It should be okay.

## Nginx reverse proxy settings
**It is strongly recommend to use https.**
1. Install Nginx for your OS.

2. Edit your Nginx's configuration, add something like below:
```
location / {
        proxy_pass http://127.0.0.1:8888; # your Python application
    }
```
3. Test and reload Nginx.

## Nginx https reverse proxy settings
**You should have a valid domain and correct A record to your server.**
1. Install Nginx for your OS.

2. Obtain an SSL cert.

3. Generate a DH cert. `openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048`

4. Reference to `status.nginx`, replace `example.com` with your own domain.

5. Test and reload Nginx.

## systemd settings
1. Reference to `status.service` and change its contents if necessary.

2. Copy service unit file to `/lib/systemd/system/status.service`

3. Reload systemd daemon `sudo systemctl daemon-reload`

4. Enable autostart `sudo systemctl enable status.service`

5. Start service `sudo systemctl start status.service`


# Design
## RESTful API
The API design should follow the specification:

[RESTful API Specification](https://godruoyi.com/posts/resetful-api-design-specifications)
## Pagination
### Front end pagination
In your component's js, setting `load_type: client`. Your back end should return all the data.
### Back end pagination
In your component's js, setting `load_type: server`. Your back end should return part of the data with data count.

The query string shall like `page=3&per_page=10&sort=key&order=descending&search=hello%20world`.


# License
Licensed under the Apache License, Version 2.0.
