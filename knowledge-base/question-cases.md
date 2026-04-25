# 问题知识库

本文档把当前项目里用户已经实际提出过的问题，按问题模式整理成知识库。

状态说明：

- `resolved`: 已有稳定方案
- `partial`: 已部分处理，但仍可能复发
- `open`: 还没有稳定方案

## 1. 文本定位与换行

### 1.1 文本框位置偏移

- 状态：`partial`
- 典型现象：
  - 文本整体偏到中间
  - 左右说明文跑到图片中间
  - 短文本被压到左侧
- 代表案例：
  - `4b00...pptx` 第 1 页封面标题
  - `4b00...pptx` 第 3 页左右说明文
  - `4b00...pptx` 第 20 页“再见”
- 关键标签：
  - `text-position`
  - `text-inset`
  - `single-line-heuristic`

### 1.2 文本不该单行时被强制单行

- 状态：`resolved`
- 典型现象：
  - 右侧窄文本框不换行
  - 说明文字被压成一行
  - 英文展示型标题被错误压成单行
- 代表案例：
  - `4b00...pptx` 第 3 页右侧说明文
  - `4b00...pptx` 第 4 页底部说明文字
  - `watercolor.pptx` 第 1 页大标题

### 1.3 英文文本完全不换行

- 状态：`resolved`
- 典型现象：
  - 一整句英文横向溢出
  - 看起来像浏览器把句子当成单词
- 代表案例：
  - `watercolor.pptx` 第 3 页目录说明文
- 根因方向：
  - `NBSP / 窄不换行空格`

## 2. 文本颜色

### 2.1 同页相同文案颜色不一致

- 状态：`resolved`
- 典型现象：
  - 左边文字颜色正确，中间和右边变黑
- 代表案例：
  - `watercolor.pptx` 第 3 页目录说明文

### 2.2 placeholder 正文掉成默认黑色

- 状态：`resolved`
- 典型现象：
  - 模板正文应是浅棕色，但浏览器显示成黑色
- 代表案例：
  - `watercolor.pptx` 第 10 页 `Mercury / Venus` 正文
- 关键标签：
  - `theme-color`
  - `placeholder`

## 3. 项目符号与列表

### 3.1 自定义 bullet 显示错误

- 状态：`resolved`
- 典型现象：
  - WPS 里是 `√`
  - 浏览器里显示成普通点、乱码或空白
- 代表案例：
  - `区级平台介绍.pptx` 第 2 页

### 3.2 空列表项残留多余点或多余一行

- 状态：`resolved`
- 典型现象：
  - 列表最后多出一个点
  - 最后一行只有一个 `√`
- 代表案例：
  - `区级平台介绍.pptx` 第 2 页

## 4. 箭头、连接线和辅助框

### 4.1 箭头不显示

- 状态：`partial`
- 典型现象：
  - 线在，箭头头尾不显示
  - 指向正确但 marker 丢失
- 代表案例：
  - `4b00...pptx` 第 7 页观察明暗

### 4.2 箭头长度、方向、位置错误

- 状态：`partial`
- 典型现象：
  - 箭头太短
  - 指向错位
  - 终点和目标不重合
- 代表案例：
  - `4b00...pptx` 第 3、4、7 页

### 4.3 辅助虚线框误显示

- 状态：`partial`
- 典型现象：
  - WPS 里不显示的辅助框，在浏览器里显示出来
  - 该显示虚线的地方反而显示成实线
- 代表案例：
  - `4b00...pptx` 第 4、5 页

## 5. Shape 边框、阴影与背景层

### 5.1 圆角边框只显示局部

- 状态：`resolved`
- 典型现象：
  - 本应完整的黄色圆角边框只显示左上角几段
- 代表案例：
  - `4b00...pptx` 第 10 页作画工具

### 5.2 shape 阴影影响文本布局

- 状态：`resolved`
- 典型现象：
  - 去掉 `box-shadow` 后文本立刻恢复正常
  - 文本像被挤到左边或只露一截
- 代表案例：
  - `4b00...pptx` 第 20 页“再见”

## 6. 图片与裁剪

### 6.1 缩略图显示成细条或错误区域

- 状态：`resolved`
- 典型现象：
  - 小图显示成蓝色细条
  - 没有按 PPT 裁剪结果显示
- 代表案例：
  - `区级平台介绍.pptx` 第 4 页右侧缩略图
- 关键标签：
  - `image-crop`
  - `srcRect`

## 7. 数学公式与媒体资源

### 7.1 公式图片不显示

- 状态：`resolved`
- 典型现象：
  - 页面里应该有公式
  - 浏览器里只剩裂图占位
- 代表案例：
  - `math_calculus_formulas.pptx` 第 1 页
- 根因方向：
  - 媒体扩展名和真实 MIME 不一致

## 8. 主题与模板兼容

### 8.1 主题解析依赖过强，可能触发 `a:theme` 空引用

- 状态：`open`
- 典型现象：
  - `Cannot read properties of null (reading 'a:theme')`
- 说明：
  - 这类问题已出现过，但还没有整理成稳定修复方案

## 9. 解析增强层拆分

### 9.1 单个 XML enhancer 文件继续膨胀会放大维护风险

- 状态：`partial`
- 典型现象：
  - `textBodyInsets.ts` 同时承担 text inset、placeholder、bullet、line marker、media MIME 修正
  - 新增 XML 补丁时容易把不相关逻辑耦合到同一文件
- 已覆盖基线：
  - `bullets.ts` 的 Wingdings `ü` -> `√` 兼容
  - `text-body.ts` 的 text inset EMU -> point 与 placeholder 注入
  - `line-markers.ts` 的 `a:headEnd / a:tailEnd` 元数据读取
  - `media-mime.ts` 的伪 PNG 真 SVG Blob 修正
  - `raw-enhancements.ts` 的 enhancer-owned raw element 字段写入边界
- 代表测试：
  - `src/adapters/pptxtojson/enhancers/bullets.test.ts`
  - `src/adapters/pptxtojson/enhancers/text-body.test.ts`
  - `src/adapters/pptxtojson/enhancers/line-markers.test.ts`
  - `src/adapters/pptxtojson/enhancers/media-mime.test.ts`
  - `src/adapters/pptxtojson/enhancers/raw-enhancements.test.ts`
- 关键标签：
  - `xml-enhancer`
  - `text-inset`
  - `placeholder`
  - `bullet`
  - `arrow-marker`
  - `media-mime`
  - `math-media`

## 10. Runtime Engine 拆分

### 9.1 集中式 Runtime 继续堆逻辑会放大回归风险

- 状态：`partial`
- 典型现象：
  - `createPresentationRuntime.ts` 同时负责 state、policy、tick、trigger、transition
  - 后续补 Timeline / Transition / Media 时容易互相影响
- 已覆盖基线：
  - `Session Store` 初始状态、slide state reset、`waitingTrigger` 同步
  - `Playback Policy` 自动翻页与 click trigger 的优先级
  - `Timeline Engine` click trigger 计数、自动动画序列、基础 visibility/opacity
  - `Transition Engine` transition start / progress / finish
  - `Media Engine` registry/cache/playback plan 与 Evaluator media frame
  - `Input Engine` keyboard / pointer / touch gesture 到 runtime command 的映射
  - `Runtime Facade` transition active 期间拒绝直接跳页 / 前后翻页，避免状态冻结
- 代表测试：
  - `src/runtime/createPresentationRuntime.test.ts`
  - `src/runtime/sessionStore.test.ts`
  - `src/runtime/input/inputEngine.test.ts`
  - `src/runtime/media/mediaEngine.test.ts`
  - `src/runtime/evaluatePresentationFrame.test.ts`
  - `src/runtime/timeline/timelineEngine.test.ts`
  - `src/runtime/transition/transitionEngine.test.ts`
- 关键标签：
  - `runtime`
  - `session-store`
  - `playback-policy`
  - `timeline-engine`
  - `transition-engine`
  - `media-engine`
  - `input-engine`
  - `keyboard-shortcuts`
  - `touch-swipe`
  - `media-sync`
  - `timing`
