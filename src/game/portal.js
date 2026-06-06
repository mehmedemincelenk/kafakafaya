import { k } from "../kaplay.js";
import { isHost } from "playroomkit";

function rotateVec(vec, angleDeg) {
  const rad = angleDeg * Math.PI / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return k.vec2(
    vec.x * cos - vec.y * sin,
    vec.x * sin + vec.y * cos
  );
}

/**
 * Spawns a pair of linked portals (vortexes) that teleport cars.
 * @param {Vec2} posA - Center position of Portal A
 * @param {Vec2} posB - Center position of Portal B
 * @param {Object} options - Custom parameters (radius, colorA, colorB)
 * @returns {Object} - References to portal A and B
 */
export function spawnPortalPair(posA, posB, options = {}) {
  const width = options.width || 12;      // Portal kalınlığı (çizgi eni)
  const height = options.height || 75;    // Portal yüksekliği (çizgi boyu)
  const angle = options.angle !== undefined ? options.angle : 0; // Rift dönüş açısı
  const colorA = k.rgb(255, 255, 255);    // Saf Beyaz
  const colorB = k.rgb(255, 255, 255);    // Saf Beyaz

  // Portal oluşturucu iç yardımcı fonksiyon
  function createPortal(pos, targetPos, color, id) {
    const portal = k.add([
      k.rect(8, height, { radius: 3 }), // Dış beyaz ışık aurası (orta genişlikte)
      k.pos(pos),
      k.rotate(angle),
      k.color(color),
      k.opacity(0.35), // Yumuşak beyaz ışıma efekti
      // Görsel genişlik 8 iken çarpışma alanını kalınlaştırıp (36) yüksek hızlarda tünelleme/atlama sorununu engelliyoruz
      k.area({ shape: new k.Rect(k.vec2(-18, -height / 2), 36, height) }),
      k.anchor("center"),
      k.z(-5), // Arabaların ve can barlarının arkasında kalsın
      "portal",
      {
        targetPos,
        portalId: id,
      }
    ]);

    // İç parlak beyaz ince merkez çizgisi (ipince portal yarığı)
    // Renk ve opaklık kalıtımını önlemek amacıyla bağımsız bir root nesnesi olarak ekliyoruz.
    const core = k.add([
      k.rect(1.5, height - 6, { radius: 1 }),
      k.pos(pos),
      k.rotate(angle),
      k.color(255, 255, 255),
      k.opacity(1.0),
      k.anchor("center"),
      k.z(-4), // Aura'nın (z: -5) hemen üstünde yer alır
    ]);

    portal.onDestroy(() => {
      try { core.destroy(); } catch (e) {}
    });

    // Seyrek parçacık sızıntı efekti (saf beyaz kıvılcımlar)
    portal.onUpdate(() => {
      if (k.chance(0.12)) {
        const offset = k.rand(-height * 0.45, height * 0.45);
        const thick = k.rand(-2, 2);
        const localOffset = k.vec2(thick, offset);
        const particlePos = pos.add(rotateVec(localOffset, angle));

        const vel = rotateVec(k.vec2(k.choose([-1, 1]) * k.rand(30, 60), 0), angle);
        const p = k.add([
          k.circle(k.rand(1, 2)),
          k.pos(particlePos),
          k.color(255, 255, 255), // Saf beyaz sızıntı
          k.opacity(0.7),
          k.anchor("center"),
          k.z(-3),
          k.lifespan(0.35),
        ]);
        p.onUpdate(() => p.move(vel));
      }
    });

    return portal;
  }

  const portalA = createPortal(posA, posB, colorA, "A");
  const portalB = createPortal(posB, posA, colorB, "B");

  // Teleportasyon tetikleyici çarpışma dinleyicisi
  k.onCollide("player", "portal", (car, portal) => {
    // Çok oyunculuda sadece Host çarpışmayı hesaplar
    if (k.isMultiplayer && !isHost()) return;

    // Cooldown kontrolü (Çift taraflı sonsuz döngü engelleme)
    if (car.teleportCooldown && car.teleportCooldown > 0) return;

    car.teleportCooldown = 0.8; // Teleport sonrası 0.8 saniye bekleme süresi

    // Teleportasyon efekti (Çıkış ve Giriş noktalarında beyaz patlama)
    spawnTeleportBurst(portal.pos, k.rgb(255, 255, 255));
    spawnTeleportBurst(portal.targetPos, k.rgb(255, 255, 255));

    // Ekranda ufak bir boyut/sarsıntı geri bildirimi
    k.shake(2.5);

    // Aracın pozisyonunu hedefe ışınla
    car.pos = portal.targetPos;

    // Hız vektörünü koru, ancak portal çıkış hızına %15 ivme desteği ver
    car.speed = car.speed * 1.15;
  });

  return { portalA, portalB };
}

/**
 * Portala giriş/çıkış sırasında üretilecek beyaz kıvılcım patlaması
 */
function spawnTeleportBurst(pos, color) {
  for (let i = 0; i < 15; i++) {
    const angle = k.rand(0, 360);
    const speed = k.rand(70, 180);
    const rad = k.deg2rad(angle);
    const vel = k.vec2(Math.cos(rad) * speed, Math.sin(rad) * speed);
    const p = k.add([
      k.circle(k.rand(2, 4.5)),
      k.pos(pos),
      k.color(255, 255, 255), // Her zaman beyaz patlama
      k.opacity(0.95),
      k.anchor("center"),
      k.z(5),
      k.lifespan(k.rand(0.3, 0.55)),
    ]);
    p.onUpdate(() => p.move(vel));
  }
}

/**
 * Araçların teleport cooldown sürelerini düzenli azaltan global güncelleyici
 */
export function setupPortalCooldownUpdater() {
  k.onUpdate(() => {
    k.get("player").forEach(car => {
      if (car.teleportCooldown > 0) {
        car.teleportCooldown -= k.dt();
      }
    });
  });
}
