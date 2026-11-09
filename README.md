# Snake 贪吃蛇

一个使用原生 HTML、CSS 和 JavaScript 实现的经典贪吃蛇小游戏。

在线演示：<https://cccu-code.github.io/snake/>

## 功能

- 键盘方向键 / WASD 控制
- 手机端屏幕方向键与滑动手势控制
- 空格键暂停与继续
- 分数与本地最高分记录
- 移动速度随得分逐步提升
- 适配桌面端和移动端布局
- 纯静态实现，无需安装依赖

## 本地运行

直接打开 `index.html`，或在项目目录启动任意静态文件服务器：

```bash
python -m http.server 8000
```

然后访问 <http://localhost:8000>。

## GitHub Pages

项目已通过 GitHub Actions 自动部署到 GitHub Pages。每次推送到 `main` 分支都会自动发布：<https://cccu-code.github.io/snake/>。

## 项目结构

```text
.
├── index.html
├── styles.css
├── game.js
└── .github/workflows/deploy-pages.yml
```