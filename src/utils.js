import { k } from "./kaplay.js";

// Çarpışma anında kıvılcım/patlama efekti üreten fonksiyon.
export function spawnExplosion(pos, intensity, customColor) {
  const count = Math.min(25, Math.max(8, intensity * 0.5));
  for (let i = 0; i < count; i++) {
    const angle = k.rand(0, 360);
    const speed = k.rand(100, 250);
    const rad = k.deg2rad(angle);
    const vel = k.vec2(Math.cos(rad) * speed, Math.sin(rad) * speed);
    const color = customColor || k.rgb(255, k.rand(120, 220), 0);
    const p = k.add([
      k.pos(pos),
      k.rect(k.rand(4, 8), k.rand(4, 8)),
      k.color(color),
      k.rotate(k.rand(0, 360)),
      k.anchor("center"),
      k.opacity(),
      k.lifespan(0.4),
    ]);
    p.onUpdate(() => p.move(vel));
  }
}

// Hasar uygulama ve geribildirim fonksiyonu (flaş efekti)
export function inflictDamage(victim, damage) {
  if (victim.isInvulnerable) return; // Kalkan veya Demir Duvar etkisindeyse hasar alma

  let finalDamage = damage;
  if (victim.armorBrokenTimer && victim.armorBrokenTimer > 0) {
    finalDamage = Math.floor(damage * 1.20); // Zırhı kırıkken %20 fazla hasar alır
  }

  victim.hp = Math.max(0, victim.hp - finalDamage);

  const isArmorBroken = victim.armorBrokenTimer && victim.armorBrokenTimer > 0;
  const flashColor = isArmorBroken ? k.rgb(180, 100, 255) : k.rgb(255, 255, 255);
  const origColor = victim.originalColor || k.rgb(120, 120, 120);

  victim.color = flashColor;

  k.wait(0.2, () => {
    if (victim.exists()) {
      victim.color = (victim.armorBrokenTimer && victim.armorBrokenTimer > 0) 
        ? k.rgb(180, 100, 255) 
        : origColor;
    }
  });
}

// Prototip / Gösterim mühimmatı ve destek IHA'sı geometrik çizim fonksiyonu
export function drawProjectileDetails(parent, type, color) {
  const c = color || k.rgb(200, 200, 200);

  if (type === "mizrak") {
    // Cylindrical body (width 36, height 12)
    parent.add([k.rect(36, 6, { radius: 1 }), k.pos(0, 0), k.color(c), k.anchor("center")]);
    // Symmetrical swept-back wings
    parent.add([k.rect(4, 12, { radius: 0.5 }), k.pos(2, -6), k.color(c), k.rotate(-25), k.anchor("center")]);
    parent.add([k.rect(4, 12, { radius: 0.5 }), k.pos(2, 6), k.color(c), k.rotate(25), k.anchor("center")]);
    // Symmetrical tail fins
    parent.add([k.rect(2, 6), k.pos(-14, -5), k.color(c), k.anchor("center")]);
    parent.add([k.rect(2, 6), k.pos(-14, 5), k.color(c), k.anchor("center")]);
    // Camera sensor nose
    parent.add([k.circle(2), k.pos(18, 0), k.color(255, 0, 0), k.anchor("center")]);
  } 
  else if (type === "sivrisinek") {
    // Mini Thin body (width 15, height 6)
    parent.add([k.rect(15, 2, { radius: 0.2 }), k.pos(0, 0), k.color(c), k.anchor("center")]);
    // Mini Symmetrical wings
    parent.add([k.rect(2, 6, { radius: 0.2 }), k.pos(0, 0), k.color(c), k.anchor("center")]);
    // Mini Symmetrical tail plane
    parent.add([k.rect(0.8, 3), k.pos(-6.5, 0), k.color(c), k.anchor("center")]);
    // Mini Camera sensor nose
    parent.add([k.circle(0.8), k.pos(7.5, 0), k.color(0, 255, 255), k.anchor("center")]);
  }
  else if (type === "kemankes_2") {
    // Jet cruise missile body (width 25, height 8)
    parent.add([k.rect(25, 4, { radius: 1.5 }), k.pos(0, 0), k.color(c), k.anchor("center")]);
    // Symmetrical swept-back wings
    parent.add([k.rect(3, 8, { radius: 0.5 }), k.pos(2, -4), k.color(c), k.rotate(-35), k.anchor("center")]);
    parent.add([k.rect(3, 8, { radius: 0.5 }), k.pos(2, 4), k.color(c), k.rotate(35), k.anchor("center")]);
    // Symmetrical tail fins
    parent.add([k.rect(1.5, 4), k.pos(-10, -3), k.color(c), k.anchor("center")]);
    parent.add([k.rect(1.5, 4), k.pos(-10, 4), k.color(c), k.anchor("center")]);
    // Symmetrical side air intakes
    parent.add([k.rect(3, 1.5), k.pos(-4, -3.5), k.color(50, 50, 55), k.anchor("center")]);
    parent.add([k.rect(3, 1.5), k.pos(-4, 3.5), k.color(50, 50, 55), k.anchor("center")]);
    // Camera nose
    parent.add([k.circle(2), k.pos(12.5, 0), k.color(255, 128, 0), k.anchor("center")]);
  }
  else if (type === "kemankes_1") {
    // Body (width 17, height 6)
    parent.add([k.rect(17, 3, { radius: 1 }), k.pos(0, 0), k.color(c), k.anchor("center")]);
    // Symmetrical straight wings
    parent.add([k.rect(2.5, 6, { radius: 0.5 }), k.pos(-1, 0), k.color(c), k.anchor("center")]);
    // Symmetrical tail plane
    parent.add([k.rect(1, 4), k.pos(-7, 0), k.color(c), k.anchor("center")]);
    // Yellow camera nose
    parent.add([k.circle(1.5), k.pos(8.5, 0), k.color(255, 255, 0), k.anchor("center")]);
  }
  else if (type === "kalkan_diha") {
    // Fuselage
    parent.add([k.rect(32, 8, { radius: 2 }), k.pos(0, 0), k.color(c), k.anchor("center")]);
    // Symmetrical wings
    parent.add([k.rect(6, 44, { radius: 1 }), k.pos(2, 0), k.color(c), k.anchor("center")]);
    // Symmetrical rotors (4 circles)
    parent.add([k.circle(3.5), k.pos(2, -18), k.color(50, 50, 55), k.anchor("center")]);
    parent.add([k.circle(3.5), k.pos(2, 18), k.color(50, 50, 55), k.anchor("center")]);
    parent.add([k.circle(3.5), k.pos(-6, -12), k.color(50, 50, 55), k.anchor("center")]);
    parent.add([k.circle(3.5), k.pos(-6, 12), k.color(50, 50, 55), k.anchor("center")]);
    // Pusher propeller at tail
    parent.add([k.rect(1.5, 10), k.pos(-16, 0), k.color(100, 100, 100), k.anchor("center")]);
  }
  else if (type === "mini_iha") {
    // Fuselage
    parent.add([k.rect(22, 4, { radius: 0.8 }), k.pos(0, 0), k.color(c), k.anchor("center")]);
    // Symmetrical wings
    parent.add([k.rect(3, 24, { radius: 0.5 }), k.pos(-2, 0), k.color(c), k.anchor("center")]);
    // Puller propeller at nose
    parent.add([k.rect(1, 8), k.pos(11, 0), k.color(80, 80, 80), k.anchor("center")]);
    // Symmetrical tailplane
    parent.add([k.rect(1.5, 6), k.pos(-10, 0), k.color(c), k.anchor("center")]);
  }
  else if (type === "mam_t") {
    // Heavy glider bomb body (width 14, height 8)
    parent.add([k.rect(14, 4, { radius: 1.5 }), k.pos(0, 0), k.color(c), k.anchor("center")]);
    // Symmetrical gliding wings
    parent.add([k.rect(2.5, 8, { radius: 0.5 }), k.pos(-1, 0), k.color(c), k.anchor("center")]);
    // Symmetrical tail fins
    parent.add([k.rect(1.5, 6), k.pos(-5.5, 0), k.color(c), k.anchor("center")]);
    // Laser sensor nose
    parent.add([k.circle(2), k.pos(7, 0), k.color(255, 0, 0), k.anchor("center")]);
  }
  else if (type === "mam_l") {
    // Mini bomb body (width 10, height 5)
    parent.add([k.rect(10, 3, { radius: 1 }), k.pos(0, 0), k.color(c), k.anchor("center")]);
    // Symmetrical wings
    parent.add([k.rect(1.8, 5, { radius: 0.5 }), k.pos(-0.5, 0), k.color(c), k.anchor("center")]);
    // Symmetrical tail fins
    parent.add([k.rect(1, 4), k.pos(-4, 0), k.color(c), k.anchor("center")]);
    // Laser sensor nose
    parent.add([k.circle(1.5), k.pos(5, 0), k.color(255, 0, 0), k.anchor("center")]);
  }
  else if (type === "cakir") {
    // Stealthy body (width 41, height 10)
    parent.add([k.rect(41, 6, { radius: 2 }), k.pos(0, 0), k.color(c), k.anchor("center")]);
    // Symmetrical swept wings
    parent.add([k.rect(4, 10, { radius: 0.5 }), k.pos(3, -6), k.color(c), k.rotate(-25), k.anchor("center")]);
    parent.add([k.rect(4, 10, { radius: 0.5 }), k.pos(3, 6), k.color(c), k.rotate(25), k.anchor("center")]);
    // Symmetrical tail fins
    parent.add([k.rect(2, 6), k.pos(-16, -4), k.color(c), k.anchor("center")]);
    parent.add([k.rect(2, 6), k.pos(-16, 4), k.color(c), k.anchor("center")]);
    // Symmetrical air intakes on the sides
    parent.add([k.rect(4, 1.5), k.pos(-8, -4.5), k.color(30, 30, 35), k.anchor("center")]);
    parent.add([k.rect(4, 1.5), k.pos(-8, 4.5), k.color(30, 30, 35), k.anchor("center")]);
    // Purple camera nose
    parent.add([k.circle(3), k.pos(20.5, 0), k.color(255, 0, 128), k.anchor("center")]);
  }
  else if (type === "fettah") {
    // Hypersonic missile body (width 55, height 8)
    parent.add([k.rect(55, 4.5, { radius: 1 }), k.pos(0, 0), k.color(c), k.anchor("center")]);
    // Small rear fins
    parent.add([k.rect(2.5, 8), k.pos(-22, 0), k.color(c), k.anchor("center")]);
    // Yellow glowing tip
    parent.add([k.circle(2.25), k.pos(27.5, 0), k.color(255, 200, 0), k.anchor("center")]);
  }
  else if (type === "fettah_2") {
    // Advanced hypersonic missile body (width 60, height 9)
    parent.add([k.rect(60, 5, { radius: 1 }), k.pos(0, 0), k.color(c), k.anchor("center")]);
    // Small rear fins
    parent.add([k.rect(3, 9), k.pos(-24, 0), k.color(c), k.anchor("center")]);
    // Advanced stripe
    parent.add([k.rect(2, 5), k.pos(12, 0), k.color(255, 60, 60), k.anchor("center")]);
    // Orange/red glowing tip
    parent.add([k.circle(2.5), k.pos(30, 0), k.color(255, 60, 60), k.anchor("center")]);
  }
  else if (type === "ebabil") {
    // Heavy MIRV ballistic missile body (width 80, height 12)
    parent.add([k.rect(80, 7, { radius: 1.5 }), k.pos(0, 0), k.color(c), k.anchor("center")]);
    // Rear control fins
    parent.add([k.rect(4, 12), k.pos(-30, 0), k.color(c), k.anchor("center")]);
    // Payload nose cone (warhead section)
    parent.add([k.circle(3.5), k.pos(40, 0), k.color(100, 110, 120), k.anchor("center")]);
    // Represent MIRV warheads
    parent.add([k.circle(1), k.pos(32, -1.8), k.color(255, 0, 0), k.anchor("center")]);
    parent.add([k.circle(1), k.pos(32, 1.8), k.color(255, 0, 0), k.anchor("center")]);
  }
}
