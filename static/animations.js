// ============================================================
// VECTOR AI — 3D Physics Animations (Three.js r128)
// ============================================================

const canvas = document.getElementById("physics-canvas");
if (!canvas || typeof THREE === "undefined") {
  console.warn("Physics canvas or Three.js missing.");
}

const PERF = {
  MAX_FPS: 30,
  MAX_PARTICLES: 250,
  SPHERE_DETAIL: 12,
  PLANE_DETAIL: 28,
  PIXEL_RATIO: Math.min(window.devicePixelRatio, window.innerWidth <= 768 ? 1 : 1.5),
  USE_SHADOWS: false,
  USE_FOG: true,
  FRAME_INTERVAL: 1000 / 30,
};

const animConfig = window.animConfig || {
  speed: 1,
  paused: false,
  params: {},
};
window.animConfig = animConfig;

let currentAnim = "idle";
let animId = null;
let currentAnimCleanup = null;

const renderer = canvas
  ? new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "low-power",
    })
  : null;

if (renderer) {
  renderer.setPixelRatio(PERF.PIXEL_RATIO);
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.shadowMap.enabled = PERF.USE_SHADOWS;
  renderer.setClearColor(0x1d2021);
  renderer.domElement.addEventListener(
    "webglcontextlost",
    (e) => {
      e.preventDefault();
      if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
    },
    false
  );
  renderer.domElement.addEventListener(
    "webglcontextrestored",
    () => {
      if (window.loadAnimation) window.loadAnimation(currentAnim);
    },
    false
  );
}

const scene = new THREE.Scene();
scene.fog = PERF.USE_FOG ? new THREE.FogExp2(0x1d2021, 0.04) : null;

const camera = new THREE.PerspectiveCamera(
  60,
  canvas ? canvas.clientWidth / canvas.clientHeight : 1,
  0.1,
  500
);
camera.position.set(0, 4, 14);

// === GRUVBOX COLORS ===
const GRV = {
  green: 0xb8bb26,
  aqua: 0x8ec07c,
  yellow: 0xfabd2f,
  orange: 0xfe8019,
  red: 0xfb4934,
  purple: 0xd3869b,
  blue: 0x83a598,
  bg: 0x282828,
  bgHard: 0x1d2021,
  fg: 0xebdbb2,
  dim: 0x665c54,
};

const MAT = {
  ground: () => new THREE.MeshLambertMaterial({ color: GRV.bg }),
  dim: () => new THREE.MeshLambertMaterial({ color: GRV.dim }),
  green: () => new THREE.MeshPhongMaterial({ color: GRV.green, emissive: GRV.green, emissiveIntensity: 0.3 }),
  aqua: () => new THREE.MeshPhongMaterial({ color: GRV.aqua, emissive: GRV.aqua, emissiveIntensity: 0.2 }),
  orange: () => new THREE.MeshPhongMaterial({ color: GRV.orange, emissive: GRV.orange, emissiveIntensity: 0.25 }),
  yellow: () => new THREE.MeshPhongMaterial({ color: GRV.yellow, emissive: GRV.yellow, emissiveIntensity: 0.2 }),
  red: () => new THREE.MeshPhongMaterial({ color: GRV.red, emissive: GRV.red, emissiveIntensity: 0.2 }),
  blue: () => new THREE.MeshPhongMaterial({ color: GRV.blue, emissive: GRV.blue, emissiveIntensity: 0.2 }),
  wire: (c) => new THREE.MeshBasicMaterial({ color: c, wireframe: true, transparent: true, opacity: 0.12 }),
  line: (c, op = 1) => new THREE.LineBasicMaterial({ color: c, transparent: op < 1, opacity: op }),
  points: (c, size = 0.07) => new THREE.PointsMaterial({ color: c, size, transparent: true, opacity: 0.8 }),
};

const persistentNodes = [];

// === LIGHTS (shared) ===
function setupLights() {
  const ambient = new THREE.AmbientLight(0xffffff, 0.25);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(GRV.fg, 0.8);
  keyLight.position.set(6, 12, 8);
  keyLight.castShadow = false;
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(GRV.aqua, 0.3);
  rimLight.position.set(-8, 4, -6);
  scene.add(rimLight);

  const fillLight = new THREE.PointLight(GRV.green, 0.4, 30);
  fillLight.position.set(0, 8, 0);
  scene.add(fillLight);

  persistentNodes.push(ambient, keyLight, rimLight, fillLight);
}
setupLights();

// === GRID FLOOR ===
function addGrid() {
  const grid = new THREE.GridHelper(40, 40, GRV.dim, GRV.bg);
  grid.position.y = -3;
  grid.material.opacity = 0.35;
  grid.material.transparent = true;
  scene.add(grid);
  return grid;
}
addGrid();

// === HELPERS ===
function updateHUD(title, formula) {
  const titleEl = document.getElementById("hud-title");
  const formulaEl = document.getElementById("hud-formula");
  if (titleEl) titleEl.textContent = title || "";
  if (formulaEl) formulaEl.textContent = formula || "";
}

function updateReadout(data) {
  const el = document.getElementById("anim-readout");
  if (!el) return;
  el.innerHTML = Object.entries(data)
    .map(
      ([k, v]) =>
        `<div class="readout-row"><span class="readout-key">${k}</span><span class="readout-val">${v}</span></div>`
    )
    .join("");
}

function injectControls(controls) {
  const bar = document.getElementById("anim-controls-bar");
  if (!bar) return;
  bar.innerHTML = "";

  const finalControls = Array.isArray(controls) ? [...controls] : [];
  if (!finalControls.find((c) => c.id === "globalSpeed")) {
    finalControls.unshift({
      type: "slider",
      id: "globalSpeed",
      label: "Speed",
      min: 0.25,
      max: 2,
      step: 0.05,
      value: animConfig.speed || 1,
      global: true,
    });
  }

  finalControls.forEach((c) => {
    const group = document.createElement("div");
    group.className = "ctrl-group";
    if (c.type === "slider") {
      const label = document.createElement("label");
      label.textContent = c.label;
      const input = document.createElement("input");
      input.type = "range";
      input.min = c.min;
      input.max = c.max;
      input.step = c.step;
      input.value = c.value;
      input.addEventListener("input", () => {
        const val = parseFloat(input.value);
        if (c.global) {
          animConfig.speed = val;
        } else {
          animConfig.params[c.id] = val;
        }
      });
      group.appendChild(label);
      group.appendChild(input);
    } else if (c.type === "toggle") {
      const btn = document.createElement("button");
      btn.className = "ctrl-btn";
      btn.textContent = c.label;
      if (c.value) btn.classList.add("active");
      btn.addEventListener("click", () => {
        btn.classList.toggle("active");
        animConfig.params[c.id] = btn.classList.contains("active");
      });
      group.appendChild(btn);
    }
    bar.appendChild(group);
  });

  const pauseBtn = document.createElement("button");
  pauseBtn.className = "ctrl-btn";
  pauseBtn.textContent = animConfig.paused ? "▶ Resume" : "⏸ Pause";
  pauseBtn.addEventListener("click", () => {
    animConfig.paused = !animConfig.paused;
    pauseBtn.textContent = animConfig.paused ? "▶ Resume" : "⏸ Pause";
  });
  bar.appendChild(pauseBtn);

  const resetBtn = document.createElement("button");
  resetBtn.className = "ctrl-btn";
  resetBtn.textContent = "↺ Reset";
  resetBtn.addEventListener("click", () => loadAnimation(currentAnim));
  bar.appendChild(resetBtn);
}

function clearScene() {
  if (animId) {
    cancelAnimationFrame(animId);
    animId = null;
  }
  if (currentAnimCleanup) {
    currentAnimCleanup();
    currentAnimCleanup = null;
  }
  scene.traverse((obj) => {
    if (!persistentNodes.includes(obj)) {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    }
  });
  scene.children.slice().forEach((child) => {
    if (!persistentNodes.includes(child)) scene.remove(child);
  });
  addGrid();
  updateReadout({});
  const keBar = document.getElementById("ke-bar");
  if (keBar) keBar.style.display = "none";
}
window.clearScene = clearScene;

let lastFrame = 0;
function throttledLoop(updateFn) {
  function loop(now) {
    animId = requestAnimationFrame(loop);
    if (now - lastFrame < PERF.FRAME_INTERVAL) return;
    const delta = (now - lastFrame) / 1000;
    lastFrame = now;
    if (!animConfig.paused) updateFn(delta);
    updateOrbitCamera();
    if (renderer) renderer.render(scene, camera);
  }
  animId = requestAnimationFrame(loop);
}

// === TOUCH/MOUSE ORBIT ===
let isDragging = false;
let prevX = 0;
let prevY = 0;
let orbitTheta = 0;
let orbitPhi = 0.3;
let orbitRadius = 14;

function setupOrbit() {
  if (!canvas) return;
  const el = canvas;

  el.addEventListener("mousedown", (e) => {
    isDragging = true;
    prevX = e.clientX;
    prevY = e.clientY;
  });
  window.addEventListener("mouseup", () => {
    isDragging = false;
  });
  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    orbitTheta -= (e.clientX - prevX) * 0.008;
    orbitPhi = Math.max(0.1, Math.min(Math.PI / 2, orbitPhi - (e.clientY - prevY) * 0.008));
    prevX = e.clientX;
    prevY = e.clientY;
  });

  el.addEventListener(
    "touchstart",
    (e) => {
      isDragging = true;
      prevX = e.touches[0].clientX;
      prevY = e.touches[0].clientY;
    },
    { passive: true }
  );
  el.addEventListener(
    "touchend",
    () => {
      isDragging = false;
    },
    { passive: true }
  );
  el.addEventListener(
    "touchmove",
    (e) => {
      if (!isDragging) return;
      orbitTheta -= (e.touches[0].clientX - prevX) * 0.008;
      orbitPhi = Math.max(0.1, Math.min(Math.PI / 2, orbitPhi - (e.touches[0].clientY - prevY) * 0.008));
      prevX = e.touches[0].clientX;
      prevY = e.touches[0].clientY;
    },
    { passive: true }
  );

  el.addEventListener(
    "wheel",
    (e) => {
      orbitRadius = Math.max(5, Math.min(30, orbitRadius + e.deltaY * 0.02));
    },
    { passive: true }
  );
}
setupOrbit();

function updateOrbitCamera() {
  camera.position.x = orbitRadius * Math.sin(orbitTheta) * Math.cos(orbitPhi);
  camera.position.y = orbitRadius * Math.sin(orbitPhi) + 2;
  camera.position.z = orbitRadius * Math.cos(orbitTheta) * Math.cos(orbitPhi);
  camera.lookAt(0, 0, 0);
}

function handleAnimResize() {
  if (!canvas || !renderer) return;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

window.handleAnimResize = handleAnimResize;

if (canvas) {
  const ro = new ResizeObserver(() => handleAnimResize());
  ro.observe(canvas);
}

// === ANIMATIONS ===
function renderIdleParticles3D() {
  clearScene();
  updateHUD("Idle Field", "Particle Drift | Φ = ∮B·dA");

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.8, PERF.SPHERE_DETAIL, PERF.SPHERE_DETAIL),
    MAT.aqua()
  );
  scene.add(core);
  const coreLight = new THREE.PointLight(GRV.aqua, 1.5, 20);
  core.add(coreLight);

  const count = Math.min(200, PERF.MAX_PARTICLES);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const angles = new Float32Array(count);
  const radii = new Float32Array(count);
  const speeds = new Float32Array(count);
  const colorOptions = [GRV.green, GRV.aqua, GRV.yellow, GRV.orange, GRV.blue];

  for (let i = 0; i < count; i++) {
    const radius = 2 + Math.random() * 8;
    const angle = Math.random() * Math.PI * 2;
    const height = (Math.random() - 0.5) * 4;
    radii[i] = radius;
    angles[i] = angle;
    speeds[i] = 0.004 + Math.random() * 0.006;

    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = height;
    positions[i * 3 + 2] = Math.sin(angle) * radius;

    const color = new THREE.Color(colorOptions[i % colorOptions.length]);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({ size: 0.08, vertexColors: true, transparent: true, opacity: 0.85 });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  let t = 0;
  throttledLoop((delta) => {
    t += delta * (animConfig.speed || 1);
    for (let i = 0; i < count; i++) {
      angles[i] += speeds[i] * (animConfig.speed || 1);
      positions[i * 3] = Math.cos(angles[i]) * radii[i];
      positions[i * 3 + 2] = Math.sin(angles[i]) * radii[i];
      positions[i * 3 + 1] += Math.sin(t + i) * 0.002;
    }
    geo.attributes.position.needsUpdate = true;
  });
}

function renderProjectile3D() {
  clearScene();
  updateHUD("Projectile Motion", "v² = u² + 2as  |  Range = v₀²sin(2θ)/g");

  let angle = animConfig?.params?.angle ?? 45;
  let v0 = animConfig?.params?.velocity ?? 12;
  const g = 9.8;

  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, PERF.SPHERE_DETAIL, PERF.SPHERE_DETAIL),
    MAT.orange()
  );
  scene.add(ball);

  const ballLight = new THREE.PointLight(GRV.orange, 1.2, 6);
  ball.add(ballLight);
  const velArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), ball.position, 1, GRV.aqua);
  scene.add(velArrow);

  const trailMax = 60;
  const trailPositions = new Float32Array(trailMax * 3);
  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPositions, 3));
  const trail = new THREE.Line(trailGeo, MAT.line(GRV.yellow, 0.5));
  scene.add(trail);

  const platform = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.3, 1.5), MAT.dim());
  platform.position.set(-6, -2.85, 0);
  scene.add(platform);

  let t = 0;
  let trailCount = 0;
  const rad = (angle * Math.PI) / 180;
  const vx = v0 * Math.cos(rad) * 0.25;
  const vy = v0 * Math.sin(rad) * 0.25;

  throttledLoop(() => {
      angle = animConfig?.params?.angle ?? angle;
      v0 = animConfig?.params?.velocity ?? v0;
      const radNow = (angle * Math.PI) / 180;
      const vxNow = v0 * Math.cos(radNow) * 0.25;
      const vyNow = v0 * Math.sin(radNow) * 0.25;

      t += 0.016 * (animConfig?.speed ?? 1);
      const x = vxNow * t - 6;
      const y = vyNow * t - 0.5 * (g * 0.25) * t * t - 2.5;

      if (y < -3) {
        t = 0;
        trailCount = 0;
      }

      ball.position.set(x, y, 0);
      velArrow.position.copy(ball.position);
      const showVectors = !!animConfig?.params?.vectors;
      velArrow.visible = showVectors;
      if (showVectors) {
        velArrow.setDirection(new THREE.Vector3(vxNow, vyNow - g * 0.25 * t, 0).normalize());
        velArrow.setLength(1.5);
      }

      if (trailCount < trailMax) {
        trailPositions.set([x, y, 0], trailCount * 3);
        trailGeo.attributes.position.needsUpdate = true;
        trailGeo.setDrawRange(0, trailCount);
        trailCount++;
      } else {
        for (let i = 0; i < (trailMax - 1) * 3; i++) trailPositions[i] = trailPositions[i + 3];
        trailPositions.set([x, y, 0], (trailMax - 1) * 3);
        trailGeo.attributes.position.needsUpdate = true;
      }

      const speed = Math.sqrt(vxNow ** 2 + (vyNow - g * 0.25 * t) ** 2);
      updateReadout({
        Angle: `${angle.toFixed(0)}°`,
        "v₀": `${v0.toFixed(1)} m/s`,
        Speed: `${(speed * 4).toFixed(1)} m/s`,
        Height: `${Math.max(0, y + 3).toFixed(1)} m`,
      });
  });
}

function renderWave3D() {
  clearScene();
  updateHUD("Wave Motion", "v = fλ  |  y = A·sin(kx - ωt)");

  const W = 40;
  const H = 40;
  const SEG = PERF.PLANE_DETAIL;
  const geo = new THREE.PlaneGeometry(W, H, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshPhongMaterial({
    color: GRV.blue,
    emissive: GRV.blue,
    emissiveIntensity: 0.15,
    wireframe: false,
    side: THREE.DoubleSide,
    vertexColors: false,
    transparent: true,
    opacity: 0.85,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = -1;
  scene.add(mesh);

  const wireMat = MAT.wire(GRV.aqua);
  const wireMesh = new THREE.Mesh(geo.clone(), wireMat);
  scene.add(wireMesh);

  let t = 0;
  const posAttr = geo.attributes.position;

  throttledLoop(() => {
    t += 0.016 * (animConfig?.speed ?? 1);
    const freq = animConfig?.params?.frequency ?? 1;
    const amp = animConfig?.params?.amplitude ?? 1.5;
    const k = freq * 0.8;
    const w = freq * 2;
    const useSuper = !!animConfig?.params?.superposition;

    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const dist = Math.sqrt(x * x + z * z);
      const base = amp * Math.sin(k * dist - w * t);
      const superWave = useSuper ? (amp * 0.6) * Math.sin(k * dist - w * t + Math.PI / 2) : 0;
      posAttr.setY(i, base + superWave);
    }
    posAttr.needsUpdate = true;
    geo.computeVertexNormals();

    updateReadout({
      Frequency: `${freq.toFixed(1)} Hz`,
      Amplitude: `${amp.toFixed(1)} m`,
      λ: `${(2 * Math.PI / k).toFixed(1)} m`,
      Period: `${(2 * Math.PI / w).toFixed(2)} s`,
    });
  });
}

function renderPendulum3D() {
  clearScene();
  updateHUD("Simple Harmonic Motion", "T = 2π√(L/g)  |  F = -kx");

  const L = animConfig?.params?.length ?? 5;
  const startAngle = ((animConfig?.params?.angle ?? 30) * Math.PI) / 180;

  const pivot = new THREE.Object3D();
  pivot.position.set(0, 4, 0);
  scene.add(pivot);

  const rodGeo = new THREE.CylinderGeometry(0.06, 0.06, L, 8);
  rodGeo.translate(0, -L / 2, 0);
  const rod = new THREE.Mesh(rodGeo, MAT.dim());
  pivot.add(rod);

  const bob = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, PERF.SPHERE_DETAIL, PERF.SPHERE_DETAIL),
    MAT.green()
  );
  bob.position.y = -L;
  pivot.add(bob);
  bob.add(new THREE.PointLight(GRV.green, 1.5, 8));

  const velArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, -L, 0),
    1,
    GRV.orange,
    0.3,
    0.2
  );
  pivot.add(velArrow);

  const trailPts = [];
  const trailGeo = new THREE.BufferGeometry();
  const trailLine = new THREE.Line(trailGeo, MAT.line(GRV.yellow, 0.4));
  scene.add(trailLine);

  let t = 0;
  const g = 9.8;
  const omega = Math.sqrt(g / L);

  throttledLoop((delta) => {
    t += delta * (animConfig?.speed ?? 1);
    const theta = startAngle * Math.cos(omega * t);
    const omegaVal = -startAngle * omega * Math.sin(omega * t);
    pivot.rotation.z = theta;

    const speed = Math.abs(omegaVal * L);
    const dir = new THREE.Vector3(Math.sign(omegaVal) * Math.cos(theta), Math.sin(theta), 0).normalize();
    velArrow.setDirection(dir);
    velArrow.setLength(speed * 0.3 + 0.2, 0.3, 0.2);

      const bobWorld = new THREE.Vector3();
      bob.getWorldPosition(bobWorld);
      trailPts.push(bobWorld.clone());
      if (trailPts.length > 120) trailPts.shift();
      trailGeo.setFromPoints(trailPts);

    const T = 2 * Math.PI * Math.sqrt(L / g);
    updateReadout({
      Length: `${L.toFixed(1)} m`,
      Period: `${T.toFixed(2)} s`,
      Angle: `${((theta * 180) / Math.PI).toFixed(1)}°`,
      Speed: `${speed.toFixed(2)} m/s`,
    });
  });
}

function renderForces3D() {
  clearScene();
  updateHUD("Forces & Friction", "F_net = F_applied - F_friction");

  const ground = new THREE.Mesh(
    new THREE.BoxGeometry(40, 0.4, 6),
    new THREE.MeshPhongMaterial({ color: GRV.bg })
  );
  ground.position.y = -2.9;
  scene.add(ground);

  const boxMat = new THREE.MeshPhongMaterial({ color: GRV.aqua, emissive: 0x000000 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1, 1), boxMat);
  box.position.set(-6, -2.1, 0);
  scene.add(box);

  const appliedArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), box.position, 1, GRV.orange);
  const frictionArrow = new THREE.ArrowHelper(new THREE.Vector3(-1, 0, 0), box.position, 1, GRV.red);
  const normalArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), box.position, 1, GRV.green);
  const weightArrow = new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), box.position, 1, GRV.yellow);
  scene.add(appliedArrow, frictionArrow, normalArrow, weightArrow);

  let x = -6;
  let v = 0;

  throttledLoop(() => {
      const applied = animConfig?.params?.applied ?? 20;
      const mu = animConfig?.params?.mu ?? 0.3;
      const mass = animConfig?.params?.mass ?? 5;
      const g = 9.8;
      const normal = mass * g;
      const frictionLimit = mu * normal;
      const dt = 0.016 * (animConfig.speed || 1);

      let friction = 0;
      let net = 0;
      if (Math.abs(v) < 0.01 && Math.abs(applied) <= frictionLimit) {
        friction = applied;
        net = 0;
        v = 0;
      } else {
        const dir = v !== 0 ? Math.sign(v) : Math.sign(applied) || 1;
        friction = frictionLimit * dir;
        net = applied - friction;
        v += (net / mass) * dt;
      }

      x += v * dt;
      if (x > 8) {
        x = 8;
        v = 0;
      } else if (x < -8) {
        x = -8;
        v = 0;
      }
      box.position.x = x;

      const scale = 0.03;
      appliedArrow.position.copy(box.position);
      appliedArrow.setLength(Math.abs(applied) * scale + 0.2);
      appliedArrow.setDirection(new THREE.Vector3(applied >= 0 ? 1 : -1, 0, 0));

      frictionArrow.position.copy(box.position);
      frictionArrow.setLength(Math.abs(friction) * scale + 0.2);
      frictionArrow.setDirection(new THREE.Vector3(friction >= 0 ? 1 : -1, 0, 0));

      normalArrow.position.copy(box.position);
      normalArrow.setLength(normal * scale + 0.2);
      normalArrow.setDirection(new THREE.Vector3(0, 1, 0));

      weightArrow.position.copy(box.position);
      weightArrow.setLength(normal * scale + 0.2);
      weightArrow.setDirection(new THREE.Vector3(0, -1, 0));

      const equilibrium = Math.abs(net) < 0.2 && Math.abs(v) < 0.02;
      boxMat.emissive.setHex(equilibrium ? GRV.green : 0x000000);

      const accel = mass > 0 ? net / mass : 0;
      updateReadout({
        F_net: `${net.toFixed(1)} N`,
        Accel: `${accel.toFixed(2)} m/s²`,
        Velocity: `${v.toFixed(2)} m/s`,
      });
  });
}

function renderCollision3D() {
  clearScene();
  updateHUD("Momentum & Collisions", "p = mv  |  e = (v2' - v1')/(v1 - v2)");

  const track = new THREE.Mesh(
    new THREE.BoxGeometry(20, 0.3, 4),
    MAT.ground()
  );
  track.position.y = -2.9;
  scene.add(track);

  const sphereA = new THREE.Mesh(
    new THREE.SphereGeometry(0.8, PERF.SPHERE_DETAIL, PERF.SPHERE_DETAIL),
    MAT.orange()
  );
  const sphereB = new THREE.Mesh(
    new THREE.SphereGeometry(0.8, PERF.SPHERE_DETAIL, PERF.SPHERE_DETAIL),
    MAT.blue()
  );
  sphereA.position.set(-6, -2.1, 0);
  sphereB.position.set(6, -2.1, 0);
  scene.add(sphereA, sphereB);

  let v1 = animConfig?.params?.vel1 ?? 4;
  let v2 = -(animConfig?.params?.vel2 ?? 2.5);
  let lastVel1 = v1;
  let collided = false;

  const burstCount = 80;
  const burstPositions = new Float32Array(burstCount * 3);
  const burstVelocities = new Float32Array(burstCount * 3);
  const burstGeo = new THREE.BufferGeometry();
  burstGeo.setAttribute("position", new THREE.BufferAttribute(burstPositions, 3));
  const burstMat = new THREE.PointsMaterial({ color: GRV.yellow, size: 0.1, transparent: true, opacity: 0.9 });
  const burstPoints = new THREE.Points(burstGeo, burstMat);
  burstPoints.visible = false;
  scene.add(burstPoints);
  let burstAge = 0;

  function spawnBurst(pos) {
    burstAge = 0;
    burstPoints.visible = true;
    for (let i = 0; i < burstCount; i++) {
      burstPositions[i * 3] = pos.x;
      burstPositions[i * 3 + 1] = pos.y;
      burstPositions[i * 3 + 2] = pos.z;
      burstVelocities[i * 3] = (Math.random() - 0.5) * 6;
      burstVelocities[i * 3 + 1] = Math.random() * 4;
      burstVelocities[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    burstGeo.attributes.position.needsUpdate = true;
  }

  throttledLoop((delta) => {
    const dt = delta * (animConfig.speed || 1);
    const e = animConfig?.params?.elastic ? 1 : 0.2;
    const m1 = animConfig?.params?.mass1 ?? 3;
    const m2 = animConfig?.params?.mass2 ?? 3;
    const vel1Cfg = animConfig?.params?.vel1 ?? 4;
    if (vel1Cfg !== lastVel1) {
      v1 = vel1Cfg;
      v2 = -Math.max(1, vel1Cfg * 0.6);
      lastVel1 = vel1Cfg;
      collided = false;
    }

      sphereA.position.x += v1 * dt;
      sphereB.position.x += v2 * dt;

      const dist = sphereA.position.distanceTo(sphereB.position);
      if (!collided && dist <= 1.6) {
        collided = true;
        const v1p = ((m1 - e * m2) * v1 + (1 + e) * m2 * v2) / (m1 + m2);
        const v2p = ((m2 - e * m1) * v2 + (1 + e) * m1 * v1) / (m1 + m2);
        v1 = v1p;
        v2 = v2p;
        spawnBurst(sphereA.position.clone());
      }

      if (sphereA.position.x > 8 || sphereA.position.x < -8) {
        v1 *= -1;
        collided = false;
      }
      if (sphereB.position.x > 8 || sphereB.position.x < -8) {
        v2 *= -1;
        collided = false;
      }

      if (burstPoints.visible) {
        burstAge += dt;
        const pos = burstGeo.attributes.position.array;
        for (let i = 0; i < pos.length; i += 3) {
          pos[i] += burstVelocities[i] * dt;
          pos[i + 1] += burstVelocities[i + 1] * dt;
          pos[i + 2] += burstVelocities[i + 2] * dt;
          burstVelocities[i + 1] -= 3 * dt;
        }
        burstGeo.attributes.position.needsUpdate = true;
        burstMat.opacity = Math.max(0, 1 - burstAge / 1.6);
        if (burstMat.opacity <= 0) burstPoints.visible = false;
      }

      const pBefore = m1 * vel1Cfg + m2 * v2;
      const pAfter = m1 * v1 + m2 * v2;
      const keBefore = 0.5 * m1 * vel1Cfg * vel1Cfg + 0.5 * m2 * v2 * v2;
      const keAfter = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2;
      updateReadout({
        p_before: `${pBefore.toFixed(1)} kg·m/s`,
        p_after: `${pAfter.toFixed(1)} kg·m/s`,
        KE_before: `${keBefore.toFixed(1)} J`,
        KE_after: `${keAfter.toFixed(1)} J`,
      });
  });
}

function renderOrbit3D() {
  clearScene();
  updateHUD("Gravitation & Orbits", "F = GMm/r²  |  v = √(GM/r)");

  const star = new THREE.Mesh(
    new THREE.SphereGeometry(1.2, PERF.SPHERE_DETAIL, PERF.SPHERE_DETAIL),
    MAT.yellow()
  );
  scene.add(star);
  star.add(new THREE.PointLight(GRV.yellow, 2.0, 40));

  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, PERF.SPHERE_DETAIL, PERF.SPHERE_DETAIL),
    MAT.blue()
  );
  scene.add(planet);

  const trailMax = 120;
  const trailPositions = new Float32Array(trailMax * 3);
  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPositions, 3));
  const trail = new THREE.Line(
    trailGeo,
    new THREE.LineBasicMaterial({ color: GRV.aqua, transparent: true, opacity: 0.5 })
  );
  scene.add(trail);

  const gravityArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), planet.position, 1, GRV.orange);
  scene.add(gravityArrow);

  let theta = 0;
  let trailCount = 0;

  throttledLoop(() => {
    const e = animConfig?.params?.eccentricity ?? 0.3;
    const speed = animConfig?.params?.speed ?? 1;
    const a = 8;
    const r = (a * (1 - e * e)) / (1 + e * Math.cos(theta));
    const omega = 0.01 * speed * (1 / Math.max(0.4, r / a));
    theta += omega * (animConfig.speed || 1);

      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);
      planet.position.set(x, 0, z);

      if (trailCount < trailMax) {
        trailPositions.set([x, 0, z], trailCount * 3);
        trailGeo.setDrawRange(0, trailCount);
        trailCount++;
      } else {
        for (let i = 0; i < (trailMax - 1) * 3; i++) trailPositions[i] = trailPositions[i + 3];
        trailPositions.set([x, 0, z], (trailMax - 1) * 3);
      }
      trailGeo.attributes.position.needsUpdate = true;

      gravityArrow.position.copy(planet.position);
      gravityArrow.setDirection(new THREE.Vector3(-x, 0, -z).normalize());
      gravityArrow.setLength(Math.max(0.8, 6 / r));

    updateReadout({
      Eccentricity: `${e.toFixed(2)}`,
      Radius: `${r.toFixed(2)} AU`,
      Speed: `${(omega * 100).toFixed(2)} rad/s`,
    });
  });
}

function renderElectricField3D() {
  clearScene();
  updateHUD("Electric Fields", "E = kq/r²  |  V = kq/r");

  const separation = animConfig?.params?.separation ?? 6;
  const posCharge = new THREE.Mesh(
    new THREE.SphereGeometry(0.6, PERF.SPHERE_DETAIL, PERF.SPHERE_DETAIL),
    MAT.red()
  );
  const negCharge = new THREE.Mesh(
    new THREE.SphereGeometry(0.6, PERF.SPHERE_DETAIL, PERF.SPHERE_DETAIL),
    MAT.blue()
  );
  posCharge.position.set(-separation / 2, 0, 0);
  negCharge.position.set(separation / 2, 0, 0);
  scene.add(posCharge, negCharge);

  let fieldGroup = new THREE.Group();
  scene.add(fieldGroup);
  let lastSep = null;

  function buildFieldLines() {
    if (fieldGroup) scene.remove(fieldGroup);
    fieldGroup = new THREE.Group();
    const sep = animConfig?.params?.separation ?? separation;
    posCharge.position.set(-sep / 2, 0, 0);
    negCharge.position.set(sep / 2, 0, 0);

    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const start = new THREE.Vector3(
        posCharge.position.x + Math.cos(angle) * 0.8,
        Math.sin(angle) * 0.6,
        Math.cos(angle + Math.PI / 2) * 0.6
      );
      const mid = new THREE.Vector3(0, Math.sin(angle) * 1.2, 0);
      const end = new THREE.Vector3(
        negCharge.position.x - Math.cos(angle) * 0.8,
        Math.sin(angle) * 0.6,
        Math.cos(angle + Math.PI / 2) * 0.6
      );

      const curve = new THREE.CatmullRomCurve3([start, mid, end]);
      const points = curve.getPoints(40);
      const midIndex = Math.floor(points.length / 2);
      const firstCurve = new THREE.CatmullRomCurve3(points.slice(0, midIndex + 1));
      const secondCurve = new THREE.CatmullRomCurve3(points.slice(midIndex));

      const tube1 = new THREE.TubeGeometry(firstCurve, 20, 0.05, 6, false);
      const tube2 = new THREE.TubeGeometry(secondCurve, 20, 0.05, 6, false);
      const mat1 = new THREE.MeshBasicMaterial({ color: GRV.red, transparent: true, opacity: 0.6 });
      const mat2 = new THREE.MeshBasicMaterial({ color: GRV.blue, transparent: true, opacity: 0.6 });
      fieldGroup.add(new THREE.Mesh(tube1, mat1));
      fieldGroup.add(new THREE.Mesh(tube2, mat2));
    }
    scene.add(fieldGroup);
  }

  buildFieldLines();

  throttledLoop(() => {
    const currentSep = animConfig?.params?.separation ?? separation;
    if (currentSep !== lastSep) {
      lastSep = currentSep;
      buildFieldLines();
    }
    updateReadout({
      Separation: `${currentSep.toFixed(1)} m`,
      Field: "Radial",
      "ΔV": "High",
    });
  });
}

function renderMagneticField3D() {
  clearScene();
  updateHUD("Magnetic Fields", "B = μ₀I/2πr  |  F = qv×B");

  const wire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 8, 8),
    MAT.dim()
  );
  scene.add(wire);

  const ringsGroup = new THREE.Group();
  const arrows = [];
  for (let i = -3; i <= 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(3, 0.03, 8, 64),
      new THREE.MeshBasicMaterial({ color: GRV.aqua, transparent: true, opacity: 0.5 })
    );
    ring.position.y = i * 0.6;
    ringsGroup.add(ring);

    const arrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(3, ring.position.y, 0), 0.8, GRV.green);
    arrows.push(arrow);
    ringsGroup.add(arrow);
  }
  scene.add(ringsGroup);

  const particle = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, PERF.SPHERE_DETAIL, PERF.SPHERE_DETAIL),
    MAT.yellow()
  );
  particle.position.set(4, 0, 0);
  scene.add(particle);

  let theta = 0;
  throttledLoop(() => {
    const current = animConfig?.params?.current ?? 5;
    const charge = animConfig?.params?.charge ? 1 : -1;
    theta += 0.02 * (animConfig.speed || 1) * charge * (current / 5);
    particle.position.x = Math.cos(theta) * 4;
    particle.position.z = Math.sin(theta) * 4;
    particle.position.y = Math.sin(theta * 0.5) * 0.8;

    arrows.forEach((arrow) => {
      arrow.setDirection(new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), theta));
      arrow.setLength(Math.max(0.6, current * 0.08));
    });

    updateReadout({
      Current: `${current.toFixed(1)} A`,
      Charge: charge > 0 ? "+" : "-",
      Radius: "4.0 m",
    });
  });
}

function renderRefraction3D() {
  clearScene();
  updateHUD("Refraction", "n₁ sinθ₁ = n₂ sinθ₂");

  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(6, 2.5, 2.5),
    new THREE.MeshLambertMaterial({ color: GRV.blue, transparent: true, opacity: 0.25 })
  );
  slab.position.x = 1;
  scene.add(slab);

  const incidentArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(-6, 0, 0), 5, GRV.yellow);
  const refractedArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 4, GRV.aqua);
  const reflectedArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(-2, 0, 0), 4, GRV.red);
  scene.add(incidentArrow, refractedArrow, reflectedArrow);

  throttledLoop(() => {
    const angle = (animConfig?.params?.angle ?? 35) * (Math.PI / 180);
    const n1 = animConfig?.params?.n1 ?? 1.0;
    const n2 = animConfig?.params?.n2 ?? 1.5;
    const sin2 = (n1 / n2) * Math.sin(angle);
    const tir = Math.abs(sin2) > 1;
    const theta2 = tir ? 0 : Math.asin(sin2);

    incidentArrow.setDirection(new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0).normalize());
    incidentArrow.position.set(-6, -1.2, 0);

    if (tir) {
      refractedArrow.visible = false;
      reflectedArrow.visible = true;
      reflectedArrow.setDirection(new THREE.Vector3(Math.cos(angle), -Math.sin(angle), 0).normalize());
      slab.material.color.setHex(GRV.red);
    } else {
      refractedArrow.visible = true;
      reflectedArrow.visible = false;
      refractedArrow.setDirection(new THREE.Vector3(Math.cos(theta2), Math.sin(theta2), 0).normalize());
      slab.material.color.setHex(GRV.blue);
    }

    const critical = n1 > n2 ? Math.asin(n2 / n1) * (180 / Math.PI) : null;
    updateReadout({
      "θ₁": `${(angle * 180 / Math.PI).toFixed(1)}°`,
      "θ₂": tir ? "TIR" : `${(theta2 * 180 / Math.PI).toFixed(1)}°`,
      "θc": critical ? `${critical.toFixed(1)}°` : "--",
      State: tir ? "TIR" : "Refracted",
    });
  });
}

function renderNuclear3D() {
  clearScene();
  updateHUD("Nuclear Decay", "N = N₀(1/2)^(t/T½)");

  const protonMesh = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.32, PERF.SPHERE_DETAIL, PERF.SPHERE_DETAIL),
    MAT.red(),
    6
  );
  const neutronMesh = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.32, PERF.SPHERE_DETAIL, PERF.SPHERE_DETAIL),
    MAT.yellow(),
    6
  );
  const tempMatrix = new THREE.Matrix4();
  for (let i = 0; i < 6; i++) {
    tempMatrix.setPosition(
      (Math.random() - 0.5) * 1.2,
      (Math.random() - 0.5) * 1.2,
      (Math.random() - 0.5) * 1.2
    );
    protonMesh.setMatrixAt(i, tempMatrix);
  }
  for (let i = 0; i < 6; i++) {
    tempMatrix.setPosition(
      (Math.random() - 0.5) * 1.2,
      (Math.random() - 0.5) * 1.2,
      (Math.random() - 0.5) * 1.2
    );
    neutronMesh.setMatrixAt(i, tempMatrix);
  }
  scene.add(protonMesh, neutronMesh);

  const electronOrbits = [];
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(3 + i * 0.8, 0.02, 8, 64),
      new THREE.MeshBasicMaterial({ color: GRV.aqua, transparent: true, opacity: 0.3 })
    );
    ring.rotation.x = Math.random() * Math.PI;
    ring.rotation.y = Math.random() * Math.PI;
    scene.add(ring);

    const electron = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, PERF.SPHERE_DETAIL, PERF.SPHERE_DETAIL),
      MAT.aqua()
    );
    scene.add(electron);
    electronOrbits.push({ ring, electron, angle: Math.random() * Math.PI * 2, speed: 0.01 + Math.random() * 0.01 });
  }

  const decayParticles = [];
  let decayTimer = 0;

  function spawnDecayParticle() {
    if (decayParticles.length >= 20) {
      const old = decayParticles.shift();
      scene.remove(old);
    }
    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, PERF.SPHERE_DETAIL, PERF.SPHERE_DETAIL),
      MAT.orange()
    );
    particle.position.set(0, 0, 0);
    particle.userData.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 6
    );
    scene.add(particle);
    decayParticles.push(particle);
  }

  throttledLoop(() => {
    const halfLife = animConfig?.params?.halflife ?? 5;
    decayTimer += 0.016 * (animConfig.speed || 1);
    if (decayTimer > halfLife * 0.4) {
      decayTimer = 0;
      spawnDecayParticle();
    }

    electronOrbits.forEach((orbit) => {
      orbit.angle += orbit.speed * (animConfig.speed || 1);
      const radius = orbit.ring.geometry.parameters.radius;
      orbit.electron.position.set(
        Math.cos(orbit.angle) * radius,
        Math.sin(orbit.angle) * radius,
        Math.sin(orbit.angle * 0.5) * 0.6
      );
    });

    decayParticles.forEach((p) => {
      p.position.addScaledVector(p.userData.velocity, 0.016 * (animConfig.speed || 1));
      p.material.opacity = Math.max(0, 1 - p.position.length() / 12);
      p.material.transparent = true;
    });

    updateReadout({
      "T½": `${halfLife.toFixed(1)} s`,
      Particles: `${decayParticles.length}`,
      Energy: "High",
    });
  });
}

function renderPhotoelectric3D() {
  clearScene();
  updateHUD("Photoelectric Effect", "E = hf  |  KE = hf - Φ");

  const surface = new THREE.Mesh(
    new THREE.BoxGeometry(8, 0.4, 4),
    new THREE.MeshPhongMaterial({ color: GRV.dim })
  );
  surface.position.y = -2.4;
  scene.add(surface);

  const photon = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, PERF.SPHERE_DETAIL, PERF.SPHERE_DETAIL),
    MAT.aqua()
  );
  photon.position.set(-6, -1.5, 0);
  scene.add(photon);

  const electron = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, PERF.SPHERE_DETAIL, PERF.SPHERE_DETAIL),
    MAT.aqua()
  );
  electron.position.set(0, -1.8, 0);
  electron.visible = false;
  scene.add(electron);

  let photonV = 3.5;
  let electronV = 0;
  const keBar = document.getElementById("ke-bar");
  const keFill = document.getElementById("ke-fill");

  throttledLoop(() => {
    const frequency = animConfig?.params?.frequency ?? 6;
    const threshold = animConfig?.params?.threshold ?? 5;
    const ke = Math.max(0, frequency - threshold);

    photon.position.x += photonV * 0.016 * (animConfig.speed || 1);
    if (photon.position.x >= -1.5) {
      if (frequency < threshold) {
        photonV *= -1;
      } else {
        photon.position.x = -6;
        electron.visible = true;
        electron.position.set(-1, -1.8, 0);
        electronV = 1 + ke;
      }
    }
    if (photon.position.x < -6) photon.position.x = -6;

    if (electron.visible) {
      electron.position.x += electronV * 0.016 * (animConfig.speed || 1);
      electron.position.y += electronV * 0.01;
      if (electron.position.y > 3) {
        electron.visible = false;
      }
    }

    if (keBar && keFill) {
      keBar.style.display = "block";
      keFill.style.width = `${Math.min(100, ke * 20)}%`;
    }

    updateReadout({
      Frequency: `${frequency.toFixed(1)} THz`,
      Threshold: `${threshold.toFixed(1)} THz`,
      KE: `${ke.toFixed(2)} eV`,
    });
  });
}

function renderThermodynamics3D() {
  clearScene();
  updateHUD("Thermodynamics", "PV = nRT  |  ⟨KE⟩ ∝ T");

  const baseSize = 6;
  let volume = animConfig?.params?.volume ?? 1;
  let temp = animConfig?.params?.temperature ?? 300;

  const boxGeo = new THREE.BoxGeometry(baseSize, baseSize, baseSize);
  const edges = new THREE.EdgesGeometry(boxGeo);
  const box = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: GRV.aqua }));
  scene.add(box);

  const particleCount = 80;
  const particleGeo = new THREE.SphereGeometry(0.15, 6, 6);
  const particleMat = new THREE.MeshLambertMaterial({ color: GRV.blue });
  const particles = new THREE.InstancedMesh(particleGeo, particleMat, particleCount);
  scene.add(particles);

  const positions = new Float32Array(particleCount * 3);
  const velocities = new Float32Array(particleCount * 3);
  const matrix = new THREE.Matrix4();

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * baseSize;
    positions[i * 3 + 1] = (Math.random() - 0.5) * baseSize;
    positions[i * 3 + 2] = (Math.random() - 0.5) * baseSize;
    velocities[i * 3] = (Math.random() - 0.5) * 2;
    velocities[i * 3 + 1] = (Math.random() - 0.5) * 2;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 2;
    matrix.setPosition(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
    particles.setMatrixAt(i, matrix);
  }
  particles.instanceMatrix.needsUpdate = true;

  throttledLoop(() => {
    volume = animConfig?.params?.volume ?? volume;
    temp = animConfig?.params?.temperature ?? temp;
    const size = baseSize * volume;
    box.scale.set(volume, volume, volume);
    const half = size / 2;
    const speedScale = Math.max(0.5, temp / 300);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] += velocities[i * 3] * 0.016 * (animConfig.speed || 1) * speedScale;
      positions[i * 3 + 1] += velocities[i * 3 + 1] * 0.016 * (animConfig.speed || 1) * speedScale;
      positions[i * 3 + 2] += velocities[i * 3 + 2] * 0.016 * (animConfig.speed || 1) * speedScale;

      for (let axis = 0; axis < 3; axis++) {
        const idx = i * 3 + axis;
        if (positions[idx] > half || positions[idx] < -half) {
          velocities[idx] *= -1;
          positions[idx] = Math.max(Math.min(positions[idx], half), -half);
        }
      }

      matrix.setPosition(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      particles.setMatrixAt(i, matrix);
    }
    particles.instanceMatrix.needsUpdate = true;

    updateReadout({
      Temperature: `${temp.toFixed(0)} K`,
      Volume: `${volume.toFixed(2)}x`,
      Particles: `${particleCount}`,
    });
  });
}

function renderDoppler3D() {
  clearScene();
  updateHUD("Doppler Effect", "f' = f (v ± v_o)/(v ∓ v_s)");

  const source = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 24, 24),
    new THREE.MeshPhongMaterial({ color: GRV.purple, emissive: GRV.purple, emissiveIntensity: 0.4 })
  );
  source.position.set(-6, 0, 0);
  scene.add(source);

  const rings = [];
  const ringPool = 8;
  let emitTimer = 0;
  let direction = 1;
  let ringIndex = 0;

  for (let i = 0; i < ringPool; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.6, 0.05, 8, 32),
      new THREE.MeshBasicMaterial({ color: GRV.blue, transparent: true, opacity: 0.0 })
    );
    ring.userData = { scale: 1, active: false };
    scene.add(ring);
    rings.push(ring);
  }

  function emitRing() {
    const ring = rings[ringIndex % ringPool];
    ringIndex += 1;
    ring.position.copy(source.position);
    ring.userData.scale = 1;
    ring.userData.active = true;
    ring.scale.set(1, 1, 1);
    ring.material.opacity = 0.6;
  }

  throttledLoop(() => {
    const speed = animConfig?.params?.speed ?? 2;
    source.position.x += direction * speed * 0.016 * (animConfig.speed || 1);
    if (source.position.x > 6 || source.position.x < -6) direction *= -1;

    emitTimer += 0.016 * (animConfig.speed || 1);
    if (emitTimer > 0.25) {
      emitTimer = 0;
      emitRing();
    }

    rings.forEach((ring) => {
      if (!ring.userData.active) return;
      ring.userData.scale += 0.05 * (animConfig.speed || 1);
      ring.scale.set(ring.userData.scale, ring.userData.scale, ring.userData.scale);
      const isAhead = ring.position.x > source.position.x;
      ring.material.color.setHex(isAhead ? GRV.blue : GRV.red);
      ring.material.opacity = Math.max(0, 1 - ring.userData.scale / 6);
      if (ring.material.opacity <= 0) ring.userData.active = false;
    });

    const vSound = 10;
    const fSource = 1.0;
    const fObserved = fSource * (vSound / (vSound - direction * speed));
    updateReadout({
      f_source: `${fSource.toFixed(2)} Hz`,
      f_observed: `${fObserved.toFixed(2)} Hz`,
      Speed: `${speed.toFixed(1)} m/s`,
    });
  });
}

// === ANIMATION REGISTRY ===
const ANIMATIONS = [
  {
    id: "idle",
    label: "Idle Field",
    icon: "◎",
    render: renderIdleParticles3D,
    controls: [],
  },
  {
    id: "projectile",
    label: "Projectile",
    icon: "↗",
    render: renderProjectile3D,
    controls: [
      { type: "slider", id: "angle", label: "Angle", min: 10, max: 80, step: 1, value: 45 },
      { type: "slider", id: "velocity", label: "Velocity", min: 6, max: 40, step: 1, value: 14 },
      { type: "toggle", id: "vectors", label: "Vectors", value: false },
    ],
  },
  {
    id: "waves",
    label: "Waves",
    icon: "≈",
    render: renderWave3D,
    controls: [
      { type: "slider", id: "frequency", label: "Freq", min: 0.5, max: 4, step: 0.1, value: 1.2 },
      { type: "slider", id: "amplitude", label: "Amplitude", min: 0.5, max: 3, step: 0.1, value: 1.5 },
      { type: "toggle", id: "superposition", label: "Superposition", value: false },
    ],
  },
  {
    id: "pendulum",
    label: "Pendulum",
    icon: "⟲",
    render: renderPendulum3D,
    controls: [
      { type: "slider", id: "length", label: "Length", min: 2, max: 8, step: 0.5, value: 5 },
      { type: "slider", id: "angle", label: "Angle", min: 10, max: 80, step: 1, value: 30 },
    ],
  },
  {
    id: "forces",
    label: "Forces",
    icon: "→",
    render: renderForces3D,
    controls: [
      { type: "slider", id: "applied", label: "Applied", min: 0, max: 50, step: 1, value: 20 },
      { type: "slider", id: "mu", label: "Friction μ", min: 0, max: 1, step: 0.05, value: 0.3 },
      { type: "slider", id: "mass", label: "Mass", min: 1, max: 20, step: 1, value: 5 },
    ],
  },
  {
    id: "collision",
    label: "Collision",
    icon: "◎◎",
    render: renderCollision3D,
    controls: [
      { type: "slider", id: "mass1", label: "Mass A", min: 1, max: 10, step: 0.5, value: 3 },
      { type: "slider", id: "mass2", label: "Mass B", min: 1, max: 10, step: 0.5, value: 3 },
      { type: "slider", id: "vel1", label: "v A", min: 1, max: 8, step: 0.5, value: 4 },
      { type: "toggle", id: "elastic", label: "Elastic", value: true },
    ],
  },
  {
    id: "orbit",
    label: "Orbit",
    icon: "☉",
    render: renderOrbit3D,
    controls: [
      { type: "slider", id: "eccentricity", label: "Ecc", min: 0, max: 0.8, step: 0.05, value: 0.3 },
      { type: "slider", id: "speed", label: "Orbital", min: 0.4, max: 2.5, step: 0.1, value: 1, global: false },
    ],
  },
  {
    id: "electricity",
    label: "Electric",
    icon: "⊕",
    render: renderElectricField3D,
    controls: [
      { type: "slider", id: "separation", label: "Separation", min: 2, max: 10, step: 0.5, value: 6 },
    ],
  },
  {
    id: "magnetism",
    label: "Magnetic",
    icon: "⟳",
    render: renderMagneticField3D,
    controls: [
      { type: "slider", id: "current", label: "Current", min: 1, max: 10, step: 0.5, value: 5 },
      { type: "toggle", id: "charge", label: "+ Charge", value: true },
    ],
  },
  {
    id: "optics",
    label: "Refraction",
    icon: "⤢",
    render: renderRefraction3D,
    controls: [
      { type: "slider", id: "angle", label: "Angle", min: 10, max: 70, step: 1, value: 35 },
      { type: "slider", id: "n1", label: "n1", min: 1, max: 1.5, step: 0.05, value: 1.0 },
      { type: "slider", id: "n2", label: "n2", min: 1, max: 2, step: 0.05, value: 1.5 },
    ],
  },
  {
    id: "nuclear",
    label: "Nuclear",
    icon: "☢",
    render: renderNuclear3D,
    controls: [
      { type: "slider", id: "halflife", label: "Half-life", min: 1, max: 12, step: 0.5, value: 5 },
    ],
  },
  {
    id: "photoelectric",
    label: "Photoelectric",
    icon: "λ",
    render: renderPhotoelectric3D,
    controls: [
      { type: "slider", id: "frequency", label: "Frequency", min: 2, max: 10, step: 0.2, value: 6 },
      { type: "slider", id: "threshold", label: "Threshold", min: 2, max: 8, step: 0.2, value: 5 },
    ],
  },
  {
    id: "thermodynamics",
    label: "Thermo",
    icon: "℃",
    render: renderThermodynamics3D,
    controls: [
      { type: "slider", id: "temperature", label: "Temp", min: 100, max: 800, step: 10, value: 300 },
      { type: "slider", id: "volume", label: "Volume", min: 0.6, max: 1.8, step: 0.05, value: 1 },
    ],
  },
  {
    id: "doppler",
    label: "Doppler",
    icon: "⇄",
    render: renderDoppler3D,
    controls: [
      { type: "slider", id: "speed", label: "Speed", min: 0.5, max: 4, step: 0.1, value: 2 },
    ],
  },
];

function setActiveAnimButton(id) {
  const buttons = document.querySelectorAll(".anim-field-btn");
  buttons.forEach((btn) => btn.classList.toggle("active", btn.dataset.anim === id));
}

function loadAnimation(id) {
  const anim = ANIMATIONS.find((item) => item.id === id) || ANIMATIONS[0];
  currentAnim = anim.id;
  window.currentAnim = currentAnim;
  animConfig.params = {};
  if (Array.isArray(anim.controls)) {
    anim.controls.forEach((c) => {
      if (c.global) return;
      if (c.type === "toggle") {
        animConfig.params[c.id] = !!c.value;
      } else if (c.type === "slider") {
        animConfig.params[c.id] = Number(c.value);
      }
    });
  }
  injectControls(anim.controls);
  anim.render();
  setActiveAnimButton(anim.id);
}

window.loadAnimation = loadAnimation;
window.setActiveAnimButton = setActiveAnimButton;
window.currentAnim = currentAnim;

const sidebar = document.getElementById("anim-sidebar");
if (sidebar) {
  ANIMATIONS.forEach((anim) => {
    const btn = document.createElement("button");
    btn.className = "anim-field-btn";
    btn.dataset.anim = anim.id;
    btn.innerHTML = `<span class="anim-field-icon">${anim.icon}</span>${anim.label}`;
    btn.addEventListener("click", () => loadAnimation(anim.id));
    sidebar.appendChild(btn);
  });
}

if (canvas && renderer) {
  loadAnimation("idle");
}
