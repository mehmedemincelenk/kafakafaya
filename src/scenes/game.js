import { k } from "../kaplay.js";
import { addCar } from "../car.js";
import { setupCollisions } from "../collision.js";
import { spawnPowerup, setupPowerupCollisions, syncPowerups } from "../powerup.js";
import { myPlayer, isHost, getState, setState } from "playroomkit";
import { playroomPlayers } from "../multiplayer.js";
import { MAPS } from "../maps.js";
import { SKILLS } from "../skill.js";
import { setupHUD } from "../hud.js";
import { setupArena } from "../arena.js";
import { setupPauseMenu } from "../pause.js";

export function initGameScene() {
  k.scene("game", (localParams) => {
    k.gameOver = false;
    k.isGamePaused = false;

    // Mod, skorlar ve araç tiplerini bağlantı türüne göre belirle
    const gameMode = k.isMultiplayer ? (getState("gameMode") || "NORMAL") : (localParams?.gameMode || "NORMAL");
    const p1Score = k.isMultiplayer ? 0 : (localParams?.p1Score || 0);
    const p2Score = k.isMultiplayer ? 0 : (localParams?.p2Score || 0);
    const p1Type = localParams?.p1Type || "DENGELI";
    const p2Type = localParams?.p2Type || "DENGELI";

    if (gameMode === "KAFA_KAFAYA") {
      const modeNotice = k.add([
        k.text("KAFA KAFAYA MODU", { size: 12, font: "sans-serif", weight: "bold", letterSpacing: 1 }),
        k.pos(k.width() / 2, 60),
        k.anchor("center"),
        k.color(255, 215, 0),
      ]);
      k.wait(1.5, () => modeNotice.destroy());
    } else {
      const modeNotice = k.add([
        k.text("MOMENTUM SAVASI", { size: 12, font: "sans-serif", weight: "bold", letterSpacing: 1 }),
        k.pos(k.width() / 2, 60),
        k.anchor("center"),
        k.color(150, 150, 155),
      ]);
      k.wait(1.5, () => modeNotice.destroy());
    }

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

    // Harita Tanımlarını Yükle
    const mapName = k.isMultiplayer ? (getState("gameMap") || "SADE") : (k.selectedMapName || "SADE");
    const mapData = MAPS.find(m => m.name === mapName) || MAPS[0];

    // Arena ve Engellerin Çizilmesi
    setupArena(mapData);

    // --- DİNAMİK ARAÇ OLUŞTURMA ---
    const cars = [];

    if (k.isMultiplayer) {
      const roomPlayers = playroomPlayers;
      let hostCarType = "DENGELI";
      if (roomPlayers.length > 0) {
        const host = roomPlayers.find(p => p.id === getState("hostId")) || roomPlayers[0];
        const hostSelectedIdx = host.getState("carTypeIdx") || 0;
        const options = ["DENGELI", "HIPHIZLI", "GUCLU", "TANK", "DRIFT"];
        hostCarType = options[hostSelectedIdx];
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

        const options = ["DENGELI", "HIPHIZLI", "GUCLU", "TANK", "DRIFT"];
        const carType = gameMode === "KAFA_KAFAYA" ? hostCarType : options[p.getState("carTypeIdx") || 0];

        const color = idx % 2 === 0 ? k.rgb(0, 140, 255) : k.rgb(255, 60, 60);
        const tag = idx % 2 === 0 ? "teamBlue" : "teamRed";

        const car = addCar({
          name: p.getProfile().name || `Oyuncu ${idx + 1}`,
          tag,
          color,
          startPos,
          startAngle,
          type: carType,
          playerInfo: p,
        });

        cars.push(car);
      });
    } else {
      // YEREL MOD ARAÇ OLUŞTURMA
      let finalP1Type = p1Type;
      let finalP2Type = p2Type;

      if (gameMode === "KAFA_KAFAYA") {
        if (p1Type !== p2Type) {
          const chosen = k.choose([p1Type, p2Type]);
          finalP1Type = chosen;
          finalP2Type = chosen;
        }
      }

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
      });

      const p2 = addCar({
        name: "Oyuncu 2",
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
      });

      cars.push(p1);
      cars.push(p2);
    }

    // Raund Başı Geri Sayım ve Kontrol Kilidi
    cars.forEach(c => c.controlsLocked = true);

    const countdownText = k.add([
      k.text("3", { size: 64, font: "monospace", weight: "bold" }),
      k.pos(k.center()),
      k.anchor("center"),
      k.color(255, 215, 0),
    ]);

    k.wait(0.5, () => {
      countdownText.text = "2";
      k.wait(0.5, () => {
        countdownText.text = "1";
        k.wait(0.5, () => {
          countdownText.text = "BAŞLA!";
          countdownText.color = k.rgb(0, 255, 100);
          cars.forEach(c => c.controlsLocked = false);
          k.wait(0.4, () => {
            countdownText.destroy();
          });
        });
      });
    });

    // Skor Göstergesi
    const scoreText = k.add([
      k.text(k.isMultiplayer ? "MAVİ 0 - 0 KIRMIZI" : `MAVİ ${p1Score} - ${p2Score} KIRMIZI`, { size: 22, font: "monospace" }),
      k.pos(k.width() / 2, 30),
      k.anchor("center"),
      k.color(200, 200, 205),
    ]);

    const timerText = k.add([
      k.text("02:00", { size: 14, font: "monospace" }),
      k.pos(k.width() / 2, 60),
      k.anchor("center"),
      k.color(150, 150, 155),
    ]);

    setupHUD(cars);

    let roundTimeLeft = 120; // 2 Dakika

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
            roundTimeLeft = getState("roundTime") ?? 120;
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

      if (roundTimeLeft <= 10) {
        timerText.color = k.rgb(255, 60, 60);
        timerText.scale = k.vec2(1 + Math.sin(k.time() * 10) * 0.1);
      } else {
        timerText.color = k.rgb(150, 150, 155);
        timerText.scale = k.vec2(1);
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
          k.go("game", { p1Type, p2Type, gameMode, p1Score, p2Score });
        });
      }
    }

    // Kazanan Yazısı (Dopaminerjik Yaylanma Efektli)
    const winnerText = k.add([
      k.text("", { size: 36, font: "monospace", weight: "bold", letterSpacing: 2 }),
      k.pos(k.center()),
      k.anchor("center"),
      k.color(255, 255, 255),
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
        k.loop(10, spawnPowerup);
      }
    } else {
      setupCollisions(checkGameOver, gameMode);
      setupPowerupCollisions();
      k.loop(10, spawnPowerup);
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
              k.go("game", { p1Type, p2Type, gameMode, p1Score: nextP1Score, p2Score: nextP2Score });
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
