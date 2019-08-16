#!/usr/bin/env node
const path = require('path');
const program = require('commander');

const WeChatCli = require('./weChatCli');
const packageJson = require('./package.json');

const tool = require('./tool');

program
  .version(packageJson.version)
  .usage('[--options ...]')
  .option('-w, --workspace [value]', '微信小程序工作区目录', process.cwd())
  .option('-ver, --ver [value]', '发布版本号', '1.0.0')
  .option('-d, --desc [value]', '发布简介', tool.dateFormat(new Date(), 'yyyy年MM月dd日HH点mm分ss秒') + '提交上传')
  .option('-m, --mode [value]', '模式: preview|upload', 'preview')
  .option('--upload.log [value]', '上传日志路径')
  .option('--preview.format [value]', '二维码输出形式：terminal|base64|image', 'image')
  .option('--preview.qr [value]', '二维码存放路径', 'preview.png')
  .option('--preview.log [value]', '预览日志路径')
  .option('--preview.compileCondition [value]', '自定义编译条件')
  .option('--login.format [value]', '二维码输出形式：terminal|base64|image', 'terminal')
  .option('--login.qr [value]', '二维码存放路径')
  .option('--login.log [value]', '登录日志路径')
  .option('-d, --debug', 'debug mode');

program.parse(process.argv);

program.on('--help', () => {
  console.log('  Examples:');
  console.log('');
  console.log('    $ mini-deploy');
  console.log('');
});

const weChatCli = new WeChatCli(program);

const preview = async () => {
  let res = await weChatCli.preview();

  if (res && res.code === 0) {
    console.log(res.stdout);
    console.log('预览成功！请扫描二维码进入开发版！');
  } else {
    console.error('preview error!');
    console.error(res && res.stderr);
    process.exit();
  }
};

const upload = async () => {
  // 上传
  let res = await weChatCli.upload();

  if (res && res.code === 0) {
    console.log('上传成功！请到微信小程序后台设置体验版或提交审核！');
  } else {
    console.error('upload error!');
    console.error(res && res.stderr);
    process.exit();
  }
};

const start = async () => {
  if (tool.fsExistsSync(path.join(program.workspace, 'project.config.json'))) {
    const result = await weChatCli.start();

    if (result) {
      if (program.mode === 'preview') {
        await preview();
      } else if (program.mode === 'upload') {
        await upload();
      }
    } else {
      process.exit();
    }
  } else {
    console.error('workspace下未找到 project.config.json，请指定为小程序目录。');
    process.exit();
  }
};

start();
