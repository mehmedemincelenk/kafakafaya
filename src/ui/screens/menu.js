import { k } from "../../kaplay.js";
import { CAR_TYPES, PROJECTILES } from "../../config.js";
import { store, CAR_COSTS } from "../../store.js";
import { playroomPlayers, isConnected, initMultiplayerListeners } from "../../multiplayer.js";
import { insertCoin, myPlayer, isHost, setState, getState } from "playroomkit";
import { spawnExplosion } from "../../utils.js";
import { SKILLS } from "../../skill.js";
import {
  createNavButton,
  createPlayerSelectorPanel,
  drawHTMLCarDetails,
  createCarGridCard,
  createSupportGridCard
} from "../components.js";

// Import styles
import "../styles/base.css";
import mthLogo from "../../../mth_logo.png";

// Check for reload from failed connection attempt and clear hash
if (typeof sessionStorage !== "undefined" && sessionStorage.getItem("playroom_connecting") === "true") {
  sessionStorage.removeItem("playroom_connecting");
  if (window.location.hash && window.location.hash.includes("r=")) {
    console.log("Detected reload from failed connection. Clearing hash.");
    window.location.hash = "";
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
    }
  }
}

class HTMLMenuManager {
  constructor() {
    this.root = document.getElementById("ui-root");
    this.container = null;
    this.state = {
      menuState: "PLAY_TYPE_SELECT", // "PLAY_TYPE_SELECT" | "CAR_SELECT"
      gameMode: "NORMAL",
      selectedPlayTypeIdx: 0, // 0: ANTRENMAN, 1: OMUZ OMUZA, 2: ARKADAŞLARLA
      p2Joined: false,
      players: [], // List of rendered player state objects
      inputCooldown: false,
      hostCarTransitioning: false,
      selectedManufacturer: "DEFAULT"
    };
    this.keyboardListener = null;
    this.updateInterval = null;
  }

  mount(params) {
    // Reset selection and navigation states to starting screen values or passed values
    const startState = (params && params.startState)
      ? params.startState
      : (store.isGuest("p1") ? "AUTH" : "PLAY_TYPE_SELECT");
    this.state.menuState = startState;
    this.state.selectedPlayTypeIdx = 0;
    this.state.selectedSettingIdx = 0;
    this.state.p2Joined = (params && params.p2Joined !== undefined) ? params.p2Joined : false;
    this.state.gameMode = (params && params.gameMode) ? params.gameMode : "NORMAL";
    this.state.hostCarTransitioning = false;

    if (this.state.menuState === "CAR_SELECT") {
      this.setupPlayersState();
    }

    this.root.innerHTML = "";

    this.container = document.createElement("div");
    this.container.className = "menu-overlay-container";
    this.root.appendChild(this.container);

    // Main content area
    this.contentArea = document.createElement("div");
    this.contentArea.className = "menu-main-content";
    this.contentArea.style.width = "100%";
    this.contentArea.style.display = "flex";
    this.contentArea.style.flexDirection = "column";
    this.contentArea.style.alignItems = "center";
    this.container.appendChild(this.contentArea);

    this.renderHeader();
    this.renderFooter();

    const logoWrapper = document.createElement("div");
    logoWrapper.className = "mth-logo-wrapper";

    const logoCredits = document.createElement("span");
    logoCredits.className = "mth-logo-credits";
    logoCredits.innerHTML = "JGD | FATİH, M.CAN VE DİĞER HAFIZ'LARIN KATKILARIYLA,<br>LÜLEBURGAZ KIRKLARELİ DİYANET İLÇE MÜFTÜLÜĞÜ KATKILARIYLA";

    const logoImg = document.createElement("img");
    logoImg.src = mthLogo;
    logoImg.className = "mth-logo";

    logoWrapper.appendChild(logoImg);
    logoWrapper.appendChild(logoCredits);
    this.container.appendChild(logoWrapper);

    // Setup initial view
    this.updateView();

    // Bind keyboard inputs
    this.setupKeyboardInput();

    // Start background syncing loop (for multiplayer states)
    this.startStateSyncLoop();
  }

  dismount() {
    if (this.keyboardListener) {
      window.removeEventListener("keydown", this.keyboardListener);
      this.keyboardListener = null;
    }
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.root.innerHTML = "";
  }

  triggerCooldown() {
    this.state.inputCooldown = true;
    setTimeout(() => {
      this.state.inputCooldown = false;
    }, 200);
  }



  renderHeader() {
    const header = document.createElement("div");
    header.className = "menu-header";

    const title = document.createElement("h1");
    title.className = "menu-title";
    title.innerText = "Kafa Kafaya";
    header.appendChild(title);

    const subtitle = document.createElement("h2");
    subtitle.className = "menu-subtitle";
    subtitle.innerText = "İNSANSIZ SERMAYELER LİGİ";
    header.appendChild(subtitle);

    this.container.insertBefore(header, this.contentArea);
  }

  renderFooter() {
    this.footer = document.createElement("div");
    this.footer.className = "menu-footer";

    this.helpText = document.createElement("span");
    this.helpText.className = "help-text";
    this.footer.appendChild(this.helpText);

    this.container.appendChild(this.footer);
  }

  renderTopIndicators() {
    // Remove existing top indicators if any
    const existing = this.container.querySelector(".top-indicators");
    if (existing) existing.remove();

    if (this.state.menuState === "CAR_SELECT" || this.state.menuState === "AUTH") {
      return;
    }

    const topIndicators = document.createElement("div");
    topIndicators.className = "top-indicators";
    
    const topRightGroup = document.createElement("div");
    topRightGroup.className = "top-right-group";
    topIndicators.appendChild(topRightGroup);

    // Profile buttons for logged in players
    ["p1", "p2"].forEach((pId) => {
      if (!store.isGuest(pId)) {
        const wrapper = document.createElement("div");
        wrapper.style.position = "relative";
        wrapper.style.display = "inline-block";

        const profileBtn = document.createElement("button");
        profileBtn.className = "top-settings-btn";
        profileBtn.style.color = pId === "p1" ? "var(--active-secondary, #00f0ff)" : "var(--active-primary, #ff4655)";
        profileBtn.style.borderColor = pId === "p1" ? "rgba(0, 240, 255, 0.2)" : "rgba(255, 70, 85, 0.2)";
        profileBtn.innerHTML = `👤 ${store.getDeviceUuid(pId).toUpperCase()}`;

        profileBtn.onclick = (e) => {
          e.stopPropagation();
          const existingConfirm = wrapper.querySelector(".logout-confirm-box");
          if (existingConfirm) {
            if (existingConfirm.cleanup) existingConfirm.cleanup();
            existingConfirm.remove();
          } else {
            // Remove any other open confirmation boxes
            const allConfirms = this.container.querySelectorAll(".logout-confirm-box");
            allConfirms.forEach(c => {
              if (c.cleanup) c.cleanup();
              c.remove();
            });

            // Create confirmation box
            const confirmBox = document.createElement("div");
            confirmBox.className = "logout-confirm-box";
            confirmBox.style.position = "absolute";
            confirmBox.style.top = "42px";
            confirmBox.style.right = "0";
            confirmBox.style.width = "220px";
            confirmBox.style.padding = "14px";
            confirmBox.style.background = "rgba(8, 9, 12, 0.85)";
            confirmBox.style.backdropFilter = "blur(8px)";
            confirmBox.style.webkitBackdropFilter = "blur(8px)";
            confirmBox.style.border = "1px solid rgba(255, 255, 255, 0.15)";
            confirmBox.style.borderRadius = "4px";
            confirmBox.style.zIndex = "1001";
            confirmBox.style.display = "flex";
            confirmBox.style.flexDirection = "column";
            confirmBox.style.gap = "10px";
            confirmBox.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.5)";

            const msg = document.createElement("div");
            msg.style.fontSize = "10px";
            msg.style.fontWeight = "800";
            msg.style.letterSpacing = "1.5px";
            msg.style.color = "#ffffff";
            msg.style.textAlign = "center";
            msg.innerText = "ÇIKIŞ YAPMAK İSTEDİĞİNE EMİN MİSİN?";
            confirmBox.appendChild(msg);

            const btnRow = document.createElement("div");
            btnRow.style.display = "flex";
            btnRow.style.gap = "8px";

            const clickOutside = (evt) => {
              if (!wrapper.contains(evt.target)) {
                cleanup();
                confirmBox.remove();
              }
            };

            const cleanup = () => {
              document.removeEventListener("click", clickOutside);
            };
            confirmBox.cleanup = cleanup;

            const yesBtn = document.createElement("button");
            yesBtn.innerText = "EVET";
            yesBtn.style.flex = "1";
            yesBtn.style.padding = "6px";
            yesBtn.style.background = "rgba(255, 70, 85, 0.2)";
            yesBtn.style.border = "1px solid rgba(255, 70, 85, 0.4)";
            yesBtn.style.color = "#ff4655";
            yesBtn.style.borderRadius = "2px";
            yesBtn.style.cursor = "pointer";
            yesBtn.style.fontFamily = "inherit";
            yesBtn.style.fontSize = "11px";
            yesBtn.style.fontWeight = "800";
            yesBtn.style.letterSpacing = "1px";
            yesBtn.style.transition = "all 0.15s ease";
            yesBtn.onmouseenter = () => {
              yesBtn.style.background = "rgba(255, 70, 85, 0.4)";
              yesBtn.style.boxShadow = "0 0 8px rgba(255, 70, 85, 0.3)";
            };
            yesBtn.onmouseleave = () => {
              yesBtn.style.background = "rgba(255, 70, 85, 0.2)";
              yesBtn.style.boxShadow = "none";
            };
            yesBtn.onclick = (evt) => {
              evt.stopPropagation();
              cleanup();
              if (pId === "p1") {
                if (!store.isGuest("p2")) {
                  const p2Uuid = store.getDeviceUuid("p2");
                  const p2StoreData = window.localStorage.getItem("kafakafaya_store_p2");

                  window.localStorage.setItem("kafakafaya_device_uuid_p1", p2Uuid);
                  if (p2StoreData) {
                    window.localStorage.setItem("kafakafaya_store_p1", p2StoreData);
                  } else {
                    window.localStorage.removeItem("kafakafaya_store_p1");
                  }

                  store.logout("p2");
                  store.restoreProfile("p1", p2Uuid);

                  this.state.tempUsernameP2 = "";
                  this.state.tempPasswordP2 = "";
                  this.state.showP2Input = false;
                  this.state.p2Joined = false;
                  this.state.menuState = "PLAY_TYPE_SELECT";
                } else {
                  store.logout("p1");
                  this.state.menuState = "AUTH";
                  this.state.selectedAuthIdx = 0;
                  this.state.tempUsername = "";
                  this.state.tempPassword = "";
                  this.state.tempUsernameP2 = "";
                  this.state.tempPasswordP2 = "";
                  this.state.showP2Input = false;
                  this.state.p2Joined = false;
                }
              } else {
                store.logout("p2");
                this.state.tempUsernameP2 = "";
                this.state.tempPasswordP2 = "";
                this.state.showP2Input = false;
                this.state.p2Joined = false;
              }
              this.updateView();
            };

            const noBtn = document.createElement("button");
            noBtn.innerText = "HAYIR";
            noBtn.style.flex = "1";
            noBtn.style.padding = "6px";
            noBtn.style.background = "rgba(255, 255, 255, 0.05)";
            noBtn.style.border = "1px solid rgba(255, 255, 255, 0.15)";
            noBtn.style.color = "#ffffff";
            noBtn.style.borderRadius = "2px";
            noBtn.style.cursor = "pointer";
            noBtn.style.fontFamily = "inherit";
            noBtn.style.fontSize = "11px";
            noBtn.style.fontWeight = "800";
            noBtn.style.letterSpacing = "1px";
            noBtn.style.transition = "all 0.15s ease";
            noBtn.onmouseenter = () => {
              noBtn.style.background = "rgba(255, 255, 255, 0.15)";
            };
            noBtn.onmouseleave = () => {
              noBtn.style.background = "rgba(255, 255, 255, 0.05)";
            };
            noBtn.onclick = (evt) => {
              evt.stopPropagation();
              cleanup();
              confirmBox.remove();
            };

            btnRow.appendChild(yesBtn);
            btnRow.appendChild(noBtn);
            confirmBox.appendChild(btnRow);
            wrapper.appendChild(confirmBox);

            document.addEventListener("click", clickOutside);
          }
        };

        wrapper.appendChild(profileBtn);
        topRightGroup.appendChild(wrapper);
      }
    });

    // Settings Gear Button
    const settingsBtn = document.createElement("button");
    settingsBtn.className = "top-settings-btn";
    settingsBtn.style.padding = "8px 10px";
    settingsBtn.innerHTML = "⚙️";
    settingsBtn.onclick = (e) => {
      e.stopPropagation();
      if (this.state.inputCooldown) return;
      this.triggerCooldown();

      if (this.state.menuState === "SETTINGS") {
        this.state.menuState = this.state.prevMenuState || "PLAY_TYPE_SELECT";
        this.updateView();
      } else {
        this.state.prevMenuState = this.state.menuState;
        this.state.menuState = "SETTINGS";
        this.state.selectedSettingIdx = 0;
        this.updateView();
      }
    };
    topRightGroup.appendChild(settingsBtn);

    this.container.appendChild(topIndicators);
  }

  // --- VIEW UPDATE & ROUTER ---

  updateView() {
    this.contentArea.innerHTML = "";
    this.renderTopIndicators();

    const headerEl = this.container ? this.container.querySelector(".menu-header") : null;
    if (headerEl) {
      const titleEl = headerEl.querySelector(".menu-title");
      const subtitleEl = headerEl.querySelector(".menu-subtitle");

      if (this.state.menuState === "CAR_SELECT") {
        headerEl.style.display = "none";
      } else {
        headerEl.style.display = "block";
        if (this.state.menuState === "SETTINGS") {
          if (titleEl) titleEl.innerText = "Ayarlar";
          if (subtitleEl) subtitleEl.innerText = "OYUN ÖZELLİKLERİ VE KONTROLLER";
        } else if (this.state.menuState === "AUTH") {
          if (titleEl) titleEl.innerText = "Giriş Yap / Kaydol";
          if (subtitleEl) subtitleEl.innerText = "KULLANICI ADI GİRİŞİ";
        } else if (this.state.menuState === "SUGGEST_VEHICLE") {
          if (titleEl) titleEl.innerText = "Fikir Gönder";
          if (subtitleEl) subtitleEl.innerText = "İHA, FÜZE, YERALTI VEYA UZAY SİSTEMLERİ...";
        } else {
          if (titleEl) titleEl.innerText = "Kafa Kafaya";
          if (subtitleEl) subtitleEl.innerText = "İNSANSIZ SERMAYELER LİGİ";
        }
      }
    }

    const logoWrapper = this.container ? this.container.querySelector(".mth-logo-wrapper") : null;
    if (logoWrapper) {
      if (this.state.menuState === "CAR_SELECT") {
        logoWrapper.style.display = "none";
      } else {
        logoWrapper.style.display = "flex";
      }
    }

    switch (this.state.menuState) {
      case "PLAY_TYPE_SELECT":
        this.renderPlayTypeSelect();
        break;
      case "CAR_SELECT":
        this.renderCarSelect();
        break;
      case "SETTINGS":
        this.renderSettings();
        break;
      case "AUTH":
        this.renderAuth();
        break;
      case "SUGGEST_VEHICLE":
        this.renderSuggestVehicle();
        break;
    }
  }

  // --- STAGE 0: PLAY TYPE SELECT ---
  renderPlayTypeSelect() {
    const navContainer = document.createElement("div");
    navContainer.className = "menu-nav-list";

    // Game modes menu
    const trainingBtn = createNavButton({
      text: "ANTRENMAN",
      active: this.state.selectedPlayTypeIdx === 0,
      onClick: () => {
        if (this.state.inputCooldown) return;
        this.state.selectedPlayTypeIdx = 0;
        this.confirmPlayType(0);
      }
    });

    const localBtn = createNavButton({
      text: "OMUZ OMUZA",
      active: this.state.selectedPlayTypeIdx === 1,
      onClick: () => {
        if (this.state.inputCooldown) return;
        this.state.selectedPlayTypeIdx = 1;
        this.confirmPlayType(1);
      }
    });

    const onlineBtn = createNavButton({
      text: "ARKADAŞLARLA",
      active: this.state.selectedPlayTypeIdx === 2,
      onClick: () => {
        if (this.state.inputCooldown) return;
        this.state.selectedPlayTypeIdx = 2;
        this.confirmPlayType(2);
      }
    });

    navContainer.appendChild(trainingBtn);
    navContainer.appendChild(localBtn);
    navContainer.appendChild(onlineBtn);

    // Yatay Çizgi (Separator)
    const sep = document.createElement("div");
    sep.style.width = "100%";
    sep.style.height = "1px";
    sep.style.background = "linear-gradient(90deg, rgba(255,255,255,0.15), transparent)";
    sep.style.margin = "10px 0";
    navContainer.appendChild(sep);

    // "Sence nasıl insansızlar olsun?" butonu
    const suggestBtn = createNavButton({
      text: "Sence nasıl insansızlar olsun?",
      active: this.state.selectedPlayTypeIdx === 3,
      onClick: () => {
        if (this.state.inputCooldown) return;
        this.state.selectedPlayTypeIdx = 3;
        this.confirmPlayType(3);
      }
    });
    navContainer.appendChild(suggestBtn);

    this.contentArea.appendChild(navContainer);

    this.helpText.innerText = "";
  }

  updateAuthFocus() {
    if (this.state.menuState !== "AUTH") return;

    const p1Input = this.contentArea.querySelector(".p1-input");
    const p2Input = this.contentArea.querySelector(".p2-input");
    const buttons = this.contentArea.querySelectorAll(".menu-nav-item");

    // Remove active class from all buttons
    buttons.forEach(btn => btn.classList.remove("active"));

    // Set focus or active button highlight
    if (this.state.selectedAuthIdx === 0) {
      if (p1Input && document.activeElement !== p1Input) {
        p1Input.focus();
        p1Input.setSelectionRange(p1Input.value.length, p1Input.value.length);
      }
    } else if (this.state.selectedAuthIdx === 1 && this.state.showP2Input) {
      if (p2Input && document.activeElement !== p2Input) {
        p2Input.focus();
        p2Input.setSelectionRange(p2Input.value.length, p2Input.value.length);
      }
    } else {
      // It's a button. Blur inputs so focus styling is removed.
      if (document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA")) {
        document.activeElement.blur();
      }

      // Highlight the active button matching the index
      if (this.state.showP2Input) {
        if (this.state.selectedAuthIdx === 2) {
          const btn = buttons[0]; // remove button
          if (btn) btn.classList.add("active");
        } else if (this.state.selectedAuthIdx === 3) {
          const btn = buttons[1]; // submit button
          if (btn) btn.classList.add("active");
        }
      } else {
        if (this.state.selectedAuthIdx === 1) {
          const btn = buttons[0]; // add button
          if (btn) btn.classList.add("active");
        } else if (this.state.selectedAuthIdx === 2) {
          const btn = buttons[1]; // submit button
          if (btn) btn.classList.add("active");
        }
      }
    }
  }

  renderAuth() {
    const container = document.createElement("div");
    container.className = "menu-nav-list";
    container.style.width = "320px";
    container.style.margin = "0 auto";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "16px";

    // Dynamic focus & styling rule block
    const styleTag = document.createElement("style");
    styleTag.innerHTML = `
      .menu-auth-input {
        border: 1px solid rgba(255, 255, 255, 0.15) !important;
        outline: none !important;
      }
      .menu-auth-input:focus {
        border-color: var(--active-neon, #00f0ff) !important;
        box-shadow: 0 0 8px rgba(0, 240, 255, 0.2) !important;
      }
      .btn-secondary-auth {
        border-left: none !important;
        padding-left: 16px !important;
        padding-right: 16px !important;
        transition: all 0.15s ease !important;
        color: rgba(255, 255, 255, 0.4) !important;
        font-size: 11px !important;
        letter-spacing: 2px !important;
        font-weight: 800 !important;
      }
      .btn-secondary-auth:hover:not(:disabled) {
        color: rgba(255, 255, 255, 0.8) !important;
        border-left-color: transparent !important;
        padding-left: 16px !important;
        padding-right: 16px !important;
        text-shadow: none !important;
      }
      .btn-secondary-auth.active:not(:disabled) {
        color: #ffffff !important;
        border-color: rgba(255, 255, 255, 0.4) !important;
        border-left-color: transparent !important;
        padding-left: 16px !important;
        padding-right: 16px !important;
        text-shadow: none !important;
      }
    `;
    container.appendChild(styleTag);

    // P1 Username & Password Inputs
    const p1Wrapper = document.createElement("div");
    p1Wrapper.style.display = "flex";
    p1Wrapper.style.flexDirection = "column";
    p1Wrapper.style.gap = "6px";
    p1Wrapper.style.textAlign = "left";

    const p1Label = document.createElement("label");
    p1Label.style.fontSize = "10px";
    p1Label.style.fontWeight = "800";
    p1Label.style.letterSpacing = "2px";
    p1Label.style.color = "var(--text-muted, #888888)";
    p1Label.innerText = "1. OYNAYAN KULLANICI ADI VE ŞİFRE";
    p1Wrapper.appendChild(p1Label);

    const p1Row = document.createElement("div");
    p1Row.style.display = "flex";
    p1Row.style.gap = "8px";

    const p1Input = document.createElement("input");
    p1Input.type = "text";
    p1Input.className = "menu-auth-input p1-input";
    p1Input.placeholder = "Kullanıcı Adı";
    p1Input.style.flex = "1";
    p1Input.style.padding = "12px 16px";
    p1Input.style.background = "#111111";
    p1Input.style.borderRadius = "2px";
    p1Input.style.color = "#ffffff";
    p1Input.style.fontFamily = "inherit";
    p1Input.style.fontSize = "14px";
    p1Input.style.fontWeight = "600";
    p1Input.style.boxSizing = "border-box";
    p1Input.style.transition = "all 0.15s ease";

    p1Input.onfocus = () => {
      this.state.selectedAuthIdx = 0;
      const buttons = this.contentArea.querySelectorAll(".menu-nav-item");
      buttons.forEach(b => b.classList.remove("active"));
    };
    p1Input.value = this.state.tempUsername || "";
    p1Input.oninput = (e) => {
      this.state.tempUsername = e.target.value;
      if (this.state.authError) {
        this.state.authError = "";
        const errEl = container.querySelector(".auth-error-msg");
        if (errEl) errEl.remove();
      }
    };

    const p1PassInput = document.createElement("input");
    p1PassInput.type = "password";
    p1PassInput.className = "menu-auth-input p1-pass-input";
    p1PassInput.placeholder = "Şifre";
    p1PassInput.style.width = "110px";
    p1PassInput.style.padding = "12px 16px";
    p1PassInput.style.background = "#111111";
    p1PassInput.style.borderRadius = "2px";
    p1PassInput.style.color = "#ffffff";
    p1PassInput.style.fontFamily = "inherit";
    p1PassInput.style.fontSize = "14px";
    p1PassInput.style.fontWeight = "600";
    p1PassInput.style.boxSizing = "border-box";
    p1PassInput.style.transition = "all 0.15s ease";

    p1PassInput.onfocus = () => {
      this.state.selectedAuthIdx = 0;
      const buttons = this.contentArea.querySelectorAll(".menu-nav-item");
      buttons.forEach(b => b.classList.remove("active"));
    };
    p1PassInput.value = this.state.tempPassword || "";
    p1PassInput.oninput = (e) => {
      this.state.tempPassword = e.target.value;
      if (this.state.authError) {
        this.state.authError = "";
        const errEl = container.querySelector(".auth-error-msg");
        if (errEl) errEl.remove();
      }
    };

    p1Row.appendChild(p1Input);
    p1Row.appendChild(p1PassInput);
    p1Wrapper.appendChild(p1Row);
    container.appendChild(p1Wrapper);

    // Optional P2 field
    if (this.state.showP2Input) {
      const p2Wrapper = document.createElement("div");
      p2Wrapper.style.display = "flex";
      p2Wrapper.style.flexDirection = "column";
      p2Wrapper.style.gap = "6px";
      p2Wrapper.style.textAlign = "left";

      const p2Label = document.createElement("label");
      p2Label.style.fontSize = "10px";
      p2Label.style.fontWeight = "800";
      p2Label.style.letterSpacing = "2px";
      p2Label.style.color = "var(--text-muted, #888888)";
      p2Label.innerText = "2. OYNAYAN KULLANICI ADI VE ŞİFRE";
      p2Wrapper.appendChild(p2Label);

      const p2InputRow = document.createElement("div");
      p2InputRow.style.display = "flex";
      p2InputRow.style.alignItems = "stretch";
      p2InputRow.style.gap = "8px";

      const p2Input = document.createElement("input");
      p2Input.type = "text";
      p2Input.className = "menu-auth-input p2-input";
      p2Input.placeholder = "Kullanıcı Adı";
      p2Input.style.flex = "1";
      p2Input.style.padding = "12px 16px";
      p2Input.style.background = "#111111";
      p2Input.style.borderRadius = "2px";
      p2Input.style.color = "#ffffff";
      p2Input.style.fontFamily = "inherit";
      p2Input.style.fontSize = "14px";
      p2Input.style.fontWeight = "600";
      p2Input.style.boxSizing = "border-box";
      p2Input.style.transition = "all 0.15s ease";

      p2Input.onfocus = () => {
        this.state.selectedAuthIdx = 1;
        const buttons = this.contentArea.querySelectorAll(".menu-nav-item");
        buttons.forEach(b => b.classList.remove("active"));
      };
      p2Input.value = this.state.tempUsernameP2 || "";
      p2Input.oninput = (e) => {
        this.state.tempUsernameP2 = e.target.value;
        if (this.state.authError) {
          this.state.authError = "";
          const errEl = container.querySelector(".auth-error-msg");
          if (errEl) errEl.remove();
        }
      };
      p2InputRow.appendChild(p2Input);

      const p2PassInput = document.createElement("input");
      p2PassInput.type = "password";
      p2PassInput.className = "menu-auth-input p2-pass-input";
      p2PassInput.placeholder = "Şifre";
      p2PassInput.style.width = "110px";
      p2PassInput.style.padding = "12px 16px";
      p2PassInput.style.background = "#111111";
      p2PassInput.style.borderRadius = "2px";
      p2PassInput.style.color = "#ffffff";
      p2PassInput.style.fontFamily = "inherit";
      p2PassInput.style.fontSize = "14px";
      p2PassInput.style.fontWeight = "600";
      p2PassInput.style.boxSizing = "border-box";
      p2PassInput.style.transition = "all 0.15s ease";

      p2PassInput.onfocus = () => {
        this.state.selectedAuthIdx = 1;
        const buttons = this.contentArea.querySelectorAll(".menu-nav-item");
        buttons.forEach(b => b.classList.remove("active"));
      };
      p2PassInput.value = this.state.tempPasswordP2 || "";
      p2PassInput.oninput = (e) => {
        this.state.tempPasswordP2 = e.target.value;
        if (this.state.authError) {
          this.state.authError = "";
          const errEl = container.querySelector(".auth-error-msg");
          if (errEl) errEl.remove();
        }
      };
      p2InputRow.appendChild(p2PassInput);

      // Remove P2 button
      const removeP2Btn = createNavButton({
        text: "✕",
        active: this.state.selectedAuthIdx === 2,
        className: "btn-secondary-auth",
        onClick: () => {
          this.state.showP2Input = false;
          this.state.tempUsernameP2 = "";
          this.state.tempPasswordP2 = "";
          this.state.selectedAuthIdx = 0;
          this.state.authError = "";
          this.updateView();
        }
      });
      removeP2Btn.style.setProperty("background", "none", "important");
      removeP2Btn.style.setProperty("border", "none", "important");
      removeP2Btn.style.setProperty("padding", "0 12px", "important");
      removeP2Btn.style.display = "flex";
      removeP2Btn.style.alignItems = "center";
      removeP2Btn.style.justifyContent = "center";

      p2InputRow.appendChild(removeP2Btn);
      p2Wrapper.appendChild(p2InputRow);
      container.appendChild(p2Wrapper);
    } else {
      // Add P2 button
      const addP2Btn = createNavButton({
        text: "➕ 2. OYNAYAN EKLE",
        active: this.state.selectedAuthIdx === 1,
        className: "btn-secondary-auth",
        onClick: () => {
          this.state.showP2Input = true;
          this.state.selectedAuthIdx = 1;
          this.state.authError = "";
          this.updateView();
        }
      });
      addP2Btn.style.fontSize = "11px";
      container.appendChild(addP2Btn);
    }

    // Inline Error Message
    if (this.state.authError) {
      const errorMsg = document.createElement("div");
      errorMsg.className = "auth-error-msg";
      errorMsg.style.fontSize = "11px";
      errorMsg.style.fontWeight = "800";
      errorMsg.style.letterSpacing = "1px";
      errorMsg.style.color = "#ff4655";
      errorMsg.style.textAlign = "center";
      errorMsg.style.marginTop = "8px";
      errorMsg.style.lineHeight = "1.4";
      errorMsg.innerText = this.state.authError.toUpperCase();
      container.appendChild(errorMsg);
    }

    // Submit Button
    const submitIdx = this.state.showP2Input ? 3 : 2;
    const submitBtn = createNavButton({
      text: "TAMAM",
      active: this.state.selectedAuthIdx === submitIdx,
      onClick: () => {
        this.confirmAuthChoice(submitIdx);
      }
    });
    submitBtn.style.marginTop = "8px";
    container.appendChild(submitBtn);

    this.contentArea.appendChild(container);

    // Auto-focus current input only if it isn't already focused to prevent loop
    if (this.state.selectedAuthIdx === 0) {
      setTimeout(() => {
        const input = this.contentArea.querySelector(".p1-input");
        if (input && document.activeElement !== input) {
          input.focus();
          input.setSelectionRange(input.value.length, input.value.length);
        }
      }, 0);
    } else if (this.state.selectedAuthIdx === 1 && this.state.showP2Input) {
      setTimeout(() => {
        const input = this.contentArea.querySelector(".p2-input");
        if (input && document.activeElement !== input) {
          input.focus();
          input.setSelectionRange(input.value.length, input.value.length);
        }
      }, 0);
    }

    this.helpText.innerText = "";
  }

  async confirmAuthChoice(choice) {
    if (this.state.inputCooldown) return;
    this.triggerCooldown();

    const p1Val = (this.state.tempUsername || "").trim();
    const p1Pass = (this.state.tempPassword || "").trim();
    if (!p1Val || p1Val.length < 3) {
      this.state.authError = "1. Oynayan kullanıcı adı en az 3 karakter olmalıdır!";
      this.updateView();
      return;
    }
    if (!p1Pass || p1Pass.length < 3) {
      this.state.authError = "1. Oynayan şifresi en az 3 karakter olmalıdır!";
      this.updateView();
      return;
    }

    // Connect Player 1
    let p1Res = await store.usernameLogin(p1Val, p1Pass);
    if (!p1Res.success) {
      this.state.authError = `1. Oynayan Bağlantı Hatası: ${p1Res.error}`;
      this.updateView();
      return;
    }

    // Connect Player 2 if active and filled
    if (this.state.showP2Input) {
      const p2Val = (this.state.tempUsernameP2 || "").trim();
      const p2Pass = (this.state.tempPasswordP2 || "").trim();
      if (p2Val || p2Pass) {
        if (!p2Val || p2Val.length < 3) {
          this.state.authError = "2. Oynayan kullanıcı adı en az 3 karakter olmalıdır!";
          this.updateView();
          return;
        }
        if (!p2Pass || p2Pass.length < 3) {
          this.state.authError = "2. Oynayan şifresi en az 3 karakter olmalıdır!";
          this.updateView();
          return;
        }

        let p2Res = await store.usernameLogin(p2Val, p2Pass, "p2");
        if (!p2Res.success) {
          this.state.authError = `2. Oynayan Bağlantı Hatası: ${p2Res.error}`;
          this.updateView();
          return;
        }
      }
    }

    // Clear error on successful login
    this.state.authError = "";

    // Proceed to Main Menu
    this.state.menuState = "PLAY_TYPE_SELECT";
    this.state.selectedPlayTypeIdx = 0;
    this.updateView();
  }

  renderSettings() {
    const navContainer = document.createElement("div");
    navContainer.className = "menu-nav-list";

    let raw = localStorage.getItem("kafakafaya_settings");
    let settings = raw ? JSON.parse(raw) : { screenShake: true, sfx: true, showFps: false };

    const shakeBtn = createNavButton({
      text: `EKRAN SARSINTISI: ${settings.screenShake ? "AÇIK" : "KAPALI"}`,
      active: this.state.selectedSettingIdx === 0,
      onClick: () => {
        if (this.state.inputCooldown) return;
        this.state.selectedSettingIdx = 0;
        this.confirmSettingChoice(0);
      }
    });

    const sfxBtn = createNavButton({
      text: `SES & EFEKTLER: ${settings.sfx ? "AÇIK" : "KAPALI"}`,
      active: this.state.selectedSettingIdx === 1,
      onClick: () => {
        if (this.state.inputCooldown) return;
        this.state.selectedSettingIdx = 1;
        this.confirmSettingChoice(1);
      }
    });

    const fpsBtn = createNavButton({
      text: `FPS GÖSTERGESİ: ${settings.showFps ? "AÇIK" : "KAPALI"}`,
      active: this.state.selectedSettingIdx === 2,
      onClick: () => {
        if (this.state.inputCooldown) return;
        this.state.selectedSettingIdx = 2;
        this.confirmSettingChoice(2);
      }
    });

    const backBtn = createNavButton({
      text: "GERİ DÖN",
      active: this.state.selectedSettingIdx === 3,
      className: "nav-back",
      onClick: () => {
        if (this.state.inputCooldown) return;
        this.state.selectedSettingIdx = 3;
        this.confirmSettingChoice(3);
      }
    });

    navContainer.appendChild(shakeBtn);
    navContainer.appendChild(sfxBtn);
    navContainer.appendChild(fpsBtn);
    navContainer.appendChild(backBtn);
    this.contentArea.appendChild(navContainer);

    this.helpText.innerText = "";
  }

  confirmSettingChoice(choice) {
    this.triggerCooldown();
    let raw = localStorage.getItem("kafakafaya_settings");
    let settings = raw ? JSON.parse(raw) : { screenShake: true, sfx: true, showFps: false };

    if (choice === 0) {
      settings.screenShake = !settings.screenShake;
      localStorage.setItem("kafakafaya_settings", JSON.stringify(settings));
      this.updateView();
    } else if (choice === 1) {
      settings.sfx = !settings.sfx;
      localStorage.setItem("kafakafaya_settings", JSON.stringify(settings));
      k.volume(settings.sfx ? 1 : 0);
      this.updateView();
    } else if (choice === 2) {
      settings.showFps = !settings.showFps;
      localStorage.setItem("kafakafaya_settings", JSON.stringify(settings));
      this.updateView();
    } else if (choice === 3) {
      this.state.menuState = "PLAY_TYPE_SELECT";
      this.state.selectedPlayTypeIdx = 3;
      this.updateView();
    }
  }

  async confirmPlayType(choice) {
    this.triggerCooldown();
    this.state.gameMode = "NORMAL";

    if (choice === 0) {
      // ANTRENMAN (Local, Player 2 is BOT)
      k.isMultiplayer = false;
      this.state.p2Joined = false;
      this.state.menuState = "CAR_SELECT";
      this.setupPlayersState();
      this.updateView();
    } else if (choice === 1) {
      // OMUZ OMUZA (Local, Player 2 is Human)
      k.isMultiplayer = false;
      this.state.p2Joined = true;
      this.state.menuState = "CAR_SELECT";
      this.setupPlayersState();
      this.updateView();
    } else if (choice === 2) {
      // ARKADAŞLARLA (Multiplayer via Playroom)
      if (isConnected) {
        k.isMultiplayer = true;
        this.state.menuState = "CAR_SELECT";
        setState("menuState", "CAR_SELECT");
        setState("gameMode", "NORMAL");
        this.setupPlayersState();
        this.updateView();
        return;
      }

      this.contentArea.innerHTML = `
        <div class="menu-nav-list">
          <div class="nav-status-label status-online">ÇEVRİMİÇİ LOBİ</div>
          <h3 class="stage-title status-online" style="font-size: 16px; letter-spacing: 2px;">BAĞLANILIYOR...</h3>
        </div>
      `;

      try {
        let attempts = 0;
        const maxAttempts = 3;
        let success = false;

        if (typeof sessionStorage !== "undefined") {
          sessionStorage.setItem("playroom_connecting", "true");
        }

        while (attempts < maxAttempts && !success) {
          try {
            attempts++;
            await insertCoin({
              gameId: "kafakafaya",
              discord: false,
              skipLobby: true,
            });
            success = true;
            if (typeof sessionStorage !== "undefined") {
              sessionStorage.removeItem("playroom_connecting");
            }
          } catch (err) {
            console.warn(`Playroom connection attempt ${attempts} failed:`, err);
            // If connection failed and we have a room hash, clear it so next retry or click starts fresh
            if (window.location.hash && window.location.hash.includes("r=")) {
              console.log("Clearing stale room code from URL hash.");
              window.location.hash = "";
              if (window.history && window.history.replaceState) {
                window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
              }
            }
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 500));
            } else {
              throw err;
            }
          }
        }

        initMultiplayerListeners();
        k.isMultiplayer = true;
        this.state.menuState = "CAR_SELECT";
        setState("menuState", "CAR_SELECT");
        setState("gameMode", "NORMAL");
        this.setupPlayersState();
        this.updateView();
      } catch (e) {
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.removeItem("playroom_connecting");
        }
        console.error("Playroom final connection error:", e);
        this.contentArea.innerHTML = `
          <div class="menu-nav-list">
            <h3 class="stage-title status-online" style="font-size: 16px; letter-spacing: 2px; color: var(--active-primary);">BAĞLANTI HATASI!</h3>
          </div>
        `;
        setTimeout(() => {
          k.isMultiplayer = false;
          this.state.menuState = "PLAY_TYPE_SELECT";
          this.updateView();
        }, 1500);
      }
    } else if (choice === 3) {
      this.state.menuState = "SUGGEST_VEHICLE";
      this.state.selectedSuggestIdx = 0;
      this.updateView();
    }
  }

  renderSuggestVehicle() {
    const container = document.createElement("div");
    container.className = "menu-nav-list";
    container.style.width = "360px";
    container.style.margin = "0 auto";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "14px";

    const styleTag = document.createElement("style");
    styleTag.innerHTML = `
      .suggest-input-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
        width: 100%;
      }
      .suggest-input-label {
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 2px;
        color: rgba(255, 255, 255, 0.4);
        text-transform: uppercase;
      }
      .suggest-input-field {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #fff;
        font-family: inherit;
        font-size: 14px;
        padding: 10px 14px;
        border-radius: 4px;
        transition: all 0.2s ease;
        outline: none;
        width: 100%;
        box-sizing: border-box;
      }
      .suggest-input-field:focus {
        background: rgba(255, 255, 255, 0.05);
      }
      .name-input:focus {
        border-color: #00f0ff;
        box-shadow: 0 0 10px rgba(0, 240, 255, 0.4);
      }
      .skill-input:focus {
        border-color: #ff4655;
        box-shadow: 0 0 10px rgba(255, 70, 85, 0.4);
      }
      .problem-input:focus {
        border-color: #ffb800;
        box-shadow: 0 0 10px rgba(255, 184, 0, 0.4);
      }
      .design-input:focus {
        border-color: #bd5dff;
        box-shadow: 0 0 10px rgba(189, 93, 255, 0.4);
      }
      .contact-input:focus {
        border-color: #00e676;
        box-shadow: 0 0 10px rgba(0, 230, 118, 0.4);
      }
      .suggest-input-field::placeholder {
        color: rgba(255, 255, 255, 0.25);
        font-size: 13px;
      }
      .suggest-btn-group {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 10px;
        width: 100%;
      }
      .btn-secondary-suggest {
        border-left: none !important;
        padding-left: 16px !important;
        padding-right: 16px !important;
        transition: all 0.15s ease !important;
        color: rgba(255, 255, 255, 0.4) !important;
        font-size: 11px !important;
        letter-spacing: 2px !important;
        font-weight: 800 !important;
      }
      .btn-secondary-suggest:hover:not(:disabled) {
        color: rgba(255, 255, 255, 0.8) !important;
        border-left-color: transparent !important;
        padding-left: 16px !important;
        padding-right: 16px !important;
        text-shadow: none !important;
      }
      .btn-secondary-suggest.active:not(:disabled) {
        color: #ffffff !important;
        border-color: rgba(255, 255, 255, 0.4) !important;
        border-left-color: transparent !important;
        padding-left: 16px !important;
        padding-right: 16px !important;
        text-shadow: none !important;
      }
    `;
    container.appendChild(styleTag);

    if (!this.state.suggestData) {
      this.state.suggestData = {
        vehicleName: "",
        skillDescription: "",
        solvedProblem: "",
        designDescription: "",
        contactInfo: ""
      };
    }

    // Input 1: Sistem/Araç Adı
    const nameGroup = document.createElement("div");
    nameGroup.className = "suggest-input-group";
    const nameLabel = document.createElement("div");
    nameLabel.className = "suggest-input-label";
    nameLabel.innerText = "İNSANSIZ SİSTEM / SİLAH ADI *";
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "suggest-input-field name-input";
    nameInput.placeholder = "Örn: Ejder (İHA), Kasırga (Füze), Köstebek (Yeraltı)...";
    nameInput.value = this.state.suggestData.vehicleName;
    nameInput.oninput = (e) => {
      this.state.suggestData.vehicleName = e.target.value;
    };
    nameInput.onfocus = () => {
      this.state.selectedSuggestIdx = 0;
      this.updateSuggestFocus();
    };
    nameGroup.appendChild(nameLabel);
    nameGroup.appendChild(nameInput);
    container.appendChild(nameGroup);

    // Input 2: Özel Yeteneği
    const skillGroup = document.createElement("div");
    skillGroup.className = "suggest-input-group";
    const skillLabel = document.createElement("div");
    skillLabel.className = "suggest-input-label";
    skillLabel.innerText = "ÖZEL YETENEĞİ VEYA ETKİSİ *";
    const skillInput = document.createElement("input");
    skillInput.type = "text";
    skillInput.className = "suggest-input-field skill-input";
    skillInput.placeholder = "Örn: Kalkan açar, uzaydan lazer fırlatır, yer altından sızar...";
    skillInput.value = this.state.suggestData.skillDescription;
    skillInput.oninput = (e) => {
      this.state.suggestData.skillDescription = e.target.value;
    };
    skillInput.onfocus = () => {
      this.state.selectedSuggestIdx = 1;
      this.updateSuggestFocus();
    };
    skillGroup.appendChild(skillLabel);
    skillGroup.appendChild(skillInput);
    container.appendChild(skillGroup);

    // Input 3: Hangi Problemi Çözüyor
    const problemGroup = document.createElement("div");
    problemGroup.className = "suggest-input-group";
    const problemLabel = document.createElement("div");
    problemLabel.className = "suggest-input-label";
    problemLabel.innerText = "HANGİ PROBLEMİ ÇÖZÜYOR? (İSTEĞE BAĞLI)";
    const problemInput = document.createElement("input");
    problemInput.type = "text";
    problemInput.className = "suggest-input-field problem-input";
    problemInput.placeholder = "Örn: Havadaki İHA'ları vurur, görünmezleri açığa çıkarır...";
    problemInput.value = this.state.suggestData.solvedProblem || "";
    problemInput.oninput = (e) => {
      this.state.suggestData.solvedProblem = e.target.value;
    };
    problemInput.onfocus = () => {
      this.state.selectedSuggestIdx = 2;
      this.updateSuggestFocus();
    };
    problemGroup.appendChild(problemLabel);
    problemGroup.appendChild(problemInput);
    container.appendChild(problemGroup);

    // Input 4: Görünüm & Tasarım
    const designGroup = document.createElement("div");
    designGroup.className = "suggest-input-group";
    const designLabel = document.createElement("div");
    designLabel.className = "suggest-input-label";
    designLabel.innerText = "TASARIMI & GÖRÜNÜMÜ (İSTEĞE BAĞLI)";
    const designInput = document.createElement("input");
    designInput.type = "text";
    designInput.className = "suggest-input-field design-input";
    designInput.placeholder = "Örn: Roket gövdesi, delici matkap ucu, fütüristik İHA tasarımı...";
    designInput.value = this.state.suggestData.designDescription;
    designInput.oninput = (e) => {
      this.state.suggestData.designDescription = e.target.value;
    };
    designInput.onfocus = () => {
      this.state.selectedSuggestIdx = 3;
      this.updateSuggestFocus();
    };
    designGroup.appendChild(designLabel);
    designGroup.appendChild(designInput);
    container.appendChild(designGroup);

    // Input 5: İletişim
    const contactGroup = document.createElement("div");
    contactGroup.className = "suggest-input-group";
    const contactLabel = document.createElement("div");
    contactLabel.className = "suggest-input-label";
    contactLabel.innerText = "İLETİŞİM BİLGİSİ (İSTEĞE BAĞLI)";
    const contactInput = document.createElement("input");
    contactInput.type = "text";
    contactInput.className = "suggest-input-field contact-input";
    contactInput.placeholder = "E-posta, Instagram veya Telefon...";
    contactInput.value = this.state.suggestData.contactInfo;
    contactInput.oninput = (e) => {
      this.state.suggestData.contactInfo = e.target.value;
    };
    contactInput.onfocus = () => {
      this.state.selectedSuggestIdx = 4;
      this.updateSuggestFocus();
    };
    contactGroup.appendChild(contactLabel);
    contactGroup.appendChild(contactInput);
    container.appendChild(contactGroup);

    // Button Group
    const btnGroup = document.createElement("div");
    btnGroup.className = "suggest-btn-group";

    const submitBtn = createNavButton({
      text: "GÖNDER BAKALIM",
      active: this.state.selectedSuggestIdx === 5,
      onClick: () => {
        if (this.state.inputCooldown) return;
        this.confirmSuggestChoice(5);
      }
    });
    submitBtn.style.fontSize = "18px";
    submitBtn.style.paddingLeft = "16px";

    const backBtn = createNavButton({
      text: "GERİ DÖN",
      active: this.state.selectedSuggestIdx === 6,
      className: "btn-secondary-suggest",
      onClick: () => {
        if (this.state.inputCooldown) return;
        this.confirmSuggestChoice(6);
      }
    });
    backBtn.style.marginTop = "6px";

    btnGroup.appendChild(submitBtn);
    btnGroup.appendChild(backBtn);
    container.appendChild(btnGroup);

    this.contentArea.appendChild(container);
    this.updateSuggestFocus();
  }

  updateSuggestFocus() {
    if (this.state.menuState !== "SUGGEST_VEHICLE") return;

    const fields = [
      this.contentArea.querySelector(".name-input"),
      this.contentArea.querySelector(".skill-input"),
      this.contentArea.querySelector(".problem-input"),
      this.contentArea.querySelector(".design-input"),
      this.contentArea.querySelector(".contact-input")
    ];
    const buttons = this.contentArea.querySelectorAll(".menu-nav-item");

    buttons.forEach(btn => btn.classList.remove("active"));

    const idx = this.state.selectedSuggestIdx || 0;
    if (idx >= 0 && idx <= 4) {
      const field = fields[idx];
      if (field) {
        if (document.activeElement !== field) {
          field.focus();
        }
        field.setSelectionRange(field.value.length, field.value.length);
      }
    } else {
      if (document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA")) {
        document.activeElement.blur();
      }
      
      const btnIdx = idx - 5;
      if (buttons[btnIdx]) {
        buttons[btnIdx].classList.add("active");
      }
    }
  }

  async confirmSuggestChoice(choice) {
    this.triggerCooldown();

    if (choice === 5) {
      const data = this.state.suggestData || {};
      if (!data.vehicleName || !data.vehicleName.trim()) {
        const input = this.contentArea.querySelector(".name-input");
        if (input) {
          input.classList.add("shake-error");
          setTimeout(() => input.classList.remove("shake-error"), 350);
        }
        return;
      }
      if (!data.skillDescription || !data.skillDescription.trim()) {
        const input = this.contentArea.querySelector(".skill-input");
        if (input) {
          input.classList.add("shake-error");
          setTimeout(() => input.classList.remove("shake-error"), 350);
        }
        return;
      }

      const success = await store.saveVehicleIdea({
        vehicleName: data.vehicleName.trim(),
        skillName: "Genel Yetenek",
        skillDescription: data.skillDescription.trim(),
        solvedProblem: data.solvedProblem ? data.solvedProblem.trim() : "",
        designDescription: data.designDescription ? data.designDescription.trim() : "",
        contactInfo: data.contactInfo ? data.contactInfo.trim() : ""
      });

      if (success) {
        this.contentArea.innerHTML = `
          <div class="menu-nav-list" style="width: 360px; text-align: center; display: flex; flex-direction: column; gap: 20px; align-items: center;">
            <div style="font-size: 40px;">🚀</div>
            <h3 class="stage-title" style="color: var(--active-secondary); font-size: 18px; letter-spacing: 2px;">FİKİR ULAŞTI!</h3>
            <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5; margin: 0 0 10px 0;">Müthiş fikrin başarıyla kaydedildi. İnsansızların geleceğine katkıda bulunduğun için teşekkürler!</p>
          </div>
        `;
        setTimeout(() => {
          this.state.suggestData = null;
          this.state.menuState = "PLAY_TYPE_SELECT";
          this.state.selectedPlayTypeIdx = 3;
          this.updateView();
        }, 3000);
      } else {
        const submitBtn = this.contentArea.querySelectorAll(".menu-nav-item")[0];
        if (submitBtn) {
          submitBtn.classList.add("shake-error");
          setTimeout(() => submitBtn.classList.remove("shake-error"), 350);
        }
      }
    } else if (choice === 6) {
      this.state.menuState = "PLAY_TYPE_SELECT";
      this.state.selectedPlayTypeIdx = 3;
      this.updateView();
    }
  }

  // --- STAGE 2: CAR SELECT ---

  setupPlayersState() {
    const carOptions = Object.keys(CAR_TYPES);

    if (k.isMultiplayer) {
      this.state.players = playroomPlayers.map((p, idx) => {
        const playerColor = `rgb(${p.getProfile().color.r}, ${p.getProfile().color.g}, ${p.getProfile().color.b})`;
        const defaultCarIdx = carOptions.indexOf(store.getSelectedCar("p1"));
        return {
          playroomPlayer: p,
          id: p.id,
          profileId: p.id === myPlayer().id ? "p1" : null,
          name: p.getProfile().name || `Oyuncu ${idx + 1}`,
          color: playerColor,
          idx: p.getState("carTypeIdx") !== undefined ? p.getState("carTypeIdx") : (p.id === myPlayer().id ? (defaultCarIdx !== -1 ? defaultCarIdx : 0) : 0),
          ready: p.getState("ready") || false,
          focusRow: p.getState("focusRow") || "vehicle"
        };
      });
    } else {
      const p1Car = store.getSelectedCar("p1") || "BARKAN";
      const p1CarIdx = carOptions.indexOf(p1Car) !== -1 ? carOptions.indexOf(p1Car) : 0;

      const p2Car = store.getSelectedCar("p2") || "BARKAN";
      const p2CarIdx = carOptions.indexOf(p2Car) !== -1 ? carOptions.indexOf(p2Car) : 0;

      const p1Name = store.isGuest("p1") ? "Oyuncu 1" : store.getDeviceUuid("p1").toUpperCase();
      const p2Name = this.state.p2Joined
        ? (store.isGuest("p2") ? "Oyuncu 2" : store.getDeviceUuid("p2").toUpperCase())
        : "KKSAN_BOT";

      this.state.players = [
        {
          id: 0,
          profileId: "p1",
          name: p1Name,
          color: "#008cff",
          idx: p1CarIdx,
          ready: false,
          focusRow: "vehicle",
          cycleKeys: ["a", "d"],
          verticalKeys: ["w", "s"],
          btnKey: "space",
          helperText: "A-D / W-S / SPACE"
        },
        {
          id: 1,
          profileId: "p2",
          name: p2Name,
          color: "#ff3c3c",
          idx: p2CarIdx,
          ready: false,
          focusRow: "vehicle",
          cycleKeys: ["ArrowLeft", "ArrowRight"],
          verticalKeys: ["ArrowUp", "ArrowDown"],
          btnKey: "Enter",
          helperText: "YÖN TUŞLARI / ENTER"
        }
      ];
    }
  }

  renderCarSelect() {
    const stageHeader = document.createElement("div");
    stageHeader.className = "stage-header";
    stageHeader.innerHTML = `<h3 class="stage-title">ARAÇ SEÇİN</h3>`;
    this.contentArea.appendChild(stageHeader);

    const container = document.createElement("div");
    container.className = "car-select-layout";

    // Top Row for Player Previews
    const previewRow = document.createElement("div");
    previewRow.className = "players-preview-row";

    // Player 1
    const p1Obj = this.state.players[0];
    const p1Panel = this.renderCarPreviewPanel(p1Obj);
    previewRow.appendChild(p1Panel);

    // Player 2 (If active)
    if (this.state.p2Joined || k.isMultiplayer) {
      const p2Obj = this.state.players[1];
      if (p2Obj) {
        const p2Panel = this.renderCarPreviewPanel(p2Obj);
        previewRow.appendChild(p2Panel);
      } else {
        const emptyPanel = document.createElement("div");
        emptyPanel.className = "player-panel passive empty-waiting-panel";
        emptyPanel.innerHTML = `
          <h3 class="panel-name">OYUNCU 2</h3>
          <div class="panel-card" style="justify-content: center; opacity: 0.25;">
            <div style="font-size: 11px; font-weight: 700; letter-spacing: 1px; color: var(--text-muted);">
              OYUNCU BEKLENİYOR...
            </div>
          </div>
        `;
        previewRow.appendChild(emptyPanel);
      }
    }
    container.appendChild(previewRow);

    this.contentArea.appendChild(container);
    this.helpText.innerText = "";
  }

  renderCarPreviewPanel(pObj) {
    const carType = Object.keys(CAR_TYPES)[pObj.idx];
    const cfg = CAR_TYPES[carType];
    const isUnlocked = (k.isMultiplayer && pObj.id !== myPlayer().id)
      ? true
      : store.getUnlockedCars(pObj.profileId || "p1").includes(carType);

    const cost = CAR_COSTS[carType] || 0;
    const carClass = cfg.class || "DENGELI";
    const carSkillId = cfg.skillId || "default";

    let skillName = "BİLİNMİYOR";
    let skillIcon = "⚡";
    let skillDesc = "";
    const classSkills = SKILLS[carClass];
    if (classSkills && classSkills[carSkillId]) {
      skillName = classSkills[carSkillId].name;
      skillIcon = classSkills[carSkillId].icon || "⚡";
      skillDesc = classSkills[carSkillId].desc || "";
    }

    const activeProf = pObj.profileId || "p1";
    let selectedWKey;

    if (k.isMultiplayer && pObj.playroomPlayer) {
      selectedWKey = pObj.playroomPlayer.getState("selectedWeapon") || pObj.playroomPlayer.getState("selectedSupport") || "mizrak";
    } else {
      selectedWKey = store.getSelectedWeapon(activeProf) || store.getSelectedSupport(activeProf) || "mizrak";
    }

    const wInfo = PROJECTILES[selectedWKey] || { name: "Bilinmiyor", icon: "🚀" };

    const isWUnlocked = (k.isMultiplayer && pObj.id !== myPlayer().id)
      ? true
      : store.getUnlockedProjectiles(activeProf).includes(selectedWKey);

    const projectileKeys = Object.keys(PROJECTILES);

    const cycleWeapon = (dir) => {
      let idx = projectileKeys.indexOf(selectedWKey);
      if (idx === -1) idx = 0;
      const nextIdx = (idx + dir + projectileKeys.length) % projectileKeys.length;
      const nextKey = projectileKeys[nextIdx];
      const isWeapon = PROJECTILES[nextKey]?.category === "WEAPON";
      if (isWeapon) {
        store.setSelectedWeapon(activeProf, nextKey);
        if (k.isMultiplayer && pObj.id === myPlayer().id) {
          myPlayer().setState("selectedWeapon", nextKey);
        }
      } else {
        store.setSelectedSupport(activeProf, nextKey);
        if (k.isMultiplayer && pObj.id === myPlayer().id) {
          myPlayer().setState("selectedSupport", nextKey);
        }
      }
      this.updateView();
    };

    const previewData = {
      name: carType,
      color: pObj.color,
      width: cfg.width,
      height: cfg.height,
      radius: cfg.radius,
      class: carClass,
      skinId: store.getSelectedSkin(pObj.profileId || "p1", carType),
      skill: `${skillIcon} ${skillName}`,
      skillDesc: skillDesc,
      stats: [
        { name: "CAN", val: cfg.maxHp, max: 180, display: `${cfg.maxHp}` },
        { name: "HIZ", val: cfg.maxSpeed, max: 450, display: `${cfg.maxSpeed}` },
        { name: "KÜTLE", val: cfg.mass, max: 2.5, display: `${cfg.mass.toFixed(1)}` }
      ],
      weaponName: `${wInfo.icon} ${wInfo.name}`,
      weaponSpecs: {
        name: wInfo.name,
        type: wInfo.type,
        icon: wInfo.icon,
        damage: wInfo.damage,
        speed: wInfo.speed,
        explosionRadius: wInfo.explosionRadius,
        behavior: wInfo.behavior,
        category: wInfo.category,
        cost: wInfo.cost || 0
      },
      supportName: undefined,
      onPrevWeapon: () => cycleWeapon(-1),
      onNextWeapon: () => cycleWeapon(1),
      onPrevSupport: null,
      onNextSupport: null,
      isCarUnlocked: isUnlocked,
      isWeaponUnlocked: isWUnlocked,
      carCost: cost
    };

    let statusText = "";
    if (pObj.ready) {
      statusText = "KİLİTLENDİ";
    } else if (!isUnlocked) {
      statusText = `SATIN AL: 🪙${cost}`;
    } else if (!isWUnlocked) {
      statusText = `SATIN AL: 🪙${wInfo.cost || 0}`;
    } else {
      statusText = "KİLİTLE";
    }

    const isInteractive = k.isMultiplayer ? (pObj.id === myPlayer().id) : (pObj.profileId !== "p2" || this.state.p2Joined);

    const coinsVal = (k.isMultiplayer && pObj.id !== myPlayer().id) ? undefined : store.getCoins(activeProf);

    return createPlayerSelectorPanel({
      name: pObj.name,
      color: pObj.color,
      ready: pObj.ready,
      isMapSelect: false,
      previewData,
      focusRow: pObj.focusRow || "vehicle",
      onPrev: () => this.handleCycle(pObj, -1),
      onNext: () => this.handleCycle(pObj, 1),
      onConfirm: () => this.handleConfirm(pObj),
      onFocusRow: (row) => {
        pObj.focusRow = row;
        if (k.isMultiplayer && pObj.id === myPlayer().id) {
          myPlayer().setState("focusRow", row);
        }
        this.updateView();
      },
      isInteractive,
      coins: coinsVal,
      statusText: (pObj.profileId === "p2" && !this.state.p2Joined) ? "PASİF" : statusText,
      helperText: isInteractive ? pObj.helperText : (k.isMultiplayer ? "DİĞER OYUNCU SEÇİYOR..." : "KATILMAK İÇİN BİR TUŞA BASIN")
    });
  }

  renderCarGridPanel() {
    const gridPanel = document.createElement("div");
    gridPanel.className = "car-grid-panel";

    // --- 1. VEHICLE SELECTION ---
    const carSection = document.createElement("div");
    carSection.style.width = "100%";
    carSection.style.display = "flex";
    carSection.style.flexDirection = "column";
    carSection.style.alignItems = "center";
    carSection.style.marginBottom = "5px";

    const title = document.createElement("div");
    title.className = "car-grid-title";
    title.innerText = "ARAÇ SEÇİM HAVUZU";
    carSection.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "car-grid";

    // Determine current active selector profile
    let activeSelectProfile = "p1";
    let activePlayerObj = this.state.players[0];
    if (k.isMultiplayer) {
      activePlayerObj = this.state.players.find(p => p.id === myPlayer().id);
      activeSelectProfile = "p1";
    } else {
      const p1 = this.state.players[0];
      const p2 = this.state.players[1];
      if (p1 && !p1.ready) {
        activePlayerObj = p1;
        activeSelectProfile = "p1";
      } else if (p2 && this.state.p2Joined && !p2.ready) {
        activePlayerObj = p2;
        activeSelectProfile = "p2";
      }
    }

    const carTypes = Object.keys(CAR_TYPES);
    carTypes.forEach((carType, carIndex) => {
      const cfg = CAR_TYPES[carType];
      const isLocked = !store.getUnlockedCars(activeSelectProfile).includes(carType);

      const p1Obj = this.state.players[0];
      const isSelectedByP1 = (p1Obj.idx === carIndex);

      const p2Obj = this.state.players[1];
      const isSelectedByP2 = p2Obj && (p2Obj.profileId !== "p2" || this.state.p2Joined) && (p2Obj.idx === carIndex);

      const itemSkin = isSelectedByP1 ? store.getSelectedSkin("p1", carType) : (isSelectedByP2 ? store.getSelectedSkin("p2", carType) : "default");

      const card = createCarGridCard({
        carType,
        cfg,
        isLocked,
        isSelectedByP1,
        isSelectedByP2,
        p1Color: p1Obj.color,
        p2Color: p2Obj ? p2Obj.color : "#ff3c3c",
        itemSkin,
        onClick: () => {
          if (k.isMultiplayer) {
            const meObj = this.state.players.find(p => p.id === myPlayer().id);
            if (meObj && !meObj.ready) {
              const checkLocked = !store.getUnlockedCars("p1").includes(carType);
              if (checkLocked) {
                k.shake(3);
                const panelEl = this.contentArea.querySelectorAll('.player-panel')[0];
                if (panelEl) {
                  panelEl.classList.add('shake-error');
                  setTimeout(() => panelEl.classList.remove('shake-error'), 400);
                }
                return;
              }
              meObj.idx = carIndex;
              myPlayer().setState("carTypeIdx", carIndex);
              myPlayer().setState("skinId", store.getSelectedSkin("p1", carType));
              myPlayer().setState("skillId", store.getSelectedSkill("p1", carType));
              this.updateView();
            }
          } else {
            const p1 = this.state.players[0];
            const p2 = this.state.players[1];
            if (p1 && !p1.ready) {
              const checkLocked = !store.getUnlockedCars("p1").includes(carType);
              if (checkLocked) {
                k.shake(3);
                const panelEl = this.contentArea.querySelectorAll('.player-panel')[0];
                if (panelEl) {
                  panelEl.classList.add('shake-error');
                  setTimeout(() => panelEl.classList.remove('shake-error'), 400);
                }
                return;
              }
              p1.idx = carIndex;
            } else if (p2 && this.state.p2Joined && !p2.ready) {
              const checkLocked = !store.getUnlockedCars("p2").includes(carType);
              if (checkLocked) {
                k.shake(3);
                const panelEl = this.contentArea.querySelectorAll('.player-panel')[1];
                if (panelEl) {
                  panelEl.classList.add('shake-error');
                  setTimeout(() => panelEl.classList.remove('shake-error'), 400);
                }
                return;
              }
              p2.idx = carIndex;
            }
            this.updateView();
          }
        }
      });

      grid.appendChild(card);
    });

    carSection.appendChild(grid);
    gridPanel.appendChild(carSection);

    // --- 2. DIVIDER LINE ---
    const divider = document.createElement("div");
    divider.style.width = "100%";
    divider.style.height = "1px";
    divider.style.background = "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent)";
    divider.style.margin = "10px 0 14px 0";
    gridPanel.appendChild(divider);

    // --- 3. SUPPORT SELECTION ---
    const supportSection = document.createElement("div");
    supportSection.style.width = "100%";
    supportSection.style.display = "flex";
    supportSection.style.flexDirection = "column";
    supportSection.style.alignItems = "center";

    const supportTitle = document.createElement("div");
    supportTitle.className = "car-grid-title";
    supportTitle.innerText = "MÜHİMMAT & DESTEK SEÇİM HAVUZU";
    supportSection.appendChild(supportTitle);

    const supportGrid = document.createElement("div");
    supportGrid.className = "car-grid";

    // Gather all projectile keys
    const supportKeys = Object.keys(PROJECTILES);

    supportKeys.forEach((supportKey) => {
      const projCfg = PROJECTILES[supportKey];
      const isLocked = !store.getUnlockedProjectiles(activeSelectProfile).includes(supportKey);

      // Determine selection status
      const p1Obj = this.state.players[0];
      let p1Weapon, p1Support;
      if (k.isMultiplayer && p1Obj.playroomPlayer) {
        p1Weapon = p1Obj.playroomPlayer.getState("selectedWeapon") || "mizrak";
        p1Support = p1Obj.playroomPlayer.getState("selectedSupport") || "mini_iha";
      } else {
        p1Weapon = store.getSelectedWeapon("p1");
        p1Support = store.getSelectedSupport("p1");
      }

      const p2Obj = this.state.players[1];
      let p2Weapon = null, p2Support = null;
      if (p2Obj && (p2Obj.profileId !== "p2" || this.state.p2Joined)) {
        if (k.isMultiplayer && p2Obj.playroomPlayer) {
          p2Weapon = p2Obj.playroomPlayer.getState("selectedWeapon") || "mizrak";
          p2Support = p2Obj.playroomPlayer.getState("selectedSupport") || "mini_iha";
        } else {
          p2Weapon = store.getSelectedWeapon("p2");
          p2Support = store.getSelectedSupport("p2");
        }
      }

      const isWeapon = projCfg.category === "WEAPON";
      const isSelectedByP1 = isWeapon ? (p1Weapon === supportKey) : (p1Support === supportKey);
      const isSelectedByP2 = p2Obj && (p2Obj.profileId !== "p2" || this.state.p2Joined) && (isWeapon ? (p2Weapon === supportKey) : (p2Support === supportKey));

      const card = createSupportGridCard({
        projKey: supportKey,
        projCfg,
        isLocked,
        isSelectedByP1,
        isSelectedByP2,
        p1Color: p1Obj.color,
        p2Color: p2Obj ? p2Obj.color : "#ff3c3c",
        onClick: () => {
          if (k.isMultiplayer) {
            const meObj = this.state.players.find(p => p.id === myPlayer().id);
            if (meObj && !meObj.ready) {
              const checkLocked = !store.getUnlockedProjectiles("p1").includes(supportKey);
              if (checkLocked) {
                k.shake(3);
                const panelEl = this.contentArea.querySelectorAll('.player-panel')[0];
                if (panelEl) {
                  panelEl.classList.add('shake-error');
                  setTimeout(() => panelEl.classList.remove('shake-error'), 400);
                }
                return;
              }
              if (isWeapon) {
                store.setSelectedWeapon("p1", supportKey);
                myPlayer().setState("selectedWeapon", supportKey);
              } else {
                store.setSelectedSupport("p1", supportKey);
                myPlayer().setState("selectedSupport", supportKey);
              }
              this.updateView();
            }
          } else {
            const p1 = this.state.players[0];
            const p2 = this.state.players[1];
            if (p1 && !p1.ready) {
              const checkLocked = !store.getUnlockedProjectiles("p1").includes(supportKey);
              if (checkLocked) {
                k.shake(3);
                const panelEl = this.contentArea.querySelectorAll('.player-panel')[0];
                if (panelEl) {
                  panelEl.classList.add('shake-error');
                  setTimeout(() => panelEl.classList.remove('shake-error'), 400);
                }
                return;
              }
              if (isWeapon) {
                store.setSelectedWeapon("p1", supportKey);
              } else {
                store.setSelectedSupport("p1", supportKey);
              }
            } else if (p2 && this.state.p2Joined && !p2.ready) {
              const checkLocked = !store.getUnlockedProjectiles("p2").includes(supportKey);
              if (checkLocked) {
                k.shake(3);
                const panelEl = this.contentArea.querySelectorAll('.player-panel')[1];
                if (panelEl) {
                  panelEl.classList.add('shake-error');
                  setTimeout(() => panelEl.classList.remove('shake-error'), 400);
                }
                return;
              }
              if (isWeapon) {
                store.setSelectedWeapon("p2", supportKey);
              } else {
                store.setSelectedSupport("p2", supportKey);
              }
            }
            this.updateView();
          }
        }
      });

      supportGrid.appendChild(card);
    });

    supportSection.appendChild(supportGrid);
    gridPanel.appendChild(supportSection);

    return gridPanel;
  }

  handleCycle(pObj, dir) {
    if (this.state.inputCooldown || pObj.ready) return;
    const allCarTypes = Object.keys(CAR_TYPES);

    pObj.idx = (pObj.idx + dir + allCarTypes.length) % allCarTypes.length;

    if (k.isMultiplayer && pObj.id === myPlayer().id) {
      myPlayer().setState("carTypeIdx", pObj.idx);
      const type = allCarTypes[pObj.idx];
      myPlayer().setState("skinId", store.getSelectedSkin("p1", type));
      myPlayer().setState("skillId", store.getSelectedSkill("p1", type));
    }

    this.updateView();
  }

  cycleWeapon(pObj, dir) {
    if (this.state.inputCooldown || pObj.ready) return;
    const activeProf = pObj.profileId || "p1";
    let selectedWKey;
    if (k.isMultiplayer && pObj.playroomPlayer) {
      selectedWKey = pObj.playroomPlayer.getState("selectedWeapon") || pObj.playroomPlayer.getState("selectedSupport") || "mizrak";
    } else {
      selectedWKey = store.getSelectedWeapon(activeProf) || store.getSelectedSupport(activeProf) || "mizrak";
    }
    const projectileKeys = Object.keys(PROJECTILES);
    let idx = projectileKeys.indexOf(selectedWKey);
    if (idx === -1) idx = 0;
    const nextIdx = (idx + dir + projectileKeys.length) % projectileKeys.length;
    const nextKey = projectileKeys[nextIdx];
    const isWeapon = PROJECTILES[nextKey]?.category === "WEAPON";
    if (isWeapon) {
      store.setSelectedWeapon(activeProf, nextKey);
      if (k.isMultiplayer && pObj.id === myPlayer().id) {
        myPlayer().setState("selectedWeapon", nextKey);
      }
    } else {
      store.setSelectedSupport(activeProf, nextKey);
      if (k.isMultiplayer && pObj.id === myPlayer().id) {
        myPlayer().setState("selectedSupport", nextKey);
      }
    }
    this.updateView();
  }

  handleConfirm(pObj) {
    if (this.state.inputCooldown || pObj.ready) return;

    const activeProf = pObj.profileId || "p1";
    const type = Object.keys(CAR_TYPES)[pObj.idx];
    const isUnlocked = (k.isMultiplayer && pObj.id !== myPlayer().id)
      ? true
      : store.getUnlockedCars(activeProf).includes(type);

    let selectedWKey;
    if (k.isMultiplayer && pObj.playroomPlayer) {
      selectedWKey = pObj.playroomPlayer.getState("selectedWeapon") || pObj.playroomPlayer.getState("selectedSupport") || "mizrak";
    } else {
      selectedWKey = store.getSelectedWeapon(activeProf) || store.getSelectedSupport(activeProf) || "mizrak";
    }
    const isWUnlocked = (k.isMultiplayer && pObj.id !== myPlayer().id)
      ? true
      : store.getUnlockedProjectiles(activeProf).includes(selectedWKey);

    const triggerErrorShake = () => {
      k.shake(3);
      const panelEl = this.contentArea.querySelectorAll('.player-panel')[pObj.profileId === "p2" ? 1 : 0];
      if (panelEl) {
        panelEl.classList.add('shake-error');
        setTimeout(() => panelEl.classList.remove('shake-error'), 400);
      }
    };

    if (pObj.focusRow === "vehicle" && !isUnlocked) {
      if (k.isMultiplayer && pObj.id !== myPlayer().id) return;
      const cost = CAR_COSTS[type] || 0;
      const success = store.unlockCar(activeProf, type, cost);
      if (success) {
        this.updateView();
      } else {
        triggerErrorShake();
      }
      return;
    }

    if (pObj.focusRow === "weapon" && !isWUnlocked) {
      if (k.isMultiplayer && pObj.id !== myPlayer().id) return;
      const wInfo = PROJECTILES[selectedWKey] || { cost: 0 };
      const cost = wInfo.cost || 0;
      const success = store.unlockProjectile(activeProf, selectedWKey, cost);
      if (success) {
        this.updateView();
      } else {
        triggerErrorShake();
      }
      return;
    }

    // If trying to confirm but one of them is locked (even if not currently focused)
    if (!isUnlocked || !isWUnlocked) {
      triggerErrorShake();
      return;
    }

    if (pObj.profileId) {
      store.setSelectedCar(pObj.profileId, type);
    }

    if (k.isMultiplayer) {
      if (pObj.id !== myPlayer().id) return;
      myPlayer().setState("skinId", store.getSelectedSkin("p1", type));
      myPlayer().setState("skillId", store.getSelectedSkill("p1", type));
      myPlayer().setState("ready", true);
    } else {
      pObj.ready = true;
      this.updateView();
      this.checkStartCarLocal();
    }
  }

  triggerP2Join() {
    if (this.state.p2Joined) return;
    this.state.p2Joined = true;

    this.setupPlayersState();
    this.updateView();
  }

  checkStartCarLocal() {
    if (this.state.hostCarTransitioning) return;
    const activePlayers = this.state.players.filter(p => p.profileId !== "p2" || this.state.p2Joined);
    if (activePlayers.every(p => p.ready)) {
      this.state.hostCarTransitioning = true;
      setTimeout(() => {
        const options = Object.keys(CAR_TYPES);
        const p1Type = options[this.state.players[0].idx];
        const p2Type = this.state.p2Joined ? options[this.state.players[1].idx] : options[Math.floor(k.rand(0, options.length))];

        // Dismount UI Overlay before switching scene
        this.dismount();

        k.go("game", {
          p1Type,
          p2Type,
          p1Skin: store.getSelectedSkin("p1", p1Type),
          p2Skin: this.state.p2Joined ? store.getSelectedSkin("p2", p2Type) : "default",
          p1Skill: store.getSelectedSkill("p1", p1Type),
          p2Skill: this.state.p2Joined ? store.getSelectedSkill("p2", p2Type) : "default",
          p1Weapon: store.getSelectedWeapon("p1"),
          p2Weapon: this.state.p2Joined ? store.getSelectedWeapon("p2") : "mizrak",
          p1Support: store.getSelectedSupport("p1"),
          p2Support: this.state.p2Joined ? store.getSelectedSupport("p2") : "mini_iha",
          gameMode: this.state.gameMode,
          p2Joined: this.state.p2Joined,
        });
      }, 600);
    }
  }

  // --- KEYBOARD & CONTROLS BINDING ---

  setupKeyboardInput() {
    this.keyboardListener = (e) => {
      if (document.querySelector(".modal-overlay")) return;
      if (this.state.inputCooldown) return;
      const key = e.key;

      if (document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA")) {
        // Allow ArrowUp/ArrowDown/Escape/Enter for navigation/actions, but block rest (like game shortcuts)
        if ((this.state.menuState === "AUTH" || this.state.menuState === "AUTH_P2" || this.state.menuState === "SUGGEST_VEHICLE") && ["ArrowUp", "ArrowDown", "Escape", "Enter"].includes(key)) {
          // Allow to fall through
        } else {
          return;
        }
      }

      if (key === "Escape") {
        if (!k.isMultiplayer) {
          if (this.state.menuState === "CAR_SELECT") {
            this.triggerCooldown();
            this.state.menuState = "PLAY_TYPE_SELECT";
            this.updateView();
            return;
          }
        }
      }

      if (this.state.menuState === "PLAY_TYPE_SELECT") {
        const maxIdx = 4;

        if (this.state.selectedPlayTypeIdx === undefined || this.state.selectedPlayTypeIdx >= maxIdx) {
          this.state.selectedPlayTypeIdx = 0;
        }

        if (key === "w" || key === "ArrowUp") {
          this.state.selectedPlayTypeIdx = (this.state.selectedPlayTypeIdx - 1 + maxIdx) % maxIdx;
          this.updateView();
        } else if (key === "s" || key === "ArrowDown") {
          this.state.selectedPlayTypeIdx = (this.state.selectedPlayTypeIdx + 1) % maxIdx;
          this.updateView();
        } else if (key === " " || key === "Enter") {
          this.confirmPlayType(this.state.selectedPlayTypeIdx);
        }
      } else if (this.state.menuState === "SETTINGS") {
        if (this.state.selectedSettingIdx === undefined) this.state.selectedSettingIdx = 0;
        if (key === "w" || key === "ArrowUp") {
          this.state.selectedSettingIdx = (this.state.selectedSettingIdx - 1 + 5) % 5;
          this.updateView();
        } else if (key === "s" || key === "ArrowDown") {
          this.state.selectedSettingIdx = (this.state.selectedSettingIdx + 1) % 5;
          this.updateView();
        } else if (key === " " || key === "Enter") {
          this.confirmSettingChoice(this.state.selectedSettingIdx);
        } else if (key === "Escape") {
          this.triggerCooldown();
          this.state.menuState = this.state.prevMenuState || "PLAY_TYPE_SELECT";
          this.updateView();
        }
      } else if (this.state.menuState === "AUTH") {
        const maxIdx = this.state.showP2Input ? 4 : 3;
        if (this.state.selectedAuthIdx === undefined || this.state.selectedAuthIdx >= maxIdx) {
          this.state.selectedAuthIdx = 0;
        }

        if (key === "w" || key === "ArrowUp") {
          this.state.selectedAuthIdx = (this.state.selectedAuthIdx - 1 + maxIdx) % maxIdx;
          this.updateAuthFocus();
        } else if (key === "s" || key === "ArrowDown") {
          this.state.selectedAuthIdx = (this.state.selectedAuthIdx + 1) % maxIdx;
          this.updateAuthFocus();
        } else if (key === " " || key === "Enter") {
          if (this.state.selectedAuthIdx === 0) {
            if (key === "Enter") {
              const submitIdx = this.state.showP2Input ? 3 : 2;
              this.confirmAuthChoice(submitIdx);
            }
          } else if (this.state.selectedAuthIdx === 1) {
            if (this.state.showP2Input) {
              if (key === "Enter") {
                const submitIdx = this.state.showP2Input ? 3 : 2;
                this.confirmAuthChoice(submitIdx);
              }
            } else {
              this.state.showP2Input = true;
              this.state.selectedAuthIdx = 1;
              this.updateView();
            }
          } else if (this.state.selectedAuthIdx === 2) {
            if (this.state.showP2Input) {
              this.state.showP2Input = false;
              this.state.tempUsernameP2 = "";
              this.state.selectedAuthIdx = 0;
              this.updateView();
            } else {
              this.confirmAuthChoice(2);
            }
          } else if (this.state.selectedAuthIdx === 3) {
            this.confirmAuthChoice(3);
          }
        } else if (key === "Escape") {
          if (this.state.prevMenuState === "SETTINGS") {
            this.triggerCooldown();
            this.state.menuState = "SETTINGS";
            this.state.selectedSettingIdx = 3;
            this.updateView();
          }
        }
      } else if (this.state.menuState === "SUGGEST_VEHICLE") {
        const maxIdx = 7;
        if (this.state.selectedSuggestIdx === undefined || this.state.selectedSuggestIdx >= maxIdx) {
          this.state.selectedSuggestIdx = 0;
        }

        if (key === "w" || key === "ArrowUp") {
          this.state.selectedSuggestIdx = (this.state.selectedSuggestIdx - 1 + maxIdx) % maxIdx;
          this.updateSuggestFocus();
        } else if (key === "s" || key === "ArrowDown") {
          this.state.selectedSuggestIdx = (this.state.selectedSuggestIdx + 1) % maxIdx;
          this.updateSuggestFocus();
        } else if (key === " " || key === "Enter") {
          if (this.state.selectedSuggestIdx === 5 || this.state.selectedSuggestIdx === 6) {
            this.confirmSuggestChoice(this.state.selectedSuggestIdx);
          } else if (key === "Enter") {
            if (this.state.selectedSuggestIdx < 4) {
              this.state.selectedSuggestIdx++;
              this.updateSuggestFocus();
            } else {
              this.confirmSuggestChoice(5);
            }
          }
        } else if (key === "Escape") {
          this.confirmSuggestChoice(6);
        }
      } else {
        // MAP OR CAR SELECT
        if (k.isMultiplayer) {
          const meObj = this.state.players.find(p => p.id === myPlayer().id);
          if (meObj && !meObj.ready) {
            if (key === "a" || key === "ArrowLeft") {
              if (meObj.focusRow === "weapon") {
                this.cycleWeapon(meObj, -1);
              } else {
                this.handleCycle(meObj, -1);
              }
            } else if (key === "d" || key === "ArrowRight") {
              if (meObj.focusRow === "weapon") {
                this.cycleWeapon(meObj, 1);
              } else {
                this.handleCycle(meObj, 1);
              }
            } else if (key === "w" || key === "ArrowUp") {
              meObj.focusRow = "vehicle";
              myPlayer().setState("focusRow", "vehicle");
              this.updateView();
            } else if (key === "s" || key === "ArrowDown") {
              meObj.focusRow = "weapon";
              myPlayer().setState("focusRow", "weapon");
              this.updateView();
            } else if (key === " " || key === "Enter") {
              this.handleConfirm(meObj);
            }
          }
        } else {
          this.state.players.forEach(p => {
            if (p.profileId === "p2" && !this.state.p2Joined) return;
            if (p.ready) return;

            if (p.cycleKeys.includes(key)) {
              const dir = key === p.cycleKeys[0] ? -1 : 1;
              if (p.focusRow === "weapon") {
                this.cycleWeapon(p, dir);
              } else {
                this.handleCycle(p, dir);
              }
            } else if (p.verticalKeys && p.verticalKeys.includes(key)) {
              const row = key === p.verticalKeys[0] ? "vehicle" : "weapon";
              p.focusRow = row;
              this.updateView();
            } else if (key === p.btnKey || (p.btnKey === "space" && key === " ")) {
              this.handleConfirm(p);
            }
          });
        }
      }
    };

    window.addEventListener("keydown", this.keyboardListener);
  }

  // --- MULTIPLAYER ROOM STATS SYNCING LOOP ---

  startStateSyncLoop() {
    this.updateInterval = setInterval(() => {
      if (!k.isMultiplayer) return;

      if (isHost()) {
        setState("hostId", myPlayer().id);
      }

      if (this.state.menuState === "PLAY_TYPE_SELECT") {
        if (getState("menuState") === "CAR_SELECT") {
          this.state.menuState = "CAR_SELECT";
          this.state.gameMode = getState("gameMode") || "NORMAL";
          this.setupPlayersState();
          this.updateView();
        }
      } else if (this.state.menuState === "CAR_SELECT") {
        let changed = false;
        this.state.players.forEach(pObj => {
          const syncedIdx = pObj.playroomPlayer.getState("carTypeIdx") || 0;
          const syncedReady = pObj.playroomPlayer.getState("ready") || false;
          const syncedFocus = pObj.playroomPlayer.getState("focusRow") || "vehicle";
          if (pObj.idx !== syncedIdx || pObj.ready !== syncedReady || pObj.focusRow !== syncedFocus) {
            pObj.idx = syncedIdx;
            pObj.ready = syncedReady;
            pObj.focusRow = syncedFocus;
            changed = true;
          }
        });

        if (changed) this.updateView();

        if (isHost()) {
          const allReady = playroomPlayers.every(p => p.getState("ready"));
          if (allReady && getState("gameState") !== "playing" && !this.state.hostCarTransitioning) {
            this.state.hostCarTransitioning = true;
            setTimeout(() => {
              setState("gameState", "playing");
            }, 600);
          }
        }

        if (getState("gameState") === "playing") {
          this.dismount();
          k.go("game");
        }
      }
    }, 100);
  }
}

export const menuOverlay = new HTMLMenuManager();
