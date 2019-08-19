# 微信小程序发布助手（mini-deploy）

[![version][version-badge]][package]
[![downloads][downloads-badge]][npm-stat]

[![PRs Welcome][prs-badge]][prs]

[![Watch on GitHub][github-watch-badge]][github-watch]
[![Star on GitHub][github-star-badge]][github-star]

微信小程序发布助手, 支持预览和上传。可以和`jenkins`结合使用，实现微信小程序自动化发布。

## 功能特性

- 自动重登机制，并且登录之后会恢复上次任务
- 覆盖大部分微信小程序命令行功能

## Installation

```shell
// 全局安装
npm install -g mini-deploy

// 本地安装
npm install --save-dev mini-deploy
```

## Usage

```sh
Usage: mini-deploy [--options ...]

Options:
  -V, --version                       output the version number
  -w, --workspace [value]             微信小程序工作区目录 (default: "/Users/neo/WorkSpace/deploy-mini")
  -ver, --ver [value]                 发布版本号 (default: "1.0.0")
  -d, --desc [value]                  发布简介 (default: "2019年08月19日13点07分21秒提交上传")
  -m, --mode [value]                  模式: preview|upload (default: "preview")
  --upload.log [value]                上传日志路径
  --preview.format [value]            二维码输出形式：terminal|base64|image (default: "image")
  --preview.qr [value]                二维码存放路径 (default: "preview.png")
  --preview.log [value]               预览日志路径
  --preview.compileCondition [value]  自定义编译条件
  --login.format [value]              二维码输出形式：terminal|base64|image (default: "terminal")
  --login.qr [value]                  二维码存放路径
  --login.log [value]                 登录日志路径
  -d, --debug                         debug mode
  -h, --help                          output usage information
```

#### `mode`

预览（`preview`）或者上传（`upload`）。

> preview 预览时会在`workspace`目录下生成二维码`preview.png`，在`jenkins`中可以读取图片在`job`结果中显示，大家可以自行扩展。

#### `workspace`

小程序项目地址，默认会取命令执行目录，同时会检查`project.config.json`是否存在。

#### `ver`

上传版本号，默认为`1.0.0`

#### `desc`

上传描述, 默认为'xxxx年x月x日 x点x分x秒 提交上传'

### `upload.log`

指定后，会将本次上传的额外信息以 json 格式输出至指定路径，如代码包大小、分包大小信息。

需要注意的是日志文件需要提前创建。

### `preview.format`

预览二维码的格式，format 可选值包括 terminal（命令行输出）, base64, image。

### `preview.qr`

二维码输出位置，相对于项目。

### `preview.log`

定后，会将本次预览的额外信息以 json 格式输出至指定路径，如代码包大小、分包大小信息。

### `preview.compileCondition`

指定自定义编译条件，json 条件可指定两个字段，pathName 表示打开的页面，不填表示首页，query 表示页面参数。

示例如下：

```json
{"pathName":"pages/index/index","query":"x=1&y=2"}
```

### `login.format`

同`preview.format`

默认为`terminal`，会把二维码输出到流中，在`jenkins`中通过查看控制台输出，可以直接扫描登录。

如果有其他需求，可以自定义输出到文件。

### `login.qr`

同 `preview.qr`

### `login.log`

输出登录结果到指定文件

## 扩展

- [每日优鲜便利购微信小程序集成 Jenkins 生成二维码发版](https://testerhome.com/topics/14913#reply-115145)
- [微信小程序集成 Jenkins](https://segmentfault.com/a/1190000016247970)

## 更新日志

[changelog](./changelog.md)

[dependencyci]: https://dependencyci.com/github/ineo6/mini-deploy
[version-badge]: https://img.shields.io/npm/v/mini-deploy.svg?style=flat-square
[package]: https://www.npmjs.com/package/mini-deploy
[downloads-badge]: https://img.shields.io/npm/dm/mini-deploy.svg?style=flat-square
[npm-stat]: http://npm-stat.com/charts.html?package=mini-deploy&from=2018-10-31
[license-badge]: https://img.shields.io/npm/l/mini-deploy.svg?style=flat-square
[license]: https://github.com/ineo6/mini-deploy/blob/master/LICENSE
[prs-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[prs]: http://makeapullrequest.com
[coc-badge]: htts://img.shields.io/badge/code%20of-conduct-ff69b4.svg?style=flat-square
[github-watch-badge]: https://img.shields.io/github/watchers/ineo6/mini-deploy.svg?style=social
[github-watch]: https://github.com/ineo6/mini-deploy/watchers
[github-star-badge]: https://img.shields.io/github/stars/ineo6/mini-deploy.svg?style=social
[github-star]: https://github.com/ineo6/mini-deploy/stargazers
