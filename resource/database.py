#!/usr/bin/python
# coding: utf-8

# ServerStatus - database.py
# 2018/10/5 9:30
#

__author__ = "Benny <benny@bennythink.com>"

import pymongo


class Mongo:
    def __init__(self, db_name):
        self.client = pymongo.MongoClient()
        self.db = self.client['ServerStatus']
        self.col = self.db[db_name]

    def __del__(self):
        self.client.close()

    @staticmethod
    def get_status():
        pass

    def insert_record(self):
        self.col.insert_many(self.get_status())

    def get_one(self, app_id):
        data = self.col.find({"app_id": app_id}).sort("_id", -1).limit(1).next()
        if not data['status'][0]:
            tmp = self.col.find({"app_id": app_id, "status": {"$in": [True]}}).sort("_id", -1).limit(1).next()
            tmp['status'] = data['status']
            data = tmp
        # pop ObjectID
        data.pop("_id")
        return data

    def get_many(self, id_list):
        return [self.get_one(_id) for _id in id_list]
