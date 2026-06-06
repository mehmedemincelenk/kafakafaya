import { k } from "../kaplay.js";
import { isHost } from "playroomkit";

export function setupArena(mapData) {
  // Zemin Rengi
  k.add([
    k.rect(k.width(), k.height()),
    k.pos(0, 0),
    k.color(mapData.bgColor[0], mapData.bgColor[1], mapData.bgColor[2]),
    k.z(-10),
  ]);


  // Grid Noktaları
  const gridSize = 60;
  for (let x = 60; x < k.width() - 30; x += gridSize) {
    for (let y = 60; y < k.height() - 30; y += gridSize) {
      k.add([
        k.pos(x, y),
        k.circle(1.5),
        k.color(mapData.gridColor[0], mapData.gridColor[1], mapData.gridColor[2]),
        k.z(-8),
      ]);
    }
  }

  // Harita Engellerini (Obstacles) Ekle
  mapData.obstacles.forEach((obs, idx) => {
    const obstacle = k.add([
      k.rect(obs.w, obs.h, { radius: 4 }),
      k.pos(obs.x, obs.y),
      k.color(obs.color[0] * 0.7, obs.color[1] * 0.7, obs.color[2] * 0.7), // Daha mat/koyu ana gövde
      k.outline(2.5, k.rgb(obs.color[0], obs.color[1], obs.color[2])), // Canlı neon dış sınır çizgisi
      k.anchor("center"),
      k.area(),
      "obstacle",
      { id: idx }
    ]);

    // Neon Enerji Çekirdeği (İç parıltı katmanı)
    if (obs.w > 16 && obs.h > 16) {
      obstacle.add([
        k.rect(obs.w - 10, obs.h - 10, { radius: 2 }),
        k.pos(0, 0),
        k.color(obs.color[0] * 0.2, obs.color[1] * 0.2, obs.color[2] * 0.2), // Derin karanlık iç alan
        k.outline(1.5, k.rgb(obs.color[0] * 1.3, obs.color[1] * 1.3, obs.color[2] * 1.3)), // Parlak iç çizgi
        k.anchor("center"),
      ]);

      // Çekirdek içi teknolojik vurgu çizgisi (Yatay şerit)
      if (Math.min(obs.w, obs.h) > 24) {
        obstacle.add([
          k.rect(obs.w - 24, 2),
          k.pos(0, 0),
          k.color(obs.color[0], obs.color[1], obs.color[2]),
          k.opacity(0.85),
          k.anchor("center"),
        ]);
      }
    }
  });

  // Engellerle Çarpışma Mekaniği (Sadece Host veya Yerel modda hız yansıması yapar)
  k.onCollide("player", "obstacle", (player, obstacle) => {
    if (player.isGhost) return;
    if (k.isMultiplayer && !isHost()) return;
    player.speed = -player.speed * 0.45;
    const diff = player.pos.sub(obstacle.pos).unit();
    player.pos = player.pos.add(diff.scale(6));
  });
}
