# Transition Visual Baselines

这个目录存放真实转场 case 的浏览器冻结帧 PNG，以及对应的采集清单。

当前文件：

- `push-default-real-browser.png`
- `push-up-real-browser.png`
- `wipe-right-real-browser.png`
- `wipe-left-real-browser.png`
- `wipe-up-real-browser.png`
- `wipe-down-real-browser.png`
- `cover-right-real-browser.png`
- `uncover-left-real-browser.png`
- `zoom-default-real-browser.png`
- `split-vert-out-real-browser.png`
- `transition-visual-baselines.json`

`transition-visual-baselines.json` 记录最近一次批量采集的时间、baseUrl、waitMs 和每张图对应的 `caseId / url / bytes`。

## 采集方式

推荐在 Codex in-app browser 的 `node_repl` 会话里执行：

```js
const { captureTransitionVisualBaselines } = await import(
  `${nodeRepl.cwd}/fixtures/visual-baselines/captureTransitionVisualBaselines.mjs`
)

await captureTransitionVisualBaselines({ tab })
```

采集完成后，可在本地校验 manifest 与 PNG 集合是否一致：

```bash
pnpm test:visual-baselines
```

前提：

- dev server 已启动
- 当前 `tab` 已绑定到 in-app browser
- 页面支持 `?transitionCase=<caseId>` 自动冻结到中间态

## 说明

- 当前截图是“浏览器 runtime 冻结态”的第一版视觉基线，不是 Office / WPS 官方对照图。
- 建议始终配合 `fixtures/transition-regression-baseline.json` 一起看：结构化 baseline 负责行为稳定，PNG 负责肉眼校验。
