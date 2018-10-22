let PageConfig = {
    title: "游戏服务器状态",
    load_url: AjaxUrls.game_status,
    load_type: "client",
    eui: {
        data: {
            menu_index: "game_status",
        },
        computed: {
            calTableHeight: function () {
                this.tableHeight = window.innerHeight - this.headerHeight - this.toolbarHeight - this.paginationHeight - 140;
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
            addGame: function (add) {
                //steam://rungameid/550 +connect game.bennythink.com:27020
                this.$message({
                    message: '游戏加入尚未实现',
                    type: 'success'
                });
                // window.open(add.row.address)
            },
            mail: function (add) {
                window.open('mailto:benny.think@gmail.com?subject='
                    + add.row.name + ': ' + add.row.address + ' 反馈' + '&body=Hi Benny,\n')
            }


        }
    }
};