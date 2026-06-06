import { k } from "../kaplay.js";
import { SKILLS } from "../skill.js";

function getSkillIcon(car) {
  if (!car) return "⭐";
  const skillGroup = SKILLS[car.carClass];
  const skill = (skillGroup && skillGroup[car.skillId]) || (skillGroup && skillGroup.default);
  return skill?.icon || "⭐";
}

/**
 * Creates and updates the HUD slots for Dash and Skill for both players using HTML/CSS.
 * @param {Array} cars - List of active cars in the scene
 */
export function setupHUD(cars) {
  const root = document.getElementById("ui-root");
  if (!root) return;

  let hudRoot = document.getElementById("gameplay-hud-root");
  if (!hudRoot) {
    hudRoot = document.createElement("div");
    hudRoot.id = "gameplay-hud-root";
    root.appendChild(hudRoot);
  }

  // Create or update Player Panels
  let bluePanel = document.getElementById("hud-panel-blue");
  if (!bluePanel) {
    bluePanel = document.createElement("div");
    bluePanel.id = "hud-panel-blue";
    bluePanel.className = "hud-player-panel player-blue";
    bluePanel.innerHTML = `
      <div class="hud-slot" id="blue-dash-slot">
        <div class="hud-slot-icon">⚡</div>
        <div class="hud-slot-cooldown" id="blue-dash-cd-overlay"></div>
        <div class="hud-slot-cd-text" id="blue-dash-cd-text"></div>
        <div class="hud-slot-accent"></div>
        <div class="hud-slot-key">Shift</div>
      </div>
      <div class="hud-slot" id="blue-skill-slot">
        <div class="hud-slot-icon" id="blue-skill-icon">🛡️</div>
        <div class="hud-slot-cooldown" id="blue-skill-cd-overlay"></div>
        <div class="hud-slot-cd-text" id="blue-skill-cd-text"></div>
        <div class="hud-slot-accent"></div>
        <div class="hud-slot-key">Q</div>
      </div>
    `;
    hudRoot.appendChild(bluePanel);
  }

  let redPanel = document.getElementById("hud-panel-red");
  if (!redPanel) {
    redPanel = document.createElement("div");
    redPanel.id = "hud-panel-red";
    redPanel.className = "hud-player-panel player-red";
    redPanel.innerHTML = `
      <div class="hud-slot" id="red-dash-slot">
        <div class="hud-slot-icon">⚡</div>
        <div class="hud-slot-cooldown" id="red-dash-cd-overlay"></div>
        <div class="hud-slot-cd-text" id="red-dash-cd-text"></div>
        <div class="hud-slot-accent"></div>
        <div class="hud-slot-key" id="red-dash-key">Enter</div>
      </div>
      <div class="hud-slot" id="red-skill-slot">
        <div class="hud-slot-icon" id="red-skill-icon">🛡️</div>
        <div class="hud-slot-cooldown" id="red-skill-cd-overlay"></div>
        <div class="hud-slot-cd-text" id="red-skill-cd-text"></div>
        <div class="hud-slot-accent"></div>
        <div class="hud-slot-key" id="red-skill-key">Numpad 0</div>
      </div>
    `;
    hudRoot.appendChild(redPanel);
  }

  // Get DOM references for fast access in update loop
  const elBlueDashSlot = document.getElementById("blue-dash-slot");
  const elBlueDashCdOverlay = document.getElementById("blue-dash-cd-overlay");
  const elBlueDashCdText = document.getElementById("blue-dash-cd-text");

  const elBlueSkillSlot = document.getElementById("blue-skill-slot");
  const elBlueSkillIcon = document.getElementById("blue-skill-icon");
  const elBlueSkillCdOverlay = document.getElementById("blue-skill-cd-overlay");
  const elBlueSkillCdText = document.getElementById("blue-skill-cd-text");

  const elRedDashSlot = document.getElementById("red-dash-slot");
  const elRedDashCdOverlay = document.getElementById("red-dash-cd-overlay");
  const elRedDashCdText = document.getElementById("red-dash-cd-text");
  const elRedDashKey = document.getElementById("red-dash-key");

  const elRedSkillSlot = document.getElementById("red-skill-slot");
  const elRedSkillIcon = document.getElementById("red-skill-icon");
  const elRedSkillCdOverlay = document.getElementById("red-skill-cd-overlay");
  const elRedSkillCdText = document.getElementById("red-skill-cd-text");
  const elRedSkillKey = document.getElementById("red-skill-key");

  k.onUpdate(() => {
    const controlsLocked = cars.some(c => c.controlsLocked);
    const showSkills = !controlsLocked && !k.gameOver && !k.isGamePaused;

    // Tüm HUD kökünü gizlemek yerine sadece oyuncuların yetenek panellerini gizliyoruz.
    // Böylece skorbord ve geri sayım (3-2-1) duyuruları her zaman görünür kalıyor.
    if (bluePanel) bluePanel.style.display = showSkills ? "flex" : "none";
    if (redPanel) redPanel.style.display = showSkills ? "flex" : "none";

    // Eğer yetenek barları görünür değilse güncellemeleri atla
    if (!showSkills) return;

    // Correctly find using Kaplay tag checks
    const blueCar = k.isMultiplayer
      ? cars.find(c => c.is("teamBlue"))
      : cars.find(c => c.is("player1"));
    
    const redCar = k.isMultiplayer
      ? cars.find(c => c.is("teamRed"))
      : cars.find(c => c.is("player2"));

    // Update Blue Player HUD
    if (blueCar) {
      // Dash
      if (blueCar.dashActive) {
        elBlueDashSlot.className = "hud-slot active";
        elBlueDashCdOverlay.style.height = "0%";
        elBlueDashCdText.innerText = "";
      } else if (blueCar.dashCooldownTimer > 0) {
        elBlueDashSlot.className = "hud-slot cooldown";
        const pct = (blueCar.dashCooldownTimer / (blueCar.dashCooldown || 3.5)) * 100;
        elBlueDashCdOverlay.style.height = `${pct}%`;
        elBlueDashCdText.innerText = Math.ceil(blueCar.dashCooldownTimer);
      } else {
        elBlueDashSlot.className = "hud-slot ready-dash";
        elBlueDashCdOverlay.style.height = "0%";
        elBlueDashCdText.innerText = "";
      }

      // Skill
      elBlueSkillIcon.innerText = getSkillIcon(blueCar);
      const bSkillGroup = SKILLS[blueCar.carClass];
      const bSkill = (bSkillGroup && bSkillGroup[blueCar.skillId]) || (bSkillGroup && bSkillGroup.default);
      const bSkillMaxCd = bSkill?.cooldown || 7;

      if (blueCar.skillActive) {
        elBlueSkillSlot.className = "hud-slot active";
        elBlueSkillCdOverlay.style.height = "0%";
        elBlueSkillCdText.innerText = "";
      } else if (blueCar.skillCooldownTimer > 0) {
        elBlueSkillSlot.className = "hud-slot cooldown";
        const pct = (blueCar.skillCooldownTimer / bSkillMaxCd) * 100;
        elBlueSkillCdOverlay.style.height = `${pct}%`;
        elBlueSkillCdText.innerText = Math.ceil(blueCar.skillCooldownTimer);
      } else {
        elBlueSkillSlot.className = "hud-slot ready-skill";
        elBlueSkillCdOverlay.style.height = "0%";
        elBlueSkillCdText.innerText = "";
      }
    }

    // Update Red Player HUD
    if (redCar) {
      // Check for bot to change labels
      if (redCar.isBot) {
        if (elRedDashKey) elRedDashKey.innerText = "AI";
        if (elRedSkillKey) elRedSkillKey.innerText = "AI";
      } else {
        if (elRedDashKey) elRedDashKey.innerText = "Enter";
        if (elRedSkillKey) elRedSkillKey.innerText = "Num 0";
      }

      // Dash
      if (redCar.dashActive) {
        elRedDashSlot.className = "hud-slot active";
        elRedDashCdOverlay.style.height = "0%";
        elRedDashCdText.innerText = "";
      } else if (redCar.dashCooldownTimer > 0) {
        elRedDashSlot.className = "hud-slot cooldown";
        const pct = (redCar.dashCooldownTimer / (redCar.dashCooldown || 3.5)) * 100;
        elRedDashCdOverlay.style.height = `${pct}%`;
        elRedDashCdText.innerText = Math.ceil(redCar.dashCooldownTimer);
      } else {
        elRedDashSlot.className = "hud-slot ready-dash";
        elRedDashCdOverlay.style.height = "0%";
        elRedDashCdText.innerText = "";
      }

      // Skill
      elRedSkillIcon.innerText = getSkillIcon(redCar);
      const rSkillGroup = SKILLS[redCar.carClass];
      const rSkill = (rSkillGroup && rSkillGroup[redCar.skillId]) || (rSkillGroup && rSkillGroup.default);
      const rSkillMaxCd = rSkill?.cooldown || 7;

      if (redCar.skillActive) {
        elRedSkillSlot.className = "hud-slot active";
        elRedSkillCdOverlay.style.height = "0%";
        elRedSkillCdText.innerText = "";
      } else if (redCar.skillCooldownTimer > 0) {
        elRedSkillSlot.className = "hud-slot cooldown";
        const pct = (redCar.skillCooldownTimer / rSkillMaxCd) * 100;
        elRedSkillCdOverlay.style.height = `${pct}%`;
        elRedSkillCdText.innerText = Math.ceil(redCar.skillCooldownTimer);
      } else {
        elRedSkillSlot.className = "hud-slot ready-skill";
        elRedSkillCdOverlay.style.height = "0%";
        elRedSkillCdText.innerText = "";
      }
    }
  });
}
