const test = require("node:test");
const assert = require("node:assert/strict");

const courseIris = require("../course/iris-course.js");

const section = {
  id: "chapter-3",
  number: "03",
  title: "数据理解与特征工程",
  summary: "从数据检查、缺失值到特征编码，建立可靠的数据基础。",
  topics: [
    {
      number: 15,
      title: "数据质量检查清单",
      text: "数据探索必须检查采样范围、缺失比例和异常值。",
    },
    {
      number: 16,
      title: "缺失值处理策略",
      text: "不同缺失机制需要不同的补齐方式。",
      formula: "x = mean(X_train)",
    },
    {
      number: 17,
      title: "类别特征的编码方法",
      text: "根据类别数量选择合适的编码方式。",
      note: "编码规则只能在训练集上拟合。",
    },
    {
      number: 18,
      title: "特征选择的三类方法",
      text: "比较过滤法、包裹法和嵌入法。",
    },
  ],
};

test("chapter guide summarizes the chapter and exposes learning objectives", () => {
  const guide = courseIris.buildChapterIris(section);

  assert.equal(guide.title, "Iris 领学");
  assert.match(guide.message, /数据理解与特征工程/);
  assert.deepEqual(guide.objectives, [
    "数据质量检查清单",
    "缺失值处理策略",
    "类别特征的编码方法",
  ]);
});

test("chapter guide uses explicit Iris objectives when provided", () => {
  const configuredSection = {
    ...section,
    iris: { objectives: ["先识别数据问题", "再选择处理方法"] },
  };
  const guide = courseIris.buildChapterIris(configuredSection);

  assert.deepEqual(guide.objectives, ["先识别数据问题", "再选择处理方法"]);
});

test("topic annotation prioritizes an existing note", () => {
  const annotation = courseIris.buildTopicIris(section.topics[2], 2);

  assert.deepEqual(annotation, {
    kind: "note",
    title: "Iris 提醒",
    message: "编码规则只能在训练集上拟合。",
  });
});

test("topic annotation explains formulas before presenting them", () => {
  const annotation = courseIris.buildTopicIris(section.topics[1], 1);

  assert.equal(annotation.kind, "formula");
  assert.equal(annotation.title, "Iris 看公式");
  assert.match(annotation.message, /输入、参数和结果/);
});

test("topic annotation adds a checkpoint after three plain topics", () => {
  const annotation = courseIris.buildTopicIris(section.topics[3], 3);

  assert.equal(annotation.kind, "checkpoint");
  assert.match(annotation.message, /特征选择的三类方法/);
});

test("chapter review links the lesson to practice and experiments", () => {
  const review = courseIris.buildChapterReview(section, {
    practiceHref: "../practice/index.html",
    experimentHref: "../../experiments/index.html",
  });

  assert.equal(review.title, "Iris 收束");
  assert.equal(review.practiceHref, "../practice/index.html");
  assert.equal(review.experimentHref, "../../experiments/index.html");
  assert.deepEqual(review.topics, [
    "数据质量检查清单",
    "缺失值处理策略",
    "类别特征的编码方法",
  ]);
  assert.match(review.prompt, /用自己的话/);
});

test("tree guide explains the current topic and its neighbours", () => {
  const guide = courseIris.buildTreeGuide(section, 17);

  assert.equal(guide.title, "Iris 路线提示");
  assert.match(guide.message, /类别特征的编码方法/);
  assert.match(guide.detail, /缺失值处理策略/);
  assert.match(guide.detail, /特征选择的三类方法/);
});

test("tree guide describes the chapter start when no topic is selected", () => {
  const guide = courseIris.buildTreeGuide(section, null);

  assert.match(guide.message, /数据理解与特征工程/);
  assert.match(guide.detail, /数据质量检查清单/);
});
