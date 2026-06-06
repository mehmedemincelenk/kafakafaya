import { k } from "../kaplay.js";
import { isHost, getState, setState } from "playroomkit";
import { playroomPlayers } from "../multiplayer.js";

export function setupPauseMenu(opts) {
  const { p1Type, p2Type, gameMode, p2Joined } = opts;
  let view = "main"; // "main" or "settings"
  let pauseSelectionIdx = 0;
  let settingsSelectionIdx = 0;
  
  const pauseOptions = ["DEVAM ET", "AYARLAR", "YENIDEN BASLA", "ARAÇ DEĞİŞTİR", "ANA MENU"];
  let handlePauseKeys = null;

  function showPauseMenu() {
    const root = document.getElementById("ui-root");
    if (!root) return;

    let overlay = document.getElementById("pause-menu-root");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "pause-menu-root";
      overlay.className = "pause-overlay-container";
      root.appendChild(overlay);
    }

    view = "main";
    pauseSelectionIdx = 0;
    renderPauseMenuContent();
  }

  function renderPauseMenuContent() {
    const overlay = document.getElementById("pause-menu-root");
    if (!overlay) return;

    overlay.innerHTML = "";

    // Header (Title & Subtitle)
    const header = document.createElement("div");
    header.className = "menu-header";

    const title = document.createElement("h1");
    title.className = "menu-title";
    title.innerText = view === "main" ? "OYUN DURDURULDU" : "TEMEL AYARLAR";
    header.appendChild(title);

    const subtitle = document.createElement("h2");
    subtitle.className = "menu-subtitle";
    if (k.isMultiplayer) {
      subtitle.innerText = "ÇOK OYUNCULU MODU";
    } else if (p2Joined) {
      subtitle.innerText = "OMUZ OMUZA MODU";
    } else {
      subtitle.innerText = "ANTRENMAN MODU";
    }
    header.appendChild(subtitle);

    overlay.appendChild(header);

    // Options Container
    const optionsContainer = document.createElement("div");
    optionsContainer.className = "menu-nav-list";

    if (view === "main") {
      pauseOptions.forEach((opt, idx) => {
        const btn = document.createElement("button");
        btn.className = `menu-nav-item ${idx === pauseSelectionIdx ? "active" : ""}`;
        btn.innerText = opt;

        // Hover
        btn.addEventListener("mouseenter", () => {
          if (k.isMultiplayer && !isHost()) return;
          pauseSelectionIdx = idx;
          updatePauseMenuVisuals();
        });

        // Click
        btn.addEventListener("click", () => {
          if (k.isMultiplayer && !isHost()) return;
          triggerChoice(opt);
        });

        optionsContainer.appendChild(btn);
      });
    } else {
      // Load current settings
      let raw = localStorage.getItem("kafakafaya_settings");
      let settings = raw ? JSON.parse(raw) : { screenShake: true, sfx: true, showFps: false };

      const settingOpts = [
        `EKRAN SARSINTISI: ${settings.screenShake ? "AÇIK" : "KAPALI"}`,
        `SES & EFEKTLER: ${settings.sfx ? "AÇIK" : "KAPALI"}`,
        `FPS GÖSTERGESİ: ${settings.showFps ? "AÇIK" : "KAPALI"}`,
        "GERİ DÖN"
      ];

      settingOpts.forEach((opt, idx) => {
        const btn = document.createElement("button");
        btn.className = `menu-nav-item ${idx === settingsSelectionIdx ? "active" : ""}`;
        btn.innerText = opt;

        // Hover
        btn.addEventListener("mouseenter", () => {
          if (k.isMultiplayer && !isHost()) return;
          settingsSelectionIdx = idx;
          updatePauseMenuVisuals();
        });

        // Click
        btn.addEventListener("click", () => {
          if (k.isMultiplayer && !isHost()) return;
          triggerSettingsChoice(idx);
        });

        optionsContainer.appendChild(btn);
      });
    }

    overlay.appendChild(optionsContainer);

    // Help Text
    const help = document.createElement("div");
    help.className = "help-text";
    help.style.position = "absolute";
    help.style.bottom = "40px";
    help.style.left = "10%";
    help.style.letterSpacing = "2px";
    help.style.fontSize = "11px";
    help.innerText = "SEÇİM: W-S / YÖN TUŞLARI • ONAY: ENTER / SPACE";
    overlay.appendChild(help);

    updatePauseMenuVisuals();
  }

  function hidePauseMenu() {
    const existing = document.getElementById("pause-menu-root");
    if (existing) {
      existing.remove();
    }
  }

  function updatePauseMenuVisuals() {
    const overlay = document.getElementById("pause-menu-root");
    if (!overlay) return;

    const buttons = overlay.querySelectorAll(".menu-nav-item");
    const activeIdx = view === "main" ? pauseSelectionIdx : settingsSelectionIdx;

    buttons.forEach((btn, idx) => {
      if (idx === activeIdx) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }

  function triggerChoice(choice) {
    if (choice === "DEVAM ET") {
      if (k.isMultiplayer) {
        setState("isGamePaused", false);
      } else {
        k.isGamePaused = false;
        hidePauseMenu();
      }
    } else if (choice === "AYARLAR") {
      view = "settings";
      settingsSelectionIdx = 0;
      renderPauseMenuContent();
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
        if (handlePauseKeys) handlePauseKeys.cancel();
        k.go("game", { p1Type, p2Type, gameMode, p1Score: 0, p2Score: 0 });
      }
    } else if (choice === "ARAÇ DEĞİŞTİR") {
      if (k.isMultiplayer) {
        if (isHost()) {
          setState("isGamePaused", false);
          setState("blueScore", 0);
          setState("redScore", 0);
          setState("roundOver", false);
          setState("gameState", "lobby");
          setState("menuState", "CAR_SELECT");
          playroomPlayers.forEach(p => p.setState("ready", false));
        }
      } else {
        k.isGamePaused = false;
        hidePauseMenu();
        if (handlePauseKeys) handlePauseKeys.cancel();
        k.go("menu", {
          startState: "CAR_SELECT",
          gameMode: gameMode,
          p2Joined: p2Joined
        });
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
        if (handlePauseKeys) handlePauseKeys.cancel();
        k.go("menu");
      }
    }
  }

  function triggerSettingsChoice(choiceIdx) {
    let raw = localStorage.getItem("kafakafaya_settings");
    let settings = raw ? JSON.parse(raw) : { screenShake: true, sfx: true, showFps: false };

    if (choiceIdx === 0) {
      settings.screenShake = !settings.screenShake;
      localStorage.setItem("kafakafaya_settings", JSON.stringify(settings));
      renderPauseMenuContent();
    } else if (choiceIdx === 1) {
      settings.sfx = !settings.sfx;
      localStorage.setItem("kafakafaya_settings", JSON.stringify(settings));
      k.volume(settings.sfx ? 1 : 0);
      renderPauseMenuContent();
    } else if (choiceIdx === 2) {
      settings.showFps = !settings.showFps;
      localStorage.setItem("kafakafaya_settings", JSON.stringify(settings));
      renderPauseMenuContent();
    } else if (choiceIdx === 3) {
      view = "main";
      renderPauseMenuContent();
    }
  }

  handlePauseKeys = k.onKeyPress((key) => {
    if (!k.isGamePaused) return;
    if (k.isMultiplayer && !isHost()) return; // Çok oyunculuda sadece Host yönlendirebilir

    if (view === "main") {
      if (key === "w" || key === "up") {
        pauseSelectionIdx = (pauseSelectionIdx - 1 + pauseOptions.length) % pauseOptions.length;
        updatePauseMenuVisuals();
      } else if (key === "s" || key === "down") {
        pauseSelectionIdx = (pauseSelectionIdx + 1) % pauseOptions.length;
        updatePauseMenuVisuals();
      } else if (key === "enter" || key === "space") {
        const choice = pauseOptions[pauseSelectionIdx];
        triggerChoice(choice);
      }
    } else {
      const maxSettings = 4;
      if (key === "w" || key === "up") {
        settingsSelectionIdx = (settingsSelectionIdx - 1 + maxSettings) % maxSettings;
        updatePauseMenuVisuals();
      } else if (key === "s" || key === "down") {
        settingsSelectionIdx = (settingsSelectionIdx + 1) % maxSettings;
        updatePauseMenuVisuals();
      } else if (key === "enter" || key === "space") {
        triggerSettingsChoice(settingsSelectionIdx);
      } else if (key === "escape") {
        view = "main";
        renderPauseMenuContent();
      }
    }
  });

  return {
    show: showPauseMenu,
    hide: hidePauseMenu,
    cancel: () => handlePauseKeys && handlePauseKeys.cancel(),
  };
}
