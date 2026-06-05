import { k } from "./kaplay.js";
import { CAR_TYPES } from "./config.js";
import { spawnExplosion } from "./utils.js";

// Her araç tipine özel yetenekler. Hem varsayılan hem de mağazadan satın alınabilir ek yetenekler burada tanımlıdır.
export const SKILLS = {
  HIPHIZLI: {
    // --- BARKAN YAYGIN YETENEĞİ ---
    leader_trail: {
      name: "KİNETİK TAMPON",
      icon: "⚡",
      cooldown: 8,
      duration: 2.0,
      desc: "2 saniye boyunca çarpışmada (toslamada) hasarını %50 artırır, alınan hasarı yarıya indirir.",
      activate: (car) => {
        const w = CAR_TYPES[car.carType].width;
        const h = CAR_TYPES[car.carType].height;
        car.kineticEffect = car.add([
          k.rect(w + 8, h + 8, { radius: 4 }),
          k.pos(0, 0),
          k.color(0, 255, 255), // Neon Cyan
          k.opacity(0.4),
          k.anchor("center"),
          k.z(1),
        ]);
      },
      deactivate: (car) => {
        if (car.kineticEffect) {
          try { car.kineticEffect.destroy(); } catch (e) {}
          car.kineticEffect = null;
        }
      }
    },
    gnss_jammer: {
      name: "ELEKTRO-MANYETİK ŞOK",
      icon: "📡",
      cooldown: 9,
      duration: 3.0,
      desc: "3 saniye boyunca elektro-manyetik tamponları açar. Bu sürede toslanan rakibin kontrollerini 2 saniyeliğine kilitleyip tersine çevirir.",
      activate: (car) => {
        const w = CAR_TYPES[car.carType].width;
        const h = CAR_TYPES[car.carType].height;
        car.shockEffect = car.add([
          k.rect(w + 8, h + 8, { radius: 4 }),
          k.pos(0, 0),
          k.color(255, 215, 0), // Neon Yellow/Gold
          k.opacity(0.45),
          k.anchor("center"),
          k.z(1),
        ]);
      },
      deactivate: (car) => {
        if (car.shockEffect) {
          try { car.shockEffect.destroy(); } catch (e) {}
          car.shockEffect = null;
        }
      }
    },
    // --- KAPGAN YAYGIN YETENEĞİ ---
    ghost: {
      name: "HAYALET MODU",
      icon: "👻",
      cooldown: 8,
      duration: 2.0,
      desc: "Hayalet moduna geçerek rakiplerin içinden geçer. Çıkışta 1 saniye boyunca %20 fazla vurur.",
      activate: (car) => {
        car.isGhost = true;
        car.opacity = 0.35;
      },
      deactivate: (car) => {
        car.isGhost = false;
        car.opacity = 1.0;
        car.ghostDamageBoostTimer = 1.0; // 1 saniye içinde vurursa %20 fazla hasar
        
        // Çıkışta mavi kıvılcım patlaması
        for (let i = 0; i < 8; i++) {
          const p = k.add([
            k.pos(car.pos.add(k.rand(-15, 15), k.rand(-10, 10))),
            k.color(150, 150, 255),
            k.rect(5, 5),
            k.anchor("center"),
            k.opacity(0.8),
            k.lifespan(0.3),
          ]);
          p.onUpdate(() => {
            p.move(k.rand(-50, 50), k.rand(-50, 50));
          });
        }
      }
    },
    // --- MAĞAZA ALT BARI/YEDEKLER ---
    default: {
      name: "HAYALET",
      icon: "👻",
      cooldown: 6,
      duration: 0.8,
      activate: (car) => {
        car.isGhost = true;
        car.opacity = 0.3;
      },
      deactivate: (car) => {
        car.isGhost = false;
        car.opacity = 1.0;
      }
    },
    boost: {
      name: "TURBO BOOST",
      icon: "⚡",
      cooldown: 6,
      duration: 1.0,
      activate: (car) => {
        car.speed = car.maxSpeed * 2.5;
        car.acceleration = car.acceleration * 2.0;
        car.boostEffect = car.add([
          k.rect(40, 4),
          k.pos(-25, 0),
          k.color(0, 255, 255),
          k.opacity(0.7),
          k.anchor("center"),
        ]);
      },
      deactivate: (car) => {
        car.acceleration = CAR_TYPES[car.carType].acceleration;
        if (car.boostEffect) {
          try { car.boostEffect.destroy(); } catch (e) {}
          car.boostEffect = null;
        }
      }
    },
    phase: {
      name: "HAYALET MODU",
      icon: "👻",
      cooldown: 9,
      duration: 1.5,
      activate: (car) => {
        car.isGhost = true;
        car.opacity = 0.35;
        car.speed = car.maxSpeed * 1.5;
      },
      deactivate: (car) => {
        car.isGhost = false;
        car.opacity = 1.0;
      }
    }
  },

  GUCLU: {
    // --- BARKAN 2 YAYGIN YETENEĞİ ---
    swarm_mark: {
      name: "ZIRH KIRICI",
      icon: "💥",
      cooldown: 7,
      duration: 3.0,
      desc: "Zırh Kırıcı dalgası açar. Bu esnada çarpılan rakibin zırhı 3 saniyeliğine kırılır (+%20 hasar).",
      activate: (car) => {
        const w = CAR_TYPES[car.carType].width;
        const h = CAR_TYPES[car.carType].height;
        car.swarmEffect = car.add([
          k.rect(w + 10, h + 10, { radius: 4 }),
          k.pos(0, 0),
          k.color(180, 100, 255), // Mor zırh kırıcı parıltısı
          k.opacity(0.55),
          k.anchor("center"),
          k.z(1),
        ]);
      },
      deactivate: (car) => {
        if (car.swarmEffect) {
          try { car.swarmEffect.destroy(); } catch (e) {}
          car.swarmEffect = null;
        }
      }
    },
    // --- TUNGA YAYGIN YETENEĞİ ---
    sarp_ram: {
      name: "SARP DUAL KOÇBAŞI",
      icon: "🐂",
      cooldown: 8,
      duration: 2.0,
      desc: "SARP Çift Koçbaşını aktif eder. Toslama kütlesini artırır ve çarpışma hasarı almaz.",
      activate: (car) => {
        const w = CAR_TYPES[car.carType].width;
        car.mass = car.mass * 3.5;
        car.isInvulnerable = true; // Koçbaşı esnasında toslamadan hasar yemez
        car.ramBumper = car.add([
          k.rect(10, CAR_TYPES[car.carType].height + 12, { radius: 2 }),
          k.pos(w / 2 + 5, 0),
          k.anchor("center"),
          k.color(255, 69, 0),
          k.opacity(0.85),
          k.z(1)
        ]);
      },
      deactivate: (car) => {
        car.mass = CAR_TYPES[car.carType].mass;
        car.isInvulnerable = false;
        if (car.ramBumper) {
          try { car.ramBumper.destroy(); } catch (e) {}
          car.ramBumper = null;
        }
      }
    },
    // --- MAĞAZA ALT BARI/YEDEKLER ---
    default: {
      name: "OFKE",
      icon: "💥",
      cooldown: 7,
      duration: 2.0,
      activate: (car) => {
        car.mass = car.mass * 3;
        const w = CAR_TYPES[car.carType].width;
        const h = CAR_TYPES[car.carType].height;
        const r = CAR_TYPES[car.carType].radius || 2;
        car.rageEffect = car.add([
          k.rect(w + 8, h + 8, { radius: r + 1 }),
          k.pos(0, 0),
          k.anchor("center"),
          k.color(255, 215, 0),
          k.opacity(0.5),
          k.z(1),
        ]);
      },
      deactivate: (car) => {
        car.mass = CAR_TYPES[car.carType].mass;
        if (car.rageEffect) {
          try { car.rageEffect.destroy(); } catch (e) {}
          car.rageEffect = null;
        }
      }
    },
    shockwave: {
      name: "SOK DALGASI",
      icon: "💥",
      cooldown: 7,
      duration: 0.5,
      activate: (car) => {
        const range = 160;
        const opponents = k.get("player").filter(other => other !== car);
        opponents.forEach(other => {
          const dist = car.pos.dist(other.pos);
          if (dist < range) {
            const dir = other.pos.sub(car.pos).unit();
            other.speed = -other.maxSpeed * 1.5;
            other.angle += k.choose([-45, 45]);
            k.shake(3.0);
          }
        });

        const shock = k.add([
          k.circle(0),
          k.pos(car.pos),
          k.color(255, 100, 0),
          k.opacity(0.8),
          k.outline(3, k.rgb(255, 255, 255)),
          k.anchor("center"),
        ]);
        shock.onUpdate(() => {
          shock.radius += k.dt() * 400;
          shock.opacity -= k.dt() * 2;
          if (shock.radius >= range) {
            shock.destroy();
          }
        });
      },
      deactivate: (car) => {}
    },
    ram: {
      name: "KOCBASI BARBAR",
      icon: "🐂",
      cooldown: 8,
      duration: 2.0,
      activate: (car) => {
        const w = CAR_TYPES[car.carType].width;
        car.mass = car.mass * 3.5;
        car.ramBumper = car.add([
          k.rect(10, CAR_TYPES[car.carType].height + 12, { radius: 2 }),
          k.pos(w / 2 + 5, 0),
          k.anchor("center"),
          k.color(255, 69, 0),
          k.opacity(0.8),
          k.z(1)
        ]);
      },
      deactivate: (car) => {
        car.mass = CAR_TYPES[car.carType].mass;
        if (car.ramBumper) {
          try { car.ramBumper.destroy(); } catch (e) {}
          car.ramBumper = null;
        }
      }
    }
  },

  TANK: {
    // --- GÖLGE SÜVARİ YETENEĞİ ---
    active_suspension: {
      name: "AKTİF SÜSPANSİYON",
      icon: "🧱",
      cooldown: 8,
      duration: 1.2,
      desc: "Aktif süspansiyon ile kendini yere sabitler. Hasar almaz ve gelen tüm darbe gücünü yansıtır.",
      activate: (car) => {
        car.isInvulnerable = true;
        car.isAnchored = true;
        car.mass = 99999;
        car.speed = 0;

        const w = CAR_TYPES[car.carType].width;
        const h = CAR_TYPES[car.carType].height;
        car.suspensionEffect = car.add([
          k.rect(w + 14, h + 14, { radius: 6 }),
          k.pos(0, 0),
          k.color(255, 140, 0), // Turuncu koruyucu alan
          k.opacity(0.45),
          k.anchor("center"),
          k.z(1),
        ]);
      },
      deactivate: (car) => {
        car.isInvulnerable = false;
        car.isAnchored = false;
        car.mass = CAR_TYPES[car.carType].mass;
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
      desc: "3 saniye boyunca reaktif zırhı açar. Alınan toslama hasarını yok sayar ve her toslamada 25 HP can yeniler.",
      activate: (car) => {
        const w = CAR_TYPES[car.carType].width;
        const h = CAR_TYPES[car.carType].height;
        car.reactiveArmorGlow = car.add([
          k.rect(w + 12, h + 12, { radius: 6 }),
          k.pos(0, 0),
          k.color(0, 255, 128), // Neon Greenish Teal
          k.opacity(0.4),
          k.anchor("center"),
          k.z(1),
        ]);
      },
      deactivate: (car) => {
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
      activate: (car) => {
        car.isInvulnerable = true;
        car.isAnchored = true;
        car.mass = 99999;
        car.speed = 0;
      },
      deactivate: (car) => {
        car.isInvulnerable = false;
        car.isAnchored = false;
        car.mass = CAR_TYPES[car.carType].mass;
      }
    },
    ironclad: {
      name: "ZIRHLI DUVAR",
      icon: "🧱",
      cooldown: 9,
      duration: 2.0,
      activate: (car) => {
        car.isInvulnerable = true;
        car.mass = car.mass * 5;
        car.scaleTo(1.4);
      },
      deactivate: (car) => {
        car.isInvulnerable = false;
        car.mass = CAR_TYPES[car.carType].mass;
        car.scaleTo(1.0);
      }
    },
    mine: {
      name: "PATLAYICI MAYIN",
      icon: "💣",
      cooldown: 7,
      duration: 0.1,
      activate: (car) => {
        const backOffset = CAR_TYPES[car.carType].width / 2 + 15;
        const rad = k.deg2rad(car.angle);
        const spawnPos = car.pos.sub(k.vec2(Math.cos(rad) * backOffset, Math.sin(rad) * backOffset));
        
        const mine = k.add([
          k.circle(10),
          k.pos(spawnPos),
          k.color(255, 30, 30),
          k.outline(2, k.rgb(255, 255, 255)),
          k.anchor("center"),
          k.area(),
          "mine",
          {
            owner: car,
            exploded: false
          }
        ]);

        mine.onUpdate(() => {
          mine.color = Math.floor(k.time() * 8) % 2 === 0 ? k.rgb(255, 30, 30) : k.rgb(50, 0, 0);
        });

        k.onCollide("player", mine, (player, m) => {
          if (m.exploded || player === m.owner) return;
          m.exploded = true;
          
          const damage = 35;
          player.hp = Math.max(0, player.hp - damage);
          
          const origColor = player.color;
          player.color = k.rgb(255, 255, 255);
          k.wait(0.2, () => {
            player.color = origColor;
          });

          const kbDir = player.pos.sub(m.pos).unit();
          player.speed = -player.maxSpeed * 1.2;
          player.angle += k.choose([-60, 60]);

          k.shake(4.0);
          spawnExplosion(m.pos, damage);
          m.destroy();
        });

        k.wait(8.0, () => {
          if (mine.exists()) mine.destroy();
        });
      },
      deactivate: () => {}
    }
  },

  // Drift sınıfı (Diğer mağaza yetenekleri uyumluluğu için tutulur)
  DRIFT: {
    default: {
      name: "TURBO DRIFT",
      icon: "🌀",
      cooldown: 5,
      duration: 1.5,
      activate: (car) => {
        car.turnSpeed = car.turnSpeed * 1.8;
      },
      deactivate: (car) => {
        car.turnSpeed = CAR_TYPES[car.carType].turnSpeed;
      }
    },
    nitro: {
      name: "NITRO GAZI",
      icon: "🔥",
      cooldown: 5,
      duration: 1.2,
      activate: (car) => {
        car.speed = car.maxSpeed * 2.0;
        car.nitroTimer = k.onUpdate(() => {
          if (!car.exists()) return;
          const backPos = car.pos.sub(k.vec2(Math.cos(car.angle * Math.PI / 180), Math.sin(car.angle * Math.PI / 180)).scale(20));
          const particle = k.add([
            k.circle(k.rand(3, 6)),
            k.pos(backPos),
            k.color(255, k.rand(50, 150), 0),
            k.opacity(0.8),
            k.anchor("center"),
          ]);
          particle.onUpdate(() => {
            particle.opacity -= k.dt() * 3;
            if (particle.opacity <= 0) particle.destroy();
          });
        });
      },
      deactivate: (car) => {
        if (car.nitroTimer) {
          car.nitroTimer.cancel();
          car.nitroTimer = null;
        }
      }
    },
    smoke: {
      name: "SIS BOMBASI",
      icon: "💨",
      cooldown: 8,
      duration: 2.5,
      activate: (car) => {
        car.smokeInterval = k.onUpdate(() => {
          if (!car.exists()) return;
          const backOffset = CAR_TYPES[car.carType].width / 2 + 10;
          const rad = k.deg2rad(car.angle);
          const spawnPos = car.pos.sub(k.vec2(Math.cos(rad) * backOffset, Math.sin(rad) * backOffset));
          
          const cloud = k.add([
            k.circle(k.rand(15, 25)),
            k.pos(spawnPos.add(k.rand(-10, 10), k.rand(-10, 10))),
            k.color(120, 125, 135),
            k.opacity(0.65),
            k.anchor("center"),
            k.area(),
            k.z(-2),
            "smokeCloud"
          ]);

          cloud.onUpdate(() => {
            cloud.opacity -= k.dt() * 0.5;
            cloud.radius += k.dt() * 8;
            if (cloud.opacity <= 0) {
              cloud.destroy();
            }
          });

          const range = 40;
          const opponents = k.get("player").filter(other => other !== car);
          opponents.forEach(other => {
            if (other.pos.dist(cloud.pos) < range) {
              other.speed = other.speed * 0.96;
            }
          });
        });
      },
      deactivate: (car) => {
        if (car.smokeInterval) {
          car.smokeInterval.cancel();
          car.smokeInterval = null;
        }
      }
    }
  }
};
