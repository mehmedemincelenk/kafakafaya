# KAFA KAFAYA - AI Agent Skill Guide & Index

Bu dosya, kafakafaya projesinde çalışan yapay zeka ajanlarının (AI Agents) doğru standartlarda, sıfır hata ve yüksek "game feel" performansı ile geliştirme yapmasını sağlayan ana yönerge dizinidir.

Kılavuzlar resmi Google Antigravity Skill standardına göre yapılandırılmıştır ve `.agents/skills/` klasöründe yer alır. Antigravity ajanı, görev tanımlarına göre bu yetenekleri otomatik olarak keşfedip kullanır.

---

## 🎯 Core AI Agent Skills

Geliştirme yaparken aşağıdaki uzmanlık dosyalarını sistem promptuna ekleyin veya doğrudan okuyun:

1. **[Core Rules & Principles Skill](file:///home/mec/Desktop/codes/kafakafaya/.agents/skills/core/SKILL.md)**
   * **Odak**: Proje genel kuralları, anayasa ve yasaklar (Puppeteer MCP kullanımı kesinlikle yasaktır, overengineering yapılamaz).

2. **[Kaplay.js Gamedev Skill](file:///home/mec/Desktop/codes/kafakafaya/.agents/skills/kaplay_gamedev/SKILL.md)**
   * **Odak**: Kaplay.js motor kuralları, API kullanımları ve runtime çökmelerini (Vec2 scale ve double-destruction) önleyen kod kalıpları.

3. **[Game Design & Juice Skill](file:///home/mec/Desktop/codes/kafakafaya/.agents/skills/game_design/SKILL.md)**
   * **Odak**: Savaş alanı dinamikleri, kamera sarsıntı (screen shake) değerleri, neon görsel paletleri, tekerlek/far dinamik çizimleri ve momentum bazlı (Hız × Kütle) çarpışma formülleri.

4. **[State & Memory Skill](file:///home/mec/Desktop/codes/kafakafaya/.agents/skills/project_memory/SKILL.md)**
   * **Odak**: Object-mapped FSM durum geçişleri, dairesel bağımlılıkları engelleme yöntemleri, konfigürasyon ayrımı ve Playroom Kit multiplayer senkronizasyonu.

5. **[Kaplay.js UI/UX & Virtual Controls Skill](file:///home/mec/Desktop/codes/kafakafaya/.agents/skills/kaplay_ui_ux/SKILL.md)**
   * **Odak**: Responsive arayüz düzeni, neon teması/glassmorphism tasarımı, hover ve scale mikro-animasyonları, mobil sanal joystick (dokunmatik kontroller) yapısı ve yerel depolama persistence örüntüsü.

---

## 📂 Dosya Sorumlulukları

* `src/kaplay.js`: Kaplay kütüphanesini başlatır ve küresel durumları (`k.gameOver` vb.) tutar.
* `src/config.js`: Araç tipleri (`CAR_TYPES`) ve parametre şablonları.
* `src/states.js`: Araç durum makinesi (FSM) güncellemeleri.
* `src/car.js`: Araç oluşturucu ve can/HUD barlarının bağımsız güncellenmesi.
* `src/collision.js`: Momentum tabanlı çarpışma ve hasar fiziği.
* `src/clash.js`: Kafa kafaya çarpışmadaki bas-bırak düello mini-oyun mantığı.
* `src/input.js`: Yerel ve çevrimiçi girdi (input) yönetimi.
* `src/hud.js`: Ekrandaki aktif cooldown, can ve yetenek ikon tasarımları.
