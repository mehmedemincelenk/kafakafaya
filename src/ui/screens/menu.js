import { k } from "../../kaplay.js";
import { CAR_TYPES, PROJECTILES } from "../../config.js";
import { store, CAR_COSTS } from "../../store.js";
import { playroomPlayers, isConnected, initMultiplayerListeners } from "../../multiplayer.js";
import { insertCoin, myPlayer, isHost, setState, getState } from "playroomkit";
import { spawnExplosion } from "../../utils.js";
import { SKILLS } from "../../skill.js";
import {
  createButton,
  createNavButton,
  createSelectionCard,
  createPlayerSelectorPanel,
  drawHTMLCarDetails,
  createCarGridCard,
  createSupportGridCard
} from "../components.js";

// Import styles
import "../menu.css";
import mthLogo from "../../../mth_logo.png";

class HTMLMenuManager {
  constructor() {
    this.root = document.getElementById("ui-root");
    this.container = null;
    this.state = {
      menuState: "PLAY_TYPE_SELECT", // "PLAY_TYPE_SELECT" | "CAR_SELECT"
      gameMode: "NORMAL",
      selectedPlayTypeIdx: 0, // 0: YEREL, 1: BERABER
      p2Joined: false,
      players: [], // List of rendered player state objects
      inputCooldown: false,
      hostCarTransitioning: false,
      selectedManufacturer: "DEFAULT"
    };
    this.keyboardListener = null;
    this.updateInterval = null;
  }

  mount() {
    this.root.innerHTML = "";

    this.container = document.createElement("div");
    this.container.className = "menu-overlay-container";
    this.root.appendChild(this.container);

    this.renderIndicators();

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

    const logoImg = document.createElement("img");
    logoImg.src = mthLogo;
    logoImg.className = "mth-logo";
    this.container.appendChild(logoImg);

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

  // --- RENDER HELPERS ---

  renderIndicators() {
    const wrapper = document.createElement("div");
    wrapper.className = "top-indicators";

    // P1 Stats (Left)
    this.statsIndicator = document.createElement("div");
    this.statsIndicator.className = "stats-indicator";
    wrapper.appendChild(this.statsIndicator);

    // Coins (Right)
    const rightGroup = document.createElement("div");
    rightGroup.className = "top-right-group";

    // P2 Join Guide Button (HTML version of joinButton)
    this.joinGuideBtn = createButton({
      text: "OYUNCU 2 EKLE",
      variant: "primary",
      onClick: () => this.triggerP2Join()
    });
    rightGroup.appendChild(this.joinGuideBtn);

    this.coinIndicator = document.createElement("div");
    this.coinIndicator.className = "coins-indicator";
    rightGroup.appendChild(this.coinIndicator);

    // Store button next to coins
    this.topStoreBtn = createButton({
      text: "🛒 MAĞAZA",
      variant: "gold",
      onClick: () => {
        this.dismount();
        k.go("store");
      }
    });
    rightGroup.appendChild(this.topStoreBtn);

    wrapper.appendChild(rightGroup);
    this.container.appendChild(wrapper);

    this.updateTopIndicators();
  }

  updateTopIndicators() {
    const stats = store.getStats();
    this.statsIndicator.innerHTML = `🏆 ${stats.wins} &nbsp; 💀 ${stats.losses} &nbsp; 🎮 ${stats.gamesPlayed}`;
    this.coinIndicator.innerHTML = `🪙 ${store.getCoins()}`;

    // Show/Hide indicators depending on state
    if (this.state.menuState === "CAR_SELECT") {
      this.statsIndicator.style.display = "none";
      this.coinIndicator.style.display = "none";
      this.joinGuideBtn.style.display = "none";
      this.topStoreBtn.style.display = "none";
    } else {
      this.statsIndicator.style.display = "block";
      this.coinIndicator.style.display = "block";
      this.joinGuideBtn.style.display = (this.state.p2Joined || k.isMultiplayer) ? "none" : "block";
      this.topStoreBtn.style.display = "block";
    }
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

  // --- VIEW UPDATE & ROUTER ---

  updateView() {
    this.contentArea.innerHTML = "";
    this.updateTopIndicators();

    const headerEl = this.container ? this.container.querySelector(".menu-header") : null;
    if (headerEl) {
      if (this.state.menuState === "CAR_SELECT") {
        headerEl.style.display = "none";
      } else {
        headerEl.style.display = "block";
      }
    }

    switch (this.state.menuState) {
      case "PLAY_TYPE_SELECT":
        this.renderPlayTypeSelect();
        break;
      case "MODE_SELECT":
        this.renderModeSelect();
        break;
      case "CAR_SELECT":
        this.renderCarSelect();
        break;
    }
  }

  // --- STAGE 0: PLAY TYPE SELECT ---
  renderPlayTypeSelect() {
    const navContainer = document.createElement("div");
    navContainer.className = "menu-nav-list";

    const localBtn = createNavButton({
      text: "YAN YANA OYNA",
      active: this.state.selectedPlayTypeIdx === 0,
      onClick: () => {
        if (this.state.inputCooldown) return;
        this.state.selectedPlayTypeIdx === 0 ? this.confirmPlayType(0) : (this.state.selectedPlayTypeIdx = 0, this.updateView());
      }
    });

    const onlineBtn = createNavButton({
      text: "İNTERNETTEN OYNA",
      active: this.state.selectedPlayTypeIdx === 1,
      onClick: () => {
        if (this.state.inputCooldown) return;
        this.state.selectedPlayTypeIdx === 1 ? this.confirmPlayType(1) : (this.state.selectedPlayTypeIdx = 1, this.updateView());
      }
    });

    navContainer.appendChild(localBtn);
    navContainer.appendChild(onlineBtn);
    this.contentArea.appendChild(navContainer);

    this.helpText.innerText = "YÖN TUŞLARI VEYA WASD İLE SEÇİN • SPACE / ENTER İLE ONAYLAYIN";
  }

  async confirmPlayType(type) {
    this.triggerCooldown();
    this.state.gameMode = "NORMAL";
    this.state.selectedModeIdx = 0; // Default to normal mod

    if (type === 0) {
      k.isMultiplayer = false;
      this.state.menuState = "MODE_SELECT";
      this.updateView();
    } else {
      if (isConnected) {
        k.isMultiplayer = true;
        this.state.menuState = "MODE_SELECT";
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
        await insertCoin({
          gameId: "kafakafaya",
          discord: false,
          skipLobby: true,
        });
        initMultiplayerListeners();
        k.isMultiplayer = true;
        this.state.menuState = "MODE_SELECT";
        this.updateView();
      } catch (e) {
        this.contentArea.innerHTML = `
          <div class="menu-nav-list">
            <h3 class="stage-title status-online" style="font-size: 16px; letter-spacing: 2px; color: var(--active-primary);">BAĞLANTI HATASI!</h3>
          </div>
        `;
        setTimeout(() => {
          k.isMultiplayer = false;
          this.state.menuState = "MODE_SELECT";
          this.updateView();
        }, 1500);
      }
    }
  }

  // --- STAGE 1: MODE SELECT ---
  renderModeSelect() {
    const isOnline = k.isMultiplayer;
    const navContainer = document.createElement("div");
    navContainer.className = "menu-nav-list";

    const statusLabel = document.createElement("div");
    statusLabel.className = `nav-status-label ${isOnline ? 'status-online' : 'status-local'}`;
    statusLabel.innerText = isOnline ? "ÇEVRİMİÇİ LOBİ" : "YEREL LOBİ";
    navContainer.appendChild(statusLabel);

    const normalBtn = createNavButton({
      text: "NORMAL MOD",
      active: this.state.selectedModeIdx === 0,
      onClick: () => {
        if (this.state.inputCooldown) return;
        if (isOnline && !isHost()) return;
        this.state.selectedModeIdx === 0 ? this.confirmMode() : (this.state.selectedModeIdx = 0, this.updateModeUIHost());
      }
    });

    const cargoBtn = createNavButton({
      text: "GEZEGENLER ARASI KARGOCULUK",
      active: this.state.selectedModeIdx === 1,
      disabled: true,
      onClick: () => { }
    });

    const timeBtn = createNavButton({
      text: "ZAMANA KARŞI",
      active: this.state.selectedModeIdx === 2,
      disabled: true,
      onClick: () => { }
    });

    const survivalBtn = createNavButton({
      text: "HAYATTA KALMA",
      active: this.state.selectedModeIdx === 3,
      disabled: true,
      onClick: () => { }
    });

    const backBtn = createNavButton({
      text: "GERİ DÖN",
      active: this.state.selectedModeIdx === 4,
      className: "nav-back",
      onClick: () => {
        if (this.state.inputCooldown) return;
        if (this.state.selectedModeIdx === 4) {
          this.triggerCooldown();
          this.state.menuState = "PLAY_TYPE_SELECT";
          this.state.selectedPlayTypeIdx = 0;
          this.updateView();
        } else {
          this.state.selectedModeIdx = 4;
          this.updateView();
        }
      }
    });

    navContainer.appendChild(normalBtn);
    navContainer.appendChild(cargoBtn);
    navContainer.appendChild(timeBtn);
    navContainer.appendChild(survivalBtn);
    navContainer.appendChild(backBtn);
    this.contentArea.appendChild(navContainer);

    this.helpText.innerText = (isOnline && !isHost())
      ? "KURUCUNUN OYUN MODUNU SEÇMESİ BEKLENİYOR..."
      : "YÖN TUŞLARI VEYA WASD İLE SEÇİN • SPACE / ENTER İLE ONAYLAYIN";
  }

  updateModeUIHost() {
    if (k.isMultiplayer) setState("selectedModeIdx", this.state.selectedModeIdx);
    this.updateView();
  }

  confirmMode() {
    if (this.state.inputCooldown) return;
    if (k.isMultiplayer && !isHost()) return;

    this.triggerCooldown();
    this.state.gameMode = "NORMAL";

    if (k.isMultiplayer) {
      setState("gameMode", this.state.gameMode);
      setState("menuState", "CAR_SELECT");
    }

    this.state.menuState = "CAR_SELECT";
    this.setupPlayersState();
    this.updateView();
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
        };
      });
    } else {
      const p1Car = store.getSelectedCar("p1") || "BARKAN";
      const p1CarIdx = carOptions.indexOf(p1Car) !== -1 ? carOptions.indexOf(p1Car) : 0;

      const p2Car = store.getSelectedCar("p2") || "BARKAN";
      const p2CarIdx = carOptions.indexOf(p2Car) !== -1 ? carOptions.indexOf(p2Car) : 0;

      this.state.players = [
        {
          id: 0,
          profileId: "p1",
          name: "Oyuncu 1",
          color: "#008cff",
          idx: p1CarIdx,
          ready: false,
          cycleKeys: ["a", "d"],
          btnKey: "space",
          helperText: "A-D / SPACE"
        },
        {
          id: 1,
          profileId: "p2",
          name: "Oyuncu 2",
          color: "#ff3c3c",
          idx: p2CarIdx,
          ready: false,
          cycleKeys: ["ArrowLeft", "ArrowRight"],
          btnKey: "Enter",
          helperText: "YÖN TUSLARI / ENTER"
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

    // 1. Left Large Panel (Player 1)
    const p1Obj = this.state.players[0];
    const p1Panel = this.renderCarPreviewPanel(p1Obj);
    container.appendChild(p1Panel);

    // 2. Middle Grid Panel (Car Selection Grid)
    const gridPanel = this.renderCarGridPanel();
    container.appendChild(gridPanel);

    // 3. Right Large Panel (Player 2)
    const p2Obj = this.state.players[1];
    if (p2Obj) {
      const p2Panel = this.renderCarPreviewPanel(p2Obj);
      container.appendChild(p2Panel);
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
      container.appendChild(emptyPanel);
    }

    this.contentArea.appendChild(container);
    this.helpText.innerText = "SEÇMEK İÇİN YÖN / WASD TUŞLARINA TIKLAYIN • ONAYLAMAK/SATIN ALMAK İÇİN BUTONA TIKLAYIN";
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

    const unlockedProjs = store.getUnlockedProjectiles(activeProf);
    const projectileKeys = unlockedProjs.filter(key => PROJECTILES[key]);

    // Fallbacks
    if (projectileKeys.length === 0) projectileKeys.push("mizrak");

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
        category: wInfo.category
      },
      supportName: undefined,
      onPrevWeapon: () => cycleWeapon(-1),
      onNextWeapon: () => cycleWeapon(1),
      onPrevSupport: null,
      onNextSupport: null
    };

    let statusText = "";
    if (pObj.ready) statusText = "KİLİTLENDİ";
    else if (isUnlocked) statusText = "KİLİTLE";
    else statusText = "KİLİTLİ";

    const isInteractive = k.isMultiplayer ? (pObj.id === myPlayer().id) : (pObj.profileId !== "p2" || this.state.p2Joined);

    return createPlayerSelectorPanel({
      name: pObj.name,
      color: pObj.color,
      ready: pObj.ready,
      isMapSelect: false,
      previewData,
      onPrev: null,
      onNext: null,
      onConfirm: () => this.handleConfirm(pObj),
      isInteractive,
      coins: undefined,
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

      let classEmoji = "⚡";
      if (cfg.class === "GUCLU") classEmoji = "🦾";
      else if (cfg.class === "TANK") classEmoji = "🛡️";

      const card = createCarGridCard({
        carType,
        cfg,
        isLocked,
        isSelectedByP1,
        isSelectedByP2,
        p1Color: p1Obj.color,
        p2Color: p2Obj ? p2Obj.color : "#ff3c3c",
        itemSkin,
        emoji: classEmoji,
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

  handleConfirm(pObj) {
    if (this.state.inputCooldown || pObj.ready) return;

    // CAR SELECT
    const type = Object.keys(CAR_TYPES)[pObj.idx];
    const isUnlocked = (k.isMultiplayer && pObj.id !== myPlayer().id)
      ? true
      : store.getUnlockedCars(pObj.profileId || "p1").includes(type);

    if (!isUnlocked) {
      if (k.isMultiplayer && pObj.id !== myPlayer().id) return;
      k.shake(3);
      // Red shake indicator
      const panelEl = this.contentArea.querySelectorAll('.player-panel')[pObj.profileId === "p2" ? 1 : 0];
      if (panelEl) {
        panelEl.classList.add('shake-error');
        setTimeout(() => panelEl.classList.remove('shake-error'), 400);
      }
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
      if (this.state.inputCooldown) return;
      const key = e.key;

      if (key === "Escape") {
        if (!k.isMultiplayer) {
          if (this.state.menuState === "MODE_SELECT") {
            this.triggerCooldown();
            this.state.menuState = "PLAY_TYPE_SELECT";
            this.updateView();
            return;
          } else if (this.state.menuState === "CAR_SELECT") {
            this.triggerCooldown();
            this.state.menuState = "MODE_SELECT";
            this.updateView();
            return;
          }
        }
      }

      if (this.state.menuState === "PLAY_TYPE_SELECT") {
        if (key === "w" || key === "ArrowUp") {
          this.state.selectedPlayTypeIdx = (this.state.selectedPlayTypeIdx - 1 + 2) % 2;
          this.updateView();
        } else if (key === "s" || key === "ArrowDown") {
          this.state.selectedPlayTypeIdx = (this.state.selectedPlayTypeIdx + 1) % 2;
          this.updateView();
        } else if (key === " " || key === "Enter") {
          this.confirmPlayType(this.state.selectedPlayTypeIdx);
        }
      } else if (this.state.menuState === "MODE_SELECT") {
        if (k.isMultiplayer && !isHost()) return;
        if (key === "w" || key === "ArrowUp") {
          this.state.selectedModeIdx = (this.state.selectedModeIdx - 1 + 5) % 5;
          this.updateModeUIHost();
        } else if (key === "s" || key === "ArrowDown") {
          this.state.selectedModeIdx = (this.state.selectedModeIdx + 1) % 5;
          this.updateModeUIHost();
        } else if (key === " " || key === "Enter") {
          if (this.state.selectedModeIdx === 4) {
            this.triggerCooldown();
            this.state.menuState = "PLAY_TYPE_SELECT";
            this.state.selectedPlayTypeIdx = 0;
            this.updateView();
          } else if (this.state.selectedModeIdx === 0) {
            this.confirmMode();
          }
        }
      } else {
        // MAP OR CAR SELECT
        if (k.isMultiplayer) {
          const meObj = this.state.players.find(p => p.id === myPlayer().id);
          if (meObj && !meObj.ready) {
            if (key === "a" || key === "ArrowLeft") this.handleCycle(meObj, -1);
            else if (key === "d" || key === "ArrowRight") this.handleCycle(meObj, 1);
            else if (key === " " || key === "Enter") this.handleConfirm(meObj);
          }
        } else {
          // Join P2 on keyboard action if not joined yet
          if (!this.state.p2Joined && (key === "ArrowLeft" || key === "ArrowRight" || key === "ArrowUp" || key === "ArrowDown")) {
            this.triggerP2Join();
            return;
          }

          this.state.players.forEach(p => {
            if (p.profileId === "p2" && !this.state.p2Joined) return;
            if (p.ready) return;

            if (p.cycleKeys.includes(key)) {
              const dir = key === p.cycleKeys[0] ? -1 : 1;
              this.handleCycle(p, dir);
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

      if (this.state.menuState === "MODE_SELECT") {
        const syncedIdx = getState("selectedModeIdx");
        if (syncedIdx !== undefined && this.state.selectedModeIdx !== syncedIdx) {
          this.state.selectedModeIdx = syncedIdx;
          this.updateView();
        }
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
          if (pObj.idx !== syncedIdx || pObj.ready !== syncedReady) {
            pObj.idx = syncedIdx;
            pObj.ready = syncedReady;
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
