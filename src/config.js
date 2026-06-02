export const CAR_TYPES = {
  BALANCED: {
    maxSpeed: 300,
    reverseSpeed: -300,
    acceleration: 130, // Hızlanma hafifçe artırıldı, sürüş hissi iyileştirildi
    deceleration: 150,
    turnSpeed: 240,
    maxHp: 100,
    mass: 1.0,
  },
  FAST: {
    maxSpeed: 370, // Kontrol kaybını azaltmak için hız hafifçe dengelendi
    reverseSpeed: -370,
    acceleration: 170,
    deceleration: 180,
    turnSpeed: 280,
    maxHp: 80,
    mass: 0.8,
  },
  HEAVY: {
    maxSpeed: 250,
    reverseSpeed: -250,
    acceleration: 100,
    deceleration: 130,
    turnSpeed: 190,
    maxHp: 130,
    mass: 1.4,
  },
  TANK: {
    maxSpeed: 210, // Çok yavaş kalmaması için hafifçe artırıldı
    reverseSpeed: -210,
    acceleration: 85,
    deceleration: 110,
    turnSpeed: 150, // Flanklenmeyi önlemek için dönüş hafifçe artırıldı
    maxHp: 160,
    mass: 1.8,
  },
  DRIFT: {
    maxSpeed: 330,
    reverseSpeed: -330,
    acceleration: 140,
    deceleration: 60, // Düşük frenleme ile kayma hissi korundu
    turnSpeed: 320,
    maxHp: 90,
    mass: 0.9,
  },
  GLASS_CANNON: {
    maxSpeed: 410,
    reverseSpeed: -410,
    acceleration: 200, // Anında kaçabilmesi için hızlanma maksimuma çekildi
    deceleration: 170,
    turnSpeed: 270,
    maxHp: 65, // Tek darbede ölmemesi için canı 65'e yuvarlandı
    mass: 0.6, // Çarptığında aşırı savrulması için kütle hafifçe düşürüldü
  }
};
