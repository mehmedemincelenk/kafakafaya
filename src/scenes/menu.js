import { k } from "../kaplay.js";
import { menuOverlay } from "../ui/screens/menu.js";

export function initMenuScene() {
  k.scene("menu", (params) => {
    // --- AMBIENT BACKGROUND EFFECTS ---
    // Ambient Neon Glow
    k.add([
      k.circle(420),
      k.pos(k.width() / 2, k.height() / 2),
      k.color(0, 120, 255),
      k.opacity(0.04),
      k.anchor("center"),
      k.z(-6),
    ]);

    // Floating Space Stars
    const starsGroup = [];
    for (let i = 0; i < 45; i++) {
      starsGroup.push(k.add([
        k.pos(k.rand(0, k.width()), k.rand(0, k.height())),
        k.circle(k.rand(1.2, 3)),
        k.color(255, 255, 255),
        k.opacity(k.rand(0.1, 0.45)),
        k.z(-5),
        {
          speed: k.rand(8, 25),
        }
      ]));
    }

    k.onUpdate(() => {
      starsGroup.forEach(s => {
        s.pos.y += s.speed * k.dt();
        if (s.pos.y > k.height()) {
          s.pos.y = 0;
          s.pos.x = k.rand(0, k.width());
        }
      });
    });

    // Mount the HTML overlay menu
    menuOverlay.mount(params);

    // Cleanup when leaving the scene
    k.onDestroy(() => {
      menuOverlay.dismount();
    });
  });
}
