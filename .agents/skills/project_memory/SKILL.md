---
name: project_memory
description: Architectural guidelines for finite state machines (FSM), isolated configurations, and Playroom Kit multiplayer synchronization.
---

# State & Memory Management

Architectural patterns and synchronization rules for Kafakafaya game states, configuration structures, and multiplayer networking.

## When to use this skill
- When modifying vehicle states, handlers, or state transitions.
- When organizing constants, configurations, or player properties.
- When synchronizing gameplay actions, coordinates, or lobbies over Playroom Kit.

## How to use it

### 1. State Architecture & FSM
* **Finite State Machine (FSM) via Object Mapping**:
  * Avoid nested conditional branching and long switch-cases inside vehicle update loops.
  * Map vehicle behavior to state handlers using key-value objects (`CAR_STATES` in `src/states.js`):
    ```javascript
    export const CAR_STATES = {
      DRIVING: {
        update: (car) => { /* Process acceleration/steering inputs */ }
      },
      CLASH: {
        enter: (car) => { car.speed = 0; },
        update: (car) => { /* Mashing mechanics */ }
      },
      RECOIL: {
        enter: (car) => { /* Calculate recoil angle & speed */ },
        update: (car) => { /* Friction slowdown, return to DRIVING when low speed */ }
      }
    };
    ```
  * Perform transitions via a clean, state-changing helper (e.g. `changeState(car, newState)`).

### 2. Configuration & Stats Separation (DRY)
* **Stat Isolation**: Keep all class values, parameters, and sizes within a dedicated config file (`src/config.js`). Do not hardcode dimensions or modifiers inside core mechanics.
* **Scale-Driven Detailing**: Car assets, wheels, lights, and attachments must scale dynamically relative to the configuration width and height (`CAR_TYPES[type].width` and `.height`) to support clean updates to vehicle configurations.

### 3. Multiplayer Synchronization (Playroom Kit)
* **Host-Authority Model**:
  * The **Host** client calculates all physics update loops, collisions, HP reductions, and state transitions.
  * The **Host** broadcasts state data to the room using `player.setState("carData", { x, y, angle, hp, speed, state, ... })`.
* **Client-Interpolation Model**:
  * Non-host clients bypass local physics calculations and read room state data dynamically.
  * Position and orientation updates must use smooth linear interpolation (`.lerp`) to eliminate visual stuttering:
    ```javascript
    car.pos = car.pos.lerp(k.vec2(data.x, data.y), 0.35);
    car.angle = k.lerp(car.angle, data.angle, 0.35);
    ```
* **Input Synchronization**:
  * Keyboard controls map to binary flags (`dashPressed`, `skillPressed`, custom controls) inside `src/input.js` and are synced to the host.
  * Lock all controls (`controlsLocked = true`) during round countdowns and victory screens to prevent out-of-sync player movement.
