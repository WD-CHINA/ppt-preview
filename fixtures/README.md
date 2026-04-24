# Fixtures

这个目录用于收敛当前项目里高频复现问题的 PPTX 样本，以及每个样本对应的页面清单和问题标签。

目标：

- 固定高频回归样本
- 给 XML enhancer / normalize / renderer 提供稳定输入
- 为后续截图回归和 fixture 测试提供索引

当前样本目录中的源文件仍然放在 [public/](/Applications/work/ppt-preview/public)，这里先维护“索引和标签”，不复制二进制文件。

## 使用约定

每个 fixture 至少记录以下信息：

- 文件名
- 用途
- 重点页面
- 问题标签
- 当前状态

问题标签建议复用以下集合：

- `text-inset`
- `text-wrap`
- `text-color`
- `text-position`
- `vertical-text`
- `bullet`
- `arrow-marker`
- `connector`
- `helper-frame`
- `shape-border`
- `shape-shadow`
- `image-crop`
- `theme-color`
- `math-media`
- `table`
- `chart`
- `diagram`
- `transition`
- `timing`
- `media-sync`

## 维护原则

1. 新增 fixture 时，优先写页面用途和问题标签，不要求一次写全所有页面。
2. 同一个问题如果已经在旧 fixture 中稳定复现，不重复新增相似样本。
3. 修复完成后不要删除 fixture，只更新状态为 `resolved` 或 `covered-by-test`。
4. 如果问题只在 WPS / PowerPoint 对比中出现，应在页面说明里明确标注“对照依赖”。
