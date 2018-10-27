# !/usr/bin/python
# coding: utf-8

# ServerStatus - utils.py
# 2018/10/5 9:30
#

__author__ = "Benny <benny@bennythink.com>"

import re
import os
import time
import json

import paramiko
import pymongo


# from serverstatus.config import *


class Mongo:
    def __init__(self, db_name):
        self.client = pymongo.MongoClient()
        self.db = self.client['ServerStatus']
        self.col = self.db[db_name]

    def __del__(self):
        self.client.close()

    @staticmethod
    def get_status():
        # this method should be overwrite by sub class
        pass

    def insert_record(self):
        self.col.insert_many(self.get_status())

    def get_one(self, app_id):
        data = self.col.find({"app_id": app_id}).sort("_id", -1).limit(1).next()
        data['status'][2] = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(data['status'][2]))
        data['rate'] = self.success_rate(app_id)
        if not data['status'][0]:
            tmp = self.col.find({"app_id": app_id, "status": {"$in": [True]}}).sort("_id", -1).limit(1).next()
            tmp['status'] = data['status']
            data = tmp
        # pop ObjectID
        data.pop("_id")
        return data

    def get_many(self, id_list):
        return [self.get_one(_id) for _id in id_list]

    def success_rate(self, app_id):
        total_records = self.col.count_documents({'app_id': app_id})
        success_records = self.col.count_documents({'app_id': app_id, 'status': True})
        return '%.2f%%' % (success_records / total_records * 100)


class BaseSSH:
    def __init__(self, conf):
        self.__status_regex = re.compile(r'Active:(.*)', re.IGNORECASE)
        self.__memory_regex = re.compile(r'Memory:(.*)', re.IGNORECASE)
        self.__cpu_regex = re.compile(r'CPU:(.*)', re.IGNORECASE)
        self.__ip_regex = re.compile(r'IP:(.*)', re.IGNORECASE)
        self.config = conf

        self.ssh = paramiko.SSHClient()
        self.ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy)

        self.ssh.connect(conf['host'], username=conf['username'], password=conf['password'])
        _, stdout, _ = self.ssh.exec_command(conf['cmd'])
        self.output: str = stdout.read().decode('utf-8')

    def __del__(self):
        self.ssh.close()

    def systemd_info(self):
        status_msg = re.findall(self.__status_regex, self.output)[0].strip()
        status_bool = True if 'running' in status_msg else False
        # CPU, memory and network account may not work for older version of systemd.
        result = re.search(self.__cpu_regex, self.output)
        cpu = result.group(1).strip() if result else None

        result = re.search(self.__memory_regex, self.output) if status_bool else 0
        memory = result.group(1).strip() if result else None

        result = re.search(self.__ip_regex, self.output)
        network = result.group(1).strip() if result else None

        # not so accurate call
        if cpu is None or memory is None or network is None:
            cpu, memory, network = self.extra()
        return cpu, memory, network, status_bool, status_msg

    def extra(self):

        _, free, _ = self.ssh.exec_command("free -m| sed -n '2, 1p'|awk '{print $2}'")
        total_mem: str = free.read().decode('utf-8').replace('\n', '')
        _, ps, _ = self.ssh.exec_command("ps -C shadowsocks-server -o pcpu=,pmem=")
        cpu, mem = ps.read().decode('utf-8').split()

        # TODO: not so accurate
        _, ifconfig, _ = self.ssh.exec_command('ifconfig')
        ifconfig = ifconfig.read().decode('utf-8')
        net: str = None
        for vm in ifconfig.split('\n\n'):
            if '127.0.0.1' not in vm and 'RX' in vm:
                net = vm
        net = net.replace('iB', '')
        try:
            rx, tx = re.findall('\((.*?)\)', net)
        except ValueError:
            _, rx, tx = re.findall('\((.*?)\)', net)

        return f'{cpu}%', f'{float(mem)*float(total_mem)/100}M', \
               f'{rx.replace(" ","")} in, {tx.replace(" ","")} out'


def template(name, conf):
    json_file = f'{name}.json'
    path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', 'config', json_file)
    with open(path, encoding='utf-8') as f:
        c = json.load(f)

    lst = [item['app_id'] for item in conf]
    return c, lst
