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