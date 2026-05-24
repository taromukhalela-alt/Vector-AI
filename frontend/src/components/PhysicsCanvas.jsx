import React, { useEffect, useRef } from 'react';

const PhysicsCanvas = ({ 
  animationId = 'idle', 
  params = {}, 
  speed = 1, 
  isPaused = false, 
  onReadoutUpdate,
  onHUDUpdate
}) => {
  const canvasRef = useRef(null);
  const stateRef = useRef({ animationId, params, speed, isPaused });

  // Update refs to avoid re-triggering useEffect loop on prop changes
  useEffect(() => {
    stateRef.current = { animationId, params, speed, isPaused };
  }, [animationId, params, speed, isPaused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let frameId = null;
    let lastFrame = 0;
    let t = 0;

    // Simulation states
    let projState = { x: -8, y: -4, vx: 0, vy: 0, trail: [], isStopped: false };
    let forceState = { x: -4, v: 0, dust: [] };
    let collState = { x1: -5, x2: 5, v1: 4, v2: -2.4, collided: false, bursts: [] };
    let orbitState = { theta: 0, trail: [] };
    let pendulumState = { trail: [] };

    // Set configuration variables based on current props
    const getColors = () => {
      const isLight = document.documentElement.classList.contains('light');
      if (isLight) {
        return {
          bg: '#f4f4f5',
          bgHard: '#fafafa',
          fg: '#09090b',
          dim: '#a1a1aa',
          green: '#10b981',
          aqua: '#06b6d4',
          yellow: '#d97706',
          orange: '#ea580c',
          blue: '#2563eb',
          red: '#dc2626',
        };
      } else {
        return {
          bg: '#121212',
          bgHard: '#09090b',
          fg: '#ffffff',
          dim: '#3f3f46',
          green: '#10b981',
          aqua: '#06b6d4',
          yellow: '#fbbf24',
          orange: '#f97316',
          blue: '#3b82f6',
          red: '#ef4444',
        };
      }
    };

    // Helper functions
    const drawCircle = (x, y, radius, color, glow = false) => {
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
    };

    const drawLine = (x1, y1, x2, y2, color, width = 0.1, dashed = false) => {
      ctx.beginPath();
      if (dashed) ctx.setLineDash([0.2, 0.2]);
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
      if (dashed) ctx.setLineDash([]);
    };

    const drawArrow = (x1, y1, x2, y2, color, width = 0.1, dashed = false) => {
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
    };

    // Reset parameters on animation select
    let lastAnimId = '';
    const checkReset = (animId) => {
      if (animId !== lastAnimId) {
        lastAnimId = animId;
        projState = { x: -8, y: -4, vx: 0, vy: 0, trail: [], isStopped: false };
        forceState = { x: -4, v: 0, dust: [] };
        collState = { x1: -5, x2: 5, v1: 4, v2: -2.4, collided: false, bursts: [] };
        orbitState = { theta: 0, trail: [] };
        pendulumState = { trail: [] };
      }
    };

    // Particle pool for Idle
    const idleParticles = [];
    const colorOptions = ['green', 'aqua', 'yellow', 'orange', 'blue'];
    for (let i = 0; i < 100; i++) {
      idleParticles.push({
        angle: Math.random() * Math.PI * 2,
        radius: 2 + Math.random() * 8,
        speed: 0.002 + Math.random() * 0.004,
        colorKey: colorOptions[i % colorOptions.length],
        size: 0.05 + Math.random() * 0.05,
        yOffset: Math.random() * Math.PI * 2
      });
    }

    const loop = (now) => {
      frameId = requestAnimationFrame(loop);
      if (lastFrame && now - lastFrame < 16) return;
      const delta = lastFrame ? (now - lastFrame) / 1000 : 0.016;
      lastFrame = now;

      const { animationId: activeAnim, params: cfg, speed: currentSpeed, isPaused } = stateRef.current;
      checkReset(activeAnim);
      
      const colors = getColors();

      // Clear Canvas
      ctx.fillStyle = colors.bgHard;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      // Center canvas drawing context
      ctx.translate(canvas.width / 2, canvas.height / 2);
      const scaleFactor = Math.min(canvas.width, canvas.height) / 20;
      ctx.scale(scaleFactor, -scaleFactor); // Y goes up

      const dt = isPaused ? 0 : delta * currentSpeed;
      t += dt;

      if (activeAnim === 'idle') {
        if (onHUDUpdate) onHUDUpdate('Idle Field', 'Particle Drift | 2D Simulation');
        
        // Draw center core
        drawCircle(0, 0, 0.8, colors.bg, true);
        ctx.strokeStyle = colors.aqua;
        ctx.lineWidth = 0.05;
        ctx.beginPath();
        ctx.arc(0, 0, 0.8 + Math.sin(t * 2) * 0.1, 0, Math.PI * 2);
        ctx.stroke();

        idleParticles.forEach((p) => {
          p.angle += p.speed * currentSpeed * 60 * dt;
          const x = Math.cos(p.angle) * p.radius;
          const y = Math.sin(p.angle) * p.radius * 0.4 + Math.sin(t + p.yOffset) * 0.5;
          ctx.globalAlpha = 0.8;
          drawCircle(x, y, p.size, colors[p.colorKey], true);
        });
        ctx.globalAlpha = 1.0;
        if (onReadoutUpdate) onReadoutUpdate({ Status: 'Simulating Particle Flow' });

      } else if (activeAnim === 'projectile') {
        if (onHUDUpdate) onHUDUpdate('Projectile Motion', 'v² = u² + 2as  |  Range = v₀²sin(2θ)/g');

        const angle = cfg.angle ?? 45;
        const v0 = cfg.velocity ?? 14;
        const e = cfg.bounciness ?? 0.6;
        const h = cfg.height ?? 0;
        const g = 9.8;
        const startY = -4;

        if (projState.vx === 0 && !projState.isStopped) {
          const rad = (angle * Math.PI) / 180;
          projState.vx = v0 * Math.cos(rad) * 0.3;
          projState.vy = v0 * Math.sin(rad) * 0.3;
          projState.y = startY + h;
        }

        // Apply physics
        if (!projState.isStopped && dt > 0) {
          projState.vy -= (g * 0.3) * dt;
          projState.x += projState.vx * dt;
          projState.y += projState.vy * dt;

          if (projState.y < startY) {
            projState.y = startY;
            projState.vy = -projState.vy * e;
            projState.vx = projState.vx * 0.98; // friction

            if (Math.abs(projState.vy) < 0.5) {
              projState.vy = 0;
            }
            if (projState.vy === 0 && Math.abs(projState.vx) < 0.1) {
              projState.vx = 0;
              projState.isStopped = true;
            }
          }

          if (projState.trail.length === 0 || Math.hypot(projState.trail[projState.trail.length - 1].x - projState.x, projState.trail[projState.trail.length - 1].y - projState.y) > 0.2) {
            projState.trail.push({ x: projState.x, y: projState.y });
            if (projState.trail.length > 150) projState.trail.shift();
          }
        }

        // Draw ground
        drawLine(-10, startY, 10, startY, colors.dim, 0.1);

        // Draw launch height reference
        if (h > 0) {
          drawLine(-8.5, startY, -7.5, startY, colors.dim, 0.05, true);
          drawLine(-8.5, startY + h, -7.5, startY + h, colors.dim, 0.05, true);
          drawLine(-8, startY, -8, startY + h, colors.dim, 0.05, true);
        }

        // Draw trail
        if (projState.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(projState.trail[0].x, projState.trail[0].y);
          for (let i = 1; i < projState.trail.length; i++) {
            ctx.lineTo(projState.trail[i].x, projState.trail[i].y);
          }
          ctx.strokeStyle = colors.yellow;
          ctx.lineWidth = 0.08;
          ctx.stroke();
        }

        // Draw projectile
        drawCircle(projState.x, projState.y, 0.3, colors.orange, true);

        // Draw vectors if enabled
        if (cfg.vectors && !projState.isStopped) {
          const vScale = 0.3;
          drawArrow(projState.x, projState.y, projState.x + projState.vx * vScale, projState.y, colors.aqua, 0.05, true);
          drawArrow(projState.x, projState.y, projState.x, projState.y + projState.vy * vScale, colors.aqua, 0.05, true);
          drawArrow(projState.x, projState.y, projState.x + projState.vx * vScale, projState.y + projState.vy * vScale, colors.green, 0.08);
          if (projState.y > startY) {
            drawArrow(projState.x, projState.y, projState.x, projState.y - 2, colors.yellow, 0.08);
          }
        }

        const speedVal = Math.sqrt(projState.vx ** 2 + projState.vy ** 2);
        if (onReadoutUpdate) {
          onReadoutUpdate({
            Angle: `${angle.toFixed(0)}°`,
            'v₀': `${v0.toFixed(1)} m/s`,
            Speed: `${(speedVal * 3.3).toFixed(1)} m/s`,
            Height: `${Math.max(0, projState.y - startY).toFixed(1)} m`,
            Status: projState.isStopped ? 'Stopped' : 'In Motion'
          });
        }

      } else if (activeAnim === 'wave') {
        if (onHUDUpdate) onHUDUpdate('Wave Motion', 'v = fλ  |  y = A·sin(kx - ωt)');

        const freq = cfg.frequency ?? 1.2;
        const amp = cfg.amplitude ?? 1.5;
        const useSuper = !!cfg.superposition;

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
        ctx.strokeStyle = colors.blue;
        ctx.lineWidth = 0.15;
        ctx.shadowBlur = 10;
        ctx.shadowColor = colors.blue;
        ctx.stroke();
        ctx.shadowBlur = 0;

        if (useSuper) {
          ctx.beginPath();
          for (let x = -10; x <= 10; x += 0.2) {
            const y = amp * Math.sin(k * x - w * t);
            if (x === -10) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = colors.dim;
          ctx.lineWidth = 0.05;
          ctx.stroke();
        }

        if (onReadoutUpdate) {
          onReadoutUpdate({
            Frequency: `${freq.toFixed(1)} Hz`,
            Amplitude: `${amp.toFixed(1)} m`,
            'λ': `${(2 * Math.PI / k).toFixed(1)} m`,
            Period: `${(2 * Math.PI / w).toFixed(2)} s`,
          });
        }

      } else if (activeAnim === 'pendulum') {
        if (onHUDUpdate) onHUDUpdate('Simple Harmonic Motion', 'T = 2π√(L/g)  |  F = -kx');

        const L = cfg.length ?? 5;
        const startAngle = ((cfg.angle ?? 30) * Math.PI) / 180;
        const g = 9.8;

        const omega = Math.sqrt(g / L);
        const theta = startAngle * Math.cos(omega * t);
        const omegaVal = -startAngle * omega * Math.sin(omega * t);

        const pivotX = 0;
        const pivotY = 4;
        const bobX = pivotX + L * Math.sin(theta);
        const bobY = pivotY - L * Math.cos(theta);

        if (pendulumState.trail.length === 0 || Math.hypot(pendulumState.trail[pendulumState.trail.length - 1].x - bobX, pendulumState.trail[pendulumState.trail.length - 1].y - bobY) > 0.1) {
          pendulumState.trail.push({ x: bobX, y: bobY });
          if (pendulumState.trail.length > 40) pendulumState.trail.shift();
        }

        // Draw trail
        if (pendulumState.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(pendulumState.trail[0].x, pendulumState.trail[0].y);
          for (let i = 1; i < pendulumState.trail.length; i++) ctx.lineTo(pendulumState.trail[i].x, pendulumState.trail[i].y);
          ctx.strokeStyle = colors.yellow;
          ctx.lineWidth = 0.05;
          ctx.stroke();
        }

        // Rod & pivot
        drawLine(pivotX, pivotY, bobX, bobY, colors.dim, 0.1);
        drawCircle(pivotX, pivotY, 0.15, colors.fg);

        // Bob
        drawCircle(bobX, bobY, 0.5, colors.green, true);

        if (cfg.vectors) {
          // Velocity (tangent)
          const vx = Math.cos(theta) * omegaVal * L;
          const vy = Math.sin(theta) * omegaVal * L;
          drawArrow(bobX, bobY, bobX + vx * 0.5, bobY + vy * 0.5, colors.green, 0.08);

          // Gravity
          drawArrow(bobX, bobY, bobX, bobY - 2, colors.yellow, 0.08);

          // Tension
          const tx = -Math.sin(theta) * 2;
          const ty = Math.cos(theta) * 2;
          drawArrow(bobX, bobY, bobX + tx, bobY + ty, colors.aqua, 0.08);
        }

        const speedVal = Math.abs(omegaVal * L);
        const T = 2 * Math.PI * Math.sqrt(L / g);
        if (onReadoutUpdate) {
          onReadoutUpdate({
            Length: `${L.toFixed(1)} m`,
            Period: `${T.toFixed(2)} s`,
            Angle: `${((theta * 180) / Math.PI).toFixed(1)}°`,
            Speed: `${speedVal.toFixed(2)} m/s`,
          });
        }

      } else if (activeAnim === 'forces') {
        if (onHUDUpdate) onHUDUpdate('Forces & Friction', 'F_net = F_applied - F_friction');

        const applied = cfg.applied ?? 20;
        const mu = cfg.mu ?? 0.3;
        const mass = cfg.mass ?? 5;
        const g = 9.8;

        const normal = mass * g;
        const frictionLimit = mu * normal;

        let friction = 0;
        let net = 0;

        if (Math.abs(forceState.v) < 0.01 && Math.abs(applied) <= frictionLimit) {
          friction = applied;
          net = 0;
          forceState.v = 0;
        } else {
          const dir = forceState.v !== 0 ? Math.sign(forceState.v) : Math.sign(applied) || 1;
          friction = frictionLimit * dir;
          net = applied - friction;
          forceState.v += (net / mass) * dt;
        }

        forceState.x += forceState.v * dt;
        if (forceState.x > 6) { forceState.x = 6; forceState.v = 0; }
        else if (forceState.x < -6) { forceState.x = -6; forceState.v = 0; }

        // Spawn dust particles
        if (Math.abs(forceState.v) > 0.1 && Math.random() < 0.4 && dt > 0) {
          forceState.dust.push({
            px: forceState.x - Math.sign(forceState.v) * 0.8,
            py: -2 - 0.4 + Math.random() * 0.3,
            vx: -forceState.v * 0.2 + (Math.random() - 0.5) * 0.5,
            vy: Math.random() * 0.5,
            life: 1.0
          });
        }

        const y = -2;
        // Bumpy ground rendering
        ctx.beginPath();
        ctx.moveTo(-10, y - 0.5);
        for (let gx = -10; gx <= 10; gx += 0.2) {
          const bump = mu * 0.12 * Math.sin(gx * 25);
          ctx.lineTo(gx, y - 0.5 + bump);
        }
        ctx.strokeStyle = colors.dim;
        ctx.lineWidth = 0.1;
        ctx.stroke();
        drawLine(-10, y - 0.6, 10, y - 0.6, colors.dim, 0.2);

        // Draw dust
        for (let i = forceState.dust.length - 1; i >= 0; i--) {
          let d = forceState.dust[i];
          d.px += d.vx * dt;
          d.py += d.vy * dt;
          d.life -= dt * 1.5;
          if (d.life <= 0) {
            forceState.dust.splice(i, 1);
          } else {
            ctx.globalAlpha = d.life;
            drawCircle(d.px, d.py, 0.05 + (1 - d.life) * 0.1, colors.fg);
            ctx.globalAlpha = 1.0;
          }
        }

        // Crate
        ctx.fillStyle = colors.bg;
        ctx.fillRect(forceState.x - 1, y - 0.5, 2, 2);

        const borderCol = Math.abs(net) < 0.2 && Math.abs(forceState.v) < 0.02 ? colors.green : colors.aqua;
        ctx.strokeStyle = borderCol;
        ctx.lineWidth = 0.1;
        ctx.strokeRect(forceState.x - 1, y - 0.5, 2, 2);
        ctx.lineWidth = 0.05;
        ctx.strokeRect(forceState.x - 0.8, y - 0.3, 1.6, 1.6);
        drawLine(forceState.x - 1, y - 0.5, forceState.x + 1, y + 1.5, borderCol, 0.05);
        drawLine(forceState.x - 1, y + 1.5, forceState.x + 1, y - 0.5, borderCol, 0.05);

        // Forces vectors overlay
        if (cfg.vectors) {
          const scale = 0.05;
          if (applied !== 0) {
            drawArrow(forceState.x, y + 0.5, forceState.x + applied * scale, y + 0.5, colors.orange, 0.08);
          }
          if (friction !== 0) {
            drawArrow(forceState.x, y - 0.2, forceState.x - friction * scale, y - 0.2, colors.red, 0.08);
          }
          drawArrow(forceState.x, y + 1.5, forceState.x, y + 1.5 + normal * scale, colors.green, 0.08);
          drawArrow(forceState.x, y - 0.5, forceState.x, y - 0.5 - normal * scale, colors.yellow, 0.08);
        }

        const accel = mass > 0 ? net / mass : 0;
        if (onReadoutUpdate) {
          onReadoutUpdate({
            F_net: `${net.toFixed(1)} N`,
            F_friction: `${friction.toFixed(1)} N`,
            Accel: `${accel.toFixed(2)} m/s²`,
            Velocity: `${forceState.v.toFixed(2)} m/s`,
          });
        }

      } else if (activeAnim === 'collision') {
        if (onHUDUpdate) onHUDUpdate('Momentum & Collisions', "p = mv  |  e = (v2' - v1')/(v1 - v2)");

        const e = cfg.elastic ? 1 : 0.2;
        const m1 = cfg.mass1 ?? 3;
        const m2 = cfg.mass2 ?? 3;

        const r1 = 0.5 + m1 * 0.1;
        const r2 = 0.5 + m2 * 0.1;

        if (dt > 0) {
          collState.x1 += collState.v1 * dt;
          collState.x2 += collState.v2 * dt;

          if (!collState.collided && Math.abs(collState.x1 - collState.x2) <= (r1 + r2)) {
            collState.collided = true;
            const u1 = collState.v1;
            const u2 = collState.v2;

            const v1p = ((m1 - e * m2) * u1 + (1 + e) * m2 * u2) / (m1 + m2);
            const v2p = ((m2 - e * m1) * u2 + (1 + e) * m1 * u1) / (m1 + m2);

            collState.v1 = v1p;
            collState.v2 = v2p;

            // Spawn collision bursts
            for (let i = 0; i < 15; i++) {
              collState.bursts.push({
                x: (collState.x1 + collState.x2) / 2,
                y: 0,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1.0
              });
            }
          }

          if (collState.x1 > 9 || collState.x1 < -9) { collState.v1 *= -1; collState.collided = false; }
          if (collState.x2 > 9 || collState.x2 < -9) { collState.v2 *= -1; collState.collided = false; }
        }

        // Ground
        drawLine(-10, -0.6, 10, -0.6, colors.dim, 0.1);

        // Objects
        drawCircle(collState.x1, 0, r1, colors.orange, true);
        drawCircle(collState.x2, 0, r2, colors.blue, true);

        // Render collision bursts
        for (let i = collState.bursts.length - 1; i >= 0; i--) {
          let b = collState.bursts[i];
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.life -= dt * 2;
          if (b.life <= 0) {
            collState.bursts.splice(i, 1);
          } else {
            ctx.globalAlpha = b.life;
            drawCircle(b.x, b.y, 0.1, colors.yellow);
            ctx.globalAlpha = 1.0;
          }
        }

        const pCurrent = m1 * collState.v1 + m2 * collState.v2;
        const keCurrent = 0.5 * m1 * (collState.v1 ** 2) + 0.5 * m2 * (collState.v2 ** 2);

        if (onReadoutUpdate) {
          onReadoutUpdate({
            'System Momentum': `${pCurrent.toFixed(1)} kg·m/s`,
            'Kinetic Energy': `${keCurrent.toFixed(1)} J`,
            'Restitution (e)': `${e}`,
            'v₁ / v₂': `${collState.v1.toFixed(1)} / ${collState.v2.toFixed(1)} m/s`,
          });
        }

      } else if (activeAnim === 'orbit') {
        if (onHUDUpdate) onHUDUpdate('Gravitation & Orbits', 'F = GMm/r²  |  v = √(GM/r)');

        const ecc = cfg.eccentricity ?? 0.3;
        const orbitSpeed = cfg.speed ?? 1;
        const a = 6;
        const r = (a * (1 - ecc * ecc)) / (1 + ecc * Math.cos(orbitState.theta));
        const omega = 0.05 * orbitSpeed * (1 / Math.max(0.4, (r / a) ** 2));

        orbitState.theta += omega * dt * 30;

        const x = r * Math.cos(orbitState.theta);
        const y = r * Math.sin(orbitState.theta);

        if (orbitState.trail.length === 0 || Math.hypot(orbitState.trail[orbitState.trail.length - 1].x - x, orbitState.trail[orbitState.trail.length - 1].y - y) > 0.2) {
          orbitState.trail.push({ x, y });
          if (orbitState.trail.length > 100) orbitState.trail.shift();
        }

        // Draw trail
        if (orbitState.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(orbitState.trail[0].x, orbitState.trail[0].y);
          for (let i = 1; i < orbitState.trail.length; i++) ctx.lineTo(orbitState.trail[i].x, orbitState.trail[i].y);
          ctx.strokeStyle = colors.aqua;
          ctx.globalAlpha = 0.5;
          ctx.lineWidth = 0.05;
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        }

        // Sun & Planet
        drawCircle(0, 0, 0.8, colors.yellow, true);
        drawCircle(x, y, 0.3, colors.blue, true);

        // Vector arrow pointing to Star
        drawArrow(x, y, x - (x / r) * 1.5, y - (y / r) * 1.5, colors.orange, 0.05);

        if (onReadoutUpdate) {
          onReadoutUpdate({
            Eccentricity: `${ecc.toFixed(2)}`,
            Radius: `${r.toFixed(2)} AU`,
            'Angular Speed': `${(omega * 10).toFixed(2)} rad/s`,
          });
        }

      } else if (activeAnim === 'electricity') {
        if (onHUDUpdate) onHUDUpdate('Electric Fields', 'E = kq/r²  |  V = kq/r');

        const separation = cfg.separation ?? 6;
        const x1 = -separation / 2;
        const x2 = separation / 2;

        // Render field lines
        ctx.strokeStyle = colors.dim;
        ctx.lineWidth = 0.03;
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2;
          ctx.beginPath();
          let px = x1 + 0.3 * Math.cos(angle);
          let py = 0.3 * Math.sin(angle);
          ctx.moveTo(px, py);

          let step = 0.15;
          let inside = true;
          for (let stepCount = 0; stepCount < 100 && inside; stepCount++) {
            const r1_sq = (px - x1) ** 2 + py ** 2;
            const r2_sq = (px - x2) ** 2 + py ** 2;
            const r1 = Math.sqrt(r1_sq);
            const r2 = Math.sqrt(r2_sq);

            // Field vectors from +q and -q
            const e1x = (px - x1) / (r1_sq * r1 + 0.01);
            const e1y = py / (r1_sq * r1 + 0.01);

            const e2x = -(px - x2) / (r2_sq * r2 + 0.01);
            const e2y = -py / (r2_sq * r2 + 0.01);

            const ex = e1x + e2x;
            const ey = e1y + e2y;
            const e_len = Math.hypot(ex, ey);

            px += (ex / (e_len + 0.001)) * step;
            py += (ey / (e_len + 0.001)) * step;

            ctx.lineTo(px, py);

            if (r2 < 0.3 || Math.abs(px) > 10 || Math.abs(py) > 10) {
              inside = false;
            }
          }
          ctx.stroke();
        }

        // Draw charges
        drawCircle(x1, 0, 0.3, colors.red, true);   // positive
        drawCircle(x2, 0, 0.3, colors.blue, true);  // negative

        // Plus / Minus symbols
        drawLine(x1 - 0.1, 0, x1 + 0.1, 0, colors.fg, 0.04);
        drawLine(x1, -0.1, x1, 0.1, colors.fg, 0.04);
        drawLine(x2 - 0.1, 0, x2 + 0.1, 0, colors.fg, 0.04);

        if (onReadoutUpdate) {
          onReadoutUpdate({
            Separation: `${separation.toFixed(1)} m`,
            'Charge (+q)': '1.6 × 10⁻¹⁹ C',
            'Charge (-q)': '-1.6 × 10⁻¹⁹ C',
            Permittivity: '8.85 × 10⁻¹² F/m',
          });
        }
      }

      ctx.restore();
    };

    loop();

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const h = parent.clientHeight || 450;
      canvas.width = w * window.devicePixelRatio;
      canvas.height = h * window.devicePixelRatio;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };
    window.addEventListener('resize', resize);
    resize();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="relative h-full w-full flex-1 overflow-hidden">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};

export default PhysicsCanvas;
