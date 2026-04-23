# 基于 pptxtojson 的商业级 PPT 播放架构方案

## 1. 文档目标

本文档用于定义一套面向 Web 端商业级 PPT 播放场景的技术方案，核心前提是：

- 使用 `pptxtojson` 作为浏览器端 PPTX 解析器
- 将 `pptxtojson` 的输出转换为播放器可消费的标准化模型
- 在标准化模型之上构建 Runtime、Timeline、Transition、Media、Policy、Input、Evaluator 等播放层能力
- 为当前 `ppt-preview` 项目提供可落地的架构演进方向

本文档既包含对 `pptxtojson` 本身的能力说明，也包含它与商业级播放系统结合后的架构设计。

---

## 2. pptxtojson 项目概述

`pptxtojson` 是一个运行在浏览器中的 JavaScript 库，用于将 `.pptx` 文件转换为更易理解、更适合业务消费的 JSON 数据。

它的核心特点有：

- 直接运行在浏览器端
- 输出的是语义化、可读性更强的 JSON，而不是 XML 的机械翻译结果
- 适合做 PPT 导入、内容抽取、结构分析、预览输入层
- 覆盖较多 PPT 对象类型与页面元数据

它最适合承担的是：

- PPT 文件内容抽取
- 页面结构解析
- 媒体信息提取
- 备注、主题、切换等元数据提取

它不直接解决的是：

- 商业级播放 Runtime
- 高精度对象动画时间轴
- 页面切换编排
- 演示模式交互
- 媒体生命周期调度

一句话概括：

> `pptxtojson` 负责把 PPT 文件读懂，自研播放 Runtime 负责把 PPT 以产品级方式播放出来。

---

## 3. pptxtojson 的安装与使用方式

### 安装

```bash
npm install pptxtojson
```

### 浏览器端典型用法

```ts
import { parse } from 'pptxtojson'

const json = await parse(arrayBuffer, {
  imageMode: 'both',
  videoMode: 'blob',
  audioMode: 'blob',
})
```

### 推荐资源模式

对商业级播放场景，推荐优先考虑：

- `imageMode: 'blob'` 或 `both`
- `videoMode: 'blob'`
- `audioMode: 'blob'`

原因：

- `base64` 在大文件场景内存占用更高
- `blob` 更适合预加载、释放、缓存窗口控制
- 更容易与播放器的 Media Engine 结合

---

## 4. pptxtojson 的输出能力梳理

根据该项目公开说明，`pptxtojson` 可输出的核心结构包括：

### 4.1 文档级信息
- `slides`
- `themeColors`
- `usedFonts`
- `size.width`
- `size.height`

### 4.2 页面级信息
- `note`
- `fill`
- `transition`
- `elements`
- `layoutElements`

### 4.3 元素级信息
支持的对象类型覆盖较广，包括：

- `text`
- `image`
- `shape`
- `table`
- `chart`
- `video`
- `audio`
- `math`
- `diagram`
- `group`

### 4.4 样式与资源信息
它还会输出较多适合上层消费的属性，例如：

- 文本内容与富文本 HTML 风格内容
- 边框、阴影、填充、渐变、图案
- 旋转、翻转、垂直对齐
- 超链接
- 图片资源引用
- 视频 / 音频 Blob
- 数学公式图片 / LaTeX 信息
- Smart 图文本清单与子元素集合

这说明 `pptxtojson` 在“内容抽取广度”上是比较强的。

---

## 5. pptxtojson 的适用边界

## 5.1 它适合做什么

### 1. 作为浏览器端解析器
直接读取 `.pptx` 并输出 JSON，适合当前 Web 项目的技术方向。

### 2. 作为导入能力基础设施
适合导入 PPT、抽取内容、建立编辑器或预览器的数据源。

### 3. 作为播放器的上游解析层
它可以为播放 Runtime 提供页面、元素、媒体、备注、切换等原始数据。

### 4. 作为对照解析器
如果项目已有自研 parser，`pptxtojson` 也可作为结构对照和回归参考。

---

## 5.2 它不适合直接承担什么

### 1. 不适合作为商业级播放引擎
它输出的是数据，不是播放时钟、播放状态机、页面切换调度器。

### 2. 不适合作为高精度动画 Runtime
对象动画、触发器、页内时间轴、页面切换编排都需要单独实现。

### 3. 不保证高保真渲染本身成立
即使数据提取较完整，Web 渲染要接近 PowerPoint / WPS 仍然需要额外的渲染与布局策略。

---

## 6. 与当前 ppt-preview 项目的关系

当前 `ppt-preview` 项目更偏向：

- 自研解析
- 自研统一模型
- 自研渲染
- 自研播放控制

而 `pptxtojson` 更偏向：

- 浏览器端通用解析器
- 面向业务层的结构化 JSON 输出

所以二者的合理关系不是互斥，而是上下游：

```text
PPTX File
   │
   ▼
pptxtojson
   │
   ▼
Normalized Presentation Model
   │
   ▼
ppt-preview Runtime / Renderer / Presentation UI
```

也就是说：

- `pptxtojson` 替代或补强当前项目的解析输入层
- `ppt-preview` 继续演进播放 Runtime 与渲染层

---

## 7. 结合后的总体架构

```text
PPTX File
   │
   ▼
pptxtojson Parser
   │
   ▼
Raw Parsed JSON
   │
   ▼
Normalized Presentation Model
   │
   ▼
Presentation Runtime
├─ Session Store
├─ Timeline Engine
├─ Transition Engine
├─ Media Engine
├─ Playback Policy Engine
└─ Input Engine
   │
   ▼
Render Evaluation Layer
   │
   ▼
Vue Render Components
   │
   ▼
Fullscreen Presentation / Presenter Mode / Embedded Preview
```

---

## 8. 标准化模型层设计

由于 `pptxtojson` 的输出面向通用消费，而商业级播放器对状态、播放元数据、媒体生命周期的要求更高，因此必须增加一层标准化模型。

### 目标

```text
pptxtojson JSON -> NormalizedPresentation -> Runtime
```

### 职责

- 统一坐标与尺寸语义
- 统一元素类型与属性命名
- 统一背景、备注、切换、媒体信息
- 为 Runtime 增补默认值、索引、可降级标记
- 为后续 Evaluator 和 Renderer 提供稳定输入

### 需要统一的内容

#### 1. 页面模型
- 尺寸
- 背景
- 备注
- 页面切换
- 自动播放策略

#### 2. 元素模型
- 文本
- 图片
- 形状
- 表格
- 图表
- 视频
- 音频
- 公式
- Smart 图
- 组合元素

#### 3. 媒体模型
- Blob URL / 引用路径
- mimeType
- poster
- preload 策略
- cleanup 策略

#### 4. 播放元数据
- 页面切换信息
- 点击推进策略
- 自动翻页策略
- 演讲者备注
- 后续对象动画描述符

### 推荐接口示意

```ts
interface NormalizedPresentation {
  width: number
  height: number
  theme: NormalizedTheme
  usedFonts: string[]
  slides: NormalizedSlide[]
}

interface NormalizedSlide {
  id: string
  name: string
  note?: string
  background: SlideBackground
  transition?: SlideTransitionMeta
  autoplay?: {
    advanceOnClick: boolean
    advanceAfterMs?: number
  }
  elements: NormalizedElement[]
  animations: NormalizedAnimation[]
}
```

---

## 9. Runtime：商业级播放内核

Runtime 是系统核心，不应由 Vue 页面组件直接承担。

它的职责是：

- 管理整个演示会话
- 驱动页内动画与页面切换
- 管理媒体生命周期
- 接收用户输入
- 输出统一的渲染帧

### 设计目标

- UI 不持有播放真相
- 任意时刻都可计算页面状态
- 支持暂停、恢复、seek、跳页、点击触发、自动播放
- 能承载全屏演示与演讲者模式

---

## 10. Runtime 模块拆分

```text
Presentation Runtime Facade
├─ Session Store
├─ Timeline Engine
├─ Transition Engine
├─ Media Engine
├─ Playback Policy Engine
└─ Input Engine
```

### 10.1 Session Store
职责：

- 维护全局会话状态
- 作为唯一真状态源

推荐状态：

```ts
interface PresentationRuntimeState {
  sessionStatus: 'idle' | 'ready' | 'playing' | 'paused' | 'transitioning' | 'ended' | 'error'
  activeSlideIndex: number
  timelinePositionMs: number
  currentTriggerIndex: number
  waitingTrigger: boolean
  transitionProgress: number
  isFullscreen: boolean
  isMuted: boolean
  presenterMode: boolean
  loopEnabled: boolean
  playbackRate: number
}
```

### 10.2 Timeline Engine
职责：

- 管理单页对象动画
- 处理 `onClick / withPrevious / afterPrevious`
- 支持 `play / pause / seek / nextTrigger / reset`

说明：

`pptxtojson` 本身主要解决解析，不等于已经提供完整动画 Runtime。
如果目标是商业级播放，需要在标准化层或二次解析层补齐动画描述符，再由 Timeline Engine 统一驱动。

### 10.3 Transition Engine
职责：

- 管理 slide 进入与离开
- 驱动 `fade / push / cover / uncover / zoom` 等转场
- 输出过渡期双页可视状态

### 10.4 Media Engine
职责：

- 管理 `video / audio`
- 预加载当前页与下一页媒体
- 控制播放、暂停、seek、mute、释放
- 处理失败回退与缓存窗口

### 10.5 Playback Policy Engine
职责：

- 决定下一步播放行为
- 判断当前页是否等待点击、是否时间轴已结束、是否满足自动翻页条件

### 10.6 Input Engine
职责：

- 键盘
- 鼠标点击
- 触摸手势
- 全屏控制
- 演讲者模式快捷控制

---

## 11. Render Evaluation Layer

Evaluator 层负责把 Runtime 当前状态转换成真正可渲染的一帧。

### 输入
- 当前 slide
- 当前时间轴位置
- 当前 trigger index
- 当前 transition progress
- 当前媒体状态

### 输出
- 每个元素当前的 `visible / opacity / transform / clipPath / style`
- 媒体当前的可播放状态
- 当前页面背景与覆盖层状态

### 推荐接口

```ts
interface EvaluatedSlideFrame {
  slideId: string
  elements: EvaluatedElementFrame[]
  media: EvaluatedMediaFrame[]
}

interface EvaluatedElementFrame {
  id: string
  visible: boolean
  opacity: number
  transform: string
  clipPath?: string
  style: Record<string, string>
}
```

---

## 12. Vue 渲染层建议

Vue 组件只应消费 Runtime 和 Evaluator 输出，不应持有核心播放逻辑。

### 推荐组件结构

```text
components/presentation/
├─ PresentationShell.vue
├─ PresentationStage.vue
├─ TransitionStage.vue
├─ SlideViewport.vue
├─ ElementRenderer.vue
├─ MediaRenderer.vue
├─ PlaybackToolbar.vue
├─ TimelineScrubber.vue
├─ PresenterPanel.vue
└─ overlays/
   ├─ FullscreenOverlay.vue
   ├─ LaserPointerLayer.vue
   └─ AnnotationLayer.vue
```

### 组件职责

- `PresentationShell.vue`：页面级组合容器
- `PresentationStage.vue`：主舞台
- `TransitionStage.vue`：双页切换渲染
- `SlideViewport.vue`：单页渲染壳
- `ElementRenderer.vue`：按元素类型分发
- `MediaRenderer.vue`：视频/音频专用渲染
- `PlaybackToolbar.vue`：控件层
- `PresenterPanel.vue`：演讲者模式 UI

---

## 13. 数据流设计

```text
PPTX File
   │
   ▼
pptxtojson.parse()
   │
   ▼
Raw Parsed JSON
   │
   ▼
normalizePresentation(raw)
   │
   ▼
NormalizedPresentation
   │
   ▼
createPresentationRuntime(model)
   │
   ├─ build timeline
   ├─ register media
   ├─ build transition descriptors
   └─ init session state
   │
   ▼
requestAnimationFrame loop
   │
   ├─ tick runtime clock
   ├─ update timeline engine
   ├─ update transition engine
   ├─ sync media engine
   ├─ apply playback policy
   └─ evaluate frame
   │
   ▼
Vue components render current frame
```

---

## 14. 性能策略

商业级播放系统必须优先保证稳定性和流畅性。

### 14.1 时钟统一
- 统一使用 `requestAnimationFrame`
- 避免多个 `setInterval` 分别控制动画和翻页

### 14.2 缓存窗口
建议缓存：

- 上一页
- 当前页
- 下一页

以减少切页重建和白屏。

### 14.3 媒体资源策略
- 图片优先 `blob`
- 视频/音频优先 `blob`
- 使用注册表统一管理释放
- 对超大媒体使用惰性预加载

### 14.4 大文件策略
- 解析后建立 slide runtime cache
- 关键页做索引预计算
- 必要时引入 Worker 解析

---

## 15. 目录结构建议

```text
src/
├─ adapters/
│  └─ pptxtojson/
│     ├─ parseWithPptxtojson.ts
│     ├─ normalizePresentation.ts
│     └─ types.ts
│
├─ runtime/
│  ├─ session/
│  ├─ timeline/
│  ├─ transition/
│  ├─ media/
│  ├─ policy/
│  ├─ input/
│  └─ evaluator/
│
├─ composables/
│  └─ presentation/
│     ├─ usePresentationRuntime.ts
│     ├─ usePresentationCommands.ts
│     └─ usePresentationHotkeys.ts
│
├─ components/
│  └─ presentation/
│     ├─ PresentationShell.vue
│     ├─ PresentationStage.vue
│     ├─ TransitionStage.vue
│     ├─ SlideViewport.vue
│     ├─ ElementRenderer.vue
│     ├─ MediaRenderer.vue
│     ├─ PlaybackToolbar.vue
│     ├─ TimelineScrubber.vue
│     └─ PresenterPanel.vue
│
└─ types/
   ├─ ppt.ts
   └─ presentation-runtime.ts
```

---

## 16. 接入策略建议

### 阶段 1：替换解析输入层
- 引入 `pptxtojson`
- 新增 `parseWithPptxtojson.ts`
- 新增 `normalizePresentation.ts`
- 暂时保持现有渲染器与播放器逻辑可继续运行

### 阶段 2：重构 Runtime
- 抽离当前播放状态到 `usePresentationRuntime`
- 建立 `Session Store`
- 引入 `Timeline Engine`、`Transition Engine`
- 建立 `Media Engine`

### 阶段 3：重构渲染层
- 将组件中的逐帧动画计算迁入 `Evaluator`
- 让 Vue 组件只消费 `EvaluatedSlideFrame`

### 阶段 4：补齐商业化能力
- 全屏播放
- 演讲者模式
- 备注面板
- 键盘/鼠标/触摸控制
- 循环播放 / kiosk 模式
- 更强的媒体与性能策略

---

## 17. 风险与注意事项

### 17.1 解析广度不等于播放完成度
`pptxtojson` 能提取更多对象，不代表这些对象已经具备商业级渲染和播放能力。

### 17.2 富文本与高保真布局仍然复杂
即使拿到了更高层的 JSON，Web 端渲染仍需处理排版、字体、缩放、文本自适应等问题。

### 17.3 媒体内存管理必须前置
如果大量资源长期保留为 base64，会对大文件播放造成明显压力。

### 17.4 动画描述可能仍需二次建模
如果目标是商业级对象动画，可能需要在 `pptxtojson` 结果之上再建立动画描述符层。

---

## 18. 最终结论

最推荐的落地方式是：

1. 使用 `pptxtojson` 作为浏览器端 PPTX 解析器
2. 增加 `Normalized Presentation Model` 作为解析层与播放层之间的桥梁
3. 自研 `Runtime + Timeline + Transition + Media + Policy + Evaluator + Vue UI` 的播放体系
4. 将当前 `ppt-preview` 从“预览器”逐步演进为“商业级演示播放系统”

一句话总结：

> `pptxtojson` 负责把 PPT 文件结构化，自研播放架构负责把这些结构以商业级方式稳定、流畅、可控地播放出来。
