(function (root, factory) {
  var api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.MLIrisHistory = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function buildHistoryGuide(milestone, index, total) {
    return {
      title: "Iris 时间向导",
      year: milestone.year,
      message:
        "我带你来到 " +
        milestone.year +
        " 年，看看“" +
        milestone.title +
        "”如何改变机器学习的历史。",
      detail:
        "第 " +
        (index + 1) +
        " / " +
        total +
        " 个里程碑 · " +
        milestone.short,
    };
  }

  return {
    buildHistoryGuide: buildHistoryGuide,
  };
});
