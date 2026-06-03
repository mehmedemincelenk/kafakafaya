import { k } from "./kaplay.js";
import { isHost, myPlayer } from "playroomkit";

export function getCarInputs(car, playerInfo, controls) {
  let driveInput = { forward: false, backward: false, left: false, right: false };
  let triggerDashPress = false;
  let triggerSkillPress = false;

  if (playerInfo) {
    // --- ÇEVRİMİÇİ / MULTIPLAYER MODU ---
    if (playerInfo.id === myPlayer().id && !car.controlsLocked) {
      // Lokal klavyeyi oku ve ağa gönder
      const localInputs = {
        forward: k.isKeyDown("w") || k.isKeyDown("up"),
        backward: k.isKeyDown("s") || k.isKeyDown("down"),
        left: k.isKeyDown("a") || k.isKeyDown("left"),
        right: k.isKeyDown("d") || k.isKeyDown("right"),
      };
      playerInfo.setState("inputs", localInputs);
      driveInput = localInputs;

      // Clash modunda hızlı basma (tap) tespiti
      if (car.state === "CLASH" && (k.isKeyPressed("w") || k.isKeyPressed("up"))) {
        playerInfo.setState("clashTaps", (playerInfo.getState("clashTaps") || 0) + 1);
      }

      const isBlue = car.isBlue;
      const dashKey = isBlue ? "shift" : "enter";
      const skillKey = isBlue ? "q" : "numpad0";
      const altSkillKey = isBlue ? "q" : "0";

      if (k.isKeyPressed(dashKey)) {
        playerInfo.setState("dashPressed", true);
      }
      if (k.isKeyPressed(skillKey) || (!isBlue && k.isKeyPressed(altSkillKey))) {
        playerInfo.setState("skillPressed", true);
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
      driveInput.forward = k.isKeyDown(controls.forward);
      driveInput.backward = k.isKeyDown(controls.backward);
      driveInput.left = k.isKeyDown(controls.left);
      driveInput.right = k.isKeyDown(controls.right);

      triggerDashPress = controls.dash && k.isKeyPressed(controls.dash);
      triggerSkillPress = controls.skill && (
        k.isKeyPressed(controls.skill) || 
        (controls.skill === "numpad0" && k.isKeyPressed("0"))
      );
    }
  }

  return {
    driveInput,
    triggerDashPress,
    triggerSkillPress,
  };
}
