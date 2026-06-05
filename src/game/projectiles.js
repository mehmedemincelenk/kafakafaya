import { k } from "../kaplay.js";
import { drawProjectileDetails } from "../utils.js";
import { spawnExplosion, inflictDamage } from "../utils.js";
import { PROJECTILES } from "../config.js";

// Homing (güdümlü) mühimmat fırlatma
export function spawnWeapon(shooter, type) {
  const target = k.get("player").find(p => p.carTag !== shooter.carTag);
  if (!target) return;

  // Çıkış konumu: Aracın burnundan fırlatıyoruz
  const rad = k.deg2rad(shooter.angle);
  const offsetDistance = shooter.width / 2 + 15;
  const startPos = shooter.pos.add(k.vec2(Math.cos(rad) * offsetDistance, Math.sin(rad) * offsetDistance));

  // Roket destekli (RATO) veya katapult fırlatma görsel ve ses hissiyatı
  k.shake(2);

  const spec = PROJECTILES[type] || PROJECTILES.mizrak;
  const isSivrisinek = type === "sivrisinek";
  const count = isSivrisinek ? (spec.swarmCount || 15) : 1;

  for (let i = 0; i < count; i++) {
    let finalStartPos = startPos;
    let finalAngle = shooter.angle;
    let finalSpeed = isSivrisinek ? spec.physSpeed : spec.speed;
    let finalTurnSpeed = isSivrisinek ? spec.physTurnSpeed : spec.turnSpeed;
    let finalExplosionRadius = isSivrisinek ? spec.physExplosionRadius : spec.explosionRadius;
    let finalDamage = isSivrisinek ? spec.physDamage : spec.damage;

    if (isSivrisinek) {
      finalAngle = shooter.angle + k.rand(-25, 25);
      finalStartPos = startPos.add(k.vec2(k.rand(-12, 12), k.rand(-12, 12)));
      finalSpeed = k.rand(finalSpeed - 40, finalSpeed + 40);
      finalTurnSpeed = k.rand(finalTurnSpeed - 30, finalTurnSpeed + 30);
    }

    const proj = k.add([
      k.rect(spec.width, spec.height),
      k.pos(finalStartPos),
      k.rotate(finalAngle),
      k.color(15, 23, 30),
      k.opacity(0),
      k.anchor("center"),
      k.area(),
      "active_projectile",
      {
        type,
        damage: finalDamage,
        speed: finalSpeed,
        turnSpeed: finalTurnSpeed,
        explosionRadius: finalExplosionRadius,
        bypassArmor: spec.bypassArmor || false,
        health: spec.health || 1,
        target: target,
      }
    ]);

    const projColor = k.rgb(255, 60, 60);
    drawProjectileDetails(proj, type, projColor);

    proj.onUpdate(() => {
      if (k.isGamePaused || k.gameOver) return;

      if (proj.target && proj.target.exists()) {
        const angleToTarget = k.vec2(proj.target.pos).sub(proj.pos).angle();
        let diff = angleToTarget - proj.angle;
        while (diff < -180) diff += 360;
        while (diff > 180) diff -= 360;
        proj.angle += diff * k.dt() * (proj.turnSpeed / 60);
      }

      const pRad = k.deg2rad(proj.angle);
      proj.move(Math.cos(pRad) * proj.speed, Math.sin(pRad) * proj.speed);

      const chanceVal = type === "sivrisinek" ? 0.25 : 0.45;
      if (k.chance(chanceVal)) {
        const smokePos = proj.pos.sub(k.vec2(Math.cos(pRad) * (type === "sivrisinek" ? 4 : 12), Math.sin(pRad) * (type === "sivrisinek" ? 4 : 12)));
        const trail = k.add([
          k.circle(type === "sivrisinek" ? k.rand(1, 1.5) : k.rand(2, 5)),
          k.pos(smokePos),
          k.color(255, k.rand(80, 180), 0),
          k.opacity(0.8),
          k.anchor("center"),
          k.z(-1),
        ]);
        trail.onUpdate(() => {
          trail.opacity -= k.dt() * (type === "sivrisinek" ? 6 : 4);
          if (trail.opacity <= 0) trail.destroy();
        });
      }

      if (proj.pos.x < 0 || proj.pos.x > k.width() || proj.pos.y < 0 || proj.pos.y > k.height()) {
        explodeProjectile(proj);
      }
    });

    proj.onCollide("player", (opp) => {
      if (opp === shooter) return;
      explodeProjectile(proj, opp);
    });
  }
}

// Destek IHA'sı çağırma
export function spawnSupport(shooter, type) {
  const target = k.get("player").find(p => p.carTag !== shooter.carTag);

  k.shake(1.5);

  if (type === "kalkan_diha") {
    // KALKAN DİHA: Kullanıcının üzerinde kalır, 15sn boyunca can yeniler ve korur
    const drone = k.add([
      k.rect(20, 20),
      k.pos(shooter.pos.add(0, -50)),
      k.color(15, 23, 30),
      k.opacity(0),
      k.anchor("center"),
      "active_support",
      {
        type,
        timer: 15.0,
      }
    ]);
    drawProjectileDetails(drone, type, k.rgb(255, 0, 128)); // Neon Pembe

    // Yeşil iyileşme dairesi
    const repairGlow = k.add([
      k.circle(45),
      k.pos(shooter.pos),
      k.color(100, 255, 100),
      k.opacity(0.12),
      k.anchor("center"),
      k.z(-2),
    ]);

    drone.onUpdate(() => {
      if (k.isGamePaused || k.gameOver || !shooter.exists()) {
        drone.destroy();
        repairGlow.destroy();
        return;
      }

      // Kullanıcının üstünde kalmasını sağla
      drone.pos = shooter.pos.add(k.vec2(0, -50));
      repairGlow.pos = shooter.pos;

      // Zırh/Can yenileme (+4 HP/sn)
      shooter.hp = Math.min(shooter.maxHp, shooter.hp + 4 * k.dt());

      // Zamanlayıcı güncelleme
      drone.timer -= k.dt();
      if (drone.timer <= 0) {
        drone.destroy();
        repairGlow.destroy();
      }
    });
  }
  else if (type === "mini_iha") {
    // MINI IHA: Düşmanın üstünde döner, yavaşlatır ve kontrollerini tersine çevirir
    if (!target) return;

    const drone = k.add([
      k.rect(20, 20),
      k.pos(target.pos.add(0, -60)),
      k.color(15, 23, 30),
      k.opacity(0),
      k.anchor("center"),
      "active_support",
      {
        type,
        timer: 10.0,
        angleOffset: 0,
      }
    ]);
    drawProjectileDetails(drone, type, k.rgb(255, 0, 128)); // Neon Pembe

    drone.onUpdate(() => {
      if (k.isGamePaused || k.gameOver || !target.exists()) {
        drone.destroy();
        return;
      }

      // Düşmanın kontrollerini sabote et ve yavaşlat
      target.slowTimer = 0.5; // Sürekli yenilenir
      target.reversedControlsTimer = 0.5; // Sürekli yenilenir

      // Düşmanın üstünde dairesel yörüngede süzülme
      drone.angleOffset += k.dt() * 3.0;
      const ox = Math.cos(drone.angleOffset) * 45;
      const oy = Math.sin(drone.angleOffset) * 45 - 30;
      drone.pos = target.pos.add(k.vec2(ox, oy));
      drone.angle = k.rad2deg(drone.angleOffset) + 90;

      drone.timer -= k.dt();
      if (drone.timer <= 0) {
        drone.destroy();
      }
    });
  }
}

// Patlama ve alan hasarı tetikleyici yardımcı fonksiyon
function explodeProjectile(proj, directTarget) {
  // Patlama efekti
  spawnExplosion(proj.pos, proj.explosionRadius / 2, k.rgb(255, 100, 0));

  // Alan hasarı hesaplama
  const players = k.get("player");
  players.forEach(p => {
    const dist = p.pos.dist(proj.pos);
    if (dist < proj.explosionRadius) {
      // Doğrudan hedef mi yoksa alan hasarı mı?
      let damageRatio = 1 - (dist / proj.explosionRadius);
      if (p === directTarget) damageRatio = 1.0; // Doğrudan temas tam hasar alır

      const appliedDamage = Math.floor(proj.damage * damageRatio);

      if (proj.bypassArmor) {
        p.hp = Math.max(0, p.hp - appliedDamage);
        const origColor = p.color;
        p.color = k.rgb(255, 255, 255);
        k.wait(0.2, () => {
          if (p.exists()) p.color = origColor;
        });
      } else {
        inflictDamage(p, appliedDamage);
      }
    }
  });

  proj.destroy();
}

export function spawnSelectedProjectile(shooter, type) {
  const supports = ["mini_iha", "kalkan_diha"];
  if (supports.includes(type)) {
    spawnSupport(shooter, type);
  } else {
    spawnWeapon(shooter, type);
  }
}

