import { k } from "./kaplay.js";
import { ARENA_MARGIN } from "./config.js";

export const CAR_STATES = {
  DRIVING: {
    update: (car) => {
      if (car.isAnchored) {
        car.speed = 0;
        return;
      }
      const isMoving = car.driveInputs?.forward || false;
      const isReversing = car.driveInputs?.backward || false;

      let currentMax = car.maxSpeed;
      if (car.dashActive) {
        currentMax = car.maxSpeed * 3.0;
      } else if (car.skillActive && car.carClass === "DENGELI") {
        currentMax = car.maxSpeed * 2.2;
      }

      if (car.slowTimer && car.slowTimer > 0) {
        currentMax = currentMax * 0.5;
      }

      if (isMoving) car.speed = Math.min(currentMax, car.speed + car.acceleration * k.dt());
      if (isReversing) car.speed = Math.max(car.reverseSpeed, car.speed - car.acceleration * k.dt());

      // Direksiyon (Hızla orantılı dönme hızı, geri giderken yön değişimi)
      const turnFactor = Math.min(1, Math.abs(car.speed) / 10) * (car.speed >= 0 ? 1 : -1);
      let turnLeft = car.driveInputs?.left || false;
      let turnRight = car.driveInputs?.right || false;

      if (car.reversedControlsTimer && car.reversedControlsTimer > 0) {
        const temp = turnLeft;
        turnLeft = turnRight;
        turnRight = temp;
      }

      if (turnLeft) car.angle -= car.turnSpeed * turnFactor * k.dt();
      if (turnRight) car.angle += car.turnSpeed * turnFactor * k.dt();

      // Doğal Yavaşlama (Sürtünme)
      if (!isMoving && !isReversing && car.speed !== 0) {
        const step = car.deceleration * k.dt();
        car.speed = car.speed > 0 ? Math.max(0, car.speed - step) : Math.min(0, car.speed + step);
      }

      // Konum Güncelleme
      const rad = k.deg2rad(car.angle);
      car.move(Math.cos(rad) * car.speed, Math.sin(rad) * car.speed);

      // Arena Sınırları ve Esnek Sekme
      const oldX = car.pos.x;
      const oldY = car.pos.y;
      car.pos.x = Math.max(ARENA_MARGIN, Math.min(k.width() - ARENA_MARGIN, car.pos.x));
      car.pos.y = Math.max(ARENA_MARGIN, Math.min(k.height() - ARENA_MARGIN, car.pos.y));
      if (car.pos.x !== oldX || car.pos.y !== oldY) {
        car.speed = -car.speed * 0.3;
      }
    }
  },
  CLASH: {
    enter: (car) => {
      car.speed = 0;
    }
  },
  RECOIL: {
    update: (car) => {
      if (car.isAnchored) {
        car.speed = 0;
        return;
      }
      if (car.speed !== 0) {
        const step = car.deceleration * k.dt();
        car.speed = car.speed > 0 ? Math.max(0, car.speed - step) : Math.min(0, car.speed + step);
      }
      const rad = k.deg2rad(car.angle);
      car.move(Math.cos(rad) * car.speed, Math.sin(rad) * car.speed);

      // Sınırlar
      car.pos.x = Math.max(ARENA_MARGIN, Math.min(k.width() - ARENA_MARGIN, car.pos.x));
      car.pos.y = Math.max(ARENA_MARGIN, Math.min(k.height() - ARENA_MARGIN, car.pos.y));
    }
  }
};

export function changeState(car, newState) {
  if (car.state === newState) return;
  CAR_STATES[car.state]?.exit?.(car);
  car.state = newState;
  CAR_STATES[car.state]?.enter?.(car);
}
