import { k } from "../kaplay.js";
import { CAR_TYPES } from "../config.js";
import { drawCarDetails } from "../car.js";
import { MAPS } from "../maps.js";
import { insertCoin, myPlayer, isHost, setState, getState } from "playroomkit";
import { playroomPlayers, initMultiplayerListeners, isConnected } from "../multiplayer.js";

function spawnPreview(parentCard, type, color) {
  const container = parentCard.add([k.pos(0, -15), k.rotate(0), k.scale(1.5)]);
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

    // --- MODERN ARKA PLAN EFEKTLERİ ---
    // Ambient Neon Işıma Halkası (Orta kısımda yumuşak mavi/mor parıltı)
    k.add([
      k.circle(420),
      k.pos(k.width() / 2, k.height() / 2),
      k.color(0, 120, 255),
      k.opacity(0.04),
      k.anchor("center"),
      k.z(-6),
    ]);

    // Hareketli Yıldızlar/Parçacıklar (Derinlik hissi)
    const starsGroup = [];
    for (let i = 0; i < 45; i++) {
      starsGroup.push(k.add([
        k.pos(k.rand(0, k.width()), k.rand(0, k.height())),
        k.circle(k.rand(1.2, 3)),
        k.color(255, 255, 255),
        k.opacity(k.rand(0.1, 0.45)),
        k.z(-5),
        {
          speed: k.rand(8, 25),
        }
      ]));
    }
    k.onUpdate(() => {
      starsGroup.forEach(s => {
        s.pos.y += s.speed * k.dt();
        if (s.pos.y > k.height()) {
          s.pos.y = 0;
          s.pos.x = k.rand(0, k.width());
        }
      });
    });

    // --- VALHALLA DERBY BAŞLIK ---
    // Gölgeli/Glow Efektli Başlık Katmanı
    k.add([
      k.text("VALHALLA DERBY", { size: 48, font: "sans-serif", weight: "bold", letterSpacing: 4 }),
      k.pos(k.width() / 2, 110),
      k.anchor("center"),
      k.color(0, 150, 255),
      k.opacity(0.15),
    ]);
    k.add([
      k.text("VALHALLA DERBY", { size: 46, font: "sans-serif", weight: "bold", letterSpacing: 4 }),
      k.pos(k.width() / 2, 110),
      k.anchor("center"),
      k.color(255, 255, 255),
    ]);
    k.add([
      k.text("THE GAME OF BORED HEAVENLY SOLDIERS", { size: 11, font: "sans-serif", weight: "bold", letterSpacing: 6 }),
      k.pos(k.width() / 2, 160),
      k.anchor("center"),
      k.color(140, 142, 145),
      k.opacity(0.7),
    ]);

    // ----------------------------------
    // AŞAMA 0: OYNANIŞ TÜRÜ SEÇİMİ
    // ----------------------------------
    const playTypeUIGroup = [];

    const typeTitle = k.add([
      k.text("OYUN BAGLANTISINI SECIN", { size: 20, font: "sans-serif", weight: "bold", letterSpacing: 2 }),
      k.pos(k.width() / 2, k.height() / 2 - 120),
      k.anchor("center"),
      k.color(255, 215, 0),
    ]);
    playTypeUIGroup.push(typeTitle);

    function createSelectionCard(parentGroup, titleText, descText, xOffset) {
      const card = k.add([
        k.rect(360, 130, { radius: 6 }),
        k.pos(k.width() / 2 + xOffset, k.height() / 2 + 10),
        k.anchor("center"),
        k.color(20, 21, 25),
        k.outline(1.5, k.rgb(55, 58, 66)),
        k.area(),
      ]);
      const title = card.add([
        k.text(titleText, { size: 16, font: "sans-serif", weight: "bold", letterSpacing: 1.5 }),
        k.pos(0, -25),
        k.anchor("center"),
        k.color(220, 225, 235),
      ]);
      card.add([
        k.text(descText, { size: 12, font: "sans-serif", lineSpacing: 4 }),
        k.pos(0, 20),
        k.anchor("center"),
        k.color(150, 155, 165),
      ]);
      parentGroup.push(card);
      return { card, title };
    }

    const localCard = createSelectionCard(playTypeUIGroup, "YEREL OYNA", "Ayni bilgisayardan\n2 Oyuncu (Klavye paylasimi)", -200);
    const onlineCard = createSelectionCard(playTypeUIGroup, "BERABER OYNA", "Cevrimici cok oyunculu\n(Playroom Kit ile)", 200);

    const typeHelpText = k.add([
      k.text("Secmek icin Tiklayin • Onaylamak icin Tekrar Tiklayin veya SPACE/ENTER'a Basin", { size: 11, font: "sans-serif" }),
      k.pos(k.width() / 2, k.height() / 2 + 130),
      k.anchor("center"),
      k.color(140, 142, 145),
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
      
      localCard.card.color = selectedPlayTypeIdx === 0 ? k.rgb(32, 33, 40) : k.rgb(20, 21, 25);
      localCard.card.outline.color = selectedPlayTypeIdx === 0 ? activeColor : k.rgb(55, 58, 66);
      localCard.card.outline.width = selectedPlayTypeIdx === 0 ? 2.0 : 1.5;
      localCard.title.color = selectedPlayTypeIdx === 0 ? activeColor : k.rgb(220, 225, 235);

      onlineCard.card.color = selectedPlayTypeIdx === 1 ? k.rgb(32, 33, 40) : k.rgb(20, 21, 25);
      onlineCard.card.outline.color = selectedPlayTypeIdx === 1 ? activeColor : k.rgb(55, 58, 66);
      onlineCard.card.outline.width = selectedPlayTypeIdx === 1 ? 2.0 : 1.5;
      onlineCard.title.color = selectedPlayTypeIdx === 1 ? activeColor : k.rgb(220, 225, 235);
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
        k.text(k.isMultiplayer ? "O N L I N E" : "Y E R E L", { size: 18, font: "sans-serif", weight: "bold", letterSpacing: 4 }),
        k.pos(k.width() / 2, 165),
        k.anchor("center"),
        k.color(k.isMultiplayer ? k.rgb(255, 60, 60) : k.rgb(0, 140, 255)),
      ]);

      const modeTitle = k.add([
        k.text(k.isMultiplayer ? "OYUN MODUNU SECIN (Sadece Kurucu)" : "OYUN MODUNU SECIN", { size: 20, font: "sans-serif", weight: "bold", letterSpacing: 2 }),
        k.pos(k.width() / 2, k.height() / 2 - 120),
        k.anchor("center"),
        k.color(255, 215, 0),
      ]);
      modeUIGroup.push(modeTitle);

      norm = createSelectionCard(modeUIGroup, "CENNET KAOSU", "Farkli araclar secilebilir\nMomentum ve asimetrik fizik odaklidir", -200);
      clash = createSelectionCard(modeUIGroup, "ILAHI DUELLO", "Oyuncular ayni araci kullanir\nKafa kafaya carpismalar duello tetikler", 200);

      const modeHelpText = k.add([
        k.text((k.isMultiplayer && !isHost()) ? "Kurucunun mod secmesi bekleniyor..." : "Secmek icin Tiklayin • Onaylamak icin Tekrar Tiklayin veya SPACE/ENTER'a Basin", { size: 11, font: "sans-serif" }),
        k.pos(k.width() / 2, k.height() / 2 + 130),
        k.anchor("center"),
        k.color(140, 142, 145),
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

      norm.card.color = selectedModeIdx === 0 ? k.rgb(32, 33, 40) : k.rgb(20, 21, 25);
      norm.card.outline.color = selectedModeIdx === 0 ? activeColor : k.rgb(55, 58, 66);
      norm.card.outline.width = selectedModeIdx === 0 ? 2.0 : 1.5;
      norm.title.color = selectedModeIdx === 0 ? activeColor : k.rgb(220, 225, 235);

      clash.card.color = selectedModeIdx === 1 ? k.rgb(32, 33, 40) : k.rgb(20, 21, 25);
      clash.card.outline.color = selectedModeIdx === 1 ? activeColor : k.rgb(55, 58, 66);
      clash.card.outline.width = selectedModeIdx === 1 ? 2.0 : 1.5;
      clash.title.color = selectedModeIdx === 1 ? activeColor : k.rgb(220, 225, 235);
    }

    // ----------------------------------
    // DİNAMİK OYUNCU PANEL BİLEŞENİ
    // ----------------------------------
    function createPlayerSelectorPanel(pObj) {
      pObj.panel = k.add([
        k.rect(300, 460, { radius: 12 }),
        k.pos(pObj.posX, k.height() / 2 + 50),
        k.anchor("center"),
        k.color(10, 11, 14),
        k.outline(2.5, pObj.color),
      ]);

      pObj.panel.add([k.text(pObj.name, { size: 20 }), k.pos(0, -180), k.anchor("center"), k.color(pObj.color)]);

      pObj.card = pObj.panel.add([
        k.rect(260, 260, { radius: 10 }),
        k.pos(0, -10),
        k.anchor("center"),
        k.color(18, 19, 23),
        k.outline(1.5, k.rgb(40, 40, 45)),
      ]);

      // Modern Buton Görünümlü Oklar
      pObj.leftArrowBg = pObj.card.add([
        k.rect(32, 32, { radius: 8 }),
        k.pos(-105, -10),
        k.anchor("center"),
        k.color(24, 25, 30),
        k.outline(1.5, k.rgb(55, 55, 60)),
        k.area(),
      ]);
      pObj.leftArrow = pObj.leftArrowBg.add([
        k.text("<", { size: 14 }),
        k.anchor("center"),
        k.color(150, 150, 155),
      ]);
      pObj.leftArrowBg.onClick(() => handleSelectCycle(pObj, -1));

      pObj.rightArrowBg = pObj.card.add([
        k.rect(32, 32, { radius: 8 }),
        k.pos(105, -10),
        k.anchor("center"),
        k.color(24, 25, 30),
        k.outline(1.5, k.rgb(55, 55, 60)),
        k.area(),
      ]);
      pObj.rightArrow = pObj.rightArrowBg.add([
        k.text(">", { size: 14 }),
        k.anchor("center"),
        k.color(150, 150, 155),
      ]);
      pObj.rightArrowBg.onClick(() => handleSelectCycle(pObj, 1));

      pObj.btn = pObj.panel.add([
        k.rect(220, 45, { radius: 10 }),
        k.pos(0, 195),
        k.anchor("center"),
        k.color(24, 25, 28),
        k.outline(1.5, k.rgb(60, 60, 65)),
        k.scale(1.0),
        k.area()
      ]);
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

      pObj.leftArrowBg.hidden = pObj.ready;
      pObj.rightArrowBg.hidden = pObj.ready;
      pObj.card.outline.color = pObj.ready ? k.rgb(0, 255, 100) : pObj.color;
      pObj.card.outline.width = pObj.ready ? 4 : 3;
      pObj.btn.color = pObj.ready ? k.rgb(0, 80, 40) : k.rgb(24, 25, 28);
      pObj.btn.outline.color = pObj.ready ? k.rgb(0, 255, 100) : k.rgb(0, 0, 0);
      pObj.status.color = pObj.ready ? k.rgb(0, 255, 100) : k.rgb(220, 225, 235);
      pObj.btn.scaleTo(pObj.ready ? 1.05 : 1.0);

      if (menuState === "MAP_SELECT") {
        const mapData = MAPS[pObj.idx];
        pObj.status.text = pObj.ready ? "OYLANDI" : "OYLA";

        pObj.titleLabel = pObj.card.add([
          k.text(mapData.name, { size: 20, font: "sans-serif", weight: "bold", letterSpacing: 2 }),
          k.pos(0, -110),
          k.anchor("center"),
          k.color(pObj.ready ? k.rgb(0, 255, 100) : pObj.color),
        ]);

        pObj.previewObj = pObj.card.add([
          k.rect(180, 110, { radius: 6 }),
          k.pos(0, -15),
          k.anchor("center"),
          k.color(mapData.bgColor[0], mapData.bgColor[1], mapData.bgColor[2]),
          k.outline(3, k.rgb(0, 0, 0)),
        ]);

        for (let ox = -70; ox <= 70; ox += 35) {
          for (let oy = -40; oy <= 40; oy += 25) {
            pObj.previewObj.add([
              k.circle(1.5),
              k.pos(ox, oy),
              k.color(mapData.gridColor[0], mapData.gridColor[1], mapData.gridColor[2]),
              k.anchor("center"),
            ]);
          }
        }

        mapData.obstacles.forEach(obs => {
          const scaleX = 180 / 1920;
          const scaleY = 110 / 1080;
          pObj.previewObj.add([
            k.rect(obs.w * scaleX, obs.h * scaleY, { radius: 2 }),
            k.pos((obs.x - 960) * scaleX, (obs.y - 540) * scaleY),
            k.color(obs.color[0], obs.color[1], obs.color[2]),
            k.outline(1.5, k.rgb(0, 0, 0)),
            k.anchor("center"),
          ]);
        });

        pObj.statsUiObjects.push(pObj.card.add([
          k.text(`Engel Sayisi: ${mapData.obstacles.length}`, { size: 12, font: "sans-serif" }),
          k.pos(0, 80),
          k.anchor("center"),
          k.color(150, 155, 165),
        ]));
      } else {
        const type = options[pObj.idx];
        const cfg = CAR_TYPES[type];
        pObj.status.text = pObj.ready ? "HAZIR" : "ONAYLA";

        pObj.titleLabel = pObj.card.add([
          k.text(type, { size: 20, font: "sans-serif", weight: "bold", letterSpacing: 2 }),
          k.pos(0, -110),
          k.anchor("center"),
          k.color(pObj.ready ? k.rgb(0, 255, 100) : pObj.color),
        ]);

        pObj.previewObj = spawnPreview(pObj.card, type, pObj.color);

        const stats = [
          { name: "CAN", val: cfg.maxHp, max: 180, display: `${cfg.maxHp}` },
          { name: "HIZ", val: cfg.maxSpeed, max: 450, display: `${cfg.maxSpeed}` },
          { name: "KUTLE", val: cfg.mass, max: 2.5, display: `${cfg.mass.toFixed(1)}` }
        ];

        stats.forEach((s, idx) => {
          const yPos = 65 + idx * 24;
          pObj.statsUiObjects.push(pObj.card.add([
            k.text(s.name, { size: 10, font: "sans-serif", weight: "bold", letterSpacing: 1 }),
            k.pos(-110, yPos),
            k.anchor("left"),
            k.color(150, 155, 165),
          ]));

          pObj.statsUiObjects.push(pObj.card.add([
            k.rect(120, 7, { radius: 2 }),
            k.pos(-40, yPos),
            k.anchor("left"),
            k.color(24, 25, 28),
            k.outline(1.5, k.rgb(0, 0, 0)),
          ]));

          const fillWidth = 120 * (s.val / s.max);
          pObj.statsUiObjects.push(pObj.card.add([
            k.rect(fillWidth, 7, { radius: 2 }),
            k.pos(-40, yPos),
            k.anchor("left"),
            k.color(pObj.ready ? k.rgb(0, 255, 100) : pObj.color),
          ]));

          pObj.statsUiObjects.push(pObj.card.add([
            k.text(s.display, { size: 10, font: "sans-serif", weight: "bold" }),
            k.pos(95, yPos),
            k.anchor("left"),
            k.color(220, 225, 235),
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
        k.text("HARITAYI SECIN / OYLAYIN", { size: 24, font: "sans-serif", weight: "bold", letterSpacing: 2 }),
        k.pos(k.width() / 2, 205),
        k.anchor("center"),
        k.color(255, 215, 0),
      ]);
      setupPlayers();
    }

    function revealCarSelect() {
      menuState = "CAR_SELECT";
      stageTitle = k.add([
        k.text(`HARITA: ${k.isMultiplayer ? (getState("gameMap") || "SADE") : k.selectedMapName} • MOD: ${gameMode === "NORMAL" ? "CENNET KAOSU" : "ILAHI DUELLO"}`, { size: 16, font: "sans-serif", weight: "bold", letterSpacing: 1 }),
        k.pos(k.width() / 2, 205),
        k.anchor("center"),
        k.color(255, 215, 0),
      ]);

      if (!k.isMultiplayer) {
        k.add([k.rect(4, 420), k.pos(k.width() / 2, k.height() / 2 + 50), k.anchor("center"), k.color(0, 0, 0), "vsUI"]);
        k.add([k.rect(70, 44, { radius: 10 }), k.pos(k.width() / 2, k.height() / 2 + 50), k.anchor("center"), k.color(20, 22, 28), k.outline(3, k.rgb(0, 0, 0)), "vsUI"]);
        k.add([k.text("VS", { size: 20, font: "sans-serif", weight: "bold" }), k.pos(k.width() / 2, k.height() / 2 + 50), k.anchor("center"), k.color(150, 150, 155), "vsUI"]);
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
