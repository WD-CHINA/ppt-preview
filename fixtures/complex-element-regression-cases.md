# Complex Element Regression Cases

本页记录 `chart / diagram` 的当前回归样本。

## 1. 现状

- 当前 `public/` 里的历史真实 deck 经扫描后，没有现成页命中 `chart` 或 `diagram` 元素。
- 因此当前先补一份最小 targeted fixture，用来锁定 parser -> normalize -> renderer 主链路。

## 2. `chart-diagram-fixture.pptx`

- 文件位置：[public/chart-diagram-fixture.pptx](/Applications/work/ppt-preview/public/chart-diagram-fixture.pptx)
- 生成脚本：[fixtures/generate-complex-element-fixture.mjs](/Applications/work/ppt-preview/fixtures/generate-complex-element-fixture.mjs)
- 用途：`chart` 首批语义 renderer、`diagram` 首批结构 renderer 回归
- 用途：`bar / pie / scatter / line / area chart` 与 `diagram` first-pass renderer 回归

### Page 1

- 元素：clustered bar chart
- 关键点：
  - chart title `Revenue`
  - legend `Series 1 / Series 2`
  - category axis title `Quarter`
  - value axis title `Amount`
  - `schema.categories = Q1 / Q2`
  - renderer 当前应输出 4 根 bar、2 条 axis，并保留 `Q1 / Q2` 类目标签

### Page 2

- 元素：hierarchy SmartArt / diagram
- 关键点：
  - layout `hierarchy1`
  - text list `Root / Child A / Child B`
  - drawing target `Root Shape`
  - renderer 当前应输出 3 个 hierarchy 节点与 2 条 parent-child elbow 连线，而不是只显示类型占位框或摘要 badge
  - 横向位置应由子树中心决定，不再按每层节点数量机械均分

### Page 3

- 元素：pie chart
- 关键点：
  - chart title `Share`
  - categories `A / B`
  - renderer 当前应输出 2 个 pie slice，并保留 slice label

### Page 4

- 元素：scatter chart
- 关键点：
  - chart title `Series XY`
  - points `(1, 10)` / `(2, 20)`
  - renderer 当前应输出 2 个 scatter point，并保留基础 x/y tick

### Page 5

- 元素：line chart
- 关键点：
  - chart title `Trend`
  - categories `Jan / Feb / Mar`
  - renderer 当前应输出 2 条折线、系列点位与基础 x/y tick

### Page 6

- 元素：area chart
- 关键点：
  - chart title `Coverage`
  - categories `Q1 / Q2`
  - renderer 当前应输出带填充的 area path，而不是退回摘要卡片

### Page 7

- 元素：cycle SmartArt / diagram
- 关键点：
  - layout `cycle1`
  - text list `Plan / Build / Launch`
  - renderer 当前应输出环形节点排布与曲线路径，而不是继续沿用 hierarchy 的纵向树形布局
