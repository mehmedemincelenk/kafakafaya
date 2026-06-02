import { k } from "./kaplay.js";
import { CAR_TYPES } from "./config.js";
import { CAR_STATES } from "./states.js";

// İki oyuncunun da arabasını aynı standartta üreten bileşen fonksiyonu.
export function addCar({ name, tag, color, startPos, startAngle, controls, type = "BALANCED" }) {
  const config = CAR_TYPES[type] || CAR_TYPES.BALANCED;
  const car = k.add([
    k.rect(46, 26, { radius: 4 }), // Aracın ana gövde kutusu
    k.color(color),
    k.pos(startPos),
    k.rotate(startAngle),
    k.anchor("center"),
    k.area(), // Çarpışma alanı algılayıcı hitbox
    tag,      // Oyuncuyu ayırt eden benzersiz etiket (örn. 'player1')
    "player", // Genel grup etiketi
    {
      state: "DRIVING",
      controls,
      speed: 0,
      maxSpeed: config.maxSpeed,
      reverseSpeed: config.reverseSpeed,
      acceleration: config.acceleration,
      deceleration: config.deceleration,
      turnSpeed: config.turnSpeed,
      hp: config.maxHp,
      maxHp: config.maxHp,
      mass: config.mass,
      isInvulnerable: false,
    },
  ]);

  // Klasik Can Barı Arka Planı (Koyu Gri)
  const healthBarBg = k.add([
    k.rect(40, 5, { radius: 1.5 }),
    k.color(30, 30, 32),
    k.pos(startPos.add(0, -25)),
    k.anchor("center"),
  ]);

  // Klasik Can Barı Dolgusu (Oyuncu Renginde)
  const healthBarFill = k.add([
    k.rect(40, 5, { radius: 1.5 }),
    k.color(color),
    k.pos(startPos.add(-20, -25)),
    k.anchor("left"),
    k.scale(1),
  ]);

  // Hafıza Yönetimi (Oyuncu yok edildiğinde can barını da siler)
  car.onDestroy(() => {
    healthBarBg.destroy();
    healthBarFill.destroy();
  });

  // Farlar ve Tekerlekler
  [[-14, -14], [14, -14], [-14, 14], [14, 14]].forEach(([x, y]) => {
    car.add([k.rect(12, 6), k.pos(x, y), k.color(45, 45, 48), k.anchor("center")]);
  });
  [[-8], [8]].forEach(([y]) => {
    car.add([k.rect(5, 8, { radius: 1 }), k.pos(23, y), k.color(255, 235, 120), k.anchor("center")]);
  });

  // Sınıf Bazlı Görsel Süslemeler (Basit Araba Kıyafetleri)
  if (type === "FAST") {
    // Rüzgarlık (Spoiler)
    car.add([k.rect(4, 28), k.pos(-18, 0), k.color(20, 20, 22), k.anchor("center")]);
    car.add([k.rect(6, 32), k.pos(-21, 0), k.color(color), k.anchor("center")]);
  } else if (type === "HEAVY") {
    // Ön Koruma Bumper Demiri (Bullbar)
    car.add([k.rect(4, 30), k.pos(25, 0), k.color(75, 75, 80), k.anchor("center")]);
    car.add([k.rect(8, 4), k.pos(23, -11), k.color(75, 75, 80), k.anchor("center")]);
    car.add([k.rect(8, 4), k.pos(23, 11), k.color(75, 75, 80), k.anchor("center")]);
  }

  // Araç Fizik ve Kontrol Güncelleme Döngüsü (Her Karede Çalışır)
  car.onUpdate(() => {
    if (k.gameOver) {
      healthBarBg.hidden = true;
      healthBarFill.hidden = true;
      return; // Oyun bittiyse hareketleri dondur
    }

    healthBarBg.hidden = false;
    healthBarFill.hidden = false;

    // Can barını araca göre konumlandır (Dönüşlerden etkilenmemesi için bağımsız)
    healthBarBg.pos = car.pos.add(0, -25);
    healthBarFill.pos = car.pos.add(-20, -25);

    // Can değerine göre dolgu genişliğini scale ile güncelle
    healthBarFill.scale.x = Math.max(0, car.hp / car.maxHp);

    CAR_STATES[car.state]?.update?.(car);
  });

  return car;
}
