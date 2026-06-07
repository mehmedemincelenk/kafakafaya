import { createNavButton } from "../../components.js";

function generateRandomRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function confirmLobbyChoice(idx) {
  if (this.state.inputCooldown) return;
  this.triggerCooldown();

  if (idx === 0) {
    this.state.menuState = "MULTIPLAYER_CUSTOM_HOST";
    this.state.selectedCustomHostIdx = 0;
    this.state.customHostCode = generateRandomRoomCode();
    this.updateView();
  } else if (idx === 1) {
    this.state.menuState = "MULTIPLAYER_JOIN";
    this.state.selectedJoinIdx = 0;
    this.state.joinRoomCode = "";
    this.updateView();
  } else if (idx === 2) {
    this.state.menuState = "PLAY_TYPE_SELECT";
    this.state.selectedPlayTypeIdx = 2;
    this.updateView();
  }
}

export function confirmCustomHostChoice(idx) {
  if (this.state.inputCooldown) return;
  this.triggerCooldown();

  if (idx === 0) {
    this.state.selectedCustomHostIdx = 1;
    this.updateView();
  } else if (idx === 1) {
    const val = (this.state.customHostCode || "").trim();
    if (val) {
      this.connectPlayroom(val);
    } else {
      this.state.selectedCustomHostIdx = 0;
      this.updateView();
    }
  } else if (idx === 2) {
    this.state.menuState = "MULTIPLAYER_LOBBY_SELECT";
    this.state.selectedLobbyIdx = 0;
    this.updateView();
  }
}

export function confirmJoinChoice(idx) {
  if (this.state.inputCooldown) return;
  this.triggerCooldown();

  if (idx === 0) {
    this.state.selectedJoinIdx = 1;
    this.updateView();
  } else if (idx === 1) {
    const val = (this.state.joinRoomCode || "").trim();
    if (val) {
      this.connectPlayroom(val);
    } else {
      this.state.selectedJoinIdx = 0;
      this.updateView();
    }
  } else if (idx === 2) {
    this.state.menuState = "MULTIPLAYER_LOBBY_SELECT";
    this.state.selectedLobbyIdx = 1;
    this.updateView();
  }
}

export function renderMultiplayerLobbySelect() {
  const navContainer = document.createElement("div");
  navContainer.className = "menu-nav-list";

  const createBtn = createNavButton({
    text: "ODA OLUŞTUR",
    active: this.state.selectedLobbyIdx === 0,
    onClick: () => {
      if (this.state.inputCooldown) return;
      this.state.selectedLobbyIdx = 0;
      this.state.menuState = "MULTIPLAYER_CUSTOM_HOST";
      this.state.selectedCustomHostIdx = 0;
      this.state.customHostCode = generateRandomRoomCode();
      this.updateView();
    }
  });

  const joinBtn = createNavButton({
    text: "ODAYA KATIL",
    active: this.state.selectedLobbyIdx === 1,
    onClick: () => {
      if (this.state.inputCooldown) return;
      this.state.selectedLobbyIdx = 1;
      this.state.menuState = "MULTIPLAYER_JOIN";
      this.state.selectedJoinIdx = 0;
      this.state.joinRoomCode = "";
      this.updateView();
    }
  });

  const backBtn = createNavButton({
    text: "GERİ",
    active: this.state.selectedLobbyIdx === 2,
    onClick: () => {
      if (this.state.inputCooldown) return;
      this.state.selectedLobbyIdx = 2;
      this.state.menuState = "PLAY_TYPE_SELECT";
      this.state.selectedPlayTypeIdx = 2;
      this.updateView();
    }
  });

  navContainer.appendChild(createBtn);
  navContainer.appendChild(joinBtn);
  navContainer.appendChild(backBtn);

  this.contentArea.appendChild(navContainer);
  this.helpText.innerText = "SEÇİM: W-S / YÖN TUŞLARI • ONAY: ENTER / SPACE";
}

export function renderMultiplayerCustomHost() {
  const container = document.createElement("div");
  container.className = "menu-nav-list";
  container.style.width = "360px";
  container.style.margin = "0 auto";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.gap = "14px";

  const styleTag = document.createElement("style");
  styleTag.innerHTML = `
    .lobby-input-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
      width: 100%;
    }
    .lobby-input-label {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 2px;
      color: rgba(255, 255, 255, 0.4);
      text-transform: uppercase;
    }
    .lobby-input-field {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #fff;
      font-family: inherit;
      font-size: 14px;
      padding: 10px 14px;
      border-radius: 4px;
      transition: all 0.2s ease;
      outline: none;
      width: 100%;
      box-sizing: border-box;
    }
    .lobby-input-field:focus {
      background: rgba(255, 255, 255, 0.05);
      border-color: #ffb800;
      box-shadow: 0 0 10px rgba(255, 184, 0, 0.4);
    }
    .lobby-input-field::placeholder {
      color: rgba(255, 255, 255, 0.25);
      font-size: 13px;
    }
    .lobby-btn-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 10px;
      width: 100%;
    }
  `;
  container.appendChild(styleTag);

  const inputGroup = document.createElement("div");
  inputGroup.className = "lobby-input-group";

  const labelRow = document.createElement("div");
  labelRow.style.display = "flex";
  labelRow.style.justifyContent = "space-between";
  labelRow.style.alignItems = "center";
  labelRow.style.width = "100%";

  const label = document.createElement("div");
  label.className = "lobby-input-label";
  label.innerText = "ODA KODU";
  labelRow.appendChild(label);

  const randomBtn = document.createElement("span");
  randomBtn.style.color = "rgba(255, 255, 255, 0.5)";
  randomBtn.style.fontSize = "9px";
  randomBtn.style.cursor = "pointer";
  randomBtn.style.border = "1px solid rgba(255, 255, 255, 0.2)";
  randomBtn.style.padding = "2px 6px";
  randomBtn.style.borderRadius = "3px";
  randomBtn.style.fontWeight = "800";
  randomBtn.style.letterSpacing = "1px";
  randomBtn.style.transition = "all 0.2s ease";
  randomBtn.innerText = "RASTGELE";
  randomBtn.addEventListener("click", () => {
    this.state.customHostCode = generateRandomRoomCode();
    input.value = this.state.customHostCode;
    input.focus();
  });
  randomBtn.addEventListener("mouseenter", () => {
    randomBtn.style.background = "rgba(255, 255, 255, 0.1)";
    randomBtn.style.color = "#fff";
    randomBtn.style.borderColor = "rgba(255, 255, 255, 0.5)";
  });
  randomBtn.addEventListener("mouseleave", () => {
    randomBtn.style.background = "transparent";
    randomBtn.style.color = "rgba(255, 255, 255, 0.5)";
    randomBtn.style.borderColor = "rgba(255, 255, 255, 0.2)";
  });
  labelRow.appendChild(randomBtn);
  inputGroup.appendChild(labelRow);

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "KOD GİRİN (örn: HAFIZLAR)";
  input.maxLength = 15;
  input.className = "lobby-input-field";
  input.value = this.state.customHostCode || "";
  input.addEventListener("input", (e) => {
    this.state.customHostCode = e.target.value.toUpperCase();
  });
  inputGroup.appendChild(input);
  container.appendChild(inputGroup);

  const btnGroup = document.createElement("div");
  btnGroup.className = "lobby-btn-group";

  const hostBtn = createNavButton({
    text: "ODA OLUŞTUR AND BAĞLAN",
    active: this.state.selectedCustomHostIdx === 1,
    onClick: () => {
      const val = (this.state.customHostCode || "").trim();
      if (val) {
        this.connectPlayroom(val);
      } else {
        input.focus();
      }
    }
  });

  const backBtn = createNavButton({
    text: "GERİ",
    active: this.state.selectedCustomHostIdx === 2,
    onClick: () => {
      this.state.menuState = "MULTIPLAYER_LOBBY_SELECT";
      this.state.selectedLobbyIdx = 0;
      this.updateView();
    }
  });

  btnGroup.appendChild(hostBtn);
  btnGroup.appendChild(backBtn);
  container.appendChild(btnGroup);

  this.contentArea.appendChild(container);

  if (this.state.selectedCustomHostIdx === 0) {
    setTimeout(() => input.focus(), 0);
  } else {
    input.blur();
  }

  this.helpText.innerText = "SEÇİM: W-S / YÖN TUŞLARI • ONAY: ENTER";
}

export function renderMultiplayerJoin() {
  const container = document.createElement("div");
  container.className = "menu-nav-list";
  container.style.width = "360px";
  container.style.margin = "0 auto";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.gap = "14px";

  const styleTag = document.createElement("style");
  styleTag.innerHTML = `
    .lobby-input-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
      width: 100%;
    }
    .lobby-input-label {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 2px;
      color: rgba(255, 255, 255, 0.4);
      text-transform: uppercase;
    }
    .lobby-input-field {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #fff;
      font-family: inherit;
      font-size: 14px;
      padding: 10px 14px;
      border-radius: 4px;
      transition: all 0.2s ease;
      outline: none;
      width: 100%;
      box-sizing: border-box;
    }
    .lobby-input-field:focus {
      background: rgba(255, 255, 255, 0.05);
      border-color: #00f0ff;
      box-shadow: 0 0 10px rgba(0, 240, 255, 0.4);
    }
    .lobby-input-field::placeholder {
      color: rgba(255, 255, 255, 0.25);
      font-size: 13px;
    }
    .lobby-btn-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 10px;
      width: 100%;
    }
  `;
  container.appendChild(styleTag);

  const inputGroup = document.createElement("div");
  inputGroup.className = "lobby-input-group";

  const label = document.createElement("div");
  label.className = "lobby-input-label";
  label.innerText = "BAĞLANILACAK ODA KODU";
  inputGroup.appendChild(label);

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "ODA KODU GİRİN VEYA YAPIŞTIRIN";
  input.maxLength = 25;
  input.className = "lobby-input-field";
  input.value = this.state.joinRoomCode || "";
  input.addEventListener("input", (e) => {
    let val = e.target.value.toUpperCase();
    const urlMatch = val.match(/[#?&]R=([^&]+)/);
    if (urlMatch) {
      val = urlMatch[1];
    } else if (val.startsWith("HTTP://") || val.startsWith("HTTPS://")) {
      const parts = val.split("/");
      const last = parts[parts.length - 1].trim();
      if (last) {
        val = last;
      }
    }
    this.state.joinRoomCode = val;
    e.target.value = val;
  });
  inputGroup.appendChild(input);
  container.appendChild(inputGroup);

  const btnGroup = document.createElement("div");
  btnGroup.className = "lobby-btn-group";

  const joinBtn = createNavButton({
    text: "ODAYA KATIL VE BAĞLAN",
    active: this.state.selectedJoinIdx === 1,
    onClick: () => {
      const val = (this.state.joinRoomCode || "").trim();
      if (val) {
        this.connectPlayroom(val);
      } else {
        input.focus();
      }
    }
  });

  const backBtn = createNavButton({
    text: "GERİ",
    active: this.state.selectedJoinIdx === 2,
    onClick: () => {
      this.state.menuState = "MULTIPLAYER_LOBBY_SELECT";
      this.state.selectedLobbyIdx = 1;
      this.updateView();
    }
  });

  btnGroup.appendChild(joinBtn);
  btnGroup.appendChild(backBtn);
  container.appendChild(btnGroup);

  this.contentArea.appendChild(container);

  if (this.state.selectedJoinIdx === 0) {
    setTimeout(() => input.focus(), 0);
  } else {
    input.blur();
  }

  this.helpText.innerText = "SEÇİM: W-S / YÖN TUŞLARI • ONAY: ENTER";
}
