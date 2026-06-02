import kaplay from "kaplay";

export const k = kaplay({
  width: 1920,      // Oyun alanının genişliği (piksel)
  height: 1080,     // Oyun alanının yüksekliği (piksel)
  letterbox: true,  // Ekran boyutu değiştiğinde en-boy oranını korur
  background: [18, 18, 20], // Koyu gri minimalist arka plan
});

// Küresel oyun bitiş bayrağını k nesnesi üzerinde tutarak dairesel import bağımlılığını önlüyoruz.
k.gameOver = false;
