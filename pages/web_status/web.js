let PageConfig = {
    title: "网站服务器状态",
    load_url: AjaxUrls.web_status,
    load_type: "client",
    eui: {
        data: {
            menu_index: "web_status",
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