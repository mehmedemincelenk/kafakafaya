import { k } from "../../kaplay.js";
import { CAR_TYPES, CAR_SKINS, PROJECTILES } from "../../config.js";
import { store, CAR_COSTS } from "../../store.js";
import { SKILLS } from "../../skill.js";
import { drawHTMLCarDetails, drawHTMLProjectileDetails, createButton } from "../components.js";
import "../store.css";

class HTMLStoreManager {
  constructor() {
    this.root = document.getElementById("ui-root");
    this.container = null;
    this.state = {
      activeProfile: "p1",
      storeMode: "CARS", // "CARS" | "PROJECTILES"
      selectedCarIdx: 0,
      selectedProjectileIdx: 0,
      inputCooldown: false,
      keyboardListener: null,
    };
    this.keyboardListener = null;
  }

  mount() {
    this.root.innerHTML = "";
    
    this.container = document.createElement("div");
    this.container.className = "store-overlay-container";
    this.root.appendChild(this.container);

    this.renderHeader();
    
    // Create and append the main split layout
    this.mainLayout = document.createElement("div");
    this.mainLayout.className = "store-main-layout";
    this.container.appendChild(this.mainLayout);

    this.renderView();
    this.setupKeyboardInput();
  }

  dismount() {
    if (this.keyboardListener) {
      window.removeEventListener("keydown", this.keyboardListener);
      this.keyboardListener = null;
    }
    this.root.innerHTML = "";
  }

  triggerCooldown() {
    this.state.inputCooldown = true;
    setTimeout(() => {
      this.state.inputCooldown = false;
    }, 150);
  }

  goBack() {
    this.dismount();
    k.go("menu");
  }

  // --- RENDER SECTIONS ---

  renderHeader() {
    const header = document.createElement("div");
    header.className = "store-header-bar";

    // Back Button
    const backBtn = createButton({
      text: "← GERİ",
      variant: "outline",
      className: "store-back-btn",
      onClick: () => this.goBack()
    });
    header.appendChild(backBtn);

    // Title
    const title = document.createElement("h1");
    title.className = "store-title";
    title.innerText = "MAĞAZA & GARAJ";
    header.appendChild(title);

    // Right Group: P1/P2 Tabs, Coin Indicator, +500 Coins
    const rightGroup = document.createElement("div");
    rightGroup.className = "store-header-right";

    // P1 Tab
    const p1Tab = document.createElement("button");
    p1Tab.className = `profile-tab tab-p1 ${this.state.activeProfile === "p1" ? "active" : ""}`;
    p1Tab.innerHTML = `P1: 🪙 ${store.getCoins("p1")}`;
    p1Tab.addEventListener("click", () => {
      this.state.activeProfile = "p1";
      this.renderHeader();
      this.renderView();
    });
    rightGroup.appendChild(p1Tab);

    // P2 Tab
    const p2Tab = document.createElement("button");
    p2Tab.className = `profile-tab tab-p2 ${this.state.activeProfile === "p2" ? "active" : ""}`;
    p2Tab.innerHTML = `P2: 🪙 ${store.getCoins("p2")}`;
    p2Tab.addEventListener("click", () => {
      this.state.activeProfile = "p2";
      this.renderHeader();
      this.renderView();
    });
    rightGroup.appendChild(p2Tab);

    // Quick Test Coin Adder Button
    const addCoinsBtn = createButton({
      text: "+500 🪙",
      variant: "gold",
      className: "add-coins-btn",
      onClick: () => {
        store.addCoins(this.state.activeProfile, 500);
        k.shake(2);
        this.renderHeader();
        this.renderView();
      }
    });
    rightGroup.appendChild(addCoinsBtn);

    header.appendChild(rightGroup);
    
    // Remove old header if exists, then prepend
    const oldHeader = this.container.querySelector(".store-header-bar");
    if (oldHeader) oldHeader.remove();
    this.container.insertBefore(header, this.mainLayout);
  }

  renderFooter() {
    // Left empty or basic info
  }

  renderView() {
    this.mainLayout.innerHTML = "";

    // Set variable color for active profile
    const activeColor = this.state.activeProfile === "p1" ? "#008cff" : "#ff3c3c";
    this.container.style.setProperty("--active-profile-color", activeColor);

    // Sidebar: Items List
    const sidebar = this.renderSidebar();
    this.mainLayout.appendChild(sidebar);

    // Middle Column: Preview & Action
    const preview = this.renderPreview();
    this.mainLayout.appendChild(preview);

    // Right Column: Details & Customization
    const details = this.renderDetailsPanel();
    this.mainLayout.appendChild(details);
  }

  // --- COLUMN 1: SIDEBAR (ITEM LIST) ---
  renderSidebar() {
    const sidebar = document.createElement("div");
    sidebar.className = "store-sidebar";

    // Mode Selector Header Tabs
    const modeTabs = document.createElement("div");
    modeTabs.className = "store-mode-tabs";

    const carsTab = document.createElement("button");
    carsTab.className = `mode-tab ${this.state.storeMode === "CARS" ? "active" : ""}`;
    carsTab.innerText = "ARAÇ GARAJI";
    carsTab.addEventListener("click", () => {
      this.state.storeMode = "CARS";
      this.renderView();
    });
    modeTabs.appendChild(carsTab);

    const projsTab = document.createElement("button");
    projsTab.className = `mode-tab ${this.state.storeMode === "PROJECTILES" ? "active" : ""}`;
    projsTab.innerText = "MÜHİMMAT DEPOSU";
    projsTab.addEventListener("click", () => {
      this.state.storeMode = "PROJECTILES";
      this.renderView();
    });
    modeTabs.appendChild(projsTab);

    sidebar.appendChild(modeTabs);

    // Items List Container
    const itemsList = document.createElement("div");
    itemsList.className = "store-items-list";

    if (this.state.storeMode === "CARS") {
      const carTypes = Object.keys(CAR_TYPES);
      carTypes.forEach((carType, idx) => {
        const isSelected = this.state.selectedCarIdx === idx;
        const isUnlocked = store.getUnlockedCars(this.state.activeProfile).includes(carType);
        const isEquipped = store.getSelectedCar(this.state.activeProfile) === carType;

        const itemCard = document.createElement("div");
        itemCard.className = `store-item-card ${isSelected ? "selected" : ""}`;
        itemCard.addEventListener("click", () => {
          this.state.selectedCarIdx = idx;
          this.renderView();
        });

        // Left Stripe
        const stripe = document.createElement("div");
        stripe.className = "item-card-stripe";
        if (isSelected) {
          stripe.style.backgroundColor = "var(--active-profile-color)";
        }
        itemCard.appendChild(stripe);

        // Content Info
        const info = document.createElement("div");
        info.className = "item-card-info";

        const title = document.createElement("span");
        title.className = "item-card-title";
        title.innerText = carType;
        info.appendChild(title);

        const subtitle = document.createElement("span");
        subtitle.className = "item-card-subtitle";
        subtitle.innerText = CAR_TYPES[carType].class || "DENGELI";
        info.appendChild(subtitle);

        itemCard.appendChild(info);

        // Status Tag
        const status = document.createElement("div");
        status.className = "item-card-status";
        if (isEquipped) {
          status.className += " status-equipped";
          status.innerText = "AKTİF";
        } else if (!isUnlocked) {
          status.className += " status-locked";
          status.innerText = `🔒 ${CAR_COSTS[carType] || 0}`;
        } else {
          status.innerText = "";
        }
        itemCard.appendChild(status);

        itemsList.appendChild(itemCard);
      });
    } else {
      const projKeys = Object.keys(PROJECTILES);
      projKeys.forEach((projKey, idx) => {
        const isSelected = this.state.selectedProjectileIdx === idx;
        const proj = PROJECTILES[projKey];
        const isUnlocked = store.getUnlockedProjectiles(this.state.activeProfile).includes(projKey);
        
        // Equipped checking
        const isEquipped = proj.category === "WEAPON"
          ? store.getSelectedWeapon(this.state.activeProfile) === projKey
          : store.getSelectedSupport(this.state.activeProfile) === projKey;

        const itemCard = document.createElement("div");
        itemCard.className = `store-item-card ${isSelected ? "selected" : ""}`;
        itemCard.addEventListener("click", () => {
          this.state.selectedProjectileIdx = idx;
          this.renderView();
        });

        // Left Stripe
        const stripe = document.createElement("div");
        stripe.className = "item-card-stripe";
        if (isSelected) {
          stripe.style.backgroundColor = "var(--active-profile-color)";
        }
        itemCard.appendChild(stripe);

        // Content Info
        const info = document.createElement("div");
        info.className = "item-card-info";

        const title = document.createElement("span");
        title.className = "item-card-title";
        title.innerText = proj.name;
        info.appendChild(title);

        const subtitle = document.createElement("span");
        subtitle.className = "item-card-subtitle";
        subtitle.innerText = proj.category === "WEAPON" ? "🚀 MÜHİMMAT" : "🛡️ DESTEK İHA";
        info.appendChild(subtitle);

        itemCard.appendChild(info);

        // Status Tag
        const status = document.createElement("div");
        status.className = "item-card-status";
        if (isEquipped) {
          status.className += " status-equipped";
          status.innerText = "AKTİF";
        } else if (!isUnlocked) {
          status.className += " status-locked";
          status.innerText = `🔒 ${proj.cost || 0}`;
        } else {
          status.innerText = "";
        }
        itemCard.appendChild(status);

        itemsList.appendChild(itemCard);
      });
    }

    sidebar.appendChild(itemsList);
    return sidebar;
  }

  // --- COLUMN 2: MIDDLE PREVIEW & ACTION ---
  renderPreview() {
    const preview = document.createElement("div");
    preview.className = "store-preview-column";

    const previewCard = document.createElement("div");
    previewCard.className = "store-preview-card";

    let titleText = "";
    let categoryText = "";
    let activeItemKey = "";
    let cost = 0;
    let isUnlocked = false;
    let isEquipped = false;

    const activeProfileColor = this.state.activeProfile === "p1" ? "#008cff" : "#ff3c3c";

    const visualContainer = document.createElement("div");
    visualContainer.className = "store-visual-container";

    if (this.state.storeMode === "CARS") {
      const carTypes = Object.keys(CAR_TYPES);
      activeItemKey = carTypes[this.state.selectedCarIdx];
      const cfg = CAR_TYPES[activeItemKey];
      
      titleText = activeItemKey;
      categoryText = `${cfg.class || "DENGELI"} SINIFI ZIRHLI İKA`;
      cost = CAR_COSTS[activeItemKey] || 0;
      
      isUnlocked = store.getUnlockedCars(this.state.activeProfile).includes(activeItemKey);
      isEquipped = store.getSelectedCar(this.state.activeProfile) === activeItemKey;

      // Draw Top-down HTML Car Details
      const carVisual = document.createElement("div");
      carVisual.className = "store-car-visual-spinning";
      
      const selectedSkin = store.getSelectedSkin(this.state.activeProfile, activeItemKey);
      drawHTMLCarDetails(carVisual, activeItemKey, activeProfileColor, selectedSkin, 1.8);
      visualContainer.appendChild(carVisual);
    } else {
      const projKeys = Object.keys(PROJECTILES);
      activeItemKey = projKeys[this.state.selectedProjectileIdx];
      const proj = PROJECTILES[activeItemKey];

      titleText = proj.name;
      categoryText = proj.category === "WEAPON" ? "AKILLI TAARRUZ MÜHİMMATI" : "TAKTİK DESTEK SİSTEMİ";
      cost = proj.cost || 0;

      isUnlocked = store.getUnlockedProjectiles(this.state.activeProfile).includes(activeItemKey);
      isEquipped = proj.category === "WEAPON"
        ? store.getSelectedWeapon(this.state.activeProfile) === activeItemKey
        : store.getSelectedSupport(this.state.activeProfile) === activeItemKey;

      // Draw Top-down Projectile Details
      const projVisual = document.createElement("div");
      projVisual.className = "store-proj-visual-spinning";
      drawHTMLProjectileDetails(projVisual, activeItemKey, activeProfileColor, 1.6);
      visualContainer.appendChild(projVisual);
    }

    // Header Title inside Preview Card
    const headerDiv = document.createElement("div");
    headerDiv.className = "preview-card-header";
    headerDiv.innerHTML = `
      <h2 class="preview-item-name">${titleText.toUpperCase()}</h2>
      <span class="preview-item-category">${categoryText.toUpperCase()}</span>
    `;
    previewCard.appendChild(headerDiv);

    // Append visual container
    previewCard.appendChild(visualContainer);

    // Action button bottom
    const actionBtn = document.createElement("button");
    actionBtn.className = "store-action-btn";

    let btnText = "AKTİF";
    if (!isEquipped) {
      if (isUnlocked) {
        btnText = "SEÇ / KUŞAN";
        actionBtn.className += " btn-ready-to-equip";
      } else {
        btnText = `SATIN AL: ${cost} 🪙`;
        actionBtn.className += " btn-purchase";
      }
    } else {
      actionBtn.className += " btn-active-equipped";
      actionBtn.disabled = true;
    }
    
    actionBtn.innerText = btnText;
    actionBtn.addEventListener("click", () => {
      if (isEquipped) return;
      if (isUnlocked) {
        // Equip
        if (this.state.storeMode === "CARS") {
          store.setSelectedCar(this.state.activeProfile, activeItemKey);
        } else {
          const proj = PROJECTILES[activeItemKey];
          if (proj.category === "WEAPON") {
            store.setSelectedWeapon(this.state.activeProfile, activeItemKey);
          } else {
            store.setSelectedSupport(this.state.activeProfile, activeItemKey);
          }
        }
      } else {
        // Try Purchase
        if (this.state.storeMode === "CARS") {
          const success = store.unlockCar(this.state.activeProfile, activeItemKey, cost);
          if (success) {
            store.setSelectedCar(this.state.activeProfile, activeItemKey);
          } else {
            this.triggerErrorAnimation();
            return;
          }
        } else {
          const success = store.unlockProjectile(this.state.activeProfile, activeItemKey, cost);
          if (success) {
            const proj = PROJECTILES[activeItemKey];
            if (proj.category === "WEAPON") {
              store.setSelectedWeapon(this.state.activeProfile, activeItemKey);
            } else {
              store.setSelectedSupport(this.state.activeProfile, activeItemKey);
            }
          } else {
            this.triggerErrorAnimation();
            return;
          }
        }
      }
      k.shake(2);
      this.renderHeader();
      this.renderView();
    });

    previewCard.appendChild(actionBtn);
    preview.appendChild(previewCard);
    return preview;
  }

  triggerErrorAnimation() {
    k.shake(4);
    const card = this.container.querySelector(".store-preview-card");
    if (card) {
      card.classList.add("shake-error");
      setTimeout(() => card.classList.remove("shake-error"), 400);
    }
  }

  // --- COLUMN 3: DETAILS & CUSTOMIZATION PANEL ---
  renderDetailsPanel() {
    const details = document.createElement("div");
    details.className = "store-details-panel";

    if (this.state.storeMode === "CARS") {
      const carTypes = Object.keys(CAR_TYPES);
      const activeCar = carTypes[this.state.selectedCarIdx];
      const cfg = CAR_TYPES[activeCar];

      // --- Block A: Attributes & Stats ---
      const statsSection = document.createElement("div");
      statsSection.className = "details-section";
      statsSection.innerHTML = `<h3 class="section-title">ARAÇ NİTELİKLERİ</h3>`;

      const stats = [
        { name: "CAN", val: cfg.maxHp, max: 180 },
        { name: "HIZ", val: cfg.maxSpeed, max: 450 },
        { name: "İVME", val: cfg.acceleration, max: 350 },
        { name: "DÖNÜŞ", val: cfg.turnSpeed, max: 350 }
      ];

      const statsList = document.createElement("div");
      statsList.className = "stats-list-container";

      stats.forEach(s => {
        const row = document.createElement("div");
        row.className = "details-stat-row";
        row.innerHTML = `
          <span class="details-stat-name">${s.name}</span>
          <div class="details-stat-bar-bg">
            <div class="details-stat-bar-fill" style="width: ${(s.val / s.max) * 100}%; background-color: var(--active-profile-color)"></div>
          </div>
          <span class="details-stat-value">${s.val}</span>
        `;
        statsList.appendChild(row);
      });
      statsSection.appendChild(statsList);
      details.appendChild(statsSection);

      // --- Block B: Skin Selection ---
      const skinsSection = document.createElement("div");
      skinsSection.className = "details-section";
      skinsSection.innerHTML = `<h3 class="section-title">DESEN (SKIN) SEÇİMİ</h3>`;

      const skinsGrid = document.createElement("div");
      skinsGrid.className = "skins-grid";

      const skins = CAR_SKINS[activeCar] || [];
      skins.forEach(sk => {
        const isUnlocked = store.getUnlockedSkins(this.state.activeProfile, activeCar).includes(sk.id);
        const isSelected = store.getSelectedSkin(this.state.activeProfile, activeCar) === sk.id;

        const skCard = document.createElement("button");
        skCard.className = `skin-card-btn ${isSelected ? "selected" : ""}`;
        if (isSelected) {
          skCard.style.borderColor = "var(--active-profile-color)";
        }

        let label = sk.name.toUpperCase();
        if (sk.status === "coming_soon") {
          label += "<br><span class='skin-status-tag'>🔒 YAKINDA</span>";
          skCard.disabled = true;
        } else if (!isUnlocked) {
          label += `<br><span class='skin-status-tag skin-cost'>🪙 ${sk.cost}</span>`;
        } else {
          label += "<br><span class='skin-status-tag skin-owned'>AÇIK</span>";
        }

        skCard.innerHTML = label;

        if (sk.status === "available") {
          skCard.addEventListener("click", () => {
            if (isUnlocked) {
              store.setSelectedSkin(this.state.activeProfile, activeCar, sk.id);
            } else {
              const success = store.unlockSkin(this.state.activeProfile, activeCar, sk.id, sk.cost);
              if (success) {
                store.setSelectedSkin(this.state.activeProfile, activeCar, sk.id);
              } else {
                this.triggerErrorAnimation();
                return;
              }
            }
            k.shake(1);
            this.renderHeader();
            this.renderView();
          });
        }

        skinsGrid.appendChild(skCard);
      });
      skinsSection.appendChild(skinsGrid);
      details.appendChild(skinsSection);

      // --- Block C: Signature Ability ---
      const skillSection = document.createElement("div");
      skillSection.className = "details-section";
      skillSection.innerHTML = `<h3 class="section-title">İMZA YETENEĞİ</h3>`;

      const skillId = cfg.skillId || "default";
      const skillGroup = SKILLS[cfg.class || "DENGELI"];
      const skillInfo = skillGroup?.[skillId] || skillGroup?.default;

      const skillDescriptions = {
        BARKAN: "2 saniye boyunca çarpışmada (toslamada) hasarını %50 artırır, alınan hasarı yarıya indirir.",
        ASLAN: "3 saniye boyunca elektro-manyetik tamponları açar. Bu sürede toslanan rakibin kontrollerini 2 saniyeliğine kilitleyip tersine çevirir.",
        KAPGAN: "2 saniye boyunca hayalete dönüşür. Çarpışmalardan etkilenmez ve rakiplerin içinden geçebilir.",
        BARKAN_2: "3 saniye boyunca zırh kırıcı yayar. Bu sürede çarpışılan rakibin zırhını kırarak sonraki toslamaların %30 daha fazla hasar vermesini sağlar.",
        TUNGA: "2 saniye boyunca toslama kütlesini 3.5 katına çıkarır ve çarpışma hasarı almaz.",
        GOLGE_SUVARI: "1.2 saniye boyunca kendini yere sabitler. Alınan toslama hasarını yok sayar ve çarpışan rakibi geriye fırlatır.",
        ALPAR: "3 saniye boyunca reaktif zırhı açar. Alınan toslama hasarını yok sayar ve her toslamada 25 HP can yeniler."
      };

      if (skillInfo) {
        const skillBox = document.createElement("div");
        skillBox.className = "details-skill-box";
        skillBox.innerHTML = `
          <div class="skill-box-header">
            <span class="skill-icon-emoji">${skillInfo.icon}</span>
            <div class="skill-name-meta">
              <span class="skill-title-name">${skillInfo.name.toUpperCase()}</span>
              <span class="skill-stats-meta">BEKLEME: ${skillInfo.cooldown}s &nbsp; SÜRE: ${skillInfo.duration}s</span>
            </div>
          </div>
          <p class="skill-description-text">${skillDescriptions[activeCar] || "Yetenek açıklaması bulunamadı."}</p>
        `;
        skillSection.appendChild(skillBox);
      }
      details.appendChild(skillSection);

    } else {
      const projKeys = Object.keys(PROJECTILES);
      const activeProjKey = projKeys[this.state.selectedProjectileIdx];
      const activeProj = PROJECTILES[activeProjKey];

      // --- Block A: Attributes & Stats ---
      const statsSection = document.createElement("div");
      statsSection.className = "details-section";
      statsSection.innerHTML = `<h3 class="section-title">MÜHİMMAT ÖZELLİKLERİ</h3>`;

      const stats = [
        { name: "HASAR", val: activeProj.damage, max: 250 },
        { name: "HIZ", val: activeProj.speed, max: 600 },
        { name: "YARIÇAP", val: activeProj.explosionRadius, max: 200 },
        { name: "MANEVRA", val: activeProj.turnSpeed, max: 200 }
      ];

      const statsList = document.createElement("div");
      statsList.className = "stats-list-container";

      stats.forEach(s => {
        const row = document.createElement("div");
        row.className = "details-stat-row";
        
        let displayVal = s.val > 0 ? `${s.val}` : "YOK";
        
        row.innerHTML = `
          <span class="details-stat-name">${s.name}</span>
          <div class="details-stat-bar-bg">
            <div class="details-stat-bar-fill" style="width: ${s.max > 0 ? (s.val / s.max) * 100 : 0}%; background-color: var(--active-profile-color)"></div>
          </div>
          <span class="details-stat-value">${displayVal}</span>
        `;
        statsList.appendChild(row);
      });
      statsSection.appendChild(statsList);
      details.appendChild(statsSection);

      // --- Block B: Behavior description ---
      const descSection = document.createElement("div");
      descSection.className = "details-section";
      descSection.innerHTML = `<h3 class="section-title">SAVAŞ ALANI ETKİSİ</h3>`;

      const descBox = document.createElement("div");
      descBox.className = "details-behavior-box";
      descBox.innerHTML = `
        <p class="behavior-description-text">${activeProj.behavior.toUpperCase()}</p>
      `;
      descSection.appendChild(descBox);
      details.appendChild(descSection);
    }

    return details;
  }

  // --- KEYBOARD CONTROLS ---

  setupKeyboardInput() {
    this.keyboardListener = (e) => {
      if (this.state.inputCooldown) return;
      const key = e.key;

      if (key === "Escape") {
        this.goBack();
      } else if (key === "Tab" || key === "p" || key === "P") {
        e.preventDefault();
        this.state.activeProfile = this.state.activeProfile === "p1" ? "p2" : "p1";
        this.renderHeader();
        this.renderView();
      } else if (key === "w" || key === "ArrowUp" || key === "W") {
        if (this.state.storeMode === "CARS") {
          const carCount = Object.keys(CAR_TYPES).length;
          this.state.selectedCarIdx = (this.state.selectedCarIdx - 1 + carCount) % carCount;
        } else {
          const projCount = Object.keys(PROJECTILES).length;
          this.state.selectedProjectileIdx = (this.state.selectedProjectileIdx - 1 + projCount) % projCount;
        }
        this.renderView();
      } else if (key === "s" || key === "ArrowDown" || key === "S") {
        if (this.state.storeMode === "CARS") {
          const carCount = Object.keys(CAR_TYPES).length;
          this.state.selectedCarIdx = (this.state.selectedCarIdx + 1) % carCount;
        } else {
          const projCount = Object.keys(PROJECTILES).length;
          this.state.selectedProjectileIdx = (this.state.selectedProjectileIdx + 1) % projCount;
        }
        this.renderView();
      } else if (key === "m" || key === "M") {
        this.state.storeMode = this.state.storeMode === "CARS" ? "PROJECTILES" : "CARS";
        this.renderView();
      }
    };

    window.addEventListener("keydown", this.keyboardListener);
  }
}

export const storeOverlay = new HTMLStoreManager();
