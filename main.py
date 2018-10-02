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

from concurrent.futures import ThreadPoolExecutor
from tornado import web, ioloop, httpserver, gen, options
from tornado.concurrent import run_on_executor


class BaseHandler(web.RequestHandler):
    def data_received(self, chunk):
        pass


class IndexHandler(BaseHandler):

    def get(self):
        # open('templates/index.html').read()
        self.write('hello')

    def post(self):
        self.get()


class StatusHandler(BaseHandler):
    executor = ThreadPoolExecutor(max_workers=20)

    @run_on_executor
    def run_request(self):
        """
        sign and return
        :return: hex and raw request in XML
        """
        # get parameter, compatibility with json
        if self.request.headers.get('Content-Type') == 'application/json' and self.request.body:
            data = json.loads(self.request.body)
            city = data.get('city')
            day = data.get('day')
        else:
            city = self.get_argument('city', None)
            day = self.get_argument('day', None)

        return json.dumps({})

    @gen.coroutine
    def get(self):
        self.set_header("Content-Type", "application/json")
        res = yield self.run_request()
        self.write(res)

    @gen.coroutine
    def post(self):
        self.set_header("Content-Type", "application/json")
        res = yield self.run_request()
        self.write(res)


class RunServer:
    handlers = [(r'/api/status', StatusHandler),
                (
                    r"/(.*)", web.StaticFileHandler,
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
    RunServer.run_server(port=p, host=h)
