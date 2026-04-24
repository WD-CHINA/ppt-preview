# Fixture Catalog

本文档记录当前项目中的高频问题 PPT 样本、页面清单和问题标签。

状态说明：

- `active`: 当前仍在用于复现或回归
- `partial`: 已有部分修复，但仍有残留问题
- `backlog`: 已收录，但暂未进入当前修复优先级

## 1. `4b00a85c247c47bdaeb01aeec562c90f.pptx`

- 文件位置：[public/4b00a85c247c47bdaeb01aeec562c90f.pptx](/Applications/work/ppt-preview/public/4b00a85c247c47bdaeb01aeec562c90f.pptx)
- 状态：`active`
- 用途：当前最核心的高保真回归样本，覆盖文本、箭头、辅助框、单行/多行、shape 阴影与边框等问题

重点页面：

- 第 1 页：封面页，标题定位、顶部小标签、多边形定位  
  标签：`text-position`, `shape-position`
- 第 3 页：学知识，左右文本布局、文本换行、图片左右说明文、箭头指向  
  标签：`text-inset`, `text-wrap`, `text-position`, `arrow-marker`
- 第 4 页：观察组成，辅助虚线框、标注线、底部说明文字换行  
  标签：`helper-frame`, `text-wrap`, `connector`, `arrow-marker`
- 第 5 页：观察造型，虚线/实线辅助框显示错误  
  标签：`helper-frame`, `shape-border`
- 第 7 页：观察明暗，箭头缺失、箭头长度和方向错误  
  标签：`arrow-marker`, `connector`
- 第 10 页：作画工具，圆角黄色边框缺失或只显示局部  
  标签：`shape-border`, `shape-path`
- 第 20 页：再见，shape 阴影与文本布局相互干扰  
  标签：`shape-shadow`, `text-position`

## 2. `区级平台介绍.pptx`

- 文件位置：[public/区级平台介绍.pptx](/Applications/work/ppt-preview/public/%E5%8C%BA%E7%BA%A7%E5%B9%B3%E5%8F%B0%E4%BB%8B%E7%BB%8D.pptx)
- 状态：`active`
- 用途：bullet、标题单行、裁剪缩略图、小图显示异常的主回归样本

重点页面：

- 第 2 页：区级概览，标题不应换行，自定义 bullet 应为 `√`，空列表项不应残留  
  标签：`text-wrap`, `bullet`
- 第 4 页：学校信息，右侧缩略图是裁剪图，不应显示成细条  
  标签：`image-crop`, `thumbnail`

## 3. `watercolor.pptx`

- 文件位置：[public/watercolor.pptx](/Applications/work/ppt-preview/public/watercolor.pptx)
- 状态：`active`
- 用途：英文模板中的空白字符、主题色、占位符颜色、英文大标题换行

重点页面：

- 第 1 页：大标题 `MINIMALIST AESTHETIC SLIDESHOW` 换行  
  标签：`text-wrap`, `single-line-heuristic`
- 第 3 页：目录页三列正文换行、颜色一致性  
  标签：`text-wrap`, `text-color`, `theme-color`
- 第 10 页：两列正文颜色应继承模板浅棕主题色  
  标签：`text-color`, `theme-color`, `placeholder`

## 4. `math_calculus_formulas.pptx`

- 文件位置：[public/math_calculus_formulas.pptx](/Applications/work/ppt-preview/public/math_calculus_formulas.pptx)
- 状态：`active`
- 用途：公式图片资源、伪 PNG 真 SVG 的媒体兼容样本

重点页面：

- 第 1 页：两张公式图实际是 SVG 内容，但资源扩展名是 `.png`  
  标签：`math-media`, `media-mime`, `image-fallback`

## 5. `AI.Tech.Agency.Infographics.by.Slidesgo.pptx`

- 文件位置：[public/AI.Tech.Agency.Infographics.by.Slidesgo.pptx](/Applications/work/ppt-preview/public/AI.Tech.Agency.Infographics.by.Slidesgo.pptx)
- 状态：`backlog`
- 用途：大体量模板，压测 group、connector、arrow、table、复杂 text inset

关注点：

- group 坐标体系
- connector / arrow 大量分布
- table 渲染
- 复杂文本盒模型

标签：

- `group`
- `arrow-marker`
- `connector`
- `table`
- `text-inset`

## 6. `AI Beatify Slides Example.pptx`

- 文件位置：[public/AI Beatify Slides Example.pptx](/Applications/work/ppt-preview/public/AI%20Beatify%20Slides%20Example.pptx)
- 状态：`backlog`
- 用途：模板型回归样本，覆盖 bullet / table / 标题布局

标签：

- `bullet`
- `table`
- `text-wrap`

## 7. `83f822650ce0499c835780f673faed2b.pptx`

- 文件位置：[public/83f822650ce0499c835780f673faed2b.pptx](/Applications/work/ppt-preview/public/83f822650ce0499c835780f673faed2b.pptx)
- 状态：`backlog`
- 用途：表格和项目符号样本

标签：

- `table`
- `bullet`

## 8. `47e66b31f89d4b33b14c5010b92296c5.pptx`

- 文件位置：[public/47e66b31f89d4b33b14c5010b92296c5.pptx](/Applications/work/ppt-preview/public/47e66b31f89d4b33b14c5010b92296c5.pptx)
- 状态：`backlog`
- 用途：媒体与 timing 样本

标签：

- `video`
- `audio`
- `timing`
- `transition`
- `media-sync`

## 9. `math_probability_statistics_formulas.pptx`

- 文件位置：[public/math_probability_statistics_formulas.pptx](/Applications/work/ppt-preview/public/math_probability_statistics_formulas.pptx)
- 状态：`backlog`
- 用途：数学公式资源回归样本

标签：

- `math-media`
- `formula-layout`

## 10. `math_linear_algebra_formulas.pptx`

- 文件位置：[public/math_linear_algebra_formulas.pptx](/Applications/work/ppt-preview/public/math_linear_algebra_formulas.pptx)
- 状态：`backlog`
- 用途：数学公式资源回归样本

标签：

- `math-media`
- `formula-layout`

## 11. `f.pptx`

- 文件位置：[public/f.pptx](/Applications/work/ppt-preview/public/f.pptx)
- 状态：`partial`
- 用途：通用临时样本，目前未整理详细页面问题

标签：

- `unclassified`
