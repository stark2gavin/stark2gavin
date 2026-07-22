# 暧昧期浪漫心动页

这是一个无需框架、无需联网资源、可直接部署到 GitHub Pages 的完整长页面。新版以“夜色花园 + 私人信件”为统一视觉主题，用克制的心动和默契表达暧昧期的特别，不要求确认关系或立即回应。

## 完整流程

1. 私人邀请与开信按钮。
2. 夜色花园中的流光粒子爱心开场。
3. 四段“慢慢心动”的时间线。
4. 三种具体而克制的特别。
5. 可亲手点亮、最终连线的三颗默契星星。
6. 一封带压花纸张质感的夜色小信。
7. 一次轻松的见面邀请与两种被尊重的回应。

页面针对手机优先设计，同时支持桌面宽屏。离开当前动画章节后，画布会自动暂停，减少手机耗电和发热。

## 文件结构

```text
romantic-confession-complete/
├─ index.html
├─ assets/
│  ├─ css/styles.css
│  ├─ images/
│  │  ├─ moonlit-garden.webp
│  │  └─ pressed-letter.webp
│  └─ js/
│     ├─ app.js
│     └─ heart-scene.js
├─ screenshots/
├─ .gitignore
└─ .nojekyll
```

## 直接预览

双击 `index.html` 即可运行全部功能。页面不依赖外部字体、音乐或第三方脚本，所需图片均已包含在项目中。

## 个性化修改

主要文字都在 `index.html`，用编辑器搜索下列内容即可定位：

- `陈大美女`：替换称呼。
- `开始注意你`：修改四段心动时间线。
- `一个人变得特别`：修改三个特别的原因。
- `陈大美女：`：修改完整夜色小信。
- `下次见面，要不要`：修改最后的见面邀请。

两种回应后的文字位于 `assets/js/app.js`，搜索：

- `那我开始期待下一次见面了`
- `好，那就顺其自然`

颜色、字号和手机布局位于 `assets/css/styles.css`；粒子数量和心形动画位于 `assets/js/heart-scene.js`。

## 发布到 GitHub Pages

将此目录中的全部文件上传到仓库根目录，然后在仓库的 `Settings > Pages` 中选择：

- Source：`Deploy from a branch`
- Branch：`main`
- Folder：`/ (root)`

发布后访问：

```text
https://<GitHub用户名>.github.io/<仓库名>/
```

## 验证记录

- 手机视口：`390 × 844`
- 桌面视口：`1440 × 900`
- 已验证开信、滚动揭晓、三颗星点亮、两种最终回应。
- 测试中无脚本错误，手机页面无横向溢出。
- `screenshots/qa-redesign-report.json` 保存了自动检查结果。
