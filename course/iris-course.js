(function (root, factory) {
  var api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.ML_CourseIris = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function getTopics(section) {
    return Array.isArray(section && section.topics) ? section.topics : [];
  }

  function getConfiguredObjectives(section) {
    var iris = section && section.iris;
    return iris && Array.isArray(iris.objectives) ? iris.objectives : null;
  }

  function buildChapterIris(section) {
    var topics = getTopics(section);
    var configuredObjectives = getConfiguredObjectives(section);
    var objectives = configuredObjectives
      ? configuredObjectives.slice(0, 3)
      : topics.slice(0, 3).map(function (topic) {
          return topic.title;
        });

    return {
      title: "Iris 领学",
      message:
        "这一章我们沿着“" +
        section.title +
        "”这条主线学习，先抓联系，再记结论。",
      objectives: objectives,
    };
  }

  function buildTopicIris(topic, index) {
    if (!topic) {
      return null;
    }

    if (topic.note) {
      return {
        kind: "note",
        title: "Iris 提醒",
        message: topic.note,
      };
    }

    if (topic.formula) {
      return {
        kind: "formula",
        title: "Iris 看公式",
        message: "先别急着记公式，先找出输入、参数和结果分别在哪里。",
      };
    }

    if (index > 0 && index % 3 === 0) {
      return {
        kind: "checkpoint",
        title: "Iris 停一下",
        message:
          "试着用自己的话说明“" +
          topic.title +
          "”解决了什么问题，再继续往下看。",
      };
    }

    return null;
  }

  function buildChapterReview(section, links) {
    var topics = getTopics(section);
    var settings = links || {};
    var focusTopic = topics[Math.min(1, Math.max(topics.length - 1, 0))];

    return {
      title: "Iris 收束",
      message: "知识节点已经接通，接下来去练习和实验里验证这一章。",
      prompt: focusTopic
        ? "试着用自己的话说清“" +
          focusTopic.title +
          "”解决了什么问题，再继续下一章。"
        : "试着用自己的话回顾本章主线，再继续下一章。",
      topics: topics.slice(0, 3).map(function (topic) {
        return topic.title;
      }),
      practiceHref: settings.practiceHref || "../practice/index.html",
      experimentHref: settings.experimentHref || "../../experiments/index.html",
    };
  }

  function buildTreeGuide(section, topicNumber) {
    var topics = getTopics(section);
    var topicIndex = topics.findIndex(function (topic) {
      return topic.number === topicNumber;
    });

    if (topicIndex < 0) {
      return {
        title: "Iris 路线提示",
        message:
          "本章是“" +
          section.title +
          "”，先确认它解决什么问题，再看每个知识点的位置。",
        detail: topics.length
          ? "建议从“" + topics[0].title + "”开始，再沿着知识树继续。"
          : "本章暂时没有可展示的知识点。",
      };
    }

    var topic = topics[topicIndex];
    var previous = topics[topicIndex - 1];
    var next = topics[topicIndex + 1];
    var links = [];

    if (previous) {
      links.push("进入前先确认你已理解“" + previous.title + "”。");
    } else {
      links.push("这是本章学习路线的起点。");
    }
    if (next) {
      links.push("学完后下一站会连接“" + next.title + "”。");
    }

    return {
      title: "Iris 路线提示",
      message:
        "当前知识点是“" +
        topic.title +
        "”，先看它在本章解决什么问题。",
      detail: links.join(" "),
    };
  }

  return {
    buildChapterIris: buildChapterIris,
    buildTopicIris: buildTopicIris,
    buildChapterReview: buildChapterReview,
    buildTreeGuide: buildTreeGuide,
  };
});
