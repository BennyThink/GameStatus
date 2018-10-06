#!/usr/bin/python
# coding: utf-8

# ServerStatus - game.py
# 2018/10/4 10:00
#

__author__ = "Benny <benny@bennythink.com>"

import json
import logging
import os
import re
import time

import paramiko
from valve.source.a2s import ServerQuerier

from serverstatus.config import GAME
from serverstatus.constants import L4D2
from serverstatus.database import Mongo


class SourceServer:
    def __init__(self, conf):
        self.__status_regex = re.compile(r'Active:(.*)', re.IGNORECASE)
        self.__memory_regex = re.compile(r'Memory:(.*)', re.IGNORECASE)
        self.__cpu_regex = re.compile(r'CPU:(.*)', re.IGNORECASE)
        self.__host = conf

        self.__ssh = paramiko.SSHClient()
        self.__ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy)

        self.__ssh.connect(conf['host'], username=conf['username'], password=conf['password'])
        _, stdout, _ = self.__ssh.exec_command(conf['cmd'])
        self.output: str = stdout.read().decode('utf-8')

        # valve server maybe inactive
        try:
            self.__server = ServerQuerier((conf['host'], conf['port']))
            self.game = self.__server.info().values
        except Exception as e:
            logging.warning(e)
            self.game = {'server_name': None, 'map': '', 'game': None, 'app_id': None, 'player_count': None,
                         'max_players': None}

    def __del__(self):
        self.__ssh.close()
        if self.game['game']:
            self.__server.close()

    def parse_info(self):
        game = L4D2.get(self.game['app_id'])
        name = self.game['server_name']
        h = self.__host
        address = f"{h['host']}:{h['port']}"

        map_name = L4D2.get(self.game['map'].lower(), self.game['map'])
        player = f"{self.game['player_count']}/{self.game['max_players']}"
        status_msg = re.findall(self.__status_regex, self.output)[0].strip()
        status_bool = True if 'running' in status_msg else False
        cpu = re.findall(self.__cpu_regex, self.output)[0].strip()
        memory = re.findall(self.__memory_regex, self.output)[0].strip() if status_bool else 0

        response = dict(app_id=self.__host['app_id'], game=game, name=name, address=address, map=map_name,
                        player=player, cpu=cpu, memory=memory, status=[status_bool, status_msg, time.time()])
        return response


class SourceMongo(Mongo):
    @staticmethod
    def get_status():
        data = [SourceServer(i).parse_info() for i in GAME]
        return data


def game_response():
    path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', 'config', 'game.json')
    with open(path, encoding='utf-8') as f:
        c = json.load(f)

    lst = [item['app_id'] for item in GAME]
    c['data'] = SourceMongo('game_status').get_many(lst)
    return c


def game_sync():
    SourceMongo('game_status').insert_record()
