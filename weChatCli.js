const path = require('path');
const os = require('os');

const tool = require('./tool');

const errorCode = {
  success: 0,
  failed: 1,
  waitingLogin: 2,
};

function createError(code, msg) {
  return {
    errorCode: code,
    message: msg || '',
  };
}

class WeChatCli {
  constructor(options) {
    this.wxpath = '';

    this.isDebug = options.debug;
    this.resume = options.resume;

    this.workspace = options.workspace;
    this.version = options.ver;
    this.uploadDesc = options.desc;

    this.uploadLog = options['upload.log'] || '';
    this.loginConfig = {
      qr: [],
      loginLog: options['login.log'] || '',
    };

    this.previewConfig = {
      qr: [],
      previewLog: options['preview.log'] || '',
      compileCondition: options['preview.compileCondition'] || '',
    };

    this.previewConfig.qr = this.formatQr(options['preview.qr'], options['preview.format']);
    this.previewConfig.format = options['preview.format'];
    this.previewConfig.originQr = options['preview.qr'];

    this.loginConfig.qr = this.formatQr(options['login.qr'], options['login.format']);
    this.loginConfig.format = options['login.format'];
    this.loginConfig.originQr = options['login.qr'];
  }

  formatQr(qr, format) {
    let result = [];
    if (qr && format) {
      if (['base64', 'image'].indexOf(format) >= 0) {
        result = [format, path.join(this.workspace, qr)];
      } else if (format === 'terminal') {
        result = [path.join(this.workspace, qr)];
      }
    } else if (format && !qr) {
      result = [format];
    }

    return result;
  }

  async start() {
    let wxPaths = [];
    switch (os.platform()) {
      case 'darwin':
        const result = await tool.executeCommand('defaults read com.tencent.wechat.devtools LastRunAppBundlePath');
        if (result.stdout !== '') {
          const stdout = result.stdout.replace(/\n/g, '');
          wxPaths = [path.join(stdout, '/Contents/Resources/app.nw/bin/cli')];
        }
        // defaults read
        wxPaths.push('/Applications/wechatwebdevtools.app/Contents/Resources/app.nw/bin/cli');
        break;
      case 'win32':
        // defaults read
        wxPaths = ['C:\\Program Files (x86)\\Tencent\\微信web开发者工具\\cli.bat', 'C:\\Program Files\\Tencent\\微信web开发者工具\\cli.bat'];
        const iconv = require('iconv-lite');
        const encoding = 'cp936';
        const binaryEncoding = 'binary';
        const result2 = await tool.executeCommand('REG QUERY "HKLM\\SOFTWARE\\Wow6432Node\\Tencent\\微信web开发者工具"', {
          encoding: binaryEncoding,
        });
        const stdout = iconv.decode(new Buffer(result2.stdout, binaryEncoding), encoding);
        if (stdout !== '') {
          const stdoutArr = stdout.split('\r\n');
          let exePath = stdoutArr.find(path => path.indexOf('.exe') != -1);
          exePath = exePath.split('  ').find(path => path.indexOf('.exe') != -1);
          exePath = path.join(path.dirname(exePath), 'cli.bat');
          wxPaths.unshift(exePath);
        }
        break;
    }
    this.wxpath = wxPaths.find(wxpath => tool.fsExistsSync(wxpath));
    if (this.wxpath) {
      try {
        const result = await this.executeCli(['-o']);

        if (result && result.code === 0) {
          console.log('devtool启动成功！');

          return true;
        } else {
          console.error('open error!');
          return false;
        }
      } catch (e) {
        console.error(e);
        return false;
      }
    } else {
      console.error('请安装最新微信开发者工具');
      return false;
    }
  }

  async executeCli(args) {
    try {
      return await tool.shell(this.wxpath, args, null, this.isDebug, this.resume);
    } catch (e) {
      // console.log('executeCli error', e);

      if (e.stderr.indexOf('需要重新登录') > 0) {
        throw new Error('reLogin');
      }

      return e;
    }
  }

  async preview() {
    try {
      const args = [
        '-p',
        this.workspace,
        '--preview-qr-output',
        this.previewConfig.qr.join('@'),
        '--preview-info-output',
        this.previewConfig.previewLog,
      ];

      if (this.previewConfig.compileCondition) {
        args.push('--compile-condition');
        args.push(this.previewConfig.compileCondition);
      }

      const result = await this.executeCli(args);

      const msg = createError();

      if (result && result.code === 0) {
        msg.errorCode = errorCode.success;
        msg.message = '预览成功！请扫描二维码进入开发版！';
      } else {
        msg.errorCode = errorCode.failed;
        msg.message = result.stderr;
      }

      return msg;
    } catch (e) {
      const msg = createError(errorCode.failed);

      if (e.message === 'reLogin') {
        const reLoginResult = await this.reLogin();

        if (reLoginResult === 1) {
          // 继续上传
          return await this.preview();
        } else if (reLoginResult === 2) {
          msg.errorCode = errorCode.waitingLogin;
        }

        return msg;
      }
    }
  }

  async reLogin() {
    // todo 能否自动获取二维码
    console.error('微信登录已过期，请重新扫码登录！');

    // jenkins中利用该信息显示Build详情
    if (this.loginConfig.format === 'image') {
      const linkUrl = path.join('./ws', this.loginConfig.originQr);

      // eslint-disable-next-line
      console.log(
        '[mini-deploy] <img src="' + linkUrl + '" alt="登录码" width="200" height="200" /><a href="' + linkUrl + '" target="_blank">登录码</a>'
      );
    } else if (this.loginConfig.format === 'terminal') {
      console.log('[mini-deploy] 进入Build详情扫码登录微信开发工具');
    }

    const loginResult = await this.login();

    // 0:失败，1：登录成功，2：等待登录
    let flag = 0;

    if (loginResult) {
      if (loginResult.code === 0 && loginResult.stdout.indexOf('login success') >= 0) {
        flag = 1;
      } else if (loginResult.signal === 'SIGTERM') {
        console.log(loginResult.stdout);
        flag = 2;
      }
    } else {
      console.log(loginResult.stderr);
    }

    return flag;
  }

  async upload() {
    try {
      const result = await this.executeCli([
        '-u',
        [this.version, this.workspace].join('@'),
        '--upload-desc',
        this.uploadDesc.replace(/\s+/, ''),
        '--upload-info-output',
        this.uploadLog,
      ]);

      const msg = createError();

      if (result && result.code === 0) {
        msg.errorCode = errorCode.success;
        msg.message = '上传成功！请到微信小程序后台设置体验版或提交审核！';
      } else {
        msg.errorCode = errorCode.failed;
        msg.message = result.stderr;
      }

      return msg;
    } catch (e) {
      const msg = createError(errorCode.failed);

      if (e.message === 'reLogin') {
        const reLoginResult = await this.reLogin();

        if (reLoginResult === 1) {
          // 继续上传
          return await this.upload();
        } else if (reLoginResult === 2) {
          msg.errorCode = errorCode.waitingLogin;
        }

        return msg;
      }
    }
  }

  async login() {
    const args = ['-l'];

    if (this.loginConfig.qr.length === 2) {
      args.push('--login-qr-output');
      args.push(this.loginConfig.qr.join('@'));
    } else if (this.loginConfig.qr.length === 1 && this.loginConfig.qr[0] !== 'terminal') {
      args.push('--login-qr-output');
      args.push(this.loginConfig.qr.join('@'));
    }

    if (this.loginConfig.loginLog) {
      args.push('--login-result-output');
      args.push(this.loginConfig.loginLog);
    }

    return await this.executeCli(args);
  }
}

WeChatCli.errorCode = errorCode;

module.exports = WeChatCli;
