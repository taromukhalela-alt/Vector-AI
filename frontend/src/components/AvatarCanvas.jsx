import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const AvatarCanvas = ({ avatarState = 'idle', speakingAmplitude = 0, frequencyData = null }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.0));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 8);

    // Orb Mesh
    const orbGeo = new THREE.IcosahedronGeometry(1.8, 2);
    const orbMat = new THREE.MeshPhongMaterial({
      color: 0x10b981, // Emerald green theme
      emissive: 0x047857,
      emissiveIntensity: 0.6,
      wireframe: false,
      transparent: true,
      opacity: 0.92,
      shininess: 80,
    });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    scene.add(orb);

    const originalPositions = orbGeo.attributes.position.array.slice();

    const innerGlow = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.12,
      })
    );
    scene.add(innerGlow);

    const ringGeo = new THREE.TorusGeometry(2.4, 0.04, 8, 80);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.5,
    });
    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    const ring2 = new THREE.Mesh(ringGeo.clone(), ringMat.clone());
    ring2.rotation.x = Math.PI / 3;
    ring2.material.color.setHex(0x10b981);
    ring2.material.opacity = 0.3;
    scene.add(ring1);
    scene.add(ring2);

    const PARTICLE_COUNT = 150;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    const particleBasePositions = new Float32Array(PARTICLE_COUNT * 3);
    const particleSpeeds = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2.8 + Math.random() * 1.5;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      particlePositions[i * 3] = particleBasePositions[i * 3] = x;
      particlePositions[i * 3 + 1] = particleBasePositions[i * 3 + 1] = y;
      particlePositions[i * 3 + 2] = particleBasePositions[i * 3 + 2] = z;
      particleSpeeds[i] = 0.3 + Math.random() * 0.7;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particles = new THREE.Points(
      particleGeo,
      new THREE.PointsMaterial({
        color: 0x34d399,
        size: 0.06,
        transparent: true,
        opacity: 0.7,
      })
    );
    scene.add(particles);

    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const keyLight = new THREE.PointLight(0x10b981, 2, 20);
    keyLight.position.set(0, 0, 6);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0x34d399, 1, 15);
    rimLight.position.set(-4, 3, -4);
    scene.add(rimLight);

    const BAR_COUNT = 32;
    const bars = [];
    for (let i = 0; i < BAR_COUNT; i++) {
      const angle = (i / BAR_COUNT) * Math.PI * 2;
      const barGeo = new THREE.BoxGeometry(0.06, 0.1, 0.06);
      const barMat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.0 });
      const bar = new THREE.Mesh(barGeo, barMat);
      const r = 2.6;
      bar.position.set(r * Math.cos(angle), 0, r * Math.sin(angle));
      bar.lookAt(0, 0, 0);
      scene.add(bar);
      bars.push(bar);
    }

    let t = 0;
    let frameId = null;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      t += 0.016;

      const state = window.__avatarState || avatarState;
      const amp = window.__speakingAmplitude || speakingAmplitude;
      const freqData = window.__frequencyData || frequencyData;

      if (state === 'idle') {
        orb.rotation.y += 0.004;
        orb.rotation.x += 0.002;
        const breathe = 1 + Math.sin(t * 1.2) * 0.04;
        orb.scale.setScalar(breathe);
        innerGlow.material.opacity = 0.08 + Math.sin(t) * 0.04;
        ring1.rotation.z += 0.003;
        ring2.rotation.x += 0.002;
        orbMat.emissiveIntensity = 0.3;
        orbMat.color.setHex(0x10b981);
        bars.forEach((b) => { b.material.opacity = 0; });
      } else if (state === 'listening') {
        orb.rotation.y += 0.012;
        orb.rotation.x += 0.008;
        orbMat.color.setHex(0x3b82f6);
        orbMat.emissive.setHex(0x1d4ed8);
        orbMat.emissiveIntensity = 0.5 + Math.sin(t * 3) * 0.2;
        innerGlow.material.opacity = 0.2 + Math.sin(t * 4) * 0.08;
        ring1.scale.setScalar(1 + Math.sin(t * 2) * 0.06);
        ring2.scale.setScalar(1 + Math.cos(t * 2.5) * 0.06);

        const pos = particleGeo.attributes.position.array;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const wave = Math.sin(t * particleSpeeds[i] * 3 + i) * 0.3;
          pos[i * 3] = particleBasePositions[i * 3] * (1 + wave * 0.08);
          pos[i * 3 + 1] = particleBasePositions[i * 3 + 1] * (1 + wave * 0.08);
          pos[i * 3 + 2] = particleBasePositions[i * 3 + 2] * (1 + wave * 0.08);
        }
        particleGeo.attributes.position.needsUpdate = true;
        bars.forEach((b) => { b.material.opacity = 0; });
      } else if (state === 'speaking') {
        orb.rotation.y += 0.008 + amp * 0.03;
        orbMat.color.setHex(0x10b981);
        orbMat.emissive.setHex(0x047857);
        orbMat.emissiveIntensity = 0.4 + amp * 1.2;
        keyLight.intensity = 1.5 + amp * 3;

        if (amp > 0.05) {
          const positions = orbGeo.attributes.position.array;
          for (let i = 0; i < positions.length; i += 3) {
            const ox = originalPositions[i];
            const oy = originalPositions[i + 1];
            const oz = originalPositions[i + 2];
            const noise = Math.sin(t * 4 + ox * 3) * amp * 0.4;
            positions[i] = ox + ox * noise;
            positions[i + 1] = oy + oy * noise;
            positions[i + 2] = oz + oz * noise;
          }
          orbGeo.attributes.position.needsUpdate = true;
          orbGeo.computeVertexNormals();
        }

        if (freqData && freqData.length > 0) {
          const freqStep = Math.floor(freqData.length / BAR_COUNT);
          bars.forEach((bar, i) => {
            const freq = freqData[i * freqStep] / 255;
            bar.scale.y = 1 + freq * 8;
            bar.material.opacity = 0.4 + freq * 0.6;
            bar.material.color.setHSL(0.4 - freq * 0.1, 1, 0.5 + freq * 0.3);
          });
        }

        innerGlow.material.opacity = 0.15 + amp * 0.5;
        ring1.scale.setScalar(1 + amp * 0.3);
        ring2.scale.setScalar(1 + amp * 0.2);
      }

      renderer.render(scene, camera);
    };

    animate();

    const resizeObserver = new ResizeObserver(() => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    resizeObserver.observe(canvas);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      renderer.dispose();
      orbGeo.dispose();
      orbMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      particleGeo.dispose();
    };
  }, []);

  useEffect(() => {
    window.__avatarState = avatarState;
    window.__speakingAmplitude = speakingAmplitude;
    window.__frequencyData = frequencyData;
  }, [avatarState, speakingAmplitude, frequencyData]);

  return <canvas ref={canvasRef} className="w-full h-full max-w-[460px] max-h-[460px] block" />;
};

export default AvatarCanvas;
