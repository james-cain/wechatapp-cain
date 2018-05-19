class Utils {
    constructor () {
        this.wechatAccount = wx.getStorageSync('weChatAccount') ? JSON.parse(wx.getStorageSync('weChatAccount')) : '';
        this.session = wx.getStorageSync('session');
        this.server_url = 'https://wap.btglsc.com/buyback';
        this.ajax = this.ajax.bind(this);
        this.auth = this.auth.bind(this);
        this.checkSession = this.checkSession.bind(this);
        this.formatFunc = this.formatFunc.bind(this);
        this.judge = this.judge.bind(this);
        this.beforeSubmit = this.beforeSubmit.bind(this);
        this.formatFloat = this.formatFloat.bind(this);
        this.checkNetWorkStatus = this.checkNetWorkStatus.bind(this);
    }

    formatFunc (date, format) {
        const m = date.getMonth() + 1;
        const month = m.toString();
        const mStr = month.length > 1 ? month : `0${month}`;
        const day = date.getDate().toString();
        const dayStr = day.length > 1 ? day : `0${day}`;
        const minutes = date.getMinutes();
        const hours = date.getHours();
        const hoursStr = hours >= 10 ? hours : `0${hours}`;
        const minutesStr = minutes >= 10 ? minutes : `0${minutes}`;
        const seconds = date.getSeconds();
        const secondsStr = seconds >= 10 ? seconds : `0${seconds}`;
        if (format === 'yyyyMMddHHmmss') {
            return date.getFullYear() + mStr + dayStr + hoursStr + minutesStr + secondsStr;
        } else if (format === 'YYYY-MM-dd HH:mm:ss') {
            return `${date.getFullYear()}-${mStr}-${dayStr} ${hoursStr}:${minutesStr}:${secondsStr}`;
        } else if (format === 'YYYY年MM月dd日 HH:mm') {
            return `${date.getFullYear()}年${mStr}月${dayStr}日 ${hoursStr}:${minutesStr}`;
        } else if (format === 'yyyyMMdd') {
            return date.getFullYear() + mStr + dayStr;
        } else if (format === 'yyyy年M月d日') {
            return `${date.getFullYear()}年${m}月${day}日`;
        } else if (format === 'MM月dd日') {
            return `${mStr}月${dayStr}日`;
        } else if (format === 'M月d日') {
            return `${month}月${day}日`;
        } else if (format === 'H:m') {
            return `${hours}:${minutes}`;
        } else if (format === 'yyyy-MM-dd HH:mm') {
            return `${date.getFullYear()}-${mStr}-${dayStr} ${hoursStr}:${minutesStr}`;
        } else if (format === 'yyyy/MM/dd') {
            return `${date.getFullYear()}/${mStr}/${dayStr}`;
        }
        return `${date.getFullYear()}-${mStr}-${dayStr}`;
    }

    ajax (args) {
        const init = {
            method: 'GET',
            dataType: 'json',
            contentType: 'application/json'
        };
        const self = this;
        let errorTipImg = '../../images/warn.png';
        let param = Object.assign({}, init, args);
        if (/login/g.test(param.url)) {
            errorTipImg = '../images/warn.png';
        }
        if (this.checkNetWorkStatus()) {
            wx.request({
                url: this.server_url + param.url,
                method: param.method,
                dataType: param.dataType,
                data: param.params,
                header: {
                    'token': wx.getStorageSync('session'),
                    'content-type': param.contentType
                },
                success: (data) => {
                    wx.hideLoading();
                    if (data.data.code === 401) {
                        wx.showToast({
                            title: '会话过期,正在重新获取认证',
                            icon: 'none',
                            duration: 1000
                        });
                        self.auth();
                    } else if (data.data.code === 500 && param.from !== 'checksession') {
                        wx.showToast({
                            title: data.data.msg,
                            icon: 'none',
                            duration: 2000
                        });
                    } else {
                        const dataInData = data.data ? data.data : data;
                        param.success(dataInData);
                    }
                },
                fail: (e) => {
                    wx.hideLoading();
                    wx.showToast({
                        title: '服务请求失败',
                        image: errorTipImg,
                        duration: 2000
                    });
                }
            });
        }
    }

    auth () {
        if (this.checkNetWorkStatus()) {
            this.ajax({
                url: '/app/wx/user/info',
                method: 'GET',
                params: {
                    openid: this.wechatAccount.id
                },
                success(data) {
                    // console.log(data);
                    if (data.code === 0) {
                        wx.setStorageSync('session', data.token);
                        wx.setStorageSync('userType', data.userType);
                        this.session = data.token;
                        setTimeout(() => {
                            wx.showToast({
                                title: '认证成功，请重新操作!',
                                icon: 'none',
                                duration: 2000
                            });
                        }, 1000);
                    } else if (data.code === '500') {
                        wx.showToast({
                            title: data.msg,
                            icon: 'none',
                            duration: 2000
                        });
                    }
                }
            });
        }
    }

    checkSession () {
        const session = wx.getStorageSync('session');
        // console.log('checkSession', session);
        if (!session && this.checkNetWorkStatus()) {
            const wechatAccount = wx.getStorageSync('weChatAccount') ? JSON.parse(wx.getStorageSync('weChatAccount')) : '';
            this.ajax({
                url: '/app/wx/user/info',
                method: 'GET',
                params: {
                    openid: wechatAccount.id
                },
                from: 'checksession',
                success(data) {
                    // console.log(data);
                    if (data.code === 0) {
                        wx.setStorageSync('session', data.token);
                        wx.setStorageSync('userType', data.userType);
                        const userInfo = {};
                        userInfo.region = data.region;
                        userInfo.userId = data.userId;
                        userInfo.userName = data.userName;
                        userInfo.userType = data.userType;
                        userInfo.headUrl = data.headUrl;
                        wx.setStorageSync('userInfo', JSON.stringify(userInfo));
                        const userType = data.userType;
                        if (userType === '2') {
                            wx.setStorageSync('permissionType', 'ywy');
                        } else if (userType === '3') {
                            wx.setStorageSync('permissionType', 'hgy');
                        } else if (userType === '4') {
                            wx.setStorageSync('permissionType', 'cw');
                        } else if (userType === '5') {
                            wx.setStorageSync('permissionType', 'zhl');
                        } else if (userType === '6') {
                            wx.setStorageSync('permissionType', 'gly');
                        } else {
                            wx.setStorageSync('permissionType', 'ywy');
                        }
                        this.session = data.token;
                        if (userType === '6') {
                            wx.redirectTo({
                                url: 'manager/managerMain'
                            });
                        } else {
                            wx.redirectTo({
                                url: 'user/main'
                            });
                        }
                    }
                }
            });
        }
    }

    judge (data, reg, title, cb) {
        if (data !== '' && !reg.test(data)) {
            wx.showToast({
                title,
                icon: 'none',
                duration: 2000
            });
            cb();
        }
    }

    beforeSubmit(data, title) {
        if (!data) {
            wx.showToast({
                title,
                icon: 'none',
                duration: 2000
            });
            return false;
        }
        return true;
    }

    // 清除浮点数精度误差
    formatFloat(p, w, digit) {
        const m = Math.pow(10, digit);
        const pm = p * m;
        const wm = w * m;
        return parseInt(pm * wm, 10) / (m * m);
    }

    // 网络连接验证
    checkNetWorkStatus() {
        let status = true;
        wx.getNetworkType({
            success: (res) => {
                // 返回网络类型2g,3g,4g,wifi,none,unknown
                const networkType = res.networkType;
                if (networkType === 'none') {
                    // 没有网络连接
                    wx.showToast({
                        title: '没有网络连接，请检查您的网络设置',
                        icon: 'none',
                        duration: 2000
                    });
                    status = false;
                } else if (networkType === 'unknown') {
                    // 未知的网络类型
                    wx.showToast({
                        title: '未知的网络类型，请检查您的网络设置',
                        icon: 'none',
                        duration: 2000
                    });
                    status = false;
                }
            }
        });
        return status;
    }
}

const utils = new Utils();
export default utils;
