#!/usr/bin/python
# coding: utf-8

# ServerStatus - ss.py
# 2018/10/5 10:28
#

__author__ = "Benny <benny@bennythink.com>"

import json
import os
import time
import sys
import base64

from passlib.hash import pbkdf2_sha256

# oh well then...
try:
    import serverstatus
except ModuleNotFoundError:
    sys.path.append('.')
    sys.path.append('..')
finally:
    from serverstatus.config import SS
    from serverstatus.utils import Mongo, BaseSSH, template


class SSServer(BaseSSH):
    def __init__(self, conf):
        super().__init__(conf)
        self.__config = conf

    def parse_info(self):
        address = self.__config['host']

        cpu, memory, network, status_bool, status_msg = self.systemd_info()

        _, out, _ = self.ssh.exec_command('cat /etc/shadowsocks-go/config.json')
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
    c, lst = template('ss')
    c['data'] = SSMongo('ss_status').get_many(lst)
    c['meta'] = {'count': len(c['data'])}
    return c


def ss_sync():
    SSMongo('ss_status').insert_record()


class PassAuth(Mongo):
    def store_pass(self, password):
        self.clear_password()
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
