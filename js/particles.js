// ============================================================
// Bug.io — Particle System, Screen Shake & Moving BG (TASK-19)
// ============================================================

// --- Particle pool ---
const particles = [];
const PARTICLE_LIMIT = 500;

function spawnParticle(x, y, vx, vy, life, color, radius) {
  if (particles.length >= PARTICLE_LIMIT) return;
  particles.push({
    x, y, vx, vy,
    life,
    maxLife: life,
    color,
    radius,
  });
}

function spawnParticles(x, y, count, speed, life, color, radius) {
  for (let i = 0; i < count; i++) {
    if (particles.length >= PARTICLE_LIMIT) return;
    const angle = Math.random() * Math.PI * 2;
    const spd = speed * (0.5 + Math.random() * 0.5);
    spawnParticle(
      x, y,
      Math.cos(angle) * spd,
      Math.sin(angle) * spd,
      life * (0.7 + Math.random() * 0.3),
      color,
      radius
    );
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    p.radius *= Math.pow(0.95, dt * 60);
    if (p.life <= 0 || p.radius < 0.3) {
      particles.splice(i, 1);
    }
  }
}

function renderParticles() {
  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    // Cull off-screen
    if (p.x < camera.x - 20 || p.x > camera.x + canvasWidth + 20 ||
        p.y < camera.y - 20 || p.y > camera.y + canvasHeight + 20) continue;

    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

// --- Spawn helpers for game events ---

// Enemy death: 8-12 particles in enemy color
function spawnEnemyDeathParticles(x, y, color) {
  const count = 8 + Math.floor(Math.random() * 5);
  spawnParticles(x, y, count, 120, 0.6, color, 4);
}

// Projectile hit: 3-5 small particles
function spawnHitParticles(x, y, color) {
  const count = 3 + Math.floor(Math.random() * 3);
  spawnParticles(x, y, count, 80, 0.4, color || '#ffffff', 2.5);
}

// Level up: ring of particles around player
function spawnLevelUpParticles(x, y) {
  const count = 20;
  for (let i = 0; i < count; i++) {
    if (particles.length >= PARTICLE_LIMIT) return;
    const angle = (i / count) * Math.PI * 2;
    const dist = 30;
    spawnParticle(
      x + Math.cos(angle) * dist,
      y + Math.sin(angle) * dist,
      Math.cos(angle) * 100,
      Math.sin(angle) * 100,
      0.8,
      '#7ee787',
      3.5
    );
  }
}

// Heal: green particles rising up
function spawnHealParticles(x, y) {
  for (let i = 0; i < 8; i++) {
    if (particles.length >= PARTICLE_LIMIT) return;
    spawnParticle(
      x + (Math.random() - 0.5) * 20,
      y + (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 30,
      -60 - Math.random() * 40,
      0.8 + Math.random() * 0.4,
      '#3fb950',
      3
    );
  }
}

// --- Screen Shake ---
const screenShake = {
  amplitude: 0,
  duration: 0,
  elapsed: 0,
  active: false,
};

function triggerScreenShake(amplitude, duration) {
  screenShake.amplitude = amplitude;
  screenShake.duration = duration;
  screenShake.elapsed = 0;
  screenShake.active = true;
}

function updateScreenShake(dt) {
  if (!screenShake.active) return;
  screenShake.elapsed += dt;
  if (screenShake.elapsed >= screenShake.duration) {
    screenShake.active = false;
  }
}

function getShakeOffset() {
  if (!screenShake.active) return { x: 0, y: 0 };
  const t = screenShake.elapsed / screenShake.duration;
  const amp = screenShake.amplitude * (1 - t);
  return {
    x: (Math.random() - 0.5) * 2 * amp,
    y: (Math.random() - 0.5) * 2 * amp,
  };
}

// --- Moving Background ---
let bgScrollX = 0;
let bgScrollY = 0;

function updateMovingBg(dt) {
  bgScrollX += 8 * dt;
  bgScrollY += 5 * dt;
}

function renderMovingBgPattern() {
  // Subtle floating dots for sense of motion
  ctx.save();
  const spacing = 80;
  const dotR = 1.2;
  ctx.fillStyle = '#1a2030';

  const offsetX = bgScrollX % spacing;
  const offsetY = bgScrollY % spacing;

  for (let x = -spacing + offsetX; x < canvasWidth + spacing; x += spacing) {
    for (let y = -spacing + offsetY; y < canvasHeight + spacing; y += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}
