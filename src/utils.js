import { k } from "./kaplay.js";

// Parçacık Efekti Üretir
export function spawnExplosion(pos, intensity, customColor) {
  const count = Math.min(25, Math.max(8, intensity * 0.5));
  for (let i = 0; i < count; i++) {
    const angle = k.rand(0, 360);
    const speed = k.rand(100, 250);
    const rad = k.deg2rad(angle);
    const vel = k.vec2(Math.cos(rad) * speed, Math.sin(rad) * speed);
    const color = customColor || k.rgb(255, k.rand(120, 220), 0);
    const p = k.add([
      k.pos(pos),
      k.rect(k.rand(4, 8), k.rand(4, 8)),
      k.color(color),
      k.rotate(k.rand(0, 360)),
      k.anchor("center"),
      k.opacity(),
      k.lifespan(0.4),
    ]);
    p.onUpdate(() => p.move(vel));
  }
}

// Hasar uygulama ve geribildirim fonksiyonu (flaş efekti)
export function inflictDamage(victim, damage) {
  if (victim.isInvulnerable) return; // Kalkan veya Demir Duvar etkisindeyse hasar alma

  victim.hp = Math.max(0, victim.hp - damage);

  const origColor = victim.originalColor || k.rgb(120, 120, 120);
  victim.color = k.rgb(255, 255, 255);

  k.wait(0.15, () => {
    if (victim.exists()) {
      victim.color = origColor;
    }
  });
}

// Generate a deterministic Turkish guest name based on device/guest UUID
export function getTurkishGuestName(username) {
  const turkishNames = [
    "BOZKURT", "ALPARSLAN", "YENİÇERİ", "KARTAL", "YAVUZ", "GÖKTÜRK", 
    "TARKAN", "FATİH", "ATAMAN", "BÖRTEÇİNE", "BARBAROS", "BATUR", 
    "CENGAVER", "YİĞİT", "HAKAN", "EFELER", "DELİLER", "SANCAR", 
    "ALTAY", "GÖKMEN", "TAYFUN", "RÜZGAR", "ŞAHİN", "ATMACA", 
    "AKINCI", "POYRAZ", "BORAN", "TUGAY"
  ];
  if (!username) return "MİSAFİR";
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % turkishNames.length;
  const suffix = Math.abs(hash) % 100;
  return `${turkishNames[index]}${suffix}`;
}
