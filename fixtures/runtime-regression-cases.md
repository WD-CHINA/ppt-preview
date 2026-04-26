# Runtime Regression Fixtures

本文档记录不依赖具体 PPTX 二进制的 Runtime 合成回归样本。它们用于先稳定播放状态机、Policy 和 Engine 拆分边界，再接入截图/真实 PPT fixture。

## 1. `basePresentation`：两页 + 点击触发 + 自动翻页

- 位置：`src/runtime/sessionStore.test.ts`
- 状态：`covered-by-test`
- 用途：验证 Runtime Engine 拆分后的基础行为不回退
- 覆盖能力：
  - `Session Store` 初始状态
  - slide-scoped state reset
  - `waitingTrigger` 与 `onClick` animation 同步
  - playbackRate 边界裁剪
  - `Playback Policy` 在 pending trigger 时阻止自动翻页
  - `Playback Policy` 在满足 `advanceAfterMs` 且无 pending trigger 时请求翻页
  - `Timeline Engine` 的 click trigger 计数、自动动画序列和基础 visibility/opacity 计算
  - `Timeline Engine` 的最小 `motionPath` 几何计算（`translateX / translateY / rotate / progress`）
  - `Transition Engine` 的 transition start / progress / finish 状态写入
  - Runtime / Evaluator 对转场元数据的归属语义：翻到下一页时，duration/type 应取 source slide，而不是 destination slide
  - `Media Engine` 的 registry、当前/前后页缓存窗口、远页 release、play/pause/mute/seek 计划
  - `Evaluator` 输出 slide-level media frames，给后续 MediaRenderer/DOM sync 留接口
  - `Evaluator` 把 `motionPath` 投影到 `EvaluatedElementFrame.bounds` 与 `animationGeometry`，给 line/connector 后续高保真渲染留稳定接口
  - `Input Engine` 的键盘快捷键、舞台点击、触摸横向滑动到 runtime command 的映射
  - `Runtime Facade` 在 transition active 期间拒绝直接跳页 / 前后翻页，避免 frame/state 分歧导致冻结
- 标签：
  - `runtime`
  - `session-store`
  - `playback-policy`
  - `timing`

## 维护原则

1. Runtime 合成 fixture 要保持小而稳定，只覆盖状态机事实，不混入渲染细节。
2. 真实 PPTX fixture 用于还原问题；合成 fixture 用于锁住 engine 行为边界。
3. 后续拆 `Timeline / Transition / Media / Input` 时，应优先增加同类合成 fixture，再接真实 PPT 回归。
