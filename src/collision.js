import { k } from "./kaplay.js";
import { changeState } from "./states.js";
import { spawnExplosion, inflictDamage } from "./utils.js";
import { startDuel } from "./clash.js";
import { playroomPlayers } from "./multiplayer.js";

/**
 * Setup vehicle collisions, momentum-based attacker decisions, and Clash triggers.
 */
export function setupCollisions(checkGameOver, gameMode = "NORMAL") {
  k.onCollide("player", "player", (car1, car2) => {
    // Güvenlik kontrolleri
    if (car1.id === car2.id) return;
    if (k.gameOver || car1.state === "CLASH" || car2.state === "CLASH") return;
    if (car1.isGhost || car2.isGhost) return;
    if (car1.collisionCooldown || car2.collisionCooldown) return;

    const s1 = Math.round(Math.abs(car1.speed));
    const s2 = Math.round(Math.abs(car2.speed));

    if (s1 < 15 && s2 < 15) return;

    const midPoint = k.vec2(
      (car1.pos.x + car2.pos.x) / 2,
      (car1.pos.y + car2.pos.y) / 2
    );

    const rad1 = k.deg2rad(car1.angle);
    const vel1 = k.vec2(Math.cos(rad1) * car1.speed, Math.sin(rad1) * car1.speed);

    const rad2 = k.deg2rad(car2.angle);
    const vel2 = k.vec2(Math.cos(rad2) * car2.speed, Math.sin(rad2) * car2.speed);

    const relVel = vel1.sub(vel2);
    const collisionNormal = car2.pos.sub(car1.pos).unit();

    const impactSpeed = Math.abs(relVel.x * collisionNormal.x + relVel.y * collisionNormal.y);

    if (impactSpeed < 20) return;

    const applyCooldown = (duration) => {
      car1.collisionCooldown = true;
      car2.collisionCooldown = true;
      k.wait(duration, () => {
        car1.collisionCooldown = false;
        car2.collisionCooldown = false;
      });
    };

    const dir1 = k.Vec2.fromAngle(car1.angle);
    const dir2 = k.Vec2.fromAngle(car2.angle);

    const dot1 = Math.abs(dir1.x * collisionNormal.x + dir1.y * collisionNormal.y);
    const dot2 = Math.abs(dir2.x * collisionNormal.x + dir2.y * collisionNormal.y);

    const car1HitsWithBumper = dot1 >= 0.8;
    const car2HitsWithBumper = dot2 >= 0.8;

    const damage = Math.min(45, Math.max(10, Math.floor(impactSpeed / 6)));

    let car1TookDamage = false;
    let car2TookDamage = false;

    // Takım kontrolü: Aynı takımdakiler birbirine hasar veremez ve düello başlatamaz.
    const isTeammate = car1.playerInfo && car2.playerInfo && 
                        (getPlayersIndex(car1.playerInfo) % 2 === getPlayersIndex(car2.playerInfo) % 2);

    // DURUM A: Kafa Kafaya Düello (Clash) Tetikleyici Şartları (Yalnızca KAFA_KAFAYA modunda tetiklenir)
    if (gameMode === "KAFA_KAFAYA" && !isTeammate && car1HitsWithBumper && car2HitsWithBumper && car1.speed > 50 && car2.speed > 50) {
      startDuel(car1, car2, collisionNormal, midPoint);
      return;
    }

    // DURUM B: Normal Momentum Tabanlı Çarpışma (Takım arkadaşı ise hasar almaz, sadece iter)
    applyCooldown(0.4);

    // Momentum = Hız * Kütle
    const mom1 = s1 * car1.mass;
    const mom2 = s2 * car2.mass;

    let attacker = mom1 > mom2 ? car1 : car2;
    let victim = mom1 > mom2 ? car2 : car1;

    // DEMİR yeteneği aktifse roller değişir
    if (car1.skillActive && car1.skillName === "DEMIR") {
      attacker = car1;
      victim = car2;
    } else if (car2.skillActive && car2.skillName === "DEMIR") {
      attacker = car2;
      victim = car1;
    }

    const attackerHitsWithBumper = attacker === car1 ? car1HitsWithBumper : car2HitsWithBumper;

    if (attackerHitsWithBumper && !isTeammate) {
      inflictDamage(victim, damage);
      if (victim === car1) car1TookDamage = true;
      if (victim === car2) car2TookDamage = true;
    }

    const attackerSign = attacker.speed >= 0 ? 1 : -1;
    const victimSign = victim.speed >= 0 ? 1 : -1;

    changeState(attacker, "RECOIL");
    changeState(victim, "RECOIL");

    // İtme mesafesi kütle oranlarına göre şekillenir (Aşırı fırlamayı önlemek için max 3.5 ile sınırlanmıştır)
    const massRatioAttacker = Math.min(3.5, victim.mass / attacker.mass);
    const massRatioVictim = Math.min(3.5, attacker.mass / victim.mass);

    attacker.speed = -attackerSign * Math.max(80, impactSpeed * 0.3) * massRatioAttacker;
    victim.speed = -victimSign * Math.max(160, impactSpeed * 0.7) * massRatioVictim;

    k.wait(0.4, () => {
      changeState(attacker, "DRIVING");
      changeState(victim, "DRIVING");
    });

    if (car1TookDamage || car2TookDamage) {
      k.shake(Math.max(8, damage * 0.6));
      spawnExplosion(midPoint, damage);
      checkGameOver();
    } else {
      k.shake(3);
      spawnExplosion(midPoint, 4);
    }
  });
}

// Yardımcı fonksiyon: Oyuncunun playroomPlayers içindeki indeksini döndürür
function getPlayersIndex(playerInfo) {
  return playroomPlayers.findIndex(p => p.id === playerInfo.id);
}
