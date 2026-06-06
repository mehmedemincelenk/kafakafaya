import { k } from "../kaplay.js";

/**
 * Attaches the Bot AI behavior to a car, computing inputs toward target car.
 */
export function setupBotAI(botCar, getTargetCar) {
  botCar.botDriveInput = { forward: false, backward: false, left: false, right: false };
  botCar.botTriggerDashPress = false;
  botCar.botTriggerSkillPress = false;
  botCar.stuckTimer = 0;
  botCar.reverseDuration = 0;

  botCar.onUpdate(() => {
    if (k.gameOver || k.isGamePaused || botCar.controlsLocked) {
      botCar.botDriveInput = { forward: false, backward: false, left: false, right: false };
      botCar.botTriggerDashPress = false;
      botCar.botTriggerSkillPress = false;
      return;
    }

    const target = getTargetCar();
    if (!target || target.hp <= 0) {
      botCar.botDriveInput = { forward: false, backward: false, left: false, right: false };
      return;
    }

    const toTarget = target.pos.sub(botCar.pos);
    const dist = toTarget.len();
    const targetAngle = k.rad2deg(Math.atan2(toTarget.y, toTarget.x));
    let diff = targetAngle - botCar.angle;
    diff = ((diff + 180) % 360);
    if (diff < 0) diff += 360;
    diff -= 180;

    // Reset inputs
    botCar.botDriveInput = { forward: false, backward: false, left: false, right: false };
    botCar.botTriggerDashPress = false;
    botCar.botTriggerSkillPress = false;

    if (diff < -5) {
      botCar.botDriveInput.left = true;
    } else if (diff > 5) {
      botCar.botDriveInput.right = true;
    }

    if (Math.abs(diff) < 90) {
      botCar.botDriveInput.forward = true;
    } else {
      botCar.botDriveInput.backward = true;
    }

    // Stuck detection & recovery
    if (botCar.speed < 15 && botCar.botDriveInput.forward) {
      botCar.stuckTimer += k.dt();
    } else {
      botCar.stuckTimer = 0;
    }

    if (botCar.stuckTimer > 0.8) {
      botCar.reverseDuration = 0.6;
      botCar.stuckTimer = 0;
    }

    if (botCar.reverseDuration > 0) {
      botCar.reverseDuration -= k.dt();
      botCar.botDriveInput.forward = false;
      botCar.botDriveInput.backward = true;
      if (botCar.botDriveInput.left) {
        botCar.botDriveInput.left = false;
        botCar.botDriveInput.right = true;
      } else if (botCar.botDriveInput.right) {
        botCar.botDriveInput.right = false;
        botCar.botDriveInput.left = true;
      }
    }

    // Skill/Dash triggers
    if (Math.abs(diff) < 25) {
      if (dist < 280 && botCar.dashCooldownTimer <= 0) {
        botCar.botTriggerDashPress = k.chance(0.12);
      }
      if (dist < 180 && botCar.skillCooldownTimer <= 0) {
        botCar.botTriggerSkillPress = k.chance(0.08);
      }
    }
  });
}
