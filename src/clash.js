import { k } from "./kaplay.js";
import { changeState } from "./states.js";
import { spawnExplosion } from "./utils.js";

/**
 * Handle head-on duel clash state, inputs, physics push, and finish triggers.
 */
export function startDuel(car1, car2, collisionNormal, midPoint) {
  let m1 = 0, m2 = 0;
  let duelEnded = false;

  changeState(car1, "CLASH");
  changeState(car2, "CLASH");

  car1.isInvulnerable = true;
  car2.isInvulnerable = true;

  const clashLabel = k.add([
    k.text("KAFA KAFAYA!", { size: 28 }),
    k.pos(k.center().add(0, -120)),
    k.anchor("center"),
    k.color(255, 215, 0),
  ]);

  k.shake(8);

  const finishClash = () => {
    if (duelEnded) return;
    duelEnded = true;

    cancel1.cancel();
    cancel2.cancel();
    clashLabel.destroy();

    changeState(car1, "RECOIL");
    changeState(car2, "RECOIL");

    spawnExplosion(midPoint, 30);
    k.shake(15);

    const diff = Math.abs(m1 - m2);

    if (diff <= 2) {
      car1.speed = -350 * (car2.mass / car1.mass);
      car2.speed = -350 * (car1.mass / car2.mass);
    } else if (m1 > m2) {
      car2.speed = -550 * (car1.mass / car2.mass);
      car1.speed = car1.maxSpeed + 100;
    } else {
      car1.speed = -550 * (car2.mass / car1.mass);
      car2.speed = car2.maxSpeed + 100;
    }

    k.wait(0.6, () => {
      changeState(car1, "DRIVING");
      changeState(car2, "DRIVING");
      car1.isInvulnerable = false;
      car2.isInvulnerable = false;
    });
  };

  const cancel1 = k.onKeyPress(car1.controls.forward, () => {
    if (duelEnded) return;
    m1++;
    k.shake(1.5);
    car1.pos = car1.pos.add(collisionNormal.scale(5));
    car2.pos = car2.pos.add(collisionNormal.scale(5));
    spawnExplosion(car1.pos.add(k.Vec2.fromAngle(car1.angle).scale(23)), 1);

    if (m1 - m2 >= 5) finishClash();
  });
  
  const cancel2 = k.onKeyPress(car2.controls.forward, () => {
    if (duelEnded) return;
    m2++;
    k.shake(1.5);
    car1.pos = car1.pos.sub(collisionNormal.scale(5));
    car2.pos = car2.pos.sub(collisionNormal.scale(5));
    spawnExplosion(car2.pos.add(k.Vec2.fromAngle(car2.angle).scale(23)), 1);

    if (m2 - m1 >= 5) finishClash();
  });

  k.wait(1.8, () => {
    finishClash();
  });
}
