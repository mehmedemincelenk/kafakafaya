import { k } from "../../../kaplay.js";
import { createNavButton } from "../../components.js";

export function renderSettings() {
  const navContainer = document.createElement("div");
  navContainer.className = "menu-nav-list";

  let raw = localStorage.getItem("kafakafaya_settings");
  let settings = raw ? JSON.parse(raw) : { screenShake: true, sfx: true, showFps: false };

  const shakeBtn = createNavButton({
    text: `EKRAN SARSINTISI: ${settings.screenShake ? "AÇIK" : "KAPALI"}`,
    active: this.state.selectedSettingIdx === 0,
    onClick: () => {
      if (this.state.inputCooldown) return;
      this.state.selectedSettingIdx = 0;
      this.confirmSettingChoice(0);
    }
  });

  const sfxBtn = createNavButton({
    text: `SES & EFEKTLER: ${settings.sfx ? "AÇIK" : "KAPALI"}`,
    active: this.state.selectedSettingIdx === 1,
    onClick: () => {
      if (this.state.inputCooldown) return;
      this.state.selectedSettingIdx = 1;
      this.confirmSettingChoice(1);
    }
  });

  const fpsBtn = createNavButton({
    text: `FPS GÖSTERGESİ: ${settings.showFps ? "AÇIK" : "KAPALI"}`,
    active: this.state.selectedSettingIdx === 2,
    onClick: () => {
      if (this.state.inputCooldown) return;
      this.state.selectedSettingIdx = 2;
      this.confirmSettingChoice(2);
    }
  });

  const backBtn = createNavButton({
    text: "GERİ DÖN",
    active: this.state.selectedSettingIdx === 3,
    className: "nav-back",
    onClick: () => {
      if (this.state.inputCooldown) return;
      this.state.selectedSettingIdx = 3;
      this.confirmSettingChoice(3);
    }
  });

  navContainer.appendChild(shakeBtn);
  navContainer.appendChild(sfxBtn);
  navContainer.appendChild(fpsBtn);
  navContainer.appendChild(backBtn);
  this.contentArea.appendChild(navContainer);

  this.helpText.innerText = "";
}

export function confirmSettingChoice(choice) {
  this.triggerCooldown();
  let raw = localStorage.getItem("kafakafaya_settings");
  let settings = raw ? JSON.parse(raw) : { screenShake: true, sfx: true, showFps: false };

  if (choice === 0) {
    settings.screenShake = !settings.screenShake;
    localStorage.setItem("kafakafaya_settings", JSON.stringify(settings));
    this.updateView();
  } else if (choice === 1) {
    settings.sfx = !settings.sfx;
    localStorage.setItem("kafakafaya_settings", JSON.stringify(settings));
    k.volume(settings.sfx ? 1 : 0);
    this.updateView();
  } else if (choice === 2) {
    settings.showFps = !settings.showFps;
    localStorage.setItem("kafakafaya_settings", JSON.stringify(settings));
    this.updateView();
  } else if (choice === 3) {
    this.state.menuState = "PLAY_TYPE_SELECT";
    this.state.selectedPlayTypeIdx = 3;
    this.updateView();
  }
}
