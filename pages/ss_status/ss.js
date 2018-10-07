var PageConfig = {
    title: "影梭服务器状态",
    load_url: AjaxUrls.ss_status,
    eui: {
        data: {
            menu_index: "ss_status",
            filter: {},
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
                var that = this;
                axios.post(PageConfig.load_url, 'refresh=1;_xsrf=' + getCookie("_xsrf")).then(function (res) {
                    app.loadData();
                    app.loading = false;

                    that.$message({
                        message: '刷新成功',
                        type: 'success'
                    });
                }).catch(function (err) {
                    that.$message({
                        message: '数据加载失败',
                        type: 'error'
                    });
                    app.loading = false;
                    console.log(err);
                });


            },
            mail: function (add) {
                window.open('mailto:benny.think@gmail.com?subject='
                    + add.row.name + ': ' + add.row.address + ' 反馈' + '&body=Hi Benny,\n')
            }

        }
    }
};

function verify_again(password) {
    axios.post(AjaxUrls.login, "password=" + password).then(function (res) {
        return true;
    }).catch(function (err) {
        return false
    });


}