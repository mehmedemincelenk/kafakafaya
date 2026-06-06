import { k } from "../kaplay.js";
import { isHost, getState, setState, myPlayer } from "playroomkit";
import { store } from "../store.js";
import { playroomPlayers } from "../multiplayer.js";
import { spawnExplosion } from "../utils.js";
import { syncPowerups } from "./powerup.js";
import { showGameOverMenu } from "./gameOver.js";
import "../ui/styles/hud.css";

export class MatchManager {
  constructor(params) {
    this.cars = params.cars;
    this.gameMode = params.gameMode;
    this.p1Score = params.p1Score || 0;
    this.p2Score = params.p2Score || 0;
    this.p1Type = params.p1Type;
    this.p2Type = params.p2Type;
    this.p2Joined = params.p2Joined;
    this.p1Skin = params.p1Skin;
    this.p2Skin = params.p2Skin;
    this.p1Skill = params.p1Skill;
    this.p2Skill = params.p2Skill;
    this.p1Weapon = params.p1Weapon;
    this.p2Weapon = params.p2Weapon;
    this.p1Support = params.p1Support;
    this.p2Support = params.p2Support;
    this.pauseMenu = params.pauseMenu;
    this.mapName = params.mapName;

    this.roundTimeLeft = 90;
    this.lastReloadTrigger = k.isMultiplayer ? (getState("gameReloadTrigger") || 0) : 0;
    this.roundOverProcessed = false;

    // UI Elements
    this.blueScoreValEl = null;
    this.timerValEl = null;
    this.redScoreValEl = null;
    this.winnerText = null;

    this.setupUI();
  }

  // Get local clash wins from global or custom store
  get localClashWins() {
    return window.localClashWins || 0;
  }

  setupUI() {
    const root = document.getElementById("ui-root");
    if (root) {
      // Check if gameplay-hud-root already exists, if not create it
      let hudRoot = document.getElementById("gameplay-hud-root");
      if (!hudRoot) {
        hudRoot = document.createElement("div");
        hudRoot.id = "gameplay-hud-root";
        root.appendChild(hudRoot);
      } else {
        hudRoot.innerHTML = "";
      }

      // Scoreboard Container
      const scoreboard = document.createElement("div");
      scoreboard.className = "hud-scoreboard";

      const scoreBar = document.createElement("div");
      scoreBar.className = "hud-scoreboard-bar";

      const p1Val = k.isMultiplayer ? 0 : this.p1Score;
      const p2Val = k.isMultiplayer ? 0 : this.p2Score;

      const blueBox = document.createElement("div");
      blueBox.className = "hud-score-box team-blue";
      this.blueScoreValEl = document.createElement("span");
      this.blueScoreValEl.innerText = p1Val;
      blueBox.appendChild(this.blueScoreValEl);

      const timerBox = document.createElement("div");
      timerBox.className = "hud-timer-box";
      this.timerValEl = document.createElement("span");
      this.timerValEl.innerText = "01:30";
      timerBox.appendChild(this.timerValEl);

      const redBox = document.createElement("div");
      redBox.className = "hud-score-box team-red";
      this.redScoreValEl = document.createElement("span");
      this.redScoreValEl.innerText = p2Val;
      redBox.appendChild(this.redScoreValEl);

      scoreBar.appendChild(blueBox);
      scoreBar.appendChild(timerBox);
      scoreBar.appendChild(redBox);

      const modeLabel = document.createElement("div");
      modeLabel.className = "hud-mode-label";
      modeLabel.innerText = this.gameMode === "multiplayer" ? "ÇEVRİMİÇİ" : (this.p2Joined ? "OMUZ OMUZA" : "ANTRENMAN");

      scoreboard.appendChild(scoreBar);
      scoreboard.appendChild(modeLabel);
      hudRoot.appendChild(scoreboard);
    }
  }

  showAnnouncement(title, subtitle, type = "draw-match") {
    const root = document.getElementById("ui-root");
    if (!root) return;

    let hudRoot = document.getElementById("gameplay-hud-root");
    if (!hudRoot) {
      hudRoot = document.createElement("div");
      hudRoot.id = "gameplay-hud-root";
      root.appendChild(hudRoot);
    }

    const oldContainer = document.getElementById("hud-announcement");
    if (oldContainer) oldContainer.remove();

    const container = document.createElement("div");
    container.id = "hud-announcement";
    container.className = "hud-announcement-container";

    const banner = document.createElement("div");
    banner.className = `hud-banner-strip ${type}`;

    const titleEl = document.createElement("h1");
    titleEl.className = "hud-announcement-title";
    titleEl.innerText = title;
    banner.appendChild(titleEl);

    if (subtitle) {
      const subtitleEl = document.createElement("h2");
      subtitleEl.className = "hud-announcement-subtitle";
      subtitleEl.innerText = subtitle;
      banner.appendChild(subtitleEl);
    }

    container.appendChild(banner);
    hudRoot.appendChild(container);
  }

  clearAnnouncement() {
    const container = document.getElementById("hud-announcement");
    if (container) container.remove();
  }

  showCountdown(text, isGo = false) {
    const root = document.getElementById("ui-root");
    if (!root) return;

    let hudRoot = document.getElementById("gameplay-hud-root");
    if (!hudRoot) {
      hudRoot = document.createElement("div");
      hudRoot.id = "gameplay-hud-root";
      root.appendChild(hudRoot);
    }

    const oldContainer = document.getElementById("hud-announcement");
    if (oldContainer) oldContainer.remove();

    const container = document.createElement("div");
    container.id = "hud-announcement";
    container.className = "hud-announcement-container";

    const preRoundBox = document.createElement("div");
    preRoundBox.className = `hud-pre-round ${isGo ? 'go-phase' : ''}`;

    // Big Countdown Number / BAŞLA
    const countNum = document.createElement("div");
    countNum.className = `hud-countdown ${isGo ? 'start-go' : ''}`;
    countNum.innerText = text;
    preRoundBox.appendChild(countNum);

    container.appendChild(preRoundBox);
    hudRoot.appendChild(container);
  }

  startCountdown() {
    this.cars.forEach(c => c.controlsLocked = true);

    // İlk sahne yüklenmesindeki (assets, map, vb.) kasılmaların geri sayımı atlamaması için setTimeout kullanıyoruz.
    setTimeout(() => {
      this.showCountdown("3", false);

      setTimeout(() => {
        this.showCountdown("2", false);
        setTimeout(() => {
          this.showCountdown("1", false);
          setTimeout(() => {
            this.showCountdown("BAŞLA", true);
            this.cars.forEach(c => c.controlsLocked = false);
            setTimeout(() => {
              this.clearAnnouncement();
            }, 800);
          }, 1000);
        }, 1000);
      }, 1000);
    }, 400);
  }

  update() {
    if (k.isMultiplayer) {
      this.updateMultiplayerSync();
    }

    if (k.gameOver) return;
    // Raundun bittiğini (biri 0 HP olduğunda) milisaniyesinde algılamak için her frame kontrol ediyoruz
    this.checkGameOver();

    const controlsLocked = this.cars.some(c => c.controlsLocked);
    if (!controlsLocked && !k.isGamePaused) {
      if (k.isMultiplayer) {
        if (isHost()) {
          this.roundTimeLeft -= k.dt();
          if (this.roundTimeLeft <= 0) {
            this.roundTimeLeft = 0;
            this.triggerTimeOut();
          }
          setState("roundTime", this.roundTimeLeft);
        } else {
          this.roundTimeLeft = getState("roundTime") ?? 90;
        }
      } else {
        this.roundTimeLeft -= k.dt();
        if (this.roundTimeLeft <= 0) {
          this.roundTimeLeft = 0;
          this.triggerTimeOut();
        }
      }
    }

    const mins = Math.floor(this.roundTimeLeft / 60);
    const secs = Math.floor(this.roundTimeLeft % 60);
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    if (this.timerValEl) {
      this.timerValEl.innerText = timeStr;
      if (this.roundTimeLeft <= 10) {
        this.timerValEl.style.color = "rgb(255, 70, 85)";
        this.timerValEl.style.textShadow = "0 0 8px rgba(255, 70, 85, 0.4)";
      } else {
        this.timerValEl.style.color = "";
        this.timerValEl.style.textShadow = "";
      }
    }
  }

  triggerTimeOut() {
    k.gameOver = true;
    this.cars.forEach(c => { c.speed = 0; c.controlsLocked = true; });

    if (k.isMultiplayer) {
      if (!isHost()) return;
      setState("roundWinner", null);
      setState("roundOver", true);
    } else {
      k.shake(8);
      this.showAnnouncement("SÜRE BİTTİ", "BERABERE", "draw-match");
      k.wait(2.5, () => {
        this.clearAnnouncement();
        this.pauseMenu.cancel();
        k.go("game", this.getLocalReloadParams());
      });
    }
  }

  checkGameOver() {
    if (k.gameOver) return;
    if (k.isMultiplayer) {
      if (!isHost()) return;

      const blueTeam = this.cars.filter((c, idx) => idx % 2 === 0);
      const redTeam = this.cars.filter((c, idx) => idx % 2 === 1);

      const blueAlive = blueTeam.some(c => c.hp > 0);
      const redAlive = redTeam.some(c => c.hp > 0);

      if (!blueAlive || !redAlive) {
        k.gameOver = true;
        this.cars.forEach(c => { c.speed = 0; c.controlsLocked = true; });

        let roundWinner = null;
        if (!blueAlive && !redAlive) {
          // Draw
        } else if (!blueAlive) {
          roundWinner = 2;
          setState("redScore", (getState("redScore") || 0) + 1);
        } else {
          roundWinner = 1;
          setState("blueScore", (getState("blueScore") || 0) + 1);
        }

        k.shake(12);
        setState("roundWinner", roundWinner);
        setState("roundOver", true);
      }
    } else {
      const p1 = this.cars[0];
      const p2 = this.cars[1];

      if (p1.hp <= 0 || p2.hp <= 0) {
        k.gameOver = true;
        this.cars.forEach(c => { c.speed = 0; c.controlsLocked = true; });

        let roundWinner = null;
        if (p1.hp <= 0 && p2.hp <= 0) {
          // Draw
        } else if (p1.hp <= 0) {
          roundWinner = 2;
        } else {
          roundWinner = 1;
        }

        const nextP1Score = this.p1Score + (roundWinner === 1 ? 1 : 0);
        const nextP2Score = this.p2Score + (roundWinner === 2 ? 1 : 0);

        k.shake(12);

        if (nextP1Score >= 3 || nextP2Score >= 3) {
          store.addCoins("p1", nextP1Score >= 3 ? 100 : 30);
          store.recordMatch("p1", nextP1Score >= 3 ? "win" : "loss", this.localClashWins);
          if (this.p2Joined) {
            store.addCoins("p2", nextP2Score >= 3 ? 100 : 30);
            store.recordMatch("p2", nextP2Score >= 3 ? "win" : "loss", 0);
          }

          const isP1Winner = nextP1Score >= 3;
          let titleText = "";
          let modeText = "";

          if (this.p2Joined) {
            modeText = "OMUZ OMUZA";
            titleText = isP1Winner ? "🏆 1. OYUNCU (MAVİ) ŞAMPİYON! 🏆" : "🏆 2. OYUNCU (KIRMIZI) ŞAMPİYON! 🏆";
          } else {
            modeText = "ANTRENMAN";
            titleText = isP1Winner ? "🏆 ZAFER! MAVİ KAZANDI 🏆" : "🛸 KKSAN_BOT ALDI GÖTÜRDÜ! 🛸";
          }

          showGameOverMenu({
            titleText: titleText,
            winnerColor: isP1Winner ? "blue" : "red",
            goldEarned: isP1Winner ? 100 : 30,
            scoreText: `${nextP1Score} - ${nextP2Score}`,
            modeText: modeText,
            onRestart: () => {
              this.pauseMenu.cancel();
              k.go("game", {
                ...this.getLocalReloadParams(),
                p1Score: 0,
                p2Score: 0
              });
            },
            onChangeCar: () => {
              this.pauseMenu.cancel();
              k.go("menu", {
                startState: "CAR_SELECT",
                gameMode: this.gameMode,
                p2Joined: this.p2Joined
              });
            },
            onMainMenu: () => {
              this.pauseMenu.cancel();
              k.go("menu");
            }
          });
        } else {
          const type = roundWinner === 1 ? "blue-winner" : roundWinner === 2 ? "red-winner" : "draw-match";
          const title = roundWinner === 1 ? "MAVİ RAUND!" : roundWinner === 2 ? "KIRMIZI RAUND!" : "BERABERE";
          this.showAnnouncement(title, "RAUND TAMAMLANDI", type);
          k.wait(2.5, () => {
            this.clearAnnouncement();
            this.pauseMenu.cancel();
            k.go("game", {
              ...this.getLocalReloadParams(),
              p1Score: nextP1Score,
              p2Score: nextP2Score,
            });
          });
        }
      }
    }
  }

  updateMultiplayerSync() {
    if (isHost()) {
      setState("hostId", myPlayer().id);
    }

    // 1. Sync scores
    const blueScore = getState("blueScore") || 0;
    const redScore = getState("redScore") || 0;
    if (this.blueScoreValEl) this.blueScoreValEl.innerText = blueScore;
    if (this.redScoreValEl) this.redScoreValEl.innerText = redScore;

    // Remove disconnected players
    for (let i = this.cars.length - 1; i >= 0; i--) {
      const car = this.cars[i];
      if (car.playerInfo && !playroomPlayers.some(p => p.id === car.playerInfo.id)) {
        spawnExplosion(car.pos, 20, car.color);
        car.destroy();
        this.cars.splice(i, 1);
        if (isHost()) {
          this.checkGameOver();
        }
      }
    }

    // 2. Sync powerups
    syncPowerups();

    // 3. Sync Pause
    const paused = getState("isGamePaused") || false;
    if (k.isGamePaused !== paused) {
      k.isGamePaused = paused;
      if (paused) {
        this.pauseMenu.show();
      } else {
        this.pauseMenu.hide();
      }
    }

    // 4. Manage Round Over overlay
    if (getState("roundOver") && !this.roundOverProcessed) {
      this.roundOverProcessed = true;
      k.gameOver = true;
      this.cars.forEach(c => { c.speed = 0; c.controlsLocked = true; });

      const winner = getState("roundWinner");
      const nextBlue = getState("blueScore") || 0;
      const nextRed = getState("redScore") || 0;

      if (nextBlue >= 3 || nextRed >= 3) {
        const myIndex = playroomPlayers.findIndex(p => p.id === myPlayer().id);
        let goldEarned = 50;
        if (myIndex !== -1) {
          const isBlueTeam = myIndex % 2 === 0;
          const blueWon = nextBlue >= 3;
          const redWon = nextRed >= 3;

          let matchResult = "draw";
          if ((isBlueTeam && blueWon) || (!isBlueTeam && redWon)) {
            matchResult = "win";
            goldEarned = 100;
            store.addCoins("p1", 100);
          } else if ((isBlueTeam && redWon) || (!isBlueTeam && blueWon)) {
            matchResult = "loss";
            goldEarned = 30;
            store.addCoins("p1", 30);
          } else {
            store.addCoins("p1", 50);
          }
          store.recordMatch("p1", matchResult, this.localClashWins);
        }

        const isBlueWinner = nextBlue >= 3;
        showGameOverMenu({
          titleText: isBlueWinner ? "🏆 MAVİ TAKIM ŞAMPİYON! 🏆" : "🏆 KIRMIZI TAKIM ŞAMPİYON! 🏆",
          winnerColor: isBlueWinner ? "blue" : "red",
          goldEarned: goldEarned,
          scoreText: `${nextBlue} - ${nextRed}`,
          modeText: "ÇOK OYUNCULU",
          onRestart: () => {
            if (isHost()) {
              this.pauseMenu.cancel();
              setState("blueScore", 0);
              setState("redScore", 0);
              setState("roundOver", false);
              setState("roundWinner", null);
              setState("isGamePaused", false);
              setState("gameReloadTrigger", (getState("gameReloadTrigger") || 0) + 1);
            }
          },
          onChangeCar: () => {
            if (isHost()) {
              this.pauseMenu.cancel();
              setState("blueScore", 0);
              setState("redScore", 0);
              setState("roundOver", false);
              setState("gameState", "lobby");
              setState("menuState", "CAR_SELECT");
              playroomPlayers.forEach(p => p.setState("ready", false));
            }
          },
          onMainMenu: () => {
            if (isHost()) {
              this.pauseMenu.cancel();
              setState("blueScore", 0);
              setState("redScore", 0);
              setState("roundOver", false);
              setState("gameState", "lobby");
              setState("menuState", "MODE_SELECT");
              playroomPlayers.forEach(p => p.setState("ready", false));
            }
          }
        });
      } else {
        const type = winner === 1 ? "blue-winner" : winner === 2 ? "red-winner" : "draw-match";
        const title = winner === 1 ? "MAVİ RAUND!" : winner === 2 ? "KIRMIZI RAUND!" : "BERABERE";
        this.showAnnouncement(title, "RAUND TAMAMLANDI", type);

        k.wait(2.5, () => {
          this.clearAnnouncement();
          if (isHost()) {
            this.pauseMenu.cancel();
            setState("roundOver", false);
            setState("roundWinner", null);
            setState("gameReloadTrigger", (getState("gameReloadTrigger") || 0) + 1);
          }
        });
      }
    }

    // 5. Reload Trigger Listener
    const currentTrigger = getState("gameReloadTrigger") || 0;
    if (currentTrigger !== this.lastReloadTrigger) {
      this.lastReloadTrigger = currentTrigger;
      this.pauseMenu.cancel();
      k.go("game");
    }

    // 6. Go to Menu Trigger Listener
    if (getState("gameState") === "lobby") {
      this.pauseMenu.cancel();
      k.go("menu");
    }
  }

  getLocalReloadParams() {
    return {
      gameMode: this.gameMode,
      p1Score: this.p1Score,
      p2Score: this.p2Score,
      p2Joined: this.p2Joined,
      p1Type: this.p1Type,
      p2Type: this.p2Type,
      p1Skin: this.p1Skin,
      p2Skin: this.p2Skin,
      p1Skill: this.p1Skill,
      p2Skill: this.p2Skill,
      p1Weapon: this.p1Weapon,
      p2Weapon: this.p2Weapon,
      p1Support: this.p1Support,
      p2Support: this.p2Support,
      mapName: this.mapName,
    };
  }
}
