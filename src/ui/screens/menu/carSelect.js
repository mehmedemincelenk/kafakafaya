import { k } from "../../../kaplay.js";
import { CAR_TYPES, PROJECTILES } from "../../../config.js";
import { store, CAR_COSTS } from "../../../store.js";
import { playroomPlayers } from "../../../multiplayer.js";
import { myPlayer, setState, getRoomCode } from "playroomkit";
import { getTurkishGuestName } from "../../../utils.js";
import { SKILLS } from "../../../skill.js";
import {
  createPlayerSelectorPanel,
  createCarGridCard,
  createSupportGridCard
} from "../../components.js";

export function setupPlayersState() {
  const carOptions = Object.keys(CAR_TYPES);

  if (k.isMultiplayer) {
    this.state.players = playroomPlayers.map((p, idx) => {
      const playerColor = `rgb(${p.getProfile().color.r}, ${p.getProfile().color.g}, ${p.getProfile().color.b})`;
      const defaultCarIdx = carOptions.indexOf(store.getSelectedCar("p1"));

      const pUsername = p.getState("username");
      let displayName = `Oyuncu ${idx + 1}`;
      if (pUsername) {
        const isGuest = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pUsername) || (pUsername.length >= 15 && !pUsername.includes("-"));
        displayName = isGuest ? getTurkishGuestName(pUsername) : pUsername.toUpperCase();
      }

      return {
        playroomPlayer: p,
        id: p.id,
        profileId: p.id === myPlayer().id ? "p1" : null,
        name: displayName,
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
        color: "#ffb800",
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
        color: "#00e676",
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

export function renderCarSelect() {
  const stageHeader = document.createElement("div");
  stageHeader.className = "stage-header";
  if (k.isMultiplayer) {
    const code = getRoomCode() || "";
    stageHeader.innerHTML = `
      <h3 class="stage-title" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;">
        <span style="font-size: 14px; color: #ffb800; letter-spacing: 2px; text-shadow: 0 0 5px rgba(255, 184, 0, 0.25);">ODA KODU: ${code}</span>
        <span>ARAÇ SEÇİN</span>
      </h3>
    `;
  } else {
    stageHeader.innerHTML = `<h3 class="stage-title">ARAÇ SEÇİN</h3>`;
  }
  this.contentArea.appendChild(stageHeader);

  const container = document.createElement("div");
  container.className = "car-select-layout";

  // Top Row for Player Previews
  const previewRow = document.createElement("div");
  previewRow.className = "players-preview-row";

  // Player 1
  const p1Obj = this.state.players[0];
  if (p1Obj) {
    const p1Panel = this.renderCarPreviewPanel(p1Obj);
    previewRow.appendChild(p1Panel);
  } else if (k.isMultiplayer) {
    const waitingPanel = document.createElement("div");
    waitingPanel.className = "player-panel passive empty-waiting-panel";
    waitingPanel.innerHTML = `
      <h3 class="panel-name">BAĞLANILIYOR...</h3>
      <div class="panel-card" style="justify-content: center; opacity: 0.25;">
        <div style="font-size: 11px; font-weight: 700; letter-spacing: 1px; color: var(--text-muted);">
          LOBİ BİLGİSİ ALINIYOR...
        </div>
      </div>
    `;
    previewRow.appendChild(waitingPanel);
  }

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

export function renderCarPreviewPanel(pObj) {
  if (!pObj) {
    const emptyPanel = document.createElement("div");
    emptyPanel.className = "player-panel passive empty-waiting-panel";
    return emptyPanel;
  }
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
    manufacturer: cfg.manufacturer,
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
      manufacturer: wInfo.manufacturer,
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

export function renderCarGridPanel() {
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

export function handleCycle(pObj, dir) {
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

export function cycleWeapon(pObj, dir) {
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

export function handleConfirm(pObj) {
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

export function triggerP2Join() {
  if (this.state.p2Joined) return;
  this.state.p2Joined = true;

  this.setupPlayersState();
  this.updateView();
}

export function checkStartCarLocal() {
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
