(function () {
    const canvas = document.getElementById("mnist-canvas");
    const context = canvas.getContext("2d");
    let drawing = false;
    context.fillStyle = "#211c35"; context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#ffffff"; context.lineWidth = 22; context.lineCap = "round"; context.lineJoin = "round";
    function point(event) { const rect = canvas.getBoundingClientRect(); return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height }; }
    canvas.addEventListener("pointerdown", function (event) { drawing = true; canvas.setPointerCapture(event.pointerId); const p = point(event); context.beginPath(); context.moveTo(p.x, p.y); });
    canvas.addEventListener("pointermove", function (event) { if (!drawing) return; const p = point(event); context.lineTo(p.x, p.y); context.stroke(); });
    canvas.addEventListener("pointerup", function () { drawing = false; });
    document.getElementById("mnist-clear").addEventListener("click", function () { context.fillStyle = "#211c35"; context.fillRect(0, 0, canvas.width, canvas.height); context.strokeStyle = "#ffffff"; document.getElementById("mnist-result").textContent = "—"; document.getElementById("mnist-status").textContent = "等待书写与识别"; document.getElementById("mnist-chart").textContent = "识别后将在这里展示柱状图"; });
    document.getElementById("mnist-recognize").addEventListener("click", function () { document.getElementById("mnist-result").textContent = "待接入模型"; document.getElementById("mnist-status").textContent = "画板与推理接口已准备好"; document.getElementById("mnist-chart").textContent = "后续接入 TensorFlow.js 后显示 Top-3 置信度"; });
})();
