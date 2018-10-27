#!/usr/bin/python
# coding: utf-8

# ServerStatus - web.py
# 2018/10/4 21:01
#

__author__ = "Benny <benny@bennythink.com>"

import time
from serverstatus.config import WEB
from serverstatus.constants import TOOLS
from serverstatus.utils import Mongo, BaseSSH, template


class WebServer(BaseSSH):

    def parse_info(self):
        h = self.config
        address = f"https://{h['host']}/"

        cpu, memory, _, status_bool, status_msg = self.systemd_info()

        name = TOOLS.get(address)[0]
        arch = TOOLS.get(address)[1]
        app = TOOLS.get(address)[2]
        response = dict(app_id=self.config['app_id'], address=address, name=name, arch=arch,
                        app=app, cpu=cpu, memory=memory, status=[status_bool, status_msg, time.time()])
        return response


class WebMongo(Mongo):
    @staticmethod
    def get_status():
        data = [WebServer(i).parse_info() for i in WEB]
        return data


def web_response():
    c, lst = template('web', WEB)
    c['data'] = WebMongo('web_status').get_many(lst)
    c['meta'] = {'count': len(c['data'])}
    return c


def web_sync():
    WebMongo('web_status').insert_record()
