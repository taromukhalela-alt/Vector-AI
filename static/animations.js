// ============================================================
// VECTOR AI — Refined 2D Physics Animations
// ============================================================

let canvas = null;
let ctx = null;
let canvasContainer = null;
let resizeObserver = null;

const PERF = {
  PIXEL_RATIO: Math.min(window.devicePixelRatio || 1, 2),
  FRAME_INTERVAL: 1000 / 60,
};

const animConfig = window.animConfig || {
  speed: 1,
  paused: false,
  params: {},
};
window.animConfig = animConfig;

let currentAnim = "idle";
let animId = null;

// === GRUVBOX COLORS ===
const GRV = {
  green: "#b8bb26",
  aqua: "#8ec07c",
  yellow: "#fabd2f",
  orange: "#fe8019",
  red: "#fb4934",
  purple: "#d3869b",
  blue: "#83a598",
  bg: "#282828",
  bgHard: "#1d2021",
  fg: "#ebdbb2",
  dim: "#665c54",
};

function getCanvasSize() {
  const containerRect = canvasContainer?.getBoundingClientRect();
  const canvasRect = canvas?.getBoundingClientRect();
  const width = Math.max(
    Math.floor(containerRect?.width || 0),
    Math.floor(canvasRect?.width || 0),
    960
  );
  const height = Math.max(
    Math.floor(containerRect?.height || 0),
    Math.floor(canvasRect?.height || 0),
    560
  );
  return { width, height };
}

function initScene() {
  canvas = document.getElementById("physics-canvas");
  canvasContainer = document.getElementById("canvas-container") || canvas?.parentElement || null;

  if (!canvas) {
    console.warn("Physics canvas missing.");
    return false;
  }

  ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return false;

  handleAnimResize();
  return true;
}

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
  updateReadout({});
  const keBar = document.getElementById("ke-bar");
  if (keBar) keBar.style.display = "none";
}
window.clearScene = clearScene;

let lastFrame = 0;
function throttledLoop(updateFn) {
  if (!ctx || !canvas) return;
  lastFrame = 0;
  function loop(now) {
    animId = requestAnimationFrame(loop);
    if (lastFrame && now - lastFrame < PERF.FRAME_INTERVAL) return;
    const delta = lastFrame ? (now - lastFrame) / 1000 : PERF.FRAME_INTERVAL / 1000;
    lastFrame = now;
    
    // Clear background
    ctx.fillStyle = GRV.bgHard;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Setup drawing context center
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    // Scale so we have a consistent coordinate system, e.g. -10 to +10
    const scale = Math.min(canvas.width, canvas.height) / 20; 
    ctx.scale(scale, -scale); // Flip Y to match standard math coordinates
    
    if (!animConfig.paused) updateFn(delta, scale);
    else updateFn(0, scale); // Call with 0 delta to just render
    
    ctx.restore();
  }
  animId = requestAnimationFrame(loop);
}

function handleAnimResize() {
  if (!canvas || !ctx) return;
  const { width: w, height: h } = getCanvasSize();
  canvas.width = w * PERF.PIXEL_RATIO;
  canvas.height = h * PERF.PIXEL_RATIO;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
}

window.handleAnimResize = handleAnimResize;

// === DRAWING HELPERS ===
function drawCircle(x, y, radius, color, glow = false) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  if (glow) {
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;
  } else {
    ctx.shadowBlur = 0;
  }
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawLine(x1, y1, x2, y2, color, width = 0.1, dashed = false) {
  ctx.beginPath();
  if (dashed) ctx.setLineDash([0.2, 0.2]);
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  if (dashed) ctx.setLineDash([]);
}

function drawArrow(x1, y1, x2, y2, color, width = 0.1, dashed = false) {
  drawLine(x1, y1, x2, y2, color, width, dashed);
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLen = 0.5;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// === ANIMATIONS ===

function renderIdleParticles2D() {
  clearScene();
  updateHUD("Idle Field", "Particle Drift | 2D Simulation");

  const count = 100;
  const particles = [];
  const colorOptions = [GRV.green, GRV.aqua, GRV.yellow, GRV.orange, GRV.blue];

  for (let i = 0; i < count; i++) {
    particles.push({
      angle: Math.random() * Math.PI * 2,
      radius: 2 + Math.random() * 8,
      speed: 0.002 + Math.random() * 0.004,
      color: colorOptions[i % colorOptions.length],
      size: 0.05 + Math.random() * 0.05,
      yOffset: Math.random() * Math.PI * 2
    });
  }

  let t = 0;
  throttledLoop((delta) => {
    t += delta * (animConfig.speed || 1);
    
    // Core
    drawCircle(0, 0, 0.8, GRV.bg, true);
    ctx.strokeStyle = GRV.aqua;
    ctx.lineWidth = 0.05;
    ctx.beginPath();
    ctx.arc(0, 0, 0.8 + Math.sin(t*2)*0.1, 0, Math.PI*2);
    ctx.stroke();

    particles.forEach((p, i) => {
      p.angle += p.speed * (animConfig.speed || 1) * 60 * delta;
      const x = Math.cos(p.angle) * p.radius;
      const y = Math.sin(p.angle) * p.radius * 0.4 + Math.sin(t + p.yOffset) * 0.5;
      
      ctx.globalAlpha = 0.8;
      drawCircle(x, y, p.size, p.color, true);
    });
    ctx.globalAlpha = 1.0;
  });
}

function renderProjectile2D() {
  clearScene();
  updateHUD("Projectile Motion", "v² = u² + 2as  |  Range = v₀²sin(2θ)/g");

  let angle = animConfig?.params?.angle ?? 45;
  let v0 = animConfig?.params?.velocity ?? 14;
  let e = animConfig?.params?.bounciness ?? 0.6; // restitution
  let h = animConfig?.params?.height ?? 0;
  const g = 9.8;

  let rad = (angle * Math.PI) / 180;
  let vx = v0 * Math.cos(rad) * 0.3;
  let vy = v0 * Math.sin(rad) * 0.3;
  
  let x = -8;
  const startY = -4;
  let y = startY + h;
  
  const trail = [];
  let isStopped = false;

  throttledLoop((delta) => {
    const newAngle = animConfig?.params?.angle ?? 45;
    const newV0 = animConfig?.params?.velocity ?? 14;
    const newE = animConfig?.params?.bounciness ?? 0.6;
    const newH = animConfig?.params?.height ?? 0;
    
    if (angle !== newAngle || v0 !== newV0 || e !== newE || h !== newH) {
      angle = newAngle; v0 = newV0; e = newE; h = newH;
      rad = (angle * Math.PI) / 180;
      vx = v0 * Math.cos(rad) * 0.3;
      vy = v0 * Math.sin(rad) * 0.3;
      x = -8;
      y = startY + h;
      trail.length = 0;
      isStopped = false;
    }

    const dt = delta * (animConfig?.speed ?? 1);

    if (!isStopped && dt > 0) {
      vy -= (g * 0.3) * dt;
      x += vx * dt;
      y += vy * dt;

      if (y < startY) {
        y = startY;
        vy = -vy * e;
        vx = vx * 0.98; // ground friction
        
        if (Math.abs(vy) < 0.5) {
          vy = 0;
        }
        if (vy === 0 && Math.abs(vx) < 0.1) {
          vx = 0;
          isStopped = true;
        }
      }

      if (trail.length === 0 || Math.hypot(trail[trail.length-1].x - x, trail[trail.length-1].y - y) > 0.2) {
        trail.push({x, y});
        if (trail.length > 150) trail.shift();
      }
    }

    // Draw ground
    drawLine(-10, startY, 10, startY, GRV.dim, 0.1);
    
    // Draw trail
    if (trail.length > 1) {
      ctx.beginPath();
      ctx.moveTo(trail[0].x, trail[0].y);
      for (let i = 1; i < trail.length; i++) ctx.lineTo(trail[i].x, trail[i].y);
      ctx.strokeStyle = GRV.yellow;
      ctx.lineWidth = 0.08;
      ctx.stroke();
    }

    // Draw ball
    drawCircle(x, y, 0.3, GRV.orange, true);

    const showVectors = !!animConfig?.params?.vectors;
    if (showVectors && !isStopped) {
      const vScale = 0.3;
      // Vx
      drawArrow(x, y, x + vx * vScale, y, GRV.aqua, 0.05, true);
      // Vy
      drawArrow(x, y, x, y + vy * vScale, GRV.aqua, 0.05, true);
      // V total
      drawArrow(x, y, x + vx * vScale, y + vy * vScale, GRV.green, 0.08);
      // Gravity
      if (y > startY) drawArrow(x, y, x, y - 2, GRV.yellow, 0.08);
    }

    const speed = Math.sqrt(vx ** 2 + vy ** 2);
    updateReadout({
      Angle: `${angle.toFixed(0)}°`,
      "v₀": `${v0.toFixed(1)} m/s`,
      Speed: `${(speed * 3.33).toFixed(1)} m/s`,
      Height: `${Math.max(0, y - startY).toFixed(1)} m`,
      Status: isStopped ? "Stopped" : "Moving"
    });
    
    // Draw height reference if launched from height
    if (h > 0) {
      drawLine(-8.5, startY, -7.5, startY, GRV.dim, 0.05, true);
      drawLine(-8.5, startY + h, -7.5, startY + h, GRV.dim, 0.05, true);
      drawLine(-8, startY, -8, startY + h, GRV.dim, 0.05, true);
    }
  });
}

function renderWave2D() {
  clearScene();
  updateHUD("Wave Motion", "v = fλ  |  y = A·sin(kx - ωt)");

  let t = 0;
  throttledLoop((delta) => {
    t += delta * (animConfig?.speed ?? 1);
    const freq = animConfig?.params?.frequency ?? 1.2;
    const amp = animConfig?.params?.amplitude ?? 1.5;
    const useSuper = !!animConfig?.params?.superposition;
    
    const k = freq * 0.8;
    const w = freq * 2;

    ctx.beginPath();
    for (let x = -10; x <= 10; x += 0.1) {
      const base = amp * Math.sin(k * x - w * t);
      const superWave = useSuper ? (amp * 0.6) * Math.sin(k * x - w * t + Math.PI / 2) : 0;
      const y = base + superWave;
      if (x === -10) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    
    ctx.strokeStyle = GRV.blue;
    ctx.lineWidth = 0.15;
    ctx.shadowBlur = 10;
    ctx.shadowColor = GRV.blue;
    ctx.stroke();
    ctx.shadowBlur = 0;

    if (useSuper) {
      ctx.beginPath();
      for (let x = -10; x <= 10; x += 0.2) {
        const y = amp * Math.sin(k * x - w * t);
        if (x === -10) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = GRV.dim;
      ctx.lineWidth = 0.05;
      ctx.stroke();
    }

    updateReadout({
      Frequency: `${freq.toFixed(1)} Hz`,
      Amplitude: `${amp.toFixed(1)} m`,
      "λ": `${(2 * Math.PI / k).toFixed(1)} m`,
      Period: `${(2 * Math.PI / w).toFixed(2)} s`,
    });
  });
}

function renderPendulum2D() {
  clearScene();
  updateHUD("Simple Harmonic Motion", "T = 2π√(L/g)  |  F = -kx");

  let t = 0;
  const g = 9.8;
  const trail = [];

  throttledLoop((delta) => {
    t += delta * (animConfig?.speed ?? 1);
    const L = animConfig?.params?.length ?? 5;
    const startAngle = ((animConfig?.params?.angle ?? 30) * Math.PI) / 180;
    
    const omega = Math.sqrt(g / L);
    const theta = startAngle * Math.cos(omega * t);
    const omegaVal = -startAngle * omega * Math.sin(omega * t);

    const pivotX = 0;
    const pivotY = 4;
    const bobX = pivotX + L * Math.sin(theta);
    const bobY = pivotY - L * Math.cos(theta);

    if (trail.length === 0 || Math.hypot(trail[trail.length-1].x - bobX, trail[trail.length-1].y - bobY) > 0.1) {
      trail.push({x: bobX, y: bobY});
      if (trail.length > 40) trail.shift();
    }

    // Trail
    if (trail.length > 1) {
      ctx.beginPath();
      ctx.moveTo(trail[0].x, trail[0].y);
      for (let i = 1; i < trail.length; i++) ctx.lineTo(trail[i].x, trail[i].y);
      ctx.strokeStyle = GRV.yellow;
      ctx.lineWidth = 0.05;
      ctx.stroke();
    }

    // Rod
    drawLine(pivotX, pivotY, bobX, bobY, GRV.dim, 0.1);
    
    // Pivot
    drawCircle(pivotX, pivotY, 0.15, GRV.fg);

    // Bob
    drawCircle(bobX, bobY, 0.5, GRV.green, true);

    const showVectors = !!animConfig?.params?.vectors;
    if (showVectors) {
      // Velocity vector (tangent)
      const vx = Math.cos(theta) * omegaVal * L;
      const vy = Math.sin(theta) * omegaVal * L;
      drawArrow(bobX, bobY, bobX + vx * 0.5, bobY + vy * 0.5, GRV.green, 0.08);

      // Gravity (down)
      drawArrow(bobX, bobY, bobX, bobY - 2, GRV.yellow, 0.08);

      // Tension (along string)
      const tx = -Math.sin(theta) * 2;
      const ty = Math.cos(theta) * 2;
      drawArrow(bobX, bobY, bobX + tx, bobY + ty, GRV.aqua, 0.08);
    }

    const speed = Math.abs(omegaVal * L);
    const T = 2 * Math.PI * Math.sqrt(L / g);
    updateReadout({
      Length: `${L.toFixed(1)} m`,
      Period: `${T.toFixed(2)} s`,
      Angle: `${((theta * 180) / Math.PI).toFixed(1)}°`,
      Speed: `${speed.toFixed(2)} m/s`,
    });
  });
}

function renderForces2D() {
  clearScene();
  updateHUD("Forces & Friction", "F_net = F_applied - F_friction");

  let x = -4;
  let v = 0;
  const dust = [];

  throttledLoop((delta) => {
    const applied = animConfig?.params?.applied ?? 20;
    const mu = animConfig?.params?.mu ?? 0.3;
    const mass = animConfig?.params?.mass ?? 5;
    const g = 9.8;
    const normal = mass * g;
    const frictionLimit = mu * normal;
    const dt = delta * (animConfig.speed || 1);

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
    if (x > 6) { x = 6; v = 0; }
    else if (x < -6) { x = -6; v = 0; }

    if (Math.abs(v) > 0.1 && Math.random() < 0.4) {
      dust.push({
        px: x - Math.sign(v) * 0.8,
        py: -2 - 0.4 + Math.random() * 0.3,
        vx: -v * 0.2 + (Math.random() - 0.5) * 0.5,
        vy: Math.random() * 0.5,
        life: 1.0
      });
    }

    const y = -2;
    // Bumpy Ground
    ctx.beginPath();
    ctx.moveTo(-10, y - 0.5);
    for (let gx = -10; gx <= 10; gx += 0.2) {
      const bump = mu * 0.12 * Math.sin(gx * 25);
      ctx.lineTo(gx, y - 0.5 + bump);
    }
    ctx.strokeStyle = GRV.dim;
    ctx.lineWidth = 0.1;
    ctx.stroke();
    drawLine(-10, y - 0.6, 10, y - 0.6, GRV.dim, 0.2); // Solid base

    // Dust
    for (let i = dust.length - 1; i >= 0; i--) {
      let d = dust[i];
      d.px += d.vx * dt;
      d.py += d.vy * dt;
      d.life -= dt * 1.5;
      if (d.life <= 0) {
        dust.splice(i, 1);
      } else {
        ctx.globalAlpha = d.life;
        drawCircle(d.px, d.py, 0.05 + (1 - d.life) * 0.1, GRV.fg);
        ctx.globalAlpha = 1.0;
      }
    }
    
    // Crate Box
    ctx.fillStyle = GRV.bg;
    ctx.fillRect(x - 1, y - 0.5, 2, 2);
    
    const color = Math.abs(net) < 0.2 && Math.abs(v) < 0.02 ? GRV.green : GRV.aqua;
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.1;
    ctx.strokeRect(x - 1, y - 0.5, 2, 2);
    ctx.lineWidth = 0.05;
    ctx.strokeRect(x - 0.8, y - 0.3, 1.6, 1.6);
    drawLine(x - 1, y - 0.5, x + 1, y + 1.5, color, 0.05);
    drawLine(x - 1, y + 1.5, x + 1, y - 0.5, color, 0.05);

    const showVectors = !!animConfig?.params?.vectors;
    if (showVectors) {
      const scale = 0.05;
      // Vectors
      if (applied !== 0) drawArrow(x, y+0.5, x + applied * scale * (applied>=0?1:-1), y+0.5, GRV.orange, 0.08); // Applied
      if (friction !== 0) drawArrow(x, y-0.2, x - friction * scale * Math.sign(v || applied || 1), y-0.2, GRV.red, 0.08); // Friction
      drawArrow(x, y+1.5, x, y+1.5 + normal * scale, GRV.green, 0.08); // Normal
      drawArrow(x, y-0.5, x, y-0.5 - normal * scale, GRV.yellow, 0.08); // Weight
    }

    const accel = mass > 0 ? net / mass : 0;
    updateReadout({
      F_net: `${net.toFixed(1)} N`,
      Accel: `${accel.toFixed(2)} m/s²`,
      Velocity: `${v.toFixed(2)} m/s`,
    });
  });
}

function renderCollision2D() {
  clearScene();
  updateHUD("Momentum & Collisions", "p = mv  |  e = (v2' - v1')/(v1 - v2)");

  let v1 = animConfig?.params?.vel1 ?? 4;
  let v2 = -(animConfig?.params?.vel1 ?? 4) * 0.6; // initial v2 based on v1
  let lastVel1 = v1;
  let collided = false;
  
  let x1 = -5;
  let x2 = 5;

  const bursts = [];

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
      x1 = -5;
      x2 = 5;
    }

    x1 += v1 * dt;
    x2 += v2 * dt;

    const r1 = 0.5 + m1 * 0.1;
    const r2 = 0.5 + m2 * 0.1;

    if (!collided && Math.abs(x1 - x2) <= (r1 + r2)) {
      collided = true;
      const v1p = ((m1 - e * m2) * v1 + (1 + e) * m2 * v2) / (m1 + m2);
      const v2p = ((m2 - e * m1) * v2 + (1 + e) * m1 * v1) / (m1 + m2);
      v1 = v1p;
      v2 = v2p;
      
      // Spawn burst
      for(let i=0; i<15; i++) {
        bursts.push({
          x: (x1+x2)/2, y: 0,
          vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10,
          life: 1.0
        });
      }
    }

    if (x1 > 9 || x1 < -9) { v1 *= -1; collided = false; }
    if (x2 > 9 || x2 < -9) { v2 *= -1; collided = false; }

    // Ground
    drawLine(-10, -r1 - 0.2, 10, -r1 - 0.2, GRV.dim, 0.1);

    // Objects
    drawCircle(x1, 0, r1, GRV.orange, true);
    drawCircle(x2, 0, r2, GRV.blue, true);

    // Bursts
    for (let i = bursts.length - 1; i >= 0; i--) {
      let b = bursts[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt * 2;
      if (b.life <= 0) {
        bursts.splice(i, 1);
      } else {
        ctx.globalAlpha = b.life;
        drawCircle(b.x, b.y, 0.1, GRV.yellow);
        ctx.globalAlpha = 1.0;
      }
    }

    const pBefore = m1 * vel1Cfg + m2 * (-Math.max(1, vel1Cfg * 0.6));
    const pAfter = m1 * v1 + m2 * v2;
    const keBefore = 0.5 * m1 * vel1Cfg ** 2 + 0.5 * m2 * (-Math.max(1, vel1Cfg * 0.6)) ** 2;
    const keAfter = 0.5 * m1 * v1 ** 2 + 0.5 * m2 * v2 ** 2;

    updateReadout({
      p_before: `${pBefore.toFixed(1)} kg·m/s`,
      p_after: `${pAfter.toFixed(1)} kg·m/s`,
      KE_before: `${keBefore.toFixed(1)} J`,
      KE_after: `${keAfter.toFixed(1)} J`,
    });
  });
}

function renderOrbit2D() {
  clearScene();
  updateHUD("Gravitation & Orbits", "F = GMm/r²  |  v = √(GM/r)");

  let theta = 0;
  const trail = [];

  throttledLoop((delta) => {
    const e = animConfig?.params?.eccentricity ?? 0.3;
    const speed = animConfig?.params?.speed ?? 1;
    const a = 6;
    const r = (a * (1 - e * e)) / (1 + e * Math.cos(theta));
    const omega = 0.05 * speed * (1 / Math.max(0.4, (r / a)**2));
    
    theta += omega * delta * (animConfig.speed || 1);

    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta);

    if (trail.length === 0 || Math.hypot(trail[trail.length-1].x - x, trail[trail.length-1].y - y) > 0.2) {
      trail.push({x, y});
      if (trail.length > 100) trail.shift();
    }

    // Trail
    if (trail.length > 1) {
      ctx.beginPath();
      ctx.moveTo(trail[0].x, trail[0].y);
      for (let i = 1; i < trail.length; i++) ctx.lineTo(trail[i].x, trail[i].y);
      ctx.strokeStyle = GRV.aqua;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 0.05;
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }

    // Star
    drawCircle(0, 0, 0.8, GRV.yellow, true);
    
    // Planet
    drawCircle(x, y, 0.3, GRV.blue, true);

    // Gravity Vector
    drawArrow(x, y, x - (x/r)*1.5, y - (y/r)*1.5, GRV.orange, 0.05);

    updateReadout({
      Eccentricity: `${e.toFixed(2)}`,
      Radius: `${r.toFixed(2)} AU`,
      Speed: `${(omega * 10).toFixed(2)} rad/s`,
    });
  });
}

function renderElectricField2D() {
  clearScene();
  updateHUD("Electric Fields", "E = kq/r²  |  V = kq/r");

  throttledLoop(() => {
    const separation = animConfig?.params?.separation ?? 6;
    const x1 = -separation / 2;
    const x2 = separation / 2;

    // Field lines
    ctx.strokeStyle = GRV.dim;
    ctx.lineWidth = 0.05;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(x1, 0);
      
      // Simple arc representation for 2D dipole
      const cpX = 0;
      const cpY = Math.sin(angle) * separation * 1.2;
      
      if (Math.abs(Math.sin(angle)) > 0.01) {
        ctx.quadraticCurveTo(cpX, cpY, x2, 0);
      } else {
        ctx.lineTo(x2, 0);
      }
      ctx.stroke();
    }

    // Charges
    drawCircle(x1, 0, 0.6, GRV.red, true);
    ctx.fillStyle = GRV.bgHard;
    ctx.font = "0.6px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // Need to scale text properly because we flipped Y
    ctx.save();
    ctx.translate(x1, 0);
    ctx.scale(1, -1);
    ctx.fillText("+", 0, 0);
    ctx.restore();

    drawCircle(x2, 0, 0.6, GRV.blue, true);
    ctx.save();
    ctx.translate(x2, 0);
    ctx.scale(1, -1);
    ctx.fillText("-", 0, 0);
    ctx.restore();

    updateReadout({
      Separation: `${separation.toFixed(1)} m`,
      Field: "Dipole",
    });
  });
}

function renderMagneticField2D() {
  clearScene();
  updateHUD("Magnetic Fields", "B = μ₀I/2πr  |  F = qv×B");

  let theta = 0;
  throttledLoop((delta) => {
    const current = animConfig?.params?.current ?? 5;
    const charge = animConfig?.params?.charge ? 1 : -1;
    theta += delta * 2 * (animConfig.speed || 1) * charge * (current / 5);

    // Wire (cross section)
    drawCircle(0, 0, 0.5, GRV.fg);
    ctx.save();
    ctx.scale(1, -1);
    ctx.fillStyle = GRV.bgHard;
    ctx.font = "0.5px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("X", 0, 0); // Current going in
    ctx.restore();

    // B-Field lines
    ctx.strokeStyle = GRV.aqua;
    ctx.lineWidth = 0.05;
    for (let r = 2; r <= 6; r += 2) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      
      // Arrow on field line
      drawArrow(0, r, 0.1, r, GRV.aqua, 0.1);
    }

    // Particle
    const px = Math.cos(theta) * 4;
    const py = Math.sin(theta) * 4;
    drawCircle(px, py, 0.3, charge > 0 ? GRV.red : GRV.blue, true);

    updateReadout({
      Current: `${current.toFixed(1)} A`,
      Charge: charge > 0 ? "+ (Red)" : "- (Blue)",
      Radius: "4.0 m",
    });
  });
}

function renderRefraction2D() {
  clearScene();
  updateHUD("Refraction", "n₁ sinθ₁ = n₂ sinθ₂");

  throttledLoop(() => {
    const angle = (animConfig?.params?.angle ?? 35) * (Math.PI / 180);
    const n1 = animConfig?.params?.n1 ?? 1.0;
    const n2 = animConfig?.params?.n2 ?? 1.5;
    const sin2 = (n1 / n2) * Math.sin(angle);
    const tir = Math.abs(sin2) > 1;
    const theta2 = tir ? 0 : Math.asin(sin2);

    // Interface
    ctx.fillStyle = GRV.bg;
    ctx.fillRect(-10, 0, 20, 10); // Medium 1
    
    ctx.fillStyle = GRV.blue;
    ctx.globalAlpha = 0.2;
    ctx.fillRect(-10, -10, 20, 10); // Medium 2
    ctx.globalAlpha = 1.0;

    drawLine(-10, 0, 10, 0, GRV.fg, 0.1); // Boundary
    drawLine(0, -5, 0, 5, GRV.dim, 0.05); // Normal

    // Incident
    const ix = -Math.sin(angle) * 6;
    const iy = Math.cos(angle) * 6;
    drawArrow(ix, iy, 0, 0, GRV.yellow, 0.1);

    if (tir) {
      // Reflected
      const rx = Math.sin(angle) * 6;
      const ry = Math.cos(angle) * 6;
      drawArrow(0, 0, rx, ry, GRV.red, 0.1);
    } else {
      // Refracted
      const rx = Math.sin(theta2) * 6;
      const ry = -Math.cos(theta2) * 6;
      drawArrow(0, 0, rx, ry, GRV.aqua, 0.1);
      
      // Partial Reflection
      const rlx = Math.sin(angle) * 3;
      const rly = Math.cos(angle) * 3;
      ctx.globalAlpha = 0.3;
      drawArrow(0, 0, rlx, rly, GRV.red, 0.05);
      ctx.globalAlpha = 1.0;
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

function renderNuclear2D() {
  clearScene();
  updateHUD("Nuclear Decay", "N = N₀(1/2)^(t/T½)");

  const nucleus = [];
  for(let i=0; i<12; i++) {
    nucleus.push({
      x: (Math.random()-0.5)*1.5,
      y: (Math.random()-0.5)*1.5,
      type: i < 6 ? 'proton' : 'neutron'
    });
  }

  let decayTimer = 0;
  const particles = [];

  throttledLoop((delta) => {
    const halfLife = animConfig?.params?.halflife ?? 5;
    decayTimer += delta * (animConfig.speed || 1);

    if (decayTimer > halfLife * 0.2) {
      decayTimer = 0;
      particles.push({
        x: 0, y: 0,
        vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10,
        life: 1.0
      });
    }

    // Draw nucleus
    nucleus.forEach(n => {
      drawCircle(n.x, n.y, 0.4, n.type === 'proton' ? GRV.red : GRV.yellow, true);
    });

    // Draw decaying particles
    for (let i = particles.length - 1; i >= 0; i--) {
      let p = particles[i];
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.life -= delta * 0.5;
      if (p.life <= 0) {
        particles.splice(i, 1);
      } else {
        ctx.globalAlpha = p.life;
        drawCircle(p.x, p.y, 0.2, GRV.orange, true);
        ctx.globalAlpha = 1.0;
      }
    }

    updateReadout({
      "T½": `${halfLife.toFixed(1)} s`,
      Emissions: `${particles.length}`,
    });
  });
}

function renderPhotoelectric2D() {
  clearScene();
  updateHUD("Photoelectric Effect", "E = hf  |  KE = hf - Φ");

  let photonX = -8;
  let electronY = 0;
  let electronVisible = false;

  throttledLoop((delta) => {
    const frequency = animConfig?.params?.frequency ?? 6;
    const threshold = animConfig?.params?.threshold ?? 5;
    const ke = Math.max(0, frequency - threshold);
    const speed = (animConfig.speed || 1);

    photonX += 10 * delta * speed;
    
    if (photonX > -2) {
      if (frequency >= threshold) {
        electronVisible = true;
        electronY += (2 + ke * 2) * delta * speed;
      }
      if (photonX > 0 || electronY > 8) {
        photonX = -8;
        electronY = 0;
        electronVisible = false;
      }
    }

    // Metal Surface
    ctx.fillStyle = GRV.dim;
    ctx.fillRect(-4, -2, 8, 2);

    // Photon (Wave-like)
    ctx.beginPath();
    for (let x = photonX - 2; x <= photonX; x += 0.1) {
      const y = -1 + Math.sin((x - photonX) * frequency) * 0.5;
      if (x === photonX - 2) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = GRV.aqua;
    ctx.lineWidth = 0.1;
    ctx.shadowBlur = 10;
    ctx.shadowColor = GRV.aqua;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Electron
    if (electronVisible) {
      drawCircle(0, electronY, 0.2, GRV.blue, true);
    }

    updateReadout({
      Frequency: `${frequency.toFixed(1)} THz`,
      Threshold: `${threshold.toFixed(1)} THz`,
      KE: `${ke.toFixed(2)} eV`,
    });
  });
}

function renderThermodynamics2D() {
  clearScene();
  updateHUD("Thermodynamics", "PV = nRT  |  ⟨KE⟩ ∝ T");

  const particles = [];
  for (let i = 0; i < 50; i++) {
    particles.push({
      x: (Math.random() - 0.5) * 4,
      y: (Math.random() - 0.5) * 4,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5
    });
  }

  throttledLoop((delta) => {
    const volume = animConfig?.params?.volume ?? 1;
    const temp = animConfig?.params?.temperature ?? 300;
    const boxSize = 4 * volume;
    const half = boxSize / 2;
    const speedScale = Math.max(0.5, temp / 300) * (animConfig.speed || 1);

    // Draw Box
    ctx.strokeStyle = GRV.aqua;
    ctx.lineWidth = 0.1;
    ctx.strokeRect(-half, -half, boxSize, boxSize);

    // Particles
    particles.forEach(p => {
      p.x += p.vx * delta * speedScale;
      p.y += p.vy * delta * speedScale;

      if (p.x > half || p.x < -half) {
        p.vx *= -1;
        p.x = Math.max(-half, Math.min(half, p.x));
      }
      if (p.y > half || p.y < -half) {
        p.vy *= -1;
        p.y = Math.max(-half, Math.min(half, p.y));
      }

      drawCircle(p.x, p.y, 0.15, GRV.blue, true);
    });

    updateReadout({
      Temperature: `${temp.toFixed(0)} K`,
      Volume: `${volume.toFixed(2)}x`,
    });
  });
}

function renderDoppler2D() {
  clearScene();
  updateHUD("Doppler Effect", "f' = f (v ± v_o)/(v ∓ v_s)");

  let sourceX = -6;
  let direction = 1;
  let emitTimer = 0;
  const waves = [];

  throttledLoop((delta) => {
    const speed = animConfig?.params?.speed ?? 2;
    const s = speed * (animConfig.speed || 1);
    
    sourceX += direction * s * delta * 5;
    if (sourceX > 6 || sourceX < -6) direction *= -1;

    emitTimer += delta * (animConfig.speed || 1);
    if (emitTimer > 0.2) {
      emitTimer = 0;
      waves.push({ x: sourceX, r: 0 });
    }

    // Draw waves
    ctx.strokeStyle = GRV.aqua;
    ctx.lineWidth = 0.05;
    for (let i = waves.length - 1; i >= 0; i--) {
      let w = waves[i];
      w.r += 10 * delta * (animConfig.speed || 1);
      
      ctx.globalAlpha = Math.max(0, 1 - w.r / 10);
      ctx.beginPath();
      ctx.arc(w.x, 0, w.r, 0, Math.PI * 2);
      ctx.stroke();
      
      if (w.r > 10) waves.splice(i, 1);
    }
    ctx.globalAlpha = 1.0;

    // Draw source
    drawCircle(sourceX, 0, 0.4, GRV.purple, true);

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

// === CHEMISTRY ANIMATIONS ===

function renderGasLaws2D() {
  clearScene();
  updateHUD("Gas Laws", "PV = nRT");

  const particles = [];
  for (let i = 0; i < 40; i++) {
    particles.push({
      x: (Math.random() - 0.5) * 4,
      y: (Math.random() - 0.5) * 4,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4
    });
  }

  throttledLoop((delta) => {
    const temp = animConfig?.params?.temperature ?? 300;
    const vol = animConfig?.params?.volume ?? 1;
    const moles = animConfig?.params?.moles ?? 1;
    
    const height = 4 * vol;
    const width = 6;
    const speedScale = (temp / 200) * (animConfig.speed || 1);

    // Chamber
    ctx.strokeStyle = GRV.red;
    ctx.lineWidth = 0.1;
    ctx.strokeRect(-width/2, -4, width, height);
    
    // Piston
    ctx.fillStyle = GRV.dim;
    ctx.fillRect(-width/2, -4 + height, width, 0.5);

    particles.forEach((p, idx) => {
      if (idx >= 40 * moles) return; // Show/hide based on moles

      p.x += p.vx * delta * speedScale;
      p.y += p.vy * delta * speedScale;

      if (p.x > width/2 || p.x < -width/2) {
        p.vx *= -1;
        p.x = Math.max(-width/2, Math.min(width/2, p.x));
      }
      if (p.y > -4 + height || p.y < -4) {
        p.vy *= -1;
        p.y = Math.max(-4, Math.min(-4 + height, p.y));
      }

      drawCircle(p.x, p.y, 0.15, GRV.yellow, true);
    });

    const pressure = (moles * temp) / (vol * 100);
    updateReadout({
      Temp: `${temp} K`,
      Vol: `${vol.toFixed(1)} L`,
      Pressure: `${pressure.toFixed(2)} atm`,
    });
  });
}

function renderReactionRates2D() {
  clearScene();
  updateHUD("Reaction Rates", "Collisions & Energy");

  const particles = [];
  let collisions = 0;
  
  for (let i = 0; i < 30; i++) {
    particles.push({
      x: (Math.random() - 0.5) * 8,
      y: (Math.random() - 0.5) * 6,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
      type: i % 2 === 0 ? 'A' : 'B'
    });
  }

  throttledLoop((delta) => {
    const temp = animConfig?.params?.temperature ?? 50;
    const conc = animConfig?.params?.concentration ?? 1;
    const cat = animConfig?.params?.catalyst ?? false;
    
    const speedScale = (temp / 30) * (animConfig.speed || 1);
    const activeCount = Math.floor(particles.length * conc);

    for (let i = 0; i < activeCount; i++) {
      let p = particles[i];
      p.x += p.vx * delta * speedScale;
      p.y += p.vy * delta * speedScale;

      if (p.x > 5 || p.x < -5) p.vx *= -1;
      if (p.y > 4 || p.y < -4) p.vy *= -1;

      // Collision check
      for (let j = i + 1; j < activeCount; j++) {
        let p2 = particles[j];
        if (Math.hypot(p.x - p2.x, p.y - p2.y) < (cat ? 0.6 : 0.4)) {
          p.vx *= -1; p2.vx *= -1;
          p.vy *= -1; p2.vy *= -1;
          collisions++;
          
          // Flash
          drawCircle((p.x+p2.x)/2, (p.y+p2.y)/2, 0.8, GRV.yellow, true);
        }
      }

      drawCircle(p.x, p.y, 0.2, p.type === 'A' ? GRV.green : GRV.orange, true);
    }

    updateReadout({
      Temp: `${temp} °C`,
      Conc: `${conc.toFixed(1)} M`,
      Collisions: collisions,
    });
  });
}

function renderBonding2D() {
  clearScene();
  updateHUD("Chemical Bonding", "Ionic vs Covalent");

  let t = 0;
  throttledLoop((delta) => {
    t += delta * (animConfig.speed || 1);
    const ionic = animConfig?.params?.ionic ?? true;
    const en = animConfig?.params?.electroneg ?? 1.5;

    const offset = Math.sin(t * 2) * 0.2;
    const x1 = -2 + offset;
    const x2 = 2 - offset;

    // Bond line
    drawLine(x1, 0, x2, 0, GRV.fg, 0.05);

    // Atoms
    drawCircle(x1, 0, 1.0, GRV.orange, true);
    drawCircle(x2, 0, 1.0, GRV.aqua, true);

    // Electron
    const mix = ionic ? 0.8 : 0.5;
    const ex = x1 + (x2 - x1) * mix;
    const ey = Math.cos(t * 4) * 0.5;
    drawCircle(ex, ey, 0.2, GRV.yellow, true);

    updateReadout({
      Type: ionic ? "Ionic" : "Covalent",
      "ΔEN": en.toFixed(1),
    });
  });
}

function renderAcidBase2D() {
  clearScene();
  updateHUD("Acid-Base", "pH Scale");

  throttledLoop(() => {
    const ph = animConfig?.params?.ph ?? 7;
    const strength = animConfig?.params?.strength ?? 0.5;

    // Scale
    const colors = [GRV.red, GRV.orange, GRV.yellow, GRV.green, GRV.aqua, GRV.blue];
    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = colors[Math.min(5, Math.floor(i / 2.8))];
      ctx.fillRect(-7 + i, -1, 0.9, 2);
    }

    // Indicator
    const ix = -6.5 + ph;
    const iy = 2 + strength * 2;
    drawCircle(ix, iy, 0.4, GRV.fg, true);
    drawLine(ix, iy, ix, -1, GRV.fg, 0.05);

    updateReadout({
      pH: ph.toFixed(1),
      Strength: `${(strength*100).toFixed(0)}%`,
    });
  });
}

function renderElectrochemistry2D() {
  clearScene();
  updateHUD("Electrochemistry", "E°cell");

  let t = 0;
  throttledLoop((delta) => {
    t += delta * (animConfig.speed || 1);
    const volts = animConfig?.params?.voltage ?? 1.5;

    // Beakers
    ctx.strokeStyle = GRV.fg;
    ctx.lineWidth = 0.1;
    ctx.strokeRect(-5, -4, 3, 4); // Left
    ctx.strokeRect(2, -4, 3, 4); // Right
    
    // Solutions
    ctx.fillStyle = GRV.blue; ctx.globalAlpha = 0.3; ctx.fillRect(-5, -4, 3, 3);
    ctx.fillStyle = GRV.orange; ctx.globalAlpha = 0.3; ctx.fillRect(2, -4, 3, 3);
    ctx.globalAlpha = 1.0;

    // Electrodes
    ctx.fillStyle = GRV.dim; ctx.fillRect(-4, -3, 1, 4);
    ctx.fillStyle = GRV.dim; ctx.fillRect(3, -3, 1, 4);

    // Wire & Salt Bridge
    drawLine(-3.5, 1, 3.5, 1, GRV.fg, 0.05);
    ctx.beginPath(); ctx.arc(0, -1, 3.5, 0, Math.PI); ctx.stroke(); // Bridge

    // Electrons
    const ex = -3.5 + ((t * volts) % 1) * 7;
    drawCircle(ex, 1.2, 0.2, GRV.yellow, true);

    updateReadout({
      Voltage: `${volts.toFixed(2)} V`,
    });
  });
}

// ======================
// ANIMATION REGISTRY
// ======================
const ANIMATIONS = [
  { id: "idle", label: "Idle Field", icon: "◎", render: renderIdleParticles2D, controls: [] },
  { id: "projectile", label: "Projectile", icon: "↗", render: renderProjectile2D, controls: [
      { type: "slider", id: "angle", label: "Angle", min: 10, max: 80, step: 1, value: 45 },
      { type: "slider", id: "velocity", label: "Velocity", min: 6, max: 40, step: 1, value: 14 },
      { type: "slider", id: "height", label: "Height", min: 0, max: 10, step: 0.5, value: 0 },
      { type: "slider", id: "bounciness", label: "Bounciness", min: 0, max: 0.9, step: 0.1, value: 0.6 },
      { type: "toggle", id: "vectors", label: "Vectors", value: true },
  ]},
  { id: "waves", label: "Waves", icon: "≈", render: renderWave2D, controls: [
      { type: "slider", id: "frequency", label: "Freq", min: 0.5, max: 4, step: 0.1, value: 1.2 },
      { type: "slider", id: "amplitude", label: "Amplitude", min: 0.5, max: 3, step: 0.1, value: 1.5 },
      { type: "toggle", id: "superposition", label: "Superposition", value: false },
  ]},
  { id: "pendulum", label: "Pendulum", icon: "⟲", render: renderPendulum2D, controls: [
      { type: "slider", id: "length", label: "Length", min: 2, max: 8, step: 0.5, value: 5 },
      { type: "slider", id: "angle", label: "Angle", min: 10, max: 80, step: 1, value: 30 },
      { type: "toggle", id: "vectors", label: "Vectors", value: true },
  ]},
  { id: "forces", label: "Forces", icon: "→", render: renderForces2D, controls: [
      { type: "slider", id: "applied", label: "Applied", min: 0, max: 50, step: 1, value: 20 },
      { type: "slider", id: "mu", label: "Friction μ", min: 0, max: 1, step: 0.05, value: 0.3 },
      { type: "slider", id: "mass", label: "Mass", min: 1, max: 20, step: 1, value: 5 },
      { type: "toggle", id: "vectors", label: "Vectors", value: true },
  ]},
  { id: "collision", label: "Collision", icon: "◎◎", render: renderCollision2D, controls: [
      { type: "slider", id: "mass1", label: "Mass A", min: 1, max: 10, step: 0.5, value: 3 },
      { type: "slider", id: "mass2", label: "Mass B", min: 1, max: 10, step: 0.5, value: 3 },
      { type: "slider", id: "vel1", label: "v A", min: 1, max: 8, step: 0.5, value: 4 },
      { type: "toggle", id: "elastic", label: "Elastic", value: true },
  ]},
  { id: "orbit", label: "Orbit", icon: "☉", render: renderOrbit2D, controls: [
      { type: "slider", id: "eccentricity", label: "Ecc", min: 0, max: 0.8, step: 0.05, value: 0.3 },
      { type: "slider", id: "speed", label: "Orbital", min: 0.4, max: 2.5, step: 0.1, value: 1, global: false },
  ]},
  { id: "electricity", label: "Electric", icon: "⊕", render: renderElectricField2D, controls: [
      { type: "slider", id: "separation", label: "Separation", min: 2, max: 10, step: 0.5, value: 6 },
  ]},
  { id: "magnetism", label: "Magnetic", icon: "⟳", render: renderMagneticField2D, controls: [
      { type: "slider", id: "current", label: "Current", min: 1, max: 10, step: 0.5, value: 5 },
      { type: "toggle", id: "charge", label: "+ Charge", value: true },
  ]},
  { id: "optics", label: "Refraction", icon: "⤢", render: renderRefraction2D, controls: [
      { type: "slider", id: "angle", label: "Angle", min: 10, max: 70, step: 1, value: 35 },
      { type: "slider", id: "n1", label: "n1", min: 1, max: 1.5, step: 0.05, value: 1.0 },
      { type: "slider", id: "n2", label: "n2", min: 1, max: 2, step: 0.05, value: 1.5 },
  ]},
  { id: "nuclear", label: "Nuclear", icon: "☢", render: renderNuclear2D, controls: [
      { type: "slider", id: "halflife", label: "Half-life", min: 1, max: 12, step: 0.5, value: 5 },
  ]},
  { id: "photoelectric", label: "Photoelectric", icon: "λ", render: renderPhotoelectric2D, controls: [
      { type: "slider", id: "frequency", label: "Frequency", min: 2, max: 10, step: 0.2, value: 6 },
      { type: "slider", id: "threshold", label: "Threshold", min: 2, max: 8, step: 0.2, value: 5 },
  ]},
  { id: "thermodynamics", label: "Thermo", icon: "℃", render: renderThermodynamics2D, controls: [
      { type: "slider", id: "temperature", label: "Temp", min: 100, max: 800, step: 10, value: 300 },
      { type: "slider", id: "volume", label: "Volume", min: 0.6, max: 1.8, step: 0.05, value: 1 },
  ]},
  { id: "doppler", label: "Doppler", icon: "⇄", render: renderDoppler2D, controls: [
      { type: "slider", id: "speed", label: "Speed", min: 0.5, max: 4, step: 0.1, value: 2 },
  ]},
  // CHEMISTRY
  { id: "gas_laws", label: "Gas Laws", icon: "GL", render: renderGasLaws2D, controls: [
      { type: "slider", id: "temperature", label: "Temp (K)", min: 100, max: 600, step: 10, value: 300 },
      { type: "slider", id: "volume", label: "Volume (L)", min: 0.5, max: 3, step: 0.1, value: 1 },
      { type: "slider", id: "moles", label: "Moles (n)", min: 0.5, max: 3, step: 0.1, value: 1 },
  ]},
  { id: "reaction_rates", label: "Reaction Rates", icon: "RR", render: renderReactionRates2D, controls: [
      { type: "slider", id: "temperature", label: "Temp", min: 20, max: 100, step: 5, value: 50 },
      { type: "slider", id: "concentration", label: "Conc", min: 0.1, max: 2, step: 0.1, value: 1 },
      { type: "toggle", id: "catalyst", label: "Catalyst", value: false },
  ]},
  { id: "bonding", label: "Bonding", icon: "BD", render: renderBonding2D, controls: [
      { type: "toggle", id: "ionic", label: "Ionic", value: true },
      { type: "toggle", id: "covalent", label: "Covalent", value: false },
      { type: "slider", id: "electroneg", label: "Electroneg diff", min: 0, max: 3, step: 0.1, value: 1.5 },
  ]},
  { id: "acid_base", label: "Acid-Base", icon: "pH", render: renderAcidBase2D, controls: [
      { type: "slider", id: "ph", label: "pH", min: 0, max: 14, step: 0.5, value: 7 },
      { type: "slider", id: "strength", label: "Acid Strength", min: 0, max: 1, step: 0.1, value: 0.5 },
  ]},
  { id: "electrochemistry", label: "Electrochemistry", icon: "EC", render: renderElectrochemistry2D, controls: [
      { type: "slider", id: "voltage", label: "Cell Voltage (V)", min: 0.5, max: 3, step: 0.1, value: 1.5 },
      { type: "slider", id: "concentration", label: "Anode Conc", min: 0.01, max: 2, step: 0.1, value: 1 },
  ]},
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

function bootAnimations() {
  if (!initScene()) return;

  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => handleAnimResize());
    if (canvasContainer) resizeObserver.observe(canvasContainer);
    resizeObserver.observe(canvas);
  } else {
    window.addEventListener("resize", handleAnimResize);
  }

  const sidebar = document.getElementById("anim-sidebar");
  if (sidebar && !sidebar.dataset.ready) {
    ANIMATIONS.forEach((anim) => {
      const btn = document.createElement("button");
      btn.className = "anim-field-btn";
      btn.dataset.anim = anim.id;
      btn.innerHTML = `<span class="anim-field-icon">${anim.icon}</span>${anim.label}`;
      btn.addEventListener("click", () => loadAnimation(anim.id));
      sidebar.appendChild(btn);
    });
    sidebar.dataset.ready = "true";
  }

  loadAnimation("idle");
  window.addEventListener("resize", handleAnimResize);
}

document.addEventListener("DOMContentLoaded", bootAnimations);
