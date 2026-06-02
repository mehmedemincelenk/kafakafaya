# KAFA KAFAYA - Game Architecture & Skill Guideline

Bu dosya, projenin mevcut mimari durumunu, kodlama standartlarını, fizik formüllerini ve gelecek geliştirme kurallarını özetleyen merkezi hafıza (SKILL) kılavuzudur.

---

## 📁 1. Dizin Yapısı & Dosya Sorumlulukları

```text
kafakafaya/
├── index.html                  # Giriş HTML dosyası (Vite modül girişi)
├── style.css                   # Minimalist CSS
├── vite.config.js              # Vite sunucu ayarları
├── main.js                     # Oyun giriş noktası, sahne kurulumu ve çarpışma motoru
└── src/
    ├── kaplay.js               # Kaplay (Kaboom) motor başlatıcısı & global k.gameOver yönetimi
    ├── config.js               # Sınıf/Araba ayar şablonları (CAR_TYPES)
    ├── utils.js                # Patlama kıvılcımları ve hasar görsel efektleri
    ├── states.js               # FSM durum tanımları (CAR_STATES) ve geçiş yöneticisi (changeState)
    └── car.js                  # Araç oluşturucu (addCar) bileşeni
```

---

## 🛡️ 2. Temel Mimari Prensipler

1. **Yasaklar:** Overengineering (aşırı tasarım/fazla kodlama) ve Overtokening kesinlikle yasaktır.
2. **Component-Based:** Tüm oyun nesneleri bağımsız bileşenler halinde kurgulanır. Ortak özellikler tek bir addCar bileşeninde kapsüllenir.
3. **DRY (Don't Repeat Yourself):** Aynı mantık kodları tekrar etmez. İstatistikler `CAR_TYPES` altında, durumlar `CAR_STATES` altında toplanmıştır.
4. **Dairesel Bağımlılık (Circular Dependency) Önleme:** Modüllerin birbirini zincirleme import etmesini önlemek amacıyla, global değişkenler (örn: `gameOver`) doğrudan `k.gameOver` olarak Kaplay nesnesine bağlanır.

---

## ⚙️ 3. FSM (Finite State Machine) Akışı

Araçlar durum tabanlı yönetilir. `switch-case` yerine doğrudan durum-fonksiyon eşleşmeli **Object Mapping** stili kullanılır:

```javascript
// src/states.js
export const CAR_STATES = {
  DRIVING: { update: (car) => { /* Sürüş ve Direksiyon */ } },
  CLASH:   { enter: (car) => { car.speed = 0; } }, // Düello durumu
  RECOIL:  { update: (car) => { /* Kontrol dışı savrulma */ } }
};
```

### Durum Geçişleri:
* `changeState(car, newState)` fonksiyonu ile güvenli geçiş sağlanır.
* Çarpışma anında araç durumları `CLASH` veya `RECOIL` olarak değiştirilir, böylece savrulurken oyuncunun gaza basma veya manevra yapma kontrolleri engellenir.

---

## 📐 4. Kütle ve Çarpışma Fiziği (Mass-Based Recoil)

Çarpışmalarda geri tepme (`speed`) sabit değerler yerine vuran ve vurulan araçların kütle oranlarına göre hesaplanır. Bu sayede ağır araçların hafifleri ezmesi, hafiflerin ise ağırları sarsamaması tek satırlık bir fizikle çözülür:

* **Çarpışma Kuvveti (Savrulma):**
  $$\text{victim.speed} = -550 \times \left( \frac{\text{attacker.mass}}{\text{victim.mass}} \right)$$
* **Düello Sonucu Sekme (Beraberlik):**
  $$\text{car1.speed} = -350 \times \left( \frac{\text{car2.mass}}{\text{car1.mass}} \right)$$

---

## 🔮 5. Gelecek Geliştirme & Ağa Hazır (Multiplayer-Ready) Kuralları

1. **Sahne Ayrımı (Scenes):** 
   Giriş menüsü (`k.scene("menu")`) ve oyun sahnesi (`k.scene("game")`) tamamen ayrılmalıdır. Oyun sahnesi, oyuncu seçimlerini (`playerSettings`) dışarıdan parametre alarak başlatmalıdır.
2. **Klavye Kontrol Soyutlaması:**
   Gelecekte multiplayer geldiğinde yerel veya ağ üzerinden gelen girdilerin eşleşebilmesi için, klavye kontrolleri doğrudan araca parametre geçilen `car.controls` nesnesi üzerinden tetiklenir.
3. **Dash (Atılma):**
   `DASHING` durumu `CAR_STATES` nesnesine eklenecek, dash süresince arkada `k.lifespan(0.15)` ile silinen küçük iz kutucukları bırakılacaktır.
