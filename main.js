import { k } from "./src/kaplay.js";
import { addCar } from "./src/car.js";
import { changeState } from "./src/states.js";
import { spawnExplosion, inflictDamage } from "./src/utils.js";

// ==========================================
// 1. REFERANS IZGARA (GRID) SİSTEMİ
// ==========================================
const gridSize = 60;
for (let x = gridSize; x < k.width(); x += gridSize) {
  for (let y = gridSize; y < k.height(); y += gridSize) {
    k.add([
      k.pos(x, y),
      k.circle(1.5),
      k.color(60, 60, 65),
    ]);
  }
}

// ==========================================
// 2. OYUNCU ARAÇLARININ OLUŞTURULMASI
// ==========================================
const p1 = addCar({
  name: "Player 1",
  tag: "player1",
  color: k.rgb(0, 140, 255),
  startPos: k.vec2(180, k.height() / 2),
  startAngle: 0,
  controls: {
    forward: "w",
    backward: "s",
    left: "a",
    right: "d",
  },
  type: "BALANCED",
});

const p2 = addCar({
  name: "Player 2",
  tag: "player2",
  color: k.rgb(255, 60, 60),
  startPos: k.vec2(k.width() - 180, k.height() / 2),
  startAngle: 180,
  controls: {
    forward: "up",
    backward: "down",
    left: "left",
    right: "right",
  },
  type: "BALANCED",
});

// ==========================================
// 3. KULLANICI ARAYÜZÜ (UI / HUD) PANELI
// ==========================================
const winnerText = k.add([
  k.text("", { size: 36 }),
  k.pos(k.center()),
  k.anchor("center"),
  k.color(255, 255, 255),
]);
winnerText.hidden = true;

// ==========================================
// 4. HASAR UYGULAMA VE ÇARPIŞMA SİSTEMİ
// ==========================================
k.onCollide("player1", "player2", (car1, car2) => {
  if (k.gameOver || car1.state === "CLASH" || car2.state === "CLASH") return;

  if (car1.isInvulnerable || car2.isInvulnerable) return;

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

  const applyInvul = (duration) => {
    car1.isInvulnerable = true;
    car2.isInvulnerable = true;
    k.wait(duration, () => {
      car1.isInvulnerable = false;
      car2.isInvulnerable = false;
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

  // DURUM A: Eşit hızlarda çarpışma (Düello)
  if (s1 === s2) {
    if (car1HitsWithBumper && car2HitsWithBumper) {
      let m1 = 0, m2 = 0;
      let duelEnded = false;
      changeState(car1, "CLASH");
      changeState(car2, "CLASH");
      car1.isInvulnerable = true;
      car2.isInvulnerable = true;

      const clashLabel = k.add([
        k.text("KAFA KAFAYA!", { size: 28 }),
        k.pos(k.center().add(0, -120)),
        k.anchor("center"),
        k.color(255, 215, 0),
      ]);

      k.shake(8);

      const finishClash = () => {
        if (duelEnded) return;
        duelEnded = true;

        cancel1.cancel();
        cancel2.cancel();
        clashLabel.destroy();

        changeState(car1, "RECOIL");
        changeState(car2, "RECOIL");

        spawnExplosion(midPoint, 30);
        k.shake(15);

        const diff = Math.abs(m1 - m2);

        if (diff <= 2) {
          car1.speed = -350 * (car2.mass / car1.mass);
          car2.speed = -350 * (car1.mass / car2.mass);
        } else if (m1 > m2) {
          car2.speed = -550 * (car1.mass / car2.mass);
          car1.speed = car1.maxSpeed + 100;
        } else {
          car1.speed = -550 * (car2.mass / car1.mass);
          car2.speed = car2.maxSpeed + 100;
        }

        k.wait(0.6, () => {
          changeState(car1, "DRIVING");
          changeState(car2, "DRIVING");
          car1.isInvulnerable = false;
          car2.isInvulnerable = false;
        });
      };

      const cancel1 = k.onKeyPress("w", () => {
        if (duelEnded) return;
        m1++;
        k.shake(1.5);
        car1.pos = car1.pos.add(collisionNormal.scale(5));
        car2.pos = car2.pos.add(collisionNormal.scale(5));
        spawnExplosion(car1.pos.add(k.Vec2.fromAngle(car1.angle).scale(23)), 1);

        if (m1 - m2 >= 5) finishClash();
      });
      
      const cancel2 = k.onKeyPress("up", () => {
        if (duelEnded) return;
        m2++;
        k.shake(1.5);
        car1.pos = car1.pos.sub(collisionNormal.scale(5));
        car2.pos = car2.pos.sub(collisionNormal.scale(5));
        spawnExplosion(car2.pos.add(k.Vec2.fromAngle(car2.angle).scale(23)), 1);

        if (m2 - m1 >= 5) finishClash();
      });

      k.wait(1.8, () => {
        finishClash();
      });
      return;
    } 
    
    applyInvul(0.4);

    if (car1HitsWithBumper) {
      inflictDamage(car2, damage);
      car2TookDamage = true;
    } else if (car2HitsWithBumper) {
      inflictDamage(car1, damage);
      car1TookDamage = true;
    }

    car1.speed = -(car1.speed >= 0 ? 1 : -1) * Math.max(120, s1 * 0.5) * (car2.mass / car1.mass);
    car2.speed = -(car2.speed >= 0 ? 1 : -1) * Math.max(120, s2 * 0.5) * (car1.mass / car2.mass);
  }
  // DURUM B: Normal Çarpışma
  else {
    applyInvul(0.4);

    const attacker = s1 > s2 ? car1 : car2;
    const victim = s1 > s2 ? car2 : car1;
    const attackerHitsWithBumper = s1 > s2 ? car1HitsWithBumper : car2HitsWithBumper;

    if (attackerHitsWithBumper) {
      inflictDamage(victim, damage);
      if (victim === car1) car1TookDamage = true;
      if (victim === car2) car2TookDamage = true;
    }

    const attackerSign = attacker.speed >= 0 ? 1 : -1;
    const victimSign = victim.speed >= 0 ? 1 : -1;

    changeState(attacker, "RECOIL");
    changeState(victim, "RECOIL");

    attacker.speed = -attackerSign * Math.max(80, Math.abs(attacker.speed) * 0.3) * (victim.mass / attacker.mass);
    victim.speed = -victimSign * Math.max(160, Math.abs(attacker.speed) * 0.7) * (attacker.mass / victim.mass);

    k.wait(0.4, () => {
      changeState(attacker, "DRIVING");
      changeState(victim, "DRIVING");
    });
  }

  if (car1TookDamage || car2TookDamage) {
    k.shake(Math.max(8, damage * 0.6));
    spawnExplosion(midPoint, damage);
    checkGameOver();
  } else {
    k.shake(3);
    spawnExplosion(midPoint, 4);
  }
});

// ==========================================
// 5. OYUN DÖNGÜSÜ VE YENİDEN BAŞLATMA
// ==========================================
function checkGameOver() {
  if (p1.hp <= 0 || p2.hp <= 0) {
    k.gameOver = true;
    p1.speed = 0;
    p2.speed = 0;

    const msg = p1.hp <= 0 && p2.hp <= 0 ? "BERABERE!" 
              : p1.hp <= 0 ? "OYUNCU 2 (KIRMIZI) KAZANDI!" 
              : "OYUNCU 1 (MAVİ) KAZANDI!";

    winnerText.text = msg;
    winnerText.hidden = false;
    k.shake(25);

    k.wait(3.5, () => {
      resetGame();
    });
  }
}

function resetGame() {
  p1.pos = k.vec2(180, k.height() / 2);
  p1.angle = 0;
  p1.speed = 0;
  p1.hp = p1.maxHp;
  p1.isInvulnerable = false;
  changeState(p1, "DRIVING");

  p2.pos = k.vec2(k.width() - 180, k.height() / 2);
  p2.angle = 180;
  p2.speed = 0;
  p2.hp = p2.maxHp;
  p2.isInvulnerable = false;
  changeState(p2, "DRIVING");

  winnerText.hidden = true;
  k.gameOver = false;
}
