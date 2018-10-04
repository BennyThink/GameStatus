#!/usr/bin/python
# coding: utf-8

# GameStatus - main.py
# 2018/9/30 20:51
#

__author__ = "Benny <benny@bennythink.com>"

import os
import json
import logging
from platform import uname

from apscheduler.schedulers.background import BackgroundScheduler
from concurrent.futures import ThreadPoolExecutor
from tornado import web, ioloop, httpserver, gen, options
from tornado.concurrent import run_on_executor

from resource.game import game_response, sync_game


class BaseHandler(web.RequestHandler):
    def data_received(self, chunk):
        pass


class GameStatusHandler(BaseHandler):
    executor = ThreadPoolExecutor(max_workers=20)

    @run_on_executor
    def run_request(self):
        return json.dumps(game_response())

    @gen.coroutine
    def get(self):
        args = self.get_query_arguments('refresh')
        if args:
            sync_game()
        self.set_header("Content-Type", "application/json")
        res = yield self.run_request()
        self.write(res)


class RunServer:
    handlers = [(r'/api/game', GameStatusHandler),
                (r'/api/web', GameStatusHandler),
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
    scheduler.add_job(sync_game, 'interval', minutes=10)
    scheduler.start()
    RunServer.run_server(port=p, host=h)
