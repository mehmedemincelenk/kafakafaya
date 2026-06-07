import { store } from "../../../store.js";
import { createNavButton } from "../../components.js";

export function renderSuggestVehicle() {
  const container = document.createElement("div");
  container.className = "menu-nav-list";
  container.style.width = "360px";
  container.style.margin = "0 auto";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.gap = "14px";

  const styleTag = document.createElement("style");
  styleTag.innerHTML = `
    .suggest-input-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
      width: 100%;
    }
    .suggest-input-label {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 2px;
      color: rgba(255, 255, 255, 0.4);
      text-transform: uppercase;
    }
    .suggest-input-field {
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
    .suggest-input-field:focus {
      background: rgba(255, 255, 255, 0.05);
    }
    .name-input:focus {
      border-color: #00f0ff;
      box-shadow: 0 0 10px rgba(0, 240, 255, 0.4);
    }
    .skill-input:focus {
      border-color: #ff4655;
      box-shadow: 0 0 10px rgba(255, 70, 85, 0.4);
    }
    .problem-input:focus {
      border-color: #ffb800;
      box-shadow: 0 0 10px rgba(255, 184, 0, 0.4);
    }
    .design-input:focus {
      border-color: #bd5dff;
      box-shadow: 0 0 10px rgba(189, 93, 255, 0.4);
    }
    .contact-input:focus {
      border-color: #00e676;
      box-shadow: 0 0 10px rgba(0, 230, 118, 0.4);
    }
    .suggest-input-field::placeholder {
      color: rgba(255, 255, 255, 0.25);
      font-size: 13px;
    }
    .suggest-btn-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 10px;
      width: 100%;
    }
    .btn-secondary-suggest {
      border-left: none !important;
      padding-left: 16px !important;
      padding-right: 16px !important;
      transition: all 0.15s ease !important;
      color: rgba(255, 255, 255, 0.4) !important;
      font-size: 11px !important;
      letter-spacing: 2px !important;
      font-weight: 800 !important;
    }
    .btn-secondary-suggest:hover:not(:disabled) {
      color: rgba(255, 255, 255, 0.8) !important;
      border-left-color: transparent !important;
      padding-left: 16px !important;
      padding-right: 16px !important;
      text-shadow: none !important;
    }
    .btn-secondary-suggest.active:not(:disabled) {
      color: #ffffff !important;
      border-color: rgba(255, 255, 255, 0.4) !important;
      border-left-color: transparent !important;
      padding-left: 16px !important;
      padding-right: 16px !important;
      text-shadow: none !important;
    }
  `;
  container.appendChild(styleTag);

  if (!this.state.suggestData) {
    this.state.suggestData = {
      vehicleName: "",
      skillDescription: "",
      solvedProblem: "",
      designDescription: "",
      contactInfo: ""
    };
  }

  // Input 1: Sistem/Araç Adı
  const nameGroup = document.createElement("div");
  nameGroup.className = "suggest-input-group";
  const nameLabel = document.createElement("div");
  nameLabel.className = "suggest-input-label";
  nameLabel.innerText = "İNSANSIZ SİSTEM / SİLAH ADI *";
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "suggest-input-field name-input";
  nameInput.placeholder = "Örn: Ejder (İHA), Kasırga (Füze), Köstebek (Yeraltı)...";
  nameInput.value = this.state.suggestData.vehicleName;
  nameInput.oninput = (e) => {
    this.state.suggestData.vehicleName = e.target.value;
  };
  nameInput.onfocus = () => {
    this.state.selectedSuggestIdx = 0;
    this.updateSuggestFocus();
  };
  nameGroup.appendChild(nameLabel);
  nameGroup.appendChild(nameInput);
  container.appendChild(nameGroup);

  // Input 2: Özel Yeteneği
  const skillGroup = document.createElement("div");
  skillGroup.className = "suggest-input-group";
  const skillLabel = document.createElement("div");
  skillLabel.className = "suggest-input-label";
  skillLabel.innerText = "ÖZEL YETENEĞİ VEYA ETKİSİ *";
  const skillInput = document.createElement("input");
  skillInput.type = "text";
  skillInput.className = "suggest-input-field skill-input";
  skillInput.placeholder = "Örn: Kalkan açar, uzaydan lazer fırlatır, yer altından sızar...";
  skillInput.value = this.state.suggestData.skillDescription;
  skillInput.oninput = (e) => {
    this.state.suggestData.skillDescription = e.target.value;
  };
  skillInput.onfocus = () => {
    this.state.selectedSuggestIdx = 1;
    this.updateSuggestFocus();
  };
  skillGroup.appendChild(skillLabel);
  skillGroup.appendChild(skillInput);
  container.appendChild(skillGroup);

  // Input 3: Hangi Problemi Çözüyor
  const problemGroup = document.createElement("div");
  problemGroup.className = "suggest-input-group";
  const problemLabel = document.createElement("div");
  problemLabel.className = "suggest-input-label";
  problemLabel.innerText = "HANGİ PROBLEMİ ÇÖZÜYOR? (İSTEĞE BAĞLI)";
  const problemInput = document.createElement("input");
  problemInput.type = "text";
  problemInput.className = "suggest-input-field problem-input";
  problemInput.placeholder = "Örn: Havadaki İHA'ları vurur, görünmezleri açığa çıkarır...";
  problemInput.value = this.state.suggestData.solvedProblem || "";
  problemInput.oninput = (e) => {
    this.state.suggestData.solvedProblem = e.target.value;
  };
  problemInput.onfocus = () => {
    this.state.selectedSuggestIdx = 2;
    this.updateSuggestFocus();
  };
  problemGroup.appendChild(problemLabel);
  problemGroup.appendChild(problemInput);
  container.appendChild(problemGroup);

  // Input 4: Görünüm & Tasarım
  const designGroup = document.createElement("div");
  designGroup.className = "suggest-input-group";
  const designLabel = document.createElement("div");
  designLabel.className = "suggest-input-label";
  designLabel.innerText = "TASARIMI & GÖRÜNÜMÜ (İSTEĞE BAĞLI)";
  const designInput = document.createElement("input");
  designInput.type = "text";
  designInput.className = "suggest-input-field design-input";
  designInput.placeholder = "Örn: Roket gövdesi, delici matkap ucu, fütüristik İHA tasarımı...";
  designInput.value = this.state.suggestData.designDescription;
  designInput.oninput = (e) => {
    this.state.suggestData.designDescription = e.target.value;
  };
  designInput.onfocus = () => {
    this.state.selectedSuggestIdx = 3;
    this.updateSuggestFocus();
  };
  designGroup.appendChild(designLabel);
  designGroup.appendChild(designInput);
  container.appendChild(designGroup);

  // Input 5: İletişim
  const contactGroup = document.createElement("div");
  contactGroup.className = "suggest-input-group";
  const contactLabel = document.createElement("div");
  contactLabel.className = "suggest-input-label";
  contactLabel.innerText = "İLETİŞİM BİLGİSİ (İSTEĞE BAĞLI)";
  const contactInput = document.createElement("input");
  contactInput.type = "text";
  contactInput.className = "suggest-input-field contact-input";
  contactInput.placeholder = "E-posta, Instagram veya Telefon...";
  contactInput.value = this.state.suggestData.contactInfo;
  contactInput.oninput = (e) => {
    this.state.suggestData.contactInfo = e.target.value;
  };
  contactInput.onfocus = () => {
    this.state.selectedSuggestIdx = 4;
    this.updateSuggestFocus();
  };
  contactGroup.appendChild(contactLabel);
  contactGroup.appendChild(contactInput);
  container.appendChild(contactGroup);

  // Button Group
  const btnGroup = document.createElement("div");
  btnGroup.className = "suggest-btn-group";

  const submitBtn = createNavButton({
    text: "GÖNDER BAKALIM",
    active: this.state.selectedSuggestIdx === 5,
    onClick: () => {
      if (this.state.inputCooldown) return;
      this.confirmSuggestChoice(5);
    }
  });
  submitBtn.style.fontSize = "18px";
  submitBtn.style.paddingLeft = "16px";

  const backBtn = createNavButton({
    text: "GERİ DÖN",
    active: this.state.selectedSuggestIdx === 6,
    className: "btn-secondary-suggest",
    onClick: () => {
      if (this.state.inputCooldown) return;
      this.confirmSuggestChoice(6);
    }
  });
  backBtn.style.marginTop = "6px";

  btnGroup.appendChild(submitBtn);
  btnGroup.appendChild(backBtn);
  container.appendChild(btnGroup);

  this.contentArea.appendChild(container);
  this.updateSuggestFocus();
}

export function updateSuggestFocus() {
  if (this.state.menuState !== "SUGGEST_VEHICLE") return;

  const fields = [
    this.contentArea.querySelector(".name-input"),
    this.contentArea.querySelector(".skill-input"),
    this.contentArea.querySelector(".problem-input"),
    this.contentArea.querySelector(".design-input"),
    this.contentArea.querySelector(".contact-input")
  ];
  const buttons = this.contentArea.querySelectorAll(".menu-nav-item");

  buttons.forEach(btn => btn.classList.remove("active"));

  const idx = this.state.selectedSuggestIdx || 0;
  if (idx >= 0 && idx <= 4) {
    const field = fields[idx];
    if (field) {
      if (document.activeElement !== field) {
        field.focus();
      }
      field.setSelectionRange(field.value.length, field.value.length);
    }
  } else {
    if (document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA")) {
      document.activeElement.blur();
    }

    const btnIdx = idx - 5;
    if (buttons[btnIdx]) {
      buttons[btnIdx].classList.add("active");
    }
  }
}

export async function confirmSuggestChoice(choice) {
  this.triggerCooldown();

  if (choice === 5) {
    const data = this.state.suggestData || {};
    if (!data.vehicleName || !data.vehicleName.trim()) {
      const input = this.contentArea.querySelector(".name-input");
      if (input) {
        input.classList.add("shake-error");
        setTimeout(() => input.classList.remove("shake-error"), 350);
      }
      return;
    }
    if (!data.skillDescription || !data.skillDescription.trim()) {
      const input = this.contentArea.querySelector(".skill-input");
      if (input) {
        input.classList.add("shake-error");
        setTimeout(() => input.classList.remove("shake-error"), 350);
      }
      return;
    }

    const success = await store.saveVehicleIdea({
      vehicleName: data.vehicleName.trim(),
      skillName: "Genel Yetenek",
      skillDescription: data.skillDescription.trim(),
      solvedProblem: data.solvedProblem ? data.solvedProblem.trim() : "",
      designDescription: data.designDescription ? data.designDescription.trim() : "",
      contactInfo: data.contactInfo ? data.contactInfo.trim() : ""
    });

    if (success) {
      this.contentArea.innerHTML = `
        <div class="menu-nav-list" style="width: 360px; text-align: center; display: flex; flex-direction: column; gap: 20px; align-items: center;">
          <div style="font-size: 40px;">🚀</div>
          <h3 class="stage-title" style="color: var(--active-secondary); font-size: 18px; letter-spacing: 2px;">FİKİR ULAŞTI!</h3>
          <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5; margin: 0 0 10px 0;">Müthiş fikrin başarıyla kaydedildi. İnsansızların geleceğine katkıda bulunduğun için teşekkürler!</p>
        </div>
      `;
      setTimeout(() => {
        this.state.suggestData = null;
        this.state.menuState = "PLAY_TYPE_SELECT";
        this.state.selectedPlayTypeIdx = 3;
        this.updateView();
      }, 3000);
    } else {
      const submitBtn = this.contentArea.querySelectorAll(".menu-nav-item")[0];
      if (submitBtn) {
        submitBtn.classList.add("shake-error");
        setTimeout(() => submitBtn.classList.remove("shake-error"), 350);
      }
    }
  } else if (choice === 6) {
    this.state.menuState = "PLAY_TYPE_SELECT";
    this.state.selectedPlayTypeIdx = 3;
    this.updateView();
  }
}
