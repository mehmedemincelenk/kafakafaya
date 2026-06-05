---
name: kaplay_ui_ux
description: Design systems, layout patterns, and virtual controls for building responsive, neon-themed mobile-friendly UI/UX inside the Kaplay.js engine.
---

# Kaplay.js UI/UX Design & Virtual Controls Guidelines

Guidelines for building premium, responsive, and tactile interfaces (menus, buttons, shops, HUDs, and virtual joysticks) using Kaplay.js.

## When to use this skill
- When designing game menus, shop interfaces, or HUD elements.
- When implementing local storage persistence or cosmetic inventories.
- When creating touch-screen controls (virtual joysticks/buttons) for mobile devices.

---

## 1. Responsive Layout & Screen Anchors

Kaplay's canvas changes size dynamically based on the device screen. Hardcoding coordinates (e.g. `pos(800, 600)`) leads to broken layouts on mobile or ultra-wide monitors.

* **Anchor System**: Use `k.anchor()` to declare origin points and compute positions relative to canvas edges.
  * **Top Left (HUD/Scores)**: `k.pos(20, 20)`
  * **Center (Menus/Modals)**: `k.pos(k.width() / 2, k.height() / 2)`
  * **Bottom Center (Mobile Controls)**: `k.pos(k.width() / 2, k.height() - 100)`
* **Dynamic Recalculation**: Bind UI positions to the window size inside the update loop if the window can resize:
  ```javascript
  const logo = k.add([
    k.text("LOGO"),
    k.pos(k.width() / 2, 80),
    k.anchor("center")
  ]);
  
  logo.onUpdate(() => {
    logo.pos.x = k.width() / 2; // Center horizontally
  });
  ```

---

## 2. Neon Aesthetics & Glassmorphism

Kafakafaya uses a dark-cyberpunk, neon aesthetic. UIs must look high-end, futuristic, and premium.

* **Colors**: Avoid solid primitives. Use glowing neon color pairs:
  * Neon Blue: `k.rgb(0, 140, 255)` / `k.rgb(0, 240, 255)`
  * Neon Red: `k.rgb(255, 60, 60)` / `k.rgb(255, 70, 85)`
  * Neon Gold: `k.rgb(255, 215, 0)` / `k.rgb(240, 180, 20)`
* **Outlines & Shadows**: Draw subtle borders with glowing outlines.
  * Use `k.outline(width, color)` on boxes and buttons.
  * Layer darker shapes behind UIs with a tiny offset to simulate drop shadows.
* **Glassmorphism Backdrop**: Create overlay panels using semi-transparent dark shapes and high Z-indexes:
  ```javascript
  k.add([
    k.rect(400, 300, { radius: 12 }),
    k.color(15, 16, 22),
    k.opacity(0.85), // Glass transparency
    k.outline(2, k.rgb(0, 240, 255)), // Cyan neon border
    k.anchor("center"),
    k.pos(k.center()),
    k.z(10),
  ]);
  ```

---

## 3. Micro-Animations & Tactile States

Menus must feel alive. Any interactive element (button, selector) must respond to cursor actions.

* **Scale Hover Effect**: Always scale buttons up when hovered, and scale them down when the cursor leaves.
* **Important**: Always verify that the UI element has the `k.scale(1)` component initialized, otherwise `.scaleTo()` animations will fail to render.
* **Tactile Transition Example**:
  ```javascript
  const btn = k.add([
    k.rect(200, 50, { radius: 6 }),
    k.pos(k.center()),
    k.color(25, 25, 30),
    k.outline(1, k.rgb(150, 155, 160)),
    k.scale(1), // Crucial for scaling animations!
    k.anchor("center"),
    k.area(), // Necessary to detect cursor hover/clicks
  ]);

  btn.onHover(() => {
    btn.scaleTo(1.08);
    btn.outline.color = k.rgb(0, 240, 255); // Glow cyan on hover
    btn.outline.width = 2;
  });

  btn.onHoverEnd(() => {
    btn.scaleTo(1.0);
    btn.outline.color = k.rgb(150, 155, 160);
    btn.outline.width = 1;
  });
  ```

---

## 4. Mobile Touch Joysticks & On-Screen Inputs

For mobile devices, render a floating, semi-transparent D-Pad/Joystick on the left side, and skill buttons on the right side.

* **Touch Detection**: Use `k.onTouchStart`, `k.onTouchMove`, and `k.onTouchEnd`.
* **Determining Touch Position**: Translate touch inputs relative to the control area center.
* **Joystick Implementation Guide**:
  1. Base Outer Ring: Drawn statically on the screen corner.
  2. Handle Inner Knob: Moves within a maximum radius (e.g. 50px) based on the touch position.
  3. Direction Mapping: Calculate angle `Math.atan2(y, x)` of knob relative to center and map to forward/backward/steering vectors.

---

## 5. LocalStorage Store Persistence Pattern

Before migrating to cloud-synced databases like Supabase, store cosmetics, coins, stats, and unlocked cars locally in the browser's `localStorage` to ensure instant loading and offline capability.

```javascript
// Minimalist LocalStorage State Store
export const UserStore = {
  get: () => {
    const defaultData = {
      coins: 100,
      unlockedCars: ["DENGELI"],
      selectedCar: "DENGELI",
      selectedColor: "#008cff",
      highScore: 0
    };
    try {
      const data = localStorage.getItem("kafakafaya_user_data");
      return data ? { ...defaultData, ...JSON.parse(data) } : defaultData;
    } catch (e) {
      return defaultData;
    }
  },
  save: (data) => {
    try {
      localStorage.setItem("kafakafaya_user_data", JSON.stringify(data));
    } catch (e) {
      console.error("Store save error", e);
    }
  },
  addCoins: (amount) => {
    const current = UserStore.get();
    current.coins += amount;
    UserStore.save(current);
  }
};
```
