#!/usr/bin/python
# coding: utf-8

# ServerStatus - web.py
# 2018/10/4 21:01
#

__author__ = "Benny <benny@bennythink.com>"

import json
import logging
import os
import re
import time

import paramiko

from serverstatus.config import WEB
from serverstatus.constants import TOOLS
from serverstatus.database import Mongo


class WebServer:
    def __init__(self, conf):
        self.__status_regex = re.compile(r'Active:(.*)', re.IGNORECASE)
        self.__memory_regex = re.compile(r'Memory:(.*)', re.IGNORECASE)
        self.__cpu_regex = re.compile(r'CPU:(.*)', re.IGNORECASE)
        self.__config = conf

        self.__ssh = paramiko.SSHClient()
        self.__ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy)

        self.__ssh.connect(conf['host'], username=conf['username'], password=conf['password'])
        _, stdout, _ = self.__ssh.exec_command(conf['cmd'])
        self.output: str = stdout.read().decode('utf-8')

    def __del__(self):
        self.__ssh.close()

    def parse_info(self):
        h = self.__config
        address = f"https://{h['host']}/"
        status_msg = re.findall(self.__status_regex, self.output)[0].strip()
        status_bool = True if 'running' in status_msg else False
        cpu = re.findall(self.__cpu_regex, self.output)[0].strip()
        memory = re.findall(self.__memory_regex, self.output)[0].strip() if status_bool else 0

        name = TOOLS.get(address)[0]
        arch = TOOLS.get(address)[1]
        app = TOOLS.get(address)[2]
        response = dict(app_id=self.__config['app_id'], address=address, name=name, arch=arch,
                        app=app, cpu=cpu, memory=memory, status=[status_bool, status_msg], timestamp=time.time())
        return response


class WebMongo(Mongo):
    @staticmethod
    def get_status():
        data = [WebServer(i).parse_info() for i in WEB]
        return data


def web_response():
    path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', 'config', 'web.json')
    with open(path, encoding='utf-8') as f:
        c = json.load(f)

    lst = [item['app_id'] for item in WEB]
    c['data'] = WebMongo('web_status').get_many(lst)
    return c


def web_sync():
    WebMongo('web_status').insert_record()


