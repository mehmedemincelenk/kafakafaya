// Yerel veri depolama ve oyuncu profil yönetimi (LocalStorage + Supabase tabanlı)
import { createClient } from "@supabase/supabase-js";
import { CAR_TYPES, CAR_COSTS, PROJECTILES } from "./config.js";

// Geriye dönük uyumluluk ve diğer dosyaların kırılmaması için CAR_COSTS'u yeniden ihraç ediyoruz
export { CAR_COSTS };

const SUPABASE_URL = "https://qhgynaompjavzuowillf.supabase.co";
const SUPABASE_KEY = "sb_publishable_0oRuKqM3TABiN70PzAhqMw_7Dx7dWls";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const STORAGE_KEYS = {
  p1: "kafakafaya_profile_p1",
  p2: "kafakafaya_profile_p2"
};

let currentAuthUser = null;

// Listen to auth state changes to keep track of logged in user
supabase.auth.onAuthStateChange((event, session) => {
  currentAuthUser = session?.user || null;
  if (currentAuthUser) {
    loadFromSupabase("p1");
  }
});

// Cihaz bazlı benzersiz ID üretimi ve yönetimi
function getUserId(pId) {
  if (pId === "p1" && currentAuthUser) {
    return currentAuthUser.id;
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
  } else {
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

  // HACK FOR "emin"
  const username = getUserId(pId);
  if (username && username.toLowerCase().includes("emin")) {
    states[pId].coins = 999999;
    states[pId].unlockedCars = Object.keys(CAR_COSTS);
    states[pId].unlockedProjectiles = Object.keys(PROJECTILES);
  }
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
      if (dbId && dbId.toLowerCase().includes("emin")) {
        await saveToSupabase(pId);
      }
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
  },
  restoreProfile: (pId = "p1", newUuid) => {
    if (!newUuid || newUuid.trim().length < 10) return false;
    const storageKey = `kafakafaya_device_uuid_${pId}`;
    window.localStorage.setItem(storageKey, newUuid.trim());
    window.localStorage.removeItem(STORAGE_KEYS[pId]);
    loadProfile(pId);
    return true;
  },
  getDeviceUuid: (pId = "p1") => {
    return getUserId(pId);
  },
  isGuest: (pId = "p1") => {
    const id = getUserId(pId);
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isMathRandom = id.length >= 15 && !id.includes("-") && /^[0-9a-z]+$/i.test(id);
    return uuidPattern.test(id) || isMathRandom;
  },
  usernameLogin: async (username, password, pId = "p1") => {
    if (!username || username.trim().length < 3) {
      return { success: false, error: "Kullanıcı adı en az 3 karakter olmalıdır!" };
    }
    if (!password || password.trim().length < 3) {
      return { success: false, error: "Şifre en az 3 karakter olmalıdır!" };
    }
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", cleanUsername)
        .maybeSingle();

      if (error) {
        return { success: false, error: error.message };
      }

      if (data) {
        if (data.password && data.password !== cleanPassword) {
          return { success: false, error: "Kullanıcı adı zaten var ama şifre hatalı!" };
        }

        // Lock in the password for legacy accounts on their first login with password
        if (!data.password) {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ password: cleanPassword })
            .eq("id", cleanUsername);

          if (updateError) {
            return { success: false, error: "Şifre kilitlenemedi: " + updateError.message };
          }
        }

        const storageKey = `kafakafaya_device_uuid_${pId}`;
        window.localStorage.setItem(storageKey, cleanUsername);
        window.localStorage.removeItem(STORAGE_KEYS[pId]);
        await loadFromSupabase(pId);
        return { success: true };
      } else {
        if (!/^[a-z0-9_]+$/i.test(cleanUsername)) {
          return { success: false, error: "Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir!" };
        }

        const currentProfile = states[pId] || defaultProfile;
        const { error: saveError } = await supabase
          .from("profiles")
          .insert({
            id: cleanUsername,
            password: cleanPassword,
            coins: currentProfile.coins,
            selected_car: currentProfile.selectedCar,
            unlocked_cars: currentProfile.unlockedCars,
            unlocked_projectiles: currentProfile.unlockedProjectiles,
            selected_weapon: currentProfile.selectedWeapon,
            selected_support: currentProfile.selectedSupport,
            stats: currentProfile.stats,
            updated_at: new Date().toISOString()
          });

        if (saveError) {
          return { success: false, error: saveError.message };
        }

        const storageKey = `kafakafaya_device_uuid_${pId}`;
        window.localStorage.setItem(storageKey, cleanUsername);
        window.localStorage.removeItem(STORAGE_KEYS[pId]);
        await loadFromSupabase(pId);
        return { success: true };
      }
    } catch (e) {
      return { success: false, error: e.message };
    }
  },
  logout: (pId = "p1") => {
    const storageKey = `kafakafaya_device_uuid_${pId}`;
    let uuid = "";
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      uuid = crypto.randomUUID();
    } else {
      uuid = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    }
    window.localStorage.setItem(storageKey, uuid);
    window.localStorage.removeItem(STORAGE_KEYS[pId]);
    loadProfile(pId);
  },
  saveVehicleIdea: async (idea) => {
    const { error } = await supabase
      .from("vehicle_ideas")
      .insert({
        contact_info: idea.contactInfo || null,
        vehicle_name: idea.vehicleName,
        skill_name: idea.skillName || null,
        skill_description: idea.skillDescription || null,
        design_description: idea.designDescription || null,
        solved_problem: idea.solvedProblem || null
      });
    if (error) {
      throw new Error(error.message);
    }
    return true;
  }
};
