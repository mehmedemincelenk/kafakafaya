import { k } from "../kaplay.js";
import { CAR_TYPES } from "../config.js";
import { CAR_STATES } from "../states.js";
import { SKILLS } from "../skill.js";
import { isHost, myPlayer } from "playroomkit";
import { getCarInputs } from "./input.js";

// Araç tekerlekleri, farları ve sınıf detaylarını çizmeye yarayan yardımcı fonksiyon (menü ve oyun sahnelerinde DRY uyumluluğu için ortaktır)
export function drawCarDetails(parent, type, color, skinId) {
  const cfg = CAR_TYPES[type] || CAR_TYPES.BARKAN;
  const carClass = cfg.class || "DENGELI";
  const wHalf = cfg.width / 2;
  const hHalf = cfg.height / 2;

  // 1. Sleek Cybernetic & Military Matte Color Palette
  let bodyColor = k.rgb(cfg.color[0], cfg.color[1], cfg.color[2]);
  
  if (skinId === "gold") {
    bodyColor = k.rgb(110, 100, 80); // Dark Bronze Champagne Grey
  } else if (skinId === "military" || skinId === "camo") {
    bodyColor = k.rgb(52, 58, 50); // Dark Tactical Slate Green
  } else if (skinId === "tokyo") {
    bodyColor = k.rgb(28, 28, 30); // Ultra Dark Charcoal
  } else if (skinId === "neon") {
    bodyColor = k.rgb(20, 22, 25); // Deep Slate Obsidian
  } else if (skinId === "cyber") {
    bodyColor = k.rgb(28, 25, 32); // Dark Carbon Indigo Grey
  } else if (skinId === "carbon") {
    bodyColor = k.rgb(24, 25, 28); // Pure Carbon Fiber Grey
  } else if (skinId === "beast") {
    bodyColor = k.rgb(65, 30, 32); // Deep Crimson Oxide Grey
  } else if (skinId === "hazard") {
    bodyColor = k.rgb(80, 75, 60); // Dark Industrial Oxide
  } else if (skinId === "retro") {
    bodyColor = k.rgb(90, 60, 48); // Dark Copper Oxide
  }

  if (parent) {
    parent.color = bodyColor;
  }

  // 0. Smooth Drop Shadow
  parent.add([
    k.rect(cfg.width, cfg.height, { radius: cfg.radius }),
    k.pos(3, 4),
    k.color(0, 0, 0),
    k.opacity(0.35),
    k.anchor("center"),
    k.z(-9.5)
  ]);

  // 2. Wheels / Treads (Tekerlekler ve Paletler)
  const wOffset = wHalf - 8;
  const hOffset = hHalf - 1;

  if (carClass === "TANK") {
    // Tanklar için devasa palet tasarımı
    // Sol Palet
    parent.add([k.rect(cfg.width - 4, 9, { radius: 3 }), k.pos(0, -hHalf - 1.5), k.color(24, 25, 28), k.anchor("center")]);
    // Sağ Palet
    parent.add([k.rect(cfg.width - 4, 9, { radius: 3 }), k.pos(0, hHalf + 1.5), k.color(24, 25, 28), k.anchor("center")]);
    
    // Palet içi dişli çarklar (3 adet sol, 3 adet sağ)
    [-wOffset, 0, wOffset].forEach(x => {
      parent.add([k.circle(3), k.pos(x, -hHalf - 1.5), k.color(60, 64, 70), k.anchor("center")]);
      parent.add([k.circle(3), k.pos(x, hHalf + 1.5), k.color(60, 64, 70), k.anchor("center")]);
    });
  } else {
    // Hızlı ve Güçlü sınıflar için tekerlekler ve jantlar
    [[-wOffset, -hOffset], [wOffset, -hOffset], [-wOffset, hOffset], [wOffset, hOffset]].forEach(([x, y]) => {
      // Tekerlek lastiği
      parent.add([k.rect(14, 7, { radius: 3 }), k.pos(x, y), k.color(24, 25, 28), k.anchor("center")]);
      // Jant detayı (Takım rengiyle uyumlu şerit)
      parent.add([k.circle(2.5), k.pos(x, y), k.color(color.r * 0.8, color.g * 0.8, color.b * 0.8), k.anchor("center")]);
    });
  }

  // 3. Cyber Cockpit Glass & Reflection (Stealth Kapgan haricindekilere çizer)
  if (type !== "KAPGAN") {
    const cabinWidth = cfg.width * 0.45;
    const cabinHeight = cfg.height * 0.45;
    parent.add([
      k.rect(cabinWidth, cabinHeight, { radius: cabinHeight / 2 }),
      k.pos(-cfg.width * 0.05, 0),
      k.color(18, 20, 24),
      k.anchor("center")
    ]);
    // Kokpit içi cam yansıması (Parlak neon çizgi)
    parent.add([
      k.rect(cabinWidth * 0.5, 2, { radius: 1 }),
      k.pos(-cfg.width * 0.05, -cabinHeight * 0.15),
      k.color(0, 240, 255),
      k.rotate(-10),
      k.anchor("center")
    ]);
  }

  // 4. LED Headlights & Brake Lights (Farlar ve Stop Lambaları)
  // Ön Farlar (Beyaz/Cyan fütüristik LED)
  parent.add([k.circle(2.5), k.pos(wHalf - 2, -hHalf + 5), k.color(200, 250, 255), k.anchor("center")]);
  parent.add([k.circle(2.5), k.pos(wHalf - 2, hHalf - 5), k.color(200, 250, 255), k.anchor("center")]);
  
  // Ön Farlar Vektörel Işık Huzmeleri (Light Cones)
  parent.add([
    k.polygon([k.vec2(0, 0), k.vec2(140, -35), k.vec2(140, 35)]),
    k.pos(wHalf - 2, -hHalf + 5),
    k.color(255, 255, 220),
    k.opacity(0.045),
    k.z(-9),
  ]);
  parent.add([
    k.polygon([k.vec2(0, 0), k.vec2(140, -35), k.vec2(140, 35)]),
    k.pos(wHalf - 2, hHalf - 5),
    k.color(255, 255, 220),
    k.opacity(0.045),
    k.z(-9),
  ]);

  // Arka Stoplar (Kırmızı neon LED)
  parent.add([k.rect(2, 5, { radius: 1 }), k.pos(-wHalf + 1, -hHalf + 6), k.color(255, 60, 60), k.anchor("center")]);
  parent.add([k.rect(2, 5, { radius: 1 }), k.pos(-wHalf + 1, hHalf - 6), k.color(255, 60, 60), k.anchor("center")]);

  // 5. Unique Vehicle Details based on exact identity / ability
  if (type === "BARKAN") {
    // BARKAN: Kinetik Tampon / Swift Attacker
    // Front kinetics buffers (sleek angled sweeps)
    parent.add([k.polygon([k.vec2(0, -3), k.vec2(6, 0), k.vec2(0, 3)]), k.pos(wHalf + 1, -hHalf + 7), k.color(color), k.anchor("center")]);
    parent.add([k.polygon([k.vec2(0, -3), k.vec2(6, 0), k.vec2(0, 3)]), k.pos(wHalf + 1, hHalf - 7), k.color(color), k.anchor("center")]);
    // Lightning neon stripes on sides
    parent.add([k.rect(cfg.width * 0.45, 2, { radius: 1 }), k.pos(-2, -hHalf + 4), k.color(color), k.anchor("center")]);
    parent.add([k.rect(cfg.width * 0.45, 2, { radius: 1 }), k.pos(-2, hHalf - 4), k.color(color), k.anchor("center")]);
    // Small rear fins
    parent.add([k.rect(3, 8, { radius: 1.5 }), k.pos(-wHalf + 4, 0), k.color(18, 20, 24), k.anchor("center")]);
  } 
  else if (type === "ASLAN") {
    // ASLAN: GNSS Jammer / Electronic Warfare Antenna
    // Center Radar Dish
    parent.add([k.circle(7), k.pos(-wHalf * 0.2, 0), k.color(24, 28, 36), k.anchor("center")]);
    parent.add([k.circle(4), k.pos(-wHalf * 0.2, 0), k.color(color), k.opacity(0.3), k.anchor("center")]);
    // Radar grid line
    parent.add([k.rect(14, 1.5), k.pos(-wHalf * 0.2, 0), k.color(color), k.rotate(45), k.anchor("center")]);
    // Side emission pods
    parent.add([k.rect(5, 4, { radius: 1 }), k.pos(-wHalf * 0.5, -hHalf + 4), k.color(color), k.anchor("center")]);
    parent.add([k.rect(5, 4, { radius: 1 }), k.pos(-wHalf * 0.5, hHalf - 4), k.color(color), k.anchor("center")]);
  } 
  else if (type === "KAPGAN") {
    // KAPGAN: Hayalet Taarruz / Stealth Interceptor
    // Triangle cockpit visor (stealth cabin)
    parent.add([k.polygon([k.vec2(-10, -6), k.vec2(10, 0), k.vec2(-10, 6)]), k.pos(0, 0), k.color(12, 12, 16), k.anchor("center")]);
    // Swept-back stealth fins
    parent.add([k.rect(4, 12, { radius: 1.5 }), k.pos(-wHalf + 6, -hHalf + 5), k.color(12, 12, 16), k.rotate(-35), k.anchor("center")]);
    parent.add([k.rect(4, 12, { radius: 1.5 }), k.pos(-wHalf + 6, hHalf - 5), k.color(12, 12, 16), k.rotate(35), k.anchor("center")]);
    // Dark violet neon highlights
    const glowColor = k.rgb(180, 50, 255); // Violet neon
    parent.add([k.rect(12, 2, { radius: 1 }), k.pos(wHalf - 12, -hHalf + 6), k.color(glowColor), k.anchor("center")]);
    parent.add([k.rect(12, 2, { radius: 1 }), k.pos(wHalf - 12, hHalf - 6), k.color(glowColor), k.anchor("center")]);
  } 
  else if (type === "BARKAN_2") {
    // BARKAN_2: Swarm Mark / Advanced Strike Platform
    // Laser targeting scope on top (Red dot optics)
    parent.add([k.rect(12, 6, { radius: 2 }), k.pos(-wHalf * 0.3, -4), k.color(24, 24, 28), k.anchor("center")]);
    parent.add([k.circle(2), k.pos(-wHalf * 0.3 + 4, -4), k.color(255, 50, 50), k.anchor("center")]); // Red laser lens
    // Double booster nozzles on back
    parent.add([k.rect(5, 6, { radius: 1 }), k.pos(-wHalf - 2, -6), k.color(20, 20, 24), k.anchor("center")]);
    parent.add([k.rect(5, 6, { radius: 1 }), k.pos(-wHalf - 2, 6), k.color(20, 20, 24), k.anchor("center")]);
    parent.add([k.circle(1.8), k.pos(-wHalf - 4, -6), k.color(255, 140, 0), k.anchor("center")]);
    parent.add([k.circle(1.8), k.pos(-wHalf - 4, 6), k.color(255, 140, 0), k.anchor("center")]);
  } 
  else if (type === "TUNGA") {
    // TUNGA: Sarp Dual Ram / Heavy Impact Rammer
    // Heavy ramming horns (pointed teeth)
    parent.add([k.polygon([k.vec2(0, -5), k.vec2(12, 0), k.vec2(0, 5)]), k.pos(wHalf, -8), k.color(60, 64, 72), k.anchor("center")]);
    parent.add([k.polygon([k.vec2(0, -5), k.vec2(12, 0), k.vec2(0, 5)]), k.pos(wHalf, 8), k.color(60, 64, 72), k.anchor("center")]);
    // Reinforced steel nose bar
    parent.add([k.rect(5, cfg.height - 8, { radius: 2.5 }), k.pos(wHalf - 2, 0), k.color(24, 24, 28), k.anchor("center")]);
    // Heavy mudguards
    parent.add([k.rect(16, 4, { radius: 1 }), k.pos(-wOffset, -hHalf - 1.5), k.color(60, 64, 72), k.anchor("center")]);
    parent.add([k.rect(16, 4, { radius: 1 }), k.pos(-wOffset, hHalf + 1.5), k.color(60, 64, 72), k.anchor("center")]);
  } 
  else if (type === "GOLGE_SUVARI") {
    // GOLGE_SUVARI: Active Suspension / Advanced Siege Tank
    // Large heavy turret dome
    parent.add([k.circle(10.5), k.pos(-wHalf * 0.2, 0), k.color(24, 26, 30), k.anchor("center")]);
    // Turret hatch/control point
    parent.add([k.circle(6), k.pos(-wHalf * 0.2, 0), k.color(color), k.anchor("center")]);
    // Long front-mounted projectile launcher barrel (Namlu)
    parent.add([k.rect(16, 5, { radius: 1 }), k.pos(-wHalf * 0.2 + 12, 0), k.color(24, 26, 30), k.anchor("center")]);
    // Front mine sweeper shield
    parent.add([k.rect(5, cfg.height - 10, { radius: 2.5 }), k.pos(wHalf + 2, 0), k.color(40, 40, 45), k.anchor("center")]);
  } 
  else if (type === "ALPAR") {
    // ALPAR: Tactical Repair / Reactive Armor Fortress
    // Reactive armor plates (grid layout)
    for (let x = -wHalf + 14; x < wHalf - 10; x += 14) {
      parent.add([k.rect(11, 4, { radius: 1.5 }), k.pos(x, -hHalf + 5), k.color(bodyColor.r * 0.85, bodyColor.g * 0.85, bodyColor.b * 0.85), k.anchor("center")]);
      parent.add([k.rect(11, 4, { radius: 1.5 }), k.pos(x, hHalf - 5), k.color(bodyColor.r * 0.85, bodyColor.g * 0.85, bodyColor.b * 0.85), k.anchor("center")]);
    }
    // Green emergency/repair flashing LED beacons
    parent.add([k.circle(2.5), k.pos(-wHalf * 0.4, -5), k.color(50, 255, 50), k.anchor("center")]);
  } 
  else if (type === "HIFZATULLAH") {
    // HIFZATULLAH: Shield emitter dome
    parent.add([k.circle(8), k.pos(0, 0), k.color(24, 28, 36), k.anchor("center")]);
    parent.add([k.circle(4), k.pos(0, 0), k.color(0, 240, 255), k.anchor("center")]);
    // Outer emission ring
    parent.add([k.rect(14, 14, { radius: 7, fill: false }), k.pos(0, 0), k.outline(2, k.rgb(0, 240, 255)), k.anchor("center")]);
  }
  else if (type === "DENGO") {
    // DENGO: Heavy thruster engine at the back & wedge bumper
    parent.add([k.rect(6, 12, { radius: 1 }), k.pos(-wHalf - 2, 0), k.color(30, 30, 35), k.anchor("center")]);
    parent.add([k.polygon([k.vec2(0, -6), k.vec2(7, 0), k.vec2(0, 6)]), k.pos(wHalf, 0), k.color(255, 60, 60), k.anchor("center")]);
  }
}

// Dash tetikleyici fonksiyon
export function triggerDash(car) {
  if (car.dashActive || car.dashCooldownTimer > 0 || car.controlsLocked) return;
  car.dashActive = true;
  car.dashDurationTimer = car.dashDuration || 0.25;
  car.dashCooldownTimer = car.dashCooldown || 3.5;

  car.speed = car.maxSpeed * 3.0; // Universal dash speed boost
  k.shake(1.0); // Dash hissi için hafif ekran sarsıntısı
}

// Yetenek tetikleyici fonksiyon
export function triggerSkill(car) {
  if (car.skillActive || car.skillCooldownTimer > 0) return;
  const skillGroup = SKILLS[car.carClass || car.carType];
  const skill = (skillGroup && skillGroup[car.skillId]) || (skillGroup && skillGroup.default);
  if (!skill) return;

  car.skillActive = true;
  car.skillDurationTimer = skill.duration;
  car.skillCooldownTimer = skill.cooldown;

  skill.activate(car);
  k.shake(1.5); // Yetenek hissi için hafif ekran sarsıntısı
}

// İki oyuncunun da arabasını aynı standartta üreten bileşen fonksiyonu.
export function addCar({ name, tag, color, startPos, startAngle, controls, type = "BARKAN", playerInfo, skinId, skillId, selectedWeapon, selectedSupport }) {
  const config = CAR_TYPES[type] || CAR_TYPES.BARKAN;
  const HEALTH_BAR_OFFSET_Y = -28;
  const HEALTH_BAR_OFFSET_X = -20;
  
  const resolvedClass = config.class || "DENGELI";
  const resolvedSkillId = (!skillId || skillId === "default") ? (config.skillId || "default") : skillId;
  
  const skillGroup = SKILLS[resolvedClass];
  const skillInfo = (skillGroup && skillGroup[resolvedSkillId]) || (skillGroup && skillGroup.default);
  const skillName = skillInfo ? skillInfo.name : "YETENEK";

  const car = k.add([
    k.rect(config.width, config.height, { radius: config.radius }), // Aracın ana gövde kutusu
    k.color(color),
    k.pos(startPos),
    k.rotate(startAngle),
    k.anchor("center"),
    k.area({ shape: new k.Rect(k.vec2(-config.width / 2, -config.height / 2), config.width, config.height) }), // Çarpışma alanı algılayıcı hitbox
    tag,      // Oyuncuyu ayırt eden benzersiz etiket (örn. 'player1')
    "player", // Genel grup etiketi
    {
      carTag: tag,
      playerInfo,
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

      carType: type,
      carClass: resolvedClass,
      skinId: skinId || "default",
      skillId: resolvedSkillId,
      skillName: skillName,
      skillActive: false,
      skillCooldownTimer: 0,
      skillDurationTimer: 0,
      isGhost: false,
      originalColor: color,

      // Seçilen Fırlatılabilirler
      selectedWeapon: selectedWeapon || "mizrak",
      selectedSupport: selectedSupport || "mini_iha",

      // Dash State Özellikleri
      isBlue: tag === "teamBlue" || tag === "player1",
      dashActive: false,
      dashCooldownTimer: 0,
      dashDurationTimer: 0,
      dashCooldown: 3.5,
      dashDuration: 0.25,
    },
  ]);

  // Klasik Can Barı Arka Planı (Koyu Gri)
  const healthBarBg = k.add([
    k.rect(40, 5, { radius: 1.5 }),
    k.color(30, 30, 32),
    k.pos(startPos.add(0, HEALTH_BAR_OFFSET_Y)),
    k.anchor("center"),
  ]);

  // Can Barı Dolgusu (Mavi oyuncu için mavi, kırmızı için kırmızı)
  const isBlueCar = tag === "teamBlue" || tag === "player1";
  const healthBarFill = k.add([
    k.rect(40, 5, { radius: 1.5 }),
    k.color(isBlueCar ? k.rgb(0, 140, 255) : k.rgb(255, 60, 60)),
    k.pos(startPos.add(HEALTH_BAR_OFFSET_X, HEALTH_BAR_OFFSET_Y)),
    k.anchor("left"),
    k.scale(1),
  ]);

  // Hafıza Yönetimi (Oyuncu yok edildiğinde can barlarını da siler)
  car.onDestroy(() => {
    try { healthBarBg.destroy(); } catch (e) {}
    try { healthBarFill.destroy(); } catch (e) {}
  });

  // Tekerlekler, farlar ve gövde detaylarını çiz
  drawCarDetails(car, type, color, skinId);
  car.originalColor = car.color;

  // Araç Fizik ve Kontrol Güncelleme Döngüsü (Her Karede Çalışır)
  car.onUpdate(() => {
    if (k.isGamePaused) return;

    if (k.gameOver) {
      healthBarBg.hidden = true;
      healthBarFill.hidden = true;
      return; // Oyun bittiyse hareketleri dondur
    }

    healthBarBg.hidden = false;
    healthBarFill.hidden = false;

    // --- PLAYROOM CLIENT SYNCHRONIZATION ---
    // Host fizik simülasyonunu yapar. Client ise sadece Host'un gönderdiği verileri ekrana yansıtır.
    if (playerInfo && !isHost()) {
      const data = playerInfo.getState("carData");
      if (data) {
        car.pos = car.pos.lerp(k.vec2(data.x, data.y), 0.35);
        car.angle = k.lerp(car.angle, data.angle, 0.35);
        car.hp = data.hp;
        car.speed = data.speed;
        car.state = data.state;
        car.skillActive = data.skillActive;
        car.skillCooldownTimer = data.skillCooldownTimer;
        car.skillDurationTimer = data.skillDurationTimer;
        car.dashActive = data.dashActive;
        car.dashCooldownTimer = data.dashCooldownTimer;
        car.dashDurationTimer = data.dashDurationTimer;
      }
      
      // Can barını araca göre konumlandır
      healthBarBg.pos = car.pos.add(0, HEALTH_BAR_OFFSET_Y);
      healthBarFill.pos = car.pos.add(HEALTH_BAR_OFFSET_X, HEALTH_BAR_OFFSET_Y);
      healthBarFill.scale.x = Math.max(0, car.hp / car.maxHp);
      
      return; // Client tarafında diğer fizik hesaplamalarını atla
    }

    // Can barını araca göre konumlandır (Dönüşlerden etkilenmemesi için bağımsız)
    healthBarBg.pos = car.pos.add(0, HEALTH_BAR_OFFSET_Y);
    healthBarFill.pos = car.pos.add(HEALTH_BAR_OFFSET_X, HEALTH_BAR_OFFSET_Y);
    healthBarFill.scale.x = Math.max(0, car.hp / car.maxHp);

    // Yetenek zamanlayıcılarını güncelle
    if (car.skillDurationTimer > 0) {
      car.skillDurationTimer -= k.dt();
      if (car.skillDurationTimer <= 0) {
        car.skillActive = false;
        const skillGroup = SKILLS[car.carClass];
        const skill = (skillGroup && skillGroup[car.skillId]) || (skillGroup && skillGroup.default);
        skill?.deactivate?.(car);
      }
    }
    if (car.skillCooldownTimer > 0) {
      car.skillCooldownTimer -= k.dt();
    }

    // Özel yetenek zamanlayıcılarını güncelle
    if (car.slowTimer && car.slowTimer > 0) {
      car.slowTimer -= k.dt();
    }
    if (car.reversedControlsTimer && car.reversedControlsTimer > 0) {
      car.reversedControlsTimer -= k.dt();
    }
    if (car.ghostDamageBoostTimer && car.ghostDamageBoostTimer > 0) {
      car.ghostDamageBoostTimer -= k.dt();
    }

    // Dash zamanlayıcılarını güncelle
    if (car.dashDurationTimer > 0) {
      car.dashDurationTimer -= k.dt();
      if (car.dashDurationTimer <= 0) {
        car.dashActive = false;
        car.speed = Math.min(car.maxSpeed, car.speed);
      }
    }
    if (car.dashCooldownTimer > 0) {
      car.dashCooldownTimer -= k.dt();
    }

    // --- INPUT TOPLAMA & GÖNDERME ---
    const { driveInput, triggerDashPress, triggerSkillPress } = getCarInputs(car, playerInfo, controls);

    if (car.state === "DRIVING") {
      if (triggerDashPress) triggerDash(car);
      if (triggerSkillPress) triggerSkill(car);
    }

    // Inputları araca ata (states.js okuması için)
    car.driveInputs = driveInput;

    // Akıcı Dash Kuyruk Efekti (Hayalet İz)
    if ((car.dashActive || (car.skillActive && car.carClass === "DENGELI")) && k.chance(0.45)) {
      const trail = k.add([
        k.pos(car.pos),
        k.rotate(car.angle),
        k.color(car.color),
        k.opacity(0.3),
        k.anchor("center"),
      ]);
      drawCarDetails(trail, type, color, skinId);
      trail.onUpdate(() => {
        trail.opacity -= k.dt() * 3.5;
        if (trail.opacity <= 0) trail.destroy();
      });
    }

    // Akıcı Tekerlek İzi Efekti (Skid Marks)
    const isSteering = car.driveInputs && (car.driveInputs.left || car.driveInputs.right);
    const isDrifting = isSteering && Math.abs(car.speed) > 120;
    const isRecoiling = car.state === "RECOIL" && Math.abs(car.speed) > 80;
    
    if ((isDrifting || isRecoiling || car.dashActive) && k.chance(0.4)) {
      const rad = k.deg2rad(car.angle);
      const wOffset = config.width / 2 - 8;
      const hOffset = config.height / 2 - 1;

      // Arka sol ve arka sağ tekerleklerin dünya koordinatları
      const leftWheel = car.pos.add(k.vec2(
        Math.cos(rad) * -wOffset - Math.sin(rad) * -hOffset,
        Math.sin(rad) * -wOffset + Math.cos(rad) * -hOffset
      ));

      const rightWheel = car.pos.add(k.vec2(
        Math.cos(rad) * -wOffset - Math.sin(rad) * hOffset,
        Math.sin(rad) * -wOffset + Math.cos(rad) * hOffset
      ));

      [leftWheel, rightWheel].forEach(wPos => {
        const skid = k.add([
          k.rect(6, 3, { radius: 0.5 }),
          k.pos(wPos),
          k.rotate(car.angle),
          k.color(20, 20, 25),
          k.opacity(0.2),
          k.anchor("center"),
          k.z(-7),
        ]);
        skid.onUpdate(() => {
          skid.opacity -= k.dt() * 0.45;
          if (skid.opacity <= 0) skid.destroy();
        });
      });
    }

    CAR_STATES[car.state]?.update?.(car);

    // --- HOST FİZİK YAYINI ---
    if (playerInfo && isHost()) {
      playerInfo.setState("carData", {
        x: car.pos.x,
        y: car.pos.y,
        angle: car.angle,
        hp: car.hp,
        speed: car.speed,
        state: car.state,
        skillActive: car.skillActive,
        skillCooldownTimer: car.skillCooldownTimer,
        skillDurationTimer: car.skillDurationTimer,
        dashActive: car.dashActive,
        dashCooldownTimer: car.dashCooldownTimer,
        dashDurationTimer: car.dashDurationTimer,
      });
    }
  });

  return car;
}
