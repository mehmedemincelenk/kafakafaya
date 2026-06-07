import { k } from "../kaplay.js";
import { addCar } from "../game/car.js";
import { setupCollisions } from "../game/collision.js";
import { spawnPowerup, setupPowerupCollisions } from "../game/powerup.js";
import { isHost, getState, setState, myPlayer } from "playroomkit";
import { playroomPlayers } from "../multiplayer.js";
import { MAPS } from "../maps.js";
import { setupHUD } from "../game/hud.js";
import { setupArena } from "../game/arena.js";
import { setupPauseMenu } from "../game/pause.js";
import { spawnPortalPair, setupPortalCooldownUpdater } from "../game/portal.js";
import { store } from "../store.js";
import { CAR_TYPES } from "../config.js";
import { setupBotAI } from "../game/bot.js";
import { setupSuddenDeath } from "../game/suddendeath.js";
import { MatchManager } from "../game/matchmanager.js";
import { getTurkishGuestName } from "../utils.js";
import { cleanupGameOverMenu } from "../game/gameover.js";

export function initGameScene() {
  k.scene("game", (localParams) => {
    k.gameOver = false;
    k.isGamePaused = false;
    window.localClashWins = 0;

    // Mod, skorlar ve araç tiplerini bağlantı türüne göre belirle
    const gameMode = k.isMultiplayer ? (getState("gameMode") || "NORMAL") : (localParams?.gameMode || "NORMAL");
    const p1Score = k.isMultiplayer ? 0 : (localParams?.p1Score || 0);
    const p2Score = k.isMultiplayer ? 0 : (localParams?.p2Score || 0);
    const p1Type = localParams?.p1Type || "BARKAN";
    const p2Type = localParams?.p2Type || "BARKAN";
    const p2Joined = k.isMultiplayer ? true : (localParams?.p2Joined !== false);

    const p1Skin = localParams?.p1Skin || store.getSelectedSkin("p1", p1Type) || "default";
    const p2Skin = localParams?.p2Skin || (p2Joined ? store.getSelectedSkin("p2", p2Type) : "default");
    const p1Skill = localParams?.p1Skill || store.getSelectedSkill("p1", p1Type) || "default";
    const p2Skill = localParams?.p2Skill || (p2Joined ? store.getSelectedSkill("p2", p2Type) : "default");
    const p1Weapon = localParams?.p1Weapon || store.getSelectedWeapon("p1") || "mizrak";
    const p2Weapon = localParams?.p2Weapon || (p2Joined ? store.getSelectedWeapon("p2") : "mizrak");
    const p1Support = localParams?.p1Support || store.getSelectedSupport("p1") || "mini_iha";
    const p2Support = localParams?.p2Support || (p2Joined ? store.getSelectedSupport("p2") : "mini_iha");


    const pauseMenu = setupPauseMenu({
      p1Type,
      p2Type,
      gameMode,
      p2Joined,
    });

    // ESC Tuşu ile Oyunu Duraklatma (Pause)
    k.onKeyPress("escape", () => {
      if (k.gameOver) return;
      if (k.isMultiplayer && !isHost()) return; // Çok oyunculuda sadece Host duraklatabilir

      if (k.isMultiplayer) {
        const nextPaused = !getState("isGamePaused");
        setState("isGamePaused", nextPaused);
        if (nextPaused) {
          pauseMenu.show();
        } else {
          pauseMenu.hide();
        }
      } else {
        k.isGamePaused = !k.isGamePaused;
        if (k.isGamePaused) {
          pauseMenu.show();
        } else {
          pauseMenu.hide();
        }
      }
    });

    // Harita Tanımlarını Yükle (İlk raundda seçilir ve tüm maç boyunca korunur)
    let mapData;
    if (k.isMultiplayer) {
      if (isHost()) {
        const blueScore = getState("blueScore") || 0;
        const redScore = getState("redScore") || 0;
        let mapName = getState("gameMap");
        
        // Sadece ilk raundda (skorlar 0-0 iken ve raund bitmemişken) veya harita seçilmemişse yeni harita belirlenir
        if (!mapName || (blueScore === 0 && redScore === 0 && !getState("roundOver"))) {
          const randomMap = k.choose(MAPS);
          mapName = randomMap.name;
          setState("gameMap", mapName);
        }
        mapData = MAPS.find(m => m.name === mapName) || MAPS[0];
      } else {
        const mapName = getState("gameMap") || MAPS[0].name;
        mapData = MAPS.find(m => m.name === mapName) || MAPS[0];
      }
    } else {
      const mapName = localParams?.mapName || k.choose(MAPS).name;
      mapData = MAPS.find(m => m.name === mapName) || MAPS[0];
    }

    // Arena ve Engellerin Çizilmesi
    setupArena(mapData);

    // Portalları Spawn Et
    spawnPortalPair(
      k.vec2(k.width() / 2 - 450, k.height() / 2),
      k.vec2(k.width() / 2 + 450, k.height() / 2)
    );
    setupPortalCooldownUpdater();

    // --- DİNAMİK ARAÇ OLUŞTURMA ---
    const cars = [];

    if (k.isMultiplayer) {
      const roomPlayers = playroomPlayers;
      roomPlayers.forEach((p, idx) => {
        let startPos;
        let startAngle;

        if (idx === 0) {
          startPos = k.vec2(180, k.height() / 2);
          startAngle = 0;
        } else if (idx === 1) {
          startPos = k.vec2(k.width() - 180, k.height() / 2);
          startAngle = 180;
        } else if (idx === 2) {
          startPos = k.vec2(k.width() / 2, 180);
          startAngle = 90;
        } else {
          startPos = k.vec2(k.width() / 2, k.height() - 180);
          startAngle = 270;
        }

        const options = Object.keys(CAR_TYPES);
        const carType = options[p.getState("carTypeIdx") || 0] || "BARKAN";

        const pColor = p.getProfile()?.color;
        const color = pColor ? k.rgb(pColor.r, pColor.g, pColor.b) : (idx % 2 === 0 ? k.rgb(255, 184, 0) : k.rgb(0, 230, 118));
        const tag = idx % 2 === 0 ? "teamBlue" : "teamRed";

        const skinId = p.getState("skinId") || "default";
        const skillId = p.getState("skillId") || "default";

        const pUsername = p.getState("username");
        let displayName = `Oyuncu ${idx + 1}`;
        if (pUsername) {
          const isGuest = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pUsername) || (pUsername.length >= 15 && !pUsername.includes("-"));
          displayName = isGuest ? getTurkishGuestName(pUsername) : pUsername.toUpperCase();
        }

        const car = addCar({
          name: displayName,
          tag,
          color,
          startPos,
          startAngle,
          type: carType,
          playerInfo: p,
          skinId,
          skillId,
          selectedWeapon: p.getState("selectedWeapon") || "mizrak",
          selectedSupport: p.getState("selectedSupport") || "mini_iha",
        });

        if (p.id === myPlayer().id) {
          car.onClashWin = () => {
            window.localClashWins++;
          };
        }

        cars.push(car);
      });
    } else {
      // YEREL MOD ARAÇ OLUŞTURMA
      const p1 = addCar({
        name: "Oyuncu 1",
        tag: "player1",
        color: k.rgb(255, 184, 0),
        startPos: k.vec2(180, k.height() / 2),
        startAngle: 0,
        controls: {
          forward: "w",
          backward: "s",
          left: "a",
          right: "d",
          dash: "shift",
          skill: "q",
        },
        type: p1Type,
        skinId: p1Skin,
        skillId: p1Skill,
        selectedWeapon: p1Weapon,
        selectedSupport: p1Support,
      });

      p1.onClashWin = () => {
        window.localClashWins++;
      };

      const p2 = addCar({
        name: p2Joined ? "Oyuncu 2" : "KKSAN_BOT",
        tag: "player2",
        color: k.rgb(0, 230, 118),
        startPos: k.vec2(k.width() - 180, k.height() / 2),
        startAngle: 180,
        controls: {
          forward: "up",
          backward: "down",
          left: "left",
          right: "right",
          dash: "enter",
          skill: "numpad0",
        },
        type: p2Type,
        skinId: p2Skin,
        skillId: p2Skill,
        selectedWeapon: p2Weapon,
        selectedSupport: p2Support,
      });

      p2.isBot = !p2Joined;

      if (p2.isBot) {
        setupBotAI(p2, () => p1);
      }

      cars.push(p1);
      cars.push(p2);
    }

    // Match Manager (Zamanlayıcılar, Kurallar, Ağ Eşitlemeleri)
     const matchManager = new MatchManager({
      cars,
      gameMode,
      p1Score,
      p2Score,
      p1Type,
      p2Type,
      p2Joined,
      p1Skin,
      p2Skin,
      p1Skill,
      p2Skill,
      p1Weapon,
      p2Weapon,
      p1Support,
      p2Support,
      pauseMenu,
      mapName: mapData.name,
    });

    // Raund Başı Geri Sayım
    matchManager.startCountdown();

    // HUD Kurulumu
    setupHUD(cars);

    // Sudden Death / Daralan Alan Kontrolü
    const suddenDeath = setupSuddenDeath(cars, () => matchManager.checkGameOver());

    // Çarpışmalar ve Power-up Kurulumu
    const checkGameOver = () => matchManager.checkGameOver();
    if (k.isMultiplayer) {
      if (isHost()) {
        setupCollisions(checkGameOver, gameMode);
        setupPowerupCollisions();
        k.loop(7.5, spawnPowerup);
      }
    } else {
      setupCollisions(checkGameOver, gameMode);
      setupPowerupCollisions();
      k.loop(7.5, spawnPowerup);
    }

    // Güncelleme Döngüsü
    k.onUpdate(() => {
      matchManager.update();
      if (matchManager.sceneTransitioned) return;

      if (k.isMultiplayer && playroomPlayers.length < 2 && !k.gameOver) {
        k.gameOver = true;
        matchManager.sceneTransitioned = true;
        matchManager.showAnnouncement("RAKİP AYRILDI", "BAĞLANTI KOPACAK • MENÜYE DÖNÜLÜYOR...", "draw-match");
        k.wait(3.0, () => {
          matchManager.clearAnnouncement();
          if (pauseMenu) pauseMenu.cancel();
          k.go("menu");
        });
        return;
      }

      suddenDeath.update(matchManager.roundTimeLeft);
    });

    // Sahneden çıkarken HTML arayüz elemanlarını temizle (Memory Leak ve UI Hayaletleşme Engelleme)
    const sceneCleanup = k.add([]);
    sceneCleanup.onDestroy(() => {
      const hudRoot = document.getElementById("gameplay-hud-root");
      if (hudRoot) hudRoot.remove();
      const pauseMenuEl = document.getElementById("pause-menu-root");
      if (pauseMenuEl) pauseMenuEl.remove();
      const gameOverMenuEl = document.getElementById("game-over-root");
      if (gameOverMenuEl) gameOverMenuEl.remove();

      // Cancel and cleanup event listeners/keys
      if (pauseMenu) pauseMenu.cancel();
      cleanupGameOverMenu();
    });
  });
}
