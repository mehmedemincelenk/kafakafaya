import { k } from "../kaplay.js";
import { addCar } from "../game/car.js";
import { setupCollisions } from "../game/collision.js";
import { spawnPowerup, setupPowerupCollisions, syncPowerups } from "../game/powerup.js";
import { myPlayer, isHost, getState, setState } from "playroomkit";
import { playroomPlayers } from "../multiplayer.js";
import { MAPS } from "../maps.js";
import { SKILLS } from "../skill.js";
import { setupHUD } from "../game/hud.js";
import { setupArena } from "../game/arena.js";
import { setupPauseMenu } from "../game/pause.js";
import { spawnExplosion } from "../utils.js";
import { spawnPortalPair, setupPortalCooldownUpdater } from "../game/portal.js";
import { store } from "../store.js";
import { CAR_TYPES } from "../config.js";

export function initGameScene() {
  k.scene("game", (localParams) => {
    k.gameOver = false;
    k.isGamePaused = false;
    let localClashWins = 0;

    // Mod, skorlar ve araç tiplerini bağlantı türüne göre belirle
    const gameMode = k.isMultiplayer ? (getState("gameMode") || "NORMAL") : (localParams?.gameMode || "NORMAL");
    const p1Score = k.isMultiplayer ? 0 : (localParams?.p1Score || 0);
    const p2Score = k.isMultiplayer ? 0 : (localParams?.p2Score || 0);
    const p1Type = localParams?.p1Type || "BARKAN";
    const p2Type = localParams?.p2Type || "BARKAN";
    const p2Joined = k.isMultiplayer ? true : (localParams?.p2Joined !== false);

    const p1Skin = localParams?.p1Skin || store.getSelectedSkin("p1", p1Type) || "default";
    const p2Skin = localParams?.p2Skin || (p2Joined ? store.getSelectedSkin("p2", p2Type) : "default");
    const p1Skill = localParams?.p1Skill || store.getSelectedSkill("p1", p1Type) || "default";
    const p2Skill = localParams?.p2Skill || (p2Joined ? store.getSelectedSkill("p2", p2Type) : "default");
    const p1Weapon = localParams?.p1Weapon || store.getSelectedWeapon("p1") || "mizrak";
    const p2Weapon = localParams?.p2Weapon || (p2Joined ? store.getSelectedWeapon("p2") : "mizrak");
    const p1Support = localParams?.p1Support || store.getSelectedSupport("p1") || "mini_iha";
    const p2Support = localParams?.p2Support || (p2Joined ? store.getSelectedSupport("p2") : "mini_iha");

    const modeNotice = k.add([
      k.text("KOMBAT ARENASI", { size: 10, font: "sans-serif", weight: "bold", letterSpacing: 2 }),
      k.pos(k.width() / 2, 60),
      k.anchor("center"),
      k.color(150, 155, 165),
    ]);
    k.wait(1.5, () => modeNotice.destroy());

    const pauseMenu = setupPauseMenu({
      p1Type,
      p2Type,
      gameMode,
    });

    // ESC Tuşu ile Oyunu Duraklatma (Pause)
    k.onKeyPress("escape", () => {
      if (k.gameOver) return;
      if (k.isMultiplayer && !isHost()) return; // Çok oyunculuda sadece Host duraklatabilir

      if (k.isMultiplayer) {
        const nextPaused = !getState("isGamePaused");
        setState("isGamePaused", nextPaused);
        if (nextPaused) {
          pauseMenu.show();
        } else {
          pauseMenu.hide();
        }
      } else {
        k.isGamePaused = !k.isGamePaused;
        if (k.isGamePaused) {
          pauseMenu.show();
        } else {
          pauseMenu.hide();
        }
      }
    });

    // Harita Tanımlarını Yükle (Rastgele Seçilir)
    let mapData;
    if (k.isMultiplayer) {
      if (isHost()) {
        const randomMap = k.choose(MAPS);
        setState("gameMap", randomMap.name);
        mapData = randomMap;
      } else {
        const mapName = getState("gameMap") || MAPS[0].name;
        mapData = MAPS.find(m => m.name === mapName) || MAPS[0];
      }
    } else {
      mapData = k.choose(MAPS);
    }

    // Arena ve Engellerin Çizilmesi
    setupArena(mapData);

    // Portalları Spawn Et (Sol ve Sağ kısımda simetrik olarak konumlandırıldı)
    spawnPortalPair(
      k.vec2(k.width() / 2 - 450, k.height() / 2),
      k.vec2(k.width() / 2 + 450, k.height() / 2)
    );
    setupPortalCooldownUpdater();

    // --- DİNAMİK ARAÇ OLUŞTURMA ---
    const cars = [];

    if (k.isMultiplayer) {
      const roomPlayers = playroomPlayers;
      let hostCarType = "BARKAN";
      if (roomPlayers.length > 0) {
        const host = roomPlayers.find(p => p.id === getState("hostId")) || roomPlayers[0];
        const hostSelectedIdx = host.getState("carTypeIdx") || 0;
        const options = Object.keys(CAR_TYPES);
        hostCarType = options[hostSelectedIdx] || "BARKAN";
      }

      roomPlayers.forEach((p, idx) => {
        let startPos;
        let startAngle;

        if (idx === 0) {
          startPos = k.vec2(180, k.height() / 2);
          startAngle = 0;
        } else if (idx === 1) {
          startPos = k.vec2(k.width() - 180, k.height() / 2);
          startAngle = 180;
        } else if (idx === 2) {
          startPos = k.vec2(k.width() / 2, 180);
          startAngle = 90;
        } else {
          startPos = k.vec2(k.width() / 2, k.height() - 180);
          startAngle = 270;
        }

        const options = Object.keys(CAR_TYPES);
        const carType = options[p.getState("carTypeIdx") || 0] || "BARKAN";

        const color = idx % 2 === 0 ? k.rgb(0, 140, 255) : k.rgb(255, 60, 60);
        const tag = idx % 2 === 0 ? "teamBlue" : "teamRed";

        const skinId = p.getState("skinId") || "default";
        const skillId = p.getState("skillId") || "default";

        const car = addCar({
          name: p.getProfile().name || `Oyuncu ${idx + 1}`,
          tag,
          color,
          startPos,
          startAngle,
          type: carType,
          playerInfo: p,
          skinId,
          skillId,
          selectedWeapon: p.getState("selectedWeapon") || "mizrak",
          selectedSupport: p.getState("selectedSupport") || "mini_iha",
        });

        if (p.id === myPlayer().id) {
          car.onClashWin = () => {
            localClashWins++;
          };
        }

        cars.push(car);
      });
    } else {
      // YEREL MOD ARAÇ OLUŞTURMA
      const finalP1Type = p1Type;
      const finalP2Type = p2Type;

      const p1 = addCar({
        name: "Oyuncu 1",
        tag: "player1",
        color: k.rgb(0, 140, 255),
        startPos: k.vec2(180, k.height() / 2),
        startAngle: 0,
        controls: {
          forward: "w",
          backward: "s",
          left: "a",
          right: "d",
          dash: "shift",
          skill: "q",
        },
        type: finalP1Type,
        skinId: p1Skin,
        skillId: p1Skill,
        selectedWeapon: p1Weapon,
        selectedSupport: p1Support,
      });

      p1.onClashWin = () => {
        localClashWins++;
      };

      const p2 = addCar({
        name: p2Joined ? "Oyuncu 2" : "Oyuncu 2 (BOT)",
        tag: "player2",
        color: k.rgb(255, 60, 60),
        startPos: k.vec2(k.width() - 180, k.height() / 2),
        startAngle: 180,
        controls: {
          forward: "up",
          backward: "down",
          left: "left",
          right: "right",
          dash: "enter",
          skill: "numpad0",
        },
        type: finalP2Type,
        skinId: p2Skin,
        skillId: p2Skill,
        selectedWeapon: p2Weapon,
        selectedSupport: p2Support,
      });

      p2.isBot = !p2Joined;

      if (p2.isBot) {
        p2.botDriveInput = { forward: false, backward: false, left: false, right: false };
        p2.botTriggerDashPress = false;
        p2.botTriggerSkillPress = false;
        p2.stuckTimer = 0;
        p2.reverseDuration = 0;

        p2.onUpdate(() => {
          if (k.gameOver || k.isGamePaused || p2.controlsLocked) {
            p2.botDriveInput = { forward: false, backward: false, left: false, right: false };
            p2.botTriggerDashPress = false;
            p2.botTriggerSkillPress = false;
            return;
          }

          const target = p1;
          if (!target || target.hp <= 0) {
            p2.botDriveInput = { forward: false, backward: false, left: false, right: false };
            return;
          }

          const toTarget = target.pos.sub(p2.pos);
          const dist = toTarget.len();
          const targetAngle = k.rad2deg(Math.atan2(toTarget.y, toTarget.x));
          let diff = targetAngle - p2.angle;
          diff = ((diff + 180) % 360);
          if (diff < 0) diff += 360;
          diff -= 180;

          // Reset inputs
          p2.botDriveInput = { forward: false, backward: false, left: false, right: false };
          p2.botTriggerDashPress = false;
          p2.botTriggerSkillPress = false;

          if (diff < -5) {
            p2.botDriveInput.left = true;
          } else if (diff > 5) {
            p2.botDriveInput.right = true;
          }

          if (Math.abs(diff) < 90) {
            p2.botDriveInput.forward = true;
          } else {
            p2.botDriveInput.backward = true;
          }

          // Stuck detection & recovery
          if (p2.speed < 15 && p2.botDriveInput.forward) {
            p2.stuckTimer += k.dt();
          } else {
            p2.stuckTimer = 0;
          }

          if (p2.stuckTimer > 0.8) {
            p2.reverseDuration = 0.6;
            p2.stuckTimer = 0;
          }

          if (p2.reverseDuration > 0) {
            p2.reverseDuration -= k.dt();
            p2.botDriveInput.forward = false;
            p2.botDriveInput.backward = true;
            if (p2.botDriveInput.left) {
              p2.botDriveInput.left = false;
              p2.botDriveInput.right = true;
            } else if (p2.botDriveInput.right) {
              p2.botDriveInput.right = false;
              p2.botDriveInput.left = true;
            }
          }

          // Skill/Dash triggers
          if (Math.abs(diff) < 25) {
            if (dist < 280 && p2.dashCooldownTimer <= 0) {
              p2.botTriggerDashPress = k.chance(0.12);
            }
            if (dist < 180 && p2.skillCooldownTimer <= 0) {
              p2.botTriggerSkillPress = k.chance(0.08);
            }
          }
        });
      }

      cars.push(p1);
      cars.push(p2);
    }

    // Raund Başı Geri Sayım ve Kontrol Kilidi
    cars.forEach(c => c.controlsLocked = true);

    const countdownText = k.add([
      k.text("3", { size: 48, font: "sans-serif", weight: "bold", letterSpacing: 2 }),
      k.pos(k.center()),
      k.anchor("center"),
      k.color(255, 70, 85),
    ]);

    k.wait(0.5, () => {
      countdownText.text = "2";
      k.wait(0.5, () => {
        countdownText.text = "1";
        k.wait(0.5, () => {
          countdownText.text = "BASLA!";
          countdownText.color = k.rgb(0, 240, 255);
          cars.forEach(c => c.controlsLocked = false);
          k.wait(0.4, () => {
            countdownText.destroy();
          });
        });
      });
    });

    // Skor Göstergesi (Üst siyah barda konumlandırıldı)
    const scoreText = k.add([
      k.text(k.isMultiplayer ? "MAVI 0 - 0 KIRMIZI" : `MAVI ${p1Score} - ${p2Score} KIRMIZI`, { size: 14, font: "sans-serif", weight: "bold", letterSpacing: 2 }),
      k.pos(k.width() / 2, 20),
      k.anchor("center"),
      k.color(220, 225, 235),
    ]);

    const timerText = k.add([
      k.text("01:30", { size: 11, font: "sans-serif", weight: "bold", letterSpacing: 1 }),
      k.pos(k.width() / 2, 42),
      k.anchor("center"),
      k.color(140, 145, 155),
      k.scale(1),
    ]);

    // Güvenli Alan (Sudden Death) Sınır Çizgisi ve Uyarı Metni
    const safeZoneBorder = k.add([
      k.rect(k.width() - 120, k.height() - 120, { radius: 10 }),
      k.pos(60, 60),
      k.color(0, 0, 0, 0),
      k.outline(2, k.rgb(0, 240, 255)), // Başlangıçta güvenli/mavi alan
      k.z(-8),
    ]);

    const zoneWarningText = k.add([
      k.text("", { size: 14, font: "sans-serif", weight: "bold", letterSpacing: 2 }),
      k.pos(k.width() / 2, 90),
      k.anchor("center"),
      k.color(255, 70, 85),
    ]);

    setupHUD(cars);

    let roundTimeLeft = 90; // 1.5 Dakika

    k.onUpdate(() => {
      if (k.gameOver) return;

      const controlsLocked = cars.some(c => c.controlsLocked);
      if (!controlsLocked && !k.isGamePaused) {
        if (k.isMultiplayer) {
          if (isHost()) {
            roundTimeLeft -= k.dt();
            if (roundTimeLeft <= 0) {
              roundTimeLeft = 0;
              triggerTimeOut();
            }
            setState("roundTime", roundTimeLeft);
          } else {
            roundTimeLeft = getState("roundTime") ?? 90;
          }
        } else {
          // Yerel Mod Geri Sayım
          roundTimeLeft -= k.dt();
          if (roundTimeLeft <= 0) {
            roundTimeLeft = 0;
            triggerTimeOut();
          }
        }
      }

      const mins = Math.floor(roundTimeLeft / 60);
      const secs = Math.floor(roundTimeLeft % 60);
      timerText.text = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

      // Son 30 Saniye Daralan Duvarlar Mantığı
      if (roundTimeLeft <= 30 && roundTimeLeft > 0) {
        zoneWarningText.text = "TEHLİKE: GÜVENLİ ALAN DARALIYOR!";
        
        const timeInSuddenDeath = Math.max(0, 30 - roundTimeLeft);
        // Sınır 60px'den başlayıp saniyede 8.5px daralarak ~315px'e kadar sıkışır
        const currentMargin = 60 + (timeInSuddenDeath * 8.5);

        safeZoneBorder.width = k.width() - 2 * currentMargin;
        safeZoneBorder.height = k.height() - 2 * currentMargin;
        safeZoneBorder.pos = k.vec2(currentMargin, currentMargin);

        // Kırmızı/neon yanıp sönen tehlike çizgisi
        const pulse = Math.sin(k.time() * 8) > 0;
        safeZoneBorder.outline.color = pulse ? k.rgb(255, 70, 85) : k.rgb(180, 20, 40);
        safeZoneBorder.outline.width = 3;

        // Alan dışı oyuncuları tespit et ve saniyede 20 hasar ver
        cars.forEach(car => {
          if (k.gameOver || car.controlsLocked) return;

          const isOutside = car.pos.x < currentMargin + 8 || 
                            car.pos.x > k.width() - currentMargin - 8 || 
                            car.pos.y < currentMargin + 8 || 
                            car.pos.y > k.height() - currentMargin - 8;

          if (isOutside) {
            // Can azaltımı (Sadece host veya yerel mod uygular)
            if (!k.isMultiplayer || isHost()) {
              car.hp = Math.max(0, car.hp - k.dt() * 20);
              if (car.hp <= 0) {
                checkGameOver();
              }
            }

            // Görsel hasar flaşı
            if (Math.sin(k.time() * 15) > 0) {
              car.color = k.rgb(255, 70, 85);
            } else {
              car.color = car.originalColor;
            }

            // Kıvılcım efektleri
            if (k.chance(0.25)) {
              spawnExplosion(car.pos, 2, k.rgb(255, 70, 85));
            }
          } else {
            // Güvenli alandaysa rengi geri al
            if (!car.collisionCooldown && car.color !== car.originalColor) {
              car.color = car.originalColor;
            }
          }
        });
      } else {
        zoneWarningText.text = "";
        safeZoneBorder.width = k.width() - 120;
        safeZoneBorder.height = k.height() - 120;
        safeZoneBorder.pos = k.vec2(60, 60);
        safeZoneBorder.outline.color = k.rgb(0, 240, 255);
        safeZoneBorder.outline.width = 2;

        // Olası renk kaymalarını temizle
        cars.forEach(car => {
          if (!car.collisionCooldown && car.color !== car.originalColor) {
            car.color = car.originalColor;
          }
        });
      }

      if (roundTimeLeft <= 10) {
        timerText.color = k.rgb(255, 60, 60);
        timerText.scaleTo(1 + Math.sin(k.time() * 10) * 0.1);
      } else {
        timerText.color = k.rgb(150, 150, 155);
        timerText.scaleTo(1);
      }
    });

    function triggerTimeOut() {
      k.gameOver = true;
      cars.forEach(c => { c.speed = 0; c.controlsLocked = true; });

      if (k.isMultiplayer) {
        if (!isHost()) return;
        setState("roundWinner", null);
        setState("roundOver", true);
      } else {
        k.shake(8);
        winnerText.scaleTo(0);
        winnerText.text = "SÜRE BİTTİ • BERABERE";
        winnerText.color = k.rgb(200, 200, 205);
        winnerText.hidden = false;
        k.wait(2.5, () => {
          pauseMenu.cancel();
          k.go("game", {
            p1Type,
            p2Type,
            gameMode,
            p1Score,
            p2Score,
            p2Joined,
            p1Skin,
            p2Skin,
            p1Skill,
            p2Skill,
            p1Weapon,
            p2Weapon,
            p1Support,
            p2Support,
          });
        });
      }
    }

    // Kazanan Yazısı (Dopaminerjik Yaylanma Efektli)
    const winnerText = k.add([
      k.text("", { size: 28, font: "sans-serif", weight: "bold", letterSpacing: 3 }),
      k.pos(k.center()),
      k.anchor("center"),
      k.color(220, 225, 235),
      k.scale(0),
    ]);
    winnerText.hidden = true;
    winnerText.onUpdate(() => {
      if (!winnerText.hidden) {
        winnerText.scaleTo(k.lerp(winnerText.scale.x, 1, k.dt() * 12));
      }
    });

    // Çarpışmalar ve Power-up kurulumu
    if (k.isMultiplayer) {
      if (isHost()) {
        setupCollisions(checkGameOver, gameMode);
        setupPowerupCollisions();
        k.loop(5, spawnPowerup);
      }
    } else {
      setupCollisions(checkGameOver, gameMode);
      setupPowerupCollisions();
      k.loop(5, spawnPowerup);
    }

    // Raund Sonu Kontrolü (Sadece Host veya Yerel Mod tetikler)
    function checkGameOver() {
      if (k.isMultiplayer) {
        if (!isHost()) return;

        const blueTeam = cars.filter((c, idx) => idx % 2 === 0);
        const redTeam = cars.filter((c, idx) => idx % 2 === 1);

        const blueAlive = blueTeam.some(c => c.hp > 0);
        const redAlive = redTeam.some(c => c.hp > 0);

        if (!blueAlive || !redAlive) {
          k.gameOver = true;
          cars.forEach(c => { c.speed = 0; c.controlsLocked = true; });

          let roundWinner = null;
          if (!blueAlive && !redAlive) {
            // Beraberlik
          } else if (!blueAlive) {
            roundWinner = 2;
            setState("redScore", (getState("redScore") || 0) + 1);
          } else {
            roundWinner = 1;
            setState("blueScore", (getState("blueScore") || 0) + 1);
          }

          k.shake(12);
          winnerText.scaleTo(0);

          setState("roundWinner", roundWinner);
          setState("roundOver", true);
        }
      } else {
        // YEREL MOD GAME OVER KONTROLÜ
        const p1 = cars[0];
        const p2 = cars[1];

        if (p1.hp <= 0 || p2.hp <= 0) {
          k.gameOver = true;
          cars.forEach(c => { c.speed = 0; c.controlsLocked = true; });

          let roundWinner = null;
          if (p1.hp <= 0 && p2.hp <= 0) {
            // Berabere
          } else if (p1.hp <= 0) {
            roundWinner = 2;
          } else {
            roundWinner = 1;
          }

          const nextP1Score = p1Score + (roundWinner === 1 ? 1 : 0);
          const nextP2Score = p2Score + (roundWinner === 2 ? 1 : 0);

          k.shake(12);
          winnerText.scaleTo(0);

          if (nextP1Score >= 3 || nextP2Score >= 3) {
            winnerText.text = nextP1Score >= 3 ? "🏆 MAVİ ŞAMPİYON! 🏆" : "🏆 KIRMIZI ŞAMPİYON! 🏆";
            winnerText.color = nextP1Score >= 3 ? k.rgb(0, 140, 255) : k.rgb(255, 60, 60);
            winnerText.hidden = false;

            // Yerel modda coin ekle ve profili güncelle
            store.addCoins("p1", 100);
            store.recordMatch("p1", nextP1Score >= 3 ? "win" : "loss", localClashWins);
            if (p2Joined) {
              store.addCoins("p2", 100);
              store.recordMatch("p2", nextP2Score >= 3 ? "win" : "loss", 0);
            }

            k.wait(3.5, () => {
              pauseMenu.cancel();
              k.go("menu");
            });
          } else {
            winnerText.text = roundWinner === 1 ? "MAVİ RAUND!" : roundWinner === 2 ? "KIRMIZI RAUND!" : "BERABERE";
            winnerText.color = roundWinner === 1 ? k.rgb(0, 140, 255) : roundWinner === 2 ? k.rgb(255, 60, 60) : k.rgb(255, 255, 255);
            winnerText.hidden = false;
          k.wait(2.5, () => {
            pauseMenu.cancel();
            k.go("game", {
              p1Type,
              p2Type,
              gameMode,
              p1Score: nextP1Score,
              p2Score: nextP2Score,
              p2Joined,
              p1Skin,
              p2Skin,
              p1Skill,
              p2Skill,
              p1Weapon,
              p2Weapon,
              p1Support,
              p2Support,
            });
          });
          }
        }
      }
    }

    // Playroom Eş Zamanlı Ağ Durum Takipçisi (Sadece Çevrimiçiyse Çalışır)
    let lastReloadTrigger = 0;
    if (k.isMultiplayer) {
      lastReloadTrigger = getState("gameReloadTrigger") || 0;
    }

    k.onUpdate(() => {
      if (!k.isMultiplayer) return;

      if (isHost()) {
        setState("hostId", myPlayer().id);
      }

      // 1. Skorları eşitle
      const blueScore = getState("blueScore") || 0;
      const redScore = getState("redScore") || 0;
      scoreText.text = `MAVİ ${blueScore} - ${redScore} KIRMIZI`;

      // Kopan oyuncuların arabalarını temizle
      for (let i = cars.length - 1; i >= 0; i--) {
        const car = cars[i];
        if (car.playerInfo && !playroomPlayers.some(p => p.id === car.playerInfo.id)) {
          spawnExplosion(car.pos, 20, car.color);
          car.destroy();
          cars.splice(i, 1);
          if (isHost()) {
            checkGameOver();
          }
        }
      }

      // 2. Powerup'ları senkronize et
      syncPowerups();

      // 3. Duraklatma (Pause) durumunu eşitle
      const paused = getState("isGamePaused") || false;
      if (k.isGamePaused !== paused) {
        k.isGamePaused = paused;
        if (paused) {
          pauseMenu.show();
        } else {
          pauseMenu.hide();
        }
      }

      // 4. Raund sonu ekranını yönet
      if (getState("roundOver") && !k.gameOver) {
        k.gameOver = true;
        cars.forEach(c => { c.speed = 0; c.controlsLocked = true; });

        const winner = getState("roundWinner");
        const nextBlue = getState("blueScore") || 0;
        const nextRed = getState("redScore") || 0;

        winnerText.scaleTo(0);

        if (nextBlue >= 3 || nextRed >= 3) {
          winnerText.text = nextBlue >= 3 ? "🏆 MAVİ TAKIM ŞAMPİYON! 🏆" : "🏆 KIRMIZI TAKIM ŞAMPİYON! 🏆";
          winnerText.color = nextBlue >= 3 ? k.rgb(0, 140, 255) : k.rgb(255, 60, 60);
          winnerText.hidden = false;

          // Çevrimiçi modda yerel oyuncunun takımına göre coin ekle ve profili güncelle
          const myIndex = playroomPlayers.findIndex(p => p.id === myPlayer().id);
          if (myIndex !== -1) {
            const isBlueTeam = myIndex % 2 === 0;
            const blueWon = nextBlue >= 3;
            const redWon = nextRed >= 3;

            let matchResult = "draw";
            if ((isBlueTeam && blueWon) || (!isBlueTeam && redWon)) {
              matchResult = "win";
              store.addCoins("p1", 100);
            } else if ((isBlueTeam && redWon) || (!isBlueTeam && blueWon)) {
              matchResult = "loss";
              store.addCoins("p1", 30);
            } else {
              store.addCoins("p1", 50);
            }
            store.recordMatch("p1", matchResult, localClashWins);
          }

          k.wait(4.0, () => {
            if (isHost()) {
              pauseMenu.cancel();
              setState("blueScore", 0);
              setState("redScore", 0);
              setState("roundOver", false);
              setState("gameState", "lobby");
              setState("menuState", "MODE_SELECT");
              playroomPlayers.forEach(p => p.setState("ready", false));
            }
          });
        } else {
          winnerText.text = winner === 1 ? "MAVİ RAUND!" : winner === 2 ? "KIRMIZI RAUND!" : "BERABERE";
          winnerText.color = winner === 1 ? k.rgb(0, 140, 255) : winner === 2 ? k.rgb(255, 60, 60) : k.rgb(255, 255, 255);
          winnerText.hidden = false;

          k.wait(2.5, () => {
            if (isHost()) {
              pauseMenu.cancel();
              setState("roundOver", false);
              setState("roundWinner", null);
              setState("gameReloadTrigger", (getState("gameReloadTrigger") || 0) + 1);
            }
          });
        }
      }

      // 5. Yeniden başlama/sonraki raunt tetikleyicisi
      const currentTrigger = getState("gameReloadTrigger") || 0;
      if (currentTrigger !== lastReloadTrigger) {
        lastReloadTrigger = currentTrigger;
        pauseMenu.cancel();
        k.go("game");
      }

      // 6. Ana menüye dönme tetikleyicisi
      if (getState("gameState") === "lobby") {
        pauseMenu.cancel();
        k.go("menu");
      }
    });
  });
}
