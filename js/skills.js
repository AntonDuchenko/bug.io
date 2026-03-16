// ============================================================
// Bug.io — Unified Skill System (TASK-08)
// ============================================================

const visualEffects = [];
const activeSkills = {};

// --- Damage helper (respects boss immunity) ---
function dealDamageToEnemy(e, dmg, showNumber) {
  if (e.immune) {
    if (showNumber !== false) spawnDamageNumber(e.x, e.y - e.radius, 'IMMUNE', '#627eea');
    return false;
  }
  e.hp -= dmg;
  e.hitFlash = 0.1;
  e.damaged = true;
  // Stack Overflow clone on hit
  if (e.isBoss && typeof tryStackOverflowClone === 'function') {
    tryStackOverflowClone(e);
  }
  return true;
}

// --- Skill Definitions ---

const SKILL_DEFS = {
  console_log: {
    name: 'Console.log',
    emoji: '📝',
    type: 'projectile',
    maxLevel: 5,
    getParams(lvl) {
      const b = CONFIG.SKILL_CONSOLE_LOG;
      return {
        directions: b.directions + (lvl - 1),
        damage: b.damage + (lvl - 1) * 5,
        cooldown: b.cooldown - (lvl - 1) * 0.1,
        speed: b.speed,
        radius: b.radius,
        maxDistance: b.maxDistance + (lvl - 1) * 20,
      };
    },
    getDescription(lvl) {
      const p = this.getParams(lvl);
      return `${p.directions} projectiles, ${p.damage} dmg`;
    },
    fire(skill) {
      const p = this.getParams(skill.level);
      // Find nearest enemy to aim the cone at
      const near = getEnemiesNear(player.x, player.y, p.maxDistance + 200);
      let baseAngle;
      if (near.length > 0) {
        let closest = near[0];
        let closestDist = (near[0].x - player.x) ** 2 + (near[0].y - player.y) ** 2;
        for (let i = 1; i < near.length; i++) {
          const d = (near[i].x - player.x) ** 2 + (near[i].y - player.y) ** 2;
          if (d < closestDist) { closest = near[i]; closestDist = d; }
        }
        baseAngle = Math.atan2(closest.y - player.y, closest.x - player.x);
      } else {
        baseAngle = Math.atan2(player.dirY, player.dirX);
      }
      // Spread projectiles in a cone around baseAngle
      const spread = 0.6; // total cone width in radians (~35°)
      for (let i = 0; i < p.directions; i++) {
        const t = p.directions > 1 ? (i / (p.directions - 1) - 0.5) : 0;
        const angle = baseAngle + t * spread + (Math.random() - 0.5) * 0.1;
        projectiles.push({
          x: player.x, y: player.y,
          vx: Math.cos(angle) * p.speed,
          vy: Math.sin(angle) * p.speed,
          radius: p.radius, damage: p.damage,
          piercing: false,
          maxDistance: p.maxDistance, traveled: 0,
          trail: [], color: CONFIG.SKILL_CONSOLE_LOG.color,
        });
      }
    },
  },

  git_push: {
    name: 'Git Push',
    emoji: '🚀',
    type: 'projectile',
    maxLevel: 5,
    getParams(lvl) {
      const b = CONFIG.SKILL_GIT_PUSH;
      return {
        count: lvl >= 3 ? 2 : 1,
        damage: b.damage + (lvl - 1) * 10,
        cooldown: b.cooldown - (lvl - 1) * 0.15,
        speed: b.speed,
        radius: b.radius,
        maxDistance: b.maxDistance,
        piercing: lvl >= 5,
      };
    },
    getDescription(lvl) {
      const p = this.getParams(lvl);
      let desc = `${p.count} bolt${p.count > 1 ? 's' : ''}, ${p.damage} dmg`;
      if (p.piercing) desc += ', piercing';
      return desc;
    },
    fire(skill) {
      const p = this.getParams(skill.level);
      const near = getEnemiesNear(player.x, player.y, p.maxDistance + 200);
      let baseAngle;
      if (near.length > 0) {
        let closest = near[0];
        let closestDist = (near[0].x - player.x) ** 2 + (near[0].y - player.y) ** 2;
        for (let j = 1; j < near.length; j++) {
          const d = (near[j].x - player.x) ** 2 + (near[j].y - player.y) ** 2;
          if (d < closestDist) { closest = near[j]; closestDist = d; }
        }
        baseAngle = Math.atan2(closest.y - player.y, closest.x - player.x);
      } else {
        baseAngle = Math.atan2(player.dirY, player.dirX);
      }
      for (let i = 0; i < p.count; i++) {
        const spread = p.count > 1 ? (i - 0.5) * 0.2 : 0;
        const angle = baseAngle + spread;
        projectiles.push({
          x: player.x, y: player.y,
          vx: Math.cos(angle) * p.speed,
          vy: Math.sin(angle) * p.speed,
          radius: p.radius, damage: p.damage,
          piercing: p.piercing,
          maxDistance: p.maxDistance, traveled: 0,
          trail: [], color: CONFIG.SKILL_GIT_PUSH.color,
        });
      }
    },
  },

  npm_install: {
    name: 'npm install',
    emoji: '📦',
    type: 'aoe',
    maxLevel: 5,
    getParams(lvl) {
      const b = CONFIG.SKILL_NPM_INSTALL;
      return {
        damage: b.damage + (lvl - 1) * 10,
        cooldown: b.cooldown - (lvl - 1) * 0.3,
        radius: lvl >= 3 ? Math.round(b.radius * 1.3) : b.radius,
        slow: lvl >= 5,
      };
    },
    getDescription(lvl) {
      const p = this.getParams(lvl);
      let desc = `AOE ${p.damage} dmg, r=${p.radius}`;
      if (p.slow) desc += ', slows';
      return desc;
    },
    fire(skill) {
      const p = this.getParams(skill.level);
      const near = getEnemiesNear(player.x, player.y, p.radius + 30);
      for (let i = 0; i < near.length; i++) {
        const e = near[i];
        const dx = e.x - player.x;
        const dy = e.y - player.y;
        if (dx * dx + dy * dy < p.radius * p.radius) {
          if (dealDamageToEnemy(e, p.damage)) {
            spawnDamageNumber(e.x, e.y - e.radius, p.damage);
            if (e.hp <= 0) killCount++;
            if (p.slow && e.hp > 0) {
              e.slowTimer = 2;
              e.slowFactor = 0.5;
            }
          }
        }
      }
      // Visual ring
      visualEffects.push({
        type: 'ring', x: player.x, y: player.y,
        radius: 0, maxRadius: p.radius,
        life: CONFIG.SKILL_NPM_INSTALL.duration,
        maxLife: CONFIG.SKILL_NPM_INSTALL.duration,
        color: CONFIG.SKILL_NPM_INSTALL.color,
      });
    },
  },

  stack_trace: {
    name: 'Stack Trace',
    emoji: '⚡',
    type: 'laser',
    maxLevel: 5,
    getParams(lvl) {
      const b = CONFIG.SKILL_STACK_TRACE;
      return {
        targets: lvl >= 3 ? 2 : 1,
        dps: lvl >= 5 ? b.dps * 2 + (lvl - 1) * 15 : b.dps + (lvl - 1) * 15,
        cooldown: b.cooldown - (lvl - 1) * 0.2,
        duration: b.duration + (lvl - 1) * 0.1,
        range: b.range,
      };
    },
    getDescription(lvl) {
      const p = this.getParams(lvl);
      return `${p.targets} target${p.targets > 1 ? 's' : ''}, ${Math.round(p.dps)} DPS`;
    },
    fire(skill) {
      const p = this.getParams(skill.level);
      // Find nearest enemies
      const near = getEnemiesNear(player.x, player.y, p.range + 50);
      near.sort((a, b) => {
        const da = (a.x - player.x) ** 2 + (a.y - player.y) ** 2;
        const db = (b.x - player.x) ** 2 + (b.y - player.y) ** 2;
        return da - db;
      });
      const targets = near.slice(0, p.targets).filter(e => {
        const dx = e.x - player.x;
        const dy = e.y - player.y;
        return dx * dx + dy * dy < p.range * p.range;
      });
      if (targets.length > 0) {
        skill.laserTargets = targets;
        skill.laserTimer = p.duration;
        skill.laserDps = p.dps;
      }
    },
  },

  hot_reload: {
    name: 'Hot Reload',
    emoji: '♻️',
    type: 'heal',
    maxLevel: 5,
    getParams(lvl) {
      const b = CONFIG.SKILL_HOT_RELOAD;
      return {
        heal: b.healAmount + (lvl - 1) * 5,
        cooldown: lvl >= 3 ? b.cooldown * 0.7 : b.cooldown,
        shield: lvl >= 5,
      };
    },
    getDescription(lvl) {
      const p = this.getParams(lvl);
      let desc = `+${p.heal} HP every ${p.cooldown.toFixed(1)}s`;
      if (p.shield) desc += ', shield';
      return desc;
    },
    fire(skill) {
      const p = this.getParams(skill.level);
      const healed = Math.min(p.heal, player.maxHp - player.hp);
      if (healed > 0) {
        player.hp += healed;
        spawnDamageNumber(player.x, player.y - player.radius, '+' + healed, CONFIG.SKILL_HOT_RELOAD.color);
        spawnHealParticles(player.x, player.y);
      }
      // Visual
      visualEffects.push({
        type: 'heal', x: player.x, y: player.y,
        life: 0.5, maxLife: 0.5,
        color: CONFIG.SKILL_HOT_RELOAD.color,
      });
      // Shield at lv5
      if (p.shield && !skill.shieldActive) {
        if (!skill.shieldCooldownTimer || skill.shieldCooldownTimer <= 0) {
          skill.shieldActive = true;
          skill.shieldCooldownTimer = CONFIG.SKILL_HOT_RELOAD.shieldCooldown;
        }
      }
    },
  },

  '404_not_found': {
    name: '404 Not Found',
    emoji: '🔍',
    type: 'utility',
    maxLevel: 5,
    getParams(lvl) {
      const b = CONFIG.SKILL_404;
      return {
        targets: lvl >= 3 ? 3 : 1,
        damage: b.damage + (lvl - 1) * 5,
        cooldown: b.cooldown - (lvl - 1) * 0.4,
        range: b.range,
      };
    },
    getDescription(lvl) {
      const p = this.getParams(lvl);
      return `Teleport ${p.targets} enem${p.targets > 1 ? 'ies' : 'y'}, ${p.damage} dmg`;
    },
    fire(skill) {
      const p = this.getParams(skill.level);
      const near = getEnemiesNear(player.x, player.y, p.range + 50);
      near.sort((a, b) => {
        const da = (a.x - player.x) ** 2 + (a.y - player.y) ** 2;
        const db = (b.x - player.x) ** 2 + (b.y - player.y) ** 2;
        return da - db;
      });
      const targets = near.slice(0, p.targets).filter(e => {
        const dx = e.x - player.x;
        const dy = e.y - player.y;
        return dx * dx + dy * dy < p.range * p.range;
      });
      for (const e of targets) {
        // Teleport effect at old position
        visualEffects.push({
          type: 'teleport', x: e.x, y: e.y,
          life: 0.4, maxLife: 0.4,
          color: CONFIG.SKILL_404.color, radius: e.radius * 2,
        });
        // Teleport to random distant position
        const angle = Math.random() * Math.PI * 2;
        const dist = 400 + Math.random() * 300;
        e.x = Math.max(e.radius, Math.min(CONFIG.MAP_WIDTH - e.radius, player.x + Math.cos(angle) * dist));
        e.y = Math.max(e.radius, Math.min(CONFIG.MAP_HEIGHT - e.radius, player.y + Math.sin(angle) * dist));
        // Damage
        if (dealDamageToEnemy(e, p.damage)) {
          spawnDamageNumber(e.x, e.y - e.radius, p.damage);
          if (e.hp <= 0) killCount++;
        }
      }
    },
  },

  // --- Hero-specific skills ---

  sql_query: {
    name: 'SQL Query',
    emoji: '🗃️',
    type: 'aoe',
    maxLevel: 5,
    getParams(lvl) {
      const b = CONFIG.SKILL_SQL_QUERY;
      return {
        damage: b.damage + (lvl - 1) * 8,
        cooldown: b.cooldown - (lvl - 1) * 0.15,
        width: b.width + (lvl - 1) * 10,
        length: b.length + (lvl - 1) * 20,
      };
    },
    getDescription(lvl) {
      const p = this.getParams(lvl);
      return `${p.damage} dmg, ${p.width}x${p.length} zone`;
    },
    fire(skill) {
      const p = this.getParams(skill.level);
      // Rectangular AOE in front of player
      const near = getEnemiesNear(player.x + player.dirX * p.length / 2, player.y + player.dirY * p.length / 2, p.length);
      for (const e of near) {
        // Check if enemy is in the rectangle ahead of player
        const dx = e.x - player.x;
        const dy = e.y - player.y;
        // Project onto player direction
        const dot = dx * player.dirX + dy * player.dirY;
        if (dot < 0 || dot > p.length) continue;
        // Perpendicular distance
        const perp = Math.abs(dx * (-player.dirY) + dy * player.dirX);
        if (perp > p.width / 2) continue;
        const dmg = applyCrit(p.damage * (player.damageMult || 1));
        if (dealDamageToEnemy(e, dmg.value)) {
          spawnDamageNumber(e.x, e.y - e.radius, Math.round(dmg.value), dmg.crit ? '#ff6b6b' : undefined);
          if (e.hp <= 0) killCount++;
        }
      }
      // Visual: rectangular flash
      visualEffects.push({
        type: 'sql_zone',
        x: player.x, y: player.y,
        dirX: player.dirX, dirY: player.dirY,
        width: p.width, length: p.length,
        life: CONFIG.SKILL_SQL_QUERY.duration,
        maxLife: CONFIG.SKILL_SQL_QUERY.duration,
        color: CONFIG.SKILL_SQL_QUERY.color,
      });
    },
  },

  docker: {
    name: 'Docker Container',
    emoji: '🐳',
    type: 'utility',
    maxLevel: 5,
    getParams(lvl) {
      const b = CONFIG.SKILL_DOCKER;
      return {
        cooldown: b.cooldown - (lvl - 1) * 0.5,
      };
    },
    getDescription(lvl) {
      const p = this.getParams(lvl);
      return `Shield every ${p.cooldown.toFixed(1)}s`;
    },
    fire(skill) {
      // Grant a one-hit shield (similar to hot_reload lv5 but always)
      if (!skill.shieldActive) {
        skill.shieldActive = true;
        visualEffects.push({
          type: 'ring', x: player.x, y: player.y,
          radius: 0, maxRadius: player.radius + 15,
          life: 0.3, maxLife: 0.3,
          color: CONFIG.SKILL_DOCKER.color,
        });
      }
    },
  },

  exploit: {
    name: 'Exploit',
    emoji: '💥',
    type: 'utility',
    maxLevel: 5,
    getParams(lvl) {
      const b = CONFIG.SKILL_EXPLOIT;
      return {
        damage: b.damage + (lvl - 1) * 8,
        cooldown: b.cooldown - (lvl - 1) * 0.1,
      };
    },
    getDescription(lvl) {
      const p = this.getParams(lvl);
      return `Random effect, ${p.damage} dmg`;
    },
    fire(skill) {
      const p = this.getParams(skill.level);
      const roll = Math.random();
      const b = CONFIG.SKILL_EXPLOIT;
      if (roll < 0.33) {
        // AOE burst
        const near = getEnemiesNear(player.x, player.y, b.aoeRadius + 30);
        for (const e of near) {
          const dx = e.x - player.x;
          const dy = e.y - player.y;
          if (dx * dx + dy * dy < b.aoeRadius * b.aoeRadius) {
            const dmg = applyCrit(p.damage * (player.damageMult || 1));
            if (dealDamageToEnemy(e, dmg.value)) {
              spawnDamageNumber(e.x, e.y - e.radius, Math.round(dmg.value), dmg.crit ? '#ff6b6b' : undefined);
              if (e.hp <= 0) killCount++;
            }
          }
        }
        visualEffects.push({
          type: 'ring', x: player.x, y: player.y,
          radius: 0, maxRadius: b.aoeRadius,
          life: 0.3, maxLife: 0.3, color: b.color,
        });
      } else if (roll < 0.66) {
        // Projectile burst (5 random directions)
        for (let i = 0; i < 5; i++) {
          const angle = Math.random() * Math.PI * 2;
          projectiles.push({
            x: player.x, y: player.y,
            vx: Math.cos(angle) * b.projSpeed,
            vy: Math.sin(angle) * b.projSpeed,
            radius: 6, damage: applyCrit(p.damage * (player.damageMult || 1)).value,
            piercing: false,
            maxDistance: b.projMaxDist, traveled: 0,
            trail: [], color: b.color,
          });
        }
      } else {
        // Slow all nearby enemies
        const near = getEnemiesNear(player.x, player.y, b.aoeRadius + 50);
        for (const e of near) {
          const dx = e.x - player.x;
          const dy = e.y - player.y;
          if (dx * dx + dy * dy < (b.aoeRadius + 30) * (b.aoeRadius + 30) && e.hp > 0) {
            e.slowTimer = b.slowDuration;
            e.slowFactor = 0.3;
          }
        }
        visualEffects.push({
          type: 'ring', x: player.x, y: player.y,
          radius: 0, maxRadius: b.aoeRadius + 30,
          life: 0.4, maxLife: 0.4, color: '#8b949e',
        });
      }
    },
  },
};

// --- Crit System ---
function applyCrit(baseDamage) {
  const chance = (player.critChance || 0) + CONFIG.BASE_CRIT_CHANCE;
  if (Math.random() < chance) {
    return { value: baseDamage * 2, crit: true };
  }
  return { value: baseDamage, crit: false };
}

// --- Active Skill Management ---

function addSkill(id) {
  if (activeSkills[id]) return;
  const def = SKILL_DEFS[id];
  if (!def) return;
  activeSkills[id] = {
    id,
    level: 1,
    cooldown: 0,
    // Laser-specific
    laserTargets: null,
    laserTimer: 0,
    laserDps: 0,
    // Shield-specific
    shieldActive: false,
    shieldCooldownTimer: 0,
  };
}

function upgradeSkill(id) {
  const skill = activeSkills[id];
  if (!skill) {
    addSkill(id);
    return;
  }
  const def = SKILL_DEFS[id];
  if (skill.level < def.maxLevel) {
    skill.level++;
  }
}

function getSkillLevel(id) {
  return activeSkills[id] ? activeSkills[id].level : 0;
}

function getAllActiveSkills() {
  return Object.values(activeSkills);
}

// --- Evolved Skill Fire Functions ---
const EVOLVED_FIRE = {
  // Breakpoint: Console.log projectiles freeze enemies for 3s on hit
  breakpoint(skill, def) {
    const p = def.getParams(skill.level);
    const near = getEnemiesNear(player.x, player.y, p.maxDistance + 200);
    let baseAngle;
    if (near.length > 0) {
      let closest = near[0];
      let closestDist = (near[0].x - player.x) ** 2 + (near[0].y - player.y) ** 2;
      for (let i = 1; i < near.length; i++) {
        const d = (near[i].x - player.x) ** 2 + (near[i].y - player.y) ** 2;
        if (d < closestDist) { closest = near[i]; closestDist = d; }
      }
      baseAngle = Math.atan2(closest.y - player.y, closest.x - player.x);
    } else {
      baseAngle = Math.atan2(player.dirY, player.dirX);
    }
    const spread = 0.6;
    for (let i = 0; i < p.directions; i++) {
      const t = p.directions > 1 ? (i / (p.directions - 1) - 0.5) : 0;
      const angle = baseAngle + t * spread + (Math.random() - 0.5) * 0.1;
      projectiles.push({
        x: player.x, y: player.y,
        vx: Math.cos(angle) * p.speed,
        vy: Math.sin(angle) * p.speed,
        radius: p.radius, damage: p.damage * (player.damageMult || 1),
        piercing: false,
        maxDistance: p.maxDistance, traveled: 0,
        trail: [], color: CONFIG.EVOLUTIONS.breakpoint.color,
        onHit: 'freeze', freezeDuration: CONFIG.EVOLUTIONS.breakpoint.freezeDuration,
      });
    }
  },

  // Auto Deploy: Git Push projectiles auto-aim at nearest enemy
  auto_deploy(skill, def) {
    const p = def.getParams(skill.level);
    for (let i = 0; i < p.count; i++) {
      // Find nearest enemy for each bolt
      const near = getEnemiesNear(player.x, player.y, p.maxDistance + 200);
      let angle;
      if (near.length > 0) {
        // Sort by distance, pick i-th closest (or last available)
        near.sort((a, b) => {
          const da = (a.x - player.x) ** 2 + (a.y - player.y) ** 2;
          const db = (b.x - player.x) ** 2 + (b.y - player.y) ** 2;
          return da - db;
        });
        const target = near[Math.min(i, near.length - 1)];
        angle = Math.atan2(target.y - player.y, target.x - player.x);
      } else {
        angle = Math.atan2(player.dirY, player.dirX);
      }
      projectiles.push({
        x: player.x, y: player.y,
        vx: Math.cos(angle) * p.speed,
        vy: Math.sin(angle) * p.speed,
        radius: p.radius, damage: p.damage * (player.damageMult || 1),
        piercing: p.piercing,
        maxDistance: p.maxDistance, traveled: 0,
        trail: [], color: CONFIG.EVOLUTIONS.auto_deploy.color,
        homing: true,
      });
    }
  },

  // node_modules: AOE radius x3, but freeze game 0.5s
  node_modules(skill, def) {
    const p = def.getParams(skill.level);
    const evoRadius = p.radius * CONFIG.EVOLUTIONS.node_modules.radiusMult;
    const near = getEnemiesNear(player.x, player.y, evoRadius + 30);
    for (let i = 0; i < near.length; i++) {
      const e = near[i];
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      if (dx * dx + dy * dy < evoRadius * evoRadius) {
        const dmg = p.damage * (player.damageMult || 1);
        if (dealDamageToEnemy(e, dmg)) {
          spawnDamageNumber(e.x, e.y - e.radius, Math.round(dmg));
          if (e.hp <= 0) killCount++;
          if (p.slow && e.hp > 0) {
            e.slowTimer = 2;
            e.slowFactor = 0.5;
          }
        }
      }
    }
    // Visual ring
    visualEffects.push({
      type: 'ring', x: player.x, y: player.y,
      radius: 0, maxRadius: evoRadius,
      life: CONFIG.SKILL_NPM_INSTALL.duration,
      maxLife: CONFIG.SKILL_NPM_INSTALL.duration,
      color: CONFIG.EVOLUTIONS.node_modules.color,
    });
    // Game freeze effect
    triggerNodeModulesFreeze();
  },

  // Strict Mode: fires like stack_trace but double dmg to elites (handled in laser tick)
  strict_mode(skill, def) {
    def.fire(skill); // normal fire, damage modification in laser tick
  },

  // Container: fires like hot_reload normally (immunity handled in updateSkills)
  container(skill, def) {
    def.fire(skill);
  },
};

// node_modules freeze overlay
function triggerNodeModulesFreeze() {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;pointer-events:none;';
  overlay.innerHTML = '<div style="color:#3fb950;font:bold 24px monospace;text-align:center;">npm install...<br><span style="font-size:14px;color:#8b949e;">Installing node_modules</span></div>';
  document.body.appendChild(overlay);
  // Pause game briefly
  const prevState = game.state;
  game.state = GameState.PAUSED;
  setTimeout(() => {
    document.body.removeChild(overlay);
    if (game.state === GameState.PAUSED && !levelUpActive) {
      game.state = prevState;
    }
  }, CONFIG.EVOLUTIONS.node_modules.freezeTime * 1000);
}

// --- Update ---

function updateSkills(dt) {
  for (const id in activeSkills) {
    const skill = activeSkills[id];
    const def = SKILL_DEFS[id];
    if (!def) continue;

    const params = def.getParams(skill.level);

    // Apply cooldown reduction from CI/CD passive
    const cdMult = player.cooldownMult || 1;

    // Cooldown
    skill.cooldown -= dt;
    if (skill.cooldown <= 0) {
      // Cloud Infrastructure: check credits before firing
      if (typeof cloudUseCredits === 'function' && !cloudUseCredits(typeof CLOUD_SKILL_COST !== 'undefined' ? CLOUD_SKILL_COST : 3)) {
        skill.cooldown = params.cooldown * cdMult;
      } else {
        // Use evolved fire if applicable
        if (skill.evolved && EVOLVED_FIRE[skill.evolved]) {
          EVOLVED_FIRE[skill.evolved](skill, def);
        } else {
          def.fire(skill);
        }
        skill.cooldown = params.cooldown * cdMult;
      }
    }

    // Laser tick damage
    if (def.type === 'laser' && skill.laserTimer > 0) {
      skill.laserTimer -= dt;
      if (skill.laserTargets) {
        for (const e of skill.laserTargets) {
          if (e.hp > 0) {
            let dmg = skill.laserDps * dt;
            // Strict Mode: double damage to elites
            if (skill.evolved === 'strict_mode' && (e.isElite || e.isBoss)) {
              dmg *= CONFIG.EVOLUTIONS.strict_mode.eliteDmgMult;
            }
            // Apply global damage multiplier
            dmg *= (player.damageMult || 1);
            if (dealDamageToEnemy(e, dmg, false)) {
              if (Math.random() < dt * 3) {
                const displayDmg = Math.round(skill.laserDps * 0.3 * (player.damageMult || 1));
                spawnDamageNumber(e.x, e.y - e.radius, displayDmg);
              }
              if (e.hp <= 0) killCount++;
            }
          }
        }
      }
      if (skill.laserTimer <= 0) {
        skill.laserTargets = null;
      }
    }

    // Shield cooldown (hot_reload)
    if (skill.shieldCooldownTimer > 0) {
      skill.shieldCooldownTimer -= dt;
    }

    // Container evolution: immunity timer
    if (skill.evolved === 'container' && skill.evoData) {
      if (skill.evoData.immuneTimer > 0) {
        skill.evoData.immuneTimer -= dt;
        player._containerImmune = skill.evoData.immuneTimer > 0;
      }
      if (skill.evoData.immuneCooldown > 0) {
        skill.evoData.immuneCooldown -= dt;
      }
      // Activate immunity when cooldown is ready
      if (skill.evoData.immuneTimer <= 0 && skill.evoData.immuneCooldown <= 0) {
        skill.evoData.immuneTimer = CONFIG.EVOLUTIONS.container.immuneDuration;
        skill.evoData.immuneCooldown = CONFIG.EVOLUTIONS.container.immuneCooldown;
        player._containerImmune = true;
        visualEffects.push({
          type: 'ring', x: player.x, y: player.y,
          radius: 0, maxRadius: player.radius + 30,
          life: 0.5, maxLife: 0.5,
          color: CONFIG.EVOLUTIONS.container.color,
        });
      }
    }
  }

  // Update visual effects
  for (let i = visualEffects.length - 1; i >= 0; i--) {
    const v = visualEffects[i];
    v.life -= dt;
    if (v.type === 'ring') {
      v.radius = v.maxRadius * (1 - v.life / v.maxLife);
    }
    if (v.life <= 0) visualEffects.splice(i, 1);
  }
}

// --- Render ---

function renderSkills() {
  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  // Visual effects
  for (const v of visualEffects) {
    const alpha = Math.max(0, v.life / v.maxLife);

    if (v.type === 'ring') {
      ctx.globalAlpha = alpha * 0.4;
      ctx.strokeStyle = v.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(v.x, v.y, v.radius, 0, Math.PI * 2);
      ctx.stroke();
      // Fill
      ctx.globalAlpha = alpha * 0.1;
      ctx.fillStyle = v.color;
      ctx.fill();
    } else if (v.type === 'heal') {
      // Rising green particles
      ctx.globalAlpha = alpha * 0.6;
      ctx.fillStyle = v.color;
      const t = 1 - v.life / v.maxLife;
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + t * 2;
        const r = 20 + t * 15;
        const px = v.x + Math.cos(angle) * r;
        const py = v.y - t * 30 + Math.sin(angle) * 5;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (v.type === 'teleport') {
      ctx.globalAlpha = alpha * 0.7;
      ctx.strokeStyle = v.color;
      ctx.lineWidth = 2;
      const r = v.radius * (1 + (1 - alpha) * 0.5);
      ctx.beginPath();
      ctx.arc(v.x, v.y, r, 0, Math.PI * 2);
      ctx.stroke();
      // X mark
      ctx.beginPath();
      ctx.moveTo(v.x - r * 0.5, v.y - r * 0.5);
      ctx.lineTo(v.x + r * 0.5, v.y + r * 0.5);
      ctx.moveTo(v.x + r * 0.5, v.y - r * 0.5);
      ctx.lineTo(v.x - r * 0.5, v.y + r * 0.5);
      ctx.stroke();
    } else if (v.type === 'sql_zone') {
      ctx.globalAlpha = alpha * 0.3;
      ctx.fillStyle = v.color;
      ctx.save();
      ctx.translate(v.x, v.y);
      const angle = Math.atan2(v.dirY, v.dirX);
      ctx.rotate(angle);
      ctx.fillRect(0, -v.width / 2, v.length, v.width);
      ctx.restore();
    }
  }

  // Laser beams
  for (const id in activeSkills) {
    const skill = activeSkills[id];
    if (skill.laserTimer > 0 && skill.laserTargets) {
      const color = CONFIG.SKILL_STACK_TRACE.color;
      for (const e of skill.laserTargets) {
        if (e.hp <= 0) continue;
        ctx.globalAlpha = Math.min(1, skill.laserTimer * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = CONFIG.SKILL_STACK_TRACE.width;
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(e.x, e.y);
        ctx.stroke();
        // Glow
        ctx.globalAlpha = Math.min(0.3, skill.laserTimer);
        ctx.lineWidth = CONFIG.SKILL_STACK_TRACE.width * 3;
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(e.x, e.y);
        ctx.stroke();
      }
    }
  }

  // Docker shield visual
  const dockerSkill = activeSkills['docker'];
  if (dockerSkill && dockerSkill.shieldActive) {
    ctx.globalAlpha = 0.3 + Math.sin(game.elapsed * 5) * 0.1;
    ctx.strokeStyle = CONFIG.SKILL_DOCKER.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius + 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = CONFIG.SKILL_DOCKER.color;
    ctx.fill();
  }

  // Shield visual
  const hrSkill = activeSkills['hot_reload'];
  if (hrSkill && hrSkill.shieldActive) {
    ctx.globalAlpha = 0.3 + Math.sin(game.elapsed * 4) * 0.1;
    ctx.strokeStyle = '#58a6ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius + 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = '#58a6ff';
    ctx.fill();
  }

  // Container immunity visual
  if (hrSkill && hrSkill.evolved === 'container' && player._containerImmune) {
    ctx.globalAlpha = 0.4 + Math.sin(game.elapsed * 6) * 0.15;
    ctx.strokeStyle = CONFIG.EVOLUTIONS.container.color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius + 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = CONFIG.EVOLUTIONS.container.color;
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

// --- Shield check (called from collision) ---
function checkShieldAbsorb() {
  // Check Docker shield first
  const dockerSkill = activeSkills['docker'];
  if (dockerSkill && dockerSkill.shieldActive) {
    dockerSkill.shieldActive = false;
    visualEffects.push({
      type: 'ring', x: player.x, y: player.y,
      radius: 0, maxRadius: player.radius + 20,
      life: 0.3, maxLife: 0.3,
      color: CONFIG.SKILL_DOCKER.color,
    });
    return true;
  }
  // Then Hot Reload shield
  const hrSkill = activeSkills['hot_reload'];
  if (hrSkill && hrSkill.shieldActive) {
    hrSkill.shieldActive = false;
    visualEffects.push({
      type: 'ring', x: player.x, y: player.y,
      radius: 0, maxRadius: player.radius + 20,
      life: 0.3, maxLife: 0.3,
      color: '#58a6ff',
    });
    return true;
  }
  return false;
}

// --- Reset ---
function resetSkills() {
  for (const key in activeSkills) delete activeSkills[key];
  visualEffects.length = 0;
}

// Init — player starts with console_log
addSkill('console_log');
