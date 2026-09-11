(function () {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const kSlider = document.getElementById("k-slider");
  const kValueDisplay = document.getElementById("k-value");
  const speedSlider = document.getElementById("speed-slider");
  const speedValueDisplay = document.getElementById("speed-value");
  const startBtn = document.getElementById("start-btn");
  const stepBtn = document.getElementById("step-btn");
  const resetBtn = document.getElementById("reset-btn");
  const genBtn = document.getElementById("gen-btn");
  const statusDisplay = document.getElementById("status");
  const pointCountDisplay = document.getElementById("point-count");
  const iterCountDisplay = document.getElementById("iter-count");
  const sseDisplay = document.getElementById("sse-value");
  const coordDisplay = document.getElementById("coord-display");

  const LOGICAL_WIDTH = 700;
  const LOGICAL_HEIGHT = 500;
  const COLORS = [
    "#6d4bd1",
    "#2f9e73",
    "#e27b36",
    "#3f8efc",
    "#d96c7f",
    "#18a999",
  ];

  let points = [];
  let centroids = [];
  let assignments = [];
  let iteration = 0;
  let sse = 0;
  let isRunning = false;
  let isStepMode = false;
  let autoTimer = null;
  let animatingAssign = false;
  let assignIndex = 0;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = LOGICAL_WIDTH * dpr;
    canvas.height = LOGICAL_HEIGHT * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function getLogicalPos(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = LOGICAL_WIDTH / (rect.width || 1);
    const scaleY = LOGICAL_HEIGHT / (rect.height || 1);
    return {
      x: clamp((event.clientX - rect.left) * scaleX, 0, LOGICAL_WIDTH),
      y: clamp((event.clientY - rect.top) * scaleY, 0, LOGICAL_HEIGHT),
    };
  }

  function currentK() {
    return clamp(parseInt(kSlider.value, 10) || 3, 2, 6);
  }

  function currentSpeed() {
    return clamp(parseInt(speedSlider.value, 10) || 5, 1, 10);
  }

  function setStatus(message, kind) {
    statusDisplay.textContent = message;
    statusDisplay.classList.remove("success", "error");
    if (kind) statusDisplay.classList.add(kind);
  }

  function updateInfoPanel() {
    pointCountDisplay.textContent = points.length;
    iterCountDisplay.textContent = iteration;
    sseDisplay.textContent = sse > 0 ? sse.toFixed(1) : "0";
  }

  function render() {
    ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    ctx.strokeStyle = "#eeeaf8";
    ctx.lineWidth = 1;
    for (let x = 0; x <= LOGICAL_WIDTH; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, LOGICAL_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= LOGICAL_HEIGHT; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(LOGICAL_WIDTH, y);
      ctx.stroke();
    }

    if (assignments.length > 0) {
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      points.forEach(function (point, index) {
        const clusterIndex = assignments[index];
        if (clusterIndex === undefined || !centroids[clusterIndex]) return;
        ctx.strokeStyle = COLORS[clusterIndex % COLORS.length] + "55";
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(centroids[clusterIndex].x, centroids[clusterIndex].y);
        ctx.stroke();
      });
      ctx.setLineDash([]);
    }

    points.forEach(function (point, index) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
      const clusterIndex = assignments[index];
      ctx.fillStyle =
        clusterIndex === undefined
          ? "#8a839a"
          : COLORS[clusterIndex % COLORS.length];
      ctx.fill();
    });

    if (animatingAssign && assignIndex > 0 && assignIndex <= points.length) {
      const current = points[assignIndex - 1];
      ctx.beginPath();
      ctx.arc(current.x, current.y, 10, 0, Math.PI * 2);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(current.x, current.y, 10, 0, Math.PI * 2);
      ctx.strokeStyle = "#242033";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1;
      centroids.forEach(function (centroid, clusterIndex) {
        ctx.strokeStyle = COLORS[clusterIndex % COLORS.length] + "AA";
        ctx.beginPath();
        ctx.moveTo(current.x, current.y);
        ctx.lineTo(centroid.x, centroid.y);
        ctx.stroke();
      });
      ctx.setLineDash([]);
    }

    centroids.forEach(function (centroid, clusterIndex) {
      ctx.beginPath();
      ctx.arc(centroid.x, centroid.y, 9, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.strokeStyle = COLORS[clusterIndex % COLORS.length];
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(centroid.x - 12, centroid.y);
      ctx.lineTo(centroid.x + 12, centroid.y);
      ctx.moveTo(centroid.x, centroid.y - 12);
      ctx.lineTo(centroid.x, centroid.y + 12);
      ctx.strokeStyle = "#242033";
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  function stopAutoRun() {
    if (autoTimer) {
      clearTimeout(autoTimer);
      autoTimer = null;
    }
  }

  function getPointDelay() {
    return Math.max(80, 880 - currentSpeed() * 80);
  }

  function fullReset(clearPoints) {
    stopAutoRun();
    animatingAssign = false;
    assignIndex = 0;
    if (clearPoints) points = [];
    centroids = [];
    assignments = [];
    iteration = 0;
    sse = 0;
    isRunning = false;
    isStepMode = false;
    updateInfoPanel();
    render();
    setStatus(clearPoints ? "状态：已清空数据" : "状态：就绪");
  }

  function generateData() {
    const k = currentK();
    fullReset(true);
    const centers = [];

    for (let i = 0; i < k; i++) {
      let cx = 0;
      let cy = 0;
      let tries = 0;
      do {
        cx = 60 + Math.random() * (LOGICAL_WIDTH - 120);
        cy = 60 + Math.random() * (LOGICAL_HEIGHT - 120);
        tries++;
      } while (
        tries < 80 &&
        centers.some(function (center) {
          return Math.hypot(center.x - cx, center.y - cy) < 110;
        })
      );
      centers.push({ x: cx, y: cy });
    }

    centers.forEach(function (center) {
      for (let j = 0; j < 15; j++) {
        points.push({
          x: clamp(
            center.x + (Math.random() - 0.5) * 90,
            5,
            LOGICAL_WIDTH - 5,
          ),
          y: clamp(
            center.y + (Math.random() - 0.5) * 90,
            5,
            LOGICAL_HEIGHT - 5,
          ),
        });
      }
    });

    updateInfoPanel();
    render();
    setStatus(
      "状态：已生成 " + points.length + " 个示例数据点，可开始聚类",
    );
  }

  function initCentroids(k) {
    centroids = [{ ...points[Math.floor(Math.random() * points.length)] }];
    for (let i = 1; i < k; i++) {
      const distances = points.map(function (point) {
        let min = Infinity;
        centroids.forEach(function (centroid) {
          const distance =
            Math.pow(point.x - centroid.x, 2) +
            Math.pow(point.y - centroid.y, 2);
          if (distance < min) min = distance;
        });
        return min;
      });

      const total = distances.reduce(function (sum, distance) {
        return sum + distance;
      }, 0);
      let randomValue = Math.random() * total;
      let accumulated = 0;
      for (let j = 0; j < distances.length; j++) {
        accumulated += distances[j];
        if (randomValue <= accumulated) {
          centroids.push({ ...points[j] });
          break;
        }
      }
    }
    assignments = [];
    iteration = 0;
    sse = 0;
  }

  function updateCentroidsAfterAssign() {
    iteration++;
    sse = points.reduce(function (sum, point, index) {
      const centroid = centroids[assignments[index]];
      return sum + Math.pow(point.x - centroid.x, 2) + Math.pow(point.y - centroid.y, 2);
    }, 0);

    const sums = centroids.map(function () {
      return { x: 0, y: 0, n: 0 };
    });
    points.forEach(function (point, index) {
      const clusterIndex = assignments[index];
      sums[clusterIndex].x += point.x;
      sums[clusterIndex].y += point.y;
      sums[clusterIndex].n++;
    });

    let maxShift = 0;
    centroids = centroids.map(function (oldCentroid, clusterIndex) {
      if (sums[clusterIndex].n === 0) return oldCentroid;
      const nextX = sums[clusterIndex].x / sums[clusterIndex].n;
      const nextY = sums[clusterIndex].y / sums[clusterIndex].n;
      maxShift = Math.max(
        maxShift,
        Math.abs(nextX - oldCentroid.x) + Math.abs(nextY - oldCentroid.y),
      );
      return { x: nextX, y: nextY };
    });

    return maxShift < 0.5;
  }

  function startAssignAnimation(k) {
    animatingAssign = true;
    assignIndex = 0;
    tickAssign(k);
  }

  function tickAssign(k) {
    if (!isRunning && !isStepMode) {
      animatingAssign = false;
      return;
    }

    if (assignIndex < points.length) {
      const point = points[assignIndex];
      let minDistance = Infinity;
      let bestCluster = 0;
      centroids.forEach(function (centroid, clusterIndex) {
        const distance =
          Math.pow(point.x - centroid.x, 2) +
          Math.pow(point.y - centroid.y, 2);
        if (distance < minDistance) {
          minDistance = distance;
          bestCluster = clusterIndex;
        }
      });
      assignments[assignIndex] = bestCluster;
      assignIndex++;
      render();
      setStatus(
        (isStepMode ? "单步执行 | " : "自动运行 | ") +
          "正在分配第 " +
          assignIndex +
          "/" +
          points.length +
          " 个点",
      );
      autoTimer = setTimeout(function () {
        tickAssign(k);
      }, getPointDelay());
      return;
    }

    animatingAssign = false;
    const converged = updateCentroidsAfterAssign();
    render();
    updateInfoPanel();

    if (converged) {
      isRunning = false;
      isStepMode = false;
      setStatus(
        "聚类完成！共 " +
          iteration +
          " 次迭代，SSE = " +
          sse.toFixed(1),
        "success",
      );
    } else if (isStepMode) {
      setStatus("第 " + iteration + " 轮分配完成，点击单步执行继续");
    } else {
      setStatus("第 " + iteration + " 轮完成，继续下一轮...");
      autoTimer = setTimeout(function () {
        startAssignAnimation(k);
      }, getPointDelay() * 3);
    }
  }

  function startAuto() {
    const k = currentK();
    if (points.length < k) {
      setStatus("状态：至少需要 " + k + " 个数据点", "error");
      return;
    }
    fullReset(false);
    isRunning = true;
    isStepMode = false;
    initCentroids(k);
    render();
    updateInfoPanel();
    setStatus("状态：自动运行中，正在逐点分配...");
    startAssignAnimation(k);
  }

  function stepMode() {
    const k = currentK();
    if (points.length < k) {
      setStatus("状态：至少需要 " + k + " 个数据点", "error");
      return;
    }
    if (animatingAssign) {
      setStatus("正在逐点分配，请等待本轮完成", "error");
      return;
    }

    if (isRunning && isStepMode && iteration > 0) {
      const sums = centroids.map(function () {
        return { x: 0, y: 0, n: 0 };
      });
      assignments.forEach(function (clusterIndex, index) {
        sums[clusterIndex].x += points[index].x;
        sums[clusterIndex].y += points[index].y;
        sums[clusterIndex].n++;
      });
      let maxShift = 0;
      centroids.forEach(function (oldCentroid, clusterIndex) {
        if (sums[clusterIndex].n > 0) {
          maxShift = Math.max(
            maxShift,
            Math.abs(sums[clusterIndex].x / sums[clusterIndex].n - oldCentroid.x) +
              Math.abs(sums[clusterIndex].y / sums[clusterIndex].n - oldCentroid.y),
          );
        }
      });
      if (maxShift < 0.5) {
        isRunning = false;
        isStepMode = false;
        setStatus(
          "聚类已完成（共 " + iteration + " 次迭代），SSE = " + sse.toFixed(1),
          "success",
        );
        return;
      }
    }

    if (!isRunning) {
      fullReset(false);
      isRunning = true;
      isStepMode = true;
      initCentroids(k);
      render();
      updateInfoPanel();
      setStatus("状态：质心已初始化，点击单步执行开始分配");
      return;
    }

    if (!isStepMode) {
      setStatus("状态：自动运行中，请先清空再使用单步模式", "error");
      return;
    }

    startAssignAnimation(k);
  }

  function bindEvents() {
    canvas.addEventListener("pointerdown", function (event) {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (isRunning || animatingAssign) return;
      points.push(getLogicalPos(event));
      updateInfoPanel();
      render();
      setStatus("状态：已添加数据点，可开始聚类");
    });

    canvas.addEventListener("mousemove", function (event) {
      const position = getLogicalPos(event);
      coordDisplay.textContent =
        "鼠标坐标: (" +
        position.x.toFixed(0) +
        ", " +
        position.y.toFixed(0) +
        ")";
    });

    kSlider.addEventListener("input", function () {
      kValueDisplay.textContent = kSlider.value;
      setStatus("状态：K 值已更新，重新运行后生效");
    });

    speedSlider.addEventListener("input", function () {
      speedValueDisplay.textContent = speedSlider.value;
    });

    startBtn.addEventListener("click", startAuto);
    stepBtn.addEventListener("click", stepMode);
    resetBtn.addEventListener("click", function () {
      fullReset(true);
    });
    genBtn.addEventListener("click", generateData);
  }

  function init() {
    setupCanvas();
    bindEvents();
    generateData();
    window.addEventListener("resize", function () {
      setupCanvas();
      render();
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
