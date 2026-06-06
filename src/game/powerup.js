import { k } from "../kaplay.js";
import { spawnExplosion } from "../utils.js";
import { getState, setState, isHost } from "playroomkit";
import { MAPS } from "../maps.js";
import { spawnSelectedProjectile } from "./projectiles.js";

// Rekabetçi, sade ve anlık itiş/can/yetenek desteği sunan temel güçlendiriciler ve mühimmatlar
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
    color: k.rgb(255, 215, 0), // Sarı/Altın: Anlık ileri itiş gücü
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
  },
  AKILLI_MUHIMMAT: {
    name: "AKILLI MUHIMMAT",
    color: k.rgb(255, 0, 0), // Kırmızı: Akıllı mühimmat kiti
    activate: (car) => {
      if (car.selectedWeapon) {
        spawnSelectedProjectile(car, car.selectedWeapon);
      }
    }
  },
  TAKTIK_DESTEK: {
    name: "TAKTIK DESTEK",
    color: k.rgb(255, 0, 128), // Neon Pembe: Taktik destek kiti
    activate: (car) => {
      if (car.selectedSupport) {
        spawnSelectedProjectile(car, car.selectedSupport);
      }
    }
  }
};

// Diamond (Baklava) nesnesini yerel olarak ekrana çizen yardımcı fonksiyon
function createLocalPowerup(sp) {
  const config = POWERUPS[sp.type];
  const pos = k.vec2(sp.x, sp.y);

  const pUp = k.add([
    k.rect(10, 10, { radius: 2 }),
    k.pos(pos),
    k.rotate(45),
    k.color(config.color),
    k.anchor("center"),
    // Görsel boyutu 10x10 iken toplama alanını daha geniş (32x32) yaparak çarpışma hassasiyetini iyileştiriyoruz
    k.area({ shape: new k.Rect(k.vec2(-16, -16), 32, 32) }),
    "powerup",
    { 
      type: sp.type,
      playroomPowerupId: sp.id
    }
  ]);

  const glowRing = k.add([
    k.rect(14, 14, { radius: 2 }),
    k.pos(pos),
    k.rotate(45),
    k.color(config.color),
    k.opacity(0.25),
    k.anchor("center"),
    k.scale(1),
  ]);

  pUp.onUpdate(() => {
    pUp.angle += k.dt() * 90;
  });

  glowRing.onUpdate(() => {
    glowRing.angle = pUp.angle;
    glowRing.scaleTo(1 + Math.sin(k.time() * 6) * 0.25);
  });

  pUp.onDestroy(() => {
    glowRing.destroy();
  });
}

// Playroom state üzerinden power-up senkronizasyonu
export function syncPowerups() {
  const syncedList = getState("powerups") || [];
  const localPowerups = k.get("powerup");

  // 1. Ağda silinen kitleri yerel ekrandan da temizle
  localPowerups.forEach((lp) => {
    const exists = syncedList.some((sp) => sp.id === lp.playroomPowerupId);
    if (!exists) {
      lp.destroy();
    }
  });

  // 2. Ağda yeni eklenen kitleri yerel ekrana çiz
  syncedList.forEach((sp) => {
    const alreadyLocal = localPowerups.some((lp) => lp.playroomPowerupId === sp.id);
    if (!alreadyLocal) {
      createLocalPowerup(sp);
    }
  });
}

function isInsideObstacle(px, py, mapData) {
  if (!mapData || !mapData.obstacles) return false;
  return mapData.obstacles.some(obs => {
    const halfW = obs.w / 2 + 40; // Ekstra güvenli marj
    const halfH = obs.h / 2 + 40;
    return px >= obs.x - halfW && px <= obs.x + halfW && py >= obs.y - halfH && py <= obs.y + halfH;
  });
}

// Host veya yerel mod tarafında power-up oluşturma
function createSinglePowerup() {
  const r = k.rand(0, 1);
  let chosenType = "TAMIR";
  if (r < 0.35) {
    chosenType = "TAMIR"; // %35 ihtimal
  } else if (r < 0.60) {
    chosenType = "NITRO"; // %25 ihtimal
  } else if (r < 0.80) {
    chosenType = "SARJ";  // %20 ihtimal
  } else if (r < 0.92) {
    chosenType = "AKILLI_MUHIMMAT"; // %12 ihtimal (Roket/Mühimmat)
  } else {
    chosenType = "TAKTIK_DESTEK";  // %8 ihtimal (İHA/Destek)
  }

  // Aktif haritayı alarak engellerin içine doğmasını engelle
  const mapName = k.isMultiplayer ? (getState("gameMap") || "NEON") : "NEON";
  const mapData = MAPS.find(m => m.name === mapName) || MAPS[0];

  const margin = 140;
  let x, y;
  let attempts = 0;
  do {
    x = k.rand(margin, k.width() - margin);
    y = k.rand(margin, k.height() - margin);
    attempts++;
  } while (attempts < 20 && isInsideObstacle(x, y, mapData));

  const id = String(Math.random());
  const sp = { id, type: chosenType, x, y };

  if (k.isMultiplayer) {
    const syncedList = getState("powerups") || [];
    syncedList.push(sp);
    setState("powerups", syncedList);
  } else {
    createLocalPowerup(sp);
  }
}

// Haritada power-up üretme fonksiyonu
export function spawnPowerup() {
  if (k.gameOver || k.isGamePaused) return;

  if (k.isMultiplayer) {
    if (!isHost()) return;
    const existing = getState("powerups") || [];
    if (existing.length >= 6) return;

    const count = (k.chance(0.4) && existing.length === 0) ? 2 : 1;
    for (let i = 0; i < count; i++) {
      createSinglePowerup();
    }
  } else {
    const existing = k.get("powerup");
    if (existing.length >= 6) return;

    const count = (k.chance(0.4) && existing.length === 0) ? 2 : 1;
    for (let i = 0; i < count; i++) {
      createSinglePowerup();
    }
  }
}

// Oyuncu ve Kit etkileşimi
export function setupPowerupCollisions() {
  k.onCollide("player", "powerup", (player, pUp) => {
    if (k.isMultiplayer) {
      if (!isHost()) return;

      const config = POWERUPS[pUp.type];
      if (config) {
        config.activate(player);
        spawnExplosion(pUp.pos, 15, config.color);
        
        const syncedList = getState("powerups") || [];
        const nextList = syncedList.filter(sp => sp.id !== pUp.playroomPowerupId);
        setState("powerups", nextList);
      }
    } else {
      const config = POWERUPS[pUp.type];
      if (config) {
        config.activate(player);
        spawnExplosion(pUp.pos, 15, config.color);
        pUp.destroy();
      }
    }
  });
}
