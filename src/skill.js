import { k } from "./kaplay.js";
import { CAR_TYPES } from "./config.js";

// Her araç tipine özel, görsel çizmeyi gerektirmeyen, tamamen matematik ve fizik tabanlı minimalist yetenekler.
export const SKILLS = {
  DENGELI: {
    name: "HUCUM KALKANI",
    cooldown: 7,
    duration: 1.5,
    activate: (car) => {
      car.isInvulnerable = true;
      car.use(k.outline(3, k.rgb(255, 255, 255))); // Beyaz kalkan dış hattı ekle
      car.speed = car.maxSpeed * 2.2; // İleri doğru atılım ivmesi
    },
    deactivate: (car) => {
      car.isInvulnerable = false;
      car.unuse("outline"); // Kalkan hattını kaldır
    }
  },

  HIPHIZLI: {
    name: "HAYALET",
    cooldown: 6,
    duration: 0.8,
    activate: (car) => {
      car.isGhost = true;
      car.opacity = 0.3; // Yarı saydam yap
    },
    deactivate: (car) => {
      car.isGhost = false;
      car.opacity = 1.0;
    }
  },
  GUCLU: {
    name: "OFKE",
    cooldown: 7,
    duration: 2.0,
    activate: (car) => {
      car.mass = car.mass * 3;
      car.use(k.outline(2, k.rgb(255, 215, 0))); // Altın rengi öfke efekti
    },
    deactivate: (car) => {
      car.mass = CAR_TYPES.GUCLU.mass; // Config'deki orijinal kütleye güvenli sıfırla
      car.unuse("outline");
    }
  },
  TANK: {
    name: "DEMIR",
    cooldown: 8,
    duration: 1.2,
    activate: (car) => {
      car.isInvulnerable = true;
      car.isAnchored = true; // Hareketsiz sabitle
      car.mass = 99999;
      car.speed = 0;
    },
    deactivate: (car) => {
      car.isInvulnerable = false;
      car.isAnchored = false;
      car.mass = CAR_TYPES.TANK.mass; // Config'deki orijinal kütleye güvenli sıfırla
    }
  },
  DRIFT: {
    name: "TURBO DRIFT",
    cooldown: 5,
    duration: 1.5,
    activate: (car) => {
      car.turnSpeed = car.turnSpeed * 1.8;
    },
    deactivate: (car) => {
      car.turnSpeed = CAR_TYPES.DRIFT.turnSpeed; // Config'deki orijinal dönüş hızına sıfırla
    }
  }
};
