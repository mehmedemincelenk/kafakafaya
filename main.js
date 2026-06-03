window.logs = [];
const originalLog = console.log;
console.log = function(...args) {
  window.logs.push({type: 'log', text: args.join(' ')});
  originalLog.apply(console, args);
};
const originalError = console.error;
console.error = function(...args) {
  window.logs.push({type: 'error', text: args.join(' ')});
  originalError.apply(console, args);
};
const originalWarn = console.warn;
console.warn = function(...args) {
  window.logs.push({type: 'warn', text: args.join(' ')});
  originalWarn.apply(console, args);
};

window.onerror = function(msg, url, line, col, error) {
  const errStr = msg + '\n' + (error ? error.stack : '');
  window.logs.push({type: 'onerror', text: errStr});
  const div = document.createElement('div');
  div.style.position = 'fixed';
  div.style.top = '0';
  div.style.left = '0';
  div.style.background = 'red';
  div.style.color = 'white';
  div.style.zIndex = '99999';
  div.style.padding = '20px';
  div.style.fontSize = '16px';
  div.innerText = errStr;
  document.body.appendChild(div);
};

import { k } from "./src/kaplay.js";
import { initMenuScene } from "./src/scenes/menu.js";
import { initGameScene } from "./src/scenes/game.js";

window.k = k;
console.log("GAME INITIALIZATION STARTED");

// Sahneleri Kaydet
initMenuScene();
initGameScene();

// Oyunu Menü Sahnesiyle Başlat
k.go("menu");



