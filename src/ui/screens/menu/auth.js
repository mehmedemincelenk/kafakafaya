import { store } from "../../../store.js";
import { getTurkishGuestName } from "../../../utils.js";
import { createNavButton } from "../../components.js";

export function updateAuthFocus() {
  if (this.state.menuState !== "AUTH") return;

  const p1Input = this.contentArea.querySelector(".p1-input");
  const p2Input = this.contentArea.querySelector(".p2-input");
  const buttons = this.contentArea.querySelectorAll(".menu-nav-item");

  // Remove active class from all buttons
  buttons.forEach(btn => btn.classList.remove("active"));

  // Set focus or active button highlight
  if (this.state.selectedAuthIdx === 0) {
    if (p1Input && document.activeElement !== p1Input) {
      p1Input.focus();
      p1Input.setSelectionRange(p1Input.value.length, p1Input.value.length);
    }
  } else if (this.state.selectedAuthIdx === 1 && this.state.showP2Input) {
    if (p2Input && document.activeElement !== p2Input) {
      p2Input.focus();
      p2Input.setSelectionRange(p2Input.value.length, p2Input.value.length);
    }
  } else {
    // It's a button. Blur inputs so focus styling is removed.
    if (document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA")) {
      document.activeElement.blur();
    }

    // Highlight the active button matching the index
    if (this.state.showP2Input) {
      if (this.state.selectedAuthIdx === 2) {
        const btn = buttons[0]; // remove button
        if (btn) btn.classList.add("active");
      } else if (this.state.selectedAuthIdx === 3) {
        const btn = buttons[1]; // submit button
        if (btn) btn.classList.add("active");
      }
    } else {
      if (this.state.selectedAuthIdx === 1) {
        const btn = buttons[0]; // add button
        if (btn) btn.classList.add("active");
      } else if (this.state.selectedAuthIdx === 2) {
        const btn = buttons[1]; // submit button
        if (btn) btn.classList.add("active");
      }
    }
  }
}

export function renderAuth() {
  const container = document.createElement("div");
  container.className = "menu-nav-list";
  container.style.width = "320px";
  container.style.margin = "0 auto";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.gap = "16px";

  // Dynamic focus & styling rule block
  const styleTag = document.createElement("style");
  styleTag.innerHTML = `
    .menu-auth-input {
      border: 1px solid rgba(255, 255, 255, 0.15) !important;
      outline: none !important;
    }
    .menu-auth-input:focus {
      border-color: var(--active-neon, #00f0ff) !important;
      box-shadow: 0 0 8px rgba(0, 240, 255, 0.2) !important;
    }
    .btn-secondary-auth {
      border-left: none !important;
      padding-left: 16px !important;
      padding-right: 16px !important;
      transition: all 0.15s ease !important;
      color: rgba(255, 255, 255, 0.4) !important;
      font-size: 11px !important;
      letter-spacing: 2px !important;
      font-weight: 800 !important;
    }
    .btn-secondary-auth:hover:not(:disabled) {
      color: rgba(255, 255, 255, 0.8) !important;
      border-left-color: transparent !important;
      padding-left: 16px !important;
      padding-right: 16px !important;
      text-shadow: none !important;
    }
    .btn-secondary-auth.active:not(:disabled) {
      color: #ffffff !important;
      border-color: rgba(255, 255, 255, 0.4) !important;
      border-left-color: transparent !important;
      padding-left: 16px !important;
      padding-right: 16px !important;
      text-shadow: none !important;
    }
  `;
  container.appendChild(styleTag);

  // P1 Username & Password Inputs
  const p1Wrapper = document.createElement("div");
  p1Wrapper.style.display = "flex";
  p1Wrapper.style.flexDirection = "column";
  p1Wrapper.style.gap = "6px";
  p1Wrapper.style.textAlign = "left";

  const p1Label = document.createElement("label");
  p1Label.style.fontSize = "10px";
  p1Label.style.fontWeight = "800";
  p1Label.style.letterSpacing = "2px";
  p1Label.style.color = "var(--text-muted, #888888)";
  p1Label.innerText = "1. OYNAYAN KULLANICI ADI VE ŞİFRE";
  p1Wrapper.appendChild(p1Label);

  const p1Row = document.createElement("div");
  p1Row.style.display = "flex";
  p1Row.style.gap = "8px";

  const p1Input = document.createElement("input");
  p1Input.type = "text";
  p1Input.className = "menu-auth-input p1-input";
  p1Input.placeholder = "Kullanıcı Adı";
  p1Input.style.flex = "1";
  p1Input.style.padding = "12px 16px";
  p1Input.style.background = "#111111";
  p1Input.style.borderRadius = "2px";
  p1Input.style.color = "#ffffff";
  p1Input.style.fontFamily = "inherit";
  p1Input.style.fontSize = "14px";
  p1Input.style.fontWeight = "600";
  p1Input.style.boxSizing = "border-box";
  p1Input.style.transition = "all 0.15s ease";

  p1Input.onfocus = () => {
    this.state.selectedAuthIdx = 0;
    const buttons = this.contentArea.querySelectorAll(".menu-nav-item");
    buttons.forEach(b => b.classList.remove("active"));
  };
  p1Input.value = this.state.tempUsername || "";
  p1Input.oninput = (e) => {
    this.state.tempUsername = e.target.value;
    if (this.state.authError) {
      this.state.authError = "";
      const errEl = container.querySelector(".auth-error-msg");
      if (errEl) errEl.remove();
    }
  };

  const p1PassInput = document.createElement("input");
  p1PassInput.type = "password";
  p1PassInput.className = "menu-auth-input p1-pass-input";
  p1PassInput.placeholder = "Şifre";
  p1PassInput.style.width = "110px";
  p1PassInput.style.padding = "12px 16px";
  p1PassInput.style.background = "#111111";
  p1PassInput.style.borderRadius = "2px";
  p1PassInput.style.color = "#ffffff";
  p1PassInput.style.fontFamily = "inherit";
  p1PassInput.style.fontSize = "14px";
  p1PassInput.style.fontWeight = "600";
  p1PassInput.style.boxSizing = "border-box";
  p1PassInput.style.transition = "all 0.15s ease";

  p1PassInput.onfocus = () => {
    this.state.selectedAuthIdx = 0;
    const buttons = this.contentArea.querySelectorAll(".menu-nav-item");
    buttons.forEach(b => b.classList.remove("active"));
  };
  p1PassInput.value = this.state.tempPassword || "";
  p1PassInput.oninput = (e) => {
    this.state.tempPassword = e.target.value;
    if (this.state.authError) {
      this.state.authError = "";
      const errEl = container.querySelector(".auth-error-msg");
      if (errEl) errEl.remove();
    }
  };

  p1Row.appendChild(p1Input);
  p1Row.appendChild(p1PassInput);
  p1Wrapper.appendChild(p1Row);
  container.appendChild(p1Wrapper);

  // Optional P2 field
  if (this.state.showP2Input) {
    const p2Wrapper = document.createElement("div");
    p2Wrapper.style.display = "flex";
    p2Wrapper.style.flexDirection = "column";
    p2Wrapper.style.gap = "6px";
    p2Wrapper.style.textAlign = "left";

    const p2Label = document.createElement("label");
    p2Label.style.fontSize = "10px";
    p2Label.style.fontWeight = "800";
    p2Label.style.letterSpacing = "2px";
    p2Label.style.color = "var(--text-muted, #888888)";
    p2Label.innerText = "2. OYNAYAN KULLANICI ADI VE ŞİFRE";
    p2Wrapper.appendChild(p2Label);

    const p2InputRow = document.createElement("div");
    p2InputRow.style.display = "flex";
    p2InputRow.style.alignItems = "stretch";
    p2InputRow.style.gap = "8px";

    const p2Input = document.createElement("input");
    p2Input.type = "text";
    p2Input.className = "menu-auth-input p2-input";
    p2Input.placeholder = "Kullanıcı Adı";
    p2Input.style.flex = "1";
    p2Input.style.padding = "12px 16px";
    p2Input.style.background = "#111111";
    p2Input.style.borderRadius = "2px";
    p2Input.style.color = "#ffffff";
    p2Input.style.fontFamily = "inherit";
    p2Input.style.fontSize = "14px";
    p2Input.style.fontWeight = "600";
    p2Input.style.boxSizing = "border-box";
    p2Input.style.transition = "all 0.15s ease";

    p2Input.onfocus = () => {
      this.state.selectedAuthIdx = 1;
      const buttons = this.contentArea.querySelectorAll(".menu-nav-item");
      buttons.forEach(b => b.classList.remove("active"));
    };
    p2Input.value = this.state.tempUsernameP2 || "";
    p2Input.oninput = (e) => {
      this.state.tempUsernameP2 = e.target.value;
      if (this.state.authError) {
        this.state.authError = "";
        const errEl = container.querySelector(".auth-error-msg");
        if (errEl) errEl.remove();
      }
    };
    p2InputRow.appendChild(p2Input);

    const p2PassInput = document.createElement("input");
    p2PassInput.type = "password";
    p2PassInput.className = "menu-auth-input p2-pass-input";
    p2PassInput.placeholder = "Şifre";
    p2PassInput.style.width = "110px";
    p2PassInput.style.padding = "12px 16px";
    p2PassInput.style.background = "#111111";
    p2PassInput.style.borderRadius = "2px";
    p2PassInput.style.color = "#ffffff";
    p2PassInput.style.fontFamily = "inherit";
    p2PassInput.style.fontSize = "14px";
    p2PassInput.style.fontWeight = "600";
    p2PassInput.style.boxSizing = "border-box";
    p2PassInput.style.transition = "all 0.15s ease";

    p2PassInput.onfocus = () => {
      this.state.selectedAuthIdx = 1;
      const buttons = this.contentArea.querySelectorAll(".menu-nav-item");
      buttons.forEach(b => b.classList.remove("active"));
    };
    p2PassInput.value = this.state.tempPasswordP2 || "";
    p2PassInput.oninput = (e) => {
      this.state.tempPasswordP2 = e.target.value;
      if (this.state.authError) {
        this.state.authError = "";
        const errEl = container.querySelector(".auth-error-msg");
        if (errEl) errEl.remove();
      }
    };
    p2InputRow.appendChild(p2PassInput);

    // Remove P2 button
    const removeP2Btn = createNavButton({
      text: "✕",
      active: this.state.selectedAuthIdx === 2,
      className: "btn-secondary-auth",
      onClick: () => {
        this.state.showP2Input = false;
        this.state.tempUsernameP2 = "";
        this.state.tempPasswordP2 = "";
        this.state.selectedAuthIdx = 0;
        this.state.authError = "";
        this.updateView();
      }
    });
    removeP2Btn.style.setProperty("background", "none", "important");
    removeP2Btn.style.setProperty("border", "none", "important");
    removeP2Btn.style.setProperty("padding", "0 12px", "important");
    removeP2Btn.style.display = "flex";
    removeP2Btn.style.alignItems = "center";
    removeP2Btn.style.justifyContent = "center";

    p2InputRow.appendChild(removeP2Btn);
    p2Wrapper.appendChild(p2InputRow);
    container.appendChild(p2Wrapper);
  } else {
    // Add P2 button
    const addP2Btn = createNavButton({
      text: "➕ 2. OYNAYAN EKLE",
      active: this.state.selectedAuthIdx === 1,
      className: "btn-secondary-auth",
      onClick: () => {
        this.state.showP2Input = true;
        this.state.selectedAuthIdx = 1;
        this.state.authError = "";
        this.updateView();
      }
    });
    addP2Btn.style.fontSize = "11px";
    container.appendChild(addP2Btn);
  }

  // Inline Error Message
  if (this.state.authError) {
    const errorMsg = document.createElement("div");
    errorMsg.className = "auth-error-msg";
    errorMsg.style.fontSize = "11px";
    errorMsg.style.fontWeight = "800";
    errorMsg.style.letterSpacing = "1px";
    errorMsg.style.color = "#ff4655";
    errorMsg.style.textAlign = "center";
    errorMsg.style.marginTop = "8px";
    errorMsg.style.lineHeight = "1.4";
    errorMsg.innerText = this.state.authError.toUpperCase();
    container.appendChild(errorMsg);
  }

  // Submit Button
  const submitIdx = this.state.showP2Input ? 3 : 2;
  const submitBtn = createNavButton({
    text: "TAMAM",
    active: this.state.selectedAuthIdx === submitIdx,
    onClick: () => {
      this.confirmAuthChoice(submitIdx);
    }
  });
  submitBtn.style.marginTop = "8px";
  container.appendChild(submitBtn);

  this.contentArea.appendChild(container);

  // Auto-focus current input only if it isn't already focused to prevent loop
  if (this.state.selectedAuthIdx === 0) {
    setTimeout(() => {
      const input = this.contentArea.querySelector(".p1-input");
      if (input && document.activeElement !== input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }, 0);
  } else if (this.state.selectedAuthIdx === 1 && this.state.showP2Input) {
    setTimeout(() => {
      const input = this.contentArea.querySelector(".p2-input");
      if (input && document.activeElement !== input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }, 0);
  }

  this.helpText.innerText = "";
}

export async function confirmAuthChoice(choice) {
  if (this.state.inputCooldown) return;
  this.triggerCooldown();

  const p1Val = (this.state.tempUsername || "").trim();
  const p1Pass = (this.state.tempPassword || "").trim();
  if (!p1Val || p1Val.length < 3) {
    this.state.authError = "1. Oynayan kullanıcı adı en az 3 karakter olmalıdır!";
    this.updateView();
    return;
  }
  if (!p1Pass || p1Pass.length < 3) {
    this.state.authError = "1. Oynayan şifresi en az 3 karakter olmalıdır!";
    this.updateView();
    return;
  }

  // Connect Player 1
  let p1Res = await store.usernameLogin(p1Val, p1Pass);
  if (!p1Res.success) {
    this.state.authError = `1. Oynayan Bağlantı Hatası: ${p1Res.error}`;
    this.updateView();
    return;
  }

  // Connect Player 2 if active and filled
  if (this.state.showP2Input) {
    const p2Val = (this.state.tempUsernameP2 || "").trim();
    const p2Pass = (this.state.tempPasswordP2 || "").trim();
    if (p2Val || p2Pass) {
      if (!p2Val || p2Val.length < 3) {
        this.state.authError = "2. Oynayan kullanıcı adı en az 3 karakter olmalıdır!";
        this.updateView();
        return;
      }
      if (!p2Pass || p2Pass.length < 3) {
        this.state.authError = "2. Oynayan şifresi en az 3 karakter olmalıdır!";
        this.updateView();
        return;
      }

      let p2Res = await store.usernameLogin(p2Val, p2Pass, "p2");
      if (!p2Res.success) {
        this.state.authError = `2. Oynayan Bağlantı Hatası: ${p2Res.error}`;
        this.updateView();
        return;
      }
    }
  }

  // Clear error on successful login
  this.state.authError = "";

  // Proceed to Main Menu
  this.state.menuState = "PLAY_TYPE_SELECT";
  this.state.selectedPlayTypeIdx = 0;
  this.updateView();
}

export function handleAuthKey(key) {
  const maxIdx = this.state.showP2Input ? 4 : 3;
  if (this.state.selectedAuthIdx === undefined || this.state.selectedAuthIdx >= maxIdx) {
    this.state.selectedAuthIdx = 0;
  }

  if (key === "w" || key === "ArrowUp") {
    this.state.selectedAuthIdx = (this.state.selectedAuthIdx - 1 + maxIdx) % maxIdx;
    this.updateAuthFocus();
  } else if (key === "s" || key === "ArrowDown") {
    this.state.selectedAuthIdx = (this.state.selectedAuthIdx + 1) % maxIdx;
    this.updateAuthFocus();
  } else if (key === " " || key === "Enter") {
    if (this.state.selectedAuthIdx === 0) {
      if (key === "Enter") {
        const submitIdx = this.state.showP2Input ? 3 : 2;
        this.confirmAuthChoice(submitIdx);
      }
    } else if (this.state.selectedAuthIdx === 1) {
      if (this.state.showP2Input) {
        if (key === "Enter") {
          const submitIdx = this.state.showP2Input ? 3 : 2;
          this.confirmAuthChoice(submitIdx);
        }
      } else {
        this.state.showP2Input = true;
        this.state.selectedAuthIdx = 1;
        this.updateView();
      }
    } else if (this.state.selectedAuthIdx === 2) {
      if (this.state.showP2Input) {
        this.state.showP2Input = false;
        this.state.tempUsernameP2 = "";
        this.state.selectedAuthIdx = 0;
        this.updateView();
      } else {
        this.confirmAuthChoice(2);
      }
    } else if (this.state.selectedAuthIdx === 3) {
      this.confirmAuthChoice(3);
    }
  } else if (key === "Escape") {
    if (this.state.prevMenuState === "SETTINGS") {
      this.triggerCooldown();
      this.state.menuState = "SETTINGS";
      this.state.selectedSettingIdx = 3;
      this.updateView();
    }
  }
}

