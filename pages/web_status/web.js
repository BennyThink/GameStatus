var PageConfig = {
    title: "网站服务器状态",
    load_url: AjaxUrls.web_status,
    eui: {
        data: {
            menu_index: "web_status",
            filter: {},
        },
        computed: {
            calTableHeight: function () {
                this.tableHeight = window.innerHeight - this.headerHeight - this.toolbarHeight - this.paginationHeight - 140
                return this.tableHeight
            }
        },
        methods: {
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
                console.log(add)
                window.open('mailto:benny.think@gmail.com?subject='
                    + add.row.name + ': ' + add.row.address + ' 反馈' + '&body=Hi Benny,\n')
            }


        }
    }
};