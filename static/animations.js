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
let currentAnimationId = "projectile";
let backgroundType = "light";
let backgroundColor = "#f7eef0";
let actualColor = "#6b1e26";
let mlColor = "#a93643";
let currentGravity = 9.8;

const getAnimConfig = () => window.animConfig || {};

const intToHex = (value, fallback) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return `#${value.toString(16).padStart(6, "0")}`;
};

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
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (backgroundType === "grid") {
    ctx.strokeStyle = "rgba(107, 30, 38, 0.08)";
    ctx.lineWidth = 1;
    const spacing = 32;
    for (let x = 0; x <= canvas.width; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }
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
  const config = getAnimConfig();
  if (paused || config.paused) {
    animationFrame = requestAnimationFrame(renderFrame);
    return;
  }

  clearCanvas();
  if (config.showTrails !== false) {
    drawPath(simData.path, actualColor);
    if (simData.mlPath) {
      drawPath(simData.mlPath, mlColor);
    }
  }

  const idx = Math.min(simData.path.length - 1, Math.floor(index));
  const point = simData.path[idx];
  drawProjectile(point, actualColor);
  if (simData.mlPath && simData.mlPath[idx]) {
    drawProjectile(simData.mlPath[idx], mlColor);
  }

  const speed = Number(config.speed) || 1;
  index += speed;
  if (index >= simData.path.length) index = simData.path.length - 1;
  animationFrame = requestAnimationFrame(renderFrame);
};

const runSimulation = async () => {
  const payload = {
    v0: Number(inputV0.value),
    angle: Number(inputAngle.value),
    mass: Number(inputMass.value),
    drag: Number(inputDrag.value),
    gravity: currentGravity,
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

const setPaused = (value) => {
  paused = value;
  const config = getAnimConfig();
  if (config) config.paused = value;
  if (pauseBtn) pauseBtn.textContent = value ? "Resume" : "Pause";
  const cfgPause = document.getElementById("cfg-pause");
  if (cfgPause) cfgPause.textContent = value ? "Resume" : "Pause";
};

const rebuildCurrentAnimation = () => {
  if (currentAnimationId === "projectile") {
    runSimulation();
  } else {
    clearCanvas();
    if (ctx && canvas) {
      ctx.fillStyle = "rgba(59, 15, 20, 0.6)";
      ctx.font = "16px \"Source Sans 3\", sans-serif";
      ctx.fillText("Animation coming soon.", 24, 36);
    }
    if (statRange) statRange.textContent = "--";
    if (statHeight) statHeight.textContent = "--";
    if (statTime) statTime.textContent = "--";
  }
};

const updateSceneColors = () => {
  const config = getAnimConfig();
  actualColor = intToHex(config.primaryColor, actualColor);
  mlColor = intToHex(config.secondaryColor, mlColor);
};

const updateLabelVisibility = () => {};

const updateAnimationParam = (paramId, value) => {
  if (currentAnimationId !== "projectile") return;
  if (paramId === "angle" && inputAngle) inputAngle.value = value;
  if (paramId === "velocity" && inputV0) inputV0.value = value;
  if (paramId === "mass" && inputMass) inputMass.value = value;
  if (paramId === "drag" && inputDrag) inputDrag.value = value;
  if (paramId === "gravity") currentGravity = value;
  if (simData) rebuildCurrentAnimation();
};

const setBackground = (type, color) => {
  backgroundType = type;
  backgroundColor = color || backgroundColor;
  clearCanvas();
};

const loadAnimation = (animation) => {
  if (!animation) return;
  currentAnimationId = animation.id;
  if (questionTitle) questionTitle.textContent = animation.label || "Physics Animation";
  if (questionSubtitle) questionSubtitle.textContent = animation.description || "Tune the parameters and press run.";
  if (window.injectPhysicsParams) window.injectPhysicsParams(animation.id);
  rebuildCurrentAnimation();
};

const PHYSICS_ANIMATIONS = [
  { id: "projectile", label: "Projectile Motion", description: "Launch angle and speed control a parabolic path." },
  { id: "waves", label: "Wave Motion", description: "Frequency and amplitude change wave shape." },
  { id: "forces", label: "Newtons Laws", description: "Forces and friction determine acceleration." },
  { id: "collision", label: "Momentum and Collisions", description: "Mass and velocity affect momentum transfer." },
  { id: "energy", label: "Conservation of Energy", description: "Track energy changes through a system." },
  { id: "orbit", label: "Gravitation and Orbits", description: "Explore orbital paths and eccentricity." },
  { id: "electricity", label: "Electric Fields", description: "Visualize electric field behavior." },
  { id: "magnetism", label: "Magnetic Fields", description: "Magnetic forces and field lines." },
  { id: "optics", label: "Refraction and Optics", description: "Light bending and lens effects." },
  { id: "nuclear", label: "Nuclear Decay", description: "Half-life and decay rates." },
  { id: "thermodynamics", label: "Gas and Thermodynamics", description: "Temperature and volume changes." },
  { id: "pendulum", label: "Simple Harmonic Motion", description: "Pendulum length and angle affect period." },
];

if (runBtn) runBtn.addEventListener("click", () => runSimulation());
if (pauseBtn) pauseBtn.addEventListener("click", () => setPaused(!paused));
if (resetBtn)
  resetBtn.addEventListener("click", () => {
    setPaused(true);
    index = 0;
    clearCanvas();
  });

applyQuestionPreset(getQuery());
clearCanvas();

window.rebuildCurrentAnimation = rebuildCurrentAnimation;
window.updateLabelVisibility = updateLabelVisibility;
window.updateSceneColors = updateSceneColors;
window.updateAnimationParam = updateAnimationParam;
window.applyBackground = setBackground;
window.loadAnimation = loadAnimation;
window.PHYSICS_ANIMATIONS = PHYSICS_ANIMATIONS;
window.setPaused = setPaused;
