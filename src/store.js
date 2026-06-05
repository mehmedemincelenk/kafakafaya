// Yerel veri depolama ve oyuncu profil yönetimi (LocalStorage tabanlı)
// Gelecekte Supabase geçişini kolaylaştırmak için minimalist ve temiz bir API sunar.
import { CAR_TYPES, CAR_COSTS } from "./config.js";

// Geriye dönük uyumluluk ve diğer dosyaların kırılmaması için CAR_COSTS'u yeniden ihraç ediyoruz
export { CAR_COSTS };

const STORAGE_KEYS = { 
  p1: "kafakafaya_profile_p1", 
  p2: "kafakafaya_profile_p2" 
};

// Dinamik olarak her araç türü için varsayılan skin ve yetenek haritalarını oluşturuyoruz
const defaultSkins = {};
const defaultSkills = {};
const defaultUnlockedSkins = {};
const defaultUnlockedSkills = {};

Object.keys(CAR_TYPES).forEach(car => {
  defaultSkins[car] = "default";
  defaultSkills[car] = "default";
  defaultUnlockedSkins[car] = ["default"];
  defaultUnlockedSkills[car] = ["default"];
});

// Varsayılan profil yapısı (Config'deki araç türlerine göre dinamik oluşturulur)
const defaultProfile = {
  coins: 250,
  unlockedCars: ["BARKAN", "ASLAN"],
  selectedCar: "BARKAN",
  unlockedSkins: defaultUnlockedSkins,
  selectedSkins: defaultSkins,
  unlockedSkills: defaultUnlockedSkills,
  selectedSkills: defaultSkills,
  unlockedProjectiles: ["mizrak", "mini_iha"],
  selectedWeapon: "mizrak",
  selectedSupport: "mini_iha",
  stats: { wins: 0, losses: 0, draws: 0, gamesPlayed: 0, clashDuelsWon: 0 }
};

const states = { p1: null, p2: null };

// Profili yükle ve eksik verileri varsayılanlarla doldur (Sanitization)
function loadProfile(pId) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS[pId]);
    const data = raw ? JSON.parse(raw) : null;
    if (!data) {
      states[pId] = JSON.parse(JSON.stringify(defaultProfile));
      return;
    }

    // Alt nesneleri temizle/düzelt (skinler, yetenekler vb.)
    const sanitizeMap = (saved, def, isArray) => {
      const result = {};
      Object.keys(def).forEach(key => {
        const val = saved?.[key];
        if (isArray) {
          result[key] = Array.isArray(val) ? [...val] : (typeof val === "string" ? [val] : [...def[key]]);
        } else {
          result[key] = typeof val === "string" ? val : def[key];
        }
      });
      return result;
    };

    let selectedCar = typeof data.selectedCar === "string" ? data.selectedCar : defaultProfile.selectedCar;
    if (!CAR_TYPES[selectedCar]) {
      selectedCar = "BARKAN";
    }

    let unlockedCars = Array.isArray(data.unlockedCars) ? data.unlockedCars : [...defaultProfile.unlockedCars];
    const startingCars = ["BARKAN", "ASLAN"];
    startingCars.forEach(c => {
      if (!unlockedCars.includes(c)) {
        unlockedCars.push(c);
      }
    });
    unlockedCars = unlockedCars.filter(c => CAR_TYPES[c]);

    let unlockedProjectiles = Array.isArray(data.unlockedProjectiles) ? data.unlockedProjectiles : [...defaultProfile.unlockedProjectiles];
    const startingProjectiles = ["mizrak", "mini_iha"];
    startingProjectiles.forEach(pIdKey => {
      if (!unlockedProjectiles.includes(pIdKey)) {
        unlockedProjectiles.push(pIdKey);
      }
    });

    states[pId] = {
      coins: typeof data.coins === "number" ? data.coins : defaultProfile.coins,
      selectedCar: selectedCar,
      unlockedCars: unlockedCars,
      unlockedSkins: sanitizeMap(data.unlockedSkins, defaultProfile.unlockedSkins, true),
      selectedSkins: sanitizeMap(data.selectedSkins, defaultProfile.selectedSkins, false),
      unlockedSkills: sanitizeMap(data.unlockedSkills, defaultProfile.unlockedSkills, true),
      selectedSkills: sanitizeMap(data.selectedSkills, defaultProfile.selectedSkills, false),
      unlockedProjectiles: unlockedProjectiles,
      selectedWeapon: typeof data.selectedWeapon === "string" ? data.selectedWeapon : defaultProfile.selectedWeapon,
      selectedSupport: typeof data.selectedSupport === "string" ? data.selectedSupport : defaultProfile.selectedSupport,
      stats: { ...defaultProfile.stats, ...(data.stats || {}) }
    };
  } catch (e) {
    console.error(`Store yükleme hatası (${pId}):`, e);
    states[pId] = JSON.parse(JSON.stringify(defaultProfile));
  }
}

// Profili kaydet
function saveProfile(pId) {
  try {
    window.localStorage.setItem(STORAGE_KEYS[pId], JSON.stringify(states[pId]));
  } catch (e) {
    console.error(`Store kaydetme hatası (${pId}):`, e);
  }
}

// İlk yüklemeyi yap
loadProfile("p1");
loadProfile("p2");

// Yardımcı get/set ara katmanı
const getProfile = (pId) => {
  if (!states[pId]) loadProfile(pId);
  return states[pId];
};

export const store = {
  // --- BLOK 1: COIN VE ARAÇ DURUMU SORGULAMA ---
  getCoins: (pId = "p1") => getProfile(pId).coins,
  getUnlockedCars: (pId = "p1") => getProfile(pId).unlockedCars,
  getSelectedCar: (pId = "p1") => getProfile(pId).selectedCar,
  getStats: (pId = "p1") => getProfile(pId).stats,

  // --- BLOK 2: MODEL DESENLERİ (SKINS) SORGULAMA VE SATIN ALMA ---
  getUnlockedSkins: (pId = "p1", carType) => getProfile(pId).unlockedSkins[carType] || ["default"],
  getSelectedSkin: (pId = "p1", carType) => getProfile(pId).selectedSkins[carType] || "default",
  unlockSkin: (pId = "p1", carType, skinId, cost) => {
    const p = getProfile(pId);
    if (p.unlockedSkins[carType].includes(skinId)) return true;
    if (p.coins >= cost) {
      p.coins -= cost;
      p.unlockedSkins[carType].push(skinId);
      saveProfile(pId);
      return true;
    }
    return false;
  },
  setSelectedSkin: (pId = "p1", carType, skinId) => {
    const p = getProfile(pId);
    if (p.unlockedSkins[carType].includes(skinId)) {
      p.selectedSkins[carType] = skinId;
      saveProfile(pId);
      return true;
    }
    return false;
  },

  // --- BLOK 3: YETENEKLER (SKILLS) SORGULAMA VE SATIN ALMA ---
  getUnlockedSkills: (pId = "p1", carType) => getProfile(pId).unlockedSkills[carType] || ["default"],
  getSelectedSkill: (pId = "p1", carType) => getProfile(pId).selectedSkills[carType] || "default",
  unlockSkill: (pId = "p1", carType, skillId, cost) => {
    const p = getProfile(pId);
    if (p.unlockedSkills[carType].includes(skillId)) return true;
    if (p.coins >= cost) {
      p.coins -= cost;
      p.unlockedSkills[carType].push(skillId);
      saveProfile(pId);
      return true;
    }
    return false;
  },
  setSelectedSkill: (pId = "p1", carType, skillId) => {
    const p = getProfile(pId);
    if (p.unlockedSkills[carType].includes(skillId)) {
      p.selectedSkills[carType] = skillId;
      saveProfile(pId);
      return true;
    }
    return false;
  },

  // --- BLOK 4: BAKIYE VE ARAÇ EKLEME/DEĞİŞTİRME ---
  addCoins: (pId = "p1", amount) => {
    const p = getProfile(pId);
    p.coins = Math.max(0, p.coins + amount);
    saveProfile(pId);
    return p.coins;
  },
  unlockCar: (pId = "p1", carType, cost) => {
    const p = getProfile(pId);
    if (p.unlockedCars.includes(carType)) return true;
    if (p.coins >= cost) {
      p.coins -= cost;
      p.unlockedCars.push(carType);
      saveProfile(pId);
      return true;
    }
    return false;
  },
  setSelectedCar: (pId = "p1", carType) => {
    const p = getProfile(pId);
    if (p.unlockedCars.includes(carType)) {
      p.selectedCar = carType;
      saveProfile(pId);
      return true;
    }
    return false;
  },

  // --- BLOK 4.5: AKILLI MÜHİMMATLAR & DESTEK İHALARI SORGULAMA VE SATIN ALMA ---
  getUnlockedProjectiles: (pId = "p1") => getProfile(pId).unlockedProjectiles || ["mizrak", "mini_iha"],
  getSelectedWeapon: (pId = "p1") => getProfile(pId).selectedWeapon || "mizrak",
  getSelectedSupport: (pId = "p1") => getProfile(pId).selectedSupport || "mini_iha",
  setSelectedWeapon: (pId = "p1", projectileId) => {
    const p = getProfile(pId);
    if (p.unlockedProjectiles.includes(projectileId)) {
      p.selectedWeapon = projectileId;
      saveProfile(pId);
      return true;
    }
    return false;
  },
  setSelectedSupport: (pId = "p1", projectileId) => {
    const p = getProfile(pId);
    if (p.unlockedProjectiles.includes(projectileId)) {
      p.selectedSupport = projectileId;
      saveProfile(pId);
      return true;
    }
    return false;
  },
  unlockProjectile: (pId = "p1", projectileId, cost) => {
    const p = getProfile(pId);
    if (p.unlockedProjectiles.includes(projectileId)) return true;
    if (p.coins >= cost) {
      p.coins -= cost;
      p.unlockedProjectiles.push(projectileId);
      saveProfile(pId);
      return true;
    }
    return false;
  },

  // --- BLOK 5: MAÇ SONUÇLARINI VE İSTATİSTİKLERİ KAYDETME ---
  recordMatch: (pId = "p1", result, clashWins = 0) => {
    const p = getProfile(pId);
    p.stats.gamesPlayed += 1;
    if (result === "win") p.stats.wins += 1;
    else if (result === "loss") p.stats.losses += 1;
    else if (result === "draw") p.stats.draws += 1;
    p.stats.clashDuelsWon += clashWins;
    saveProfile(pId);
  },

  // Verileri sıfırla (Geliştirme aşaması için)
  resetStore: () => {
    states.p1 = JSON.parse(JSON.stringify(defaultProfile));
    states.p2 = JSON.parse(JSON.stringify(defaultProfile));
    saveProfile("p1");
    saveProfile("p2");
  }
};
