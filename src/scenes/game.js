import { k } from "../kaplay.js";
import { addCar } from "../car.js";
import { setupCollisions } from "../collision.js";
import { spawnPowerup, setupPowerupCollisions } from "../powerup.js";

export function initGameScene() {
  k.scene("game", ({ p1Type, p2Type, gameMode = "NORMAL", p1Score = 0, p2Score = 0 }) => {
    k.gameOver = false;

    // Kafa Kafaya Mod Kontrolü: Farklı arabalar seçilmişse birini rastgele seç ve ikisini de o yap
    let finalP1Type = p1Type;
    let finalP2Type = p2Type;

    if (gameMode === "KAFA_KAFAYA") {
      if (p1Type !== p2Type) {
        const chosen = k.choose([p1Type, p2Type]);
        finalP1Type = chosen;
        finalP2Type = chosen;
      }
      
      const modeNotice = k.add([
        k.text(`KAFA KAFAYA • ${finalP1Type}`, { size: 12, letterSpacing: 1 }),
        k.pos(k.width() / 2, 60),
        k.anchor("center"),
        k.color(255, 215, 0),
      ]);
      k.wait(1.5, () => modeNotice.destroy());
    } else {
      const modeNotice = k.add([
        k.text("MOMENTUM SAVAŞI", { size: 12, letterSpacing: 1 }),
        k.pos(k.width() / 2, 60),
        k.anchor("center"),
        k.color(150, 150, 155),
      ]);
      k.wait(1.5, () => modeNotice.destroy());
    }

    let pauseSelectionIdx = 0;
    const pauseOptions = ["DEVAM ET", "YENIDEN BASLA", "ANA MENU"];
    let pauseTexts = [];

    // ESC Tuşu ile Oyunu Duraklatma (Pause)
    k.onKeyPress("escape", () => {
      if (k.gameOver || p1.controlsLocked) return;

      k.isGamePaused = !k.isGamePaused;

      if (k.isGamePaused) {
        pauseSelectionIdx = 0;
        showPauseMenu();
      } else {
        hidePauseMenu();
      }
    });

    function showPauseMenu() {
      // Duraklatma Overlay Kutusu (Koyu Transparan)
      k.add([
        k.rect(k.width() - 48, k.height() - 48, { radius: 8 }),
        k.pos(24, 24),
        k.color(14, 15, 18),
        k.opacity(0.85),
        "pauseUI",
      ]);

      // Duraklatıldı Metni
      k.add([
        k.text("DURAKLATILDI", { size: 36, font: "monospace", weight: "bold", letterSpacing: 2 }),
        k.pos(k.width() / 2, k.height() / 2 - 120),
        k.anchor("center"),
        k.color(255, 215, 0),
        "pauseUI",
      ]);

      // Seçenek Metinlerini Ekle
      pauseTexts = [];
      pauseOptions.forEach((opt, idx) => {
        const txt = k.add([
          k.text(opt, { size: 18, font: "monospace", weight: "bold" }),
          k.pos(k.width() / 2, k.height() / 2 - 20 + idx * 50),
          k.anchor("center"),
          "pauseUI",
        ]);
        pauseTexts.push(txt);
      });

      // Kontroller Alt Bilgisi
      k.add([
        k.text("Secim: W-S / YON TUSLARI  •  Onay: ENTER / SPACE", { size: 11, font: "monospace" }),
        k.pos(k.width() / 2, k.height() / 2 + 160),
        k.anchor("center"),
        k.color(120, 122, 125),
        "pauseUI",
      ]);

      updatePauseSelection();
    }

    function updatePauseSelection() {
      pauseTexts.forEach((txt, idx) => {
        if (idx === pauseSelectionIdx) {
          txt.color = k.rgb(255, 215, 0); // Seçili olan sarı
          txt.text = `> ${pauseOptions[idx]} <`;
        } else {
          txt.color = k.rgb(150, 150, 155); // Seçilmeyen gri
          txt.text = pauseOptions[idx];
        }
      });
    }

    function hidePauseMenu() {
      k.isGamePaused = false;
      k.destroyAll("pauseUI");
      pauseTexts = [];
    }

    // Duraklatma Menüsü Klavye Kontrolleri
    const pauseMenuKeys = k.onKeyPress((key) => {
      if (!k.isGamePaused) return;

      if (key === "up" || key === "w") {
        pauseSelectionIdx = (pauseSelectionIdx - 1 + pauseOptions.length) % pauseOptions.length;
        updatePauseSelection();
      } else if (key === "down" || key === "s") {
        pauseSelectionIdx = (pauseSelectionIdx + 1) % pauseOptions.length;
        updatePauseSelection();
      } else if (key === "enter" || key === "space") {
        const action = pauseOptions[pauseSelectionIdx];
        if (action === "DEVAM ET") {
          hidePauseMenu();
        } else if (action === "YENIDEN BASLA") {
          hidePauseMenu();
          pauseMenuKeys.cancel();
          k.go("game", { p1Type, p2Type, gameMode, p1Score: 0, p2Score: 0 });
        } else if (action === "ANA MENU") {
          hidePauseMenu();
          pauseMenuKeys.cancel();
          k.go("menu");
        }
      }
    });

    // Arena Sınır Kutusu ve Izgara Çizimi
    k.add([
      k.rect(k.width() - 48, k.height() - 48, { radius: 8 }),
      k.pos(24, 24),
      k.color(18, 18, 20),
      k.outline(1.5, k.rgb(45, 45, 50)),
    ]);

    const gridSize = 60;
    for (let x = 60; x < k.width() - 30; x += gridSize) {
      for (let y = 60; y < k.height() - 30; y += gridSize) {
        k.add([
          k.pos(x, y),
          k.circle(1.5),
          k.color(55, 55, 60),
        ]);
      }
    }

    // Oyuncu 1
    const p1 = addCar({
      name: "Player 1",
      tag: "player1",
      color: k.rgb(0, 140, 255),
      startPos: k.vec2(180, k.height() / 2),
      startAngle: 0,
      controls: {
        forward: "w",
        backward: "s",
        left: "a",
        right: "d",
        skill: "shift",
      },
      type: finalP1Type,
    });

    // Oyuncu 2
    const p2 = addCar({
      name: "Player 2",
      tag: "player2",
      color: k.rgb(255, 60, 60),
      startPos: k.vec2(k.width() - 180, k.height() / 2),
      startAngle: 180,
      controls: {
        forward: "up",
        backward: "down",
        left: "left",
        right: "right",
        skill: "enter",
      },
      type: finalP2Type,
    });

    // Raund Başı Geri Sayım ve Kontrol Kilidi
    p1.controlsLocked = true;
    p2.controlsLocked = true;

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
          p1.controlsLocked = false;
          p2.controlsLocked = false;
          k.wait(0.4, () => {
            countdownText.destroy();
          });
        });
      });
    });

    // Minimal Skor Göstergesi
    k.add([
      k.text(`${p1Score} - ${p2Score}`, { size: 22, font: "monospace" }),
      k.pos(k.width() / 2, 30),
      k.anchor("center"),
      k.color(200, 200, 205),
    ]);

    // Raund Süresi Göstergesi (Maksimum 2 Dakika)
    const timerText = k.add([
      k.text("02:00", { size: 14, font: "monospace" }),
      k.pos(k.width() / 2, 60),
      k.anchor("center"),
      k.color(150, 150, 155),
    ]);

    let roundTimeLeft = 120; // 2 Dakika

    k.onUpdate(() => {
      if (k.gameOver || p1.controlsLocked) return;

      roundTimeLeft -= k.dt();
      if (roundTimeLeft <= 0) {
        roundTimeLeft = 0;
        triggerTimeOut();
      }

      const mins = Math.floor(roundTimeLeft / 60);
      const secs = Math.floor(roundTimeLeft % 60);
      timerText.text = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

      // Son 10 saniye kala yanıp sönen kırmızı uyarı
      if (roundTimeLeft <= 10) {
        timerText.color = k.rgb(255, 60, 60);
        timerText.scale = k.vec2(1 + Math.sin(k.time() * 10) * 0.1);
      }
    });

    function triggerTimeOut() {
      k.gameOver = true;
      p1.speed = 0;
      p2.speed = 0;
      p1.controlsLocked = true;
      p2.controlsLocked = true;
      
      k.shake(8);
      winnerText.scale = 0;
      winnerText.text = "SÜRE BİTTİ • BERABERE";
      winnerText.color = k.rgb(200, 200, 205);
      winnerText.hidden = false;

      k.wait(3.0, () => {
        k.go("game", {
          p1Type,
          p2Type,
          gameMode,
          p1Score,
          p2Score,
        });
      });
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
        winnerText.scale = k.lerp(winnerText.scale, 1, k.dt() * 12);
      }
    });

    // Çarpışma Mekaniği
    setupCollisions(checkGameOver, gameMode);

    // Power-up Kurulumu ve Döngüsü
    setupPowerupCollisions();
    k.loop(10, spawnPowerup);

    function checkGameOver() {
      if (p1.hp <= 0 || p2.hp <= 0) {
        k.gameOver = true;
        p1.speed = 0;
        p2.speed = 0;

        let roundWinner = null;
        if (p1.hp <= 0 && p2.hp <= 0) {
          // Beraberlik
        } else if (p1.hp <= 0) {
          roundWinner = 2;
        } else {
          roundWinner = 1;
        }

        const nextP1Score = p1Score + (roundWinner === 1 ? 1 : 0);
        const nextP2Score = p2Score + (roundWinner === 2 ? 1 : 0);

        k.shake(12);

        winnerText.scale = 0; // Her raund sonu yaylanma animasyonu için ölçeği sıfırla

        // 5 Raundu kazanan maçı alır
        if (nextP1Score >= 5 || nextP2Score >= 5) {
          winnerText.text = nextP1Score >= 5 ? "🏆 MAVİ ŞAMPİYON! 🏆" : "🏆 KIRMIZI ŞAMPİYON! 🏆";
          winnerText.color = nextP1Score >= 5 ? k.rgb(0, 140, 255) : k.rgb(255, 60, 60);
          winnerText.hidden = false;
          k.wait(3.0, () => {
            k.go("menu");
          });
        } else {
          winnerText.text = roundWinner === 1 ? "MAVİ RAUND!" : roundWinner === 2 ? "KIRMIZI RAUND!" : "BERABERE";
          winnerText.color = roundWinner === 1 ? k.rgb(0, 140, 255) : roundWinner === 2 ? k.rgb(255, 60, 60) : k.rgb(255, 255, 255);
          winnerText.hidden = false;
          k.wait(1.5, () => {
            k.go("game", { p1Type, p2Type, gameMode, p1Score: nextP1Score, p2Score: nextP2Score });
          });
        }
      }
    }
  });
}
