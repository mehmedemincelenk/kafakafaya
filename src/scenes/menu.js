import { k } from "../kaplay.js";
import { menuOverlay } from "../ui/screens/menu.js";

export function initMenuScene() {
  k.scene("menu", (params) => {
    // --- AMBIENT SPACE BACKGROUND EFFECTS ---
    // Nebula 1: Deep Blue Glow
    k.add([
      k.circle(500),
      k.pos(k.width() * 0.25, k.height() * 0.35),
      k.color(0, 100, 255),
      k.opacity(0.04),
      k.anchor("center"),
      k.z(-7),
    ]);

    // Nebula 2: Deep Violet/Purple Glow
    k.add([
      k.circle(450),
      k.pos(k.width() * 0.75, k.height() * 0.65),
      k.color(180, 0, 255),
      k.opacity(0.03),
      k.anchor("center"),
      k.z(-7),
    ]);

    // Nebula 3: Neon Cyan Glow
    k.add([
      k.circle(350),
      k.pos(k.width() * 0.5, k.height() * 0.5),
      k.color(0, 240, 255),
      k.opacity(0.02),
      k.anchor("center"),
      k.z(-7),
    ]);

    // Twinkling Parallax Stars
    const starsGroup = [];
    const numStars = 80;
    
    for (let i = 0; i < numStars; i++) {
      // 3 layers of depth: background (dim/slow), midground, foreground (bright/fast)
      const layerRand = k.rand(0, 1);
      let radius, speed, baseOpacity;
      
      if (layerRand < 0.6) {
        // Background Stars (60%)
        radius = k.rand(0.6, 1.2);
        speed = k.rand(3, 8);
        baseOpacity = k.rand(0.08, 0.25);
      } else if (layerRand < 0.9) {
        // Midground Stars (30%)
        radius = k.rand(1.2, 2.0);
        speed = k.rand(12, 25);
        baseOpacity = k.rand(0.25, 0.5);
      } else {
        // Foreground Stars (10%)
        radius = k.rand(2.0, 3.0);
        speed = k.rand(35, 60);
        baseOpacity = k.rand(0.5, 0.8);
      }

      starsGroup.push(k.add([
        k.pos(k.rand(0, k.width()), k.rand(0, k.height())),
        k.circle(radius),
        k.color(255, 255, 255),
        k.opacity(baseOpacity),
        k.z(-6),
        {
          speed: speed,
          baseOpacity: baseOpacity,
          twinkleSpeed: k.rand(2, 6),
          twinkleOffset: k.rand(0, Math.PI * 2),
        }
      ]));
    }

    // Dynamic shooting stars (meteors) - küçük hızlı daireler
    const spawnShootingStar = () => {
      const startX = k.rand(k.width() * 0.3, k.width());
      const startY = k.rand(0, k.height() * 0.4);
      const speed = k.rand(400, 700);

      // Head
      const head = k.add([
        k.pos(startX, startY),
        k.circle(2),
        k.color(220, 245, 255),
        k.opacity(1.0),
        k.z(-5),
        {
          vel: k.vec2(-speed * 0.7, speed * 0.7),
          life: 1.0,
          update() {
            this.pos = this.pos.add(this.vel.scale(k.dt()));
            this.life -= k.dt() * 2.0;
            this.opacity = Math.max(0, this.life);
            if (this.life <= 0) this.destroy();
          }
        }
      ]);

      // Trail segments
      for (let t = 1; t <= 4; t++) {
        k.add([
          k.pos(startX + speed * 0.7 * t * 0.025, startY - speed * 0.7 * t * 0.025),
          k.circle(1.5 - t * 0.25),
          k.color(200, 230, 255),
          k.opacity(0.6 - t * 0.12),
          k.z(-5),
          {
            vel: k.vec2(-speed * 0.7, speed * 0.7),
            life: 0.9 - t * 0.15,
            update() {
              this.pos = this.pos.add(this.vel.scale(k.dt()));
              this.life -= k.dt() * 2.2;
              this.opacity = Math.max(0, this.life * 0.5);
              if (this.life <= 0) this.destroy();
            }
          }
        ]);
      }
    };

    // Spawn shooting stars periodically
    k.loop(6, () => {
      if (k.rand(0, 1) > 0.3) spawnShootingStar();
    });

    k.onUpdate(() => {
      // 1. Move stars & apply twinkle animation
      starsGroup.forEach(s => {
        s.pos.y += s.speed * k.dt();
        
        // Wrap around top if star moves off bottom of screen
        if (s.pos.y > k.height()) {
          s.pos.y = 0;
          s.pos.x = k.rand(0, k.width());
        }

        // Beautiful twinkling effect
        s.opacity = s.baseOpacity * (0.5 + 0.5 * Math.sin(k.time() * s.twinkleSpeed + s.twinkleOffset));
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
