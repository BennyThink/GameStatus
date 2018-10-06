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
            password: '',
            auth: ''
        },
        computed: {
            calTableHeight: function () {
                this.tableHeight = window.innerHeight - this.headerHeight - this.toolbarHeight - this.paginationHeight - 140
                return this.tableHeight
            }
        },
        created: function () {
            var arr, reg = new RegExp("(^| )" + 'auth' + "=([^;]*)(;|$)");
            var cookie_pass = undefined;
            if (arr = document.cookie.match(reg))
                this.auth = cookie_pass = arr[2];
            else
                window.location = '../ss_status/login.html';

            axios.post(AjaxUrls.login, "password=" + cookie_pass).then(function (res) {
                console.log('cookies login success')
            }).catch(function (err) {
                console.warn('login failed');
                window.location = '../ss_status/login.html'
            });


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
                axios.get(PageConfig.load_url + '?refresh=1').then(function (res) {
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