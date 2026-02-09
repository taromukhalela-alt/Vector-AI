const canvas = document.getElementById("sim-canvas");
const ctx = canvas ? canvas.getContext("2d") : null;
const runBtn = document.getElementById("run-sim");
const pauseBtn = document.getElementById("pause-sim");
const resetBtn = document.getElementById("reset-sim");

const inputV0 = document.getElementById("input-v0");
const inputAngle = document.getElementById("input-angle");
const inputMass = document.getElementById("input-mass");
const inputDrag = document.getElementById("input-drag");

const statRange = document.getElementById("stat-range");
const statHeight = document.getElementById("stat-height");
const statTime = document.getElementById("stat-time");
const questionTitle = document.getElementById("question-title");
const questionSubtitle = document.getElementById("question-subtitle");

let animationFrame = null;
let paused = false;
let simData = null;
let index = 0;

const getQuery = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("q");
};

const applyQuestionPreset = (question) => {
  if (!question) return;
  questionTitle.textContent = "Animation for your question";
  questionSubtitle.textContent = question;
  const lower = question.toLowerCase();
  if (lower.includes("projectile") || lower.includes("range")) {
    inputV0.value = 55;
    inputAngle.value = 40;
  } else if (lower.includes("drag")) {
    inputDrag.value = 0.08;
  } else if (lower.includes("energy")) {
    inputMass.value = 2.0;
  }
};

const clearCanvas = () => {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f7eef0";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};

const drawPath = (points, color) => {
  if (!ctx || !points || points.length === 0) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  points.forEach((point, idx) => {
    if (idx === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.stroke();
};

const drawProjectile = (point, color) => {
  if (!ctx || !point) return;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
  ctx.fill();
};

const scalePoints = (xValues, yValues) => {
  const maxX = Math.max(...xValues);
  const maxY = Math.max(...yValues);
  const padding = 40;
  return xValues.map((x, idx) => ({
    x: padding + (x / maxX) * (canvas.width - padding * 2),
    y: canvas.height - padding - (yValues[idx] / maxY) * (canvas.height - padding * 2),
  }));
};

const updateStats = (xValues, yValues, tValues) => {
  if (!xValues.length) return;
  const range = Math.max(...xValues);
  const height = Math.max(...yValues);
  const flightTime = Math.max(...tValues);
  if (statRange) statRange.textContent = `${range.toFixed(1)} m`;
  if (statHeight) statHeight.textContent = `${height.toFixed(1)} m`;
  if (statTime) statTime.textContent = `${flightTime.toFixed(2)} s`;
};

const renderFrame = () => {
  if (!simData || !ctx) return;
  if (paused) {
    animationFrame = requestAnimationFrame(renderFrame);
    return;
  }

  clearCanvas();
  drawPath(simData.path, "#6b1e26");
  if (simData.mlPath) {
    drawPath(simData.mlPath, "#a93643");
  }

  const point = simData.path[index];
  drawProjectile(point, "#6b1e26");
  if (simData.mlPath && simData.mlPath[index]) {
    drawProjectile(simData.mlPath[index], "#a93643");
  }

  index += 1;
  if (index >= simData.path.length) index = simData.path.length - 1;
  animationFrame = requestAnimationFrame(renderFrame);
};

const runSimulation = async () => {
  const payload = {
    v0: Number(inputV0.value),
    angle: Number(inputAngle.value),
    mass: Number(inputMass.value),
    drag: Number(inputDrag.value),
  };

  const response = await fetch("/api/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!data.success) return;

  const xValues = data.physics.x;
  const yValues = data.physics.y;
  const tValues = data.physics.t;
  const path = scalePoints(xValues, yValues);
  const mlPath = data.ml ? scalePoints(data.ml.x, data.ml.y) : null;
  simData = { path, mlPath };
  index = 0;
  paused = false;
  updateStats(xValues, yValues, tValues);
  if (animationFrame) cancelAnimationFrame(animationFrame);
  renderFrame();
};

if (runBtn) runBtn.addEventListener("click", () => runSimulation());
if (pauseBtn) pauseBtn.addEventListener("click", () => (paused = !paused));
if (resetBtn)
  resetBtn.addEventListener("click", () => {
    paused = true;
    index = 0;
    clearCanvas();
  });

applyQuestionPreset(getQuery());
clearCanvas();
