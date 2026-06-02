import { k } from "../kaplay.js";
import { CAR_TYPES } from "../config.js";
import { drawCarDetails } from "../car.js";

export function initMenuScene() {
  k.scene("menu", () => {
    const options = ["DENGELI", "HIZLI", "HIPHIZLI", "GUCLU", "TANK", "DRIFT"];
    let gameMode = "NORMAL";
    let menuState = "MODE_SELECT"; // "MODE_SELECT" | "CAR_SELECT"
    let inputCooldown = false;

    function triggerCooldown() {
      inputCooldown = true;
      k.wait(0.2, () => inputCooldown = false);
    }

    // Başlıklar
    k.add([
      k.text("KAFA KAFAYA", { size: 64, letterSpacing: 6 }),
      k.pos(k.width() / 2, 110),
      k.anchor("center"),
      k.color(255, 255, 255),
    ]);

    k.add([
      k.text("D Ü E L L O", { size: 18, letterSpacing: 4 }),
      k.pos(k.width() / 2, 165),
      k.anchor("center"),
      k.color(255, 60, 60),
    ]);

    // ----------------------------------
    // AŞAMA 1: OYUN MODU VE MAP SEÇİMİ (GENEL KART OLUŞTURUCU)
    // ----------------------------------
    function createSelectionCard(parentGroup, titleText, descText, xOffset) {
      const card = k.add([
        k.rect(340, 100, { radius: 6 }),
        k.pos(k.width() / 2 + xOffset, k.height() / 2 + 10),
        k.anchor("center"),
        k.color(18, 19, 23),
        k.outline(1.5, k.rgb(40, 40, 45)),
        k.area(),
      ]);
      const title = card.add([
        k.text(titleText, { size: 16, letterSpacing: 1 }),
        k.pos(0, -20),
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

    // MOD SEÇİMİ
    const modeUIGroup = [];
    let selectedModeIdx = 0;

    const modeTitle = k.add([
      k.text("OYUN MODUNU SEÇİN", { size: 20, letterSpacing: 2 }),
      k.pos(k.width() / 2, k.height() / 2 - 100),
      k.anchor("center"),
      k.color(255, 215, 0),
    ]);
    modeUIGroup.push(modeTitle);

    const norm = createSelectionCard(modeUIGroup, "NORMAL MOD", "Farklı araçlar seçilebilir\nMomentum ve asimetrik fizik odaklıdır", -180);
    const clash = createSelectionCard(modeUIGroup, "KAFA KAFAYA MODU", "Oyuncular aynı aracı kullanır\nKafa kafaya çarpışmalar düello tetikler", 180);

    const modeHelpText = k.add([
      k.text("Seçmek için Tıklayın • Onaylamak için Tekrar Tıklayın veya SPACE/ENTER'a Basın", { size: 11 }),
      k.pos(k.width() / 2, k.height() / 2 + 120),
      k.anchor("center"),
      k.color(150, 150, 155),
    ]);
    modeUIGroup.push(modeHelpText);

    norm.card.onClick(() => {
      if (inputCooldown) return;
      selectedModeIdx === 0 ? confirmMode() : (selectedModeIdx = 0, updateModeUI());
    });
    clash.card.onClick(() => {
      if (inputCooldown) return;
      selectedModeIdx === 1 ? confirmMode() : (selectedModeIdx = 1, updateModeUI());
    });

    function confirmMode() {
      if (inputCooldown) return;
      triggerCooldown();
      gameMode = selectedModeIdx === 0 ? "NORMAL" : "KAFA_KAFAYA";
      menuState = "CAR_SELECT";
      modeUIGroup.forEach(obj => obj.destroy());
      revealCarSelect();
    }

    function updateModeUI() {
      const activeColor = selectedModeIdx === 0 ? k.rgb(0, 140, 255) : k.rgb(255, 60, 60);
      norm.card.outline.color = selectedModeIdx === 0 ? activeColor : k.rgb(40, 40, 45);
      norm.card.outline.width = selectedModeIdx === 0 ? 2 : 1.5;
      norm.title.color = selectedModeIdx === 0 ? activeColor : k.rgb(255, 255, 255);

      clash.card.outline.color = selectedModeIdx === 1 ? activeColor : k.rgb(40, 40, 45);
      clash.card.outline.width = selectedModeIdx === 1 ? 2 : 1.5;
      clash.title.color = selectedModeIdx === 1 ? activeColor : k.rgb(255, 255, 255);
    }

    updateModeUI();

    // ----------------------------------
    // AŞAMA 2: ARAÇ SEÇİM ARAYÜZÜ (DRY DİNAMİK YAPILANDIRMA)
    // ----------------------------------
    const players = [
      {
        id: 0,
        name: "OYUNCU 1",
        color: k.rgb(0, 140, 255),
        posX: k.width() / 2 - 280,
        idx: 0,
        ready: false,
        btnKey: "space",
        cycleKeys: ["w", "a", "s", "d"],
        statsUiObjects: [],
      },
      {
        id: 1,
        name: "OYUNCU 2",
        color: k.rgb(255, 60, 60),
        posX: k.width() / 2 + 280,
        idx: 0,
        ready: false,
        btnKey: "enter",
        cycleKeys: ["up", "left", "down", "right"],
        statsUiObjects: [],
      }
    ];

    function spawnPreview(parent, type, color) {
      const cfg = CAR_TYPES[type] || CAR_TYPES.DENGELI;
      const container = parent.add([k.pos(0, -10), k.anchor("center")]);

      // Gövdeyi çiz
      container.add([k.rect(cfg.width, cfg.height, { radius: cfg.radius }), k.color(color), k.anchor("center")]);

      // Geri kalan detayları (tekerlek, far, spoyler vb.) ortak fonksiyondan çek
      drawCarDetails(container, type, color);

      return container;
    }

    function revealCarSelect() {
      k.add([
        k.text(`MOD: ${gameMode === "NORMAL" ? "NORMAL MOD" : "KAFA KAFAYA MODU"}`, { size: 14, letterSpacing: 1 }),
        k.pos(k.width() / 2, 205),
        k.anchor("center"),
        k.color(gameMode === "NORMAL" ? k.rgb(180, 180, 185) : k.rgb(255, 215, 0)),
      ]);

      k.add([k.rect(2, 380), k.pos(k.width() / 2, k.height() / 2 + 50), k.anchor("center"), k.color(40, 40, 45)]);
      k.add([k.rect(60, 36, { radius: 2 }), k.pos(k.width() / 2, k.height() / 2 + 50), k.anchor("center"), k.color(18, 18, 20), k.outline(1, k.rgb(60, 60, 65))]);
      k.add([k.text("VS", { size: 18 }), k.pos(k.width() / 2, k.height() / 2 + 50), k.anchor("center"), k.color(150, 150, 155)]);

      players.forEach(p => {
        p.panel = k.add([
          k.rect(380, 460, { radius: 4 }),
          k.pos(p.posX, k.height() / 2 + 50),
          k.anchor("center"),
          k.color(14, 15, 18),
          k.outline(1, p.color),
        ]);

        p.panel.add([k.text(p.name, { size: 24 }), k.pos(0, -180), k.anchor("center"), k.color(p.color)]);

        p.card = p.panel.add([
          k.rect(320, 260, { radius: 6 }),
          k.pos(0, -10),
          k.anchor("center"),
          k.color(18, 19, 23),
          k.outline(1.5, k.rgb(40, 40, 45)),
        ]);

        p.leftArrow = p.card.add([k.text("<", { size: 18 }), k.pos(-125, -10), k.anchor("center"), k.color(100, 100, 105), k.area()]);
        p.leftArrow.onClick(() => { if (!p.ready) { p.idx = (p.idx - 1 + options.length) % options.length; updatePlayerUI(p); } });

        p.rightArrow = p.card.add([k.text(">", { size: 18 }), k.pos(125, -10), k.anchor("center"), k.color(100, 100, 105), k.area()]);
        p.rightArrow.onClick(() => { if (!p.ready) { p.idx = (p.idx + 1) % options.length; updatePlayerUI(p); } });

        p.btn = p.panel.add([k.rect(260, 40, { radius: 4 }), k.pos(0, 195), k.anchor("center"), k.color(24, 25, 28), k.outline(1, k.rgb(60, 60, 65)), k.area()]);
        p.status = p.btn.add([k.text("ONAYLA", { size: 14 }), k.anchor("center"), k.color(150, 150, 155)]);

        // Minimalist Kontrol Kılavuzu Notu
        p.panel.add([
          k.text(p.id === 0 ? "Seçim: W-A-S-D • Onay: SPACE" : "Seçim: YÖN TUŞLARI • Onay: ENTER", { size: 10, letterSpacing: 0.5 }),
          k.pos(0, 150),
          k.anchor("center"),
          k.color(120, 122, 125)
        ]);

        p.btn.onClick(() => {
          if (p.ready) return;
          p.ready = true;
          updatePlayerUI(p);
          checkStart();
        });
      });

      updateMenuUI();
    }

    function updatePlayerUI(p) {
      if (p.preview) p.preview.destroy();
      if (p.titleLabel) p.titleLabel.destroy();
      if (p.statsUiObjects) {
        p.statsUiObjects.forEach(obj => obj.destroy());
      }
      p.statsUiObjects = [];

      const type = options[p.idx];
      const cfg = CAR_TYPES[type];

      // Kart Başlığı
      p.titleLabel = p.card.add([
        k.text(type, { size: 20, letterSpacing: 2 }),
        k.pos(0, -95),
        k.anchor("center"),
        k.color(p.ready ? k.rgb(0, 255, 100) : p.color),
      ]);

      // Canlı Önizleme
      p.preview = spawnPreview(p.card, type, p.color);

      // Yüksek Kaliteli Geometrik Gösterge Barları (HUD Progress Bars)
      const stats = [
        { name: "CAN", val: cfg.maxHp, max: 180, display: `${cfg.maxHp}` },
        { name: "HIZ", val: cfg.maxSpeed, max: 450, display: `${cfg.maxSpeed}` },
        { name: "KÜTLE", val: cfg.mass, max: 2.0, display: `${cfg.mass.toFixed(1)}` }
      ];

      stats.forEach((s, idx) => {
        const yPos = 55 + idx * 24;

        // Stat Adı
        p.statsUiObjects.push(p.card.add([
          k.text(s.name, { size: 10, letterSpacing: 1 }),
          k.pos(-110, yPos),
          k.anchor("left"),
          k.color(140, 142, 145),
        ]));

        // HUD Arka Plan Çubuğu
        p.statsUiObjects.push(p.card.add([
          k.rect(130, 5, { radius: 1.5 }),
          k.pos(-40, yPos),
          k.anchor("left"),
          k.color(30, 32, 36),
        ]));

        // HUD Dolu Çubuk (Oyuncu Renginde veya Hazırsa Yeşil)
        const fillWidth = 130 * (s.val / s.max);
        p.statsUiObjects.push(p.card.add([
          k.rect(fillWidth, 5, { radius: 1.5 }),
          k.pos(-40, yPos),
          k.anchor("left"),
          k.color(p.ready ? k.rgb(0, 255, 100) : p.color),
        ]));

        // Sayısal Değer
        p.statsUiObjects.push(p.card.add([
          k.text(s.display, { size: 10 }),
          k.pos(105, yPos),
          k.anchor("left"),
          k.color(200, 202, 205),
        ]));
      });

      p.leftArrow.hidden = p.ready;
      p.rightArrow.hidden = p.ready;

      p.card.outline.color = p.ready ? k.rgb(0, 255, 100) : p.color;
      p.btn.color = p.ready ? k.rgb(0, 50, 20) : k.rgb(24, 25, 28);
      p.btn.outline.color = p.ready ? k.rgb(0, 255, 100) : k.rgb(60, 60, 65);
      p.status.text = p.ready ? "HAZIR" : "ONAYLA";
      p.status.color = p.ready ? k.rgb(0, 255, 100) : k.rgb(150, 150, 155);
    }

    function updateMenuUI() {
      players.forEach(p => updatePlayerUI(p));
    }

    // Klavye Dinleyicileri
    const handleKeys = k.onKeyPress((key) => {
      if (inputCooldown) return;
      if (menuState === "MODE_SELECT") {
        if (key === "a" || key === "left") {
          selectedModeIdx = 0;
          updateModeUI();
        } else if (key === "d" || key === "right") {
          selectedModeIdx = 1;
          updateModeUI();
        } else if (key === "space" || key === "enter") {
          confirmMode();
        }
      } else if (menuState === "CAR_SELECT") {
        players.forEach(p => {
          if (p.ready) return;
          if (key === p.cycleKeys[0] || key === p.cycleKeys[1]) {
            p.idx = (p.idx - 1 + options.length) % options.length;
            updatePlayerUI(p);
          } else if (key === p.cycleKeys[2] || key === p.cycleKeys[3]) {
            p.idx = (p.idx + 1) % options.length;
            updatePlayerUI(p);
          } else if (key === p.btnKey) {
            p.ready = true;
            updatePlayerUI(p);
            checkStart();
          }
        });
      }
    });

    function checkStart() {
      if (players.every(p => p.ready)) {
        k.wait(0.6, () => {
          handleKeys.cancel();
          k.go("game", {
            p1Type: options[players[0].idx],
            p2Type: options[players[1].idx],
            gameMode,
          });
        });
      }
    }
  });
}
