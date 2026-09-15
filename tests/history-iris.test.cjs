const test = require("node:test");
const assert = require("node:assert/strict");

const historyIris = require("../history/iris-history.js");

const milestone = {
  id: "1997",
  year: "1997",
  title: "深蓝击败棋王",
  short: "AI 超越人类棋手",
};

test("history guide names the selected milestone", () => {
  const guide = historyIris.buildHistoryGuide(milestone, 3, 10);

  assert.equal(guide.title, "Iris 时间向导");
  assert.equal(guide.year, "1997");
  assert.match(guide.message, /1997/);
  assert.match(guide.message, /深蓝击败棋王/);
  assert.match(guide.detail, /第 4 \/ 10 个里程碑/);
});
