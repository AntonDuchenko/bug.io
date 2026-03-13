// ============================================================
// Bug.io — Projectile Management (TASK-05 / TASK-08)
// ============================================================

const projectiles = [];

function updateProjectiles(dt) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    const move = speed * dt;

    // Save trail position
    p.trail.push({ x: p.x, y: p.y });
    if (p.trail.length > (CONFIG.SKILL_CONSOLE_LOG.trailLength || 5)) {
      p.trail.shift();
    }

    // Homing: adjust direction toward nearest enemy (Auto Deploy evolution)
    if (p.homing) {
      const near = getEnemiesNear(p.x, p.y, 200);
      if (near.length > 0) {
        let closest = near[0];
        let closestDist = (near[0].x - p.x) ** 2 + (near[0].y - p.y) ** 2;
        for (let j = 1; j < near.length; j++) {
          const d = (near[j].x - p.x) ** 2 + (near[j].y - p.y) ** 2;
          if (d < closestDist && near[j].hp > 0) { closest = near[j]; closestDist = d; }
        }
        const targetAngle = Math.atan2(closest.y - p.y, closest.x - p.x);
        const currentAngle = Math.atan2(p.vy, p.vx);
        // Smoothly turn toward target
        let angleDiff = targetAngle - currentAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        const turnRate = 5; // radians per second
        const newAngle = currentAngle + Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), turnRate * dt);
        p.vx = Math.cos(newAngle) * speed;
        p.vy = Math.sin(newAngle) * speed;
      }
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.traveled += move;

    // Remove if max distance or out of map
    if (p.traveled >= p.maxDistance ||
        p.x < 0 || p.x > CONFIG.MAP_WIDTH ||
        p.y < 0 || p.y > CONFIG.MAP_HEIGHT) {
      projectiles.splice(i, 1);
    }
  }
}

function renderProjectiles() {
  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  for (let i = 0; i < projectiles.length; i++) {
    const p = projectiles[i];

    // Skip if off screen
    if (p.x < camera.x - 20 || p.x > camera.x + canvasWidth + 20 ||
        p.y < camera.y - 20 || p.y > camera.y + canvasHeight + 20) continue;

    const color = p.color || CONFIG.SKILL_CONSOLE_LOG.color;

    // Trail
    for (let t = 0; t < p.trail.length; t++) {
      const alpha = (t + 1) / (p.trail.length + 1) * 0.4;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.trail[t].x, p.trail[t].y, p.radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Main projectile
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}
