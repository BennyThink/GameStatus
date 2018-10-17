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
            if (!this.textFilter) {
                this.updateTableData();
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
            let that = this;
            axios.get(PageConfig.load_url).then(function (res) {
                that.rawData = res.data.data;
                that.parseColumn(res.data.column);
                that.parseResult(res.data.data);
                that.status_code = 200;
                that.loading = false;
            }).catch(function (err) {
                let msg = err.response ? err.response.data.message : err.message;
                let error = err.response ? err.response : err.request;
                that.$message({
                    message: msg,
                    type: 'error'
                });
                app.loading = false;
                console.error(error);
                that.status_code = err.response.status;
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
            this.tableData = result.slice((currentPage - 1) * pagesize, currentPage * pagesize);
            this.totalDataCount = result.length;
        },
        /**
         * search table content, case sensitive.
         * 1. Even though some data may not be shown on the web page, the data is still searchable
         * 2. Contains some bugs that won't get fixed.
         */
        searchTable: function () {
            //vue specified
            let textFilter = this.textFilter;
            let rawData = this.rawData;

            // TODO: 2. Bug fix, keywords containing weather / would fail
            let keywordList = textFilter.trim().replace(/\s+/g, ' ').split(' ');
            let dataCooked = JSON.parse(JSON.stringify(rawData));
            let deleteIndex = [];
            dataCooked.forEach(function (value, index) {
                let dataKeyList = Object.keys(value);
                let singleLine = '';

                dataKeyList.forEach(function (key) {
                    //TODO: 1. may kick out non-showable value .
                    if (typeof value[key] !== "object") {
                        singleLine += value[key];
                    }
                    keywordList.forEach(function (keyword) {
                        if (String(value[key]).indexOf(keyword) !== -1 && typeof value[key] !== "object") {
                            value[key] = addClass(value[key], keyword);
                        }
                    });

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
 * @param key keywords for highlight
 * @returns {*} Tor<span class="">na</span>do
 */
function addClass(text, key) {
    let insertStr = (soure, start, newStr) => {
        return soure.slice(0, start) + newStr + soure.slice(start)
    };
    let origin;
    let index;

    origin = text.match(/<span class="_p-filter-matched">.*<\/span>/g);
    index = text.search(/<span class="_p-filter-matched">.*<\/span>/g);
    text = text.replace(/<span class="_p-filter-matched">.*<\/span>/g, '');

    //apply new style
    text = text.replace(key, '<span style="background:yellow">' + key + '</span>');
    // restore it
    if (index !== -1 && origin !== null)
    //TODO: more Bugs come with more fix. Leave it here (/≧▽≦)/ Magic number 39
        text = insertStr(text, index, origin[0]);
    return text;

}

function getCookie(name) {
    let c = document.cookie.match("\\b" + name + "=([^;]*)\\b");
    return c ? c[1] : undefined;
}
