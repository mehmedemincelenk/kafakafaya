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
      { top: `-${1.5 * scale}px`, left: `${wHalf - 11 * scale}px` },
      { top: `-${1.5 * scale}px`, right: `${wHalf - 11 * scale}px` },
      { bottom: `-${1.5 * scale}px`, left: `${wHalf - 11 * scale}px` },
      { bottom: `-${1.5 * scale}px`, right: `${wHalf - 11 * scale}px` }
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

  // 3. Cyber Cockpit Glass (Stealth Kapgan haricindekilere çizer)
  if (type !== "KAPGAN") {
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
  }

  // 4. LED Headlights & Brake Lights
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

  // 5. Unique Vehicle Design Details
  if (type === "BARKAN") {
    // Kinetic bumper tips
    const bTipTop = document.createElement("div");
    bTipTop.style.position = "absolute";
    bTipTop.style.right = `-${1 * scale}px`;
    bTipTop.style.top = `${7 * scale}px`;
    bTipTop.style.width = `${3 * scale}px`;
    bTipTop.style.height = `${4 * scale}px`;
    bTipTop.style.backgroundColor = color;
    bTipTop.style.zIndex = "3";
    parentEl.appendChild(bTipTop);

    const bTipBottom = bTipTop.cloneNode(true);
    bTipBottom.style.top = "auto";
    bTipBottom.style.bottom = `${7 * scale}px`;
    parentEl.appendChild(bTipBottom);

    // Neon body lines
    const stripeTop = document.createElement("div");
    stripeTop.style.position = "absolute";
    stripeTop.style.left = `${width * 0.22}px`;
    stripeTop.style.top = `${4 * scale}px`;
    stripeTop.style.width = `${width * 0.4}px`;
    stripeTop.style.height = "1.5px";
    stripeTop.style.backgroundColor = color;
    stripeTop.style.zIndex = "3";
    parentEl.appendChild(stripeTop);

    const stripeBottom = stripeTop.cloneNode(true);
    stripeBottom.style.top = "auto";
    stripeBottom.style.bottom = `${4 * scale}px`;
    parentEl.appendChild(stripeBottom);

    // Small rear tail fin
    const tailFin = document.createElement("div");
    tailFin.style.position = "absolute";
    tailFin.style.left = `${3 * scale}px`;
    tailFin.style.top = "50%";
    tailFin.style.transform = "translateY(-50%)";
    tailFin.style.width = `${2 * scale}px`;
    tailFin.style.height = `${6 * scale}px`;
    tailFin.style.backgroundColor = "rgb(20, 22, 25)";
    tailFin.style.borderRadius = `${0.5 * scale}px`;
    tailFin.style.zIndex = "3";
    parentEl.appendChild(tailFin);
  }
  else if (type === "ASLAN") {
    // Radar dome
    const radar = document.createElement("div");
    radar.style.position = "absolute";
    radar.style.left = `${width * 0.3}px`;
    radar.style.top = "50%";
    radar.style.transform = "translate(-50%, -50%)";
    radar.style.width = `${12 * scale}px`;
    radar.style.height = `${12 * scale}px`;
    radar.style.borderRadius = "50%";
    radar.style.backgroundColor = "rgb(30, 35, 45)";
    radar.style.border = `1.5px solid ${color}`;
    radar.style.zIndex = "5";
    parentEl.appendChild(radar);

    // Antenna pods on sides
    const podTop = document.createElement("div");
    podTop.style.position = "absolute";
    podTop.style.left = `${width * 0.15}px`;
    podTop.style.top = `${4 * scale}px`;
    podTop.style.width = `${4 * scale}px`;
    podTop.style.height = `${3 * scale}px`;
    podTop.style.backgroundColor = color;
    podTop.style.zIndex = "3";
    parentEl.appendChild(podTop);

    const podBottom = podTop.cloneNode(true);
    podBottom.style.top = "auto";
    podBottom.style.bottom = `${4 * scale}px`;
    parentEl.appendChild(podBottom);
  }
  else if (type === "KAPGAN") {
    // Triangle cockpit (stealth style)
    const triVisor = document.createElement("div");
    triVisor.style.position = "absolute";
    triVisor.style.left = "40%";
    triVisor.style.top = "50%";
    triVisor.style.transform = "translate(-50%, -50%)";
    triVisor.style.width = "0";
    triVisor.style.height = "0";
    triVisor.style.borderLeft = `${16 * scale}px solid rgb(15, 15, 20)`;
    triVisor.style.borderTop = `${5 * scale}px solid transparent`;
    triVisor.style.borderBottom = `${5 * scale}px solid transparent`;
    triVisor.style.zIndex = "4";
    parentEl.appendChild(triVisor);

    // Swept back stealth fins
    const finTop = document.createElement("div");
    finTop.style.position = "absolute";
    finTop.style.left = `${6 * scale}px`;
    finTop.style.top = `${5 * scale}px`;
    finTop.style.width = `${3 * scale}px`;
    finTop.style.height = `${10 * scale}px`;
    finTop.style.backgroundColor = "rgb(15, 15, 20)";
    finTop.style.transform = "rotate(-35deg)";
    finTop.style.zIndex = "2";
    parentEl.appendChild(finTop);

    const finBottom = finTop.cloneNode(true);
    finBottom.style.top = "auto";
    finBottom.style.bottom = `${5 * scale}px`;
    finBottom.style.transform = "rotate(35deg)";
    parentEl.appendChild(finBottom);

    // Violet neon side lines
    const vStripeTop = document.createElement("div");
    vStripeTop.style.position = "absolute";
    vStripeTop.style.right = `${12 * scale}px`;
    vStripeTop.style.top = `${6 * scale}px`;
    vStripeTop.style.width = `${10 * scale}px`;
    vStripeTop.style.height = "1.5px";
    vStripeTop.style.backgroundColor = "rgb(160, 32, 240)";
    vStripeTop.style.zIndex = "3";
    parentEl.appendChild(vStripeTop);

    const vStripeBottom = vStripeTop.cloneNode(true);
    vStripeBottom.style.top = "auto";
    vStripeBottom.style.bottom = `${6 * scale}px`;
    parentEl.appendChild(vStripeBottom);
  }
  else if (type === "BARKAN_2") {
    // Red scope optics on top
    const scope = document.createElement("div");
    scope.style.position = "absolute";
    scope.style.left = `${width * 0.25}px`;
    scope.style.top = `${hHalf - 4 * scale}px`;
    scope.style.width = `${10 * scale}px`;
    scope.style.height = `${5 * scale}px`;
    scope.style.backgroundColor = "rgb(30, 30, 35)";
    scope.style.borderRadius = `${1 * scale}px`;
    scope.style.zIndex = "5";

    const lens = document.createElement("div");
    lens.style.position = "absolute";
    lens.style.right = "1px";
    lens.style.top = "50%";
    lens.style.transform = "translateY(-50%)";
    lens.style.width = `${3 * scale}px`;
    lens.style.height = `${3 * scale}px`;
    lens.style.borderRadius = "50%";
    lens.style.backgroundColor = "rgb(255, 0, 0)";
    scope.appendChild(lens);
    parentEl.appendChild(scope);

    // Double exhausts
    const exhTop = document.createElement("div");
    exhTop.style.position = "absolute";
    exhTop.style.left = `-${2 * scale}px`;
    exhTop.style.top = `${hHalf - 5 * scale}px`;
    exhTop.style.width = `${4 * scale}px`;
    exhTop.style.height = `${5 * scale}px`;
    exhTop.style.backgroundColor = "rgb(25, 25, 30)";
    exhTop.style.zIndex = "2";

    const flameGlow = document.createElement("div");
    flameGlow.style.position = "absolute";
    flameGlow.style.left = `-${2 * scale}px`;
    flameGlow.style.top = "50%";
    flameGlow.style.transform = "translateY(-50%)";
    flameGlow.style.width = `${2.4 * scale}px`;
    flameGlow.style.height = `${2.4 * scale}px`;
    flameGlow.style.borderRadius = "50%";
    flameGlow.style.backgroundColor = "rgb(255, 120, 0)";
    exhTop.appendChild(flameGlow);
    parentEl.appendChild(exhTop);

    const exhBottom = exhTop.cloneNode(true);
    exhBottom.style.top = `${hHalf + 2 * scale}px`;
    parentEl.appendChild(exhBottom);
  }
  else if (type === "TUNGA") {
    // Ramming spikes (pointed teeth)
    const spikeTop = document.createElement("div");
    spikeTop.style.position = "absolute";
    spikeTop.style.right = `-${6 * scale}px`;
    spikeTop.style.top = `${7 * scale}px`;
    spikeTop.style.width = "0";
    spikeTop.style.height = "0";
    spikeTop.style.borderLeft = `${8 * scale}px solid rgb(50, 52, 58)`;
    spikeTop.style.borderTop = `${4 * scale}px solid transparent`;
    spikeTop.style.borderBottom = `${4 * scale}px solid transparent`;
    spikeTop.style.zIndex = "3";
    parentEl.appendChild(spikeTop);

    const spikeBottom = spikeTop.cloneNode(true);
    spikeBottom.style.top = "auto";
    spikeBottom.style.bottom = `${7 * scale}px`;
    parentEl.appendChild(spikeBottom);

    // Heavy steel bumper grill
    const grill = document.createElement("div");
    grill.style.position = "absolute";
    grill.style.right = `-${2 * scale}px`;
    grill.style.top = "50%";
    grill.style.transform = "translateY(-50%)";
    grill.style.width = `${4 * scale}px`;
    grill.style.height = `${height - 8 * scale}px`;
    grill.style.backgroundColor = "rgb(30, 30, 35)";
    grill.style.zIndex = "3";
    parentEl.appendChild(grill);

    // Mudguards
    const guardTop = document.createElement("div");
    guardTop.style.position = "absolute";
    guardTop.style.left = `${wHalf - 11 * scale}px`;
    guardTop.style.top = `-${2.5 * scale}px`;
    guardTop.style.width = `${15 * scale}px`;
    guardTop.style.height = `${3 * scale}px`;
    guardTop.style.backgroundColor = "rgb(50, 52, 58)";
    guardTop.style.zIndex = "2";
    parentEl.appendChild(guardTop);

    const guardBottom = guardTop.cloneNode(true);
    guardBottom.style.top = "auto";
    guardBottom.style.bottom = `-${2.5 * scale}px`;
    parentEl.appendChild(guardBottom);
  }
  else if (type === "GOLGE_SUVARI") {
    // Heavy Turret Dome
    const turret = document.createElement("div");
    turret.style.position = "absolute";
    turret.style.left = `${width * 0.3}px`;
    turret.style.top = "50%";
    turret.style.transform = "translate(-50%, -50%)";
    turret.style.width = `${18 * scale}px`;
    turret.style.height = `${18 * scale}px`;
    turret.style.borderRadius = "50%";
    turret.style.backgroundColor = "rgb(30, 32, 36)";
    turret.style.zIndex = "5";

    const turretHatch = document.createElement("div");
    turretHatch.style.position = "absolute";
    turretHatch.style.top = "50%";
    turretHatch.style.left = "50%";
    turretHatch.style.transform = "translate(-50%, -50%)";
    turretHatch.style.width = `${10 * scale}px`;
    turretHatch.style.height = `${10 * scale}px`;
    turretHatch.style.borderRadius = "50%";
    turretHatch.style.backgroundColor = color;
    turret.appendChild(turretHatch);
    parentEl.appendChild(turret);

    // Projectile launcher barrel (Namlu)
    const barrel = document.createElement("div");
    barrel.style.position = "absolute";
    barrel.style.left = `${width * 0.3}px`;
    barrel.style.top = `${hHalf - 2 * scale}px`;
    barrel.style.width = `${14 * scale}px`;
    barrel.style.height = `${4 * scale}px`;
    barrel.style.backgroundColor = "rgb(30, 32, 36)";
    barrel.style.zIndex = "4";
    parentEl.appendChild(barrel);

    // Front mine sweeper shield
    const shield = document.createElement("div");
    shield.style.position = "absolute";
    shield.style.right = `-${2 * scale}px`;
    shield.style.top = "50%";
    shield.style.transform = "translateY(-50%)";
    shield.style.width = `${4 * scale}px`;
    shield.style.height = `${height - 12 * scale}px`;
    shield.style.backgroundColor = "rgb(45, 45, 50)";
    shield.style.borderRadius = `${1 * scale}px`;
    shield.style.zIndex = "3";
    parentEl.appendChild(shield);
  }
  else if (type === "ALPAR") {
    // Reactive armor plates (Grid layout)
    const armorGrid = document.createElement("div");
    armorGrid.style.position = "absolute";
    armorGrid.style.top = "0";
    armorGrid.style.left = "0";
    armorGrid.style.width = "100%";
    armorGrid.style.height = "100%";
    armorGrid.style.pointerEvents = "none";
    armorGrid.style.zIndex = "2";

    for (let x = wHalf - 12 * scale; x < wHalf + 16 * scale; x += 14 * scale) {
      // Top plates
      const plateTop = document.createElement("div");
      plateTop.style.position = "absolute";
      plateTop.style.left = `${x}px`;
      plateTop.style.top = `${5 * scale}px`;
      plateTop.style.width = `${10 * scale}px`;
      plateTop.style.height = `${3 * scale}px`;
      plateTop.style.backgroundColor = "rgba(0,0,0,0.15)";
      plateTop.style.borderRadius = `${0.5 * scale}px`;
      armorGrid.appendChild(plateTop);

      // Bottom plates
      const plateBottom = plateTop.cloneNode(true);
      plateBottom.style.top = "auto";
      plateBottom.style.bottom = `${5 * scale}px`;
      armorGrid.appendChild(plateBottom);
    }
    parentEl.appendChild(armorGrid);

    // Green emergency/repair flashing LED beacons
    const beaconTop = document.createElement("div");
    beaconTop.style.position = "absolute";
    beaconTop.style.left = `${width * 0.2}px`;
    beaconTop.style.top = `${hHalf - 4 * scale}px`;
    beaconTop.style.width = `${4 * scale}px`;
    beaconTop.style.height = `${4 * scale}px`;
    beaconTop.style.borderRadius = "50%";
    beaconTop.style.backgroundColor = "rgb(100, 255, 100)";
    beaconTop.style.zIndex = "5";
    parentEl.appendChild(beaconTop);

    const beaconBottom = beaconTop.cloneNode(true);
    beaconBottom.style.top = `${hHalf + 2 * scale}px`;
    parentEl.appendChild(beaconBottom);
  }
}
