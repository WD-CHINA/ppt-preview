export const ignoredPublicPptFiles = [
  {
    fileName: '.~AI.Tech.Agency.Infographics.by.Slidesgo.pptx',
    reason: 'WPS / Office 生成的临时 owner 文件，不作为可用 fixture 或视觉基线输入。',
  },
]

export const publicPptFixtureMetadata = [
  {
    fileName: '0501.pptx',
    state: 'targeted-fixture',
    purpose: '真实课件样本，覆盖 paragraph margin、深色模板正文颜色、click timing 与 paragraph build。',
    tags: ['text', 'paragraph-margin', 'html-sanitizer', 'timing', 'paragraph-build', 'real-fixture'],
    focusPages: [
      { page: 2, summary: 'click timing + charRg paragraph build + 真实 spid target。' },
      { page: 5, summary: '异常 paragraph margin 把正文顶出文本框。' },
      { page: 7, summary: '深色模板正文黑字需要提升到白字。' },
    ],
    coverage: {
      browserVisual: 'page-visual-manifest-and-regression',
      regressionTests: [
        'src/components/presentation/p0501FixtureRegression.test.ts',
        'src/components/presentation/textHtmlSanitizer.test.ts',
      ],
      manifestRefs: [
        'fixtures/visual-baselines/public-ppt-page-visual-baselines.json#p0501-slide-2-build-layout',
        'fixtures/visual-baselines/public-ppt-page-visual-baselines.json#p0501-slide-5-outline-list',
        'fixtures/visual-baselines/public-ppt-page-visual-baselines.json#p0501-slide-7-dark-body-copy',
      ],
    },
  },
  {
    fileName: '47e66b31f89d4b33b14c5010b92296c5.pptx',
    state: 'partial',
    purpose: '真实 push direction + 最小 timing / media 样本。',
    tags: ['transition', 'timing', 'media-sync', 'push-direction'],
    focusPages: [
      { page: 2, summary: 'push dir="u" 垂直推进。' },
      { page: 6, summary: '重复验证 push dir="u"。' },
      { page: 7, summary: '重复验证 push dir="u"。' },
    ],
    coverage: {
      browserVisual: 'transition-manifest',
      regressionTests: [],
      manifestRefs: ['fixtures/visual-baselines/transition-visual-baselines.json#push-up-real'],
    },
  },
  {
    fileName: '4b00a85c247c47bdaeb01aeec562c90f.pptx',
    state: 'active',
    purpose: '高保真主回归样本，覆盖文本、箭头、辅助框、shape 阴影和 random 转场 open case。',
    tags: ['text-position', 'arrow-marker', 'connector', 'helper-frame', 'shape-shadow', 'random-transition'],
    focusPages: [
      { page: 1, summary: '封面标题与多边形定位。' },
      { page: 4, summary: '辅助线、标注线、底部说明文字。' },
      { page: 7, summary: '箭头长度、方向与落点。' },
      { page: 20, summary: 'shape 阴影影响文本布局。' },
    ],
    coverage: {
      browserVisual: 'page-visual-manifest',
      regressionTests: [],
      manifestRefs: [
        'fixtures/visual-baselines/public-ppt-page-visual-baselines.json#core-4b00-slide-1-cover-layout',
        'fixtures/visual-baselines/public-ppt-page-visual-baselines.json#core-4b00-slide-4-annotation-layout',
        'fixtures/visual-baselines/public-ppt-page-visual-baselines.json#core-4b00-slide-7-arrow-alignment',
        'fixtures/visual-baselines/public-ppt-page-visual-baselines.json#core-4b00-slide-20-shadow-layout',
      ],
    },
  },
  {
    fileName: '83f822650ce0499c835780f673faed2b.pptx',
    state: 'partial',
    purpose: '真实 table + bullet 样本，重点是 typography 与结构稳定性。',
    tags: ['table', 'bullet', 'table-typography'],
    focusPages: [{ page: 4, summary: '4 x 2 table，小字偏小、行高偏紧。' }],
    coverage: {
      browserVisual: 'browser-smoke-documented',
      regressionTests: [],
      manifestRefs: [],
    },
  },
  {
    fileName: 'AI Beatify Slides Example.pptx',
    state: 'partial',
    purpose: '模板型 table typography 样本。',
    tags: ['table', 'bullet', 'text-wrap', 'table-typography'],
    focusPages: [{ page: 4, summary: '4 x 2 table，多段正文观感更松但仍有轻微裁切风险。' }],
    coverage: {
      browserVisual: 'browser-smoke-documented',
      regressionTests: [],
      manifestRefs: [],
    },
  },
  {
    fileName: 'AI.Tech.Agency.Infographics.by.Slidesgo.pptx',
    state: 'partial',
    purpose: '大体量模板样本，压测 group、connector、table、复杂文本盒模型。',
    tags: ['group', 'connector', 'shape-svg', 'table', 'table-typography', 'text-inset'],
    focusPages: [
      { page: 1, summary: '标题、副标题与展示型英文排版。' },
      { page: 4, summary: '零尺寸 connector 与流程图形。' },
      { page: 5, summary: '3 x 3 pricing table，正文 bullet 与长英文表头。' },
      { page: 24, summary: '5 x 2 table，含 hMerge / gridSpan。' },
      { page: 26, summary: '5 x 6 table。' },
      { page: 31, summary: '4 x 5 table。' },
    ],
    coverage: {
      browserVisual: 'page-visual-manifest-and-regression',
      regressionTests: ['src/components/presentation/aiTechFixtureRegression.test.ts'],
      manifestRefs: [
        'fixtures/visual-baselines/public-ppt-page-visual-baselines.json#ai-tech-slide-1-cover-title',
        'fixtures/visual-baselines/public-ppt-page-visual-baselines.json#ai-tech-slide-4-connectors',
        'fixtures/visual-baselines/public-ppt-page-visual-baselines.json#ai-tech-slide-5-pricing-table',
        'fixtures/visual-baselines/public-ppt-page-visual-baselines.json#ai-tech-slide-24-merged-table',
        'fixtures/visual-baselines/public-ppt-page-visual-baselines.json#ai-tech-slide-26-planning-table',
        'fixtures/visual-baselines/public-ppt-page-visual-baselines.json#ai-tech-slide-31-tasks-table',
      ],
    },
  },
  {
    fileName: 'chart-diagram-fixture.pptx',
    state: 'targeted-fixture',
    purpose: '复杂元素 targeted synthetic fixture，覆盖 chart / diagram 主链路。',
    tags: ['chart', 'diagram', 'smartart', 'complex-element'],
    focusPages: [
      { page: 1, summary: 'bar / chart renderer first-pass。' },
      { page: 2, summary: 'diagram hierarchy renderer。' },
      { page: 3, summary: 'pie chart renderer。' },
      { page: 4, summary: 'scatter chart renderer。' },
      { page: 5, summary: 'line chart renderer。' },
      { page: 6, summary: 'area chart renderer。' },
    ],
    coverage: {
      browserVisual: 'fixture-regression',
      regressionTests: ['src/components/presentation/complexFixtureRegression.test.ts'],
      manifestRefs: [],
    },
  },
  {
    fileName: 'f.pptx',
    state: 'partial',
    purpose: '通用临时样本，目前仍未整理出稳定问题页。',
    tags: ['unclassified'],
    focusPages: [],
    coverage: {
      browserVisual: 'catalog-only',
      regressionTests: [],
      manifestRefs: [],
    },
  },
  {
    fileName: 'math_calculus_formulas.pptx',
    state: 'active',
    purpose: '数学公式媒体兼容样本，重点是伪 PNG 真 SVG。',
    tags: ['math-media', 'media-mime', 'formula-layout'],
    focusPages: [{ page: 1, summary: '两张公式图实际是 SVG 内容。' }],
    coverage: {
      browserVisual: 'catalog-only',
      regressionTests: [],
      manifestRefs: [],
    },
  },
  {
    fileName: 'math_linear_algebra_formulas.pptx',
    state: 'backlog',
    purpose: '数学公式资源回归样本。',
    tags: ['math-media', 'formula-layout'],
    focusPages: [],
    coverage: {
      browserVisual: 'backlog',
      regressionTests: [],
      manifestRefs: [],
    },
  },
  {
    fileName: 'math_probability_statistics_formulas.pptx',
    state: 'backlog',
    purpose: '数学公式资源回归样本。',
    tags: ['math-media', 'formula-layout'],
    focusPages: [],
    coverage: {
      browserVisual: 'backlog',
      regressionTests: [],
      manifestRefs: [],
    },
  },
  {
    fileName: 'transition-cover-uncover-zoom-split-fixture.pptx',
    state: 'active',
    purpose: '真实 cover / uncover / zoom / split 转场 fixture。',
    tags: ['transition', 'cover', 'uncover', 'zoom', 'split'],
    focusPages: [
      { page: 2, summary: 'cover dir="r"。' },
      { page: 3, summary: 'pull -> uncover dir="l"。' },
      { page: 4, summary: 'zoom。' },
      { page: 5, summary: 'split orient="vert" dir="out"。' },
    ],
    coverage: {
      browserVisual: 'transition-manifest',
      regressionTests: [
        'src/components/presentation/transitionFixtureRegression.test.ts',
        'src/components/presentation/transitionRegressionBaseline.test.ts',
      ],
      manifestRefs: [
        'fixtures/visual-baselines/transition-visual-baselines.json#cover-right-real',
        'fixtures/visual-baselines/transition-visual-baselines.json#uncover-left-real',
        'fixtures/visual-baselines/transition-visual-baselines.json#zoom-default-real',
        'fixtures/visual-baselines/transition-visual-baselines.json#split-vert-out-real',
      ],
    },
  },
  {
    fileName: 'watercolor.pptx',
    state: 'active',
    purpose: '英文模板中的 NBSP、主题色、placeholder 颜色样本。',
    tags: ['text-wrap', 'text-color', 'theme-color', 'placeholder'],
    focusPages: [
      { page: 1, summary: '大标题换行。' },
      { page: 3, summary: '三列正文换行与颜色一致性。' },
      { page: 10, summary: '正文应继承模板浅棕主题色。' },
    ],
    coverage: {
      browserVisual: 'page-visual-manifest',
      regressionTests: [],
      manifestRefs: [
        'fixtures/visual-baselines/public-ppt-page-visual-baselines.json#watercolor-slide-1-hero-title',
        'fixtures/visual-baselines/public-ppt-page-visual-baselines.json#watercolor-slide-3-columns-theme',
        'fixtures/visual-baselines/public-ppt-page-visual-baselines.json#watercolor-slide-10-body-theme-color',
      ],
    },
  },
  {
    fileName: 'wipe-directions-fixture.pptx',
    state: 'active',
    purpose: '真实 wipe 四向 direction 浏览器回归样本。',
    tags: ['transition', 'wipe', 'timing'],
    focusPages: [
      { page: 1, summary: 'wipe dir="r"。' },
      { page: 2, summary: 'wipe dir="l"。' },
      { page: 3, summary: 'wipe dir="u"。' },
      { page: 4, summary: 'wipe dir="d"。' },
    ],
    coverage: {
      browserVisual: 'transition-manifest',
      regressionTests: ['src/components/presentation/transitionRegressionBaseline.test.ts'],
      manifestRefs: [
        'fixtures/visual-baselines/transition-visual-baselines.json#wipe-right-real',
        'fixtures/visual-baselines/transition-visual-baselines.json#wipe-left-real',
        'fixtures/visual-baselines/transition-visual-baselines.json#wipe-up-real',
        'fixtures/visual-baselines/transition-visual-baselines.json#wipe-down-real',
      ],
    },
  },
  {
    fileName: '区级平台介绍.pptx',
    state: 'active',
    purpose: 'bullet、标题单行与裁剪缩略图主回归样本。',
    tags: ['text-wrap', 'bullet', 'image-crop', 'thumbnail'],
    focusPages: [
      { page: 2, summary: '标题不应换行，自定义 bullet 应为 √。' },
      { page: 4, summary: '右侧缩略图裁剪结果。' },
    ],
    coverage: {
      browserVisual: 'page-visual-manifest',
      regressionTests: [],
      manifestRefs: [
        'fixtures/visual-baselines/public-ppt-page-visual-baselines.json#district-slide-2-title-bullets',
        'fixtures/visual-baselines/public-ppt-page-visual-baselines.json#district-slide-4-thumbnail-crop',
      ],
    },
  },
  {
    fileName: '演示文稿1.pptx',
    state: 'active',
    purpose: '小型页面转场 + advTm 自动翻页真实样本。',
    tags: ['transition', 'timing', 'autoplay'],
    focusPages: [
      { page: 1, summary: 'fade + advTm。' },
      { page: 2, summary: 'push + advTm。' },
      { page: 3, summary: 'wipe + advTm。' },
    ],
    coverage: {
      browserVisual: 'transition-manifest',
      regressionTests: ['src/components/presentation/transitionRegressionBaseline.test.ts'],
      manifestRefs: ['fixtures/visual-baselines/transition-visual-baselines.json#push-default-real'],
    },
  },
]
