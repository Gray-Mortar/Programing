(function () {
  const featureIds = [
    "sepal-length",
    "sepal-width",
    "petal-length",
    "petal-width",
  ];
  const classes = ["Setosa", "Versicolor", "Virginica"];
  const labelMap = {
    "Iris-setosa": "Setosa",
    "Iris-versicolor": "Versicolor",
    "Iris-virginica": "Virginica",
  };
  const colors = {
    Setosa: "#6d4bd1",
    Versicolor: "#2f9e73",
    Virginica: "#e27b36",
  };
  const key = "ml_knn_records";
  let lastResult = null;

  function samples() {
    return (window.IRIS_SAMPLES || []).map(function (sample, index) {
      return {
        features: sample.features.map(Number),
        label: labelMap[sample.label] || sample.label,
        index: index,
      };
    });
  }

  function featureStats() {
    const data = samples();
    return featureIds.map(function (_, index) {
      const values = data.map(function (sample) {
        return sample.features[index];
      });
      const mean =
        values.reduce(function (sum, value) {
          return sum + value;
        }, 0) / values.length;
      const variance =
        values.reduce(function (sum, value) {
          return sum + Math.pow(value - mean, 2);
        }, 0) / values.length;
      return { mean: mean, std: Math.sqrt(variance) || 1 };
    });
  }

  function currentFeatures() {
    return featureIds.map(function (id) {
      return Number(document.getElementById(id).value);
    });
  }

  function currentK() {
    return Math.max(
      1,
      Math.min(15, Number(document.getElementById("knn-k").value) || 5),
    );
  }

  function euclideanDistance(first, second, stats) {
    return Math.sqrt(
      first.reduce(function (sum, value, index) {
        const scaledDifference = (value - second[index]) / stats[index].std;
        return sum + Math.pow(scaledDifference, 2);
      }, 0),
    );
  }

  function classify(features, k) {
    const stats = featureStats();
    const scored = samples()
      .map(function (sample) {
        return {
          label: sample.label,
          index: sample.index,
          features: sample.features,
          distance: euclideanDistance(features, sample.features, stats),
        };
      })
      .sort(function (first, second) {
        return first.distance - second.distance || first.index - second.index;
      });

    const neighbors = scored.slice(0, k);
    const votes = classes.reduce(function (result, label) {
      result[label] = 0;
      return result;
    }, {});

    neighbors.forEach(function (neighbor) {
      votes[neighbor.label] = (votes[neighbor.label] || 0) + 1;
    });

    const ranking = classes.map(function (label) {
      return {
        label: label,
        count: votes[label],
        share: votes[label] / k,
      };
    });

    const best = ranking.reduce(function (current, item) {
      return item.count > current.count ? item : current;
    }, ranking[0]);

    return {
      neighbors: neighbors,
      votes: votes,
      ranking: ranking,
      predicted: best.label,
      confidence: Math.round((best.count / k) * 100),
    };
  }

  function updateOutputs(result, features, k) {
    document.getElementById("knn-result").textContent = result.predicted;
    document.getElementById("knn-confidence").textContent =
      result.confidence + "%";
    document.getElementById("knn-vector").innerHTML =
      "特征向量：[" +
      features.join(", ") +
      "]<br>K = " +
      k +
      "，" +
      result.neighbors.length +
      " 个最近邻居参与投票。";

    classes.forEach(function (label) {
      const count = result.votes[label] || 0;
      const bar = document.getElementById("vote-bar-" + label);
      const countNode = document.getElementById("vote-count-" + label);
      if (bar) bar.style.width = (count / k) * 100 + "%";
      if (countNode) countNode.textContent = String(count);
    });
  }

  function drawFeatureComparison(result, features) {
    const canvas = document.getElementById("knn-scatter");
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const featureLabels = ["花萼长度", "花萼宽度", "花瓣长度", "花瓣宽度"];
    const trackLeft = 86;
    const trackRight = width - 70;
    const trackWidth = trackRight - trackLeft;
    const rowY = [48, 102, 156, 210];

    const ranges = featureIds.map(function (_, index) {
      let min = Infinity;
      let max = -Infinity;
      samples().forEach(function (sample) {
        min = Math.min(min, sample.features[index]);
        max = Math.max(max, sample.features[index]);
      });
      min = Math.min(min, features[index]);
      max = Math.max(max, features[index]);
      if (min === max) {
        min -= 0.5;
        max += 0.5;
      }
      return { min: min, max: max };
    });

    function trackX(value, index) {
      const range = ranges[index];
      return trackLeft + ((value - range.min) / (range.max - range.min)) * trackWidth;
    }

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    rowY.forEach(function (y, index) {
      const range = ranges[index];

      ctx.fillStyle = "#eeeaf8";
      ctx.fillRect(trackLeft, y - 3, trackWidth, 6);

      result.neighbors.forEach(function (neighbor) {
        ctx.beginPath();
        ctx.arc(
          trackX(neighbor.features[index], index),
          y,
          3.2,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = colors[neighbor.label] || "#8a839a";
        ctx.globalAlpha = 0.85;
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      const userX = trackX(features[index], index);
      ctx.beginPath();
      ctx.moveTo(userX, y - 9);
      ctx.lineTo(userX, y + 9);
      ctx.strokeStyle = "#242033";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(userX, y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "#242033";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = "12px 'Microsoft YaHei', 'PingFang SC', sans-serif";
      ctx.fillStyle = "#242033";
      ctx.textAlign = "left";
      ctx.fillText(featureLabels[index], 8, y + 4);
      ctx.textAlign = "right";
      ctx.fillText(features[index].toFixed(1), width - 8, y + 4);

      ctx.font = "9px 'Microsoft YaHei', 'PingFang SC', sans-serif";
      ctx.fillStyle = "#9b96ad";
      ctx.textAlign = "left";
      ctx.fillText(range.min.toFixed(1), trackLeft, y + 16);
      ctx.textAlign = "right";
      ctx.fillText(range.max.toFixed(1), trackRight, y + 16);
    });
  }

  function currentUser() {
    const auth = window.MLAuth;
    const user = auth && auth.getCurrentUser ? auth.getCurrentUser() : null;
    return user ? user.username : "guest";
  }

  function renderStatus(status) {
    const node = document.getElementById("knn-history-status");
    if (node) node.textContent = status;
  }

  function storageGet() {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch (error) {
      return [];
    }
  }

  function storageSet(records) {
    localStorage.setItem(key, JSON.stringify(records));
  }

  function userRecords(records) {
    const username = currentUser();
    if (username === "guest") return records;
    return records.filter(function (record) {
      return record.username === username || record.username === "guest";
    });
  }

  function formatTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function historyItemMarkup(record) {
    const time = encodeURIComponent(record.time);
    const features = record.features ? record.features.join(", ") : "暂无";
    return [
      '<article class="knn-history-item">',
      '<div class="knn-history-main">',
      "<strong>" + record.predicted + "</strong>",
      "<span>K=" + record.k + " · 置信度 " + record.confidence + "%</span>",
      "<p>特征向量：[" + features + "]</p>",
      "</div>",
      '<div class="knn-history-meta">' + formatTime(record.time) + "</div>",
      '<div class="knn-history-actions">',
      '<a href="history.html?time=' + time + '">查看详情</a>',
      "</div>",
      "</article>",
    ].join("");
  }

  function renderHistory() {
    const node = document.getElementById("knn-record-list");
    if (!node) return;
    const records = userRecords(storageGet());
    if (!records.length) {
      node.innerHTML =
        '<p class="experiment-note">还没有保存过 KNN 实验记录。</p>';
      return;
    }
    node.innerHTML = records.slice().reverse().map(historyItemMarkup).join("");
  }

  function saveRecord() {
    if (!lastResult) return;
    const records = storageGet();
    records.push({
      time: new Date().toISOString(),
      username: currentUser(),
      features: lastResult.features,
      k: lastResult.k,
      predicted: lastResult.result.predicted,
      confidence: lastResult.result.confidence,
      votes: lastResult.result.votes,
      neighbors: lastResult.result.neighbors.map(function (neighbor) {
        return {
          index: neighbor.index,
          label: neighbor.label,
          distance: Number(neighbor.distance.toFixed(4)),
          features: neighbor.features,
        };
      }),
    });
    storageSet(records);
    renderStatus("已保存 " + records.length + " 条操作记录");
    renderHistory();
  }

  function run() {
    const features = currentFeatures();
    const k = currentK();
    const result = classify(features, k);
    lastResult = {
      features: features,
      k: k,
      result: result,
    };
    updateOutputs(result, features, k);
    drawFeatureComparison(result, features);
  }

  function init() {
    if (!window.IRIS_SAMPLES || !window.IRIS_SAMPLES.length) {
      renderStatus("Iris 数据尚未加载");
      return;
    }

    featureIds.concat(["knn-k"]).forEach(function (id) {
      const input = document.getElementById(id);
      input.addEventListener("input", function () {
        const outputId = id === "knn-k" ? "k-value" : id + "-value";
        const output = document.getElementById(outputId);
        if (output) output.textContent = input.value;
        run();
      });
    });

    document
      .getElementById("save-knn-record")
      .addEventListener("click", function () {
        saveRecord();
        const button = this;
        button.textContent = "已存档本次操作";
        window.setTimeout(function () {
          button.textContent = "存档本次操作";
        }, 1600);
      });

    run();
    renderHistory();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
