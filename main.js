import { k } from "./src/kaplay.js";
import { addCar } from "./src/car.js";
import { changeState } from "./src/states.js";
import { spawnExplosion, inflictDamage } from "./src/utils.js";

// ==========================================
// 1. ARAÇ SEÇİM MENÜSÜ SAHNESİ (MENU SCENE)
// ==========================================
k.scene("menu", () => {
  const options = ["BALANCED", "FAST", "HEAVY"];
  let p1Idx = 0;
  let p2Idx = 0;
  let p1Ready = false;
  let p2Ready = false;

  // Başlıklar
  k.add([
    k.text("KAFA KAFAYA", { size: 64 }),
    k.pos(k.width() / 2, 140),
    k.anchor("center"),
    k.color(255, 215, 0),
  ]);

  k.add([
    k.text("Araç Sınıfını Seç ve Düelloyu Başlat!", { size: 24 }),
    k.pos(k.width() / 2, 210),
    k.anchor("center"),
    k.color(180, 180, 185),
  ]);

  // Oyuncu 1 Seçim Paneli (Sol)
  const p1Panel = k.add([
    k.rect(420, 500, { radius: 8 }),
    k.pos(k.width() / 2 - 320, k.height() / 2 + 50),
    k.anchor("center"),
    k.color(30, 35, 45),
    k.outline(4, k.rgb(0, 140, 255)),
  ]);

  p1Panel.add([
    k.text("OYUNCU 1 (MAVİ)", { size: 28 }),
    k.pos(0, -180),
    k.anchor("center"),
    k.color(0, 140, 255),
  ]);

  const p1Labels = options.map((opt, i) => {
    return p1Panel.add([
      k.text(opt, { size: 24 }),
      k.pos(0, -60 + i * 65),
      k.anchor("center"),
      k.color(255, 255, 255),
    ]);
  });

  const p1Status = p1Panel.add([
    k.text("SEC: W / S - ONAY: SPACE", { size: 16 }),
    k.pos(0, 190),
    k.anchor("center"),
    k.color(150, 150, 155),
  ]);

  // Oyuncu 2 Seçim Paneli (Sağ)
  const p2Panel = k.add([
    k.rect(420, 500, { radius: 8 }),
    k.pos(k.width() / 2 + 320, k.height() / 2 + 50),
    k.anchor("center"),
    k.color(45, 30, 30),
    k.outline(4, k.rgb(255, 60, 60)),
  ]);

  p2Panel.add([
    k.text("OYUNCU 2 (KIRMIZI)", { size: 28 }),
    k.pos(0, -180),
    k.anchor("center"),
    k.color(255, 60, 60),
  ]);

  const p2Labels = options.map((opt, i) => {
    return p2Panel.add([
      k.text(opt, { size: 24 }),
      k.pos(0, -60 + i * 65),
      k.anchor("center"),
      k.color(255, 255, 255),
    ]);
  });

  const p2Status = p2Panel.add([
    k.text("SEC: YÖN TUŞLARI - ONAY: ENTER", { size: 16 }),
    k.pos(0, 190),
    k.anchor("center"),
    k.color(150, 150, 155),
  ]);

  // Seçim Görsel Arayüzünü Güncelleyen Fonksiyon
  function updateMenuUI() {
    p1Labels.forEach((label, i) => {
      if (p1Ready) {
        label.color = i === p1Idx ? k.rgb(0, 255, 100) : k.rgb(60, 60, 65);
      } else {
        label.color = i === p1Idx ? k.rgb(0, 140, 255) : k.rgb(255, 255, 255);
        label.scale = i === p1Idx ? k.vec2(1.15) : k.vec2(1);
      }
    });

    p1Status.text = p1Ready ? "HAZIR!" : "SEC: W / S - ONAY: SPACE";
    p1Status.color = p1Ready ? k.rgb(0, 255, 100) : k.rgb(150, 150, 155);

    p2Labels.forEach((label, i) => {
      if (p2Ready) {
        label.color = i === p2Idx ? k.rgb(0, 255, 100) : k.rgb(60, 60, 65);
      } else {
        label.color = i === p2Idx ? k.rgb(255, 60, 60) : k.rgb(255, 255, 255);
        label.scale = i === p2Idx ? k.vec2(1.15) : k.vec2(1);
      }
    });

    p2Status.text = p2Ready ? "HAZIR!" : "SEC: YÖN TUŞLARI - ONAY: ENTER";
    p2Status.color = p2Ready ? k.rgb(0, 255, 100) : k.rgb(150, 150, 155);
  }

  updateMenuUI();

  // Klavye Dinleyicileri (Geçici)
  const handleP1 = k.onKeyPress((key) => {
    if (p1Ready) return;
    if (key === "w") {
      p1Idx = (p1Idx - 1 + options.length) % options.length;
      updateMenuUI();
    } else if (key === "s") {
      p1Idx = (p1Idx + 1) % options.length;
      updateMenuUI();
    } else if (key === "space") {
      p1Ready = true;
      updateMenuUI();
      checkStart();
    }
  });

  const handleP2 = k.onKeyPress((key) => {
    if (p2Ready) return;
    if (key === "up") {
      p2Idx = (p2Idx - 1 + options.length) % options.length;
      updateMenuUI();
    } else if (key === "down") {
      p2Idx = (p2Idx + 1) % options.length;
      updateMenuUI();
    } else if (key === "enter") {
      p2Ready = true;
      updateMenuUI();
      checkStart();
    }
  });

  function checkStart() {
    if (p1Ready && p2Ready) {
      k.wait(0.6, () => {
        handleP1.cancel();
        handleP2.cancel();
        k.go("game", {
          p1Type: options[p1Idx],
          p2Type: options[p2Idx],
        });
      });
    }
  }
});

// ==========================================
// 2. ANA OYUN SAHNESİ (GAME SCENE)
// ==========================================
k.scene("game", ({ p1Type, p2Type }) => {
  k.gameOver = false;

  // Referans Izgara Çizimi
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

  // Oyuncu 1
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
    type: p1Type,
  });

  // Oyuncu 2
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
    type: p2Type,
  });

  // Kazanan Yazısı
  const winnerText = k.add([
    k.text("", { size: 36 }),
    k.pos(k.center()),
    k.anchor("center"),
    k.color(255, 255, 255),
  ]);
  winnerText.hidden = true;

  // Çarpışma Mekaniği
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

    // DURUM A: Eşit Hızlarda Kafa Kafaya Çarpışma
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
        k.go("menu"); // Oyun bittiğinde menüye geri dön
      });
    }
  }
});

// Oyunu Başlat
k.go("menu");
