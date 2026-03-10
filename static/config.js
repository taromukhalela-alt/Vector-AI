// === GLOBAL ANIMATION CONFIG ===
const animConfig = {
  speed: 1,
  showTrails: true,
  showLabels: true,
  showVectors: true,
  primaryColor: 0xb8bb26,
  secondaryColor: 0x8ec07c,
  background: "dark",
  particleCount: 200,
  paused: false,
  params: {},
};

window.animConfig = animConfig;

const byId = (id) => document.getElementById(id);

const speedInput = byId("cfg-speed");
const speedVal = byId("cfg-speed-val");
const trailsToggle = byId("cfg-trails");
const labelsToggle = byId("cfg-labels");
const vectorsToggle = byId("cfg-vectors");
const pauseBtn = byId("cfg-pause");
const resetBtn = byId("cfg-reset");
const primaryColor = byId("cfg-color-primary");
const secondaryColor = byId("cfg-color-secondary");
const backgroundSelect = byId("cfg-bg");
const particlesInput = byId("cfg-particles");
const particlesVal = byId("cfg-particles-val");

if (speedInput) {
  speedInput.addEventListener("input", (e) => {
    animConfig.speed = parseFloat(e.target.value);
    if (speedVal) speedVal.textContent = `${animConfig.speed}x`;
  });
}

if (trailsToggle) {
  trailsToggle.addEventListener("change", (e) => {
    animConfig.showTrails = e.target.checked;
    if (window.rebuildCurrentAnimation) window.rebuildCurrentAnimation();
  });
}

if (labelsToggle) {
  labelsToggle.addEventListener("change", (e) => {
    animConfig.showLabels = e.target.checked;
    if (window.updateLabelVisibility) window.updateLabelVisibility();
  });
}

if (vectorsToggle) {
  vectorsToggle.addEventListener("change", (e) => {
    animConfig.showVectors = e.target.checked;
  });
}

if (pauseBtn) {
  pauseBtn.addEventListener("click", () => {
    animConfig.paused = !animConfig.paused;
    pauseBtn.textContent = animConfig.paused ? "Resume" : "Pause";
    if (window.setPaused) window.setPaused(animConfig.paused);
  });
}

if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    if (window.rebuildCurrentAnimation) window.rebuildCurrentAnimation();
  });
}

if (primaryColor) {
  primaryColor.addEventListener("input", (e) => {
    animConfig.primaryColor = parseInt(e.target.value.replace("#", ""), 16);
    if (window.updateSceneColors) window.updateSceneColors();
  });
}

if (secondaryColor) {
  secondaryColor.addEventListener("input", (e) => {
    animConfig.secondaryColor = parseInt(e.target.value.replace("#", ""), 16);
    if (window.updateSceneColors) window.updateSceneColors();
  });
}

if (backgroundSelect) {
  backgroundSelect.addEventListener("change", (e) => {
    animConfig.background = e.target.value;
    applyBackground(e.target.value);
  });
}

if (particlesInput) {
  particlesInput.addEventListener("input", (e) => {
    animConfig.particleCount = parseInt(e.target.value, 10);
    if (particlesVal) particlesVal.textContent = `${animConfig.particleCount}`;
  });
}

function applyBackground(type) {
  const bgMap = {
    dark: "#1d2021",
    space: "#050514",
    grid: "#f4ecee",
    minimal: "#ffffff",
  };
  if (window.applyBackground) window.applyBackground(type, bgMap[type] || "#f7eef0");
}

// === PER-ANIMATION PHYSICS PARAMS ===
const ANIM_CONFIG_SCHEMAS = {
  projectile: [
    { id: "angle", label: "Launch Angle", min: 5, max: 85, step: 1, default: 45, unit: " deg" },
    { id: "velocity", label: "Init Velocity", min: 5, max: 100, step: 1, default: 50, unit: " m/s" },
    { id: "gravity", label: "Gravity", min: 1, max: 25, step: 0.1, default: 9.8, unit: " m/s^2" },
    { id: "mass", label: "Mass", min: 0.2, max: 10, step: 0.1, default: 1, unit: " kg" },
    { id: "drag", label: "Drag", min: 0, max: 0.2, step: 0.01, default: 0.02, unit: "" },
  ],
  waves: [
    { id: "frequency", label: "Frequency", min: 0.5, max: 5, step: 0.1, default: 1, unit: " Hz" },
    { id: "amplitude", label: "Amplitude", min: 0.5, max: 4, step: 0.1, default: 2, unit: " m" },
    { id: "speed", label: "Wave Speed", min: 1, max: 10, step: 0.5, default: 3, unit: " m/s" },
  ],
  forces: [
    { id: "applied", label: "Applied Force", min: 0, max: 50, step: 1, default: 20, unit: " N" },
    { id: "mu", label: "Friction (mu)", min: 0, max: 1, step: 0.05, default: 0.3, unit: "" },
    { id: "mass", label: "Mass", min: 1, max: 20, step: 1, default: 5, unit: " kg" },
  ],
  pendulum: [
    { id: "length", label: "Length", min: 1, max: 10, step: 0.5, default: 3, unit: " m" },
    { id: "angle", label: "Start Angle", min: 5, max: 85, step: 1, default: 30, unit: " deg" },
    { id: "gravity", label: "Gravity", min: 1, max: 25, step: 0.1, default: 9.8, unit: " m/s^2" },
  ],
  orbit: [
    { id: "eccentricity", label: "Eccentricity", min: 0, max: 0.9, step: 0.05, default: 0.3, unit: "" },
    { id: "speed", label: "Orbital Speed", min: 0.2, max: 3, step: 0.1, default: 1, unit: "x" },
  ],
  collision: [
    { id: "mass1", label: "Mass A", min: 1, max: 10, step: 0.5, default: 3, unit: " kg" },
    { id: "mass2", label: "Mass B", min: 1, max: 10, step: 0.5, default: 3, unit: " kg" },
    { id: "vel1", label: "Velocity A", min: 1, max: 10, step: 0.5, default: 5, unit: " m/s" },
  ],
  nuclear: [
    { id: "halflife", label: "Half-life", min: 1, max: 20, step: 1, default: 5, unit: " s" },
    { id: "atomcount", label: "Atoms", min: 10, max: 100, step: 5, default: 40, unit: "" },
  ],
  thermodynamics: [
    { id: "temperature", label: "Temperature", min: 50, max: 1000, step: 10, default: 300, unit: " K" },
    { id: "volume", label: "Volume", min: 0.5, max: 3, step: 0.1, default: 1, unit: "x" },
  ],
};

function injectPhysicsParams(animId) {
  const schema = ANIM_CONFIG_SCHEMAS[animId];
  const container = byId("cfg-physics-params");
  if (!container) return;

  container.innerHTML = '<h4 class="config-heading">Physics Parameters</h4>';

  if (!schema) {
    const hint = document.createElement("p");
    hint.className = "config-hint";
    hint.textContent = "No configurable parameters for this animation.";
    container.appendChild(hint);
    return;
  }

  schema.forEach((param) => {
    animConfig.params[param.id] = param.default;
    if (window.updateAnimationParam) {
      window.updateAnimationParam(param.id, param.default);
    }

    const wrapper = document.createElement("label");
    const valueSpan = document.createElement("span");
    valueSpan.textContent = `${param.default}${param.unit}`;

    const slider = document.createElement("input");
    slider.type = "range";
    slider.id = `cfg-param-${param.id}`;
    slider.min = param.min;
    slider.max = param.max;
    slider.step = param.step;
    slider.value = param.default;

    slider.addEventListener("input", (e) => {
      animConfig.params[param.id] = parseFloat(e.target.value);
      valueSpan.textContent = `${e.target.value}${param.unit}`;
      if (window.updateAnimationParam) {
        window.updateAnimationParam(param.id, parseFloat(e.target.value));
      }
    });

    wrapper.innerHTML = `${param.label} `;
    wrapper.appendChild(slider);
    wrapper.appendChild(valueSpan);
    container.appendChild(wrapper);
  });
}

window.injectPhysicsParams = injectPhysicsParams;

// === AUTO-MATCH: Question -> Animation ===
const matchBtn = byId("cfg-match-btn");
if (matchBtn) {
  matchBtn.addEventListener("click", async () => {
    const questionEl = byId("cfg-question");
    const resultDiv = byId("cfg-match-result");
    const question = questionEl ? questionEl.value.trim() : "";
    if (!question || !resultDiv) return;

    resultDiv.textContent = "Matching...";

    try {
      const res = await fetch("/match-animation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();

      if (data.animation_id && window.PHYSICS_ANIMATIONS) {
        resultDiv.innerHTML = `<span class="match-found">Loading: ${data.animation_label}</span>`;
        const matched = window.PHYSICS_ANIMATIONS.find((a) => a.id === data.animation_id);
        if (matched && window.loadAnimation) window.loadAnimation(matched);
      } else {
        resultDiv.textContent = "No close match found. Try rephrasing.";
      }
    } catch (err) {
      resultDiv.textContent = "Could not match. Check your connection.";
    }
  });
}

if (window.injectPhysicsParams) {
  window.injectPhysicsParams("projectile");
}

applyBackground("dark");
if (window.updateSceneColors) window.updateSceneColors();
