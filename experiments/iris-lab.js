(function (root, factory) {
  var api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.MLIrisExperiment = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var roles = {
    knn: "Iris 分类查证员",
    kmeans: "Iris 聚类巡检员",
    digit: "Iris 识别观察员",
    tree: "Iris 分类建树员",
  };

  function getRole(experiment) {
    return roles[experiment] || "Iris 实验搭档";
  }

  function message(state, text, detail) {
    return { state: state, message: text, detail: detail || "" };
  }

  function buildKnnMessage(eventName, context) {
    var settings = context || {};
    if (eventName === "parameter") {
      var k = Number(settings.k) || 5;
      if (k === 1) {
        return message(
          "warning",
          "K = 1 时只看最近的一个邻居，边界会很敏感。",
          "这种敏感会让单个异常邻居改变结果，试着把 K 调到 3 或 5。",
        );
      }
      if (k >= 13) {
        return message(
          "observing",
          "K = " + k + " 会参考很多邻居，分类边界更平滑。",
          "平滑的代价是可能把远处的类别带进来，继续观察投票分布。",
        );
      }
      return message(
        "observing",
        "K = " + k + "，当前会参考 " + k + " 个最近邻居。",
        "改变花瓣和花萼特征，观察哪些邻居进入了投票。",
      );
    }

    if (eventName === "result") {
      var result = settings.result || {};
      var ranking = Object.keys(result.votes || {})
        .map(function (label) {
          return { label: label, count: result.votes[label] };
        })
        .sort(function (first, second) {
          return second.count - first.count;
        });
      var first = ranking[0] || { count: 0 };
      var second = ranking[1] || { count: 0 };
      if (ranking.length > 1 && first.count - second.count <= 1) {
        return message(
          "warning",
          "当前预测为 " + result.predicted + "，但几个类别的票数接近。",
          "票数接近说明模型正在犹豫，要继续比较邻居距离和置信度。",
        );
      }
      return message(
        "success",
        "预测为 " + result.predicted + "，置信度 " + result.confidence + "%。",
        "继续调整 K 和特征，比较预测结果何时发生变化。",
      );
    }

    if (eventName === "save") {
      return message(
        "success",
        "实验记录已保存，这次分类参数可以复现。",
        "记录中保留了特征向量、K 值、投票结果和最近邻居。",
      );
    }

    return message(
      "idle",
      "调整四个特征和一个 K 值，我会帮你核对投票过程。",
      "先观察最近邻，再看哪个类别获得最多票数。",
    );
  }

  function buildKmeansMessage(eventName, context) {
    var settings = context || {};
    if (eventName === "parameter") {
      return message(
        "observing",
        "当前设置 K = " + settings.k + "，先猜一猜会形成几个簇。",
        "K 需要提前指定，运行后可以比较 SSE 和簇的分布。",
      );
    }
    if (eventName === "data") {
      return message(
        "idle",
        "已准备 " + settings.count + " 个样本，可以开始聚类。",
        "点击画布可以继续添加样本，也可以随机生成一组数据。",
      );
    }
    if (eventName === "run") {
      return message(
        "observing",
        "质心已经初始化，接下来每个样本会分配给最近的质心。",
        "重点观察同一簇样本与质心之间的连线。",
      );
    }
    if (eventName === "step") {
      return message(
        "observing",
        "第 " + settings.iteration + " 轮完成，SSE = " + settings.sse + "。",
        "质心正在向各自簇的中心移动，继续单步观察下一轮。",
      );
    }
    if (eventName === "complete") {
      return message(
        "success",
        "聚类收敛，共迭代 " + settings.iteration + " 次，最终 SSE = " + settings.sse + "。",
        "SSE 不再明显下降时，说明当前 K 下的分配已经稳定。",
      );
    }

    return message(
      "idle",
      "先准备样本并选择 K，我会解释每次质心更新。",
      "聚类没有标签，重点是观察结构是否稳定和可解释。",
    );
  }

  function buildDigitMessage(eventName, context) {
    var settings = context || {};
    if (eventName === "loading") {
      return message(
        "observing",
        "正在加载本地识别模型，页面不会上传你的手写图片。",
        "模型准备完成后，在画板中央写一个 0 到 9 的数字。",
      );
    }
    if (eventName === "ready") {
      return message(
        "idle",
        "模型已就绪，可以开始写数字。",
        "尽量把数字写得完整、居中，并保留适当的空白边界。",
      );
    }
    if (eventName === "drawing") {
      return message(
        "observing",
        "已经捕捉到笔迹，识别前会先裁剪、缩放并居中。",
        "完成后点击“开始识别”，观察 0 到 9 的概率分布。",
      );
    }
    if (eventName === "result") {
      var gap = settings.confidence - settings.runnerUp;
      if (gap < 0.12) {
        return message(
          "warning",
          "预测为 " + settings.digit + "，但前两个数字的概率差距较小。",
          "差距较小意味着模型在犹豫，可以结合概率分布一起判断。",
        );
      }
      return message(
        "success",
        "预测为 " + settings.digit + "，置信度 " +
          Math.round(settings.confidence * 100) + "%。",
        "其他数字的分数越低，说明模型对当前结果越有信心。",
      );
    }

    return message(
      "idle",
      "写下一个数字，我会解释模型如何得到最终概率。",
      "整个过程都在浏览器本地完成。",
    );
  }

  function buildMessage(experiment, eventName, context) {
    if (eventName === "error") {
      return message(
        "warning",
        "实验遇到问题，先把当前状态保留下来。",
        (context && context.message) || "检查输入后可以重新运行。",
      );
    }
    if (experiment === "knn") {
      return buildKnnMessage(eventName, context);
    }
    if (experiment === "kmeans") {
      return buildKmeansMessage(eventName, context);
    }
    if (experiment === "digit") {
      return buildDigitMessage(eventName, context);
    }
    return message(
      "idle",
      "准备开始实验，我会陪你观察每一步。",
      "先设置参数，再运行并比较结果。",
    );
  }

  function applyMessage(element, content) {
    if (!element || !content) {
      return;
    }

    element.dataset.state = content.state || "idle";
    var messageNode = element.querySelector("[data-iris-lab-message]");
    var detailNode = element.querySelector("[data-iris-lab-detail]");
    if (messageNode) {
      messageNode.textContent = content.message || "";
    }
    if (detailNode) {
      detailNode.textContent = content.detail || "";
    }
  }

  function announce(experiment, eventName, context) {
    var element = document.querySelector(
      'iris-lab-companion[data-experiment="' + experiment + '"]',
    );
    if (!element) {
      return null;
    }
    var content = buildMessage(experiment, eventName, context);
    applyMessage(element, content);
    return content;
  }

  function boot() {
    document.querySelectorAll("iris-lab-companion").forEach(function (element) {
      var experiment = element.dataset.experiment;
      var initial = buildMessage(experiment, "ready", {});
      applyMessage(element, initial);
    });
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", boot);
    } else {
      boot();
    }
  }

  return {
    getRole: getRole,
    buildMessage: buildMessage,
    applyMessage: applyMessage,
    announce: announce,
  };
});
