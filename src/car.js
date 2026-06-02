import { k } from "./kaplay.js";
import { CAR_TYPES } from "./config.js";
import { CAR_STATES } from "./states.js";
import { SKILLS } from "./skill.js";

// Araç tekerlekleri, farları ve sınıf detaylarını çizmeye yarayan yardımcı fonksiyon (menü ve oyun sahnelerinde DRY uyumluluğu için ortaktır)
export function drawCarDetails(parent, type, color) {
  const cfg = CAR_TYPES[type] || CAR_TYPES.DENGELI;
  const wHalf = cfg.width / 2;
  const hHalf = cfg.height / 2;

  // Tekerlekler
  const wOffset = wHalf - 8;
  const hOffset = hHalf - 1;
  [[-wOffset, -hOffset], [wOffset, -hOffset], [-wOffset, hOffset], [wOffset, hOffset]].forEach(([x, y]) => {
    parent.add([k.rect(12, 6), k.pos(x, y), k.color(30, 30, 32), k.anchor("center")]);
  });

  // Farlar
  [[-hHalf + 5], [hHalf - 5]].forEach(([y]) => {
    parent.add([k.rect(5, 8, { radius: 1 }), k.pos(wHalf, y), k.color(255, 255, 255), k.anchor("center")]);
  });

  // Sınıf Bazlı Süslemeler
  if (type === "HIZLI") {
    parent.add([k.rect(4, cfg.height + 2), k.pos(-wHalf + 5, 0), k.color(20, 20, 22), k.anchor("center")]);
    parent.add([k.rect(6, cfg.height + 6), k.pos(-wHalf + 2, 0), k.color(color), k.anchor("center")]);
  } else if (type === "GUCLU") {
    parent.add([k.rect(4, cfg.height + 4), k.pos(wHalf + 2, 0), k.color(20, 20, 22), k.anchor("center")]);
    parent.add([k.rect(8, 4), k.pos(wHalf, -hHalf + 4), k.color(color), k.anchor("center")]);
    parent.add([k.rect(8, 4), k.pos(wHalf, hHalf - 4), k.color(color), k.anchor("center")]);
  } else if (type === "TANK") {
    parent.add([k.rect(cfg.width - 24, cfg.height - 12, { radius: 2 }), k.pos(-4, 0), k.color(20, 20, 22), k.anchor("center")]);
    parent.add([k.rect(8, 4), k.pos(-wHalf - 3, -6), k.color(color), k.anchor("center")]);
    parent.add([k.rect(8, 4), k.pos(-wHalf - 3, 6), k.color(color), k.anchor("center")]);
  } else if (type === "DRIFT") {
    parent.add([k.rect(cfg.width, 3), k.pos(0, -6), k.color(20, 20, 22), k.anchor("center")]);
    parent.add([k.rect(cfg.width, 3), k.pos(0, 6), k.color(20, 20, 22), k.anchor("center")]);
  } else if (type === "HIPHIZLI") {
    parent.add([k.rect(cfg.width - 12, 2), k.pos(0, -hHalf + 3), k.color(color), k.anchor("center")]);
    parent.add([k.rect(cfg.width - 12, 2), k.pos(0, hHalf - 3), k.color(color), k.anchor("center")]);
  }
}

// Yetenek tetikleyici fonksiyon
export function triggerSkill(car) {
  if (car.skillActive || car.skillCooldownTimer > 0) return;
  const skill = SKILLS[car.carType];
  if (!skill) return;

  car.skillActive = true;
  car.skillDurationTimer = skill.duration;
  car.skillCooldownTimer = skill.cooldown;

  skill.activate(car);
  k.shake(1.5); // Yetenek hissi için hafif ekran sarsıntısı
}

// İki oyuncunun da arabasını aynı standartta üreten bileşen fonksiyonu.
export function addCar({ name, tag, color, startPos, startAngle, controls, type = "DENGELI" }) {
  const config = CAR_TYPES[type] || CAR_TYPES.DENGELI;
  const HEALTH_BAR_OFFSET_Y = -25;
  const HEALTH_BAR_OFFSET_X = -20;
  const car = k.add([
    k.rect(config.width, config.height, { radius: config.radius }), // Aracın ana gövde kutusu
    k.color(color),
    k.pos(startPos),
    k.rotate(startAngle),
    k.anchor("center"),
    k.area(), // Çarpışma alanı algılayıcı hitbox
    tag,      // Oyuncuyu ayırt eden benzersiz etiket (örn. 'player1')
    "player", // Genel grup etiketi
    {
      state: "DRIVING",
      controls,
      speed: 0,
      maxSpeed: config.maxSpeed,
      reverseSpeed: config.reverseSpeed,
      acceleration: config.acceleration,
      deceleration: config.deceleration,
      turnSpeed: config.turnSpeed,
      hp: config.maxHp,
      maxHp: config.maxHp,
      mass: config.mass,
      isInvulnerable: false,
      collisionCooldown: false,

      // Yetenek State Özellikleri
      carType: type,
      skillName: SKILLS[type]?.name || "YETENEK",
      skillActive: false,
      skillCooldownTimer: 0,
      skillDurationTimer: 0,
      isGhost: false,
      originalColor: color,
    },
  ]);

  // Klasik Can Barı Arka Planı (Koyu Gri)
  const healthBarBg = k.add([
    k.rect(40, 5, { radius: 1.5 }),
    k.color(30, 30, 32),
    k.pos(startPos.add(0, HEALTH_BAR_OFFSET_Y)),
    k.anchor("center"),
  ]);

  // Klasik Can Barı Dolgusu (Oyuncu Renginde)
  const healthBarFill = k.add([
    k.rect(40, 5, { radius: 1.5 }),
    k.color(color),
    k.pos(startPos.add(HEALTH_BAR_OFFSET_X, HEALTH_BAR_OFFSET_Y)),
    k.anchor("left"),
    k.scale(1),
  ]);

  // Yetenek Cooldown Barı Arka Planı (Koyu Gri)
  const skillBarBg = k.add([
    k.rect(40, 3, { radius: 1 }),
    k.color(30, 30, 32),
    k.pos(startPos.add(0, HEALTH_BAR_OFFSET_Y - 6)),
    k.anchor("center"),
  ]);

  // Yetenek Cooldown Barı Dolgusu (Açık Mavi/Gri/Yeşil dinamik geçişli)
  const skillBarFill = k.add([
    k.rect(40, 3, { radius: 1 }),
    k.color(0, 255, 100),
    k.pos(startPos.add(HEALTH_BAR_OFFSET_X, HEALTH_BAR_OFFSET_Y - 6)),
    k.anchor("left"),
    k.scale(1),
  ]);

  // Hafıza Yönetimi (Oyuncu yok edildiğinde can ve yetenek barlarını da siler)
  car.onDestroy(() => {
    healthBarBg.destroy();
    healthBarFill.destroy();
    skillBarBg.destroy();
    skillBarFill.destroy();
  });

  // Tekerlekler, farlar ve gövde detaylarını çiz
  drawCarDetails(car, type, color);

  // Araç Fizik ve Kontrol Güncelleme Döngüsü (Her Karede Çalışır)
  car.onUpdate(() => {
    if (k.isGamePaused) return;

    if (k.gameOver) {
      healthBarBg.hidden = true;
      healthBarFill.hidden = true;
      skillBarBg.hidden = true;
      skillBarFill.hidden = true;
      return; // Oyun bittiyse hareketleri dondur
    }

    healthBarBg.hidden = false;
    healthBarFill.hidden = false;
    skillBarBg.hidden = false;
    skillBarFill.hidden = false;

    // Can barını araca göre konumlandır (Dönüşlerden etkilenmemesi için bağımsız)
    healthBarBg.pos = car.pos.add(0, HEALTH_BAR_OFFSET_Y);
    healthBarFill.pos = car.pos.add(HEALTH_BAR_OFFSET_X, HEALTH_BAR_OFFSET_Y);
    healthBarFill.scale.x = Math.max(0, car.hp / car.maxHp);

    // Yetenek barını araca göre konumlandır
    skillBarBg.pos = car.pos.add(0, HEALTH_BAR_OFFSET_Y - 6);
    skillBarFill.pos = car.pos.add(HEALTH_BAR_OFFSET_X, HEALTH_BAR_OFFSET_Y - 6);

    // Yetenek zamanlayıcılarını güncelle
    if (car.skillDurationTimer > 0) {
      car.skillDurationTimer -= k.dt();
      if (car.skillDurationTimer <= 0) {
        car.skillActive = false;
        SKILLS[car.carType]?.deactivate?.(car);
      }
    }
    if (car.skillCooldownTimer > 0) {
      car.skillCooldownTimer -= k.dt();
    }

    // Yetenek bar doluluk oranı ve rengini güncelle
    if (car.skillActive) {
      const skill = SKILLS[car.carType];
      skillBarFill.scale.x = Math.max(0, car.skillDurationTimer / skill.duration);
      skillBarFill.color = k.rgb(0, 255, 255); // Aktifken açık mavi
    } else if (car.skillCooldownTimer > 0) {
      const skill = SKILLS[car.carType];
      skillBarFill.scale.x = Math.max(0, 1 - (car.skillCooldownTimer / skill.cooldown));
      skillBarFill.color = k.rgb(100, 100, 105); // Beklemedeyken gri
    } else {
      skillBarFill.scale.x = 1;
      skillBarFill.color = k.rgb(0, 255, 100); // Hazırken yeşil
    }

    // Yetenek tuş vuruşu kontrolü
    if (car.state === "DRIVING" && controls.skill && k.isKeyPressed(controls.skill)) {
      triggerSkill(car);
    }

    // Akıcı Dash Kuyruk Efekti (Hayalet İz)
    if (car.skillActive && (car.carType === "HIZLI" || car.carType === "DENGELI") && k.chance(0.45)) {
      const trail = k.add([
        k.rect(config.width, config.height, { radius: config.radius }),
        k.pos(car.pos),
        k.rotate(car.angle),
        k.color(car.color),
        k.opacity(0.35),
        k.anchor("center"),
      ]);
      trail.onUpdate(() => {
        trail.opacity -= k.dt() * 3.5;
        if (trail.opacity <= 0) trail.destroy();
      });
    }

    CAR_STATES[car.state]?.update?.(car);
  });

  return car;
}
