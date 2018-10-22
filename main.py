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
from paramiko.ssh_exception import SSHException
from socket import error
from tornado import web, ioloop, httpserver, gen, options
from tornado.concurrent import run_on_executor
from tornado.escape import utf8
from tornado.web import HTTPError

from serverstatus.game import game_response, game_sync
from serverstatus.web import web_response, web_sync
from serverstatus.ss import ss_response, ss_sync, PassAuth
from serverstatus.constants import CODE


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
        if not self.get_cookie('_xsrf'):
            self.set_cookie('_xsrf', self.xsrf_token, expires_days=7)
        self.set_header("Content-Type", "application/json")
        res = yield self.run_request()
        self.write(res)

    @run_on_executor
    def post(self):
        try:
            self.get_argument('refresh')
            self.sync_func()
            self.set_status(201)
        except HTTPError as e:
            self.set_status(400)
            self.write({"code": 400001, "message": CODE.get(400001), "error": str(e)})
        except SSHException as e:
            self.set_status(504)
            self.write({"code": 504001, "message": CODE.get(504001), "error": str(e)})
        except (AttributeError, TypeError) as e:
            self.set_status(504)
            self.write({"code": 504002, "message": CODE.get(504002), "error": str(e)})
        except error as e:
            self.set_status(500)
            self.write({"code": 500001, "message": CODE.get(500001), "error": str(e)})
        except Exception as e:
            self.set_status(500)
            self.write({"code": 500099, "message": CODE.get(500099), "error": str(e)})

    @staticmethod
    def _time_independent_equals(a, b):
        if len(a) != len(b):
            return False
        result = 0
        if isinstance(a[0], int):  # python3 byte strings
            for x, y in zip(a, b):
                result |= x ^ y
        return result == 0

    def check_xsrf_cookie(self):
        token = (self.get_argument("_xsrf", None) or
                 self.request.headers.get("X-Xsrftoken") or
                 self.request.headers.get("X-Csrftoken"))
        if not token:
            self.set_status(403)
            self.write({"code": 403001, "message": CODE.get(403001), "error": CODE.get(403001)})
            self.finish()
            raise HTTPError(403, "'_xsrf' argument missing from POST")

        _, token, _ = self._decode_xsrf_token(token)
        _, expected_token, _ = self._get_raw_xsrf_token()
        if not token:
            self.set_status(403)
            self.write({"code": 403002, "message": CODE.get(403002), "error": CODE.get(403002)})
            self.finish()
            raise HTTPError(403, "'_xsrf' argument has invalid format")

        if not self._time_independent_equals(utf8(token), utf8(expected_token)):
            self.set_status(403)
            self.write({"code": 403003, "message": CODE.get(403003), "error": CODE.get(403003)})
            self.finish()
            raise HTTPError(403, "XSRF cookie does not match POST argument")


class IndexHandler(BaseHandler):
    def get(self):
        self.render("pages/index.html")


class LoginHandler(BaseHandler):
    def data_received(self, chunk):
        pass

    def get(self):
        self.set_status(405)
        self.write({"code": 405001, "message": CODE.get(405001), "error": CODE.get(405001)})

    def post(self):
        try:
            password = self.get_argument('password')
            result = PassAuth('ss_auth').verify_pass(password)
            if result:
                self.set_status(200)
                self.set_secure_cookie('password', password, expires_days=7, httponly=True)
                self.write({"code": 200002, "message": CODE.get(200002), "error": CODE.get(200002)})
            else:
                raise AttributeError('Your password didn\'t pass verification.')
        except HTTPError as e:
            self.set_status(401)
            self.write({"code": 401002, "message": CODE.get(401002), "error": str(e)})
        except AttributeError as e:
            self.set_status(401)
            self.write({"code": 401001, "message": CODE.get(401001), "error": str(e)})


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

    def response_func(self):
        return self.authentication(ss_response)

    def sync_func(self):
        return self.authentication(ss_sync)

    # @web.authenticated
    def authentication(self, func):

        try:
            password = self.get_secure_cookie('password').decode('utf-8')
            result = PassAuth('ss_auth').verify_pass(password)
            if result:
                return func()
            else:
                raise AttributeError('Password mismatch, maybe you\'ve changed your password.')
        except AttributeError as e:
            self.set_status(403)
            self.write({"code": 403004, "message": CODE.get(403004), "error": str(e)})


class RunServer:
    root_path = os.path.dirname(__file__)
    page_path = os.path.join(root_path, 'pages')

    handlers = [(r'/', IndexHandler),
                (r'/api/game', GameStatusHandler),
                (r'/api/web', WebStatusHandler),
                (r'/api/ss', SSStatusHandler),
                (r'/api/login', LoginHandler),
                (r'/static/(.*)', web.StaticFileHandler, {'path': root_path}),
                (r'/pages/(.*\.html|.*\.js|.*\.css|.*\.png|.*\.jpg)', web.StaticFileHandler, {'path': page_path}),
                ]
    settings = {
        "static_path": os.path.join(root_path, "static"),
        "cookie_secret": "5Li05DtnQewDZqpmDVB3HAAhFqUu2vDnUSnqezkeu+M=",
        "xsrf_cookies": True,
        "autoreload": True
    }

    application = web.Application(handlers, **settings)

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
    if not os.environ.get('dev'):
        logging.info('Starting scheduler...')
        scheduler.start()
    RunServer.run_server(port=p, host=h)
