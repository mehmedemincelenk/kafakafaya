import { k } from "./kaplay.js";
import { isHost, getState, setState } from "playroomkit";
import { playroomPlayers } from "./multiplayer.js";

export function setupPauseMenu(opts) {
  const { p1Type, p2Type, gameMode } = opts;
  let pauseSelectionIdx = 0;
  const pauseOptions = ["DEVAM ET", "YENIDEN BASLA", "ANA MENU"];
  let pauseTexts = [];
  let handlePauseKeys = null;

  function showPauseMenu() {
    if (k.get("pauseUI").length > 0) return;

    // Arka planı karartma paneli
    k.add([
      k.rect(k.width(), k.height()),
      k.color(0, 0, 0),
      k.opacity(0.7),
      k.pos(0, 0),
      "pauseUI",
    ]);

    // Menü Başlığı
    k.add([
      k.text("OYUN DURDURULDU", { size: 24, letterSpacing: 2 }),
      k.pos(k.width() / 2, k.height() / 2 - 120),
      k.anchor("center"),
      k.color(255, 215, 0),
      "pauseUI",
    ]);

    pauseTexts = [];
    pauseOptions.forEach((opt, idx) => {
      const label = k.add([
        k.text(opt, { size: 18, letterSpacing: 1 }),
        k.pos(k.width() / 2, k.height() / 2 - 20 + idx * 45),
        k.anchor("center"),
        k.color(255, 255, 255),
        "pauseUI",
      ]);
      pauseTexts.push(label);
    });

    k.add([
      k.text("Seçim: W-S / Yön Tuşları • Onay: ENTER / SPACE", { size: 10 }),
      k.pos(k.width() / 2, k.height() / 2 + 130),
      k.anchor("center"),
      k.color(150, 150, 155),
      "pauseUI",
    ]);

    updatePauseMenuVisuals();
  }

  function hidePauseMenu() {
    k.get("pauseUI").forEach(obj => obj.destroy());
    pauseTexts = [];
  }

  function updatePauseMenuVisuals() {
    pauseTexts.forEach((text, idx) => {
      if (idx === pauseSelectionIdx) {
        text.color = k.rgb(0, 255, 100);
        text.scale = k.vec2(1.15);
      } else {
        text.color = k.rgb(255, 255, 255);
        text.scale = k.vec2(1.0);
      }
    });
  }

  handlePauseKeys = k.onKeyPress((key) => {
    if (!k.isGamePaused) return;
    if (k.isMultiplayer && !isHost()) return; // Çok oyunculuda sadece Host yönlendirebilir

    if (key === "w" || key === "up") {
      pauseSelectionIdx = (pauseSelectionIdx - 1 + pauseOptions.length) % pauseOptions.length;
      updatePauseMenuVisuals();
    } else if (key === "s" || key === "down") {
      pauseSelectionIdx = (pauseSelectionIdx + 1) % pauseOptions.length;
      updatePauseMenuVisuals();
    } else if (key === "enter" || key === "space") {
      const choice = pauseOptions[pauseSelectionIdx];
      if (choice === "DEVAM ET") {
        if (k.isMultiplayer) {
          setState("isGamePaused", false);
        } else {
          k.isGamePaused = false;
          hidePauseMenu();
        }
      } else if (choice === "YENIDEN BASLA") {
        if (k.isMultiplayer) {
          setState("blueScore", 0);
          setState("redScore", 0);
          setState("roundOver", false);
          setState("roundWinner", null);
          setState("isGamePaused", false);
          setState("gameReloadTrigger", (getState("gameReloadTrigger") || 0) + 1);
        } else {
          k.isGamePaused = false;
          hidePauseMenu();
          handlePauseKeys.cancel();
          k.go("game", { p1Type, p2Type, gameMode, p1Score: 0, p2Score: 0 });
        }
      } else if (choice === "ANA MENU") {
        if (k.isMultiplayer) {
          setState("isGamePaused", false);
          setState("gameState", "lobby");
          setState("menuState", "MODE_SELECT");
          playroomPlayers.forEach(p => p.setState("ready", false));
        } else {
          k.isGamePaused = false;
          hidePauseMenu();
          handlePauseKeys.cancel();
          k.go("menu");
        }
      }
    }
  });

  return {
    show: showPauseMenu,
    hide: hidePauseMenu,
    cancel: () => handlePauseKeys && handlePauseKeys.cancel(),
  };
}
