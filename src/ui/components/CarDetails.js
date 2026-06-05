import { CAR_TYPES } from "../../config.js";

export function drawHTMLCarDetails(parentEl, type, color, skinId = "default", scale = 1) {
  const cfg = CAR_TYPES[type] || CAR_TYPES.BARKAN;
  const carClass = cfg.class || "DENGELI";
  const wHalf = (cfg.width * scale) / 2;
  const hHalf = (cfg.height * scale) / 2;

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

  // 2. Set distinct geometries via border-radius based on car type
  let rad = cfg.radius || 4;

  parentEl.style.borderRadius = `${rad * scale}px`;
  parentEl.style.clipPath = "none";
  parentEl.style.webkitClipPath = "none";

  if (skinId === "neon") {
    parentEl.style.filter = "drop-shadow(0 0 5px rgb(0, 255, 255))";
  } else if (skinId === "gold") {
    parentEl.style.filter = "drop-shadow(0 3px 6px rgba(220, 175, 50, 0.4))";
  } else {
    parentEl.style.filter = "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.45))";
  }

  // Clear existing content to prevent duplicate drawings
  parentEl.innerHTML = "";

  // 3. Stealth wheels (semi-hidden, dark)
  const wheels = [
    { name: "tl", top: "0px", left: "6px" },
    { name: "tr", top: "0px", right: "6px" },
    { name: "bl", bottom: "0px", left: "6px" },
    { name: "br", bottom: "0px", right: "6px" }
  ];
  const wheelW = Math.max(3, Math.round(8 * scale));
  const wheelH = Math.max(2, Math.round(4 * scale));

  wheels.forEach(w => {
    const wh = document.createElement("div");
    wh.className = `car-wheel-preview wheel-${w.name}`;
    wh.style.width = `${wheelW}px`;
    wh.style.height = `${wheelH}px`;
    wh.style.backgroundColor = skinId === "neon" ? "rgb(0, 255, 255)" : "#101012";
    wh.style.position = "absolute";
    wh.style.borderRadius = "1px";
    wh.style.zIndex = "1";
    if (w.top) wh.style.top = w.top;
    if (w.bottom) wh.style.bottom = w.bottom;
    if (w.left) wh.style.left = w.left;
    if (w.right) wh.style.right = w.right;
    parentEl.appendChild(wh);
  });

  // 5. Sleek Cockpit Visor (Team color branding)
  const cockpit = document.createElement("div");
  cockpit.style.position = "absolute";
  cockpit.style.backgroundColor = color === "#64748b" ? "rgba(255,255,255,0.25)" : color;
  cockpit.style.borderRadius = "1px";
  cockpit.style.boxShadow = `0 0 6px ${color === "#64748b" ? "rgba(255,255,255,0.4)" : color}`;
  cockpit.style.zIndex = "4";

  if (type === "KAPGAN" || type === "GOLGE_SUVARI" || type === "ALPAR") {
    cockpit.style.left = "45%";
    cockpit.style.top = "35%";
    cockpit.style.width = "14%";
    cockpit.style.height = "30%";
    cockpit.style.borderRadius = "50%"; // cupola style
  } else {
    cockpit.style.left = "45%";
    cockpit.style.top = "25%";
    cockpit.style.width = "18%";
    cockpit.style.height = "50%";
  }
  parentEl.appendChild(cockpit);

  // 6. Class-Based details & skins (minimal cuts)
  const decorationsContainer = document.createElement("div");
  decorationsContainer.style.position = "absolute";
  decorationsContainer.style.top = "0";
  decorationsContainer.style.left = "0";
  decorationsContainer.style.width = "100%";
  decorationsContainer.style.height = "100%";
  decorationsContainer.style.pointerEvents = "none";
  decorationsContainer.style.zIndex = "2";
  parentEl.appendChild(decorationsContainer);

  if (carClass === "GUCLU") {
    const bumper = document.createElement("div");
    bumper.style.position = "absolute";
    bumper.style.right = "6px";
    bumper.style.top = "0";
    bumper.style.width = "1px";
    bumper.style.height = "100%";
    bumper.style.backgroundColor = "rgba(0,0,0,0.4)";
    decorationsContainer.appendChild(bumper);
  } else if (carClass === "TANK") {
    const dome = document.createElement("div");
    dome.style.position = "absolute";
    dome.style.left = "25%";
    dome.style.top = "50%";
    dome.style.transform = "translate(-50%, -50%)";
    dome.style.width = `${10 * scale}px`;
    dome.style.height = `${10 * scale}px`;
    dome.style.borderRadius = "50%";
    dome.style.backgroundColor = "#101012";
    decorationsContainer.appendChild(dome);
  }

  // Cosmetics
  if (skinId === "gold") {
    const shine = document.createElement("div");
    shine.style.position = "absolute";
    shine.style.left = "0";
    shine.style.top = "48%";
    shine.style.width = "100%";
    shine.style.height = "4%";
    shine.style.backgroundColor = "rgba(255,255,255,0.4)";
    decorationsContainer.appendChild(shine);
  } else if (skinId === "neon") {
    const glowLines = document.createElement("div");
    glowLines.style.position = "absolute";
    glowLines.style.top = "0";
    glowLines.style.left = "0";
    glowLines.style.width = "100%";
    glowLines.style.height = "100%";
    glowLines.style.borderTop = "0.5px solid rgb(0, 255, 255)";
    glowLines.style.borderBottom = "0.5px solid rgb(0, 255, 255)";
    decorationsContainer.appendChild(glowLines);
  }
}
