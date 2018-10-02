var PageConfig = {
    title: "影梭服务器状态",
    load_url: AjaxUrls.ss_status,
    eui: {
        data: {
            menu_index: "ss_status",
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
                app.loadData();
                this.$message({
                    message: '刷新成功',
                    type: 'success'
                });
            },
            addGame: function (add) {
                // console.log(add);
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