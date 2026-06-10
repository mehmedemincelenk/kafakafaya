import "./PlayerSelectorPanel.css";
import { drawHTMLCarDetails } from "./CarDetails.js";
import { drawHTMLProjectileDetails } from "./ProjectileDetails.js";

export function createPlayerSelectorPanel({
  name,
  color,
  ready,
  isMapSelect,
  previewData,
  focusRow,
  onPrev,
  onNext,
  onConfirm,
  onFocusRow,
  isInteractive,
  coins,
  statusText,
  helperText
}) {
  const panel = document.createElement("div");
  panel.className = `player-panel ${ready ? 'ready' : ''} ${!isInteractive && !ready ? 'passive' : ''} ${isMapSelect ? 'map-select-panel' : ''}`;
  panel.style.setProperty('--player-color', color);

  // Top active indicator stripe
  const stripe = document.createElement("div");
  stripe.className = "panel-stripe";
  stripe.style.backgroundColor = color;

  // Player Name Header
  const header = document.createElement("h3");
  header.className = "panel-name";
  header.innerText = name.toUpperCase();
  panel.appendChild(header);

  // Coin indicator (if provided)
  if (coins !== undefined) {
    const coinsEl = document.createElement("div");
    coinsEl.className = "panel-coins";
    coinsEl.innerHTML = `🪙 ${coins}`;
    panel.appendChild(coinsEl);
  }

  // Card container
  const card = document.createElement("div");
  card.className = "panel-card";
  card.appendChild(stripe);

  // Arrow left (Map select only)
  if (isInteractive && !ready && onPrev && isMapSelect) {
    const leftBtn = document.createElement("button");
    leftBtn.className = "arrow-btn arrow-left";
    leftBtn.innerText = "<";
    leftBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      onPrev();
    });
    card.appendChild(leftBtn);
  }

  // Preview body
  const preview = document.createElement("div");
  preview.className = "panel-preview";

  if (!isMapSelect) {
    preview.style.display = "flex";
    preview.style.flexDirection = "column";
    preview.style.gap = "8px";
    preview.style.width = "100%";
    preview.style.alignItems = "stretch";

    // Card 1: Vehicle Card (ARAÇ KARTI)
    const vehicleCard = document.createElement("div");
    const isCarUnlocked = previewData.isCarUnlocked !== false;
    vehicleCard.className = isCarUnlocked ? "details-section" : "details-section locked-section";
    vehicleCard.style.position = "relative";
    
    if (focusRow === "vehicle") {
      vehicleCard.style.borderColor = color;
      vehicleCard.style.boxShadow = `0 0 15px color-mix(in srgb, ${color} 30%, transparent), inset 0 0 10px rgba(0,0,0,0.5)`;
    } else {
      vehicleCard.style.borderColor = "rgba(255, 255, 255, 0.08)";
      vehicleCard.style.boxShadow = "inset 0 0 10px rgba(0,0,0,0.5)";
    }
    
    vehicleCard.style.display = "flex";
    vehicleCard.style.flexDirection = "column";
    vehicleCard.style.gap = "6px";

    if (isInteractive && !ready) {
      vehicleCard.style.cursor = "pointer";
      vehicleCard.addEventListener("click", () => {
        if (onFocusRow) onFocusRow("vehicle");
        if (!isCarUnlocked && onConfirm) onConfirm();
      });
    }

    // Title/Name
    const ikaTitle = document.createElement("div");
    ikaTitle.className = "section-title";
    ikaTitle.style.borderLeftColor = color;
    ikaTitle.style.display = "flex";
    ikaTitle.style.justifyContent = "space-between";
    ikaTitle.style.alignItems = "center";
    const mfgText = previewData.manufacturer ? ` / ${previewData.manufacturer.toUpperCase()}` : "";
    ikaTitle.innerHTML = `
      <span>${previewData.name.toUpperCase()}<span style="font-size: 8px; color: var(--text-muted); font-weight: 500; letter-spacing: 1px;">${mfgText}</span></span>
      <span class="car-class-badge" style="font-size: 8px; margin: 0; padding: 2px 6px;">${previewData.class.toUpperCase()}</span>
    `;
    vehicleCard.appendChild(ikaTitle);

    // Vehicle Drawing container with left/right arrows
    const ikaVisualContainer = document.createElement("div");
    ikaVisualContainer.style.display = "flex";
    ikaVisualContainer.style.alignItems = "center";
    ikaVisualContainer.style.justifyContent = "center";
    ikaVisualContainer.style.width = "100%";
    ikaVisualContainer.style.position = "relative";
    ikaVisualContainer.style.margin = "6px 0";

    if (isInteractive && !ready && onPrev) {
      const leftArrow = document.createElement("button");
      leftArrow.className = "arrow-btn arrow-left preview-arrow-btn";
      leftArrow.style.left = "0px";
      leftArrow.style.setProperty('--player-color', color);
      leftArrow.innerText = "<";
      leftArrow.addEventListener("click", (e) => {
        e.stopPropagation();
        onPrev();
      });
      ikaVisualContainer.appendChild(leftArrow);
    }

    const ikaVisual = document.createElement("div");
    ikaVisual.className = "preview-visual car-visual";
    ikaVisual.style.height = "140px";
    ikaVisual.style.margin = "0";
    ikaVisual.style.display = "flex";
    ikaVisual.style.alignItems = "center";
    ikaVisual.style.justifyContent = "center";

    const ikaChassis = document.createElement("div");
    ikaChassis.className = "car-chassis-preview";
    ikaChassis.style.transform = "rotate(90deg)";
    ikaChassis.style.boxShadow = "none";
    ikaChassis.style.animation = "carFloat 3s ease-in-out infinite";
    drawHTMLCarDetails(ikaChassis, previewData.name, color, previewData.skinId || "default", 2.2);
    ikaChassis.style.marginTop = "0px";
    ikaVisual.appendChild(ikaChassis);
    ikaVisualContainer.appendChild(ikaVisual);

    // Right cycle arrow for vehicle
    if (isInteractive && !ready && onNext) {
      const rightArrow = document.createElement("button");
      rightArrow.className = "arrow-btn arrow-right preview-arrow-btn";
      rightArrow.style.right = "0px";
      rightArrow.style.setProperty('--player-color', color);
      rightArrow.innerText = ">";
      rightArrow.addEventListener("click", (e) => {
        e.stopPropagation();
        onNext();
      });
      ikaVisualContainer.appendChild(rightArrow);
    }
    vehicleCard.appendChild(ikaVisualContainer);

    // Vehicle Signature Skill box (Nested inside vehicleCard)
    if (previewData.skillDesc) {
      const skillBody = document.createElement("div");
      skillBody.className = "details-skill-box";
      skillBody.style.marginTop = "0px";

      const skillName = previewData.skill.substring(2); // Remove emoji
      const skillIcon = previewData.skill.substring(0, 2); // Extract emoji

      skillBody.innerHTML = `
        <div class="skill-box-header">
          <span class="skill-icon-emoji">${skillIcon}</span>
          <div class="skill-name-meta">
            <span class="skill-title-name">${skillName.toUpperCase()}</span>
          </div>
        </div>
        <p class="skill-description-text">${previewData.skillDesc}</p>
      `;
      vehicleCard.appendChild(skillBody);
    }

    // Vehicle Stats (Nested inside vehicleCard)
    if (previewData.stats && previewData.stats.length > 0) {
      const statsBox = document.createElement("div");
      statsBox.className = "stats-list-container";
      statsBox.style.padding = "4px 0px";
      statsBox.style.display = "flex";
      statsBox.style.flexDirection = "column";
      statsBox.style.gap = "4px";

      previewData.stats.forEach(stat => {
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.flexDirection = "column";
        row.style.gap = "4px";

        const labelRow = document.createElement("div");
        labelRow.className = "stat-label-row";
        labelRow.innerHTML = `
          <span>${stat.name.toUpperCase()}</span>
          <span style="color: var(--text-color);">${stat.display}</span>
        `;
        row.appendChild(labelRow);

        const barBg = document.createElement("div");
        barBg.style.width = "100%";
        barBg.style.height = "4px";
        barBg.style.backgroundColor = "rgba(255,255,255,0.06)";
        barBg.style.borderRadius = "2px";
        barBg.style.overflow = "hidden";

        const barFill = document.createElement("div");
        barFill.style.height = "100%";
        barFill.style.width = `${Math.min(100, (stat.val / stat.max) * 100)}%`;
        barFill.style.backgroundColor = color;
        barFill.style.borderRadius = "2px";
        barFill.style.boxShadow = `0 0 8px ${color}`;

        barBg.appendChild(barFill);
        row.appendChild(barBg);
        statsBox.appendChild(row);
      });
      vehicleCard.appendChild(statsBox);
    }

    if (!isCarUnlocked) {
      const buyOverlay = document.createElement("div");
      buyOverlay.className = "card-locked-buy-overlay";
      buyOverlay.innerHTML = `<span>SATIN AL: 🪙${previewData.carCost || 0}</span>`;
      vehicleCard.appendChild(buyOverlay);
    }

    preview.appendChild(vehicleCard);

    // Card 2: Weapon Card (MÜHİMMAT KARTI)
    if (previewData.weaponName) {
      const specs = previewData.weaponSpecs;
      const isSupport = specs.category === "SUPPORT" || specs.damage === 0;
      const dihaColor = isSupport ? "#ff0080" : "#ff3c3c"; // support neon pink, weapon red

      const weaponCard = document.createElement("div");
      const isWUnlocked = previewData.isWeaponUnlocked !== false;
      weaponCard.className = isWUnlocked ? "details-section" : "details-section locked-section";
      weaponCard.style.position = "relative";
      
      if (focusRow === "weapon") {
        weaponCard.style.borderColor = dihaColor;
        weaponCard.style.boxShadow = `0 0 15px color-mix(in srgb, ${dihaColor} 30%, transparent), inset 0 0 10px rgba(0,0,0,0.5)`;
      } else {
        weaponCard.style.borderColor = "rgba(255, 255, 255, 0.08)";
        weaponCard.style.boxShadow = "inset 0 0 10px rgba(0,0,0,0.5)";
      }
      
      weaponCard.style.display = "flex";
      weaponCard.style.flexDirection = "column";
      weaponCard.style.gap = "6px";

      if (isInteractive && !ready) {
        weaponCard.style.cursor = "pointer";
        weaponCard.addEventListener("click", () => {
          if (onFocusRow) onFocusRow("weapon");
          if (!isWUnlocked && onConfirm) onConfirm();
        });
      }

      const dihaTitle = document.createElement("div");
      dihaTitle.className = "section-title";
      dihaTitle.style.borderLeftColor = dihaColor;
      dihaTitle.style.display = "flex";
      dihaTitle.style.justifyContent = "space-between";
      dihaTitle.style.alignItems = "center";
      const weaponMfgText = specs.manufacturer ? ` / ${specs.manufacturer.toUpperCase()}` : "";
      dihaTitle.innerHTML = `
        <span>${specs.name.toUpperCase()}<span style="font-size: 8px; color: var(--text-muted); font-weight: 500; letter-spacing: 1px;">${weaponMfgText}</span></span>
        <span class="car-class-badge" style="font-size: 8px; margin: 0; padding: 2px 6px; color: ${dihaColor}; border-color: ${dihaColor}; background-color: rgba(255, 60, 60, 0.1);">${isSupport ? "DESTEK" : "TAARRUZ"}</span>
      `;
      weaponCard.appendChild(dihaTitle);

      // Weapon/DİHA cycle arrows (left/right) if interactive & not ready
      const dihaVisualContainer = document.createElement("div");
      dihaVisualContainer.style.display = "flex";
      dihaVisualContainer.style.alignItems = "center";
      dihaVisualContainer.style.justifyContent = "space-between";
      dihaVisualContainer.style.width = "100%";
      dihaVisualContainer.style.gap = "10px";
      dihaVisualContainer.style.margin = "2px 0 2px 0";

      // Left cycle arrow
      if (isInteractive && !ready && previewData.onPrevWeapon) {
        const leftArrow = document.createElement("button");
        leftArrow.className = "arrow-btn arrow-left preview-arrow-btn";
        leftArrow.style.position = "relative";
        leftArrow.style.left = "auto";
        leftArrow.style.top = "auto";
        leftArrow.style.transform = "none";
        leftArrow.style.flexShrink = "0";
        leftArrow.style.setProperty('--player-color', dihaColor);
        leftArrow.innerText = "<";
        leftArrow.addEventListener("click", (e) => {
          e.stopPropagation();
          previewData.onPrevWeapon();
        });
        dihaVisualContainer.appendChild(leftArrow);
      } else {
        const leftPlaceholder = document.createElement("div");
        leftPlaceholder.className = "preview-arrow-placeholder";
        leftPlaceholder.style.flexShrink = "0";
        dihaVisualContainer.appendChild(leftPlaceholder);
      }

      // Middle content container (görsel ve açıklama yan yana)
      const middleContent = document.createElement("div");
      middleContent.style.display = "flex";
      middleContent.style.alignItems = "center";
      middleContent.style.gap = "12px";
      middleContent.style.flex = "1";
      middleContent.style.overflow = "hidden";

      // DİHA Drawing
      const dihaVisual = document.createElement("div");
      dihaVisual.className = "preview-visual car-visual";
      dihaVisual.style.height = "60px";
      dihaVisual.style.width = "90px";
      dihaVisual.style.flexShrink = "0";
      dihaVisual.style.margin = "0";
      dihaVisual.style.display = "flex";
      dihaVisual.style.alignItems = "center";
      dihaVisual.style.justifyContent = "center";
      dihaVisual.style.overflow = "visible";

      const dihaChassis = document.createElement("div");
      dihaChassis.className = "projectile-chassis-preview";
      dihaChassis.style.transform = "rotate(-45deg)";
      dihaChassis.style.boxShadow = "none";
      dihaChassis.style.animation = "none";

      const getProjKeyByName = (nStr) => {
        const n = nStr.toLowerCase();
        if (n.includes("mızrak")) return "mizrak";
        if (n.includes("sivrisinek")) return "sivrisinek";
        if (n.includes("mam-l") || n.includes("mam_l")) return "mam_l";
        if (n.includes("mam-t") || n.includes("mam_t")) return "mam_t";
        if (n.includes("kemankeş 1") || n.includes("kemankes_1")) return "kemankes_1";
        if (n.includes("kemankeş 2") || n.includes("kemankes_2")) return "kemankes_2";
        if (n.includes("çakır") || n.includes("cakir")) return "cakir";
        if (n.includes("mini iha") || n.includes("mini_iha")) return "mini_iha";
        if (n.includes("kalkan") || n.includes("kalkan_diha")) return "kalkan_diha";
        if (n.includes("fettah 2") || n.includes("fettah_2")) return "fettah_2";
        if (n.includes("fettah")) return "fettah";
        if (n.includes("ebabil")) return "ebabil";
        return "mizrak";
      };

      const projKey = getProjKeyByName(specs.name);
      const itemColor = ready ? color : dihaColor;
      drawHTMLProjectileDetails(dihaChassis, projKey, itemColor, 2.0);
      dihaVisual.appendChild(dihaChassis);
      middleContent.appendChild(dihaVisual);

      // Description inside middle container
      if (specs.behavior) {
        const descBox = document.createElement("div");
        descBox.className = "details-behavior-box";
        descBox.style.marginTop = "0px";
        descBox.style.background = "none";
        descBox.style.border = "none";
        descBox.style.padding = "0";
        descBox.style.flex = "1";
        descBox.innerHTML = `<p class="behavior-description-text" style="font-size: 10px; line-height: 1.45; color: var(--text-muted); margin: 0; letter-spacing: 0.5px; text-align: left;">${specs.behavior.toUpperCase()}</p>`;
        middleContent.appendChild(descBox);
      }

      dihaVisualContainer.appendChild(middleContent);

      // Right cycle arrow
      if (isInteractive && !ready && previewData.onNextWeapon) {
        const rightArrow = document.createElement("button");
        rightArrow.className = "arrow-btn arrow-right preview-arrow-btn";
        rightArrow.style.position = "relative";
        rightArrow.style.right = "auto";
        rightArrow.style.top = "auto";
        rightArrow.style.transform = "none";
        rightArrow.style.flexShrink = "0";
        rightArrow.style.setProperty('--player-color', dihaColor);
        rightArrow.innerText = ">";
        rightArrow.addEventListener("click", (e) => {
          e.stopPropagation();
          previewData.onNextWeapon();
        });
        dihaVisualContainer.appendChild(rightArrow);
      } else {
        const rightPlaceholder = document.createElement("div");
        rightPlaceholder.className = "preview-arrow-placeholder";
        rightPlaceholder.style.flexShrink = "0";
        dihaVisualContainer.appendChild(rightPlaceholder);
      }
      weaponCard.appendChild(dihaVisualContainer);

      if (!isWUnlocked) {
        const buyOverlay = document.createElement("div");
        buyOverlay.className = "card-locked-buy-overlay";
        buyOverlay.innerHTML = `<span>SATIN AL: 🪙${specs.cost || 0}</span>`;
        weaponCard.appendChild(buyOverlay);
      }

      preview.appendChild(weaponCard);
    }
  } else {
    // MAP SELECT
    const previewTitle = document.createElement("h4");
    previewTitle.className = "preview-title";
    previewTitle.innerText = previewData.name.toUpperCase();
    preview.appendChild(previewTitle);

    const obstCount = document.createElement("div");
    obstCount.className = "map-obst-count";
    obstCount.innerText = `ENGEL: ${previewData.obstacles.length}`;
    preview.appendChild(obstCount);

    const previewVisual = document.createElement("div");
    previewVisual.className = "preview-visual map-visual";
    previewVisual.style.backgroundColor = `rgb(${previewData.bgColor.join(',')})`;

    const grid = document.createElement("div");
    grid.className = "map-grid-dots";
    previewVisual.appendChild(grid);

    previewData.obstacles.forEach(obs => {
      const obstacle = document.createElement("div");
      obstacle.className = "map-obstacle-preview";
      obstacle.style.left = `${(obs.x / 1920) * 100}%`;
      obstacle.style.top = `${(obs.y / 1080) * 100}%`;
      obstacle.style.width = `${(obs.w / 1920) * 100}%`;
      obstacle.style.height = `${(obs.h / 1080) * 100}%`;
      obstacle.style.backgroundColor = `rgb(${obs.color.join(',')})`;
      previewVisual.appendChild(obstacle);
    });
    preview.appendChild(previewVisual);
  }

  card.appendChild(preview);

  // Arrow right (Map select only)
  if (isInteractive && !ready && onNext && isMapSelect) {
    const rightBtn = document.createElement("button");
    rightBtn.className = "arrow-btn arrow-right";
    rightBtn.innerText = ">";
    rightBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      onNext();
    });
    card.appendChild(rightBtn);
  }

  panel.appendChild(card);

  // Helper keyboard key guidelines
  if (helperText) {
    const helper = document.createElement("div");
    helper.className = "panel-helper-text";
    helper.innerText = helperText.toUpperCase();
    panel.appendChild(helper);
  }

  // Confirm / Buy / Locked button at the bottom
  const hasLockedItems = !isMapSelect && previewData && (!previewData.isCarUnlocked || !previewData.isWeaponUnlocked);
  const actionBtn = document.createElement("button");

  if (isMapSelect) {
    actionBtn.className = `panel-action-btn ${ready ? 'ready' : ''} ${!isInteractive && !ready ? 'disabled' : ''}`;
    actionBtn.innerHTML = statusText.toUpperCase();
    if (isInteractive && !ready) {
      actionBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        onConfirm();
      });
    } else {
      actionBtn.disabled = true;
    }
  } else {
    // Character select: only displays "HAZIR" (disabled/gray if any item is locked)
    const isBtnDisabled = !isInteractive || ready || hasLockedItems;
    actionBtn.className = `panel-action-btn ${ready ? 'ready' : ''} ${isBtnDisabled ? 'disabled' : ''}`;
    actionBtn.innerHTML = "HAZIR";
    
    if (isInteractive && !ready && !hasLockedItems) {
      actionBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        onConfirm();
      });
    } else {
      actionBtn.disabled = true;
    }
  }
  panel.appendChild(actionBtn);

  return panel;
}

export function createPips(val, max) {
  const pipsContainer = document.createElement("div");
  pipsContainer.className = "card-pip-container";
  const numPips = 5;
  const activeCount = Math.min(numPips, Math.max(1, Math.round((val / max) * numPips)));
  for (let i = 0; i < numPips; i++) {
    const pip = document.createElement("div");
    pip.className = `card-pip ${i < activeCount ? 'active' : ''}`;
    pipsContainer.appendChild(pip);
  }
  return pipsContainer;
}
