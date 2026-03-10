// ============================================================
// VECTOR AI — 3D Voice Avatar
// ============================================================

const avatarCanvas = document.getElementById("avatar-canvas");
if (!avatarCanvas || typeof THREE === "undefined") {
  console.warn("Avatar canvas or Three.js missing.");
}

const avatarRenderer = avatarCanvas
  ? new THREE.WebGLRenderer({
      canvas: avatarCanvas,
      antialias: true,
      alpha: true,
    })
  : null;

if (avatarRenderer) {
  avatarRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.0));
  avatarRenderer.setSize(avatarCanvas.clientWidth, avatarCanvas.clientHeight);
  avatarRenderer.setClearColor(0x000000, 0);
}

const avatarScene = new THREE.Scene();
const avatarCamera = new THREE.PerspectiveCamera(
  60,
  avatarCanvas ? avatarCanvas.clientWidth / avatarCanvas.clientHeight : 1,
  0.1,
  100
);
avatarCamera.position.set(0, 0, 8);

const AvatarState = { IDLE: "idle", LISTENING: "listening", SPEAKING: "speaking" };
let avatarState = AvatarState.IDLE;
let speakingAmplitude = 0;
window.avatarState = avatarState;
window.speakingAmplitude = speakingAmplitude;
window.AvatarState = AvatarState;

const orbGeo = new THREE.IcosahedronGeometry(1.8, 2);
const orbMat = new THREE.MeshPhongMaterial({
  color: 0xb8bb26,
  emissive: 0x98971a,
  emissiveIntensity: 0.6,
  wireframe: false,
  transparent: true,
  opacity: 0.92,
  shininess: 80,
});
const orb = new THREE.Mesh(orbGeo, orbMat);
avatarScene.add(orb);

const originalPositions = orbGeo.attributes.position.array.slice();

const innerGlow = new THREE.Mesh(
  new THREE.SphereGeometry(1.5, 32, 32),
  new THREE.MeshBasicMaterial({
    color: 0xb8bb26,
    transparent: true,
    opacity: 0.12,
  })
);
avatarScene.add(innerGlow);

const ringGeo = new THREE.TorusGeometry(2.4, 0.04, 8, 80);
const ringMat = new THREE.MeshBasicMaterial({
  color: 0x8ec07c,
  transparent: true,
  opacity: 0.5,
});
const ring1 = new THREE.Mesh(ringGeo, ringMat);
const ring2 = new THREE.Mesh(ringGeo.clone(), ringMat.clone());
ring2.rotation.x = Math.PI / 3;
ring2.material.color.setHex(0xfabd2f);
ring2.material.opacity = 0.3;
avatarScene.add(ring1);
avatarScene.add(ring2);

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
    color: 0x8ec07c,
    size: 0.06,
    transparent: true,
    opacity: 0.7,
  })
);
avatarScene.add(particles);

avatarScene.add(new THREE.AmbientLight(0xffffff, 0.3));
const avatarKeyLight = new THREE.PointLight(0xb8bb26, 2, 20);
avatarKeyLight.position.set(0, 0, 6);
avatarScene.add(avatarKeyLight);
const avatarRimLight = new THREE.PointLight(0x8ec07c, 1, 15);
avatarRimLight.position.set(-4, 3, -4);
avatarScene.add(avatarRimLight);

const BAR_COUNT = 32;
const bars = [];
for (let i = 0; i < BAR_COUNT; i++) {
  const angle = (i / BAR_COUNT) * Math.PI * 2;
  const barGeo = new THREE.BoxGeometry(0.06, 0.1, 0.06);
  const barMat = new THREE.MeshBasicMaterial({ color: 0xfe8019, transparent: true, opacity: 0.0 });
  const bar = new THREE.Mesh(barGeo, barMat);
  const r = 2.6;
  bar.position.set(r * Math.cos(angle), 0, r * Math.sin(angle));
  bar.lookAt(0, 0, 0);
  avatarScene.add(bar);
  bars.push(bar);
}

let avatarT = 0;
let lastAvatarFrame = 0;

function animateAvatar(now) {
  requestAnimationFrame(animateAvatar);
  if (now - lastAvatarFrame < 33) return;
  lastAvatarFrame = now;
  avatarT += 0.016;

  const amp = window.speakingAmplitude || 0;

  if (window.avatarState === AvatarState.IDLE) {
    orb.rotation.y += 0.004;
    orb.rotation.x += 0.002;
    const breathe = 1 + Math.sin(avatarT * 1.2) * 0.04;
    orb.scale.setScalar(breathe);
    innerGlow.material.opacity = 0.08 + Math.sin(avatarT) * 0.04;
    ring1.rotation.z += 0.003;
    ring2.rotation.x += 0.002;
    orbMat.emissiveIntensity = 0.3;
    bars.forEach((b) => {
      b.material.opacity = 0;
    });
  } else if (window.avatarState === AvatarState.LISTENING) {
    orb.rotation.y += 0.012;
    orb.rotation.x += 0.008;
    orbMat.color.setHex(0x8ec07c);
    orbMat.emissive.setHex(0x689d6a);
    orbMat.emissiveIntensity = 0.5 + Math.sin(avatarT * 3) * 0.2;
    innerGlow.material.opacity = 0.2 + Math.sin(avatarT * 4) * 0.08;
    ring1.scale.setScalar(1 + Math.sin(avatarT * 2) * 0.06);
    ring2.scale.setScalar(1 + Math.cos(avatarT * 2.5) * 0.06);

    const pos = particleGeo.attributes.position.array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const wave = Math.sin(avatarT * particleSpeeds[i] * 3 + i) * 0.3;
      pos[i * 3] = particleBasePositions[i * 3] * (1 + wave * 0.08);
      pos[i * 3 + 1] = particleBasePositions[i * 3 + 1] * (1 + wave * 0.08);
      pos[i * 3 + 2] = particleBasePositions[i * 3 + 2] * (1 + wave * 0.08);
    }
    particleGeo.attributes.position.needsUpdate = true;
    bars.forEach((b) => {
      b.material.opacity = 0;
    });
  } else if (window.avatarState === AvatarState.SPEAKING) {
    orb.rotation.y += 0.008 + amp * 0.03;
    orbMat.color.setHex(0xb8bb26);
    orbMat.emissive.setHex(0x98971a);
    orbMat.emissiveIntensity = 0.4 + amp * 1.2;
    avatarKeyLight.intensity = 1.5 + amp * 3;

    if (amp > 0.05) {
      const positions = orbGeo.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        const ox = originalPositions[i];
        const oy = originalPositions[i + 1];
        const oz = originalPositions[i + 2];
        const noise = Math.sin(avatarT * 4 + ox * 3) * amp * 0.4;
        positions[i] = ox + ox * noise;
        positions[i + 1] = oy + oy * noise;
        positions[i + 2] = oz + oz * noise;
      }
      orbGeo.attributes.position.needsUpdate = true;
      orbGeo.computeVertexNormals();
    }

    if (window.audioFrequencyData) {
      const freqStep = Math.floor(window.audioFrequencyData.length / BAR_COUNT);
      bars.forEach((bar, i) => {
        const freq = window.audioFrequencyData[i * freqStep] / 255;
        bar.scale.y = 1 + freq * 8;
        bar.material.opacity = 0.4 + freq * 0.6;
        bar.material.color.setHSL(0.18 - freq * 0.1, 1, 0.5 + freq * 0.3);
      });
    }

    innerGlow.material.opacity = 0.15 + amp * 0.5;
    ring1.scale.setScalar(1 + amp * 0.3);
    ring2.scale.setScalar(1 + amp * 0.2);
  }

  if (avatarRenderer) {
    avatarRenderer.render(avatarScene, avatarCamera);
  }
}

if (avatarRenderer) {
  requestAnimationFrame(animateAvatar);
}

if (avatarCanvas && avatarRenderer) {
  const avatarRO = new ResizeObserver(() => {
    avatarRenderer.setSize(avatarCanvas.clientWidth, avatarCanvas.clientHeight, false);
    avatarCamera.aspect = avatarCanvas.clientWidth / avatarCanvas.clientHeight;
    avatarCamera.updateProjectionMatrix();
  });
  avatarRO.observe(avatarCanvas);
}
