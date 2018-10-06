#!/usr/bin/python
# coding: utf-8

# GameStatus - main.py
# 2018/9/30 20:51
#
# Copyright 2018 BennyThink
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

__author__ = "Benny <benny@bennythink.com>"

import os
import json
import logging
from platform import uname

from apscheduler.schedulers.background import BackgroundScheduler
from concurrent.futures import ThreadPoolExecutor
from tornado import web, ioloop, httpserver, gen, options
from tornado.concurrent import run_on_executor

from serverstatus.game import game_response, game_sync
from serverstatus.web import web_response, web_sync
from serverstatus.ss import ss_response, ss_sync, PassAuth


class BaseHandler(web.RequestHandler):
    executor = ThreadPoolExecutor(max_workers=20)

    def data_received(self, chunk):
        pass

    @staticmethod
    def response_func():
        pass

    @staticmethod
    def sync_func():
        pass

    @run_on_executor
    def run_request(self):
        return json.dumps(self.response_func())

    @gen.coroutine
    def get(self):
        args = self.get_query_arguments('refresh')
        if args:
            self.sync_func()
        self.set_header("Content-Type", "application/json")
        res = yield self.run_request()

        self.write(res)


class GameStatusHandler(BaseHandler):
    @staticmethod
    def response_func():
        return game_response()

    @staticmethod
    def sync_func():
        return game_sync()


class WebStatusHandler(BaseHandler):
    @staticmethod
    def response_func():
        return web_response()

    @staticmethod
    def sync_func():
        return web_sync()


class SSStatusHandler(BaseHandler):
    @staticmethod
    def response_func():
        return ss_response()

    @staticmethod
    def sync_func():
        return ss_sync()


class LoginHandler(web.RequestHandler):
    def data_received(self, chunk):
        pass

    def post(self):
        password = self.get_argument('password')
        result = PassAuth('ss_auth').verify_pass(password)
        if result:
            self.set_status(200)
        else:
            self.set_status(401)


class RunServer:
    handlers = [(r'/api/game', GameStatusHandler),
                (r'/api/web', WebStatusHandler),
                (r'/api/ss', SSStatusHandler),
                (r'/api/login', LoginHandler),
                (r"/(.*)", web.StaticFileHandler,
                 {"path": os.path.dirname(__file__), "default_filename": "index.html"})]
    application = web.Application(handlers,
                                  static_path=os.path.join(os.path.dirname(__file__), "static"),
                                  debug=True
                                  )

    @staticmethod
    def run_server(port=8888, host='127.0.0.1', **kwargs):
        tornado_server = httpserver.HTTPServer(RunServer.application, **kwargs)
        tornado_server.bind(port, host)

        if uname()[0] == 'Windows':
            tornado_server.start()
        else:
            tornado_server.start(None)

        try:
            print(f'Server is running on http://{host}:{port}')
            ioloop.IOLoop.instance().current().start()
        except KeyboardInterrupt:
            ioloop.IOLoop.instance().stop()
            print('"Ctrl+C" received, exiting.\n')


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    options.define("p", default=8888, help="running port", type=int)
    options.define("h", default='127.0.0.1', help="listen address", type=str)
    options.parse_command_line()
    p = options.options.p
    h = options.options.h

    scheduler = BackgroundScheduler(timezone="Asia/Shanghai")
    scheduler.add_job(game_sync, 'interval', minutes=10)
    scheduler.add_job(web_sync, 'interval', minutes=10)
    scheduler.add_job(ss_sync, 'interval', minutes=60)
    scheduler.start()
    RunServer.run_server(port=p, host=h)
