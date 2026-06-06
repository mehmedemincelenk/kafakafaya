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
        // Decoy lives independently but we clear the reference
        car.decoyRef = null;
      }
    },

    // --- ASLAN YETENEĞİ ---
    gnss_jammer: {
      name: "SARP-L KULESİ",
      icon: "🔫",
      cooldown: 8,
      duration: 3.0,
      desc: "7.62 mm SARP-L kulesini aktif eder. 300px menzildeki rakibe otonom olarak seri ateş açar (Mermi başı 12 Hasar).",
      activate: (car) => {
        // Render physical turret on top of car
        car.sarpLTurret = car.add([
          k.circle(6),
          k.color(60, 60, 65),
          k.pos(0, 0),
          k.anchor("center"),
          k.z(2)
        ]);
        car.sarpLTurret.add([
          k.rect(12, 3),
          k.color(30, 30, 32),
          k.pos(3, 0),
          k.anchor("left"),
          k.z(1)
        ]);

        const target = k.get("player").find(p => p.carTag !== car.carTag);
        let fireCooldown = 0;

        car.sarpLLoop = car.onUpdate(() => {
          if (!target || !target.exists()) return;
          
          // Track target visually
          const angleToTarget = k.vec2(target.pos).sub(car.pos).angle();
          car.sarpLTurret.angle = angleToTarget - car.angle;

          fireCooldown -= k.dt();
          if (fireCooldown <= 0) {
            const dist = car.pos.dist(target.pos);
            if (dist <= 300) {
              fireCooldown = 0.4;
              
              const bulletRad = k.deg2rad(angleToTarget);
              const bStart = car.pos.add(k.vec2(Math.cos(bulletRad) * 20, Math.sin(bulletRad) * 20));
              
              const bullet = k.add([
                k.rect(6, 2),
                k.pos(bStart),
                k.rotate(angleToTarget),
                k.color(255, 215, 0),
                k.area(),
                k.anchor("center"),
                "sarp_bullet",
                {
                  speed: 650,
                  damage: 12,
                  ownerTag: car.carTag
                }
              ]);

              bullet.onUpdate(() => {
                bullet.move(Math.cos(bulletRad) * bullet.speed, Math.sin(bulletRad) * bullet.speed);
                if (bullet.pos.x < 0 || bullet.pos.x > k.width() || bullet.pos.y < 0 || bullet.pos.y > k.height()) {
                  bullet.destroy();
                }
              });

              bullet.onCollide("player", (other) => {
                if (other.carTag !== bullet.ownerTag) {
                  inflictDamage(other, bullet.damage);
                  spawnExplosion(bullet.pos, 6, k.rgb(255, 215, 0));
                  bullet.destroy();
                }
              });
            }
          }
        });
      },
      deactivate: (car) => {
        if (car.sarpLTurret) {
          try { car.sarpLTurret.destroy(); } catch (e) {}
          car.sarpLTurret = null;
        }
        if (car.sarpLLoop) {
          try { car.sarpLLoop.cancel(); } catch (e) {}
          car.sarpLLoop = null;
        }
      }
    },

    // --- KAPGAN YETENEĞİ ---
    ghost: {
      name: "30MM AĞIR TOP",
      icon: "💥",
      cooldown: 7,
      duration: 0.1,
      desc: "Öne doğru yüksek hızlı 30mm ağır top mermisi (75 Hasar, Alan Etkili) ateşler. Fırlatma anında araç geriye doğru tepme (Recoil) yaşar.",
      activate: (car) => {
        const rad = k.deg2rad(car.angle);
        const startPos = car.pos.add(k.vec2(Math.cos(rad) * 35, Math.sin(rad) * 35));
        
        // Fire cannon shell
        const shell = k.add([
          k.rect(14, 5),
          k.pos(startPos),
          k.rotate(car.angle),
          k.color(200, 80, 40),
          k.area(),
          k.anchor("center"),
          "heavy_shell",
          {
            speed: 780,
            damage: 75,
            explosionRadius: 60,
            ownerTag: car.carTag
          }
        ]);
        
        // Spawn smoke trail
        shell.onUpdate(() => {
          shell.move(Math.cos(rad) * shell.speed, Math.sin(rad) * shell.speed);
          if (k.chance(0.55)) {
            const smoke = k.add([
              k.circle(k.rand(2, 4.5)),
              k.pos(shell.pos.sub(k.vec2(Math.cos(rad) * 10, Math.sin(rad) * 10))),
              k.color(255, 120, 0),
              k.opacity(0.8),
              k.anchor("center"),
              k.z(-1)
            ]);
            smoke.onUpdate(() => {
              smoke.opacity -= k.dt() * 4;
              if (smoke.opacity <= 0) smoke.destroy();
            });
          }
          if (shell.pos.x < 0 || shell.pos.x > k.width() || shell.pos.y < 0 || shell.pos.y > k.height()) {
            shell.destroy();
          }
        });

        const triggerExplosion = (pos) => {
          spawnExplosion(pos, 35, k.rgb(255, 100, 0));
          // Area of effect damage
          k.get("player").forEach(p => {
            if (p.carTag !== car.carTag && p.pos.dist(pos) <= 65) {
              inflictDamage(p, 75);
            }
          });
        };

        shell.onCollide("player", (other) => {
          if (other.carTag !== shell.ownerTag) {
            triggerExplosion(shell.pos);
            shell.destroy();
          }
        });

        // Recoil push
        car.speed = -car.maxSpeed * 0.75;
      },
      deactivate: () => {}
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
      name: "SÜRÜ OTONOMİSİ",
      icon: "🦟",
      cooldown: 9,
      duration: 3.0,
      desc: "Hedefe kilitlenen 3 adet otonom mini İHA fırlatır. Her İHA çarptığında 25 hasar verir (Toplam 75 Hasar).",
      activate: (car) => {
        const target = k.get("player").find(p => p.carTag !== car.carTag);
        if (!target) return;

        for (let i = 0; i < 3; i++) {
          k.wait(i * 0.22, () => {
            if (!car.exists()) return;
            const angleOffset = (i - 1) * 25; // spread offset
            const spawnRad = k.deg2rad(car.angle + angleOffset);
            const startPos = car.pos.add(k.vec2(Math.cos(spawnRad) * 22, Math.sin(spawnRad) * 22));
            
            const drone = k.add([
              k.rect(10, 3),
              k.pos(startPos),
              k.rotate(car.angle + angleOffset),
              k.color(100, 200, 255),
              k.area(),
              k.anchor("center"),
              "swarm_drone",
              {
                speed: 420,
                turnSpeed: 210,
                damage: 25,
                target,
                ownerTag: car.carTag,
                lifeTime: 4.0
              }
            ]);

            // Add visual rotor wing block
            drone.add([
              k.rect(2, 8),
              k.color(80, 180, 230),
              k.anchor("center")
            ]);

            drone.onUpdate(() => {
              drone.lifeTime -= k.dt();
              if (drone.lifeTime <= 0) {
                spawnExplosion(drone.pos, 8, k.rgb(0, 160, 255));
                drone.destroy();
                return;
              }
              if (drone.target && drone.target.exists()) {
                const angleToTarget = k.vec2(drone.target.pos).sub(drone.pos).angle();
                let diff = angleToTarget - drone.angle;
                while (diff < -180) diff += 360;
                while (diff > 180) diff -= 360;
                drone.angle += diff * k.dt() * 4.6;
              }
              const rad = k.deg2rad(drone.angle);
              drone.move(Math.cos(rad) * drone.speed, Math.sin(rad) * drone.speed);
            });

            drone.onCollide("player", (other) => {
              if (other.carTag !== drone.ownerTag) {
                inflictDamage(other, drone.damage);
                spawnExplosion(drone.pos, 16, k.rgb(0, 160, 255));
                drone.destroy();
              }
            });
          });
        }
      },
      deactivate: () => {}
    },

    // --- TUNGA YETENEĞİ ---
    sarp_ram: {
      name: "SARP DUAL BOMBARDIMANI",
      icon: "🚀",
      cooldown: 10,
      duration: 2.5,
      desc: "SARP Dual kulesiyle düşmana 2.5 saniye boyunca roket (20 Alan Hasarı) ve makineli tüfek (7 Hasar) yağdırır.",
      activate: (car) => {
        // Spawns big dual weapon station on Tunga
        car.sarpDualTurret = car.add([
          k.circle(8),
          k.color(55, 55, 58),
          k.pos(0, 0),
          k.anchor("center"),
          k.z(2)
        ]);
        car.sarpDualTurret.add([
          k.rect(14, 3),
          k.color(25, 25, 28),
          k.pos(4, -3.5),
          k.anchor("left"),
          k.z(1)
        ]);
        car.sarpDualTurret.add([
          k.rect(14, 3),
          k.color(25, 25, 28),
          k.pos(4, 3.5),
          k.anchor("left"),
          k.z(1)
        ]);

        const target = k.get("player").find(p => p.carTag !== car.carTag);
        let bulletCooldown = 0;
        let rocketCooldown = 0;

        car.sarpDualLoop = car.onUpdate(() => {
          if (!target || !target.exists()) return;

          const angleToTarget = k.vec2(target.pos).sub(car.pos).angle();
          car.sarpDualTurret.angle = angleToTarget - car.angle;

          bulletCooldown -= k.dt();
          rocketCooldown -= k.dt();

          // Fire machine gun bullets
          if (bulletCooldown <= 0) {
            bulletCooldown = 0.22;
            const bAngle = angleToTarget + k.rand(-6, 6);
            const bRad = k.deg2rad(bAngle);
            const bStart = car.pos.add(k.vec2(Math.cos(bRad) * 24, Math.sin(bRad) * 24));
            
            const bullet = k.add([
              k.rect(5, 1.5),
              k.pos(bStart),
              k.rotate(bAngle),
              k.color(255, 190, 0),
              k.area(),
              k.anchor("center"),
              "dual_bullet",
              {
                speed: 680,
                damage: 7,
                ownerTag: car.carTag
              }
            ]);
            
            bullet.onUpdate(() => {
              bullet.move(Math.cos(bRad) * bullet.speed, Math.sin(bRad) * bullet.speed);
              if (bullet.pos.x < 0 || bullet.pos.x > k.width() || bullet.pos.y < 0 || bullet.pos.y > k.height()) {
                bullet.destroy();
              }
            });

            bullet.onCollide("player", (other) => {
              if (other.carTag !== bullet.ownerTag) {
                inflictDamage(other, bullet.damage);
                bullet.destroy();
              }
            });
          }

          // Fire mini rockets
          if (rocketCooldown <= 0) {
            rocketCooldown = 0.65;
            const rRad = k.deg2rad(angleToTarget);
            const rStart = car.pos.add(k.vec2(Math.cos(rRad) * 24, Math.sin(rRad) * 24));
            
            const rocket = k.add([
              k.rect(9, 3),
              k.pos(rStart),
              k.rotate(angleToTarget),
              k.color(255, 75, 0),
              k.area(),
              k.anchor("center"),
              "dual_rocket",
              {
                speed: 460,
                turnSpeed: 110,
                damage: 20,
                target,
                ownerTag: car.carTag,
                lifeTime: 3.0
              }
            ]);

            rocket.onUpdate(() => {
              rocket.lifeTime -= k.dt();
              if (rocket.lifeTime <= 0) {
                spawnExplosion(rocket.pos, 12, k.rgb(255, 75, 0));
                rocket.destroy();
                return;
              }
              if (rocket.target && rocket.target.exists()) {
                const angleTo = k.vec2(rocket.target.pos).sub(rocket.pos).angle();
                let diff = angleTo - rocket.angle;
                while (diff < -180) diff += 360;
                while (diff > 180) diff -= 360;
                rocket.angle += diff * k.dt() * 3.2;
              }
              const finalRad = k.deg2rad(rocket.angle);
              rocket.move(Math.cos(finalRad) * rocket.speed, Math.sin(finalRad) * rocket.speed);
            });

            rocket.onCollide("player", (other) => {
              if (other.carTag !== rocket.ownerTag) {
                inflictDamage(other, rocket.damage);
                spawnExplosion(rocket.pos, 18, k.rgb(255, 75, 0));
                rocket.destroy();
              }
            });
          }
        });
      },
      deactivate: (car) => {
        if (car.sarpDualTurret) {
          try { car.sarpDualTurret.destroy(); } catch (e) {}
          car.sarpDualTurret = null;
        }
        if (car.sarpDualLoop) {
          try { car.sarpDualLoop.cancel(); } catch (e) {}
          car.sarpDualLoop = null;
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
      name: "SABER-25 OTOMATİK TOPU",
      icon: "⚡",
      cooldown: 8,
      duration: 0.5,
      desc: "Düşmana doğru hızlıca 3 adet 25mm ağır autocannon mermisi (Mermi başı 30 Hasar) ateşler.",
      activate: (car) => {
        // Rapid fire of 3 shells
        for (let i = 0; i < 3; i++) {
          k.wait(i * 0.14, () => {
            if (!car.exists()) return;
            const rad = k.deg2rad(car.angle);
            const startPos = car.pos.add(k.vec2(Math.cos(rad) * 42, Math.sin(rad) * 42));
            
            const shell = k.add([
              k.rect(12, 4),
              k.pos(startPos),
              k.rotate(car.angle + k.rand(-2.5, 2.5)),
              k.color(240, 160, 40),
              k.area(),
              k.anchor("center"),
              "autocannon_shell",
              {
                speed: 720,
                damage: 30,
                ownerTag: car.carTag
              }
            ]);

            shell.onUpdate(() => {
              shell.move(Math.cos(k.deg2rad(shell.angle)) * shell.speed, Math.sin(k.deg2rad(shell.angle)) * shell.speed);
              if (shell.pos.x < 0 || shell.pos.x > k.width() || shell.pos.y < 0 || shell.pos.y > k.height()) {
                shell.destroy();
              }
            });

            shell.onCollide("player", (other) => {
              if (other.carTag !== shell.ownerTag) {
                inflictDamage(other, shell.damage);
                spawnExplosion(shell.pos, 16, k.rgb(240, 160, 40));
                shell.destroy();
              }
            });

            k.shake(2.5);
          });
        }
      },
      deactivate: () => {}
    },

    // --- ALPAR YETENEĞİ ---
    tactical_repair: {
      name: "OMTAS TANKSAVAR FÜZESİ",
      icon: "🎯",
      cooldown: 11,
      duration: 1.0,
      desc: "Kanatlardan hedefe kilitlenen 2 adet ağır OMTAS tanksavar füzesi (Füze başı 45 Hasar) fırlatır.",
      activate: (car) => {
        const target = k.get("player").find(p => p.carTag !== car.carTag);
        if (!target) return;

        const sideAngles = [-95, 95];
        sideAngles.forEach(offsetAngle => {
          const launchAngle = car.angle + offsetAngle;
          const launchRad = k.deg2rad(launchAngle);
          const startPos = car.pos.add(k.vec2(Math.cos(launchRad) * 22, Math.sin(launchRad) * 22));

          const missile = k.add([
            k.rect(15, 5),
            k.pos(startPos),
            k.rotate(launchAngle),
            k.color(225, 45, 45),
            k.area(),
            k.anchor("center"),
            "omtas_missile",
            {
              speed: 460,
              turnSpeed: 165,
              damage: 45,
              target,
              ownerTag: car.carTag,
              lifeTime: 3.5,
              lockDelay: 0.35
            }
          ]);

          missile.onUpdate(() => {
            missile.lifeTime -= k.dt();
            if (missile.lifeTime <= 0) {
              spawnExplosion(missile.pos, 20, k.rgb(255, 50, 50));
              missile.destroy();
              return;
            }

            missile.lockDelay -= k.dt();
            if (missile.lockDelay <= 0 && missile.target && missile.target.exists()) {
              const angleToTarget = k.vec2(missile.target.pos).sub(missile.pos).angle();
              let diff = angleToTarget - missile.angle;
              while (diff < -180) diff += 360;
              while (diff > 180) diff -= 360;
              missile.angle += diff * k.dt() * 5.2; // tracking turns
            }

            const currentRad = k.deg2rad(missile.angle);
            missile.move(Math.cos(currentRad) * missile.speed, Math.sin(currentRad) * missile.speed);

            if (k.chance(0.6)) {
              const smoke = k.add([
                k.circle(k.rand(2.5, 4.5)),
                k.pos(missile.pos.sub(k.vec2(Math.cos(currentRad) * 10, Math.sin(currentRad) * 10))),
                k.color(225, 50, 50),
                k.opacity(0.85),
                k.anchor("center"),
                k.z(-1)
              ]);
              smoke.onUpdate(() => {
                smoke.opacity -= k.dt() * 3.5;
                if (smoke.opacity <= 0) smoke.destroy();
              });
            }
          });

          missile.onCollide("player", (other) => {
            if (other.carTag !== missile.ownerTag) {
              inflictDamage(other, missile.damage);
              spawnExplosion(missile.pos, 25, k.rgb(255, 50, 50));
              missile.destroy();
            }
          });
        });
      },
      deactivate: () => {}
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
