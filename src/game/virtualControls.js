import { virtualInputs } from "./input.js";

// Sanal kontrol mekanizması (Minimalist Tuşlar)
export function setupVirtualControls() {
  console.log("[VIRTUAL CONTROLS] setupVirtualControls() tetiklendi.");

  // 1. Ayarları kontrol et
  let raw = localStorage.getItem("kafakafaya_settings");
  let hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  let settings = raw ? JSON.parse(raw) : { screenShake: true, sfx: true, showFps: false, joystick: hasTouch };
  if (settings.joystick === undefined) {
    settings.joystick = hasTouch;
  }

  // Eski kalıntıları temizle
  const oldRoot = document.getElementById("virtual-controls-root");
  if (oldRoot) {
    oldRoot.remove();
  }

  if (!settings.joystick) {
    return;
  }

  // 2. CSS Stillerini Enjekte Et
  injectVirtualControlsCSS();

  // 3. DOM Arayüzünü Oluştur
  const uiRoot = document.getElementById("ui-root") || document.body;
  
  const root = document.createElement("div");
  root.id = "virtual-controls-root";

  // --- SOL TARAF: SOL & SAĞ YÖNLENDİRME TUŞLARI ---
  const steeringGroup = document.createElement("div");
  steeringGroup.id = "virtual-steering-group";

  const btnLeft = document.createElement("button");
  btnLeft.className = "control-btn";
  btnLeft.id = "btn-virtual-left";
  btnLeft.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  `;

  const btnRight = document.createElement("button");
  btnRight.className = "control-btn";
  btnRight.id = "btn-virtual-right";
  btnRight.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  `;

  steeringGroup.appendChild(btnLeft);
  steeringGroup.appendChild(btnRight);

  // --- SAĞ TARAF: GAZ, DASH & YETENEK TUŞLARI (ERKENOMİK KAVİS) ---
  const actionGroup = document.createElement("div");
  actionGroup.id = "virtual-action-group";

  // Gaz Tuşu (Daha büyük, başparmak hizasında)
  const btnGas = document.createElement("button");
  btnGas.className = "control-btn gas-btn";
  btnGas.id = "btn-virtual-gas";
  btnGas.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="18 15 12 9 6 15"></polyline>
    </svg>
  `;

  // Dash Tuşu
  const btnDash = document.createElement("button");
  btnDash.className = "control-btn dash-btn";
  btnDash.id = "btn-virtual-dash";
  btnDash.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
  `;

  // Yetenek Tuşu
  const btnSkill = document.createElement("button");
  btnSkill.className = "control-btn skill-btn";
  btnSkill.id = "btn-virtual-skill";
  btnSkill.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  `;

  actionGroup.appendChild(btnSkill);
  actionGroup.appendChild(btnDash);
  actionGroup.appendChild(btnGas);

  root.appendChild(steeringGroup);
  root.appendChild(actionGroup);
  uiRoot.appendChild(root);

  // 4. Tuşlara Dokunmatik & Fare Olaylarını Tanımlama (DRY)
  setupButtonInput(btnLeft, "left");
  setupButtonInput(btnRight, "right");
  setupButtonInput(btnGas, "forward");

  // Dash ve Skill için özel tetiklemeler
  setupSpecialButtonInput(btnDash, "dash");
  setupSpecialButtonInput(btnSkill, "skill");
}

// Yön ve Gaz tuşları için genel girdi yöneticisi
function setupButtonInput(element, inputKey) {
  const startAction = (e) => {
    e.preventDefault();
    virtualInputs[inputKey] = true;
  };
  const endAction = (e) => {
    e.preventDefault();
    virtualInputs[inputKey] = false;
  };

  // Dokunmatik olaylar (Mobil)
  element.addEventListener("touchstart", startAction);
  element.addEventListener("touchend", endAction);
  element.addEventListener("touchcancel", endAction);

  // Fare olayları (PC testleri)
  element.addEventListener("mousedown", startAction);
  element.addEventListener("mouseup", endAction);
  element.addEventListener("mouseleave", endAction);
}

// Dash ve Yetenek tuşları için özel girdi yöneticisi (ClashTap uyumlu)
function setupSpecialButtonInput(element, inputKey) {
  const startAction = (e) => {
    e.preventDefault();
    virtualInputs[inputKey] = true;
    if (inputKey === "skill") {
      virtualInputs.clashTap = true;
    }
  };
  const endAction = (e) => {
    e.preventDefault();
    virtualInputs[inputKey] = false;
    if (inputKey === "skill") {
      virtualInputs.clashTap = false;
    }
  };

  // Dokunmatik olaylar (Mobil)
  element.addEventListener("touchstart", startAction);
  element.addEventListener("touchend", endAction);
  element.addEventListener("touchcancel", endAction);

  // Fare olayları (PC testleri)
  element.addEventListener("mousedown", startAction);
  element.addEventListener("mouseup", endAction);
  element.addEventListener("mouseleave", endAction);
}

function injectVirtualControlsCSS() {
  if (document.getElementById("virtual-controls-styles")) return;

  const style = document.createElement("style");
  style.id = "virtual-controls-styles";
  style.innerHTML = `
    #virtual-controls-root {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
      user-select: none;
      -webkit-user-select: none;
    }

    /* Sol Taraf: Yönlendirme Grubu */
    #virtual-steering-group {
      position: absolute;
      bottom: 45px;
      left: 45px;
      display: flex;
      gap: 24px;
      pointer-events: none;
    }

    /* Sağ Taraf: Aksiyon Grubu (Ergonomik Kavis) */
    #virtual-action-group {
      position: absolute;
      bottom: 45px;
      right: 45px;
      width: 230px;
      height: 150px;
      pointer-events: none;
    }

    /* Apple Simplicity - Minimalist Dairesel Cam Tuşlar */
    .control-btn {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.12);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      color: rgba(255, 255, 255, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      outline: none;
      pointer-events: auto;
      touch-action: none;
      transition: background 0.1s ease, border-color 0.1s ease, transform 0.1s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .control-btn svg {
      width: 28px;
      height: 28px;
    }

    /* IOS Tarzı Tıklama Geri Bildirimi */
    .control-btn:active {
      transform: scale(0.9);
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
      color: #ffffff;
    }

    /* Özel Buton Konumlandırmaları (Thumb Arc) */
    .gas-btn {
      position: absolute;
      bottom: 0px;
      right: 0px;
      width: 82px;
      height: 82px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.18);
    }

    .gas-btn svg {
      width: 34px;
      height: 34px;
    }

    .dash-btn {
      position: absolute;
      bottom: 58px;
      right: 90px;
    }

    .skill-btn {
      position: absolute;
      bottom: 0px;
      right: 155px;
    }
  `;
  document.head.appendChild(style);
}
