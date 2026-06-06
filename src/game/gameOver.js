import { k } from "../kaplay.js";
import { isHost } from "playroomkit";

let activeGameOverKeys = null;

export function showGameOverMenu(opts) {
  const { titleText, winnerColor, goldEarned, scoreText, modeText, onRestart, onChangeCar, onMainMenu } = opts;
  let selectedIdx = 0;
  const options = ["YENİDEN OYNA", "ARAÇ DEĞİŞTİR", "ANA MENÜ"];

  const root = document.getElementById("ui-root");
  if (!root) return;

  // Remove existing pause or game over overlays
  const existingPause = document.getElementById("pause-menu-root");
  if (existingPause) existingPause.remove();

  let overlay = document.getElementById("game-over-root");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "game-over-root";
    overlay.className = "pause-overlay-container"; // Reuse identical glassmorphism styles
    root.appendChild(overlay);
  }

  function renderContent() {
    overlay.innerHTML = "";

    // Header
    const header = document.createElement("div");
    header.className = "menu-header";

    const title = document.createElement("h1");
    title.className = "menu-title";
    title.innerText = titleText;
    title.style.color = winnerColor === "blue" ? "var(--active-secondary)" : "var(--active-primary)";
    title.style.textShadow = winnerColor === "blue" 
      ? "0 0 30px rgba(0, 240, 255, 0.4)" 
      : "0 0 30px rgba(255, 70, 85, 0.4)";
    header.appendChild(title);

    const subtitle = document.createElement("h2");
    subtitle.className = "menu-subtitle";
    subtitle.innerText = `${modeText} MODU • SKOR: ${scoreText} • KAZANILAN: +${goldEarned} ALTIN`;
    header.appendChild(subtitle);

    overlay.appendChild(header);

    // Options List
    const optionsContainer = document.createElement("div");
    optionsContainer.className = "menu-nav-list";

    const isMp = k.isMultiplayer;
    const isHostUser = isHost();

    options.forEach((opt, idx) => {
      const btn = document.createElement("button");
      btn.className = `menu-nav-item ${idx === selectedIdx ? "active" : ""}`;
      
      // If multiplayer and not host, disable interaction
      if (isMp && !isHostUser) {
        btn.classList.add("disabled");
        btn.disabled = true;
      }

      btn.innerText = opt;

      // Hover
      btn.addEventListener("mouseenter", () => {
        if (isMp && !isHostUser) return;
        selectedIdx = idx;
        updateVisuals();
      });

      // Click
      btn.addEventListener("click", () => {
        if (isMp && !isHostUser) return;
        triggerChoice(opt);
      });

      optionsContainer.appendChild(btn);
    });

    overlay.appendChild(optionsContainer);

    // Help / Status Text
    const help = document.createElement("div");
    help.className = "help-text";
    help.style.position = "absolute";
    help.style.bottom = "40px";
    help.style.left = "10%";
    help.style.letterSpacing = "2px";
    help.style.fontSize = "11px";

    if (isMp && !isHostUser) {
      help.innerText = "KURUCUNUN SEÇİM YAPMASI BEKLENİYOR...";
      help.style.color = "var(--active-gold)";
    } else {
      help.innerText = "SEÇİM: W-S / YÖN TUŞLARI • ONAY: ENTER / SPACE";
    }
    overlay.appendChild(help);

    updateVisuals();
  }

  function updateVisuals() {
    const buttons = overlay.querySelectorAll(".menu-nav-item");
    buttons.forEach((btn, idx) => {
      if (idx === selectedIdx) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }

  function triggerChoice(choice) {
    cleanup();
    if (choice === "YENİDEN OYNA") {
      onRestart();
    } else if (choice === "ARAÇ DEĞİŞTİR") {
      onChangeCar();
    } else if (choice === "ANA MENÜ") {
      onMainMenu();
    }
  }

  function cleanup() {
    if (activeGameOverKeys) {
      activeGameOverKeys.cancel();
      activeGameOverKeys = null;
    }
    const o = document.getElementById("game-over-root");
    if (o) o.remove();
  }

  // Bind keys
  if (activeGameOverKeys) {
    activeGameOverKeys.cancel();
  }

  activeGameOverKeys = k.onKeyPress((key) => {
    if (k.isMultiplayer && !isHost()) return;

    if (key === "w" || key === "up") {
      selectedIdx = (selectedIdx - 1 + options.length) % options.length;
      updateVisuals();
    } else if (key === "s" || key === "down") {
      selectedIdx = (selectedIdx + 1) % options.length;
      updateVisuals();
    } else if (key === "enter" || key === "space") {
      triggerChoice(options[selectedIdx]);
    }
  });

  renderContent();

  return {
    destroy: cleanup
  };
}
