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
                app.loadData();
                this.$message({
                    message: '刷新成功',
                    type: 'success'
                });
            },
            mail: function (add) {
                window.open('mailto:benny.think@gmail.com?subject='
                    + add.row.name + ': ' + add.row.address + ' 反馈' + '&body=Hi Benny,\n')
            }


        }
    }
};