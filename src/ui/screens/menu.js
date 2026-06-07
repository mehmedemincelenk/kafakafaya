import { k } from "../../kaplay.js";
import { CAR_TYPES, PROJECTILES } from "../../config.js";
import { store, CAR_COSTS } from "../../store.js";
import { playroomPlayers, isConnected, initMultiplayerListeners } from "../../multiplayer.js";
import { insertCoin, myPlayer, isHost, setState, getState, getRoomCode } from "playroomkit";
import { spawnExplosion, getTurkishGuestName } from "../../utils.js";
import { SKILLS } from "../../skill.js";
import { MAPS } from "../../maps.js";
import {
  createNavButton,
  createPlayerSelectorPanel,
  drawHTMLCarDetails,
  drawHTMLProjectileDetails,
  createCarGridCard,
  createSupportGridCard
} from "../components.js";
import { renderAuth, confirmAuthChoice, updateAuthFocus } from "./menu/auth.js";
import { renderSettings, confirmSettingChoice } from "./menu/settings.js";
import { renderSuggestVehicle, updateSuggestFocus, confirmSuggestChoice } from "./menu/suggest.js";
import {
  renderMultiplayerLobbySelect,
  renderMultiplayerCustomHost,
  renderMultiplayerJoin,
  confirmLobbyChoice,
  confirmCustomHostChoice,
  confirmJoinChoice
} from "./menu/lobby.js";
import {
  setupPlayersState,
  renderCarSelect,
  renderCarPreviewPanel,
  renderCarGridPanel,
  handleCycle,
  cycleWeapon,
  handleConfirm,
  triggerP2Join,
  checkStartCarLocal
} from "./menu/carSelect.js";

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

function generateRandomRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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

    const hasRoomCode = /[#?&]r=/i.test(window.location.hash || "") || /[?&]r=/i.test(window.location.search || "");
    if (this.state.menuState === "PLAY_TYPE_SELECT" && hasRoomCode) {
      this.state.selectedPlayTypeIdx = 2;
      setTimeout(() => {
        this.confirmPlayType(2);
      }, 0);
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
    logoCredits.innerHTML = "IGD | FATİH, M.CAN VE DİĞER HAFIZ'LARIN KATKILARIYLA,<br>LÜLEBURGAZ KIRKLARELİ DİYANET İLÇE MÜFTÜLÜĞÜ KATKILARIYLA";

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

    if (this.state.menuState === "AUTH") {
      return;
    }

    const topIndicators = document.createElement("div");
    topIndicators.className = "top-indicators";

    if (this.state.menuState === "CAR_SELECT") {
      topIndicators.style.justifyContent = "space-between";
      const backBtn = document.createElement("button");
      backBtn.className = "top-settings-btn";
      backBtn.style.pointerEvents = "auto";
      backBtn.innerHTML = "⬅️ MENÜYE DÖN";
      backBtn.onclick = () => {
        if (this.state.inputCooldown) return;
        this.triggerCooldown();
        if (k.isMultiplayer) {
          window.location.hash = "";
          window.location.reload();
        } else {
          this.state.menuState = "PLAY_TYPE_SELECT";
          this.updateView();
        }
      };
      topIndicators.appendChild(backBtn);
    }

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
      case "MULTIPLAYER_LOBBY_SELECT":
        this.renderMultiplayerLobbySelect();
        break;
      case "MULTIPLAYER_CUSTOM_HOST":
        this.renderMultiplayerCustomHost();
        break;
      case "MULTIPLAYER_JOIN":
        this.renderMultiplayerJoin();
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
    // Add style tag for suggest promo animations if not present
    let styleTag = document.getElementById("suggest-promo-styles");
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = "suggest-promo-styles";
      styleTag.innerHTML = `
        @keyframes promo-float-kemankes {
          0% { transform: translateX(-50%) translateY(0) rotate(-15deg); }
          50% { transform: translateX(-50%) translateY(-3px) rotate(-13deg); }
          100% { transform: translateX(-50%) translateY(0) rotate(-15deg); }
        }
        @keyframes promo-float-hifzatullah {
          0% { transform: translateX(-50%) translateY(0) scaleX(-1); }
          50% { transform: translateX(-50%) translateY(2px) scaleX(-1); }
          100% { transform: translateX(-50%) translateY(0) scaleX(-1); }
        }
        @keyframes promo-jet-flame {
          0% { transform: scaleX(0.85) scaleY(0.9); }
          100% { transform: scaleX(1.4) scaleY(1.1); }
        }
        .suggest-kemankes, .suggest-hifzatullah {
          opacity: 0.65;
          transition: opacity 0.3s ease;
        }
        .menu-nav-item.active .suggest-kemankes,
        .menu-nav-item:hover .suggest-kemankes,
        .menu-nav-item.active .suggest-hifzatullah,
        .menu-nav-item:hover .suggest-hifzatullah {
          opacity: 1;
        }
      `;
      document.head.appendChild(styleTag);
    }

    const suggestBtn = createNavButton({
      text: "Sence nasıl insansızlar olsun?",
      active: this.state.selectedPlayTypeIdx === 3,
      onClick: () => {
        if (this.state.inputCooldown) return;
        this.state.selectedPlayTypeIdx = 3;
        this.confirmPlayType(3);
      }
    });

    suggestBtn.style.position = "relative";

    // Kemankes
    const kemankesContainer = document.createElement("div");
    kemankesContainer.className = "suggest-kemankes";
    kemankesContainer.style.position = "absolute";
    kemankesContainer.style.left = "49%";
    kemankesContainer.style.top = "-24px";
    kemankesContainer.style.pointerEvents = "none";
    kemankesContainer.style.animation = "promo-float-kemankes 3s ease-in-out infinite";
    
    const kemankesEl = document.createElement("div");
    kemankesEl.style.position = "relative";
    kemankesEl.style.filter = "drop-shadow(0 0 6px rgba(0, 240, 255, 0.45))";
    drawHTMLProjectileDetails(kemankesEl, "kemankes_1", "#d2d4dc", 0.85);

    // Jet flame tail
    const flame = document.createElement("div");
    flame.style.position = "absolute";
    flame.style.left = "-13px";
    flame.style.top = "20%";
    flame.style.width = "14px";
    flame.style.height = "60%";
    flame.style.background = "linear-gradient(to left, #ffcc00, #ff3300, transparent)";
    flame.style.borderRadius = "2px 0 0 2px";
    flame.style.transformOrigin = "right center";
    flame.style.animation = "promo-jet-flame 0.1s infinite alternate";
    kemankesEl.appendChild(flame);
    kemankesContainer.appendChild(kemankesEl);

    // Hifzatullah
    const hifzatullahContainer = document.createElement("div");
    hifzatullahContainer.className = "suggest-hifzatullah";
    hifzatullahContainer.style.position = "absolute";
    hifzatullahContainer.style.left = "57%";
    hifzatullahContainer.style.bottom = "-38px";
    hifzatullahContainer.style.zIndex = "-1";
    hifzatullahContainer.style.pointerEvents = "none";
    hifzatullahContainer.style.animation = "promo-float-hifzatullah 4s ease-in-out infinite";

    const hifzatullahEl = document.createElement("div");
    hifzatullahEl.style.position = "relative";
    hifzatullahEl.style.filter = "drop-shadow(0 0 8px rgba(0, 240, 255, 0.35))";
    drawHTMLCarDetails(hifzatullahEl, "HIFZATULLAH", "#233c46", null, 0.85);
    hifzatullahContainer.appendChild(hifzatullahEl);

    suggestBtn.appendChild(kemankesContainer);
    suggestBtn.appendChild(hifzatullahContainer);
    navContainer.appendChild(suggestBtn);

    this.contentArea.appendChild(navContainer);

    this.helpText.innerText = "";
  }

  updateAuthFocus() {
    updateAuthFocus.call(this);
  }

  renderAuth() {
    renderAuth.call(this);
  }

  confirmAuthChoice(choice) {
    return confirmAuthChoice.call(this, choice);
  }

  renderSettings() {
    renderSettings.call(this);
  }

  confirmSettingChoice(choice) {
    confirmSettingChoice.call(this, choice);
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

      // If we got a URL hash with a room code, connect immediately!
      if (window.location.hash && window.location.hash.includes("r=")) {
        this.connectPlayroom();
      } else {
        // Otherwise transition to multiplayer lobby select screen
        this.state.menuState = "MULTIPLAYER_LOBBY_SELECT";
        this.state.selectedLobbyIdx = 0;
        this.updateView();
      }
    } else if (choice === 3) {
      this.state.menuState = "SUGGEST_VEHICLE";
      this.state.selectedSuggestIdx = 0;
      this.updateView();
    }
  }

  async connectPlayroom(roomCode = null) {
    this.triggerCooldown();
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
          const options = {
            gameId: "kafakafaya",
            discord: false,
            skipLobby: true,
            maxPlayersPerRoom: 2
          };

          let resolvedCode = roomCode;
          if (!resolvedCode) {
            const hashMatch = (window.location.hash || "").match(/[#?&]r=([^&]+)/i);
            if (hashMatch) {
              resolvedCode = hashMatch[1];
            } else {
              const searchMatch = (window.location.search || "").match(/[?&]r=([^&]+)/i);
              if (searchMatch) {
                resolvedCode = searchMatch[1];
              }
            }
          }

          if (resolvedCode) {
            options.roomCode = resolvedCode.trim().toUpperCase();
          }

          await insertCoin(options);
          success = true;
          if (typeof sessionStorage !== "undefined") {
            sessionStorage.removeItem("playroom_connecting");
          }
        } catch (err) {
          console.warn(`Playroom connection attempt ${attempts} failed:`, err);
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
      try {
        myPlayer().setState("username", store.getDeviceUuid("p1"));
      } catch (err) {
        console.error("Failed to set playroom username state:", err);
      }
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
        this.state.menuState = "MULTIPLAYER_LOBBY_SELECT";
        this.state.selectedLobbyIdx = 0;
        this.updateView();
      }, 1500);
    }
  }

  confirmLobbyChoice(idx) {
    confirmLobbyChoice.call(this, idx);
  }

  confirmCustomHostChoice(idx) {
    confirmCustomHostChoice.call(this, idx);
  }

  confirmJoinChoice(idx) {
    confirmJoinChoice.call(this, idx);
  }

  renderMultiplayerLobbySelect() {
    renderMultiplayerLobbySelect.call(this);
  }

  renderMultiplayerCustomHost() {
    renderMultiplayerCustomHost.call(this);
  }

  renderMultiplayerJoin() {
    renderMultiplayerJoin.call(this);
  }

  renderSuggestVehicle() {
    renderSuggestVehicle.call(this);
  }

  updateSuggestFocus() {
    updateSuggestFocus.call(this);
  }

  confirmSuggestChoice(choice) {
    return confirmSuggestChoice.call(this, choice);
  }

  setupPlayersState() {
    setupPlayersState.call(this);
  }

  renderCarSelect() {
    renderCarSelect.call(this);
  }

  renderCarPreviewPanel(pObj) {
    return renderCarPreviewPanel.call(this, pObj);
  }

  renderCarGridPanel() {
    return renderCarGridPanel.call(this);
  }

  handleCycle(pObj, dir) {
    handleCycle.call(this, pObj, dir);
  }

  cycleWeapon(pObj, dir) {
    cycleWeapon.call(this, pObj, dir);
  }

  handleConfirm(pObj) {
    handleConfirm.call(this, pObj);
  }

  triggerP2Join() {
    triggerP2Join.call(this);
  }

  checkStartCarLocal() {
    checkStartCarLocal.call(this);
  }

  // --- KEYBOARD & CONTROLS BINDING ---

  setupKeyboardInput() {
    this.keyboardListener = (e) => {
      if (document.querySelector(".modal-overlay")) return;
      if (this.state.inputCooldown) return;
      const key = e.key;

      if (document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA")) {
        // Allow ArrowUp/ArrowDown/Escape/Enter for navigation/actions, but block rest (like game shortcuts)
        if ((this.state.menuState === "AUTH" || this.state.menuState === "AUTH_P2" || this.state.menuState === "SUGGEST_VEHICLE" || this.state.menuState === "MULTIPLAYER_CUSTOM_HOST" || this.state.menuState === "MULTIPLAYER_JOIN") && ["ArrowUp", "ArrowDown", "Escape", "Enter"].includes(key)) {
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
      } else if (this.state.menuState === "MULTIPLAYER_LOBBY_SELECT") {
        const maxIdx = 3;
        if (this.state.selectedLobbyIdx === undefined || this.state.selectedLobbyIdx >= maxIdx) {
          this.state.selectedLobbyIdx = 0;
        }
        if (key === "w" || key === "ArrowUp") {
          this.state.selectedLobbyIdx = (this.state.selectedLobbyIdx - 1 + maxIdx) % maxIdx;
          this.updateView();
        } else if (key === "s" || key === "ArrowDown") {
          this.state.selectedLobbyIdx = (this.state.selectedLobbyIdx + 1) % maxIdx;
          this.updateView();
        } else if (key === " " || key === "Enter") {
          this.confirmLobbyChoice(this.state.selectedLobbyIdx);
        } else if (key === "Escape") {
          this.state.menuState = "PLAY_TYPE_SELECT";
          this.state.selectedPlayTypeIdx = 2;
          this.updateView();
        }
      } else if (this.state.menuState === "MULTIPLAYER_CUSTOM_HOST") {
        const maxIdx = 3;
        if (this.state.selectedCustomHostIdx === undefined || this.state.selectedCustomHostIdx >= maxIdx) {
          this.state.selectedCustomHostIdx = 0;
        }
        if (key === "w" || key === "ArrowUp") {
          this.state.selectedCustomHostIdx = (this.state.selectedCustomHostIdx - 1 + maxIdx) % maxIdx;
          this.updateView();
        } else if (key === "s" || key === "ArrowDown") {
          this.state.selectedCustomHostIdx = (this.state.selectedCustomHostIdx + 1) % maxIdx;
          this.updateView();
        } else if (key === "Enter" || (key === " " && this.state.selectedCustomHostIdx !== 0)) {
          this.confirmCustomHostChoice(this.state.selectedCustomHostIdx);
        } else if (key === "Escape") {
          this.state.menuState = "MULTIPLAYER_LOBBY_SELECT";
          this.state.selectedLobbyIdx = 0;
          this.updateView();
        }
      } else if (this.state.menuState === "MULTIPLAYER_JOIN") {
        const maxIdx = 3;
        if (this.state.selectedJoinIdx === undefined || this.state.selectedJoinIdx >= maxIdx) {
          this.state.selectedJoinIdx = 0;
        }
        if (key === "w" || key === "ArrowUp") {
          this.state.selectedJoinIdx = (this.state.selectedJoinIdx - 1 + maxIdx) % maxIdx;
          this.updateView();
        } else if (key === "s" || key === "ArrowDown") {
          this.state.selectedJoinIdx = (this.state.selectedJoinIdx + 1) % maxIdx;
          this.updateView();
        } else if (key === "Enter" || (key === " " && this.state.selectedJoinIdx !== 0)) {
          this.confirmJoinChoice(this.state.selectedJoinIdx);
        } else if (key === "Escape") {
          this.state.menuState = "MULTIPLAYER_LOBBY_SELECT";
          this.state.selectedLobbyIdx = 1;
          this.updateView();
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

        // Dynamic player join/quit detection
        if (this.state.players.length !== playroomPlayers.length) {
          this.setupPlayersState();
          changed = true;
        }

        this.state.players.forEach(pObj => {
          if (!pObj.playroomPlayer) return;
          const syncedIdx = pObj.playroomPlayer.getState("carTypeIdx") || 0;
          const syncedReady = pObj.playroomPlayer.getState("ready") || false;
          const syncedFocus = pObj.playroomPlayer.getState("focusRow") || "vehicle";
          const syncedWeapon = pObj.playroomPlayer.getState("selectedWeapon") || "mizrak";
          const syncedSupport = pObj.playroomPlayer.getState("selectedSupport") || "mini_iha";

          const pUsername = pObj.playroomPlayer.getState("username");
          let displayName = pObj.name;
          if (pUsername) {
            const isGuest = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pUsername) || (pUsername.length >= 15 && !pUsername.includes("-"));
            displayName = isGuest ? getTurkishGuestName(pUsername) : pUsername.toUpperCase();
          }

          if (
            pObj.idx !== syncedIdx ||
            pObj.ready !== syncedReady ||
            pObj.focusRow !== syncedFocus ||
            pObj.name !== displayName ||
            pObj.selectedWeapon !== syncedWeapon ||
            pObj.selectedSupport !== syncedSupport
          ) {
            pObj.idx = syncedIdx;
            pObj.ready = syncedReady;
            pObj.focusRow = syncedFocus;
            pObj.name = displayName;
            pObj.selectedWeapon = syncedWeapon;
            pObj.selectedSupport = syncedSupport;
            changed = true;
          }
        });

        if (this.state.players.length > playroomPlayers.length) {
          this.state.players = this.state.players.slice(0, playroomPlayers.length);
          changed = true;
        }

        if (changed) this.updateView();

        if (isHost()) {
          const allReady = playroomPlayers.length >= 2 && playroomPlayers.every(p => p.getState("ready"));
          if (allReady && getState("gameState") !== "playing" && !this.state.hostCarTransitioning) {
            this.state.hostCarTransitioning = true;
            
            // Choose the map before transitioning to playing state to avoid race condition!
            const randomMap = k.choose(MAPS);
            setState("gameMap", randomMap.name);
            setState("blueScore", 0);
            setState("redScore", 0);
            setState("roundOver", false);
            setState("roundWinner", null);
            setState("isGamePaused", false);

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
