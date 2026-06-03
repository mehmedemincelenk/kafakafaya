import { k } from "./kaplay.js";

// Çarpışma anında kıvılcım/patlama efekti üreten fonksiyon.
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

  const origColor = victim.color;
  victim.color = k.rgb(255, 255, 255);

  k.wait(0.2, () => {
    victim.color = origColor;
  });
}
