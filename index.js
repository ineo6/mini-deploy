#!/usr/bin/env node
const path = require('path');
const argv = require('yargs').argv;

/**
 * @link https://developers.weixin.qq.com/miniprogram/dev/devtools/http.html
 * 请先打开微信开发工具，并完成登录
 * **/

const {httpRequest, getPreviewImage, dateFormat, fsExistsSync} = require('./tool');

const mode = argv.mode || 'preview';
// 默认当前目录
const workspace = argv.workspace || process.cwd();
const version = argv.version || '1.0.default';
const desc = argv.desc || dateFormat(new Date(), 'yyyy年MM月dd日 HH点mm分ss秒') + ' 提交上传';


const open = async () => {
    // 上传
    let res = await httpRequest('/open', {
        projectpath: workspace,
    });

    if (res.result === false && res.data.statusCode !== 0) {
        console.error(':open error!');
        console.error(res.errmsg);
        process.exit(1)
    } else {
        console.log('open success!');
        console.log("devtool启动成功！");
    }
};

const preview = async () => {
    let res = await getPreviewImage('preview.png', {
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
    let res = await httpRequest('/upload', {
        projectpath: workspace,
        version: upload_version,
        desc: upload_desc,
    });

    if (res.result === false) {
        console.error(':upload error!');
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

    if (fsExistsSync(path.join(workspace, 'project.config.json'))) {
        await open();

        if (mode === 'preview') {
            await preview();
        } else if (mode === 'upload') {
            await upload(version, desc);
        }
    } else {
        console.error("workspace下未找到 project.config.json，请指定为小程序目录。");
        process.exit(1)
    }

}

start();
