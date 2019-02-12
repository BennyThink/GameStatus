let _defaultConfig = {
    data: {
        sysTitle: "服务器状态",
        loading: true,

        textFilter: "",

        tableColumns: [{}],
        tableData: [],
        rawData: [],
        totalDataCount: 0,
        status_code: 400,
        tablePage: {
            current: 1,
            sizes: [5, 10, 50, 100, 200, 500],
            size: 5,
            layout: "total, prev, pager, next, jumper, sizes"
        },
        tableSort: {prop: "", order: ""},
        headerHeight: '',
        toolbarHeight: '',
        paginationHeight: '',
        menuCollapse: false,
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
        ],

    },
    watch: {
        textFilter: function () {
            // front-end search call
            if (PageConfig.load_type === 'client') {
                this.searchTable();
            }
        }
    },
    mounted() {
        this.headerHeight = parseInt(this.$refs.headerRef.$el.clientHeight);
        if (this.$refs.toolbarRef) {
            this.toolbarHeight = parseInt(this.$refs.toolbarRef.clientHeight);
        }
        this.paginationHeight = parseInt(this.$refs.paginationRef.$el.clientHeight);
    },
    created: function () {
        setInterval(this.timer, 1000 * 600);
    },
    methods: {
        timer: function () {
            this.reloadData();
        },
        reloadData: function () {
            this.loadData();
        },
        /**
         * load data from server.
         */
        loadData: function () {
            if (PageConfig.load_type === 'server') {
                let page = this.tablePage.current;
                let per_page = this.tablePage.size;
                let sort = this.tableSort.prop;
                let order = this.tableSort.order;
                let search = this.textFilter;
                let template = `?page=${page}&per_page=${per_page}&sort=${sort}&order=${order}&search=${encodeURI(search)}`;
                let rawUrl = PageConfig.load_url.split('?page')[0];
                PageConfig.load_url = rawUrl + template;
            }

            axios.get(PageConfig.load_url).then((res) => {
                this.rawData = res.data.data;
                this.totalDataCount = PageConfig.load_type === 'server' ?
                    res.data.meta.count : undefined;
                this.parseColumn(res.data.column);
                this.parseResult(res.data.data);
                this.status_code = 200;
                this.loading = false;
            }).catch((err) => {
                let msg = err.response ? err.response.data.message : err.message;
                let error = err.response ? err.response : err.request;
                this.$message({
                    message: msg,
                    type: 'error'
                });
                app.loading = false;
                console.error(error);
                this.status_code = err.response.status;
            });
        },
        parseColumn: function (column) {
            if (column) {
                this.tableColumns = column;
            }
        },
        /**
         * process data and apply it to table. This function will not affect rawData
         * @param result, [], won't get impact.
         */
        parseResult: function (result) {
            let currentPage = this.tablePage.current;
            let pagesize = this.tablePage.size;
            if (PageConfig.load_type === 'server')
                this.tableData = result;
            else {
                this.tableData = result.slice((currentPage - 1) * pagesize, currentPage * pagesize);
                this.totalDataCount = result.length;
            }
        },
        /**
         * search table content, case sensitive.
         * 1. Even though some data may not be shown on the web page, the data is still searchable
         * 2. Contains some bugs that won't get fixed.
         */
        searchTable: function () {
            // server & client
            if (PageConfig.load_type === 'server') {
                this.loadData();
                return
            }
            //vue specified
            let textFilter = this.textFilter;
            let rawData = this.rawData;

            let keywordList = textFilter.trim().replace(/\s+/g, ' ').split(' ');
            let dataCooked = JSON.parse(JSON.stringify(rawData));
            let deleteIndex = [];

            // kick out non-showable data
            let props = '';
            this.tableColumns.forEach(function (each) {
                props = props + each.prop;
            });
            dataCooked.forEach(function (value) {
                Object.keys(value).forEach(function (prop) {
                    if (props.indexOf(prop) === -1)
                        delete value[prop];
                });
            });

            dataCooked.forEach(function (value, index) {
                let dataKeyList = Object.keys(value);
                let singleLine = '';

                dataKeyList.forEach(function (key) {
                    if (typeof value[key] !== "object") {
                        singleLine += value[key];
                    }

                    if (keywordList[0])
                        value[key] = addClass(String(value[key]), keywordList);

                });
                keywordList.forEach(function (kw) {
                    if (singleLine.indexOf(kw) === -1) {
                        deleteIndex.push(index);
                    }
                });

            });

            deleteIndex.forEach(function (i) {
                // Use splice(index,1) will alter the length of array. So we shouldn't use it here.
                delete dataCooked[i];
            });

            let finalData = dataCooked.filter(function (el) {
                return el != null;
            });

            this.updateTableData(finalData);

        },

        /**
         * update table view data. This function will not affect origin data.
         * @param d,[] data for update.
         */
        updateTableData: function (d) {
            if (PageConfig.load_type === 'server')
                this.loadData();
            else
                this.parseResult(d ? d : this.rawData);
        },
        handlePageSizeChange: function (page_size) {
            this.tablePage.size = page_size;
            this.updateTableData();
        },
        handlePageCurrentChange: function (current_page) {
            this.tablePage.current = current_page;
            this.updateTableData();
        },
        handleSortChange: function (column) {
            if (column.prop) {
                this.tableSort = {
                    prop: column.prop,
                    order: column.order
                };
            } else {
                this.tableSort = {prop: "", order: ""};
            }

            this.updateTableData();
        },

    }
};

let app = new Vue({
    el: '#app',
    mixins: [_defaultConfig, PageConfig.eui || {}],
    mounted: function () {
        if (this.init) {
            this.init();
        }

    }
});


window.onload = function () {
    document.getElementsByTagName('title')[0].innerText = PageConfig.title || "";
    app.loadData();
};

/**
 * add <span> for keywords
 * @param text single cell
 * @param filters keywords for highlight, ['F', 'p']
 * @returns {*} Tor<span class="">na</span>do
 */
function addClass(text, filters) {
    if (!filters.length)
        return text;

    String.prototype.replaceAll = function (filters, RepText, token) {
        let regExp = new RegExp(filters.join("|"), "gi");

        return this.replace(regExp, (match) => {
            return RepText.replace(token, match);
        });
    };

    let repText = "<span style=\"background:yellow\">*filter*</span>";
    let token = "*filter*";

    return text.replaceAll(filters, repText, token);
}

function getCookie(name) {
    let c = document.cookie.match("\\b" + name + "=([^;]*)\\b");
    return c ? c[1] : undefined;
}
