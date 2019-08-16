const path = require('path');
const os = require('os');
const shellJs = require('shelljs');

const tool = require('./tool');

class WeChatCli {
  constructor(options) {
    this.wxpath = '';

    this.isDebug = options.debug;

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
    this.loginConfig.qr = this.formatQr(options['login.qr'], options['login.format']);
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
          exePath = exePath.split('  ')
            .find(path => path.indexOf('.exe') != -1);
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

  shell(path, args, opt, verbase) {
    const cmd = `${path} ${args.join(' ')}`;
    if (verbase) {
      console.log(cmd);
    }

    return new Promise((resolve, reject) => {
      const result = shellJs.exec(cmd);

      if (result.code !== 0) {
        if (verbase) {
          console.log('Failed: ' + result.code);
        }
        reject(result);
      } else {
        resolve(result);
      }
    });
  }

  async executeCli(args, verbose = false) {
    try {
      return await this.shell(this.wxpath, args, null, verbose || this.isDebug);
    } catch (e) {
      // console.log("executeCli error", e.stderr);

      if (e.stderr.indexOf('"错误 需要重新登录') > 0) {
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

      return result;
    } catch (e) {
      if (e.message === 'reLogin') {
        const reLoginResult = await this.reLogin();

        if (reLoginResult) {
          return await this.preview();
        }
      }
    }
  }

  async reLogin() {
    // todo 能否自动获取二维码
    console.error('微信登录已过期，请重新扫码登录！');

    const loginResult = await this.login();

    if (loginResult && loginResult.code === 0 && loginResult.stdout.indexOf('login success') >= 0) {
      // console.log(loginResult.stdout)
      return true;
    } else {
      console.log(loginResult.stderr);
      return false;
    }
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

      return result;
    } catch (e) {
      const reLoginResult = await this.reLogin();

      if (reLoginResult) {
        return await this.upload();
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

    return await this.executeCli(args, true);
  }
}

module.exports = WeChatCli;
