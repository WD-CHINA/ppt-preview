# 知识库

这个目录用于沉淀两类内容：

- 问题知识库：把用户实际提过、反复出现的问题按模式整理
- 方案知识库：把已经验证有效的修复方案和落点整理出来

当前文件：

- [question-cases.md](/Applications/work/ppt-preview/knowledge-base/question-cases.md)
- [fix-playbook.md](/Applications/work/ppt-preview/knowledge-base/fix-playbook.md)

解析相关问题补充约定：

- `src/vendor/pptxtojson/`：上游 parser 源码与底层 OOXML 解析
- `src/adapters/pptxtojson/`：项目专属增强、适配、normalize
- 记录修复方案时，要尽量说明问题属于 vendor parser、adapter enhancer、normalize，还是 renderer/runtime

建议维护方式：

1. 用户反馈进入 `question-cases.md`
2. 找到稳定根因并上线修复后，补到 `fix-playbook.md`
3. 若某类问题还未解决，在 `question-cases.md` 标状态为 `open`
4. 若某类问题已经反复修复多次，优先转为 fixture 和自动回归
