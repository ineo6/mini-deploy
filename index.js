#!/usr/bin/env node
const argv = require('yargs').argv;

/**
 * @link https://developers.weixin.qq.com/miniprogram/dev/devtools/http.html
 * 请先打开微信开发工具，并完成登录
 * **/

const {httpRequest, getPreviewImage, dateFormat} = require('./tool');

const buildType = argv.buildType || 'dev';
const workspace = argv.workspace || '';
const version = argv.version || '1.0.default';
const desc = argv.desc || dateFormat(new Date(), 'yyyy年MM月dd日 HH点mm分ss秒') + ' 提交上传';

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
}

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
        console.log("上传成功！请到微信小程序后台设置体验版或提交审核！")
    }
}

if (!workspace) {
    console.error("缺少workspace！")
    return false;
}

if (buildType === 'dev') {
    preview();
} else if (buildType === 'prod' || buildType === 'build') {
    upload(version, desc);
}
