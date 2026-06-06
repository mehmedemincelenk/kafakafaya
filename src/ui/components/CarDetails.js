import { CAR_TYPES } from "../../config.js";

export function drawHTMLCarDetails(parentEl, type, color, skinId = "default", scale = 1) {
  const cfg = CAR_TYPES[type] || CAR_TYPES.BARKAN;
  const carClass = cfg.class || "DENGELI";

  // 1. Sleek Cybernetic & Military Matte Color Palette
  let bodyColor = `rgb(${cfg.color[0]}, ${cfg.color[1]}, ${cfg.color[2]})`;

  if (skinId === "gold") {
    bodyColor = "rgb(110, 100, 80)"; // Dark Bronze Champagne Grey
  } else if (skinId === "military" || skinId === "camo") {
    bodyColor = "rgb(52, 58, 50)"; // Dark Tactical Slate Green
  } else if (skinId === "tokyo") {
    bodyColor = "rgb(28, 28, 30)"; // Ultra Dark Charcoal
  } else if (skinId === "neon") {
    bodyColor = "rgb(20, 22, 25)"; // Deep Slate Obsidian
  } else if (skinId === "cyber") {
    bodyColor = "rgb(28, 25, 32)"; // Dark Carbon Indigo Grey
  } else if (skinId === "carbon") {
    bodyColor = "rgb(24, 25, 28)"; // Pure Carbon Fiber Grey
  } else if (skinId === "beast") {
    bodyColor = "rgb(65, 30, 32)"; // Deep Crimson Oxide Grey
  } else if (skinId === "hazard") {
    bodyColor = "rgb(80, 75, 60)"; // Dark Industrial Oxide
  } else if (skinId === "retro") {
    bodyColor = "rgb(90, 60, 48)"; // Dark Copper Oxide
  }

  parentEl.style.width = `${cfg.width * scale}px`;
  parentEl.style.height = `${cfg.height * scale}px`;
  parentEl.style.borderRadius = `${cfg.radius * scale}px`;
  parentEl.style.backgroundColor = bodyColor;
  parentEl.style.position = "relative";

  if (skinId === "neon") {
    parentEl.style.filter = "drop-shadow(0 0 5px rgb(0, 255, 255))";
  } else if (skinId === "gold") {
    parentEl.style.filter = "drop-shadow(0 3px 6px rgba(220, 175, 50, 0.4))";
  } else {
    parentEl.style.filter = "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.45))";
  }

  // Clear existing content to prevent duplicate drawings
  parentEl.innerHTML = "";

  const width = cfg.width * scale;
  const height = cfg.height * scale;
  const wHalf = width / 2;
  const hHalf = height / 2;
  const wOffset = wHalf - 8 * scale;
  const hOffset = hHalf - 1 * scale;

  // 2. Wheels / Treads (Tekerlekler ve Paletler)
  if (carClass === "TANK") {
    // Sol Palet (Left Tread)
    const leftTread = document.createElement("div");
    leftTread.style.position = "absolute";
    leftTread.style.left = "0px";
    leftTread.style.top = `-${4.5 * scale}px`;
    leftTread.style.width = "100%";
    leftTread.style.height = `${8 * scale}px`;
    leftTread.style.backgroundColor = "rgb(30, 30, 32)";
    leftTread.style.borderRadius = `${2 * scale}px`;
    leftTread.style.zIndex = "1";
    leftTread.style.display = "flex";
    leftTread.style.justifyContent = "space-around";
    leftTread.style.alignItems = "center";
    leftTread.style.padding = `0 ${2 * scale}px`;
    leftTread.style.boxSizing = "border-box";
    for (let i = 0; i < 3; i++) {
      const gear = document.createElement("div");
      gear.style.width = `${5 * scale}px`;
      gear.style.height = `${5 * scale}px`;
      gear.style.borderRadius = "50%";
      gear.style.backgroundColor = "rgb(55, 55, 60)";
      leftTread.appendChild(gear);
    }
    parentEl.appendChild(leftTread);

    // Sağ Palet (Right Tread)
    const rightTread = leftTread.cloneNode(true);
    rightTread.style.top = "auto";
    rightTread.style.bottom = `-${4.5 * scale}px`;
    parentEl.appendChild(rightTread);
  } else {
    // Hızlı ve Güçlü sınıflar için tekerlekler ve jantlar
    const wheelLocs = [
      { top: `-${1.5 * scale}px`, left: `${wHalf - 11 * scale}px` }, // tl
      { top: `-${1.5 * scale}px`, right: `${wHalf - 11 * scale}px` }, // tr
      { bottom: `-${1.5 * scale}px`, left: `${wHalf - 11 * scale}px` }, // bl
      { bottom: `-${1.5 * scale}px`, right: `${wHalf - 11 * scale}px` } // br
    ];

    wheelLocs.forEach(loc => {
      const wheel = document.createElement("div");
      wheel.style.position = "absolute";
      wheel.style.width = `${13 * scale}px`;
      wheel.style.height = `${6 * scale}px`;
      wheel.style.backgroundColor = "rgb(30, 30, 32)";
      wheel.style.borderRadius = `${1.5 * scale}px`;
      wheel.style.zIndex = "1";
      if (loc.top) wheel.style.top = loc.top;
      if (loc.bottom) wheel.style.bottom = loc.bottom;
      if (loc.left) wheel.style.left = loc.left;
      if (loc.right) wheel.style.right = loc.right;

      // Jant Şeridi
      const rim = document.createElement("div");
      rim.style.position = "absolute";
      rim.style.top = "50%";
      rim.style.left = "50%";
      rim.style.transform = "translate(-50%, -50%)";
      rim.style.width = `${7 * scale}px`;
      rim.style.height = `${2 * scale}px`;
      rim.style.borderRadius = `${0.5 * scale}px`;
      rim.style.backgroundColor = color;
      wheel.appendChild(rim);

      parentEl.appendChild(wheel);
    });
  }

  // 3. Cyber Cockpit Glass & Reflection
  const cabinWidth = width * 0.42;
  const cabinHeight = height * 0.42;

  const cockpit = document.createElement("div");
  cockpit.style.position = "absolute";
  cockpit.style.left = `${width * 0.29}px`;
  cockpit.style.top = `${height * 0.29}px`;
  cockpit.style.width = `${cabinWidth}px`;
  cockpit.style.height = `${cabinHeight}px`;
  cockpit.style.borderRadius = `${1.5 * scale}px`;
  cockpit.style.backgroundColor = "rgb(20, 24, 30)";
  cockpit.style.zIndex = "4";
  cockpit.style.overflow = "hidden";

  // Cam Yansıması
  const reflection = document.createElement("div");
  reflection.style.position = "absolute";
  reflection.style.left = "20%";
  reflection.style.top = "15%";
  reflection.style.width = "40%";
  reflection.style.height = "1.5px";
  reflection.style.backgroundColor = "rgb(100, 220, 255)";
  reflection.style.transform = "rotate(-15deg)";
  cockpit.appendChild(reflection);

  parentEl.appendChild(cockpit);

  // 4. Neon Side Decals / LED Stripes
  const stripeTop = document.createElement("div");
  stripeTop.style.position = "absolute";
  stripeTop.style.left = `${width * 0.22}px`;
  stripeTop.style.top = `${4 * scale}px`;
  stripeTop.style.width = `${width * 0.45}px`;
  stripeTop.style.height = "1.5px";
  stripeTop.style.backgroundColor = color;
  stripeTop.style.zIndex = "3";
  parentEl.appendChild(stripeTop);

  const stripeBottom = stripeTop.cloneNode(true);
  stripeBottom.style.top = "auto";
  stripeBottom.style.bottom = `${4 * scale}px`;
  parentEl.appendChild(stripeBottom);

  // 5. LED Headlights & Brake Lights
  // Ön Farlar (Beyaz)
  const headlightTop = document.createElement("div");
  headlightTop.style.position = "absolute";
  headlightTop.style.right = "1px";
  headlightTop.style.top = `${5 * scale}px`;
  headlightTop.style.width = `${5 * scale}px`;
  headlightTop.style.height = `${2.5 * scale}px`;
  headlightTop.style.backgroundColor = "#fff";
  headlightTop.style.borderRadius = `${0.5 * scale}px`;
  headlightTop.style.zIndex = "3";
  parentEl.appendChild(headlightTop);

  const headlightBottom = headlightTop.cloneNode(true);
  headlightBottom.style.top = "auto";
  headlightBottom.style.bottom = `${5 * scale}px`;
  parentEl.appendChild(headlightBottom);

  // Arka Stoplar (Kırmızı)
  const taillightTop = document.createElement("div");
  taillightTop.style.position = "absolute";
  taillightTop.style.left = "0px";
  taillightTop.style.top = `${6 * scale}px`;
  taillightTop.style.width = "1.5px";
  taillightTop.style.height = `${4 * scale}px`;
  taillightTop.style.backgroundColor = "#ff2828";
  taillightTop.style.zIndex = "3";
  parentEl.appendChild(taillightTop);

  const taillightBottom = taillightTop.cloneNode(true);
  taillightBottom.style.top = "auto";
  taillightBottom.style.bottom = `${6 * scale}px`;
  parentEl.appendChild(taillightBottom);

  // 6. Class-Specific Trims
  if (carClass === "HIPHIZLI") {
    // Spoiler Destekleri
    const spoilerSupportTop = document.createElement("div");
    spoilerSupportTop.style.position = "absolute";
    spoilerSupportTop.style.left = `${5 * scale}px`;
    spoilerSupportTop.style.top = `${6 * scale}px`;
    spoilerSupportTop.style.width = `${2 * scale}px`;
    spoilerSupportTop.style.height = `${6 * scale}px`;
    spoilerSupportTop.style.backgroundColor = bodyColor;
    spoilerSupportTop.style.zIndex = "2";
    parentEl.appendChild(spoilerSupportTop);

    const spoilerSupportBottom = spoilerSupportTop.cloneNode(true);
    spoilerSupportBottom.style.top = "auto";
    spoilerSupportBottom.style.bottom = `${6 * scale}px`;
    parentEl.appendChild(spoilerSupportBottom);

    // Spoiler Kanadı
    const wing = document.createElement("div");
    wing.style.position = "absolute";
    wing.style.left = `${3 * scale}px`;
    wing.style.top = "50%";
    wing.style.transform = "translateY(-50%)";
    wing.style.width = `${3 * scale}px`;
    wing.style.height = `${height - 4 * scale}px`;
    wing.style.backgroundColor = "rgb(20, 22, 25)";
    wing.style.borderRadius = `${1 * scale}px`;
    wing.style.zIndex = "3";
    parentEl.appendChild(wing);

    // Ön splitterlar
    const splitterTop = document.createElement("div");
    splitterTop.style.position = "absolute";
    splitterTop.style.right = "0px";
    splitterTop.style.top = `${2 * scale}px`;
    splitterTop.style.width = `${4 * scale}px`;
    splitterTop.style.height = `${2 * scale}px`;
    splitterTop.style.backgroundColor = "rgb(20, 22, 25)";
    splitterTop.style.zIndex = "2";
    parentEl.appendChild(splitterTop);

    const splitterBottom = splitterTop.cloneNode(true);
    splitterBottom.style.top = "auto";
    splitterBottom.style.bottom = `${2 * scale}px`;
    parentEl.appendChild(splitterBottom);
  } else if (carClass === "GUCLU") {
    // Çift Egzoz
    const exhaustTop = document.createElement("div");
    exhaustTop.style.position = "absolute";
    exhaustTop.style.left = `-${2 * scale}px`;
    exhaustTop.style.top = `${8 * scale}px`;
    exhaustTop.style.width = `${4 * scale}px`;
    exhaustTop.style.height = `${4 * scale}px`;
    exhaustTop.style.backgroundColor = "rgb(40, 40, 45)";
    exhaustTop.style.zIndex = "2";

    // Isı parlaması
    const glow = document.createElement("div");
    glow.style.position = "absolute";
    glow.style.left = `-${2 * scale}px`;
    glow.style.top = "50%";
    glow.style.transform = "translateY(-50%)";
    glow.style.width = `${2.4 * scale}px`;
    glow.style.height = `${2.4 * scale}px`;
    glow.style.borderRadius = "50%";
    glow.style.backgroundColor = "rgb(255, 140, 0)";
    exhaustTop.appendChild(glow);
    parentEl.appendChild(exhaustTop);

    const exhaustBottom = exhaustTop.cloneNode(true);
    exhaustBottom.style.top = "auto";
    exhaustBottom.style.bottom = `${8 * scale}px`;
    parentEl.appendChild(exhaustBottom);

    // Koçbaşı
    const grill = document.createElement("div");
    grill.style.position = "absolute";
    grill.style.right = `-${1 * scale}px`;
    grill.style.top = "50%";
    grill.style.transform = "translateY(-50%)";
    grill.style.width = `${4 * scale}px`;
    grill.style.height = `${height - 6 * scale}px`;
    grill.style.backgroundColor = "rgb(35, 35, 40)";
    grill.style.borderRadius = `${1 * scale}px`;
    grill.style.zIndex = "3";
    parentEl.appendChild(grill);
  } else if (carClass === "TANK") {
    // Yan zırh kaplamaları
    const armorTop = document.createElement("div");
    armorTop.style.position = "absolute";
    armorTop.style.left = `${width * 0.15}px`;
    armorTop.style.top = `${5 * scale}px`;
    armorTop.style.width = `${width * 0.65}px`;
    armorTop.style.height = `${3 * scale}px`;
    armorTop.style.backgroundColor = "rgba(0,0,0,0.2)";
    armorTop.style.borderRadius = `${0.5 * scale}px`;
    armorTop.style.zIndex = "2";
    armorTop.style.display = "flex";
    armorTop.style.justifyContent = "space-around";
    armorTop.style.alignItems = "center";
    
    // Perçin cıvataları
    for (let i = 0; i < 3; i++) {
      const rivet = document.createElement("div");
      rivet.style.width = `${1.6 * scale}px`;
      rivet.style.height = `${1.6 * scale}px`;
      rivet.style.borderRadius = "50%";
      rivet.style.backgroundColor = "rgb(120, 122, 130)";
      armorTop.appendChild(rivet);
    }
    parentEl.appendChild(armorTop);

    const armorBottom = armorTop.cloneNode(true);
    armorBottom.style.top = "auto";
    armorBottom.style.bottom = `${5 * scale}px`;
    parentEl.appendChild(armorBottom);

    // Taret Kulesi
    const turret = document.createElement("div");
    turret.style.position = "absolute";
    turret.style.left = `${width * 0.25}px`;
    turret.style.top = "50%";
    turret.style.transform = "translate(-50%, -50%)";
    turret.style.width = `${14 * scale}px`;
    turret.style.height = `${14 * scale}px`;
    turret.style.borderRadius = "50%";
    turret.style.backgroundColor = "rgb(30, 32, 36)";
    turret.style.zIndex = "5";

    const turretHatch = document.createElement("div");
    turretHatch.style.position = "absolute";
    turretHatch.style.top = "50%";
    turretHatch.style.left = "50%";
    turretHatch.style.transform = "translate(-50%, -50%)";
    turretHatch.style.width = `${8 * scale}px`;
    turretHatch.style.height = `${8 * scale}px`;
    turretHatch.style.borderRadius = "50%";
    turretHatch.style.backgroundColor = color;
    turret.appendChild(turretHatch);

    parentEl.appendChild(turret);
  }
}
