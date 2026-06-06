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

    // Dynamic shooting stars (meteors) generator
    const spawnShootingStar = () => {
      const startX = k.rand(k.width() * 0.2, k.width() * 1.1);
      const startY = k.rand(-50, k.height() * 0.3);
      const angle = 135; // Moving down-left
      const speed = k.rand(500, 900);
      const length = k.rand(80, 150);

      // Create a visual line trail for the meteor
      k.add([
        k.pos(startX, startY),
        k.z(-5),
        {
          dir: k.Vec2.fromAngle(angle),
          speed: speed,
          opacityVal: 1.0,
          update() {
            // Move diagonal down-left
            this.pos = this.pos.add(this.dir.scale(this.speed * k.dt()));
            // Fade out
            this.opacityVal -= k.dt() * 1.8;
            if (this.opacityVal <= 0 || this.pos.y > k.height() || this.pos.x < 0) {
              this.destroy();
            }
          },
          draw() {
            // Draw a trailing line
            k.drawLine({
              p1: k.vec2(0, 0),
              p2: this.dir.scale(-length),
              width: 1.5,
              color: k.rgb(220, 245, 255),
              opacity: this.opacityVal,
            });
          }
        }
      ]);
    };

    // Spawn shooting stars periodically
    const meteorLoop = k.loop(k.rand(4, 9), () => {
      spawnShootingStar();
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
