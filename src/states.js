import { k } from "./kaplay.js";
import { ARENA_MARGIN } from "./config.js";

// HFSM Base State Sınıfı
class BaseCarState {
  enter(car) {}
  exit(car) {}
  update(car) {}
}

// Süper-durum: Aktif fizik ve arena sınır kontrollerini yönetir (DRY)
class ActivePhysicsState extends BaseCarState {
  update(car) {
    if (car.isAnchored) {
      car.speed = 0;
      return;
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
}

// Alt-durum: Oyuncunun kontrolü elinde tuttuğu ve sürüş yaptığı durum
class DrivingState extends ActivePhysicsState {
  update(car) {
    const isMoving = car.driveInputs?.forward || false;
    const isReversing = car.driveInputs?.backward || false;

    let currentMax = car.maxSpeed;
    if (car.dashActive) {
      currentMax = car.maxSpeed * 3.0;
    } else if (car.isDengoDashing) {
      currentMax = 900;
    }

    // Hayalet modunda hız artışı
    if (car.skillActive && car.skillId === "ghost") {
      currentMax = currentMax * 1.25;
    }

    if (car.slowTimer && car.slowTimer > 0) {
      currentMax = currentMax * 0.5;
    }

    let currentAcceleration = car.acceleration;
    if (car.skillActive && car.skillId === "sarp_ram") {
      currentAcceleration = currentAcceleration * 0.60; // %40 ivmelenme cezası
    } else if (car.skillActive && car.skillId === "ghost") {
      currentAcceleration = currentAcceleration * 1.50; // %50 ivmelenme artışı
    }

    if (isMoving) car.speed = Math.min(currentMax, car.speed + currentAcceleration * k.dt());
    if (isReversing) car.speed = Math.max(0, car.speed - currentAcceleration * k.dt());

    // Direksiyon (Hızla orantılı dönme hızı, geri giderken yön değişimi)
    // Arabanın geri gitmesi iptal edildiği için sıkışmayı önlemek adına dururken/yavaşken de dönmesine izin veriyoruz
    const turnFactor = Math.max(0.6, Math.min(1, Math.abs(car.speed) / 10)) * (car.speed >= 0 ? 1 : -1);
    let turnLeft = car.driveInputs?.left || false;
    let turnRight = car.driveInputs?.right || false;

    if (car.reversedControlsTimer && car.reversedControlsTimer > 0) {
      const temp = turnLeft;
      turnLeft = turnRight;
      turnRight = temp;
    }

    let currentTurnSpeed = car.turnSpeed;
    if (car.skillActive) {
      if (car.skillId === "sarp_ram") {
        currentTurnSpeed = currentTurnSpeed * 0.65; // %35 direksiyon cezası
      } else if (car.skillId === "swarm_mark") {
        currentTurnSpeed = currentTurnSpeed * 0.85; // %15 direksiyon cezası
      } else if (car.skillId === "dengo_charge") {
        currentTurnSpeed = currentTurnSpeed * 0.40; // Dengo hücumunda %60 direksiyon cezası
      } else if (car.skillId === "default" && car.carClass === "GUCLU") {
        currentTurnSpeed = currentTurnSpeed * 0.85; // Öfke yeteneğinde %15 direksiyon cezası
      }
    }

    if (turnLeft) car.angle -= currentTurnSpeed * turnFactor * k.dt();
    if (turnRight) car.angle += currentTurnSpeed * turnFactor * k.dt();

    // Doğal Yavaşlama (Sürtünme)
    if (!isMoving && !isReversing && car.speed !== 0) {
      const step = car.deceleration * k.dt();
      car.speed = car.speed > 0 ? Math.max(0, car.speed - step) : Math.min(0, car.speed + step);
    }

    // Fizik hareketlerini ve sınır kontrolünü üst süper-duruma devret
    super.update(car);
  }
}

// Alt-durum: Çarpışma sonrası geri tepme durumu (Kullanıcı girdileri yok sayılır)
class RecoilState extends ActivePhysicsState {
  update(car) {
    if (car.speed !== 0) {
      const step = car.deceleration * k.dt();
      car.speed = car.speed > 0 ? Math.max(0, car.speed - step) : Math.min(0, car.speed + step);
    }

    // Fizik hareketlerini ve sınır kontrolünü üst süper-duruma devret
    super.update(car);
  }
}

// Alt-durum: Toslaşma (Clash) esnası (Mini oyun kilitli durumu)
class ClashState extends BaseCarState {
  enter(car) {
    car.speed = 0;
  }
  update(car) {
    if (car.isAnchored) {
      car.speed = 0;
    }
  }
}

// Mevcut nesne tabanlı FSM arayüzünü bozmadan üstüne inşa edilen durum haritası
export const CAR_STATES = {
  DRIVING: new DrivingState(),
  CLASH: new ClashState(),
  RECOIL: new RecoilState()
};

// Durum değiştirici yardımcı fonksiyon
export function changeState(car, newState) {
  if (car.state === newState) return;
  CAR_STATES[car.state]?.exit?.(car);
  car.state = newState;
  CAR_STATES[car.state]?.enter?.(car);
}
