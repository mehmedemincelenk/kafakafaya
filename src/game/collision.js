import { k } from "../kaplay.js";
import { changeState } from "../states.js";
import { spawnExplosion, inflictDamage } from "../utils.js";
import { startDuel } from "./clash.js";
import { playroomPlayers } from "../multiplayer.js";

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

    let damage = Math.min(45, Math.max(10, Math.floor(impactSpeed / 6)));
    let attacker = null;
    let victim = null;
    let isClash = false;

    // Takım kontrolü: Aynı takımdakiler birbirine hasar veremez ve düello başlatamaz.
    const isTeammate = car1.playerInfo && car2.playerInfo && 
                        (getPlayersIndex(car1.playerInfo) % 2 === getPlayersIndex(car2.playerInfo) % 2);

    if (car1.type === car2.type && !isTeammate) {
      // AYNI ARAÇLAR: Hız karşılaştırması
      const speedDiff = Math.abs(s1 - s2);
      
      if (speedDiff <= 40 && car1HitsWithBumper && car2HitsWithBumper && s1 > 50 && s2 > 50) {
        // Aynı hızdalar ise -> KAFA KAFAYA (Clash)
        isClash = true;
      } else {
        // Hızlı olan hasar atar
        attacker = s1 > s2 ? car1 : car2;
        victim = s1 > s2 ? car2 : car1;
        // Hasar miktarı: Hızı kadar büyüklükte
        const attackerSpeed = Math.max(s1, s2);
        damage = Math.min(50, Math.max(10, Math.floor(attackerSpeed / 8)));
      }
    } else {
      // FARKLI ARAÇLAR: Kafa kafaya olamazlar. Momentum karşılaştırması (Hız * Kütle)
      const mom1 = s1 * car1.mass;
      const mom2 = s2 * car2.mass;

      attacker = mom1 > mom2 ? car1 : car2;
      victim = mom1 > mom2 ? car2 : car1;
    }

    // DEMİR ve AKTİF SÜSPANSİYON yeteneği aktifse roller değişir (demir/süspansiyon olan saldırgan olur ve clash iptal edilir)
    let isParry = false;
    if (car1.skillActive && (car1.skillName === "DEMIR" || car1.skillId === "active_suspension" || car1.skillName === "AKTİF SÜSPANSİYON")) {
      attacker = car1;
      victim = car2;
      isClash = false;
      isParry = true;
    } else if (car2.skillActive && (car2.skillName === "DEMIR" || car2.skillId === "active_suspension" || car2.skillName === "AKTİF SÜSPANSİYON")) {
      attacker = car2;
      victim = car1;
      isClash = false;
      isParry = true;
    }

    if (isClash) {
      startDuel(car1, car2, collisionNormal, midPoint, checkGameOver);
      return;
    }

    // DURUM B: Normal Çarpışma
    applyCooldown(0.4);

    let car1TookDamage = false;
    let car2TookDamage = false;

    const attackerHitsWithBumper = attacker === car1 ? car1HitsWithBumper : car2HitsWithBumper;

    if (isParry) {
      // Parry visual feedback: ekran sarsıntısı, genişleyen turuncu halka, altın kıvılcımlar!
      k.shake(10);
      const ring = k.add([
        k.circle(10),
        k.pos(midPoint),
        k.color(255, 140, 0),
        k.opacity(0.8),
        k.anchor("center"),
        k.z(10),
      ]);
      ring.onUpdate(() => {
        ring.radius += 200 * k.dt();
        ring.opacity -= 2.5 * k.dt();
        if (ring.opacity <= 0) {
          ring.destroy();
        }
      });

      for (let i = 0; i < 12; i++) {
        const angle = k.rand(0, 360);
        const speed = k.rand(150, 300);
        const spark = k.add([
          k.pos(midPoint),
          k.color(255, 215, 0),
          k.rect(4, 4),
          k.anchor("center"),
          k.opacity(1),
          k.z(10),
          k.lifespan(0.4),
        ]);
        spark.onUpdate(() => {
          spark.move(Math.cos(k.deg2rad(angle)) * speed, Math.sin(k.deg2rad(angle)) * speed);
        });
      }

      inflictDamage(victim, 15);
      damage = 15;
      if (victim === car1) car1TookDamage = true;
      if (victim === car2) car2TookDamage = true;
    } else if (attackerHitsWithBumper && !isTeammate) {
      let hitDamage = damage;

      // BARKAN 2 Sürü Saldırısı (Zırh Kırıcı) yeteneği aktifse hasarı %30 artır
      if (attacker.skillActive && attacker.skillId === "swarm_mark") {
        hitDamage = Math.floor(hitDamage * 1.30);
      }

      // Hayalet modundan çıktıktan sonraki ilk 1.5 saniyede hasar artışı
      if (attacker.ghostDamageBoostTimer && attacker.ghostDamageBoostTimer > 0) {
        hitDamage = Math.floor(hitDamage * 1.35);
        attacker.ghostDamageBoostTimer = 0; // Bonusu tüket
      }

      // KİNETİK TAMPON (leader_trail) - Saldırgandaysa hasarı artır
      if (attacker.skillActive && attacker.skillId === "leader_trail") {
        hitDamage = Math.floor(hitDamage * 1.50);
      }

      // KİNETİK TAMPON (leader_trail) - Kurbandaysa alınan hasarı yarıya indir
      if (victim.skillActive && victim.skillId === "leader_trail") {
        hitDamage = Math.floor(hitDamage * 0.50);
      }

      // ELEKTRO-MANYETİK ŞOK (gnss_jammer) - Çarpışmada rakibi sersemlet/kontrollerini kilitle
      if (attacker.skillActive && attacker.skillId === "gnss_jammer") {
        victim.controlsLocked = true;
        const warningText = k.add([
          k.text("SİNYAL BOZULDU!", { size: 10 }),
          k.pos(victim.pos.add(0, -45)),
          k.color(255, 50, 50),
          k.anchor("center"),
          k.lifespan(1.0),
        ]);
        warningText.onUpdate(() => {
          if (victim.exists()) {
            warningText.pos = victim.pos.add(0, -45);
          }
        });
        k.wait(1.0, () => {
          if (victim.exists()) victim.controlsLocked = false;
        });
      }

      // REAKTİF ZIRH (tactical_repair) - Çarpışmada hasarı yok say, limitli 20 HP can yenileme
      if (victim.skillActive && victim.skillId === "tactical_repair") {
        if (victim.reactiveHealsLeft > 0) {
          victim.reactiveHealsLeft--;
          victim.hp = Math.min(victim.maxHp, victim.hp + 20);
          const orig = victim.color;
          victim.color = k.rgb(100, 255, 100);
          k.wait(0.25, () => {
            if (victim.exists()) victim.color = orig;
          });
          const healText = k.add([
            k.text("+20 HP", { size: 10 }),
            k.pos(victim.pos.add(0, -50)),
            k.color(100, 255, 100),
            k.anchor("center"),
            k.lifespan(0.8),
          ]);
          healText.onUpdate(() => {
            if (victim.exists()) healText.pos = victim.pos.add(0, -50);
          });
        }
        hitDamage = 0;
      }

      if (hitDamage > 0) {
        inflictDamage(victim, hitDamage);
      }
      
      // Efektler için hasar değerini güncelle
      damage = hitDamage;

      if (victim === car1) car1TookDamage = hitDamage > 0;
      if (victim === car2) car2TookDamage = hitDamage > 0;
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

  // Araçların yavaşken veya temas halindeyken iç içe geçmesini engelleyen ayrıştırma (collision resolution)
  k.onCollideUpdate("player", "player", (car1, car2) => {
    if (car1.id === car2.id) return;
    if (car1.isGhost || car2.isGhost) return;
    if (car1.state === "CLASH" || car2.state === "CLASH") return; // Düello sırasında ayrıştırma yapmıyoruz

    const diff = car2.pos.sub(car1.pos);
    const dist = diff.len();

    // Dinamik olarak araç ebatlarına göre minimum güvenli mesafe hesaplıyoruz
    const r1 = Math.max(car1.width || 40, car1.height || 24) * 0.45;
    const r2 = Math.max(car2.width || 40, car2.height || 24) * 0.45;
    const minDistance = r1 + r2;

    if (dist < minDistance) {
      const overlap = minDistance - dist;
      const normal = dist > 0 ? diff.unit() : k.vec2(1, 0);
      const push = normal.scale(overlap * 0.5);
      
      // Her iki aracı zıt yönlere iterek iç içe geçmelerini önlüyoruz
      car1.pos = car1.pos.sub(push);
      car2.pos = car2.pos.add(push);
    }
  });
}

// Yardımcı fonksiyon: Oyuncunun playroomPlayers içindeki indeksini döndürür
function getPlayersIndex(playerInfo) {
  return playroomPlayers.findIndex(p => p.id === playerInfo.id);
}
