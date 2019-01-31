const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const qs = require('querystring');

let httpPort;

const writeTool = {
    readJsonFile: function (filename) {
        return JSON.parse(fs.readFileSync(filename))
    },
    writeJsonFile: function (filename, json) {
        fs.writeFileSync(filename, JSON.stringify(json, null, 2));
    },
    writeFile: function (filename, jsStr) {
        fs.writeFileSync(filename, jsStr)
    }
};

function getHttpPort() {
    if (httpPort) {
        return httpPort
    }

    let portPath;
    switch (os.type()) {
        case 'Darwin': // macOS
            portPath = '/Library/Application Support/微信web开发者工具/Default/.ide';
            break;
        case 'Windows_NT': // windows
            portPath = '/AppData/Local/微信web开发者工具/User Data/Default/.ide';
            break;
        default:
            console.error('不支持的平台');
            process.exit(1)
    }

    const portFile = path.join(os.homedir(), portPath);
    const port = fs.readFileSync(portFile);
    httpPort = port.toString();
    return httpPort
}

/** * 对Date的扩展，将 Date 转化为指定格式的String * 月(M)、日(d)、12小时(h)、24小时(H)、分(m)、秒(s)、周(E)、季度(q)
 可以用 1-2 个占位符 * 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字) * eg: * (new
 Date()).pattern("yyyy-MM-dd hh:mm:ss.S")==> 2006-07-02 08:09:04.423
 * (new Date()).pattern("yyyy-MM-dd E HH:mm:ss") ==> 2009-03-10 二 20:09:04
 * (new Date()).pattern("yyyy-MM-dd EE hh:mm:ss") ==> 2009-03-10 周二 08:09:04
 * (new Date()).pattern("yyyy-MM-dd EEE hh:mm:ss") ==> 2009-03-10 星期二 08:09:04
 * (new Date()).pattern("yyyy-M-d h:m:s.S") ==> 2006-7-2 8:9:4.18
 */
function dateFormat(dateObj, fmt) { //author: meizz
    var o = {
        "M+": dateObj.getMonth() + 1, //月份
        "d+": dateObj.getDate(), //日
        "h+": dateObj.getHours(), //小时
        "m+": dateObj.getMinutes(), //分
        "s+": dateObj.getSeconds(), //秒
        "q+": Math.floor((dateObj.getMonth() + 3) / 3), //季度
        "S": dateObj.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (dateObj.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

module.exports = Object.assign(writeTool, {
    httpRequest: function (urlPath, data = {}, method = 'get') {
        urlPath = urlPath + '?' + qs.stringify(data);
        return new Promise(function (resolve, reject) {
            let req = http.request({
                protocol: 'http:',
                host: '127.0.0.1',
                port: getHttpPort(),
                method: method,
                path: urlPath,
            }, function (res) {
                resolve({result: true, data: res});
            });

            req.on('error', (e) => {
                resolve({result: false, errmsg: e.message});
            });
            req.end();
        })
    },
    getPreviewImage: function (output, data = {}, method = 'get') {

        let imgData = '';

        return new Promise(function (resolve, reject) {
            let req = http.request({
                protocol: 'http:',
                host: '127.0.0.1',
                port: getHttpPort(),
                method: method,
                path: '/preview?' + qs.stringify(data),
            }, function (res) {
                res.setEncoding('binary');

                res.on('data', function (chunk) {
                    imgData += chunk
                });

                res.on('end', function () {
                    fs.writeFile(data.projectpath + '/' + output, imgData, 'binary', function (err) {
                        if (err) {
                            resolve({result: false, errmsg: '生成预览QR图失败'});
                        } else {
                            resolve({result: true, data: res});
                        }
                    })
                });
            });

            req.on('error', (e) => {
                resolve({result: false, errmsg: e.message});
            });
            req.end();
        })

    },
    dateFormat: dateFormat,
});
