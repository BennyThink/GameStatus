#!/usr/bin/python
# coding: utf-8

# ServerStatus - ss.py
# 2018/10/5 10:28
#

__author__ = "Benny <benny@bennythink.com>"

import json
import logging
import os
import re
import time
import sys
import base64

import paramiko
from passlib.hash import pbkdf2_sha256
from serverstatus.config import SS
from serverstatus.constants import TOOLS
from serverstatus.database import Mongo


class SSServer:
    def __init__(self, conf):
        self.__status_regex = re.compile(r'Active:(.*)', re.IGNORECASE)
        self.__memory_regex = re.compile(r'Memory:(.*)', re.IGNORECASE)
        self.__cpu_regex = re.compile(r'CPU:(.*)', re.IGNORECASE)
        self.__ip_regex = re.compile(r'IP:(.*)', re.IGNORECASE)
        self.__config = conf

        self.__ssh = paramiko.SSHClient()
        self.__ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy)

        self.__ssh.connect(conf['host'], username=conf['username'], password=conf['password'])
        _, stdout, _ = self.__ssh.exec_command(conf['cmd'])
        self.output: str = stdout.read().decode('utf-8')

    def __del__(self):
        self.__ssh.close()

    def parse_info(self):
        address = self.__config['host']
        status_msg = re.findall(self.__status_regex, self.output)[0].strip()
        status_bool = True if 'running' in status_msg else False
        cpu = re.findall(self.__cpu_regex, self.output)[0].strip()
        memory = re.findall(self.__memory_regex, self.output)[0].strip() if status_bool else 0
        network = re.findall(self.__ip_regex, self.output)[0].strip()

        _, out, _ = self.__ssh.exec_command('cat /etc/shadowsocks-go/config.json')
        ss_config: dict = json.loads(out.read().decode('utf-8'))

        method = ss_config.get('method')
        port_pass = [{"port": k, "password": v} for k, v in ss_config.get('port_password').items()]

        response = dict(app_id=self.__config['app_id'], address=address, method=method, port_pass=port_pass,
                        cpu=cpu, memory=memory, network=network, status=[status_bool, status_msg, time.time()])
        return response


class SSMongo(Mongo):
    @staticmethod
    def get_status():
        data = [SSServer(i).parse_info() for i in SS]
        return data


def ss_response():
    path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', 'config', 'ss.json')
    with open(path, encoding='utf-8') as f:
        c = json.load(f)

    lst = [item['app_id'] for item in SS]
    c['data'] = SSMongo('ss_status').get_many(lst)
    return c


def ss_sync():
    SSMongo('ss_status').insert_record()


class PassAuth(Mongo):
    def store_pass(self, password):
        self.col.insert_one({"password": pbkdf2_sha256.hash(password)})

    def verify_pass(self, password):
        # find hash first
        h = self.col.find().next()['password']
        return pbkdf2_sha256.verify(password, h)

    def clear_password(self):
        self.col.delete_many({})


if __name__ == '__main__':
    if len(sys.argv) == 2:
        PassAuth('ss_auth').store_pass(sys.argv[1])
    else:
        print('No password provided, generate random password...')
        rand = base64.b64encode(os.urandom(16)).decode('utf-8')
        PassAuth('ss_auth').store_pass(rand)
        print(f'You password is {rand}')
