const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const qs = require('querystring');
const cp = require('child_process');

let httpPort;

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

    console.log('微信开发者工具运行在' + httpPort + '端口');

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
function dateFormat(dataObj, fmt) {
    const o = {
        "M+": dataObj.getMonth() + 1, //月份
        "d+": dataObj.getDate(), //日
        "h+": dataObj.getHours() % 12 == 0 ? 12 : dataObj.getHours() % 12, //小时
        "H+": dataObj.getHours(), //小时
        "m+": dataObj.getMinutes(), //分
        "s+": dataObj.getSeconds(), //秒
        "q+": Math.floor((dataObj.getMonth() + 3) / 3), //季度
        "S": dataObj.getMilliseconds() //毫秒
    };
    const week = {
        "0": "/u65e5",
        "1": "/u4e00",
        "2": "/u4e8c",
        "3": "/u4e09",
        "4": "/u56db",
        "5": "/u4e94",
        "6": "/u516d"
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (dataObj.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    if (/(E+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, ((RegExp.$1.length > 1) ? (RegExp.$1.length > 2 ? "/u661f/u671f" : "/u5468") : "") + week[dataObj.getDay() + ""]);
    }
    for (const k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
    }
    return fmt;
}

function fsExistsSync(path) {
    try {
        fs.accessSync(path, fs.F_OK);
    } catch (e) {
        return false;
    }
    return true;
}

function shell(path, args, opt, verbase) {
    let stdout = "";
    let stderr = "";

    const cmd = `${path} ${args.join(" ")}`;
    if (verbase) {
        console.log(cmd);
    }
    let printStdoutBufferMessage = (message) => {
        const str = message.toString();
        stdout += str;
        if (verbase) {
            console.log(str);
        }
    };
    let printStderrBufferMessage = (message) => {
        let str = message.toString();
        stderr += str;
        if (verbase) {
            console.log(str);
        }
    };

    return new Promise((resolve, reject) => {
        // path = "\"" + path + "\"";
        // var shell = cp.spawn(path + " " + args.join(" "));
        const shell = cp.spawn(path, args);
        shell.on("error", (message) => {
            console.log(message);
        });
        shell.stderr.on("data", printStderrBufferMessage);
        shell.stderr.on("error", printStderrBufferMessage);
        shell.stdout.on("data", printStdoutBufferMessage);
        shell.stdout.on("error", printStdoutBufferMessage);
        shell.on('exit', function (code) {
            if (code != 0) {
                if (verbase) {
                    console.log('Failed: ' + code);
                }
                reject({code, stdout, stderr, path, args});
            }
            else {
                resolve({code, stdout, stderr, path, args});
            }
        });
    });
}

async function executeCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
        cp.exec(command, options, (error, stdout, stderr) => {
            resolve({error, stdout, stderr})
        });
    })
}

function getPreviewImage(output, data = {}, method = 'get') {
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

}

function httpRequest(urlPath, data = {}, method = 'get') {
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
}

module.exports = {
    dateFormat: dateFormat,
    fsExistsSync: fsExistsSync,
    executeCommand: executeCommand,
    shell: shell,
    getPreviewImage: getPreviewImage,
    httpRequest: httpRequest,
};
