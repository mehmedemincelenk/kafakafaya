import { k } from "../kaplay.js";
import { isHost, myPlayer } from "playroomkit";

export const virtualInputs = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  dash: false,
  skill: false,
  clashTap: false
};

export function getCarInputs(car, playerInfo, controls) {
  if (car.isBot) {
    return {
      driveInput: car.botDriveInput || { forward: false, backward: false, left: false, right: false },
      triggerDashPress: car.botTriggerDashPress || false,
      triggerSkillPress: car.botTriggerSkillPress || false,
    };
  }

  let driveInput = { forward: false, backward: false, left: false, right: false };
  let triggerDashPress = false;
  let triggerSkillPress = false;

  if (playerInfo) {
    // --- ÇEVRİMİÇİ / MULTIPLAYER MODU ---
    if (playerInfo.id === myPlayer().id && !car.controlsLocked) {
      // Lokal klavyeyi veya sanal joystiği oku ve ağa gönder
      const localInputs = {
        forward: k.isKeyDown("w") || k.isKeyDown("up") || virtualInputs.forward,
        backward: k.isKeyDown("s") || k.isKeyDown("down") || virtualInputs.backward,
        left: k.isKeyDown("a") || k.isKeyDown("left") || virtualInputs.left,
        right: k.isKeyDown("d") || k.isKeyDown("right") || virtualInputs.right,
      };
      
      const lastInputs = car.lastSentInputs || {};
      const inputsChanged = 
        lastInputs.forward !== localInputs.forward ||
        lastInputs.backward !== localInputs.backward ||
        lastInputs.left !== localInputs.left ||
        lastInputs.right !== localInputs.right;

      if (inputsChanged) {
        playerInfo.setState("inputs", localInputs);
        car.lastSentInputs = { ...localInputs };
      }
      driveInput = localInputs;

      // Clash modunda hızlı basma (tap) tespiti
      if (car.state === "CLASH" && (k.isKeyPressed("w") || k.isKeyPressed("up") || virtualInputs.clashTap)) {
        playerInfo.setState("clashTaps", (playerInfo.getState("clashTaps") || 0) + 1);
        virtualInputs.clashTap = false;
      }

      const dashKey = "shift";
      const skillKey = "q";

      if (k.isKeyPressed(dashKey) || virtualInputs.dash) {
        playerInfo.setState("dashPressed", true);
        virtualInputs.dash = false;
      }
      if (k.isKeyPressed(skillKey) || virtualInputs.skill) {
        playerInfo.setState("skillPressed", true);
        virtualInputs.skill = false;
      }
    } else {
      // Diğer oyuncuların girdi verilerini ağdan (Playroom state) oku
      const inputs = playerInfo.getState("inputs") || {};
      driveInput.forward = inputs.forward || false;
      driveInput.backward = inputs.backward || false;
      driveInput.left = inputs.left || false;
      driveInput.right = inputs.right || false;
    }

    // Tuş vuruşlarını ağ durumundan senkronize et
    if (playerInfo.getState("dashPressed")) {
      triggerDashPress = true;
      if (isHost()) {
        playerInfo.setState("dashPressed", false);
      }
    }
    if (playerInfo.getState("skillPressed")) {
      triggerSkillPress = true;
      if (isHost()) {
        playerInfo.setState("skillPressed", false);
      }
    }
  } else {
    // --- ÇEVRİMDIŞI / YEREL MOD ---
    if (!car.controlsLocked) {
      const isPlayer1 = car.is("player1") || car.tag === "player1";

      driveInput.forward = k.isKeyDown(controls.forward) || (isPlayer1 && virtualInputs.forward);
      driveInput.backward = k.isKeyDown(controls.backward) || (isPlayer1 && virtualInputs.backward);
      driveInput.left = k.isKeyDown(controls.left) || (isPlayer1 && virtualInputs.left);
      driveInput.right = k.isKeyDown(controls.right) || (isPlayer1 && virtualInputs.right);

      triggerDashPress = (controls.dash && k.isKeyPressed(controls.dash)) || (isPlayer1 && virtualInputs.dash);
      if (isPlayer1 && virtualInputs.dash) virtualInputs.dash = false;

      triggerSkillPress = (controls.skill && (
        k.isKeyPressed(controls.skill) || 
        (controls.skill === "numpad0" && k.isKeyPressed("0"))
      )) || (isPlayer1 && virtualInputs.skill);
      if (isPlayer1 && virtualInputs.skill) virtualInputs.skill = false;
    }
  }

  return {
    driveInput,
    triggerDashPress,
    triggerSkillPress,
  };
}
