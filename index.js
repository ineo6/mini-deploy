#!/usr/bin/env node
const path = require('path');
const argv = require('yargs').argv;
const os = require('os');

/**
 * @link https://developers.weixin.qq.com/miniprogram/dev/devtools/http.html
 * 请先打开微信开发工具，并完成登录
 * **/

const tool = require('./tool');

const mode = argv.mode || 'preview';
// 默认当前目录
const workspace = argv.workspace || process.cwd();
const version = argv.ver || '1.0.default';
const desc = argv.desc || tool.dateFormat(new Date(), 'yyyy年MM月dd日 HH点mm分ss秒') + ' 提交上传';

const httpOpen = async () => {
    // 打开微信开发工具
    let res = await httpRequest('/open', {
        projectpath: workspace,
    });

    if (res.result === false && res.data && res.data.statusCode !== 0) {
        console.error(':open error!');
        console.error(res.errmsg);
        process.exit(1)
    } else {
        console.log('open success!');
        console.log("devtool启动成功！");
    }
};

async function runWxIde() {
    let wxPaths = [];
    switch (os.platform()) {
        case "darwin":
            const result = await tool.executeCommand("defaults read com.tencent.wechat.devtools LastRunAppBundlePath");
            if (result.stdout != '') {
                const stdout = result.stdout.replace(/\n/g, "");
                wxPaths = [path.join(stdout, "/Contents/Resources/app.nw/bin/cli")];
            }
            // defaults read
            wxPaths.push("/Applications/wechatwebdevtools.app/Contents/Resources/app.nw/bin/cli");
            break;
        case "win32":
            // defaults read
            wxPaths = [
                "C:\\Program Files (x86)\\Tencent\\微信web开发者工具\\cli.bat",
                "C:\\Program Files\\Tencent\\微信web开发者工具\\cli.bat"
            ];
            const iconv = require('iconv-lite');
            const encoding = 'cp936';
            const binaryEncoding = 'binary';
            const result2 = await tool.executeCommand('REG QUERY "HKLM\\SOFTWARE\\Wow6432Node\\Tencent\\微信web开发者工具"', {encoding: binaryEncoding});
            const stdout = iconv.decode(new Buffer(result2.stdout, binaryEncoding), encoding);
            if (stdout != '') {
                const stdoutArr = stdout.split("\r\n");
                let exePath = stdoutArr.find((path) => path.indexOf(".exe") != -1);
                exePath = exePath.split("  ").find((path) => path.indexOf(".exe") != -1);
                exePath = path.join(path.dirname(exePath), 'cli.bat');
                wxPaths.unshift(exePath);
            }
            break;
    }
    const wxpath = wxPaths.find((wxpath) => tool.fsExistsSync(wxpath));
    if (wxpath) {
        try {
            const result = await tool.shell(wxpath, ["-o"], null, true);

            if (result.code == 0) {
                console.error(':open error!');
                console.error(res.errmsg);
                process.exit(1);
            } else {
                console.log('open success!');
                console.log("devtool启动成功！");
            }
        }
        catch (e) {
            // await tool.shell(wxpath, ["-o"], null, true);
        }
    }
    else {
        throw '请安装最新微信开发者工具';
        process.exit(1);
    }
    return -0xF000
}

const preview = async () => {
    let res = await tool.getPreviewImage('preview.png', {
        projectpath: workspace,
    });

    if (res.result === false) {
        console.error(':preview error!');
        console.error(res.errmsg);
        process.exit(1)
    } else {
        console.log('preview success!');
        console.log("预览成功！请扫描二维码进入开发版！")
    }
};

const upload = async (upload_version, upload_desc) => {
    // 上传
    let res = await tool.httpRequest('/upload', {
        projectpath: workspace,
        version: upload_version,
        desc: upload_desc,
    });

    if (res.result === false) {
        console.error('upload error!');
        console.error(res.errmsg);
        process.exit(1)
    } else {
        console.log('upload success!');
        console.log("上传成功！请到微信小程序后台设置体验版或提交审核！");
    }
};

const start = async () => {

    if (!workspace) {
        console.error("缺少workspace！");
        process.exit(1)
    }

    if (tool.fsExistsSync(path.join(workspace, 'project.config.json'))) {
        await runWxIde();

        if (mode === 'preview') {
            await preview();
        } else if (mode === 'upload') {
            await upload(version, desc);
        }
    } else {
        console.error("workspace下未找到 project.config.json，请指定为小程序目录。");
        process.exit(1)
    }

};

start();
