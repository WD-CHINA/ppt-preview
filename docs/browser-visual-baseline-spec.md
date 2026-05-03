# Browser Visual Baseline Spec

本文档把“浏览器视觉基线”定义成项目内的正式规范，供开发者、测试脚本和后续模型会话统一使用。

## 1. 定义

浏览器视觉基线指的是：

- 在当前 `ppt-preview` runtime 中
- 使用真实 fixture PPTX
- 在浏览器实际渲染后的某个固定状态
- 保存下来的结构化信息和截图证据

它不是 Office / WPS 官方基线，也不是 parser 原始输出，而是“当前浏览器播放器可接受的稳定输出”。

## 2. 目标

浏览器视觉基线用于解决三类问题：

1. 逻辑测试通过，但最终画面仍不对。
2. 修复一个 deck 后，另一个 deck 的视觉结果悄悄退化。
3. 新模型进入项目时，不知道“当前什么样算正确”。

## 3. 规范对象

当前项目中的浏览器视觉基线至少覆盖以下对象：

- `transition` 冻结态
- 真实 fixture 的关键问题页
- 后续新增的高风险视觉问题页

优先级：

1. 真实用户反馈页
2. 容易回归的 renderer 问题
3. 无法只靠纯函数测试说明正确性的视觉问题

## 4. 基线文件组成

一个完整的浏览器视觉基线由三部分组成：

1. 入口说明
   - 存放位置：`fixtures/visual-baselines/README.md`
   - 作用：告诉后续模型如何找到和理解基线

2. registry / manifest
   - 全量 public PPT registry：
     `fixtures/visual-baselines/public-ppt-fixture-registry.json`
   - 专项 manifest（例如 transition / page-level visual）：
     `fixtures/visual-baselines/transition-visual-baselines.json`
     `fixtures/visual-baselines/public-ppt-page-visual-baselines.json`
   - 作用：
     - registry 负责告诉模型“`public/` 下有哪些 PPT、每份当前有什么覆盖”
     - 专项 manifest 负责告诉模型“某一类视觉基线的具体资产在哪里”
   - 必备字段：
     - `generatedAt`
     - `baseUrl`
     - `waitMs`
     - `captures[]`
     - 每个 case 至少包含 `caseId / url / fileName / bytes`

3. PNG 产物
   - 存放位置：`fixtures/visual-baselines/*.png`
   - 作用：提供肉眼可验证的浏览器冻结帧证据

如果是非转场视觉问题，允许新增新的 manifest，但也必须放在 `fixtures/visual-baselines/` 下，并在 README 中登记。

## 5. 模型加载约定

后续模型或新会话在处理视觉问题时，默认按以下顺序加载：

1. 先读 [fixtures/visual-baselines/README.md](/Applications/work/ppt-preview/fixtures/visual-baselines/README.md)
2. 再读全量 registry：
   [fixtures/visual-baselines/public-ppt-fixture-registry.json](/Applications/work/ppt-preview/fixtures/visual-baselines/public-ppt-fixture-registry.json)
3. 如果该问题属于某个专项基线，再读对应 manifest，例如：
   [fixtures/visual-baselines/transition-visual-baselines.json](/Applications/work/ppt-preview/fixtures/visual-baselines/transition-visual-baselines.json)
   或 [fixtures/visual-baselines/public-ppt-page-visual-baselines.json](/Applications/work/ppt-preview/fixtures/visual-baselines/public-ppt-page-visual-baselines.json)
4. 再按 registry / manifest 中的 `fileName / caseId / url` 找到 PNG 和对应 fixture
5. 最后结合 `fixtures/catalog.md`、`knowledge-base/question-cases.md` 判断这份基线要说明什么问题

禁止把单张截图当成孤立证据使用；截图必须能追溯到 manifest 和 fixture。

## 6. 新增基线的最小要求

新增一组浏览器视觉基线时，至少要满足：

1. 有明确的真实 fixture 或稳定的调试入口
2. 有可复现 URL
3. 有 PNG
4. 有 manifest 条目
5. 有 README 说明
6. 有至少一个自动校验入口

当前固定校验命令：

```bash
pnpm test:visual-baselines
```

当前固定生成入口：

```bash
pnpm generate:public-ppt-registry
```

## 7. 与其他基线的关系

浏览器视觉基线不是单独存在的，必须和下面几类证据配套看：

- fixture 索引：`fixtures/catalog.md`
- 结构化行为基线：例如 `fixtures/transition-regression-baseline.json`
- 真实回归测试：例如 `src/components/presentation/*FixtureRegression.test.ts`
- 修复知识库：`knowledge-base/question-cases.md` 和 `knowledge-base/fix-playbook.md`

推荐理解顺序：

`fixture -> regression test -> structured baseline -> browser PNG`

## 8. 维护原则

1. 不删除旧基线，除非对应 case 已废弃且 README/manifest 已同步清理。
2. 更新截图时必须同步更新 manifest。
3. 新增视觉问题页时，优先复用已有 fixture，不轻易增加重复 deck。
4. 如果当前基线只是“项目内可接受 first-pass”，必须在 README 或文档里明确写出，不伪装成 Office/WPS 官方对照。
5. 如果模型修改了视觉实现，但没有更新相应基线和说明，视为工作未完成。
