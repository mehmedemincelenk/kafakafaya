import { drawHTMLCarDetails } from "./CarDetails.js";
import { drawHTMLProjectileDetails } from "./ProjectileDetails.js";

export function createPlayerSelectorPanel({
  name,
  color,
  ready,
  isMapSelect,
  previewData,
  onPrev,
  onNext,
  onConfirm,
  isInteractive,
  coins,
  statusText,
  helperText
}) {
  const panel = document.createElement("div");
  panel.className = `player-panel ${ready ? 'ready' : ''} ${!isInteractive && !ready ? 'passive' : ''}`;
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

  // Arrow left
  if (isInteractive && !ready && onPrev) {
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
    // 1. VEHICLE (İKA) SECTION
    const ikaSection = document.createElement("div");
    ikaSection.className = "details-section";
    ikaSection.style.marginBottom = "12px";
    ikaSection.style.borderColor = color; // Colored border matching player

    const ikaTitle = document.createElement("div");
    ikaTitle.className = "section-title";
    ikaTitle.style.borderLeftColor = color;
    ikaTitle.style.display = "flex";
    ikaTitle.style.justifyContent = "space-between";
    ikaTitle.style.alignItems = "center";
    ikaTitle.innerHTML = `
      <span>ARAÇ NİTELİKLERİ: ${previewData.name.toUpperCase()}</span>
      <span class="car-class-badge" style="font-size: 8px; margin: 0; padding: 2px 6px;">${previewData.class.toUpperCase()}</span>
    `;
    ikaSection.appendChild(ikaTitle);

    // Vehicle Drawing
    const ikaVisual = document.createElement("div");
    ikaVisual.className = "preview-visual car-visual";
    ikaVisual.style.height = "90px";
    ikaVisual.style.margin = "10px 0";

    const ikaChassis = document.createElement("div");
    ikaChassis.className = "car-chassis-preview";
    ikaChassis.style.transform = "rotate(90deg)";
    ikaChassis.style.boxShadow = "none";
    ikaChassis.style.animation = "none";
    drawHTMLCarDetails(ikaChassis, previewData.name, color, previewData.skinId || "default", 1.3);
    ikaVisual.appendChild(ikaChassis);
    ikaSection.appendChild(ikaVisual);


    // Vehicle Signature Skill box
    if (previewData.skillDesc) {
      const skillBox = document.createElement("div");
      skillBox.className = "details-skill-box";

      const skillName = previewData.skill.substring(2); // Remove emoji
      const skillIcon = previewData.skill.substring(0, 2); // Extract emoji

      skillBox.innerHTML = `
        <div class="skill-box-header">
          <span class="skill-icon-emoji">${skillIcon}</span>
          <div class="skill-name-meta">
            <span class="skill-title-name">${skillName.toUpperCase()}</span>
            <span class="skill-stats-meta" style="color: var(--text-muted);">İMZA YETENEĞİ</span>
          </div>
        </div>
        <p class="skill-description-text">${previewData.skillDesc}</p>
      `;
      ikaSection.appendChild(skillBox);
    }

    preview.appendChild(ikaSection);

    // 2. PROJECTILE (DİHA) SECTION
    if (previewData.weaponName) {
      const specs = previewData.weaponSpecs;
      const isSupport = specs.category === "SUPPORT" || specs.damage === 0;
      const dihaColor = isSupport ? "#ff0080" : "#ff3c3c"; // support neon pink, weapon red

      const dihaSection = document.createElement("div");
      dihaSection.className = "details-section";
      dihaSection.style.borderColor = dihaColor;

      const dihaTitle = document.createElement("div");
      dihaTitle.className = "section-title";
      dihaTitle.style.borderLeftColor = dihaColor;
      dihaTitle.style.display = "flex";
      dihaTitle.style.justifyContent = "space-between";
      dihaTitle.style.alignItems = "center";
      dihaTitle.innerHTML = `
        <span>MÜHİMMAT: ${specs.name.toUpperCase()}</span>
        <span class="car-class-badge" style="font-size: 8px; margin: 0; padding: 2px 6px; color: ${dihaColor}; border-color: ${dihaColor}; background-color: rgba(255, 60, 60, 0.1);">${isSupport ? "DESTEK" : "TAARRUZ"}</span>
      `;
      dihaSection.appendChild(dihaTitle);

      // Weapon/DİHA cycle arrows (left/right) if interactive & not ready
      const dihaVisualContainer = document.createElement("div");
      dihaVisualContainer.style.display = "flex";
      dihaVisualContainer.style.alignItems = "center";
      dihaVisualContainer.style.justifyContent = "center";
      dihaVisualContainer.style.width = "100%";
      dihaVisualContainer.style.position = "relative";
      dihaVisualContainer.style.margin = "2px 0 8px 0";

      // Left cycle arrow
      if (isInteractive && !ready && previewData.onPrevWeapon) {
        const leftArrow = document.createElement("button");
        leftArrow.className = "arrow-btn arrow-left";
        leftArrow.style.width = "24px";
        leftArrow.style.height = "24px";
        leftArrow.style.fontSize = "11px";
        leftArrow.style.left = "0px";
        leftArrow.style.setProperty('--player-color', dihaColor);
        leftArrow.innerText = "<";
        leftArrow.addEventListener("click", (e) => {
          e.stopPropagation();
          previewData.onPrevWeapon();
        });
        dihaVisualContainer.appendChild(leftArrow);
      }

      // DİHA Drawing
      const dihaVisual = document.createElement("div");
      dihaVisual.className = "preview-visual car-visual";
      dihaVisual.style.height = "45px";
      dihaVisual.style.margin = "0";

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
      drawHTMLProjectileDetails(dihaChassis, projKey, itemColor, 1.15);
      dihaVisual.appendChild(dihaChassis);
      dihaVisualContainer.appendChild(dihaVisual);

      // Right cycle arrow
      if (isInteractive && !ready && previewData.onNextWeapon) {
        const rightArrow = document.createElement("button");
        rightArrow.className = "arrow-btn arrow-right";
        rightArrow.style.width = "24px";
        rightArrow.style.height = "24px";
        rightArrow.style.fontSize = "11px";
        rightArrow.style.right = "0px";
        rightArrow.style.setProperty('--player-color', dihaColor);
        rightArrow.innerText = ">";
        rightArrow.addEventListener("click", (e) => {
          e.stopPropagation();
          previewData.onNextWeapon();
        });
        dihaVisualContainer.appendChild(rightArrow);
      }

      dihaSection.appendChild(dihaVisualContainer);

      // DİHA description behavior box
      if (specs.behavior) {
        const descBox = document.createElement("div");
        descBox.className = "details-behavior-box";
        descBox.innerHTML = `<p class="behavior-description-text">${specs.behavior.toUpperCase()}</p>`;
        dihaSection.appendChild(descBox);
      }

      preview.appendChild(dihaSection);
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

  // Arrow right
  if (isInteractive && !ready && onNext) {
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
  const actionBtn = document.createElement("button");
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
