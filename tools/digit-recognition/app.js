const drawingCanvas = document.querySelector("#drawingCanvas");
const drawingContext = drawingCanvas.getContext("2d", {
  willReadFrequently: true,
});
const previewCanvas = document.querySelector("#previewCanvas");
const previewContext = previewCanvas.getContext("2d", {
  willReadFrequently: true,
});
const clearButton = document.querySelector("#clearButton");
const predictButton = document.querySelector("#predictButton");
const modelStatus = document.querySelector("#modelStatus");
const message = document.querySelector("#message");
const canvasHint = document.querySelector("#canvasHint");
const predictedDigit = document.querySelector("#predictedDigit");
const confidenceText = document.querySelector("#confidenceText");
const probabilityList = document.querySelector("#probabilityList");

let session = null;
let drawing = false;
let hasInk = false;

function initializeCanvas() {
  drawingContext.fillStyle = "#000";
  drawingContext.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  drawingContext.strokeStyle = "#fff";
  drawingContext.lineWidth = 22;
  drawingContext.lineCap = "round";
  drawingContext.lineJoin = "round";

  previewContext.fillStyle = "#000";
  previewContext.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
}

function createProbabilityRows() {
  probabilityList.innerHTML = "";
  for (let digit = 0; digit <= 9; digit += 1) {
    const row = document.createElement("div");
    row.className = "probability-row";
    row.innerHTML = `
            <span>${digit}</span>
            <div class="probability-track"><div class="probability-bar" data-bar="${digit}"></div></div>
            <span class="probability-value" data-value="${digit}">0.0%</span>
        `;
    probabilityList.append(row);
  }
}

function pointerPosition(event) {
  const rect = drawingCanvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) * drawingCanvas.width) / rect.width,
    y: ((event.clientY - rect.top) * drawingCanvas.height) / rect.height,
  };
}

function startDrawing(event) {
  drawing = true;
  hasInk = true;
  canvasHint.classList.add("hidden");
  drawingCanvas.setPointerCapture(event.pointerId);
  const point = pointerPosition(event);
  drawingContext.beginPath();
  drawingContext.moveTo(point.x, point.y);
  drawingContext.lineTo(point.x + 0.01, point.y + 0.01);
  drawingContext.stroke();
}

function draw(event) {
  if (!drawing) return;
  const point = pointerPosition(event);
  drawingContext.lineTo(point.x, point.y);
  drawingContext.stroke();
}

function stopDrawing(event) {
  if (!drawing) return;
  drawing = false;
  drawingContext.closePath();
  if (drawingCanvas.hasPointerCapture(event.pointerId)) {
    drawingCanvas.releasePointerCapture(event.pointerId);
  }
}

function resetResults() {
  predictedDigit.textContent = "—";
  confidenceText.textContent = "等待识别";
  document.querySelectorAll(".probability-bar").forEach((bar) => {
    bar.style.width = "0";
  });
  document.querySelectorAll(".probability-value").forEach((value) => {
    value.textContent = "0.0%";
  });
  previewContext.fillStyle = "#000";
  previewContext.fillRect(0, 0, 28, 28);
}

function clearCanvas() {
  drawingContext.fillStyle = "#000";
  drawingContext.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  hasInk = false;
  canvasHint.classList.remove("hidden");
  resetResults();
  message.textContent = session
    ? "请在画板中央写一个数字。"
    : "请等待模型加载完成。";
}

function findInkBounds(imageData) {
  const { data, width, height } = imageData;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const value = data[(y * width + x) * 4];
      if (value > 20) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  return maxX < minX ? null : { minX, minY, maxX, maxY };
}

function preprocessCanvas() {
  const source = drawingContext.getImageData(
    0,
    0,
    drawingCanvas.width,
    drawingCanvas.height,
  );
  const bounds = findInkBounds(source);
  if (!bounds) return null;

  const sourceWidth = bounds.maxX - bounds.minX + 1;
  const sourceHeight = bounds.maxY - bounds.minY + 1;
  const scale = 20 / Math.max(sourceWidth, sourceHeight);
  const targetWidth = Math.max(1, Math.round(sourceWidth * scale));
  const targetHeight = Math.max(1, Math.round(sourceHeight * scale));
  const offsetX = Math.floor((28 - targetWidth) / 2);
  const offsetY = Math.floor((28 - targetHeight) / 2);

  previewContext.fillStyle = "#000";
  previewContext.fillRect(0, 0, 28, 28);
  previewContext.imageSmoothingEnabled = true;
  previewContext.imageSmoothingQuality = "high";
  previewContext.drawImage(
    drawingCanvas,
    bounds.minX,
    bounds.minY,
    sourceWidth,
    sourceHeight,
    offsetX,
    offsetY,
    targetWidth,
    targetHeight,
  );

  const processed = previewContext.getImageData(0, 0, 28, 28).data;
  const input = new Float32Array(28 * 28);
  for (let index = 0; index < input.length; index += 1) {
    input[index] = processed[index * 4] / 255;
  }
  return input;
}

function softmax(values) {
  const maxValue = Math.max(...values);
  const exponents = values.map((value) => Math.exp(value - maxValue));
  const total = exponents.reduce((sum, value) => sum + value, 0);
  return exponents.map((value) => value / total);
}

function showProbabilities(probabilities) {
  probabilities.forEach((probability, digit) => {
    const percent = probability * 100;
    document.querySelector(`[data-bar="${digit}"]`).style.width = `${percent}%`;
    document.querySelector(`[data-value="${digit}"]`).textContent =
      `${percent.toFixed(1)}%`;
  });
}

async function predict() {
  if (!session || !hasInk) {
    message.textContent = session ? "请先写一个数字。" : "模型尚未加载完成。";
    return;
  }

  predictButton.disabled = true;
  message.textContent = "正在识别…";
  try {
    const inputData = preprocessCanvas();
    if (!inputData) throw new Error("画板中没有有效笔迹");
    const inputTensor = new ort.Tensor("float32", inputData, [1, 1, 28, 28]);
    const results = await session.run({ [session.inputNames[0]]: inputTensor });
    const scores = Array.from(results[session.outputNames[0]].data);
    const probabilities = softmax(scores);
    const bestDigit = probabilities.indexOf(Math.max(...probabilities));

    predictedDigit.textContent = String(bestDigit);
    confidenceText.textContent = `置信度 ${(probabilities[bestDigit] * 100).toFixed(1)}%`;
    showProbabilities(probabilities);
    message.textContent = "识别完成。结果仅供互动演示。";
  } catch (error) {
    console.error(error);
    message.textContent = `识别失败：${error.message}`;
  } finally {
    predictButton.disabled = false;
  }
}

async function loadModel() {
  try {
    ort.env.wasm.wasmPaths = new URL("vendor/", window.location.href).href;
    ort.env.wasm.numThreads = 1;
    session = await ort.InferenceSession.create("model/mnist-8.onnx", {
      executionProviders: ["wasm"],
    });
    modelStatus.textContent = "模型已就绪";
    modelStatus.classList.add("ready");
    predictButton.disabled = false;
    message.textContent = "请在画板中央写一个数字。";
  } catch (error) {
    console.error(error);
    modelStatus.textContent = "模型加载失败";
    modelStatus.classList.add("error");
    message.textContent = `模型加载失败：${error.message}`;
  }
}

drawingCanvas.addEventListener("pointerdown", startDrawing);
drawingCanvas.addEventListener("pointermove", draw);
drawingCanvas.addEventListener("pointerup", stopDrawing);
drawingCanvas.addEventListener("pointercancel", stopDrawing);
clearButton.addEventListener("click", clearCanvas);
predictButton.addEventListener("click", predict);

initializeCanvas();
createProbabilityRows();
loadModel();
