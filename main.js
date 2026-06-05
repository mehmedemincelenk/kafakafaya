import { k } from "./src/kaplay.js";
import { initMenuScene } from "./src/scenes/menu.js";
import { initGameScene } from "./src/scenes/game.js";
import { initStoreScene } from "./src/scenes/store.js";

window.k = k;
console.log("GAME INITIALIZATION STARTED");

// Sahneleri Kaydet
initMenuScene();
initGameScene();
initStoreScene();

// Oyunu Menü Sahnesiyle Başlat
k.go("menu");
