const test = require("node:test");
const assert = require("node:assert/strict");

const experimentIris = require("../experiments/iris-lab.js");

test("experiment roles keep Iris consistent across labs", () => {
  assert.equal(experimentIris.getRole("knn"), "Iris 分类查证员");
  assert.equal(experimentIris.getRole("kmeans"), "Iris 聚类巡检员");
  assert.equal(experimentIris.getRole("digit"), "Iris 识别观察员");
});

test("KNN warns when K is too sensitive", () => {
  const message = experimentIris.buildMessage("knn", "parameter", { k: 1 });

  assert.equal(message.state, "warning");
  assert.match(message.message, /K = 1/);
  assert.match(message.detail, /敏感/);
});

test("KNN explains smooth boundaries for a large K", () => {
  const message = experimentIris.buildMessage("knn", "parameter", { k: 15 });

  assert.equal(message.state, "observing");
  assert.match(message.message, /K = 15/);
  assert.match(message.detail, /平滑/);
});

test("KNN flags an uncertain close vote", () => {
  const message = experimentIris.buildMessage("knn", "result", {
    k: 5,
    result: {
      predicted: "Versicolor",
      confidence: 40,
      votes: { Setosa: 2, Versicolor: 2, Virginica: 1 },
    },
  });

  assert.equal(message.state, "warning");
  assert.match(message.message, /Versicolor/);
  assert.match(message.detail, /票数接近/);
});

test("K-Means explains each iteration and reports convergence", () => {
  const step = experimentIris.buildMessage("kmeans", "step", {
    iteration: 3,
    sse: 128.4,
  });
  const complete = experimentIris.buildMessage("kmeans", "complete", {
    iteration: 5,
    sse: 96.2,
  });

  assert.equal(step.state, "observing");
  assert.match(step.message, /第 3 轮/);
  assert.equal(complete.state, "success");
  assert.match(complete.message, /96.2/);
});

test("digit recognition distinguishes confident and close predictions", () => {
  const confident = experimentIris.buildMessage("digit", "result", {
    digit: 8,
    confidence: 0.91,
    runnerUp: 0.04,
  });
  const uncertain = experimentIris.buildMessage("digit", "result", {
    digit: 4,
    confidence: 0.46,
    runnerUp: 0.39,
  });

  assert.equal(confident.state, "success");
  assert.match(confident.message, /8/);
  assert.equal(uncertain.state, "warning");
  assert.match(uncertain.detail, /差距较小/);
});
