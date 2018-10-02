var _defaultConfig = {
    data: {
        sys_title: "服务器状态",
        loading: true,

        text_filter: "",

        table_columns: [{}],
        table_data: [],
        table_data_count: 0,

        table_page: {
            current: 1,
            sizes: [5, 10, 20, 40],
            size: 5,
            layout: "total, prev, pager, next, jumper, sizes"
        },
        table_sort: {},
        headerHeight: '',
        toolbarHeight: '',
        paginationHeight: '',
        tableHight: -1,

        menu_collapse: false,
        menus: [
            {
                title: "游戏状态",
                index: "game_status",
                url: "../game_status/index.html",
                font_icon: "fa-steam"
            },
            {
                title: "网站状态",
                index: "web_status",
                url: "../web_status/index.html",
                font_icon: "fa-server"
            },
            {
                title: "影梭状态",
                index: "ss_status",
                url: "../ss_status/index.html",
                font_icon: "fa-paper-plane-o"
            }


        ]
    },
    watch: {
        text_filter: function () {
            this.updateTableData()
        }
    },
    mounted() {
        this.headerHeight = parseInt(this.$refs.headerRef.$el.clientHeight);
        if (this.$refs.toolbarRef) {
            this.toolbarHeight = parseInt(this.$refs.toolbarRef.clientHeight);
        }
        this.paginationHeight = parseInt(this.$refs.paginationRef.$el.clientHeight);
    },
    methods: {
        //////////////////////////////////////////////////////init//////////////////////////////////////////////////////
        /**
         * 重新加载数据，直接从服务器取
         */
        reloadData: function () {
            this.loadData(true);
        },
        /**
         * 加载数据
         * @param reload
         */
        loadData: function (reload) {
            this.loading = true;
            //配置
            let result = {};
            let that = this;
            axios.get(PageConfig.load_url).then(function (res) {
                //that.loading = false;
                result['column'] = res.data.column;
                result['data'] = res.data.data;
                that.parseResult(result);
            }).catch(function (err) {
                that.loading = false;
                that.$message({
                    message: '数据加载失败',
                    type: 'error'
                });
                console.log(err);
            });

        },

        timetrans: function (ts) {
            let date = new Date(ts * 1000);//如果date为13位不需要乘1000
            let Y = date.getFullYear() + '-';
            let M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
            let D = (date.getDate() < 10 ? '0' + (date.getDate()) : date.getDate()) + ' ';
            let h = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':';
            let m = (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':';
            let s = (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds());
            return Y + M + D + h + m + s;
        },

        parseResult: function (result) {
            var column = result.column;
            var data = result.data;
            this.parseColumn(column);

            this._view_datas = [];
            this._table_raw_datas = data || [];
            this.updateTableData();
            this.onLoad();
        },
        onLoad: function () {

        },
        /**
         * 解析列
         * @param columns
         */
        parseColumn: function (columns) {
            if (columns) {
                var _cols = [];

                _cols.push({
                    label: "aaa",
                    _columns: [
                        {
                            label: "a1",
                            prop: "_index"
                        }, {
                            label: "a2",
                            prop: "_index"
                        }
                    ]
                });
                this.table_columns = columns;
            }
        },
        /**
         * 获取原始数据列表
         * @returns {*}
         */
        getRawDataList: function () {
            return this._table_raw_datas;
        },
        /**
         * 根据prop获取列配置
         * @param prop
         * @returns {*}
         */
        getColumnItem: function (prop) {
            if (!this._columnMap) {
                var map = {};
                this.table_columns.forEach(function (item) {
                    map[item.prop] = item;
                });
                this._columnMap = map;
            }
            return this._columnMap[prop];
        },

        //////////////////////////////////////////////////////controller//////////////////////////////////////////////////////
        /**
         * 处理每页条数变化
         * @param page_size
         */
        handlePageSizeChange: function (page_size) {
            this.table_page.size = page_size;
            this.updateTableData();
        },
        /**
         * 处理分页index变化
         * @param current_page
         */
        handlePageCurrentChange: function (current_page) {
            this.table_page.current = current_page;
            this.updateTableData();
        },

        /**
         * 处理表格排序变化
         * @param column
         */
        handleSortChange: function (column) {
            if (column.prop) {
                this.sort = column.prop
                this.order = column.order
                this.table_sort = {
                    prop: column.prop,
                    order: column.order
                };
            } else {
                this.table_sort = {};
            }
            this.updateTableData();
        },
        //////////////////////////////////////////////////////view data//////////////////////////////////////////////////////
        /**
         * 获取本文过滤，可返回文本/数据，支持多条件过滤，忽略大小写
         * @param arr
         * @returns {*}
         */
        getTextFilter: function (arr) {
            var text_filter = this.text_filter.trim().toLowerCase();
            if (arr === true) {
                var filters = [];
                if (text_filter) {
                    filters = text_filter.split(" ")
                }
                return filters.filter(function (item) {
                    return !!item;

                });
            }
            return text_filter;
        },

        /**
         * 获取影响数据显示的信息
         * 可通过getViewDataConfig重载
         * @returns {{text_filter: *, sort_prop: *, sort_order: *}}
         */
        _getViewDataConfig: function () {
            var text_filter = this.getTextFilter();
            var sort_prop, sort_order;
            if (this.table_sort && this.table_sort.prop) {
                sort_prop = this.table_sort.prop;
                sort_order = this.table_sort.order;
            }
            var config = {
                text_filter: this.getTextFilter(),
                sort_prop: sort_prop,
                sort_order: sort_order
            };
            if (this.getViewDataConfig) {
                return this.getViewDataConfig(config)
            }
            return config
        },

        /**
         * 检查缓存的视图数据是不是已经变化
         * @param obj   影响变化的因素，如果为null，则使用_getViewDataConfig返回结果
         * @returns {boolean}
         */
        isViewDataChanged: function (obj) {
            if (!obj) {
                obj = this._getViewDataConfig();
            }
            var v_data = this._view_datas;
            if (v_data) {
                var view_config = v_data._view_config;
                if (view_config) {
                    var changed = false;

                    Object.keys(obj).forEach(function (key, value) {

                        if (view_config[key] !== value) {
                            changed = true;
                            return false;
                        }

                    });

                    return changed;
                } else {
                    return true;
                }
            }
            return true;
        },

        /**
         * 数据是否可见/是否被过滤
         * @param data
         * @returns {boolean}
         * @private
         */
        _isDataVisible: function (data) {
            if (this.isDataVisible(data) === false) {
                return false;
            }
            return this.isDataVisibleByTextFilter(data);
        },
        /**
         * 用于重写，自定义数据是否可见/是否被过滤
         * 会被_isDataVisible调用
         * @param data
         * @returns {boolean}
         */
        isDataVisible: function (data) {
            return true;
        },
        /**
         * 判断数据是否被文本过滤
         * @param data
         * @returns {boolean}
         */
        isDataVisibleByTextFilter: function (data) {
            var that = this;
            var text_filter = this.getTextFilter(true);
            if (text_filter.length > 0) {
                var contains = true;
                text_filter.forEach(function (filter) {
                    var filter_contains = false;
                    that.table_columns.forEach(function (columnItem) {
                        var filterable = columnItem.filterable;
                        if (filterable !== false) {
                            var value = data[columnItem.prop];
                            //if (value != null) {
                            if (value != null && (value + "").toLowerCase().indexOf(filter) >= 0) {
                                filter_contains = true;
                                return false;
                            }
                            //}
                            if (filter_contains === true) {
                                return false;
                            }
                        }
                    });
                    if (filter_contains === false) {
                        contains = false;
                        return false;
                    }
                });
                return contains;
            }
            return true;
        },

        /**
         * 创建视图数据。
         * @returns {Array}
         */
        createViewData: function (raw) {
            var data_list = [];
            var that = this;
            this._table_raw_datas.forEach(function (value) {
                if (that._isDataVisible(value)) {
                    data_list.push(that._createViewDataItem(value));
                }
            });

            return data_list;
        },
        _createViewDataItem: function (item) {
            var data = {};
            this.table_columns.forEach(function (columnItem) {
                data[columnItem.prop] = item[columnItem.prop];
            });
            data.__raw_data = item;
            return data
        },

        /**
         * 更新视图数据列表
         * @private
         */
        _updateViewData: function () {
            var viewData;

            var viewDataConfig = this._getViewDataConfig();
            if (this.isViewDataChanged(viewDataConfig)) {
                viewData = this.createViewData();
                var sort_prop = viewDataConfig.sort_prop;
                var sort_order = viewDataConfig.sort_order;
                var cItem = this.getColumnItem(sort_prop);
                if (cItem) {
                    viewData = GridUtil.sort.sort(viewData, sort_prop, sort_order, cItem.type);
                }
                viewData.forEach(function (item, index) {
                    item._index = index + 1;
                });

                viewData._view_config = viewDataConfig;
                this._view_datas = viewData

            }
        },
        getViewData: function () {
            return this._view_datas;
        },
        /**
         * 更新表格数据
         * 包括重置视图数据&分页
         *
         */
        updateTableData: function () {
            this._updateClientTableData();
        },

        _updateClientTableData: function () {
            if (this.getRawDataList()) {
                this.loading = true;
                this._updateViewData();
                var view_data = this.getViewData();
                this.table_data_count = view_data.length;
                var start = (this.table_page.current - 1) * this.table_page.size;
                var end = start + this.table_page.size;
                var t_data = view_data.slice(start, end);
                var that = this;
                t_data.forEach(function (value) {
                    that.renderTextFilterData(value)
                });

                this.table_data = t_data;
                this.loading = false;
            }
        },

        /**
         * 高亮显示搜索
         * @param data
         */
        renderTextFilterData: function (data) {
            var text_filter = this.getTextFilter(true);
            if (text_filter.length > 0) {
                if (data.__filtered !== true) {
                    this.table_columns.forEach(function (column) {
                        var prop = column.prop;
                        var value = data[prop];
                        if (value != null) {

                            z_each(text_filter, function (filter) {
                                if (filter) {
                                    if (value && (value + "").toLowerCase().indexOf(filter) >= 0) {
                                        data[prop] = getFilterMatchText(value, filter);
                                        return false;
                                    }
                                }
                            });

                        }
                    });
                    data.__filtered = true;
                }
            }
        },
        //////////////////////////////////////////////////////selection//////////////////////////////////////////////////////
        /**
         * 保存&获取表格的selection信息
         * @param val
         */
        handleSelectChange: function (val) {
            this._tableSelection = val;
        },

    }
};
var app = new Vue({
    el: '#app',
    mixins: [_defaultConfig, PageConfig.eui || {}],
    mounted: function () {
        if (this.init) {
            this.init();
        }
    }
});


window.onload = function () {
    document.getElementsByTagName('title')[0].innerText = PageConfig.title || ""
    app.loadData();
};


var GridUtil = {
    sort: {
        sort: function (data_list, sort_prop, sort_order, sort_type) {
            if (sort_prop && sort_order) {
                var sortFun = GridUtil.sort.defaultCompare;
                switch (sort_type) {
                    case "ip":
                        sortFun = GridUtil.sort.ipv4SortCompare;
                        break;
                    case "number":
                        sortFun = GridUtil.sort.numberCompare;
                        break;
                }
                data_list.sort(function (d1, d2) {
                    return sortFun(d1[sort_prop], d2[sort_prop]);
                });
                if (sort_order === "descending") {
                    data_list = data_list.reverse();
                }
            }
            return data_list;
        },
        defaultCompare: function (v1, v2) {
            if (v1 > v2) {
                return 1
            }
            if (v1 < v2) {
                return -1
            }
            return 0;
        },
        ipv4SortCompare: function (ip1, ip2) {
            if (ip1 == null) {
                return -1
            }
            if (ip2 == null) {
                return 1;
            }

            var ip1s = ip1.split(".");
            var ip2s = ip2.split(".");
            var len = ip1s.length;
            for (var i = 0; i < len; i++) {
                if (ip1s[i] - ip2s[i] > 0) {
                    return 1;
                }
                if (ip1s[i] - ip2s[i] < 0) {
                    return -1;
                }
            }
            return 0;
        },
        numberCompare: function (v1, v2) {
            var _v1 = +v1;
            if (isNaN(_v1)) {
                return -1;
            }
            var _v2 = +v2;
            if (isNaN(_v2)) {
                return 1;
            }
            if (_v1 > _v2) {
                return 1;
            }
            if (_v1 < _v2) {
                return -1;
            }
            return 0;
        }
    }
};

function getFilterMatchText(value, filter, i) {

    if (filter) {
        filter = filter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        var a = value + "";
        var o;
        var n = filter.split(",");
        if (n.length > 1) {
            f(n, function (t) {
                if (new RegExp(t, "i").test(a)) {
                    o = t;
                    return false
                }
            })
        } else {
            o = filter
        }
        if (o) {
            i = i || "_p-filter-matched";
            return (value + "").replace(new RegExp(o, "gi"), function (t) {
                return "<span class='" + i + "'>" + t + "</span>"
            })
        }
    }
    return value
}

function z_each(list, func) {
    list.forEach(function (v) {
        func(v)
    })
}

