// Yerel veri depolama ve oyuncu profil yönetimi (LocalStorage + Supabase tabanlı)
import { createClient } from "@supabase/supabase-js";
import { CAR_TYPES, CAR_COSTS } from "./config.js";

// Geriye dönük uyumluluk ve diğer dosyaların kırılmaması için CAR_COSTS'u yeniden ihraç ediyoruz
export { CAR_COSTS };

const SUPABASE_URL = "https://qhgynaompjavzuowillf.supabase.co";
const SUPABASE_KEY = "sb_publishable_0oRuKqM3TABiN70PzAhqMw_7Dx7dWls";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const STORAGE_KEYS = {
  p1: "kafakafaya_profile_p1",
  p2: "kafakafaya_profile_p2"
};

// Cihaz bazlı benzersiz ID üretimi ve yönetimi
function getUserId(pId) {
  // Eğer Supabase Auth kullanılıyorsa aktif oturum açmış kullanıcının ID'sini çekmeye hazır
  try {
    const session = supabase.auth.getSession ? supabase.auth.getSession() : null;
    const user = session?.data?.session?.user || supabase.auth.user?.();
    if (pId === "p1" && user?.id) {
      return user.id;
    }
  } catch (e) {
    console.warn("Supabase Auth kontrolü atlandı:", e);
  }

  // Fallback: Cihaz bazlı benzersiz kimlik (UUID) üret
  const storageKey = `kafakafaya_device_uuid_${pId}`;
  let uuid = window.localStorage.getItem(storageKey);
  if (!uuid) {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      uuid = crypto.randomUUID();
    } else {
      uuid = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    }
    window.localStorage.setItem(storageKey, uuid);
  }
  return uuid;
}

// Varsayılan profil yapısı (Sadece MVP için gerekli alanlar)
const defaultProfile = {
  coins: 250,
  unlockedCars: ["BARKAN", "ASLAN"],
  selectedCar: "BARKAN",
  unlockedProjectiles: ["mizrak"],
  selectedWeapon: "mizrak",
  selectedSupport: "",
  stats: { wins: 0, losses: 0, draws: 0, gamesPlayed: 0, clashDuelsWon: 0 }
};

const states = { p1: null, p2: null };

function sanitizeAndApply(pId, data) {
  if (!data) {
    states[pId] = JSON.parse(JSON.stringify(defaultProfile));
    return;
  }

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
  const startingProjectiles = ["mizrak"];
  startingProjectiles.forEach(pIdKey => {
    if (!unlockedProjectiles.includes(pIdKey)) {
      unlockedProjectiles.push(pIdKey);
    }
  });

  states[pId] = {
    coins: typeof data.coins === "number" ? data.coins : defaultProfile.coins,
    selectedCar: selectedCar,
    unlockedCars: unlockedCars,
    unlockedProjectiles: unlockedProjectiles,
    selectedWeapon: typeof data.selectedWeapon === "string" ? data.selectedWeapon : defaultProfile.selectedWeapon,
    selectedSupport: typeof data.selectedSupport === "string" ? data.selectedSupport : defaultProfile.selectedSupport,
    stats: { ...defaultProfile.stats, ...(data.stats || {}) }
  };
}

// Profili yükle ve eksik verileri varsayılanlarla doldur (Sanitization)
function loadProfile(pId) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS[pId]);
    const localData = raw ? JSON.parse(raw) : null;
    sanitizeAndApply(pId, localData);

    // Asenkron olarak Supabase ile senkronize et
    loadFromSupabase(pId);
  } catch (e) {
    console.error(`Store yükleme hatası (${pId}):`, e);
    states[pId] = JSON.parse(JSON.stringify(defaultProfile));
  }
}

async function loadFromSupabase(pId) {
  const dbId = getUserId(pId);
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", dbId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error(`Supabase load error (${pId}):`, error);
      return;
    }

    if (data) {
      const remoteState = {
        coins: data.coins,
        selectedCar: data.selected_car,
        unlockedCars: data.unlocked_cars,
        unlockedProjectiles: data.unlocked_projectiles,
        selectedWeapon: data.selected_weapon,
        selectedSupport: data.selected_support,
        stats: data.stats
      };
      sanitizeAndApply(pId, remoteState);
      window.localStorage.setItem(STORAGE_KEYS[pId], JSON.stringify(states[pId]));
    } else {
      // Supabase'de henüz profil yoksa mevcut yerel/varsayılan profili yükleyelim
      await saveToSupabase(pId);
    }
  } catch (e) {
    console.error(`Supabase senkronizasyon hatası (${pId}):`, e);
  }
}

async function saveToSupabase(pId) {
  const p = states[pId];
  if (!p) return;
  const dbId = getUserId(pId);
  try {
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: dbId,
        coins: p.coins,
        selected_car: p.selectedCar,
        unlocked_cars: p.unlockedCars,
        unlocked_projectiles: p.unlockedProjectiles,
        selected_weapon: p.selectedWeapon,
        selected_support: p.selectedSupport,
        stats: p.stats,
        updated_at: new Date().toISOString()
      });
    if (error) {
      console.error(`Supabase save error (${pId}):`, error);
    }
  } catch (e) {
    console.error(`Supabase save hatası (${pId}):`, e);
  }
}

// Profili kaydet
function saveProfile(pId) {
  try {
    window.localStorage.setItem(STORAGE_KEYS[pId], JSON.stringify(states[pId]));
    saveToSupabase(pId);
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

  // --- BLOK 2: MODEL DESENLERİ (SKINS) UYUMLULUK KATMANI (DUMMY/STUBS) ---
  getUnlockedSkins: (pId = "p1", carType) => ["default"],
  getSelectedSkin: (pId = "p1", carType) => "default",
  unlockSkin: (pId = "p1", carType, skinId, cost) => true,
  setSelectedSkin: (pId = "p1", carType, skinId) => true,

  // --- BLOK 3: YETENEKLER (SKILLS) UYUMLULUK KATMANI (DUMMY/STUBS) ---
  getUnlockedSkills: (pId = "p1", carType) => ["default"],
  getSelectedSkill: (pId = "p1", carType) => "default",
  unlockSkill: (pId = "p1", carType, skillId, cost) => true,
  setSelectedSkill: (pId = "p1", carType, skillId) => true,

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
    p.selectedCar = carType;
    saveProfile(pId);
    return true;
  },

  // --- BLOK 4.5: AKILLI MÜHİMMATLAR & DESTEK İHALARI SORGULAMA VE SATIN ALMA ---
  getUnlockedProjectiles: (pId = "p1") => getProfile(pId).unlockedProjectiles || ["mizrak", "mini_iha"],
  getSelectedWeapon: (pId = "p1") => getProfile(pId).selectedWeapon || "mizrak",
  getSelectedSupport: (pId = "p1") => getProfile(pId).selectedSupport || "mini_iha",
  setSelectedWeapon: (pId = "p1", projectileId) => {
    const p = getProfile(pId);
    p.selectedWeapon = projectileId;
    saveProfile(pId);
    return true;
  },
  setSelectedSupport: (pId = "p1", projectileId) => {
    const p = getProfile(pId);
    p.selectedSupport = projectileId;
    saveProfile(pId);
    return true;
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
