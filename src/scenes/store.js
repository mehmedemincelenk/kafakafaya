import { k } from "../kaplay.js";
import { storeOverlay } from "../ui/screens/store.js";

export function initStoreScene() {
  k.scene("store", () => {
    const uiElements = [];

    // Ambient space dust / particle stars background
    for (let i = 0; i < 35; i++) {
      const star = k.add([
        k.pos(k.rand(0, k.width()), k.rand(0, k.height())),
        k.rect(k.rand(1.5, 3), k.rand(1.5, 3)),
        k.color(200, 210, 230),
        k.opacity(k.rand(0.1, 0.4)),
        k.z(1),
      ]);

      const initialOpacity = star.opacity;
      const rate = k.rand(1, 2.5);
      star.onUpdate(() => {
        star.opacity = initialOpacity + Math.sin(k.time() * rate) * 0.08;
      });
      uiElements.push(star);
    }

    // Mount HTML Store Overlay UI
    storeOverlay.mount();

    k.onDestroy(() => {
      storeOverlay.dismount();
      uiElements.forEach(el => {
        try { el.destroy(); } catch (e) {}
      });
    });
  });
}
