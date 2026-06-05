import { k } from "../kaplay.js";
import { changeState } from "../states.js";
import { spawnExplosion } from "../utils.js";
import { isHost } from "playroomkit";

/**
 * Handle head-on duel clash state, inputs, physics push, and finish triggers.
 */
export function startDuel(car1, car2, collisionNormal, midPoint, checkGameOver) {
  let m1 = 0, m2 = 0;
  let duelEnded = false;

  changeState(car1, "CLASH");
  changeState(car2, "CLASH");

  car1.isInvulnerable = true;
  car2.isInvulnerable = true;

  const clashLabel = k.add([
    k.text("KAFA KAFAYA!", { size: 24, font: "sans-serif", weight: "bold", letterSpacing: 3 }),
    k.pos(k.center().add(0, -120)),
    k.anchor("center"),
    k.color(255, 70, 85),
  ]);

  k.shake(8);

  const finishClash = () => {
    if (duelEnded) return;
    duelEnded = true;

    if (cancel1) cancel1.cancel();
    if (cancel2) cancel2.cancel();
    if (tapWatcher) tapWatcher.cancel();
    clashLabel.destroy();

    changeState(car1, "RECOIL");
    changeState(car2, "RECOIL");

    spawnExplosion(midPoint, 30);
    k.shake(15);

    const diff = Math.abs(m1 - m2);
    const damage = 35; // Düelloyu kaybedenin alacağı hasar

    if (diff <= 2) {
      car1.speed = -350 * (car2.mass / car1.mass);
      car2.speed = -350 * (car1.mass / car2.mass);
    } else if (m1 > m2) {
      // car2 kaybetti
      car2.hp = Math.max(0, car2.hp - damage);
      const origColor = car2.color;
      car2.color = k.rgb(255, 255, 255);
      k.wait(0.2, () => {
        car2.color = origColor;
      });

      car2.speed = -550 * (car1.mass / car2.mass);
      car1.speed = car1.maxSpeed + 100;
      if (car1.onClashWin) car1.onClashWin();
    } else {
      // car1 kaybetti
      car1.hp = Math.max(0, car1.hp - damage);
      const origColor = car1.color;
      car1.color = k.rgb(255, 255, 255);
      k.wait(0.2, () => {
        car1.color = origColor;
      });

      car1.speed = -550 * (car2.mass / car1.mass);
      car2.speed = car2.maxSpeed + 100;
      if (car2.onClashWin) car2.onClashWin();
    }

    if (checkGameOver) {
      checkGameOver();
    }

    k.wait(0.6, () => {
      changeState(car1, "DRIVING");
      changeState(car2, "DRIVING");
      car1.isInvulnerable = false;
      car2.isInvulnerable = false;
    });
  };

  const processTap = (playerIndex, amount) => {
    if (duelEnded) return;
    k.shake(1.5);
    if (playerIndex === 1) {
      m1 += amount;
      car1.pos = car1.pos.add(collisionNormal.scale(5 * amount));
      car2.pos = car2.pos.add(collisionNormal.scale(5 * amount));
      spawnExplosion(car1.pos.add(k.Vec2.fromAngle(car1.angle).scale(23)), 1);
      if (m1 - m2 >= 5) finishClash();
    } else {
      m2 += amount;
      car1.pos = car1.pos.sub(collisionNormal.scale(5 * amount));
      car2.pos = car2.pos.sub(collisionNormal.scale(5 * amount));
      spawnExplosion(car2.pos.add(k.Vec2.fromAngle(car2.angle).scale(23)), 1);
      if (m2 - m1 >= 5) finishClash();
    }
  };

  let cancel1 = null;
  let cancel2 = null;
  let tapWatcher = null;

  // MULTIPLAYER PLAYROOM MODE
  if (car1.playerInfo && car2.playerInfo) {
    let lastTaps1 = car1.playerInfo.getState("clashTaps") || 0;
    let lastTaps2 = car2.playerInfo.getState("clashTaps") || 0;

    tapWatcher = k.onUpdate(() => {
      if (duelEnded) return;

      const currentTaps1 = car1.playerInfo.getState("clashTaps") || 0;
      if (currentTaps1 > lastTaps1) {
        const diff = currentTaps1 - lastTaps1;
        lastTaps1 = currentTaps1;
        processTap(1, diff);
      }

      const currentTaps2 = car2.playerInfo.getState("clashTaps") || 0;
      if (currentTaps2 > lastTaps2) {
        const diff = currentTaps2 - lastTaps2;
        lastTaps2 = currentTaps2;
        processTap(2, diff);
      }
    });
  } else {
    // LOCAL/OFFLINE FALLBACK MODE
    cancel1 = k.onKeyPress(car1.controls?.forward || "w", () => {
      processTap(1, 1);
    });

    cancel2 = k.onKeyPress(car2.controls?.forward || "up", () => {
      processTap(2, 1);
    });
  }

  k.wait(1.8, () => {
    finishClash();
  });
}
