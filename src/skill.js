import { k } from "./kaplay.js";
import { CAR_TYPES } from "./config.js";
import { spawnExplosion, inflictDamage } from "./utils.js";

// Her araç tipine özel yetenekler. Hem varsayılan hem de mağazadan satın alınabilir ek yetenekler burada tanımlıdır.
export const SKILLS = {
  HIPHIZLI: {
    // --- BARKAN YETENEĞİ ---
    leader_trail: {
      name: "LİDER TAKİBİ",
      icon: "👥",
      cooldown: 9,
      duration: 3.0,
      desc: "Kendisini takip eden ve hedefe kilitlenip çarptığında patlayan (40 Hasar) otonom bir gölge decoy kopya oluşturur.",
      activate: (car) => {
        const target = k.get("player").find(p => p.carTag !== car.carTag);
        
        // Spawn shadow decoy car
        const decoy = k.add([
          k.rect(car.width, car.height, { radius: car.radius }),
          k.pos(car.pos.sub(k.vec2(Math.cos(k.deg2rad(car.angle)) * 60, Math.sin(k.deg2rad(car.angle)) * 60))),
          k.rotate(car.angle),
          k.color(car.color),
          k.opacity(0.55),
          k.anchor("center"),
          k.area(),
          "decoy_copy",
          {
            target,
            speed: 260,
            damage: 40,
            lifeTime: 3.0,
            ownerTag: car.carTag
          }
        ]);

        // Holographic neon outline effect
        const outlineGlow = decoy.add([
          k.rect(car.width + 4, car.height + 4, { radius: car.radius + 1, fill: false }),
          k.outline(2.5, k.rgb(0, 255, 255)),
          k.anchor("center")
        ]);

        decoy.onUpdate(() => {
          decoy.lifeTime -= k.dt();
          if (decoy.lifeTime <= 0) {
            spawnExplosion(decoy.pos, 15, k.rgb(0, 255, 255));
            decoy.destroy();
            return;
          }
          // Follow/home-in on opponent
          if (decoy.target && decoy.target.exists()) {
            const angleToTarget = k.vec2(decoy.target.pos).sub(decoy.pos).angle();
            let diff = angleToTarget - decoy.angle;
            while (diff < -180) diff += 360;
            while (diff > 180) diff -= 360;
            decoy.angle += diff * k.dt() * 4.5;
          }
          const rad = k.deg2rad(decoy.angle);
          decoy.move(Math.cos(rad) * decoy.speed, Math.sin(rad) * decoy.speed);
          outlineGlow.opacity = 0.4 + Math.sin(k.time() * 12) * 0.25;
        });

        decoy.onCollide("player", (other) => {
          if (other.carTag !== decoy.ownerTag) {
            inflictDamage(other, decoy.damage);
            spawnExplosion(decoy.pos, 30, k.rgb(0, 255, 255));
            decoy.destroy();
          }
        });

        car.decoyRef = decoy;
      },
      deactivate: (car) => {
        car.decoyRef = null;
      }
    },

    // --- ASLAN YETENEĞİ ---
    gnss_jammer: {
      name: "EM ALAN KİLİDİ",
      icon: "📡",
      cooldown: 8,
      duration: 2.5,
      desc: "Çevresinde bir EM bozucu alan açar. Alandaki rakibin yön kontrollerini tersine çevirir ve hızını yarıya indirir.",
      activate: (car) => {
        // Blinking gold/yellow EM circle
        car.emAura = car.add([
          k.circle(95),
          k.color(255, 215, 0),
          k.opacity(0.12),
          k.anchor("center"),
          k.z(-1)
        ]);
        car.emAuraOutline = car.add([
          k.circle(95),
          k.color(255, 215, 0),
          k.opacity(0.35),
          k.anchor("center"),
          k.outline(2, k.rgb(255, 215, 0)),
          k.z(-1),
          { fill: false }
        ]);

        car.emLoop = car.onUpdate(() => {
          const target = k.get("player").find(p => p.carTag !== car.carTag);
          if (target && target.exists()) {
            if (car.pos.dist(target.pos) < 100) {
              target.reversedControlsTimer = 1.0;
              target.slowTimer = 1.0;
              if (k.chance(0.2)) {
                spawnExplosion(target.pos, 4, k.rgb(255, 215, 0));
              }
            }
          }
          if (car.emAura) {
            car.emAura.opacity = 0.12 + Math.sin(k.time() * 15) * 0.04;
          }
        });
      },
      deactivate: (car) => {
        if (car.emAura) {
          try { car.emAura.destroy(); } catch (e) {}
          car.emAura = null;
        }
        if (car.emAuraOutline) {
          try { car.emAuraOutline.destroy(); } catch (e) {}
          car.emAuraOutline = null;
        }
        if (car.emLoop) {
          try { car.emLoop.cancel(); } catch (e) {}
          car.emLoop = null;
        }
      }
    },

    // --- KAPGAN YETENEĞİ ---
    ghost: {
      name: "HAYALET TAARRUZ",
      icon: "👻",
      cooldown: 8,
      duration: 2.2,
      desc: "Görünmez/saydam moda geçip hızlanır. Rakibin içinden geçebilir; temas ederse 35 hasar verir ve rakibi 1.5 saniyeliğine %40 yavaşlatır.",
      activate: (car) => {
        car.isGhost = true;
        car.opacity = 0.35;
        car.speed = car.maxSpeed * 1.35;
        
        let hasHit = false;
        car.ghostUpdate = car.onUpdate(() => {
          const target = k.get("player").find(p => p.carTag !== car.carTag);
          if (target && target.exists() && car.pos.dist(target.pos) < 45 && !hasHit) {
            hasHit = true;
            inflictDamage(target, 35);
            target.slowTimer = 1.5; // slows opponent
            spawnExplosion(car.pos, 25, k.rgb(120, 100, 255));
          }
        });
      },
      deactivate: (car) => {
        car.isGhost = false;
        car.opacity = 1.0;
        if (car.ghostUpdate) {
          try { car.ghostUpdate.cancel(); } catch (e) {}
          car.ghostUpdate = null;
        }
      }
    },

    // --- MAĞAZA ALT BARI/YEDEKLER ---
    default: {
      name: "HAYALET",
      icon: "👻",
      cooldown: 6,
      duration: 0.8,
      desc: "0.8 saniye boyunca hayalete dönüşerek rakiplerin içinden geçer.",
      activate: (car) => {
        car.isGhost = true;
        car.opacity = 0.3;
      },
      deactivate: (car) => {
        car.isGhost = false;
        car.opacity = 1.0;
      }
    },
  },

  GUCLU: {
    // --- BARKAN 2 YETENEĞİ ---
    swarm_mark: {
      name: "SÜRÜ DESTEĞİ",
      icon: "💚",
      cooldown: 9,
      duration: 3.0,
      desc: "Gövde etrafında dönen nanobotlar çağırır. Süre boyunca saniyede 12 HP yeniler (Toplam 36 HP) ve ivmesini artırır.",
      activate: (car) => {
        car.nanoDrones = [];
        for (let i = 0; i < 2; i++) {
          const drone = car.add([
            k.circle(4),
            k.color(0, 255, 128),
            k.pos(0, 0),
            k.anchor("center"),
            k.z(2)
          ]);
          car.nanoDrones.push(drone);
        }

        let angle = 0;
        let healTimer = 0;
        car.swarmLoop = car.onUpdate(() => {
          angle += k.dt() * 5.5;
          car.nanoDrones.forEach((drone, idx) => {
            const finalAngle = angle + idx * Math.PI;
            drone.pos = k.vec2(Math.cos(finalAngle) * 35, Math.sin(finalAngle) * 35);
          });

          healTimer += k.dt();
          if (healTimer >= 0.5) {
            healTimer = 0;
            car.hp = Math.min(car.maxHp, car.hp + 6);
            if (k.chance(0.45)) {
              spawnExplosion(car.pos, 3, k.rgb(0, 255, 128));
            }
          }
        });
      },
      deactivate: (car) => {
        if (car.nanoDrones) {
          car.nanoDrones.forEach(d => {
            try { d.destroy(); } catch (e) {}
          });
          car.nanoDrones = [];
        }
        if (car.swarmLoop) {
          try { car.swarmLoop.cancel(); } catch (e) {}
          car.swarmLoop = null;
        }
      }
    },

    // --- TUNGA YETENEĞİ ---
    sarp_ram: {
      name: "KİNETİK KOÇBAŞI",
      icon: "🐂",
      cooldown: 10,
      duration: 2.5,
      desc: "Önüne fiziksel bir koçbaşı bariyeri açar. Toslama kütlesini 2.5 katına çıkarır ve çarpışma hasarı almaz.",
      activate: (car) => {
        const w = (CAR_TYPES[car.carType]?.width || 58);
        const h = (CAR_TYPES[car.carType]?.height || 38);
        const baseMass = CAR_TYPES[car.carType]?.mass || 1.8;
        car.mass = baseMass * 2.5;
        car.isInvulnerable = true;
        
        car.ramBumper = car.add([
          k.rect(6, h + 12, { radius: 2 }),
          k.pos(w / 2 + 3, 0),
          k.anchor("center"),
          k.color(255, 69, 0),
          k.opacity(0.85),
          k.z(1)
        ]);

        car.ramAura = car.add([
          k.rect(w + 8, h + 8, { radius: 5, fill: false }),
          k.outline(2.5, k.rgb(255, 69, 0)),
          k.pos(0, 0),
          k.anchor("center"),
          k.z(1)
        ]);
        
        car.ramAura.onUpdate(() => {
          if (car.ramAura) {
            car.ramAura.opacity = 0.35 + Math.sin(k.time() * 12) * 0.15;
          }
        });
      },
      deactivate: (car) => {
        car.mass = CAR_TYPES[car.carType]?.mass || 1.8;
        car.isInvulnerable = false;
        if (car.ramBumper) {
          try { car.ramBumper.destroy(); } catch (e) {}
          car.ramBumper = null;
        }
        if (car.ramAura) {
          try { car.ramAura.destroy(); } catch (e) {}
          car.ramAura = null;
        }
      }
    },

    // --- MAĞAZA ALT BARI/YEDEKLER ---
    default: {
      name: "OFKE",
      icon: "💥",
      cooldown: 7,
      duration: 2.0,
      desc: "2 saniye boyunca toslama kütlesini 2.2 katına çıkarır. Direksiyon kabiliyeti %15 azalır.",
      activate: (car) => {
        const baseMass = CAR_TYPES[car.carType]?.mass || 1.55;
        car.mass = baseMass * 2.2;
        const w = (CAR_TYPES[car.carType]?.width || 50);
        const h = (CAR_TYPES[car.carType]?.height || 30);
        const r = (CAR_TYPES[car.carType]?.radius || 2);
        
        car.rageEffect = car.add([
          k.rect(w + 8, h + 8, { radius: r + 1, fill: false }),
          k.outline(2.5, k.rgb(255, 215, 0)),
          k.pos(0, 0),
          k.anchor("center"),
          k.z(1),
        ]);
        car.rageEffect.onUpdate(() => {
          if (car.rageEffect) {
            car.rageEffect.opacity = 0.4 + Math.sin(k.time() * 12) * 0.2;
          }
        });
      },
      deactivate: (car) => {
        car.mass = CAR_TYPES[car.carType]?.mass || 1.55;
        if (car.rageEffect) {
          try { car.rageEffect.destroy(); } catch (e) {}
          car.rageEffect = null;
        }
      }
    },
  },

  TANK: {
    // --- GÖLGE SÜVARİ YETENEĞİ ---
    active_suspension: {
      name: "AKTİF SÜSPANSİYON",
      icon: "🧱",
      cooldown: 8,
      duration: 1.2,
      desc: "1.2 saniye boyunca kendini yere sabitler. Hasar almaz, çarpan düşmanı geri fırlatıp 40 hasar yansıtır.",
      activate: (car) => {
        car.isInvulnerable = true;
        car.isAnchored = true;
        car.mass = 99999;
        car.speed = 0;

        const w = (CAR_TYPES[car.carType]?.width || 76);
        const h = (CAR_TYPES[car.carType]?.height || 52);
        
        car.suspensionEffect = car.add([
          k.rect(w + 14, h + 14, { radius: 6, fill: false }),
          k.outline(3.0, k.rgb(255, 140, 0)),
          k.pos(0, 0),
          k.anchor("center"),
          k.z(1),
        ]);
        car.suspensionEffect.onUpdate(() => {
          if (car.suspensionEffect) {
            car.suspensionEffect.opacity = 0.45 + Math.sin(k.time() * 15) * 0.2;
          }
        });
      },
      deactivate: (car) => {
        car.isInvulnerable = false;
        car.isAnchored = false;
        car.mass = CAR_TYPES[car.carType]?.mass || 2.5;
        if (car.suspensionEffect) {
          try { car.suspensionEffect.destroy(); } catch (e) {}
          car.suspensionEffect = null;
        }
      }
    },

    // --- ALPAR YETENEĞİ ---
    tactical_repair: {
      name: "REAKTİF ZIRH",
      icon: "🛡️",
      cooldown: 10,
      duration: 3.0,
      desc: "3 saniye boyunca zırhı açar. Alınan çarpışma hasarlarını yok sayar ve çarpışma başına 20 HP can yeniler (Maks 2 kere).",
      activate: (car) => {
        car.reactiveHealsLeft = 2;
        const w = (CAR_TYPES[car.carType]?.width || 78);
        const h = (CAR_TYPES[car.carType]?.height || 54);
        
        car.reactiveArmorGlow = car.add([
          k.rect(w + 12, h + 12, { radius: 6, fill: false }),
          k.outline(2.5, k.rgb(0, 255, 128)),
          k.pos(0, 0),
          k.anchor("center"),
          k.z(1),
        ]);
        car.reactiveArmorGlow.onUpdate(() => {
          if (car.reactiveArmorGlow) {
            car.reactiveArmorGlow.opacity = 0.4 + Math.sin(k.time() * 10) * 0.2;
          }
        });
      },
      deactivate: (car) => {
        car.reactiveHealsLeft = 0;
        if (car.reactiveArmorGlow) {
          try { car.reactiveArmorGlow.destroy(); } catch (e) {}
          car.reactiveArmorGlow = null;
        }
      }
    },

    // --- MAĞAZA ALT BARI/YEDEKLER ---
    default: {
      name: "DEMIR",
      icon: "🧱",
      cooldown: 8,
      duration: 1.2,
      desc: "1.2 saniye boyunca kendini yere sabitler. Alınan toslama hasarını yok sayar ve çarpan rakibi geriye iter.",
      activate: (car) => {
        car.isInvulnerable = true;
        car.isAnchored = true;
        car.mass = 99999;
        car.speed = 0;

        const w = (CAR_TYPES[car.carType]?.width || 76);
        const h = (CAR_TYPES[car.carType]?.height || 52);
        
        car.ironEffect = car.add([
          k.rect(w + 10, h + 10, { radius: 4, fill: false }),
          k.outline(2.5, k.rgb(128, 128, 128)),
          k.pos(0, 0),
          k.anchor("center"),
          k.z(1),
        ]);
        car.ironEffect.onUpdate(() => {
          if (car.ironEffect) {
            car.ironEffect.opacity = 0.5 + Math.sin(k.time() * 8) * 0.2;
          }
        });
      },
      deactivate: (car) => {
        car.isInvulnerable = false;
        car.isAnchored = false;
        car.mass = CAR_TYPES[car.carType]?.mass || 2.65;
        if (car.ironEffect) {
          try { car.ironEffect.destroy(); } catch (e) {}
          car.ironEffect = null;
        }
      }
    },
  }
};
