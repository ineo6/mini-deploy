# 微信小程序发布助手（mini-deploy）

[![Dependencies][dependencyci-badge]][dependencyci]
[![version][version-badge]][package]
[![downloads][downloads-badge]][npm-stat]

[![PRs Welcome][prs-badge]][prs]

[![Watch on GitHub][github-watch-badge]][github-watch]
[![Star on GitHub][github-star-badge]][github-star]

微信小程序发布助手, 支持预览和上传。可以和`jenkins`结合使用，实现微信小程序自动化发布。

## Installation

```shell
// 全局安装
npm install -g mini-deploy

// 本地安装
npm install --save-dev mini-deploy
```

## Usage

`mini-deploy [args]`

#### `mode`

预览或者上传.

> preview 预览时会在`workspace`目录下生成二维码`preview.png`，在`jenkins`中可以读取图片在`job`结果中显示，大家可以自行扩展。

#### `workspace`

小程序项目地址，默认为命令执行目录，会检查`project.config.json`是否存在。

#### `version`

上传版本号，默认为`1.0.0`

#### `desc`

上传描述, 默认为'xxxx年x月x日 x点x分x秒 提交上传'


## 扩展

- [每日优鲜便利购微信小程序集成 Jenkins 生成二维码发版](https://testerhome.com/topics/14913#reply-115145)
- [微信小程序集成 Jenkins](https://segmentfault.com/a/1190000016247970)

[dependencyci-badge]: https://dependencyci.com/github/ineo6/mini-deploy/badge?style=flat-square
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
