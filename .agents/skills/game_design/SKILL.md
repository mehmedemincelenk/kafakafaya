---
name: game_design
description: Guidelines for lead game design, aesthetic themes, momentum-based physics formulas, camera shake intensities, and responsive UI scaling.
---

# Game Design & Polish with Kaplay

Guidelines and aesthetic parameters to ensure a high-juice game feel, modern visuals, and responsive layouts.

## When to use this skill
- When designing game mechanics, collisions, camera shakes, or UI/UX menus.
- When refining color themes, particle effects, or mobile viewport layouts.

## How to use it

### 1. Visual Aesthetics & Themes
* **Avoid Browser Defaults**:
  * Do not use default primary colors (pure red, green, blue). Use curated neon palettes or HSL-based values.
  * Background theme should match a dark, sleek, tech-focused design: background `[18, 18, 20]`.
* **Visual Feedback (Juice)**:
  * **Ghost Trails**: Spawn trailing shadows during fast-movement states (like Universal Dash or speed-boost skills) by generating low-opacity, fading clones.
  * **Red Flashing Alert**: When a player is low on health (HP < 30) or outside the safe zone, trigger an overlay or a color-flashing timer.
  * **Neon Sparks**: Use particle clusters with randomized velocity vectors for portals, collisions, and damage feedback.

### 2. Momentum-Based Collisions & Combat
* **The Momentum Rule**:
  * Standard speed-based hits are insufficient. Attacks MUST be calculated based on **Momentum (Mass × Speed)**.
  * A high-speed, low-mass vehicle (Glass Cannon) will bounce off and take damage if it rams into a stationary, high-mass vehicle (Tank).
  * **Formula**:
    $$\text{Momentum} = \text{Speed} \times \text{Mass}$$
    $$\text{Saldırgan (Attacker)} = \text{Momentum}_1 > \text{Momentum}_2 \text{ ise } \text{Car}_1 \text{ aksi halde } \text{Car}_2$$
* **Clash Duel (Tampon Tampona)**:
  * Triggered when two vehicles meet head-on in `KAFA KAFAYA` mode while actively driving (`speed > 50`).
  * Mini-game style: Button-mashing action (`W` or `Up Arrow`) determines who pushes whom. Losing player takes a raw **35 HP damage** and gets thrown back. Winner gets a temporary Nitro boost.

### 3. Camera & Screen Effects (Screen Shake)
Match the action's magnitude with the appropriate shake intensity:
* **Universal Dash**: `k.shake(1.0)` (0.2 seconds).
* **Active Skill Activation**: `k.shake(1.5)` (0.3 seconds).
* **Minor Vehicle Collision**: `k.shake(2.0)` (0.25 seconds).
* **Clash Duel Finish / Portal Teleport**: `k.shake(3.0)` (0.4 seconds).
* **Heavy Momentum T-Bone Hit**: `k.shake(4.5)` (0.45 seconds).

### 4. Mobile-First Responsiveness & UI
* **HUD Overlay Placement**:
  * Display floating HUD elements relative to the vehicle's position.
  * Do NOT attach HUD components (health, skill bars) as physical children of the vehicle to prevent them from rotating with the body. Instead, keep them independent and update their positions in the `onUpdate` loop offset by `HEALTH_BAR_OFFSET_Y`.
* **Mobile Modals**:
  * All overlay menus (Pause, Victory, Lobby settings) must fit centered screen containers with touch-friendly button targets (minimum size 44x44px).
  * Menus should scale dynamically based on viewport dimensions.
