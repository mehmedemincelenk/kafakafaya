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

// Türkçe karakterlerin (ı, ş, ğ vb.) düzgün okunması ve pikselleşme sorununun çözülmesi için
// Outfit yazı tipini yükleyip varsayılan "sans-serif" ve "monospace" fontlarının üzerine yazıyoruz.
k.loadFont("sans-serif", "https://cdn.jsdelivr.net/npm/@fontsource/outfit@5.0.8/files/outfit-latin-ext-700-normal.woff2", { filter: "linear" });
k.loadFont("monospace", "https://cdn.jsdelivr.net/npm/@fontsource/outfit@5.0.8/files/outfit-latin-ext-400-normal.woff2", { filter: "linear" });
