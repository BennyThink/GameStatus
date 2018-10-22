let PageConfig = {
    title: "影梭服务器状态",
    load_url: AjaxUrls.ss_status,
    load_type: "client",
    eui: {
        data: {
            menu_index: "ss_status",
            insidePage: 1,
            inner_data_length: 0,
            inner_table_data: [],
        },
        computed: {
            calTableHeight: function () {
                this.tableHeight = window.innerHeight - this.headerHeight - this.toolbarHeight - this.paginationHeight - 140
                return this.tableHeight
            }
        },
        watch: {
            status_code: function (val) {
                if (val !== 200) {
                    this.$message({
                        message: '登录信息已失效，即将跳转登录...',
                        type: 'info'
                    });
                    setTimeout(function () {
                        window.location = '../ss_status/login.html'
                    }, 1500);

                }
            }
        },
        methods: {
            insideChange: function (v) {
                this.insidePage = v;
            },
            aClick: function (raw) {
                this.inner_data_length = raw.length;
                this.inner_table_data = JSON.parse(JSON.stringify(raw));
            },
            popoverHide: function () {
                this.insidePage = 1;
            },
            refresh: function () {
                app.loading = true;
                axios.post(PageConfig.load_url, 'refresh=1;_xsrf=' + getCookie("_xsrf")).then((res) => {
                    app.loadData();
                    app.loading = false;
                    this.$message({
                        message: '刷新成功',
                        type: 'success'
                    });
                }).catch((err) => {
                    let msg = err.response ? err.response.data.message : err.message;
                    let error = err.response ? err.response : err.request;
                    this.$message({
                        message: msg,
                        type: 'error'
                    });
                    app.loading = false;
                    console.error(error);
                });


            },
            mail: function (add) {
                window.open('mailto:benny.think@gmail.com?subject='
                    + add.row.name + ': ' + add.row.address + ' 反馈' + '&body=Hi Benny,\n')
            }

        }
    }
};
