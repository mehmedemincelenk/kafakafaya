import { k } from "../kaplay.js";
import { SKILLS } from "../skill.js";

function getSkillIcon(car) {
  if (!car) return "⭐";
  const skillGroup = SKILLS[car.carClass];
  const skill = (skillGroup && skillGroup[car.skillId]) || (skillGroup && skillGroup.default);
  return skill?.icon || "⭐";
}

/**
 * Creates and updates the HUD slots for Dash and Skill for both players.
 * Reduces visual clutter in the main game scene.
 * @param {Array} cars - List of active cars in the scene
 */
export function setupHUD(cars) {
  // --- Sol Alt HUD (Blue / Player 1) ---
  const blueDashBg = k.add([
    k.rect(60, 60, { radius: 10 }),
    k.pos(70, k.height() - 135),
    k.color(20, 20, 25),
    k.opacity(0.85),
    k.outline(2, k.rgb(255, 170, 0)),
    k.z(10),
  ]);
  const blueDashIcon = k.add([
    k.text("⚡", { size: 26 }),
    k.pos(100, k.height() - 105),
    k.anchor("center"),
    k.opacity(1),
    k.z(11),
  ]);
  const blueDashCdCircle = k.add([
    k.circle(18),
    k.pos(100, k.height() - 105),
    k.color(15, 15, 20),
    k.opacity(0),
    k.outline(1.5, k.rgb(100, 100, 105)),
    k.anchor("center"),
    k.z(12),
  ]);
  const blueDashCdProgress = k.add([
    k.circle(18),
    k.pos(100, k.height() - 105),
    k.color(255, 170, 0),
    k.opacity(0),
    k.outline(1.5, k.rgb(255, 255, 255)),
    k.anchor("center"),
    k.scale(1),
    k.z(13),
  ]);
  const blueDashCdText = k.add([
    k.text("", { size: 12, font: "monospace", weight: "bold" }),
    k.pos(100, k.height() - 105),
    k.anchor("center"),
    k.color(255, 255, 255),
    k.z(14),
  ]);
  const blueDashKey = k.add([
    k.text("Shift", { size: 11, font: "monospace" }),
    k.pos(100, k.height() - 65),
    k.anchor("center"),
    k.opacity(1),
    k.color(150, 150, 155),
    k.z(11),
  ]);

  const blueSkillBg = k.add([
    k.rect(60, 60, { radius: 10 }),
    k.pos(150, k.height() - 135),
    k.color(20, 20, 25),
    k.opacity(0.85),
    k.outline(2, k.rgb(0, 255, 100)),
    k.z(10),
  ]);
  const blueSkillIcon = k.add([
    k.text("🛡️", { size: 26 }),
    k.pos(180, k.height() - 105),
    k.anchor("center"),
    k.opacity(1),
    k.z(11),
  ]);
  const blueSkillCdCircle = k.add([
    k.circle(18),
    k.pos(180, k.height() - 105),
    k.color(15, 15, 20),
    k.opacity(0),
    k.outline(1.5, k.rgb(100, 100, 105)),
    k.anchor("center"),
    k.z(12),
  ]);
  const blueSkillCdProgress = k.add([
    k.circle(18),
    k.pos(180, k.height() - 105),
    k.color(0, 255, 100),
    k.opacity(0),
    k.outline(1.5, k.rgb(255, 255, 255)),
    k.anchor("center"),
    k.scale(1),
    k.z(13),
  ]);
  const blueSkillCdText = k.add([
    k.text("", { size: 12, font: "monospace", weight: "bold" }),
    k.pos(180, k.height() - 105),
    k.anchor("center"),
    k.color(255, 255, 255),
    k.z(14),
  ]);
  const blueSkillKey = k.add([
    k.text("Q", { size: 11, font: "monospace" }),
    k.pos(180, k.height() - 65),
    k.anchor("center"),
    k.opacity(1),
    k.color(150, 150, 155),
    k.z(11),
  ]);

  // --- Sağ Alt HUD (Red / Player 2) ---
  const redDashBg = k.add([
    k.rect(60, 60, { radius: 10 }),
    k.pos(k.width() - 220, k.height() - 135),
    k.color(20, 20, 25),
    k.opacity(0.85),
    k.outline(2, k.rgb(255, 170, 0)),
    k.z(10),
  ]);
  const redDashIcon = k.add([
    k.text("⚡", { size: 26 }),
    k.pos(k.width() - 190, k.height() - 105),
    k.anchor("center"),
    k.opacity(1),
    k.z(11),
  ]);
  const redDashCdCircle = k.add([
    k.circle(18),
    k.pos(k.width() - 190, k.height() - 105),
    k.color(15, 15, 20),
    k.opacity(0),
    k.outline(1.5, k.rgb(100, 100, 105)),
    k.anchor("center"),
    k.z(12),
  ]);
  const redDashCdProgress = k.add([
    k.circle(18),
    k.pos(k.width() - 190, k.height() - 105),
    k.color(255, 170, 0),
    k.opacity(0),
    k.outline(1.5, k.rgb(255, 255, 255)),
    k.anchor("center"),
    k.scale(1),
    k.z(13),
  ]);
  const redDashCdText = k.add([
    k.text("", { size: 12, font: "monospace", weight: "bold" }),
    k.pos(k.width() - 190, k.height() - 105),
    k.anchor("center"),
    k.color(255, 255, 255),
    k.z(14),
  ]);
  const redDashKey = k.add([
    k.text("Enter", { size: 11, font: "monospace" }),
    k.pos(k.width() - 190, k.height() - 65),
    k.anchor("center"),
    k.opacity(1),
    k.color(150, 150, 155),
    k.z(11),
  ]);

  const redSkillBg = k.add([
    k.rect(60, 60, { radius: 10 }),
    k.pos(k.width() - 140, k.height() - 135),
    k.color(20, 20, 25),
    k.opacity(0.85),
    k.outline(2, k.rgb(0, 255, 100)),
    k.z(10),
  ]);
  const redSkillIcon = k.add([
    k.text("🛡️", { size: 26 }),
    k.pos(k.width() - 110, k.height() - 105),
    k.anchor("center"),
    k.opacity(1),
    k.z(11),
  ]);
  const redSkillCdCircle = k.add([
    k.circle(18),
    k.pos(k.width() - 110, k.height() - 105),
    k.color(15, 15, 20),
    k.opacity(0),
    k.outline(1.5, k.rgb(100, 100, 105)),
    k.anchor("center"),
    k.z(12),
  ]);
  const redSkillCdProgress = k.add([
    k.circle(18),
    k.pos(k.width() - 110, k.height() - 105),
    k.color(0, 255, 100),
    k.opacity(0),
    k.outline(1.5, k.rgb(255, 255, 255)),
    k.anchor("center"),
    k.scale(1),
    k.z(13),
  ]);
  const redSkillCdText = k.add([
    k.text("", { size: 12, font: "monospace", weight: "bold" }),
    k.pos(k.width() - 110, k.height() - 105),
    k.anchor("center"),
    k.color(255, 255, 255),
    k.z(14),
  ]);
  const redSkillKey = k.add([
    k.text("Numpad 0", { size: 11, font: "monospace" }),
    k.pos(k.width() - 110, k.height() - 65),
    k.anchor("center"),
    k.opacity(1),
    k.color(150, 150, 155),
    k.z(11),
  ]);

  const hudElements = [
    blueDashBg, blueDashIcon, blueDashCdCircle, blueDashCdProgress, blueDashCdText, blueDashKey,
    blueSkillBg, blueSkillIcon, blueSkillCdCircle, blueSkillCdProgress, blueSkillCdText, blueSkillKey,
    redDashBg, redDashIcon, redDashCdCircle, redDashCdProgress, redDashCdText, redDashKey,
    redSkillBg, redSkillIcon, redSkillCdCircle, redSkillCdProgress, redSkillCdText, redSkillKey
  ];

  k.onUpdate(() => {
    const controlsLocked = cars.some(c => c.controlsLocked);
    const showHUD = !controlsLocked && !k.gameOver && !k.isGamePaused;

    hudElements.forEach(el => {
      el.hidden = !showHUD;
    });

    if (!showHUD) return;

    // Correctly find using Kaplay tag checks to avoid shadowing the built-in .tag property.
    const blueCar = k.isMultiplayer
      ? cars.find(c => c.is("teamBlue"))
      : cars.find(c => c.is("player1"));
    
    const redCar = k.isMultiplayer
      ? cars.find(c => c.is("teamRed"))
      : cars.find(c => c.is("player2"));

    // Update Blue Player HUD
    if (blueCar) {
      // Dash Cooldown
      if (blueCar.dashActive) {
        blueDashBg.outline = k.rgb(255, 255, 255);
        blueDashBg.opacity = 0.85;
        blueDashIcon.opacity = 1.0;
        blueDashCdCircle.opacity = 0;
        blueDashCdProgress.opacity = 0;
        blueDashCdText.text = "";
      } else if (blueCar.dashCooldownTimer > 0) {
        blueDashBg.outline = k.rgb(100, 100, 105);
        blueDashBg.opacity = 0.4;
        blueDashIcon.opacity = 0.3;
        blueDashCdCircle.opacity = 0.6;
        blueDashCdProgress.opacity = 0.45;
        blueDashCdProgress.scaleTo(Math.max(0, blueCar.dashCooldownTimer / (blueCar.dashCooldown || 3.5)));
        blueDashCdText.text = Math.ceil(blueCar.dashCooldownTimer).toString();
      } else {
        blueDashBg.outline = k.rgb(255, 170, 0);
        blueDashBg.opacity = 0.85;
        blueDashIcon.opacity = 1.0;
        blueDashCdCircle.opacity = 0;
        blueDashCdProgress.opacity = 0;
        blueDashCdText.text = "";
      }

      // Skill Cooldown
      blueSkillIcon.text = getSkillIcon(blueCar);
      const bSkillGroup = SKILLS[blueCar.carClass];
      const bSkill = (bSkillGroup && bSkillGroup[blueCar.skillId]) || (bSkillGroup && bSkillGroup.default);
      const bSkillMaxCd = bSkill?.cooldown || 7;
      if (blueCar.skillActive) {
        blueSkillBg.outline = k.rgb(0, 255, 255);
        blueSkillBg.opacity = 0.85;
        blueSkillIcon.opacity = 1.0;
        blueSkillCdCircle.opacity = 0;
        blueSkillCdProgress.opacity = 0;
        blueSkillCdText.text = "";
      } else if (blueCar.skillCooldownTimer > 0) {
        blueSkillBg.outline = k.rgb(100, 100, 105);
        blueSkillBg.opacity = 0.4;
        blueSkillIcon.opacity = 0.3;
        blueSkillCdCircle.opacity = 0.6;
        blueSkillCdProgress.opacity = 0.45;
        blueSkillCdProgress.scaleTo(Math.max(0, blueCar.skillCooldownTimer / bSkillMaxCd));
        blueSkillCdText.text = Math.ceil(blueCar.skillCooldownTimer).toString();
      } else {
        blueSkillBg.outline = k.rgb(0, 255, 100);
        blueSkillBg.opacity = 0.85;
        blueSkillIcon.opacity = 1.0;
        blueSkillCdCircle.opacity = 0;
        blueSkillCdProgress.opacity = 0;
        blueSkillCdText.text = "";
      }
    }

    // Update Red Player HUD
    if (redCar) {
      // Dash Cooldown
      if (redCar.dashActive) {
        redDashBg.outline = k.rgb(255, 255, 255);
        redDashBg.opacity = 0.85;
        redDashIcon.opacity = 1.0;
        redDashCdCircle.opacity = 0;
        redDashCdProgress.opacity = 0;
        redDashCdText.text = "";
      } else if (redCar.dashCooldownTimer > 0) {
        redDashBg.outline = k.rgb(100, 100, 105);
        redDashBg.opacity = 0.4;
        redDashIcon.opacity = 0.3;
        redDashCdCircle.opacity = 0.6;
        redDashCdProgress.opacity = 0.45;
        redDashCdProgress.scaleTo(Math.max(0, redCar.dashCooldownTimer / (redCar.dashCooldown || 3.5)));
        redDashCdText.text = Math.ceil(redCar.dashCooldownTimer).toString();
      } else {
        redDashBg.outline = k.rgb(255, 170, 0);
        redDashBg.opacity = 0.85;
        redDashIcon.opacity = 1.0;
        redDashCdCircle.opacity = 0;
        redDashCdProgress.opacity = 0;
        redDashCdText.text = "";
      }

      // Skill Cooldown
      redSkillIcon.text = getSkillIcon(redCar);
      const rSkillGroup = SKILLS[redCar.carClass];
      const rSkill = (rSkillGroup && rSkillGroup[redCar.skillId]) || (rSkillGroup && rSkillGroup.default);
      const rSkillMaxCd = rSkill?.cooldown || 7;
      if (redCar.skillActive) {
        redSkillBg.outline = k.rgb(0, 255, 255);
        redSkillBg.opacity = 0.85;
        redSkillIcon.opacity = 1.0;
        redSkillCdCircle.opacity = 0;
        redSkillCdProgress.opacity = 0;
        redSkillCdText.text = "";
      } else if (redCar.skillCooldownTimer > 0) {
        redSkillBg.outline = k.rgb(100, 100, 105);
        redSkillBg.opacity = 0.4;
        redSkillIcon.opacity = 0.3;
        redSkillCdCircle.opacity = 0.6;
        redSkillCdProgress.opacity = 0.45;
        redSkillCdProgress.scaleTo(Math.max(0, redCar.skillCooldownTimer / rSkillMaxCd));
        redSkillCdText.text = Math.ceil(redCar.skillCooldownTimer).toString();
      } else {
        redSkillBg.outline = k.rgb(0, 255, 100);
        redSkillBg.opacity = 0.85;
        redSkillIcon.opacity = 1.0;
        redSkillCdCircle.opacity = 0;
        redSkillCdProgress.opacity = 0;
        redSkillCdText.text = "";
      }
    }
  });
}
