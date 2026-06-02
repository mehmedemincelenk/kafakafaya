import { k } from "./kaplay.js";

export const CAR_STATES = {
  DRIVING: {
    update: (car) => {
      const isMoving = k.isKeyDown(car.controls.forward);
      const isReversing = k.isKeyDown(car.controls.backward);

      if (isMoving) car.speed = Math.min(car.maxSpeed, car.speed + car.acceleration * k.dt());
      if (isReversing) car.speed = Math.max(car.reverseSpeed, car.speed - car.acceleration * k.dt());

      // Direksiyon (Hızla orantılı dönme hızı, geri giderken yön değişimi)
      const turnFactor = Math.min(1, Math.abs(car.speed) / 10) * (car.speed >= 0 ? 1 : -1);
      if (k.isKeyDown(car.controls.left)) car.angle -= car.turnSpeed * turnFactor * k.dt();
      if (k.isKeyDown(car.controls.right)) car.angle += car.turnSpeed * turnFactor * k.dt();

      // Doğal Yavaşlama (Sürtünme)
      if (!isMoving && !isReversing && car.speed !== 0) {
        const step = car.deceleration * k.dt();
        car.speed = car.speed > 0 ? Math.max(0, car.speed - step) : Math.min(0, car.speed + step);
      }

      // Konum Güncelleme
      const rad = k.deg2rad(car.angle);
      car.move(Math.cos(rad) * car.speed, Math.sin(rad) * car.speed);

      // Arena Sınırları ve Esnek Sekme
      const margin = 24;
      const oldX = car.pos.x;
      const oldY = car.pos.y;
      car.pos.x = Math.max(margin, Math.min(k.width() - margin, car.pos.x));
      car.pos.y = Math.max(margin, Math.min(k.height() - margin, car.pos.y));
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
      if (car.speed !== 0) {
        const step = car.deceleration * k.dt();
        car.speed = car.speed > 0 ? Math.max(0, car.speed - step) : Math.min(0, car.speed + step);
      }
      const rad = k.deg2rad(car.angle);
      car.move(Math.cos(rad) * car.speed, Math.sin(rad) * car.speed);

      // Sınırlar
      const margin = 24;
      car.pos.x = Math.max(margin, Math.min(k.width() - margin, car.pos.x));
      car.pos.y = Math.max(margin, Math.min(k.height() - margin, car.pos.y));
    }
  }
};

export function changeState(car, newState) {
  if (car.state === newState) return;
  CAR_STATES[car.state]?.exit?.(car);
  car.state = newState;
  CAR_STATES[car.state]?.enter?.(car);
}
