# Snake 贪吃蛇

一个使用原生 HTML、CSS 和 JavaScript 实现的经典贪吃蛇小游戏。

## 功能

- 键盘方向键 / WASD 控制
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

项目已配置 GitHub Actions 自动部署。推送到 `main` 分支后，在仓库的 **Settings → Pages** 中将 Source 设为 **GitHub Actions**，即可自动发布。

## 项目结构

```text
.
├── index.html
├── styles.css
├── game.js
└── .github/workflows/deploy-pages.yml
```