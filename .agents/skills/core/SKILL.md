---
name: core
description: Global project rules, architectural guidelines, and forbidden tools/patterns (e.g. no Puppeteer, no overengineering).
---

# Core Project Rules & Principles

These are the global rules and guidelines for this repository. Every agent must follow these rules without exception.

## 🛑 Yasaklar (Forbidden)
- **No Puppeteer / Browser Subagent Tools**: Under no circumstances should the agent invoke browser subagents, Puppeteer, or Lighthouse tools. It is strictly forbidden to use browser simulation or page interaction tools.
- **No Overengineering**: Avoid unnecessary abstractions, overly complex architectures, or predictive scaling. Keep it simple.

## ⚖️ Anayasa (Constitution)
- **SOLID / Mimari-first**: Plan the architecture first, keep responsibilities separated.
- **DRY (Don't Repeat Yourself)**: Reuse components and logic.
- **Component-Based**: Keep components modular, focused, and decoupled.
- **KISS / YAGNI**: Keep it simple, do not implement features until they are needed.
- **Clean Code**: Keep code clean, readable, and maintainable.
- **Mobile-First**: Especially for modal windows and layout designs.
- **Style**: Be concise and clear, avoiding unnecessary length.