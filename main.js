import { k } from "./src/kaplay.js";
import { initMenuScene } from "./src/scenes/menu.js";
import { initGameScene } from "./src/scenes/game.js";

// Sahneleri Kaydet
initMenuScene();
initGameScene();

// Oyunu Menü Sahnesiyle Başlat
k.go("menu");
