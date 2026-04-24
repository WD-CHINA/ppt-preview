# 修复方案知识库

本文档记录已经在当前项目中验证有效的修复方案，以及对应代码落点。

## 1. 文本布局类

### 1.1 用 `padding` 还原 `a:bodyPr` inset

适用问题：

- 文本 left/top 偏移
- 文本框内容和 WPS 不对齐

实践方案：

- 从 slide XML 读取 `a:bodyPr`
- 将 `left/right/top/bottom` inset 注入 raw element
- 在渲染层作为 `padding` 参与布局，而不是只改 `margin`

代码落点：

- [src/adapters/pptxtojson/textBodyInsets.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/textBodyInsets.ts)
- [src/components/presentation/ElementRenderer.vue](/Applications/work/ppt-preview/src/components/presentation/ElementRenderer.vue)

### 1.2 单行文本不要只按字数判断

适用问题：

- 窄文本框不该单行却被强制单行
- 标题应换行却被压成一行

实践方案：

- 单行模式同时参考：
  - 文本实际宽度
  - 元素宽度
  - 字号
  - 对齐方式
  - 是否是句子型文本
- 居中对齐、大字号、带标点的句子型文本，不进入单行压缩

代码落点：

- [src/components/presentation/ElementRenderer.vue](/Applications/work/ppt-preview/src/components/presentation/ElementRenderer.vue)

### 1.3 标准化不换行空格

适用问题：

- 英文句子完全不换行

实践方案：

- 在 HTML 清洗阶段把 `NBSP / 窄不换行空格` 转成普通空格

代码落点：

- [src/components/presentation/ElementRenderer.vue](/Applications/work/ppt-preview/src/components/presentation/ElementRenderer.vue)

## 2. 文本颜色类

### 2.1 同页重复文本颜色统一

适用问题：

- 左边颜色正确，中间和右边变黑

实践方案：

- 在同一页内，按“文案 + 字号 + 版式”构造签名
- 如果同组中有元素拿到了正确颜色，其余掉成默认黑色，则回填同组颜色

代码落点：

- [src/adapters/pptxtojson/normalizePresentation.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/normalizePresentation.ts)

### 2.2 placeholder 主题色兜底

适用问题：

- 模板正文应继承主题色，但掉成默认黑色

实践方案：

- 从 enhancer 中读取 `placeholderType / placeholderIndex`
- 在 normalize 阶段，对 `body / subTitle` 占位符回填主题浅色文本色

代码落点：

- [src/adapters/pptxtojson/textBodyInsets.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/textBodyInsets.ts)
- [src/adapters/pptxtojson/normalizePresentation.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/normalizePresentation.ts)

## 3. bullet 与列表类

### 3.1 读取自定义 bullet 字符与字体

适用问题：

- `√` 显示成点或乱码

实践方案：

- 从 XML 读取 `a:buChar` 和 `a:buFont`
- 对 `Wingdings + ü` 做兼容映射，按 `√` 渲染

代码落点：

- [src/adapters/pptxtojson/textBodyInsets.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/textBodyInsets.ts)

### 3.2 清理只有 bullet marker 的空列表项

适用问题：

- 最后一行只剩一个点或一个 `√`

实践方案：

- 清理空列表项时，先移除 `.ppt-bullet-marker` 再判断内容是否为空

代码落点：

- [src/components/presentation/ElementRenderer.vue](/Applications/work/ppt-preview/src/components/presentation/ElementRenderer.vue)

## 4. 箭头、线条与 shape 类

### 4.1 从 XML 读取 `headEnd / tailEnd`

适用问题：

- 线条没有箭头

实践方案：

- 解析 line XML 上的 `a:headEnd / a:tailEnd`
- 注入 shape meta
- 用 SVG marker 渲染头尾箭头

代码落点：

- [src/adapters/pptxtojson/textBodyInsets.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/textBodyInsets.ts)
- [src/components/presentation/ElementRenderer.vue](/Applications/work/ppt-preview/src/components/presentation/ElementRenderer.vue)

### 4.2 `rect / roundRect` 不要误走 SVG path

适用问题：

- 圆角边框只显示局部
- 盒子类 shape 边框异常

实践方案：

- `rect / roundRect` 优先走 CSS 盒子渲染
- 只有真正 path shape 才走 SVG

代码落点：

- [src/components/presentation/ElementRenderer.vue](/Applications/work/ppt-preview/src/components/presentation/ElementRenderer.vue)

### 4.3 把 shape 视觉层和文本层拆开

适用问题：

- `box-shadow` 干扰文本布局
- 背景、边框、阴影和文字相互影响

实践方案：

- 外层 `.element` 只负责定位
- 新增绝对定位的 `.element-shape` 作为纯背景层
- 文本单独渲染在 shape 层之上

代码落点：

- [src/components/presentation/ElementRenderer.vue](/Applications/work/ppt-preview/src/components/presentation/ElementRenderer.vue)

## 5. 图片与裁剪类

### 5.1 读取并应用 `srcRect`

适用问题：

- 缩略图显示成细条
- 图片显示区域和 PPT 裁剪结果不一致

实践方案：

- normalize 阶段提取图片 crop
- 渲染层根据 crop 调整图片尺寸和偏移

代码落点：

- [src/adapters/pptxtojson/normalizePresentation.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/normalizePresentation.ts)
- [src/types/presentation.ts](/Applications/work/ppt-preview/src/types/presentation.ts)
- [src/components/presentation/ElementRenderer.vue](/Applications/work/ppt-preview/src/components/presentation/ElementRenderer.vue)

## 6. 数学公式与媒体 MIME 类

### 6.1 修正“扩展名和真实内容不一致”的媒体 MIME

适用问题：

- 公式图片在浏览器里裂图
- 看起来是 PNG，实际内容是 SVG

实践方案：

- 读取 PPTX zip 中的原始媒体内容
- 检测文件头是否是 SVG/XML
- 如果是，重新创建 `image/svg+xml` 的 Blob

代码落点：

- [src/adapters/pptxtojson/textBodyInsets.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/textBodyInsets.ts)

### 6.2 `math` 元素兜底读取 `picBlob / picRef`

适用问题：

- `math` 类型存在，但没有可用媒体源

实践方案：

- normalize 时优先从 `blob / picBlob / src / ref / picRef` 兜底取媒体

代码落点：

- [src/adapters/pptxtojson/types.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/types.ts)
- [src/adapters/pptxtojson/normalizePresentation.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/normalizePresentation.ts)
