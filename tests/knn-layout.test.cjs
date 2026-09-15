const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(
  path.join(root, "experiments/knn-iris/index.html"),
  "utf8",
);
const css = fs.readFileSync(
  path.join(root, "experiments/experiments.css"),
  "utf8",
);

test("KNN layout makes visualization the primary center column", () => {
  assert.match(html, /class="experiment-grid knn-experiment-grid"/);
  assert.match(html, /class="experiment-panel knn-controls-panel"/);
  assert.match(html, /class="experiment-panel knn-result-panel"/);
  assert.match(html, /class="experiment-panel knn-visual-panel"/);
  assert.match(
    css,
    /\.knn-experiment-grid\s*\{[^}]*grid-template-areas:\s*"controls visual result"/s,
  );
});

test("KNN visualization uses a larger high-resolution canvas", () => {
  assert.match(html, /id="knn-scatter" width="720" height="520"/);
  assert.match(css, /\.knn-chart-box\s*\{[^}]*min-height:\s*440px/s);
});
