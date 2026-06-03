import { k } from "./kaplay.js";
import { isHost } from "playroomkit";

export function setupArena(mapData) {
  // Zemin Rengi
  k.add([
    k.rect(k.width(), k.height()),
    k.pos(0, 0),
    k.color(mapData.bgColor[0], mapData.bgColor[1], mapData.bgColor[2]),
    k.z(-10),
  ]);

  // Arena Dış Sınır Çizgisi
  k.add([
    k.rect(k.width() - 120, k.height() - 120, { radius: 10 }),
    k.pos(60, 60),
    k.color(mapData.bgColor[0], mapData.bgColor[1], mapData.bgColor[2]),
    k.outline(3, k.rgb(mapData.borderColor[0], mapData.borderColor[1], mapData.borderColor[2])),
    k.z(-9),
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
    k.add([
      k.rect(obs.w, obs.h, { radius: 4 }),
      k.pos(obs.x, obs.y),
      k.color(obs.color[0], obs.color[1], obs.color[2]),
      k.outline(2, k.rgb(obs.color[0] + 30, obs.color[1] + 30, obs.color[2] + 30)),
      k.anchor("center"),
      k.area(),
      "obstacle",
      { id: idx }
    ]);
  });

  // Engellerle Çarpışma Mekaniği (Sadece Host veya Yerel modda hız yansıması yapar)
  k.onCollide("player", "obstacle", (player, obstacle) => {
    if (k.isMultiplayer && !isHost()) return;
    player.speed = -player.speed * 0.45;
    const diff = player.pos.sub(obstacle.pos).unit();
    player.pos = player.pos.add(diff.scale(6));
  });
}
