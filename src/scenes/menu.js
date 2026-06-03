import { k } from "../kaplay.js";
import { CAR_TYPES } from "../config.js";
import { drawCarDetails } from "../car.js";
import { MAPS } from "../maps.js";
import { insertCoin, myPlayer, isHost, setState, getState } from "playroomkit";
import { playroomPlayers, initMultiplayerListeners, isConnected } from "../multiplayer.js";

function spawnPreview(parentCard, type, color) {
  const container = parentCard.add([k.pos(0, -10), k.rotate(0)]);
  drawCarDetails(container, type, color);
  container.onUpdate(() => {
    container.angle += k.dt() * 35;
  });
  return container;
}

export function initMenuScene() {
  k.scene("menu", () => {
    const options = ["DENGELI", "HIPHIZLI", "GUCLU", "TANK", "DRIFT"];
    let gameMode = "NORMAL";
    let menuState = "PLAY_TYPE_SELECT"; // "PLAY_TYPE_SELECT" | "MODE_SELECT" | "MAP_SELECT" | "CAR_SELECT"
    let inputCooldown = false;
    let renderedPlayers = [];
    let selectedPlayTypeIdx = 0; // 0: YEREL, 1: BERABER
    let selectedModeIdx = 0; // 0: NORMAL, 1: KAFA_KAFAYA
    let stageTitle = null;

    // Geçiş kontrol korumaları (Race condition engellemek için)
    let mapSelectTransitioning = false;
    let carSelectTransitioning = false;
    let hostMapTransitioning = false;
    let hostCarTransitioning = false;

    function triggerCooldown() {
      inputCooldown = true;
      k.wait(0.2, () => inputCooldown = false);
    }

    // Başlık
    k.add([
      k.text("KAFA KAFAYA", { size: 64, letterSpacing: 6 }),
      k.pos(k.width() / 2, 110),
      k.anchor("center"),
      k.color(255, 255, 255),
    ]);

    // ----------------------------------
    // AŞAMA 0: OYNANIŞ TÜRÜ SEÇİMİ
    // ----------------------------------
    const playTypeUIGroup = [];

    const typeTitle = k.add([
      k.text("OYUN BAĞLANTISINI SEÇİN", { size: 20, letterSpacing: 2 }),
      k.pos(k.width() / 2, k.height() / 2 - 100),
      k.anchor("center"),
      k.color(255, 215, 0),
    ]);
    playTypeUIGroup.push(typeTitle);

    function createSelectionCard(parentGroup, titleText, descText, xOffset) {
      const card = k.add([
        k.rect(340, 120, { radius: 6 }),
        k.pos(k.width() / 2 + xOffset, k.height() / 2 + 10),
        k.anchor("center"),
        k.color(18, 19, 23),
        k.outline(1.5, k.rgb(40, 40, 45)),
        k.area(),
      ]);
      const title = card.add([
        k.text(titleText, { size: 16, letterSpacing: 1 }),
        k.pos(0, -25),
        k.anchor("center"),
        k.color(255, 255, 255),
      ]);
      card.add([
        k.text(descText, { size: 11, lineSpacing: 4 }),
        k.pos(0, 15),
        k.anchor("center"),
        k.color(150, 150, 155),
      ]);
      parentGroup.push(card);
      return { card, title };
    }

    const localCard = createSelectionCard(playTypeUIGroup, "YEREL OYNA", "Aynı bilgisayardan\n2 Oyuncu (Klavye paylaşımı)", -180);
    const onlineCard = createSelectionCard(playTypeUIGroup, "BERABER OYNA", "Çevrimiçi çok oyunculu\n(Playroom Kit ile)", 180);

    const typeHelpText = k.add([
      k.text("Seçmek için Tıklayın • Onaylamak için Tekrar Tıklayın veya SPACE/ENTER'a Basın", { size: 11 }),
      k.pos(k.width() / 2, k.height() / 2 + 120),
      k.anchor("center"),
      k.color(150, 150, 155),
    ]);
    playTypeUIGroup.push(typeHelpText);

    localCard.card.onClick(() => {
      if (inputCooldown) return;
      selectedPlayTypeIdx === 0 ? confirmPlayType(0) : (selectedPlayTypeIdx = 0, updatePlayTypeUI());
    });
    onlineCard.card.onClick(() => {
      if (inputCooldown) return;
      selectedPlayTypeIdx === 1 ? confirmPlayType(1) : (selectedPlayTypeIdx = 1, updatePlayTypeUI());
    });

    function updatePlayTypeUI() {
      const activeColor = k.rgb(0, 140, 255);
      localCard.card.outline.color = selectedPlayTypeIdx === 0 ? activeColor : k.rgb(40, 40, 45);
      localCard.card.outline.width = selectedPlayTypeIdx === 0 ? 2 : 1.5;
      localCard.title.color = selectedPlayTypeIdx === 0 ? activeColor : k.rgb(255, 255, 255);

      onlineCard.card.outline.color = selectedPlayTypeIdx === 1 ? activeColor : k.rgb(40, 40, 45);
      onlineCard.card.outline.width = selectedPlayTypeIdx === 1 ? 2 : 1.5;
      onlineCard.title.color = selectedPlayTypeIdx === 1 ? activeColor : k.rgb(255, 255, 255);
    }

    updatePlayTypeUI();

    async function confirmPlayType(type) {
      triggerCooldown();
      playTypeUIGroup.forEach(obj => obj.destroy());

      if (type === 0) {
        k.isMultiplayer = false;
        revealModeSelect();
      } else {
        if (isConnected) {
          k.isMultiplayer = true;
          revealModeSelect();
          return;
        }
        const loadingText = k.add([
          k.text("ÇEVRİMİÇİ LOBİYE BAĞLANILIYOR...", { size: 20 }),
          k.pos(k.width() / 2, k.height() / 2),
          k.anchor("center"),
          k.color(255, 215, 0),
        ]);

        try {
          await insertCoin({
            gameId: "kafakafaya",
            discord: false,
            skipLobby: true,
          });
          initMultiplayerListeners();
          k.isMultiplayer = true;
          loadingText.destroy();
          revealModeSelect();
        } catch (e) {
          loadingText.text = "BAĞLANTI HATASI! YEREL MODA DÖNÜLÜYOR...";
          loadingText.color = k.rgb(255, 60, 60);
          k.wait(2.0, () => {
            loadingText.destroy();
            k.isMultiplayer = false;
            revealModeSelect();
          });
        }
      }
    }

    // ----------------------------------
    // AŞAMA 1: OYUN MODU SEÇİMİ
    // ----------------------------------
    const modeUIGroup = [];
    let norm, clash;

    function revealModeSelect() {
      menuState = "MODE_SELECT";

      k.add([
        k.text(k.isMultiplayer ? "O N L I N E" : "Y E R E L", { size: 18, letterSpacing: 4 }),
        k.pos(k.width() / 2, 165),
        k.anchor("center"),
        k.color(k.isMultiplayer ? k.rgb(255, 60, 60) : k.rgb(0, 140, 255)),
      ]);

      const modeTitle = k.add([
        k.text(k.isMultiplayer ? "OYUN MODUNU SEÇİN (Sadece Kurucu)" : "OYUN MODUNU SEÇİN", { size: 20, letterSpacing: 2 }),
        k.pos(k.width() / 2, k.height() / 2 - 100),
        k.anchor("center"),
        k.color(255, 215, 0),
      ]);
      modeUIGroup.push(modeTitle);

      norm = createSelectionCard(modeUIGroup, "NORMAL MOD", "Farklı araçlar seçilebilir\nMomentum ve asimetrik fizik odaklıdır", -180);
      clash = createSelectionCard(modeUIGroup, "KAFA KAFAYA MODU", "Oyuncular aynı aracı kullanır\nKafa kafaya çarpışmalar düello tetikler", 180);

      const modeHelpText = k.add([
        k.text((k.isMultiplayer && !isHost()) ? "Kurucunun mod seçmesi bekleniyor..." : "Seçmek için Tıklayın • Onaylamak için Tekrar Tıklayın veya SPACE/ENTER'a Basın", { size: 11 }),
        k.pos(k.width() / 2, k.height() / 2 + 120),
        k.anchor("center"),
        k.color(150, 150, 155),
      ]);
      modeUIGroup.push(modeHelpText);

      norm.card.onClick(() => {
        if (inputCooldown) return;
        if (k.isMultiplayer && !isHost()) return;
        selectedModeIdx === 0 ? confirmMode() : (selectedModeIdx = 0, updateModeUIHost());
      });
      clash.card.onClick(() => {
        if (inputCooldown) return;
        if (k.isMultiplayer && !isHost()) return;
        selectedModeIdx === 1 ? confirmMode() : (selectedModeIdx = 1, updateModeUIHost());
      });

      updateModeUI();
    }

    function updateModeUIHost() {
      if (k.isMultiplayer) setState("selectedModeIdx", selectedModeIdx);
      updateModeUI();
    }

    function confirmMode() {
      if (inputCooldown) return;
      if (k.isMultiplayer && !isHost()) return;

      triggerCooldown();
      gameMode = selectedModeIdx === 0 ? "NORMAL" : "KAFA_KAFAYA";

      if (k.isMultiplayer) {
        setState("gameMode", gameMode);
        setState("menuState", "MAP_SELECT");
      }

      modeUIGroup.forEach(obj => obj.destroy());
      revealMapSelect();
    }

    function updateModeUI() {
      if (!norm || !clash) return;
      const activeColor = selectedModeIdx === 0 ? k.rgb(0, 140, 255) : k.rgb(255, 60, 60);
      norm.card.outline.color = selectedModeIdx === 0 ? activeColor : k.rgb(40, 40, 45);
      norm.card.outline.width = selectedModeIdx === 0 ? 2 : 1.5;
      norm.title.color = selectedModeIdx === 0 ? activeColor : k.rgb(255, 255, 255);

      clash.card.outline.color = selectedModeIdx === 1 ? activeColor : k.rgb(40, 40, 45);
      clash.card.outline.width = selectedModeIdx === 1 ? 2 : 1.5;
      clash.title.color = selectedModeIdx === 1 ? activeColor : k.rgb(255, 255, 255);
    }

    // ----------------------------------
    // DİNAMİK OYUNCU PANEL BİLEŞENİ
    // ----------------------------------
    function createPlayerSelectorPanel(pObj) {
      pObj.panel = k.add([
        k.rect(300, 460, { radius: 4 }),
        k.pos(pObj.posX, k.height() / 2 + 50),
        k.anchor("center"),
        k.color(14, 15, 18),
        k.outline(1.5, pObj.color),
      ]);

      pObj.panel.add([k.text(pObj.name, { size: 20 }), k.pos(0, -180), k.anchor("center"), k.color(pObj.color)]);

      pObj.card = pObj.panel.add([
        k.rect(260, 260, { radius: 6 }),
        k.pos(0, -10),
        k.anchor("center"),
        k.color(18, 19, 23),
        k.outline(1.5, k.rgb(40, 40, 45)),
      ]);

      pObj.leftArrow = pObj.card.add([k.text("<", { size: 18 }), k.pos(-105, -10), k.anchor("center"), k.color(100, 100, 105), k.area()]);
      pObj.leftArrow.onClick(() => handleSelectCycle(pObj, -1));

      pObj.rightArrow = pObj.card.add([k.text(">", { size: 18 }), k.pos(105, -10), k.anchor("center"), k.color(100, 100, 105), k.area()]);
      pObj.rightArrow.onClick(() => handleSelectCycle(pObj, 1));

      pObj.btn = pObj.panel.add([k.rect(220, 40, { radius: 4 }), k.pos(0, 195), k.anchor("center"), k.color(24, 25, 28), k.outline(1, k.rgb(60, 60, 65)), k.area()]);
      pObj.status = pObj.btn.add([k.text("", { size: 14 }), k.anchor("center"), k.color(150, 150, 155)]);

      let helperText = "";
      if (k.isMultiplayer) {
        helperText = pObj.id === myPlayer().id ? "Secim: A-D / Yon Tuslari • Onay: ENTER/SPACE" : "Diger oyuncunun secimi...";
      } else {
        helperText = pObj.id === 0 ? "Secim: A-D • Onay: SPACE" : "Secim: Yon Tuslari • Onay: ENTER";
      }

      pObj.panel.add([
        k.text(helperText, { size: 9 }),
        k.pos(0, 150),
        k.anchor("center"),
        k.color(110, 112, 115)
      ]);

      pObj.btn.onClick(() => handleConfirm(pObj));
      pObj.statsUiObjects = [];
      updatePanelUI(pObj);
    }

    function handleSelectCycle(pObj, dir) {
      if (inputCooldown || pObj.ready) return;
      const items = menuState === "MAP_SELECT" ? MAPS : options;
      pObj.idx = (pObj.idx + dir + items.length) % items.length;

      if (k.isMultiplayer && pObj.id === myPlayer().id) {
        const stateKey = menuState === "MAP_SELECT" ? "mapVoteIdx" : "carTypeIdx";
        myPlayer().setState(stateKey, pObj.idx);
      }
      updatePanelUI(pObj);
    }

    function handleConfirm(pObj) {
      if (inputCooldown || pObj.ready) return;

      if (k.isMultiplayer) {
        if (pObj.id !== myPlayer().id) return;
        if (menuState === "MAP_SELECT") {
          myPlayer().setState("mapReady", true);
          myPlayer().setState("mapVote", MAPS[pObj.idx].name);
        } else {
          myPlayer().setState("ready", true);
        }
      } else {
        pObj.ready = true;
        updatePanelUI(pObj);
        menuState === "MAP_SELECT" ? checkStartMapLocal() : checkStartCarLocal();
      }
    }

    function updatePanelUI(pObj) {
      if (pObj.previewObj) pObj.previewObj.destroy();
      if (pObj.titleLabel) pObj.titleLabel.destroy();
      pObj.statsUiObjects.forEach(obj => obj.destroy());
      pObj.statsUiObjects = [];

      pObj.leftArrow.hidden = pObj.ready;
      pObj.rightArrow.hidden = pObj.ready;
      pObj.card.outline.color = pObj.ready ? k.rgb(0, 255, 100) : pObj.color;
      pObj.btn.color = pObj.ready ? k.rgb(0, 50, 20) : k.rgb(24, 25, 28);
      pObj.btn.outline.color = pObj.ready ? k.rgb(0, 255, 100) : k.rgb(60, 60, 65);
      pObj.status.color = pObj.ready ? k.rgb(0, 255, 100) : k.rgb(150, 150, 155);

      if (menuState === "MAP_SELECT") {
        const mapData = MAPS[pObj.idx];
        pObj.status.text = pObj.ready ? "OYLANDI" : "OYLA";

        pObj.titleLabel = pObj.card.add([
          k.text(mapData.name, { size: 18, letterSpacing: 2 }),
          k.pos(0, -95),
          k.anchor("center"),
          k.color(pObj.ready ? k.rgb(0, 255, 100) : pObj.color),
        ]);

        pObj.previewObj = pObj.card.add([
          k.rect(140, 90, { radius: 4 }),
          k.pos(0, -10),
          k.anchor("center"),
          k.color(mapData.bgColor[0], mapData.bgColor[1], mapData.bgColor[2]),
          k.outline(1.5, k.rgb(mapData.borderColor[0], mapData.borderColor[1], mapData.borderColor[2])),
        ]);

        for (let ox = -50; ox <= 50; ox += 25) {
          for (let oy = -30; oy <= 30; oy += 20) {
            pObj.previewObj.add([
              k.circle(1),
              k.pos(ox, oy),
              k.color(mapData.gridColor[0], mapData.gridColor[1], mapData.gridColor[2]),
              k.anchor("center"),
            ]);
          }
        }

        mapData.obstacles.forEach(obs => {
          const scaleX = 140 / 1920;
          const scaleY = 90 / 1080;
          pObj.previewObj.add([
            k.rect(obs.w * scaleX, obs.h * scaleY, { radius: 1 }),
            k.pos((obs.x - 960) * scaleX, (obs.y - 540) * scaleY),
            k.color(obs.color[0], obs.color[1], obs.color[2]),
            k.anchor("center"),
          ]);
        });

        pObj.statsUiObjects.push(pObj.card.add([
          k.text(`Engel Sayisi: ${mapData.obstacles.length}`, { size: 10 }),
          k.pos(0, 65),
          k.anchor("center"),
          k.color(150, 150, 155),
        ]));
      } else {
        const type = options[pObj.idx];
        const cfg = CAR_TYPES[type];
        pObj.status.text = pObj.ready ? "HAZIR" : "ONAYLA";

        pObj.titleLabel = pObj.card.add([
          k.text(type, { size: 18, letterSpacing: 2 }),
          k.pos(0, -95),
          k.anchor("center"),
          k.color(pObj.ready ? k.rgb(0, 255, 100) : pObj.color),
        ]);

        pObj.previewObj = spawnPreview(pObj.card, type, pObj.color);

        const stats = [
          { name: "CAN", val: cfg.maxHp, max: 180, display: `${cfg.maxHp}` },
          { name: "HIZ", val: cfg.maxSpeed, max: 450, display: `${cfg.maxSpeed}` },
          { name: "KUTLE", val: cfg.mass, max: 2.0, display: `${cfg.mass.toFixed(1)}` }
        ];

        stats.forEach((s, idx) => {
          const yPos = 55 + idx * 24;
          pObj.statsUiObjects.push(pObj.card.add([
            k.text(s.name, { size: 9, letterSpacing: 1 }),
            k.pos(-95, yPos),
            k.anchor("left"),
            k.color(140, 142, 145),
          ]));

          pObj.statsUiObjects.push(pObj.card.add([
            k.rect(100, 5, { radius: 1.5 }),
            k.pos(-30, yPos),
            k.anchor("left"),
            k.color(30, 32, 36),
          ]));

          const fillWidth = 100 * (s.val / s.max);
          pObj.statsUiObjects.push(pObj.card.add([
            k.rect(fillWidth, 5, { radius: 1.5 }),
            k.pos(-30, yPos),
            k.anchor("left"),
            k.color(pObj.ready ? k.rgb(0, 255, 100) : pObj.color),
          ]));

          pObj.statsUiObjects.push(pObj.card.add([
            k.text(s.display, { size: 9 }),
            k.pos(85, yPos),
            k.anchor("left"),
            k.color(200, 202, 205),
          ]));
        });
      }
    }

    // ----------------------------------
    // AŞAMA GEÇİŞLERİ VE KURULUM
    // ----------------------------------
    function revealMapSelect() {
      menuState = "MAP_SELECT";
      stageTitle = k.add([
        k.text("HARITAYI SECIN / OYLAYIN", { size: 20, letterSpacing: 2 }),
        k.pos(k.width() / 2, 205),
        k.anchor("center"),
        k.color(255, 215, 0),
      ]);
      setupPlayers();
    }

    function revealCarSelect() {
      menuState = "CAR_SELECT";
      stageTitle = k.add([
        k.text(`HARITA: ${k.isMultiplayer ? (getState("gameMap") || "SADE") : k.selectedMapName} • MOD: ${gameMode === "NORMAL" ? "NORMAL" : "KAFA KAFAYA"}`, { size: 14, letterSpacing: 1 }),
        k.pos(k.width() / 2, 205),
        k.anchor("center"),
        k.color(255, 215, 0),
      ]);

      if (!k.isMultiplayer) {
        k.add([k.rect(2, 380), k.pos(k.width() / 2, k.height() / 2 + 50), k.anchor("center"), k.color(40, 40, 45), "vsUI"]);
        k.add([k.rect(60, 36, { radius: 2 }), k.pos(k.width() / 2, k.height() / 2 + 50), k.anchor("center"), k.color(18, 18, 20), k.outline(1, k.rgb(60, 60, 65)), "vsUI"]);
        k.add([k.text("VS", { size: 18 }), k.pos(k.width() / 2, k.height() / 2 + 50), k.anchor("center"), k.color(150, 150, 155), "vsUI"]);
      }

      setupPlayers();
    }

    function setupPlayers() {
      renderedPlayers.forEach(p => p.panel?.destroy());
      renderedPlayers = [];

      if (k.isMultiplayer) {
        const roomPlayers = playroomPlayers;
        const count = roomPlayers.length;
        roomPlayers.forEach((p, idx) => {
          let posX = k.width() / 2;
          if (count === 2) {
            posX = k.width() / 2 - 280 + idx * 560;
          } else if (count > 2) {
            const totalWidth = 1200;
            posX = (k.width() / 2 - totalWidth / 2) + idx * (totalWidth / (count - 1));
          }

          const playerColor = k.rgb(p.getProfile().color.r, p.getProfile().color.g, p.getProfile().color.b);
          const pObj = {
            playroomPlayer: p,
            id: p.id,
            name: p.getProfile().name || `Oyuncu ${idx + 1}`,
            color: playerColor,
            posX,
            idx: menuState === "MAP_SELECT" ? (p.getState("mapVoteIdx") || 0) : (p.getState("carTypeIdx") || 0),
            ready: menuState === "MAP_SELECT" ? (p.getState("mapReady") || false) : (p.getState("ready") || false),
          };
          createPlayerSelectorPanel(pObj);
          renderedPlayers.push(pObj);
        });
      } else {
        const p1Local = {
          id: 0,
          name: "Oyuncu 1",
          color: k.rgb(0, 140, 255),
          posX: k.width() / 2 - 280,
          idx: 0,
          ready: false,
          cycleKeys: ["a", "d"],
          btnKey: "space",
        };
        const p2Local = {
          id: 1,
          name: "Oyuncu 2",
          color: k.rgb(255, 60, 60),
          posX: k.width() / 2 + 280,
          idx: 0,
          ready: false,
          cycleKeys: ["left", "right"],
          btnKey: "enter",
        };
        createPlayerSelectorPanel(p1Local);
        createPlayerSelectorPanel(p2Local);
        renderedPlayers.push(p1Local, p2Local);
      }
    }

    function checkStartMapLocal() {
      if (mapSelectTransitioning) return;
      if (renderedPlayers.every(p => p.ready)) {
        mapSelectTransitioning = true;
        k.wait(0.6, () => {
          const p1Map = MAPS[renderedPlayers[0].idx].name;
          const p2Map = MAPS[renderedPlayers[1].idx].name;
          k.selectedMapName = p1Map === p2Map ? p1Map : k.choose([p1Map, p2Map]);

          stageTitle.destroy();
          revealCarSelect();
        });
      }
    }

    function checkStartCarLocal() {
      if (carSelectTransitioning) return;
      if (renderedPlayers.every(p => p.ready)) {
        carSelectTransitioning = true;
        k.wait(0.6, () => {
          handleKeys.cancel();
          k.go("game", {
            p1Type: options[renderedPlayers[0].idx],
            p2Type: options[renderedPlayers[1].idx],
            gameMode,
          });
        });
      }
    }

    // Klavye Yönlendirmeleri
    const handleKeys = k.onKeyPress((key) => {
      if (inputCooldown) return;

      if (menuState === "PLAY_TYPE_SELECT") {
        if (key === "a" || key === "left") {
          selectedPlayTypeIdx = 0;
          updatePlayTypeUI();
        } else if (key === "d" || key === "right") {
          selectedPlayTypeIdx = 1;
          updatePlayTypeUI();
        } else if (key === "space" || key === "enter") {
          confirmPlayType(selectedPlayTypeIdx);
        }
      } else if (menuState === "MODE_SELECT") {
        if (k.isMultiplayer && !isHost()) return;
        if (key === "a" || key === "left") {
          selectedModeIdx = 0;
          updateModeUIHost();
        } else if (key === "d" || key === "right") {
          selectedModeIdx = 1;
          updateModeUIHost();
        } else if (key === "space" || key === "enter") {
          confirmMode();
        }
      } else {
        if (k.isMultiplayer) {
          const meObj = renderedPlayers.find(p => p.id === myPlayer().id);
          if (meObj && !meObj.ready) {
            if (key === "a" || key === "left") handleSelectCycle(meObj, -1);
            else if (key === "d" || key === "right") handleSelectCycle(meObj, 1);
            else if (key === "space" || key === "enter") handleConfirm(meObj);
          }
        } else {
          renderedPlayers.forEach(p => {
            if (p.ready) return;
            if (key === p.cycleKeys[0]) handleSelectCycle(p, -1);
            else if (key === p.cycleKeys[1]) handleSelectCycle(p, 1);
            else if (key === p.btnKey) handleConfirm(p);
          });
        }
      }
    });

    // Durum Eşitleme ve Otomatik Başlatma Döngüsü
    k.onUpdate(() => {
      if (!k.isMultiplayer) return;

      if (isHost()) {
        setState("hostId", myPlayer().id);
      }

      if (menuState === "MODE_SELECT") {
        const syncedIdx = getState("selectedModeIdx") || 0;
        if (selectedModeIdx !== syncedIdx) {
          selectedModeIdx = syncedIdx;
          updateModeUI();
        }
        if (getState("menuState") === "MAP_SELECT") {
          menuState = "MAP_SELECT";
          gameMode = getState("gameMode") || "NORMAL";
          modeUIGroup.forEach(obj => obj.destroy());
          revealMapSelect();
        }
      } else if (menuState === "MAP_SELECT") {
        renderedPlayers.forEach(pObj => {
          const syncedIdx = pObj.playroomPlayer.getState("mapVoteIdx") || 0;
          const syncedReady = pObj.playroomPlayer.getState("mapReady") || false;
          if (pObj.idx !== syncedIdx || pObj.ready !== syncedReady) {
            pObj.idx = syncedIdx;
            pObj.ready = syncedReady;
            updatePanelUI(pObj);
          }
        });

        if (isHost()) {
          const allMapReady = playroomPlayers.every(p => p.getState("mapReady"));
          if (allMapReady && getState("menuState") !== "CAR_SELECT" && !hostMapTransitioning) {
            hostMapTransitioning = true;
            const votes = playroomPlayers.map(p => p.getState("mapVote") || "SADE");
            const voteCounts = {};
            votes.forEach(v => voteCounts[v] = (voteCounts[v] || 0) + 1);

            let maxVotes = 0, winners = [];
            for (const [name, count] of Object.entries(voteCounts)) {
              if (count > maxVotes) { maxVotes = count; winners = [name]; }
              else if (count === maxVotes) { winners.push(name); }
            }
            setState("gameMap", k.choose(winners));
            k.wait(0.6, () => setState("menuState", "CAR_SELECT"));
          }
        }

        if (getState("menuState") === "CAR_SELECT") {
          stageTitle.destroy();
          revealCarSelect();
        }
      } else if (menuState === "CAR_SELECT") {
        renderedPlayers.forEach(pObj => {
          const syncedIdx = pObj.playroomPlayer.getState("carTypeIdx") || 0;
          const syncedReady = pObj.playroomPlayer.getState("ready") || false;
          if (pObj.idx !== syncedIdx || pObj.ready !== syncedReady) {
            pObj.idx = syncedIdx;
            pObj.ready = syncedReady;
            updatePanelUI(pObj);
          }
        });

        if (isHost()) {
          const allReady = playroomPlayers.every(p => p.getState("ready"));
          if (allReady && getState("gameState") !== "playing" && !hostCarTransitioning) {
            hostCarTransitioning = true;
            k.wait(0.6, () => {
              handleKeys.cancel();
              setState("gameState", "playing");
            });
          }
        }

        if (getState("gameState") === "playing") {
          handleKeys.cancel();
          k.go("game");
        }
      }
    });
  });
}
