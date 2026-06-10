import kaplay from "kaplay";

export const k = kaplay({
  width: 1920,      // Oyun alanının genişliği (piksel)
  height: 1080,     // Oyun alanının yüksekliği (piksel)
  letterbox: true,  // Ekran boyutu değiştiğinde en-boy oranını korur
  background: [18, 18, 20], // Koyu gri minimalist arka plan
  texFilter: "linear", // Tüm kaplamaların ve yazıların pürüzsüz render edilmesini sağlar
});

// Küresel oyun durum bayraklarını k nesnesi üzerinde tutarak dairesel import bağımlılığını önlüyoruz.
k.gameOver = false;
k.isGamePaused = false;
k.isMultiplayer = false;

// --- DİNAMİK ARAYÜZ (HTML UI) ÖLÇEKLENDİRME ---
// Oyun ekranı (Kaplay Canvas) küçüldüğünde/büyüdüğünde HTML arayüz elemanlarının (HUD, menüler, sanal butonlar)
// birbirine girmesini ve taşmasını engellemek için, #ui-root elementini piksel-piksel canvas boyutuna eşitliyoruz.
function scaleHTMLOverlay() {
  const uiRoot = document.getElementById("ui-root");
  if (!uiRoot) return;

  const w = window.innerWidth;
  const h = window.innerHeight;
  
  const targetAspect = 16 / 9;
  const currentAspect = w / h;
  
  let scale = 1;
  let left = 0;
  let top = 0;
  
  if (currentAspect > targetAspect) {
    // Screen is wider than 16:9 (most phones in landscape) - fit height
    scale = h / 1080;
    const gameWidth = h * targetAspect;
    left = (w - gameWidth) / 2;
    top = 0;
  } else {
    // Screen is narrower than 16:9 (tablets or portrait) - fit width
    scale = w / 1920;
    const gameHeight = w / targetAspect;
    left = 0;
    top = (h - gameHeight) / 2;
  }
  
  uiRoot.style.position = "absolute";
  uiRoot.style.left = `${left}px`;
  uiRoot.style.top = `${top}px`;
  uiRoot.style.width = "1920px";
  uiRoot.style.height = "1080px";
  uiRoot.style.transform = `scale(${scale})`;
  uiRoot.style.transformOrigin = "top left";
  uiRoot.style.overflow = "hidden";

  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || w < 1024;
  if (isTouch) {
    uiRoot.classList.add("is-touch");
  } else {
    uiRoot.classList.remove("is-touch");
  }
}

// Ekran değişimlerinde ve her karede ölçeklendirmeyi güncelle
window.addEventListener("resize", scaleHTMLOverlay);
k.onUpdate(scaleHTMLOverlay);
// Sayfa yüklendiğinde de tetikle
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", scaleHTMLOverlay);
} else {
  scaleHTMLOverlay();
}

// Türkçe karakterlerin (ı, ş, ğ vb.) düzgün okunması ve pikselleşme sorununun çözülmesi için
// Outfit yazı tipini yükleyip varsayılan "sans-serif" ve "monospace" fontlarının üzerine yazıyoruz.
k.loadFont("sans-serif", "https://cdn.jsdelivr.net/npm/@fontsource/outfit@5.0.8/files/outfit-latin-ext-700-normal.woff2", { filter: "linear" });
k.loadFont("monospace", "https://cdn.jsdelivr.net/npm/@fontsource/outfit@5.0.8/files/outfit-latin-ext-400-normal.woff2", { filter: "linear" });

// Ayarlardaki ekran sarsıntısını küresel olarak susturmak için k.shake'i sarmalıyoruz
const nativeShake = k.shake;
k.shake = (intensity) => {
  try {
    const raw = localStorage.getItem("kafakafaya_settings");
    const settings = raw ? JSON.parse(raw) : { screenShake: true };
    if (settings.screenShake === false) {
      return;
    }
  } catch (e) {}
  nativeShake(intensity);
};

// Ses ayarını başlangıçta yükle
try {
  const raw = localStorage.getItem("kafakafaya_settings");
  const settings = raw ? JSON.parse(raw) : { sfx: true };
  k.volume(settings.sfx === false ? 0 : 1);
} catch (e) {}

// FPS Hesaplama ve Çizim
let fpsValue = 60;
let frameCount = 0;
let lastFpsUpdate = performance.now();

k.onUpdate(() => {
  const now = performance.now();
  frameCount++;
  if (now - lastFpsUpdate >= 500) {
    fpsValue = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
    frameCount = 0;
    lastFpsUpdate = now;
  }
});

k.onDraw(() => {
  try {
    const raw = localStorage.getItem("kafakafaya_settings");
    const settings = raw ? JSON.parse(raw) : {};
    if (settings.showFps === true) {
      k.drawText({
        text: `FPS: ${fpsValue}`,
        size: 14,
        font: "monospace",
        pos: k.vec2(k.width() - 120, 25),
        color: k.rgb(0, 240, 255),
        z: 9999
      });
    }
  } catch (e) {}
});
