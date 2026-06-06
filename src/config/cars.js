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
  ALPAR: 250,
  HIFZATULLAH: 280,
  DENGO: 210
};

export const CAR_TYPES = {
  // --- HIZLI (HIPHIZLI) ---
  BARKAN: {
    width: 48, height: 28, radius: 8,
    color: [100, 105, 110], // Tactical Grey
    maxSpeed: 400, reverseSpeed: -320, acceleration: 240, deceleration: 250, turnSpeed: 320, maxHp: 80, mass: 0.6,
    class: "HIPHIZLI",
    skillId: "leader_trail", // KİNETİK TAMPON
    manufacturer: "HAVELSAN"
  },
  ASLAN: {
    width: 48, height: 28, radius: 8,
    color: [105, 108, 112], // Armored Silver Grey
    maxSpeed: 370, reverseSpeed: -300, acceleration: 200, deceleration: 220, turnSpeed: 290, maxHp: 95, mass: 0.8,
    class: "HIPHIZLI",
    skillId: "gnss_jammer", // ELEKTRO-MANYETİK ŞOK
    manufacturer: "ASELSAN"
  },
  KAPGAN: {
    width: 58, height: 38, radius: 12,
    color: [45, 47, 50], // Deep Heavy Graphite
    maxSpeed: 380, reverseSpeed: -300, acceleration: 220, deceleration: 230, turnSpeed: 300, maxHp: 100, mass: 0.85,
    class: "HIPHIZLI",
    skillId: "ghost", // HAYALET TAARRUZ
    manufacturer: "HAVELSAN"
  },

  // --- GÜÇLÜ ---
  BARKAN_2: {
    width: 50, height: 30, radius: 8,
    color: [90, 94, 98], // Dark Slate Grey
    maxSpeed: 310, reverseSpeed: -260, acceleration: 140, deceleration: 160, turnSpeed: 230, maxHp: 120, mass: 1.3,
    class: "GUCLU",
    skillId: "swarm_mark", // SÜRÜ HEDEFLEME
    manufacturer: "HAVELSAN"
  },
  TUNGA: {
    width: 58, height: 38, radius: 10,
    color: [75, 78, 82], // Military Brown-Grey
    maxSpeed: 270, reverseSpeed: -220, acceleration: 110, deceleration: 130, turnSpeed: 190, maxHp: 150, mass: 1.8,
    class: "GUCLU",
    skillId: "sarp_ram", // SARP DUAL KOCBASI
    manufacturer: "ASELSAN"
  },
  DENGO: {
    width: 54, height: 32, radius: 9,
    color: [110, 80, 80], // Rusty Dark Red Matte
    maxSpeed: 290, reverseSpeed: -240, acceleration: 130, deceleration: 150, turnSpeed: 210, maxHp: 135, mass: 1.55,
    class: "GUCLU",
    skillId: "dengo_charge",
    manufacturer: "BMC"
  },

  // --- TANK ---
  GOLGE_SUVARI: {
    width: 76, height: 52, radius: 14,
    color: [55, 57, 60], // Armored Dark Matte Grey
    maxSpeed: 220, reverseSpeed: -160, acceleration: 85, deceleration: 95, turnSpeed: 130, maxHp: 220, mass: 2.5,
    class: "TANK",
    skillId: "active_suspension", // AKTIF SUSPANSIYON
    manufacturer: "FNSS"
  },
  ALPAR: {
    width: 78, height: 54, radius: 14,
    color: [40, 43, 40], // Forest Olive Green
    maxSpeed: 190, reverseSpeed: -140, acceleration: 65, deceleration: 85, turnSpeed: 120, maxHp: 250, mass: 2.8,
    class: "TANK",
    skillId: "tactical_repair", // REAKTİF ZIRH
    manufacturer: "OTOKAR"
  },
  HIFZATULLAH: {
    width: 74, height: 50, radius: 13,
    color: [35, 60, 70], // Cyber Marine Teal
    maxSpeed: 205, reverseSpeed: -150, acceleration: 75, deceleration: 90, turnSpeed: 125, maxHp: 235, mass: 2.65,
    class: "TANK",
    skillId: "hifzatullah_shield",
    manufacturer: "FNSS"
  }
};
