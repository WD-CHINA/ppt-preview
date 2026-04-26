# Transition Visual Regression Cases

本文档记录 **真实 PPTX + 浏览器 runtime + DOM 样式** 的转场视觉回归样本。和 `runtime-regression-cases.md` 的合成状态机样本不同，这里只关心真实文件在固定 transition progress 下的中间态证据。

配套浏览器 harness：[`public/transition-regression-harness.js`](/Applications/work/ppt-preview/public/transition-regression-harness.js)

结构化基线：[`transition-regression-baseline.json`](./transition-regression-baseline.json)

## 使用方式

1. 启动 dev server：`pnpm dev --host 0.0.0.0`
2. 打开 `http://localhost:5173/`
3. 在浏览器 console 或 `browser_console` 中加载 harness：

```js
const harness = await import('/transition-regression-harness.js')
```

4. 运行指定样本：

```js
await harness.runTransitionRegressionSuite([
  { caseId: 'fade-default', fileName: '演示文稿1.pptx', sourceSlideIndex: 0, prepareMode: 'mutateState', tickMs: 400 },
  { caseId: 'push-up-real', fileName: '47e66b31f89d4b33b14c5010b92296c5.pptx', sourceSlideIndex: 1, prepareMode: 'goToSlide', tickMs: 600 },
  { caseId: 'wipe-right-real', fileName: 'wipe-directions-fixture.pptx', sourceSlideIndex: 0, prepareMode: 'goToSlide', tickMs: 400 },
  { caseId: 'wipe-left-real', fileName: 'wipe-directions-fixture.pptx', sourceSlideIndex: 1, prepareMode: 'mutateState', tickMs: 400 },
  { caseId: 'wipe-up-real', fileName: 'wipe-directions-fixture.pptx', sourceSlideIndex: 2, prepareMode: 'mutateState', tickMs: 400 },
  { caseId: 'wipe-down-real', fileName: 'wipe-directions-fixture.pptx', sourceSlideIndex: 3, prepareMode: 'mutateState', tickMs: 400 },
])
```

5. 如果只是校验当前实现有没有回退，优先对照 [`transition-regression-baseline.json`](./transition-regression-baseline.json) 里的 `frame/viewports` 结构化结果；等后续接入自动截图后，再叠加像素级对照。

## 维护原则

- 同时记录三层事实：
  1. `frame.transitionType / transitionDirection / transitionProgress`
  2. previous/current viewport 数量
  3. `clipPath / transform / opacity` 的中间态样式
- 如果某个真实样本需要特殊准备方式，要在 case 里明确写 `prepareMode`：
  - `goToSlide`：先走 runtime 公共 API，再进入目标转场
  - `mutateState`：直接重置 runtime.state，适合快速稳定卡住中间态
- 文档里的预期值允许有少量 progress 浮动，但方向、viewport 数量和样式趋势必须稳定。

## 已确认样本

### 1. `push-default-real`
- 文件：`演示文稿1.pptx`
- 路径：`slide1 -> slide2`
- 预期：
  - `frame.transitionType = "push"`
  - previous/current 共 2 个 viewport
  - previous 向左退出，current 自右侧进入
- 已记录样本值：
  - `transitionProgress ≈ 0.583`
  - previous：`transform = matrix(1, 0, 0, 1, -746.72, 0)`
  - current：`transform = matrix(1, 0, 0, 1, 533.28, 0)`
- WPS 对照备注：
  - 录屏早期帧比旧版 `fade` 语义更接近目标页 `push`

### 2. `wipe-story-path-real`
- 文件：`演示文稿1.pptx`
- 路径：`slide2 -> slide3`
- 预期：
  - `frame.transitionType = "wipe"`
  - previous/current 共 2 个 viewport
  - current 通过 `clip-path` 从左向右揭示
- 已记录样本值：
  - `transitionProgress ≈ 0.646`
  - current：`clipPath = inset(0px 35% 0px 0px)`

### 3. `fade-key-moment-real`
- 文件：`演示文稿1.pptx`
- 路径：`slide3 -> slide4`
- 预期：
  - `frame.transitionType = "fade"`
  - previous/current 共 2 个 viewport
  - previous：opacity 下降，transform 为轻微缩放
  - current：opacity 上升，transform 为轻微 `translateY(...)`
- 已记录样本值：
  - `transitionProgress ≈ 0.562`
  - previous：`opacity = 0.437625`，`transform = matrix(0.988752, 0, 0, 0.988752, 0, 0)`
  - current：`opacity = 0.562375`，`transform = matrix(1, 0, 0, 1, 0, 7.87725)`
- WPS 对照备注：
  - 目标页 `fade` 与真实放映更接近，旧版按 source 页渲染成 `wipe` 已被判定为错误

### 4. `push-up-real`
- 文件：`47e66b31f89d4b33b14c5010b92296c5.pptx`
- 路径：`slide2 -> slide3`
- 准备方式：`goToSlide`
- 预期：
  - `frame.transitionType = "push"`
  - `frame.transitionDirection = "u"`
  - previous/current 共 2 个 viewport
  - previous 向下退出，current 从上方进入
- 已记录样本值：
  - `transitionProgress ≈ 0.528`
  - previous：`transform = matrix(1, 0, 0, 1, 0, 380.04)`
  - current：`transform = matrix(1, 0, 0, 1, 0, -339.96)`

### 5. `wipe-right-real`
- 文件：`wipe-directions-fixture.pptx`
- 路径：`slide1 -> slide2`
- 准备方式：`goToSlide`
- 预期：
  - `frame.transitionType = "wipe"`
  - `frame.transitionDirection = "r"`
  - previous/current 共 2 个 viewport
  - current 通过 `clip-path` 从左向右揭示
- 已记录样本值：
  - `transitionProgress ≈ 0.563`
  - current：`clipPath = inset(0px 44% 0px 0px)`

### 6. `wipe-left-real`
- 文件：`wipe-directions-fixture.pptx`
- 路径：`slide2 -> slide3`
- 预期：
  - `frame.transitionDirection = "l"`
  - current：`clipPath = inset(0px 0px 0px 42%)`

### 7. `wipe-up-real`
- 文件：`wipe-directions-fixture.pptx`
- 路径：`slide3 -> slide4`
- 预期：
  - `frame.transitionDirection = "u"`
  - current：`clipPath = inset(33% 0px 0px 0px)` 或同趋势值

### 8. `wipe-down-real`
- 文件：`wipe-directions-fixture.pptx`
- 路径：`slide4 -> slide5`
- 预期：
  - `frame.transitionDirection = "d"`
  - current：`clipPath = inset(0px 0px 35% 0px)` 或同趋势值

### 9. `random-default-open-case`
- 文件：`4b00a85c247c47bdaeb01aeec562c90f.pptx`
- 路径：多页 `slideN -> slideN+1`
- 预期：
  - `frame.transitionType = "random"`
  - `frame.transitionProgress` 需要按 XML 里的 `p14:dur="1500"` 计算，而不是退回 `spd` 映射
  - renderer 当前不尝试猜具体随机视觉效果，只把它收敛为中性 crossfade fallback
- 已确认样本值：
  - 所有页间 transition 都是 `<p:random/>`
  - `p14:dur="1500"`
- 备注：
  - 这是一个“parser 已读到随机标记，但视觉语义未知”的 open case；适合作为后续随机转场语义研究的 baseline

- 还没有把这些 case 接入自动截图比对
- 还没有和 Office / WPS 中间态做像素级对照
- `cover / uncover / split / zoom` 还没有对应真实视觉回归样本
