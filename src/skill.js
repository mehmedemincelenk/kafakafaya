import { k } from "./kaplay.js";
import { CAR_TYPES } from "./config.js";

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
        const w = (CAR_TYPES[car.carType]?.width || 48);
        const h = (CAR_TYPES[car.carType]?.height || 28);
        // İçi boş, neon mavi ince dış çerçeve (Premium Kalkan Görünümü)
        car.kineticEffect = car.add([
          k.rect(w + 8, h + 8, { radius: 4, fill: false }),
          k.outline(2.5, k.rgb(0, 255, 255)),
          k.pos(0, 0),
          k.anchor("center"),
          k.z(1),
        ]);
        car.kineticEffect.onUpdate(() => {
          if (car.kineticEffect) {
            car.kineticEffect.opacity = 0.4 + Math.sin(k.time() * 10) * 0.2;
          }
        });
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
      cooldown: 8,
      duration: 2.5,
      desc: "2.5 saniye boyunca elektro-manyetik tamponları açar. Bu sürede toslanan rakibin kontrollerini 1 saniyeliğine kilitler.",
      activate: (car) => {
        const w = (CAR_TYPES[car.carType]?.width || 48);
        const h = (CAR_TYPES[car.carType]?.height || 28);
        // İçi boş, neon altın sarısı dış çerçeve
        car.shockEffect = car.add([
          k.rect(w + 8, h + 8, { radius: 4, fill: false }),
          k.outline(2.5, k.rgb(255, 215, 0)),
          k.pos(0, 0),
          k.anchor("center"),
          k.z(1),
        ]);
        car.shockEffect.onUpdate(() => {
          if (car.shockEffect) {
            car.shockEffect.opacity = 0.45 + Math.sin(k.time() * 12) * 0.2;
          }
        });
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
      duration: 2.5,
      desc: "2.5 saniye boyunca hayalet moduna geçerek hızlanır ve rakiplerin içinden geçer. Çıkışta 1.5 saniye boyunca ilk toslaması %35 fazla hasar verir.",
      activate: (car) => {
        car.isGhost = true;
        car.opacity = 0.35;

        // Hayalet modundayken arkasında gölge izleri bırakma animasyonu
        car.ghostTrailLoop = car.onUpdate(() => {
          if (k.chance(0.25)) {
            const w = CAR_TYPES[car.carType]?.width || 58;
            const h = CAR_TYPES[car.carType]?.height || 38;
            const r = CAR_TYPES[car.carType]?.radius || 6;
            const trail = k.add([
              k.rect(w, h, { radius: r, fill: false }),
              k.outline(1.5, k.rgb(120, 120, 255)),
              k.pos(car.pos),
              k.rotate(car.angle),
              k.opacity(0.35),
              k.anchor("center"),
              k.z(car.z - 1),
            ]);
            trail.onUpdate(() => {
              trail.opacity -= k.dt() * 1.5;
              if (trail.opacity <= 0) {
                trail.destroy();
              }
            });
          }
        });
      },
      deactivate: (car) => {
        car.isGhost = false;
        car.opacity = 1.0;
        car.ghostDamageBoostTimer = 1.5; // 1.5 saniye içinde vurursa %35 fazla hasar

        if (car.ghostTrailLoop) {
          try { car.ghostTrailLoop.cancel(); } catch (e) {}
          car.ghostTrailLoop = null;
        }
        
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
    // --- BARKAN 2 YAYGIN YETENEĞİ ---
    swarm_mark: {
      name: "ZIRH KIRICI",
      icon: "💥",
      cooldown: 8,
      duration: 3.0,
      desc: "3 saniye boyunca toslama hasarını %30 artırır ve araba kütlesini 1.5 katına çıkarır. Artan kütle sebebiyle direksiyon kabiliyeti %15 azalır.",
      activate: (car) => {
        const baseMass = CAR_TYPES[car.carType]?.mass || 1.3;
        car.mass = baseMass * 1.5;
        const w = (CAR_TYPES[car.carType]?.width || 50);
        const h = (CAR_TYPES[car.carType]?.height || 30);
        // İçi boş, neon turuncu dış çerçeve
        car.swarmEffect = car.add([
          k.rect(w + 10, h + 10, { radius: 4, fill: false }),
          k.outline(2.5, k.rgb(255, 120, 0)),
          k.pos(0, 0),
          k.anchor("center"),
          k.z(1),
        ]);
        car.swarmEffect.onUpdate(() => {
          if (car.swarmEffect) {
            car.swarmEffect.opacity = 0.45 + Math.cos(k.time() * 8) * 0.25;
          }
        });
      },
      deactivate: (car) => {
        car.mass = CAR_TYPES[car.carType]?.mass || 1.3;
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
      cooldown: 10,
      duration: 2.5,
      desc: "2.5 saniye boyunca toslama kütlesini 2.5 katına çıkarır ve çarpışma hasarı almaz. Ağır koçbaşı yüzünden ivmelenmesi %40, direksiyon kabiliyeti %35 azalır.",
      activate: (car) => {
        const w = (CAR_TYPES[car.carType]?.width || 58);
        const h = (CAR_TYPES[car.carType]?.height || 38);
        const baseMass = CAR_TYPES[car.carType]?.mass || 1.8;
        car.mass = baseMass * 2.5;
        car.isInvulnerable = true; // Koçbaşı esnasında toslamadan hasar yemez
        
        car.ramBumper = car.add([
          k.rect(10, h + 12, { radius: 2 }),
          k.pos(w / 2 + 5, 0),
          k.anchor("center"),
          k.color(255, 69, 0),
          k.opacity(0.85),
          k.z(1)
        ]);
        car.ramBumper.onUpdate(() => {
          if (car.ramBumper) {
            car.ramBumper.opacity = 0.65 + Math.sin(k.time() * 14) * 0.2;
          }
        });

        // İçi boş, neon koçbaşı aurası
        car.ramAura = car.add([
          k.rect(w + 10, h + 10, { radius: 6, fill: false }),
          k.outline(2.5, k.rgb(255, 69, 0)),
          k.pos(0, 0),
          k.anchor("center"),
          k.z(1)
        ]);
        car.ramAura.onUpdate(() => {
          if (car.ramAura) {
            car.ramAura.opacity = 0.3 + Math.sin(k.time() * 10) * 0.15;
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
        // İçi boş, altın sarısı öfke aurası
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
      desc: "1.2 saniye boyunca kendini yere sabitler. Alınan toslama hasarını yok sayar, toslayan rakibi püskürterek hasar yansıtır.",
      activate: (car) => {
        car.isInvulnerable = true;
        car.isAnchored = true;
        car.mass = 99999;
        car.speed = 0;

        const w = (CAR_TYPES[car.carType]?.width || 76);
        const h = (CAR_TYPES[car.carType]?.height || 52);
        // İçi boş, kalın neon turuncu koruyucu alan
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
      desc: "3 saniye boyunca reaktif zırhı açar. Alınan toslama hasarını yok sayar. Süresince toslamalarla 20 HP can yeniler (En fazla 2 kere).",
      activate: (car) => {
        car.reactiveHealsLeft = 2; // Can yenileme limiti
        const w = (CAR_TYPES[car.carType]?.width || 78);
        const h = (CAR_TYPES[car.carType]?.height || 54);
        // İçi boş, neon yeşil reaktif zırh aurası
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
        // İçi boş, demir grisi dış çerçeve
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
