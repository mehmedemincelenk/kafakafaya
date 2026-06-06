import "./GridCards.css";
import { drawHTMLCarDetails } from "./CarDetails.js";
import { drawHTMLProjectileDetails } from "./ProjectileDetails.js";

export function createCarGridCard({
  carType,
  cfg,
  isLocked,
  isSelectedByP1,
  isSelectedByP2,
  p1Color,
  p2Color,
  itemSkin,
  emoji,
  onClick
}) {
  const card = document.createElement("div");
  card.className = `car-grid-card ${isLocked ? 'locked' : ''}`;
  card.style.position = "relative";
  if (isSelectedByP1) card.classList.add("active-p1");
  if (isSelectedByP2) card.classList.add("active-p2");
  if (isSelectedByP1 && isSelectedByP2) card.classList.add("active-dual");

  // Indicator stripes container
  const stripes = document.createElement("div");
  stripes.className = "card-stripes";
  if (isSelectedByP1) {
    const s = document.createElement("div");
    s.className = "stripe-p1";
    s.style.backgroundColor = p1Color;
    stripes.appendChild(s);
  }
  if (isSelectedByP2) {
    const s = document.createElement("div");
    s.className = "stripe-p2";
    s.style.backgroundColor = p2Color;
    stripes.appendChild(s);
  }
  card.appendChild(stripes);



  // Locked indicator icon
  if (isLocked) {
    const lock = document.createElement("div");
    lock.className = "card-lock-badge";
    lock.innerText = "🔒";
    card.appendChild(lock);
  }

  // Visual vehicle chassis container
  const visual = document.createElement("div");
  visual.className = "card-visual-preview";

  const chassis = document.createElement("div");
  chassis.className = "car-chassis-preview";
  chassis.style.transform = "rotate(90deg)";
  chassis.style.boxShadow = "none";
  chassis.style.animation = "none";

  const itemColor = isSelectedByP1 ? p1Color : (isSelectedByP2 ? p2Color : "#64748b");
  drawHTMLCarDetails(chassis, carType, itemColor, itemSkin, 0.38);
  visual.appendChild(chassis);
  card.appendChild(visual);

  if (onClick) {
    card.addEventListener("click", onClick);
  }

  return card;
}

export function createSupportGridCard({
  projKey,
  projCfg,
  isLocked,
  isSelectedByP1,
  isSelectedByP2,
  p1Color,
  p2Color,
  onClick
}) {
  const card = document.createElement("div");
  card.className = `car-grid-card ${isLocked ? 'locked' : ''}`;
  card.style.position = "relative";
  if (isSelectedByP1) card.classList.add("active-p1");
  if (isSelectedByP2) card.classList.add("active-p2");
  if (isSelectedByP1 && isSelectedByP2) card.classList.add("active-dual");

  // Indicator stripes container
  const stripes = document.createElement("div");
  stripes.className = "card-stripes";
  if (isSelectedByP1) {
    const s = document.createElement("div");
    s.className = "stripe-p1";
    s.style.backgroundColor = p1Color;
    stripes.appendChild(s);
  }
  if (isSelectedByP2) {
    const s = document.createElement("div");
    s.className = "stripe-p2";
    s.style.backgroundColor = p2Color;
    stripes.appendChild(s);
  }
  card.appendChild(stripes);



  // Locked indicator icon
  if (isLocked) {
    const lock = document.createElement("div");
    lock.className = "card-lock-badge";
    lock.innerText = "🔒";
    card.appendChild(lock);
  }

  // Visual preview container
  const visual = document.createElement("div");
  visual.className = "card-visual-preview";
  visual.style.display = "flex";
  visual.style.flexDirection = "column";
  visual.style.alignItems = "center";
  visual.style.justifyContent = "center";
  visual.style.gap = "8px";

  // Chassis wrapper
  const chassis = document.createElement("div");
  chassis.className = "projectile-chassis-preview";
  chassis.style.transform = "rotate(-45deg)";
  chassis.style.boxShadow = "none";
  chassis.style.animation = "none";
  chassis.style.marginTop = "6px";
  chassis.style.marginBottom = "6px";

  const itemColor = isSelectedByP1 ? p1Color : (isSelectedByP2 ? p2Color : "#64748b");
  drawHTMLProjectileDetails(chassis, projKey, itemColor, 0.95);
  visual.appendChild(chassis);

  const nameEl = document.createElement("div");
  nameEl.innerText = projCfg.name.toUpperCase();
  nameEl.style.fontSize = "8px";
  nameEl.style.fontWeight = "800";
  nameEl.style.color = "var(--text-muted)";
  nameEl.style.letterSpacing = "0.5px";
  nameEl.style.textAlign = "center";
  visual.appendChild(nameEl);

  card.appendChild(visual);

  if (onClick) {
    card.addEventListener("click", onClick);
  }

  return card;
}
