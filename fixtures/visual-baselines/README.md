# Browser Visual Baselines

这个目录存放浏览器视觉基线资产，包括真实转场 case 的冻结帧 PNG、非转场关键问题页截图，以及对应的采集清单。

项目规范说明见：

- [docs/browser-visual-baseline-spec.md](/Applications/work/ppt-preview/docs/browser-visual-baseline-spec.md)

对后续模型/新会话的强约定：

1. 先读本 README。
2. 再读 `public-ppt-fixture-registry.json`，先确认目标 PPT 当前属于哪类覆盖状态。
3. 如果属于 transition，再读 `transition-visual-baselines.json`。
4. 再按 registry / manifest 找具体 PNG。
5. 不把单张 PNG 当成孤立证据使用。

当前文件：

- `public-ppt-fixture-registry.json`
- `public-ppt-page-visual-baselines.json`
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

它是当前转场浏览器视觉基线的 canonical manifest。

`public-ppt-fixture-registry.json` 是当前 `public/` 目录全部 PPT 样本的 canonical registry，记录：

- 文件名
- fixture URL
- slide count
- 当前状态
- 关键问题页
- 当前已有的回归/视觉覆盖类型

`public-ppt-page-visual-baselines.json` 是当前非转场页面视觉基线 manifest，已覆盖：

- `0501.pptx` 第 `2 / 5 / 7` 页
- `AI.Tech.Agency.Infographics.by.Slidesgo.pptx` 第 `1 / 4 / 5 / 24 / 26 / 31` 页
- `4b00a85c247c47bdaeb01aeec562c90f.pptx` 第 `1 / 4 / 7 / 20` 页
- `区级平台介绍.pptx` 第 `2 / 4` 页
- `watercolor.pptx` 第 `1 / 3 / 10` 页

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

如果新增或重排了 `public/` 下的 PPT 样本索引，可重建全量 registry：

```bash
pnpm generate:public-ppt-registry
```

如果已经采好了页面级 PNG，需要重建页面 manifest：

```bash
pnpm generate:public-ppt-page-baselines
```

前提：

- dev server 已启动
- 当前 `tab` 已绑定到 in-app browser
- 页面支持 `?transitionCase=<caseId>` 自动冻结到中间态

## 说明

- 当前截图是“浏览器 runtime 冻结态”的第一版视觉基线，不是 Office / WPS 官方对照图。
- 建议始终配合 `fixtures/transition-regression-baseline.json` 一起看：结构化 baseline 负责行为稳定，PNG 负责肉眼校验。
- 如果后续新增非转场视觉基线，也必须放在 `fixtures/visual-baselines/` 下，并提供对应 manifest + README 登记。
