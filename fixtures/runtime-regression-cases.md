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
  - Runtime / Evaluator 对转场元数据的归属语义：翻到下一页时，duration/type 应取 destination slide；这一点已通过 `演示文稿1.pptx` 的 WPS 对照复验（`slide1 -> slide2` 更像 `push`，`slide3 -> slide4` 更像 `fade`）
  - `PresentationStage` 只在 `frame.isTransitioning` 时渲染 previous viewport，避免非转场态残留上一页 DOM
  - `transitionViewportModel` 在转场中与转场结束后都显式输出 `transition: none`，避免 CSS 自己再补一次插值造成重影/拖尾
  - `transitionViewportModel` 对 `wipe` 已锁住 `dir="r/l/u/d"` 四向 clip-path regression，避免 direction 元数据只在 parser 存在、但 Vue renderer 继续按单向 reveal 渲染
  - `transitionViewportModel` 对 `random` 采用中性 crossfade fallback（current/previous 仅做 opacity 互补，不再额外加 fade 的 translate/scale），避免把未知随机转场伪装成具体方向/位移效果
  - `Media Engine` 的 registry、当前/前后页缓存窗口、远页 release、play/pause/mute/seek 计划
  - `runtime.dispose()` / `disposeMediaEngine()` 在 teardown 时 revoke object URL，避免旧模型切换后资源悬挂
  - `Evaluator` 输出 slide-level media frames，给后续 MediaRenderer/DOM sync 留接口
  - `Media Engine` 在 transition active 期间同时保留 source / destination slide 的媒体 active 状态，避免可见 video/audio 在转场时冻结
  - `ElementRenderer` 把 `mediaPlayback` 同步到实际 `HTMLMediaElement`，让 video/audio 可跟随 runtime 的 play/pause/mute/seek 指令
  - `MediaRenderer` 已把图片/视频/音频/math 的媒体渲染边界抽出来，减少 `ElementRenderer` 的复杂度
  - `ElementRenderer` / `MediaRenderer` 的媒体错误兜底：video/audio 优先用 poster；没有 poster 时回退 placeholder，避免 media source 失效后整块空白
  - `Evaluator` 把 `motionPath` 投影到 `EvaluatedElementFrame.bounds` 与 `animationGeometry`，给 line/connector 后续高保真渲染留稳定接口
  - `Input Engine` 的键盘快捷键、舞台点击、触摸横向滑动到 runtime command 的映射
  - `Runtime Facade` 在 transition active 期间拒绝直接跳页 / 前后翻页，避免 frame/state 分歧导致冻结
- 标签：
  - `runtime`
  - `session-store`
  - `playback-policy`
  - `timing`

## 2. `slide-animation-build-list`：timing root + bldLst 最小对象动画

- 位置：`src/adapters/pptxtojson/enhancers/slide-animations.test.ts`
- 状态：`covered-by-test`
- 用途：验证 slide XML 中 `p:timing` / `p:bldLst` 的最小对象动画提取不会回退
- 覆盖能力：
  - `slide-animations.ts` 对 `clickEffect / withEffect / afterEffect` 的提取
  - `slide-animations.ts` 对 `p:bldLst` / `bldP` paragraph build 的最小提取
  - `targetParagraphIndex` 从 XML 到 raw animation 再到 normalized animation 的传播
  - `evaluatePresentationFrame` 把 paragraph build 可见性投影到 `renderedHtml`
  - “parser 没读出来”和“样本里确实没有”的区分

- 标签：
  - `timing`
  - `animation`
  - `paragraph-build`
  - `object-animation`

## 维护原则

1. Runtime 合成 fixture 要保持小而稳定，只覆盖状态机事实，不混入渲染细节。
2. 真实 PPTX fixture 用于还原问题；合成 fixture 用于锁住 engine 行为边界。
3. 后续拆 `Timeline / Transition / Media / Input` 时，应优先增加同类合成 fixture，再接真实 PPT 回归。
