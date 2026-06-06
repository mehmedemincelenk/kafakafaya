import { k } from "../kaplay.js";
import { isHost } from "playroomkit";
import { spawnExplosion } from "../utils.js";

/**
 * Sets up the Sudden Death safe zone logic, visual borders, and warning texts.
 */
export function setupSuddenDeath(cars, checkGameOver) {
  // Safe Zone Boundary Line (Sudden Death)
  const safeZoneBorder = k.add([
    k.rect(k.width() - 120, k.height() - 120, { radius: 10, fill: false }),
    k.pos(60, 60),
    k.outline(2, k.rgb(0, 240, 255)), // Starts safe/blue
    k.z(-8),
  ]);
  safeZoneBorder.hidden = true; // Oyun başında sınır çizgisini gizliyoruz

  const zoneWarningText = k.add([
    k.text("", { size: 14, font: "sans-serif", weight: "bold", letterSpacing: 2 }),
    k.pos(k.width() / 2, 90),
    k.anchor("center"),
    k.color(255, 70, 85),
  ]);

  function update(roundTimeLeft) {
    if (roundTimeLeft <= 30 && roundTimeLeft > 0) {
      safeZoneBorder.hidden = false; // Sadece Sudden Death başlayınca görünür yapıyoruz
      zoneWarningText.text = "TEHLİKE: GÜVENLİ ALAN DARALIYOR!";
      
      const timeInSuddenDeath = Math.max(0, 30 - roundTimeLeft);
      // Boundary goes from 60px margin, shrinking by 8.5px/s up to ~315px
      const currentMargin = 60 + (timeInSuddenDeath * 8.5);

      safeZoneBorder.width = k.width() - 2 * currentMargin;
      safeZoneBorder.height = k.height() - 2 * currentMargin;
      safeZoneBorder.pos = k.vec2(currentMargin, currentMargin);

      // Red/neon flashing threat outline
      const pulse = Math.sin(k.time() * 8) > 0;
      safeZoneBorder.outline.color = pulse ? k.rgb(255, 70, 85) : k.rgb(180, 20, 40);
      safeZoneBorder.outline.width = 3;

      // Detect out-of-zone players and inflict 20 DPS
      cars.forEach(car => {
        if (k.gameOver || car.controlsLocked || !car.exists()) return;

        const isOutside = car.pos.x < currentMargin + 8 || 
                          car.pos.x > k.width() - currentMargin - 8 || 
                          car.pos.y < currentMargin + 8 || 
                          car.pos.y > k.height() - currentMargin - 8;

        if (isOutside) {
          // Inflict DPS (Host or Local only)
          if (!k.isMultiplayer || isHost()) {
            car.hp = Math.max(0, car.hp - k.dt() * 20);
            if (car.hp <= 0) {
              checkGameOver();
            }
          }

          // Visual damage flashing
          car.outsideZoneFlashing = true;
          if (Math.sin(k.time() * 15) > 0) {
            car.color = k.rgb(255, 70, 85);
          } else {
            car.color = car.originalColor;
          }

          // Spawn spark particles
          if (k.chance(0.25)) {
            spawnExplosion(car.pos, 2, k.rgb(255, 70, 85));
          }
        } else {
          // Recover color if safe
          if (car.outsideZoneFlashing) {
            car.outsideZoneFlashing = false;
            car.color = car.originalColor;
          }
        }
      });
    } else {
      safeZoneBorder.hidden = true; // Pasif durumdayken gizli tutuyoruz
      zoneWarningText.text = "";
      safeZoneBorder.width = k.width() - 120;
      safeZoneBorder.height = k.height() - 120;
      safeZoneBorder.pos = k.vec2(60, 60);
      safeZoneBorder.outline.color = k.rgb(0, 240, 255);
      safeZoneBorder.outline.width = 2;

      // Clean up potential color drifts
      cars.forEach(car => {
        if (car.exists() && car.outsideZoneFlashing) {
          car.outsideZoneFlashing = false;
          car.color = car.originalColor;
        }
      });
    }
  }

  return {
    update,
    destroy: () => {
      try { safeZoneBorder.destroy(); } catch (e) {}
      try { zoneWarningText.destroy(); } catch (e) {}
    }
  };
}
