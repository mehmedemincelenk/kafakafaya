import { k } from "../kaplay.js";
import { isHost, getState, setState, myPlayer } from "playroomkit";
import { store } from "../store.js";
import { playroomPlayers } from "../multiplayer.js";
import { spawnExplosion } from "../utils.js";
import { syncPowerups } from "./powerup.js";
import { showGameOverMenu } from "./gameover.js";
import { MAPS } from "../maps.js";
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
    this.sceneTransitioned = false;

    // UI Elements
    this.blueScoreValEl = null;
    this.timerValEl = null;
    this.redScoreValEl = null;
    this.winnerText = null;
    this.timerBoxEl = null;
    this.suddenDeathWarningEl = null;

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

      // Dynamic colors based on cars
      const p1Color = this.cars.find(c => c.is("teamBlue") || c.is("player1"))?.originalColor || this.cars[0]?.originalColor || this.cars[0]?.color || k.rgb(255, 184, 0);
      const p2Color = this.cars.find(c => c.is("teamRed") || c.is("player2"))?.originalColor || this.cars[1]?.originalColor || this.cars[1]?.color || k.rgb(0, 230, 118);

      const p1CSSColor = `rgb(${p1Color.r}, ${p1Color.g}, ${p1Color.b})`;
      const p2CSSColor = `rgb(${p2Color.r}, ${p2Color.g}, ${p2Color.b})`;

      const blueBox = document.createElement("div");
      blueBox.className = "hud-score-box team-blue";
      blueBox.style.backgroundColor = p1CSSColor;
      blueBox.style.boxShadow = `0 0 10px rgba(${p1Color.r}, ${p1Color.g}, ${p1Color.b}, 0.45)`;
      this.blueScoreValEl = document.createElement("span");
      this.blueScoreValEl.innerText = p1Val;
      blueBox.appendChild(this.blueScoreValEl);

      const timerBox = document.createElement("div");
      timerBox.className = "hud-timer-box";
      this.timerBoxEl = timerBox;
      
      this.timerValEl = document.createElement("span");
      this.timerValEl.innerText = "01:30";
      timerBox.appendChild(this.timerValEl);

      const redBox = document.createElement("div");
      redBox.className = "hud-score-box team-red";
      redBox.style.backgroundColor = p2CSSColor;
      redBox.style.boxShadow = `0 0 10px rgba(${p2Color.r}, ${p2Color.g}, ${p2Color.b}, 0.45)`;
      this.redScoreValEl = document.createElement("span");
      this.redScoreValEl.innerText = p2Val;
      redBox.appendChild(this.redScoreValEl);

      scoreBar.appendChild(blueBox);
      scoreBar.appendChild(timerBox);
      scoreBar.appendChild(redBox);

      const modeLabel = document.createElement("div");
      modeLabel.className = "hud-mode-label";
      modeLabel.innerText = this.gameMode === "multiplayer" ? "ÇEVRİMİÇİ" : (this.p2Joined ? "OMUZ OMUZA" : "ANTRENMAN");

      this.suddenDeathWarningEl = document.createElement("div");
      this.suddenDeathWarningEl.className = "hud-sudden-death-warning";
      this.suddenDeathWarningEl.innerText = "TEHLİKE: GÜVENLİ ALAN DARALIYOR!";
      this.suddenDeathWarningEl.style.display = "none";

      scoreboard.appendChild(scoreBar);
      scoreboard.appendChild(modeLabel);
      scoreboard.appendChild(this.suddenDeathWarningEl);
      hudRoot.appendChild(scoreboard);
    }
  }

  showAnnouncement(title, subtitle, type = "draw-match", customColor = null) {
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
    if (customColor) {
      banner.style.borderTopColor = customColor;
      banner.style.borderBottomColor = customColor;
    }

    const titleEl = document.createElement("h1");
    titleEl.className = "hud-announcement-title";
    titleEl.innerText = title;
    if (customColor) {
      titleEl.style.color = customColor;
      titleEl.style.textShadow = `0 0 15px ${customColor}`;
    }
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
    if (this.sceneTransitioned) return;

    if (k.isMultiplayer) {
      this.updateMultiplayerSync();
    }

    if (this.sceneTransitioned) return;

    if (k.gameOver) return;
    // Raundun bittiğini (biri 0 HP olduğunda) milisaniyesinde algılamak için her frame kontrol ediyoruz
    this.checkGameOver();

    const controlsLocked = this.cars.some(c => c.controlsLocked);
    if (!controlsLocked && !k.isGamePaused) {
      if (k.isMultiplayer) {
        if (isHost()) {
          const lastFloor = Math.floor(this.roundTimeLeft);
          this.roundTimeLeft -= k.dt();
          if (this.roundTimeLeft <= 0) {
            this.roundTimeLeft = 0;
            this.triggerTimeOut();
          }
          const nextFloor = Math.floor(this.roundTimeLeft);
          if (lastFloor !== nextFloor) {
            setState("roundTime", nextFloor, true);
          }
        } else {
          const hostTime = getState("roundTime");
          if (hostTime !== undefined && hostTime !== null) {
            if (Math.abs(this.roundTimeLeft - hostTime) > 1.5) {
              this.roundTimeLeft = hostTime;
            } else {
              this.roundTimeLeft -= k.dt();
              if (this.roundTimeLeft <= 0) {
                this.roundTimeLeft = 0;
              }
            }
          } else {
            this.roundTimeLeft -= k.dt();
          }
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
      if (this.roundTimeLeft <= 30) {
        this.timerValEl.style.color = "rgb(255, 70, 85)";
        this.timerValEl.style.textShadow = "0 0 10px rgba(255, 70, 85, 0.8)";
        if (this.timerBoxEl) {
          this.timerBoxEl.classList.add("sudden-death");
        }
        if (this.suddenDeathWarningEl) {
          this.suddenDeathWarningEl.style.display = "block";
        }
      } else {
        this.timerValEl.style.color = "";
        this.timerValEl.style.textShadow = "";
        if (this.timerBoxEl) {
          this.timerBoxEl.classList.remove("sudden-death");
        }
        if (this.suddenDeathWarningEl) {
          this.suddenDeathWarningEl.style.display = "none";
        }
      }
    }
  }

  triggerTimeOut() {
    k.gameOver = true;
    this.cars.forEach(c => { c.speed = 0; c.controlsLocked = true; });

    if (k.isMultiplayer) {
      if (!isHost()) return;
      setState("roundWinner", null, true);
      setState("roundOver", true, true);
    } else {
      k.shake(8);
      this.showAnnouncement("SÜRE BİTTİ", "BERABERE", "draw-match");
      k.wait(2.5, () => {
        this.clearAnnouncement();
        this.pauseMenu.cancel();
        this.sceneTransitioned = true;
        k.go("game", this.getLocalReloadParams());
      });
    }
  }

  checkGameOver() {
    if (k.gameOver) return;
    if (k.isMultiplayer) {
      if (!isHost()) return;

      const blueTeam = this.cars.filter(c => c.is("teamBlue"));
      const redTeam = this.cars.filter(c => c.is("teamRed"));

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
          setState("redScore", (getState("redScore") || 0) + 1, true);
        } else {
          roundWinner = 1;
          setState("blueScore", (getState("blueScore") || 0) + 1, true);
        }

        k.shake(12);
        setState("roundWinner", roundWinner, true);
        setState("roundOver", true, true);
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

          const p1Name = this.cars[0]?.name?.toUpperCase() || "1. OYUNCU";
          const p2Name = this.cars[1]?.name?.toUpperCase() || "2. OYUNCU";

          if (this.p2Joined) {
            modeText = "OMUZ OMUZA";
            titleText = isP1Winner ? `🏆 ${p1Name} ŞAMPİYON! 🏆` : `🏆 ${p2Name} ŞAMPİYON! 🏆`;
          } else {
            modeText = "ANTRENMAN";
            titleText = isP1Winner ? `🏆 ZAFER! ${p1Name} KAZANDI 🏆` : "🛸 KKSAN_BOT ALDI GÖTÜRDÜ! 🛸";
          }

          const p1Color = this.cars[0]?.originalColor || this.cars[0]?.color || k.rgb(255, 184, 0);
          const p2Color = this.cars[1]?.originalColor || this.cars[1]?.color || k.rgb(0, 230, 118);
          const winnerColorObj = isP1Winner ? p1Color : p2Color;
          const winnerCSSColor = `rgb(${winnerColorObj.r}, ${winnerColorObj.g}, ${winnerColorObj.b})`;

          showGameOverMenu({
            titleText: titleText,
            winnerColor: winnerCSSColor,
            goldEarned: isP1Winner ? 100 : 30,
            scoreText: `${nextP1Score} - ${nextP2Score}`,
            modeText: modeText,
            onRestart: () => {
              this.pauseMenu.cancel();
              this.sceneTransitioned = true;
              k.go("game", {
                ...this.getLocalReloadParams(),
                p1Score: 0,
                p2Score: 0
              });
            },
            onChangeCar: () => {
              this.pauseMenu.cancel();
              this.sceneTransitioned = true;
              k.go("menu", {
                startState: "CAR_SELECT",
                gameMode: this.gameMode,
                p2Joined: this.p2Joined
              });
            },
            onMainMenu: () => {
              this.pauseMenu.cancel();
              this.sceneTransitioned = true;
              k.go("menu");
            }
          });
        } else {
          let title = "BERABERE";
          let winnerCSSColor = null;
          if (roundWinner === 1 || roundWinner === 2) {
            const winnerCar = this.cars[roundWinner - 1];
            const winnerName = winnerCar?.name?.toUpperCase() || (roundWinner === 1 ? "1. OYUNCU" : "2. OYUNCU");
            title = `${winnerName} RAUNDU!`;
            const winnerColorObj = winnerCar?.originalColor || winnerCar?.color;
            if (winnerColorObj) {
              winnerCSSColor = `rgb(${winnerColorObj.r}, ${winnerColorObj.g}, ${winnerColorObj.b})`;
            }
          }
          const type = roundWinner === 1 ? "blue-winner" : roundWinner === 2 ? "red-winner" : "draw-match";
          this.showAnnouncement(title, "RAUND TAMAMLANDI", type, winnerCSSColor);
          k.wait(2.5, () => {
            this.clearAnnouncement();
            this.pauseMenu.cancel();
            this.sceneTransitioned = true;
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
    if (this.sceneTransitioned) return;

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
        const myCar = this.cars.find(c => c.playerInfo && c.playerInfo.id === myPlayer()?.id);
        let goldEarned = 50;
        if (myCar) {
          const isBlueTeam = myCar.is("teamBlue");
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
        const winnerCar = this.cars.find(c => isBlueWinner ? c.is("teamBlue") : c.is("teamRed"));
        const winnerName = winnerCar?.name?.toUpperCase() || (isBlueWinner ? "1. TAKIM" : "2. TAKIM");

        const p1Color = this.cars.find(c => c.is("teamBlue"))?.originalColor || k.rgb(255, 184, 0);
        const p2Color = this.cars.find(c => c.is("teamRed"))?.originalColor || k.rgb(0, 230, 118);
        const winnerColorObj = isBlueWinner ? p1Color : p2Color;
        const winnerCSSColor = `rgb(${winnerColorObj.r}, ${winnerColorObj.g}, ${winnerColorObj.b})`;

        showGameOverMenu({
          titleText: `🏆 ${winnerName} ŞAMPİYON! 🏆`,
          winnerColor: winnerCSSColor,
          goldEarned: goldEarned,
          scoreText: `${nextBlue} - ${nextRed}`,
          modeText: "ÇOK OYUNCULU",
          onRestart: () => {
            if (isHost()) {
              this.pauseMenu.cancel();
              setState("blueScore", 0, true);
              setState("redScore", 0, true);
              setState("roundOver", false, true);
              setState("roundWinner", null, true);
              setState("isGamePaused", false, true);
              const randomMap = k.choose(MAPS);
              setState("gameMap", randomMap.name, true);
              setState("gameReloadTrigger", (getState("gameReloadTrigger") || 0) + 1, true);
            }
          },
          onChangeCar: () => {
            if (isHost()) {
              this.pauseMenu.cancel();
              setState("blueScore", 0, true);
              setState("redScore", 0, true);
              setState("roundOver", false, true);
              setState("gameState", "lobby", true);
              setState("menuState", "CAR_SELECT", true);
              playroomPlayers.forEach(p => p.setState("ready", false, true));
            }
          },
          onMainMenu: () => {
            if (isHost()) {
              this.pauseMenu.cancel();
              setState("blueScore", 0, true);
              setState("redScore", 0, true);
              setState("roundOver", false, true);
              setState("gameState", "lobby", true);
              setState("menuState", "MODE_SELECT", true);
              playroomPlayers.forEach(p => p.setState("ready", false, true));
            }
          }
        });
      } else {
        let title = "BERABERE";
        let winnerCSSColor = null;
        if (winner === 1 || winner === 2) {
          const winnerCar = this.cars.find(c => winner === 1 ? c.is("teamBlue") : c.is("teamRed"));
          const winnerName = winnerCar?.name?.toUpperCase() || (winner === 1 ? "1. TAKIM" : "2. TAKIM");
          title = `${winnerName} RAUNDU!`;
          const winnerColorObj = winnerCar?.originalColor || winnerCar?.color;
          if (winnerColorObj) {
            winnerCSSColor = `rgb(${winnerColorObj.r}, ${winnerColorObj.g}, ${winnerColorObj.b})`;
          }
        }
        const type = winner === 1 ? "blue-winner" : winner === 2 ? "red-winner" : "draw-match";
        this.showAnnouncement(title, "RAUND TAMAMLANDI", type, winnerCSSColor);

        k.wait(2.5, () => {
          this.clearAnnouncement();
          if (isHost()) {
            this.pauseMenu.cancel();
            setState("roundOver", false, true);
            setState("roundWinner", null, true);
            setState("gameReloadTrigger", (getState("gameReloadTrigger") || 0) + 1, true);
          }
        });
      }
    }

    // 5. Reload Trigger Listener
    const currentTrigger = getState("gameReloadTrigger") || 0;
    if (currentTrigger !== this.lastReloadTrigger) {
      this.lastReloadTrigger = currentTrigger;
      this.pauseMenu.cancel();
      this.sceneTransitioned = true;
      k.go("game");
      return;
    }

    // 6. Go to Menu Trigger Listener
    if (getState("gameState") === "lobby") {
      this.pauseMenu.cancel();
      this.sceneTransitioned = true;
      k.go("menu");
      return;
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
