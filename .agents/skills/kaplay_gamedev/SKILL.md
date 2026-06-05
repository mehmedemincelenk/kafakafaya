---
name: kaplay_gamedev
description: Best practices and API guidelines for Kaplay.js (formerly Kaboom.js) game engine development, preventing scale reassignments and double-destruction crashes.
---

# Kaplay.js Gamedev Best Practices & API Guidelines

Detailed instructions, step-by-step guidance, and best practices for developing with Kaplay.js inside the Kafakafaya codebase.

## When to use this skill
- When adding or modifying game objects, shapes, text, or UI elements.
- When handling scene transitions, animations, or vector transformations.

## How to use it

### 1. Vector Scale Override (Total Game Freeze)
* **Rule**: NEVER assign a primitive number (e.g., `0`, `1`) directly to a game object's `scale` property.
* **Why**: In Kaplay, `scale` is an instance of `Vec2` (e.g., `{ x: 1, y: 1 }`). Reassigning it to a number overrides the reference, causing the engine renderer to crash on the next frame with `Cannot read property 'x' of undefined`.
* **Correct Usage**:
  ```javascript
  // To set scaling:
  obj.scaleTo(0.5); // Unified scaling
  obj.scaleTo(0.5, 0.8); // Custom x, y scaling
  
  // Inside dynamic update animations:
  obj.onUpdate(() => {
    obj.scaleTo(k.lerp(obj.scale.x, 1, k.dt() * 12));
  });
  ```

### 2. Round Transition & Scene Switch Freezes (Double-Destruction)
* **Rule**: When creating UI elements, HUD bars, or text displays that are not child nodes of an entity (e.g. created directly via `k.add`), they will be automatically destroyed by Kaplay during `k.go("scene")` transitions.
* **Why**: Calling `destroy()` on a game object that is already destroyed by Kaplay's scene cleanup throws an unhandled exception inside the engine loop, freezing the transition.
* **Correct Usage**:
  ```javascript
  // Wrap manual object cleanups inside car.onDestroy in try/catch:
  car.onDestroy(() => {
    try { healthBarBg.destroy(); } catch (e) {}
    try { healthBarFill.destroy(); } catch (e) {}
  });
  ```

### 3. Collision Boundaries & Anchors
* **Rule**: When positioning collision boundaries (`k.area()`), always match the parent anchor point (typically `"center"`).
* **Correct Usage**:
  ```javascript
  const car = k.add([
    k.rect(width, height, { radius: 2 }),
    k.pos(x, y),
    k.anchor("center"), // Set anchor first
    k.area(), // Collision box inherits parent dimensions and anchor
  ]);
  ```

---

## Component-Based Entity Design

1. **Composition over Inheritance**:
   * Build game objects by passing component list arrays directly to `k.add` or `k.make`.
   * Keep custom logic grouped under state variables within the object constructor instead of writing wrapper subclasses.
2. **Global Namespace Mounting**:
   * To prevent **Circular Dependency** issues where files import each other in a loop, attach singletons and global game state variables directly to the Kaplay instance (`k` object).
   * E.g., `k.gameOver = false;`, `k.isGamePaused = false;` in `src/kaplay.js`.

---

## Code Patterns & Refactoring Rules

* **Use `k.dt()` for delta time**: Ensure all movement, timer reductions, and animations are multiplied by `k.dt()` to remain independent of the rendering framerate.
* **Randomness API**: Use built-in helpers:
  * `k.rand(min, max)` for random floats.
  * `k.choose(array)` for picking a random element.
  * `k.chance(probability)` (0 to 1) for probability checks.
* **Vector Math**: Avoid manual trigonometry if Kaplay helpers exist:
  * Direction from angle: `Vec2.fromAngle(angle)` (in degrees).
  * Degree/radian helper: `k.deg2rad(deg)`, `k.rad2deg(rad)`.
  * Lerp movements: `vec1.lerp(vec2, factor)`.
