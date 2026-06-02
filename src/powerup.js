import { k } from "./kaplay.js";
import { spawnExplosion } from "./utils.js";

// Rekabetçi, sade ve anlık itiş/can/yetenek desteği sunan 3 temel güçlendirici
export const POWERUPS = {
  TAMIR: {
    name: "TAMIR",
    color: k.rgb(0, 220, 100), // Yeşil: +25 HP can yeniler
    activate: (car) => {
      car.hp = Math.min(car.maxHp, car.hp + 25);
      k.shake(3);
    }
  },
  NITRO: {
    name: "NITRO",
    color: k.rgb(255, 215, 0), // Sarı/Altın: Anlık ileri itiş gücü (Zamanlayıcısız, sade)
    activate: (car) => {
      car.speed = Math.min(car.maxSpeed * 1.4, Math.max(car.speed, 0) + 160);
      k.shake(2.5);
    }
  },
  SARJ: {
    name: "SARJ",
    color: k.rgb(0, 190, 255), // Açık Mavi: Yetenek süresini sıfırlar
    activate: (car) => {
      car.skillCooldownTimer = 0;
      k.shake(2);
    }
  }
};

// Tek bir power-up nesnesi oluşturur
function createSinglePowerup() {
  const r = k.rand(0, 1);
  let chosenType = "TAMIR"; // %65 ihtimal
  if (r < 0.10) {
    chosenType = "NITRO"; // %10 ihtimal
  } else if (r < 0.35) {
    chosenType = "SARJ";  // %25 ihtimal
  }

  const config = POWERUPS[chosenType];

  const margin = 140;
  const pos = k.vec2(
    k.rand(margin, k.width() - margin),
    k.rand(margin, k.height() - margin)
  );

  // Minimalist Dönen Diamond (Baklava) Geometrisi
  const pUp = k.add([
    k.rect(10, 10, { radius: 2 }),
    k.pos(pos),
    k.rotate(45),
    k.color(config.color),
    k.anchor("center"),
    k.area(),
    "powerup",
    { type: chosenType }
  ]);

  // Diamond dış halka
  const glowRing = k.add([
    k.rect(14, 14, { radius: 2 }),
    k.pos(pos),
    k.rotate(45),
    k.color(config.color),
    k.opacity(0.25),
    k.anchor("center"),
  ]);

  pUp.onUpdate(() => {
    pUp.angle += k.dt() * 90;
  });

  glowRing.onUpdate(() => {
    glowRing.angle = pUp.angle;
    glowRing.scale = k.vec2(1 + Math.sin(k.time() * 6) * 0.25);
  });

  pUp.onDestroy(() => {
    glowRing.destroy();
  });
}

// Haritada power-up üretme fonksiyonu
export function spawnPowerup() {
  if (k.gameOver || k.isGamePaused) return;

  // Arenada aynı anda en fazla 2 aktif kit bulunabilir
  const existing = k.get("powerup");
  if (existing.length >= 2) return;

  // %30 ihtimalle çift kit (eğer arena tamamen boşsa), aksi halde 1 adet üretilir
  const count = (k.chance(0.3) && existing.length === 0) ? 2 : 1;

  for (let i = 0; i < count; i++) {
    createSinglePowerup();
  }
}

// Oyuncu ve Kit etkileşimi
export function setupPowerupCollisions() {
  k.onCollide("player", "powerup", (player, pUp) => {
    const config = POWERUPS[pUp.type];
    if (config) {
      config.activate(player);
      // Kitin renginde özel patlama kıvılcımı oluştur (Dopaminerjik game feel)
      spawnExplosion(pUp.pos, 15, config.color);
      pUp.destroy();
    }
  });
}
