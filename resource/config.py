#!/usr/bin/python
# coding: utf-8

# ServerStatus - config.py
# 2018/10/4 10:00
#

__author__ = "Benny <benny@bennythink.com>"

GAME = [{"app_id": 550, "host": "game.bennythink.com", "port": 27021, "username": "root",
         "password": "123456", "cmd": "systemctl status l4d2"},
        {"app_id": 730, "host": "game.bennythink.com", "port": 27015, "username": "root",
         "password": "123456", "cmd": "systemctl status csgo"},
        ]
WEB = [
    {"app_id": 1, "host": "weather.bennythink.com", "username": "root", "password": "123456",
     "cmd": "systemctl status weather"},
    {"app_id": 2, "host": "jbls.bennythink.com", "username": "root", "password": "123456",
     "cmd": "systemctl status jbls"}
]

SS = [
    {"app_id": 3, "host": "shemissed.me", "username": "root", "password": "123456",
     "cmd": "systemctl status shadowsocks"}
]
