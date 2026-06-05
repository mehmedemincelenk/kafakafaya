export const CAR_CLASSES = {
  HIPHIZLI: { maxHp: 90, maxSpeed: 380, acceleration: 220, turnSpeed: 300, mass: 0.7 },
  GUCLU: { maxHp: 135, maxSpeed: 290, acceleration: 125, turnSpeed: 210, mass: 1.55 },
  TANK: { maxHp: 235, maxSpeed: 205, acceleration: 75, turnSpeed: 125, mass: 2.65 }
};

export const CAR_COSTS = { 
  BARKAN: 0, 
  BARKAN_2: 150, 
  KAPGAN: 200, 
  ASLAN: 0, 
  TUNGA: 180, 
  GOLGE_SUVARI: 220, 
  ALPAR: 250
};

export const CAR_TYPES = {
  // --- HIZLI (HIPHIZLI) ---
  BARKAN: {
    width: 48, height: 28, radius: 4,
    color: [100, 105, 110], // Tactical Grey
    maxSpeed: 400, reverseSpeed: -320, acceleration: 240, deceleration: 250, turnSpeed: 320, maxHp: 80, mass: 0.6,
    class: "HIPHIZLI",
    skillId: "leader_trail", // KİNETİK TAMPON
    manufacturer: "HAVELSAN"
  },
  ASLAN: {
    width: 48, height: 28, radius: 4,
    color: [105, 108, 112], // Armored Silver Grey
    maxSpeed: 370, reverseSpeed: -300, acceleration: 200, deceleration: 220, turnSpeed: 290, maxHp: 95, mass: 0.8,
    class: "HIPHIZLI",
    skillId: "gnss_jammer", // ELEKTRO-MANYETİK ŞOK
    manufacturer: "ASELSAN"
  },
  KAPGAN: {
    width: 58, height: 38, radius: 6, // Slightly smaller since it's Hızlı now
    color: [45, 47, 50], // Deep Heavy Graphite
    maxSpeed: 380, reverseSpeed: -300, acceleration: 220, deceleration: 230, turnSpeed: 300, maxHp: 90, mass: 0.75,
    class: "HIPHIZLI",
    skillId: "ghost", // HAYALET TAARRUZ
    manufacturer: "HAVELSAN"
  },

  // --- GÜÇLÜ ---
  BARKAN_2: {
    width: 50, height: 30, radius: 4,
    color: [90, 94, 98], // Dark Slate Grey
    maxSpeed: 310, reverseSpeed: -260, acceleration: 140, deceleration: 160, turnSpeed: 230, maxHp: 120, mass: 1.3,
    class: "GUCLU",
    skillId: "swarm_mark", // ZIRH KIRICI
    manufacturer: "HAVELSAN"
  },
  TUNGA: {
    width: 58, height: 38, radius: 8,
    color: [75, 78, 82], // Military Brown-Grey
    maxSpeed: 270, reverseSpeed: -220, acceleration: 110, deceleration: 130, turnSpeed: 190, maxHp: 150, mass: 1.8,
    class: "GUCLU",
    skillId: "sarp_ram", // SARP DUAL KOCBASI
    manufacturer: "ASELSAN"
  },

  // --- TANK ---
  GOLGE_SUVARI: {
    width: 76, height: 52, radius: 10,
    color: [55, 57, 60], // Armored Dark Matte Grey
    maxSpeed: 200, reverseSpeed: -150, acceleration: 70, deceleration: 90, turnSpeed: 130, maxHp: 220, mass: 2.5,
    class: "TANK",
    skillId: "active_suspension", // AKTIF SUSPANSIYON
    manufacturer: "FNSS"
  },
  ALPAR: {
    width: 78, height: 54, radius: 10,
    color: [40, 43, 40], // Forest Olive Green
    maxSpeed: 210, reverseSpeed: -160, acceleration: 80, deceleration: 100, turnSpeed: 120, maxHp: 250, mass: 2.8,
    class: "TANK",
    skillId: "tactical_repair", // REAKTİF ZIRH
    manufacturer: "OTOKAR"
  }
};

export const ARENA_MARGIN = 24;

export const CAR_SKINS = {
  BARKAN: [
    { id: "default", name: "Varsayılan", cost: 0, status: "available" }
  ],
  BARKAN_2: [
    { id: "default", name: "Varsayılan", cost: 0, status: "available" }
  ],
  ASLAN: [
    { id: "default", name: "Varsayılan", cost: 0, status: "available" }
  ],
  TUNGA: [
    { id: "default", name: "Varsayılan", cost: 0, status: "available" }
  ],
  KAPGAN: [
    { id: "default", name: "Varsayılan", cost: 0, status: "available" }
  ],
  GOLGE_SUVARI: [
    { id: "default", name: "Varsayılan", cost: 0, status: "available" }
  ],
  ALPAR: [
    { id: "default", name: "Varsayılan", cost: 0, status: "available" }
  ]
};

export const PROJECTILES = {
  mizrak: {
    name: "Mızrak",
    type: "Akıllı Dolanan Mühimmat",
    manufacturer: "BAYKAR",
    damage: 120,
    speed: 350,
    explosionRadius: 150,
    homing: true,
    turnSpeed: 120,
    width: 36,
    height: 12,
    health: 1,
    behavior: "Havada süzülerek en yüksek cana sahip düşman kara aracına kilitlenir ve çarptığında büyük bir patlama alanı yaratır.",
    icon: "🚀",
    cost: 0,
    category: "WEAPON"
  },
  sivrisinek: {
    name: "Sivrisinek",
    type: "Akıllı Dolanan Mühimmat",
    manufacturer: "BAYKAR",
    damage: 70,
    speed: 420,
    explosionRadius: 90,
    homing: true,
    turnSpeed: 180,
    width: 15,
    height: 6,
    health: 1,
    swarmCount: 15,
    physDamage: 6,
    physSpeed: 280,
    physTurnSpeed: 180,
    physExplosionRadius: 35,
    behavior: "Kıvrak akıllı mühimmattır. En yakındaki düşman kara aracına kilitlenerek yüksek manevra kabiliyetiyle dalar.",
    icon: "🦟",
    cost: 60,
    category: "WEAPON"
  },
  mam_l: {
    name: "MAM-L",
    type: "Mini Akıllı Mühimmat",
    manufacturer: "ROKETSAN",
    damage: 85,
    speed: 310,
    explosionRadius: 60,
    homing: true,
    turnSpeed: 110,
    width: 10,
    height: 5,
    health: 1,
    bypassArmor: true,
    behavior: "Süzülerek rakibe kilitlenir. Zırh delici başlığı sayesinde zırhı yok sayarak doğrudan cana hasar vurur.",
    icon: "🔥",
    cost: 90,
    category: "WEAPON"
  },
  mam_t: {
    name: "MAM-T",
    type: "Akıllı Mühimmat",
    manufacturer: "ROKETSAN",
    damage: 100,
    speed: 290,
    explosionRadius: 120,
    homing: true,
    turnSpeed: 75,
    width: 14,
    height: 8,
    health: 1,
    behavior: "Lazer arayıcı başlıklı mühimmattır. Geniş bir alandaki tüm düşmanlara ağır hasar verir.",
    icon: "💣",
    cost: 120,
    category: "WEAPON"
  },
  kemankes_1: {
    name: "KEMANKEŞ 1",
    type: "Mini Seyir Füzesi",
    manufacturer: "BAYKAR",
    damage: 130,
    speed: 480,
    explosionRadius: 80,
    homing: true,
    turnSpeed: 105,
    width: 17,
    height: 6,
    health: 1,
    behavior: "Aşırı hızlı jet motorlu mini seyir füzesidir. Dar ama derin hasar verir.",
    icon: "🎯",
    cost: 150,
    category: "WEAPON"
  },
  kemankes_2: {
    name: "KEMANKEŞ 2",
    type: "Mini Seyir Füzesi",
    manufacturer: "BAYKAR",
    damage: 180,
    speed: 460,
    explosionRadius: 100,
    homing: true,
    turnSpeed: 95,
    width: 25,
    height: 8,
    health: 1,
    behavior: "Jet motorlu mini seyir füzesidir. Devasa hızıyla hedefe saniyeler içinde ulaşır ve kritik hasar verir.",
    icon: "💘",
    cost: 180,
    category: "WEAPON"
  },
  cakir: {
    name: "ÇAKIR",
    type: "Seyir Füzesi",
    manufacturer: "ROKETSAN",
    damage: 220,
    speed: 520,
    explosionRadius: 180,
    homing: true,
    turnSpeed: 55,
    width: 41,
    height: 10,
    health: 3,
    behavior: "Radar soğurucu gövdeye sahip turbojet motorlu seyir füzesidir. Aşırı ağır hasar verir.",
    icon: "⚡",
    cost: 220,
    category: "WEAPON"
  },
  mini_iha: {
    name: "Mini İHA",
    type: "Mini Robot İHA",
    manufacturer: "BAYKAR",
    damage: 0,
    speed: 120,
    explosionRadius: 0,
    homing: false,
    turnSpeed: 0,
    width: 22,
    height: 5,
    health: 1,
    behavior: "En yakın düşmanın üstünde döner; 10 saniye boyunca onun kontrol tuşlarını tersine çevirerek yavaşlatır.",
    icon: "🛩️",
    cost: 0,
    category: "SUPPORT"
  },
  kalkan_diha: {
    name: "KALKAN DİHA",
    type: "Gözetleme DİHA'sı",
    manufacturer: "BAYKAR",
    damage: 0,
    speed: 180,
    explosionRadius: 0,
    homing: false,
    turnSpeed: 0,
    width: 32,
    height: 8,
    health: 1,
    behavior: "Dikey kalkış yapar. 15 saniye boyunca çevredeki tüm düşmanların yerini açığa çıkarır ve zırh yeniler.",
    icon: "🛡️",
    cost: 100,
    category: "SUPPORT"
  },
  fettah: {
    name: "FETTAH",
    type: "Hipersonik Füze",
    manufacturer: "ROKETSAN",
    damage: 250,
    speed: 680,
    explosionRadius: 160,
    homing: true,
    turnSpeed: 45,
    width: 55,
    height: 8,
    health: 1,
    behavior: "Katı yakıtlı hipersonik füzedir. İnanılmaz hızı ve yıkıcı patlama etkisiyle hedefleri anında kül eder.",
    icon: "💘",
    cost: 250,
    category: "WEAPON"
  },
  fettah_2: {
    name: "FETTAH 2",
    type: "Gelişmiş Hipersonik Füze",
    manufacturer: "ROKETSAN",
    damage: 300,
    speed: 720,
    explosionRadius: 200,
    homing: true,
    turnSpeed: 40,
    width: 60,
    height: 9,
    health: 2,
    behavior: "Aero-balistik manevra kabiliyetine sahip ikinci nesil hipersonik füzedir. Durdurulamaz hızda devasa hasar verir.",
    icon: "💘",
    cost: 300,
    category: "WEAPON"
  },
  ebabil: {
    name: "EBABİL",
    type: "MIRV Balistik Füze",
    manufacturer: "GIDS",
    damage: 350,
    speed: 800,
    explosionRadius: 250,
    homing: true,
    turnSpeed: 25,
    width: 80,
    height: 12,
    health: 4,
    behavior: "MIRV harp başlığı taşıyan orta menzilli balistik füzedir. Düşmana yönelen en yıkıcı ve en ağır silahtır.",
    icon: "💘",
    cost: 350,
    category: "WEAPON"
  }
};
