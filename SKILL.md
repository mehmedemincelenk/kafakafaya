# KAFA KAFAYA - Game Architecture & Skill Guideline

Bu dosya, projenin mevcut mimari durumunu, kodlama standartlarını, fizik formüllerini ve gelecek geliştirme kurallarını özetleyen merkezi hafıza (SKILL) kılavuzudur.

---

## 📁 1. Dizin Yapısı & Dosya Sorumlulukları

```text
kafakafaya/
├── index.html                  # Giriş HTML dosyası (Vite modül girişi)
├── style.css                   # Minimalist CSS
├── vite.config.js              # Vite sunucu ayarları
├── main.js                     # Oyun giriş noktası, sadece sahneleri ayağa kaldıran yönlendirici
└── src/
    ├── kaplay.js               # Kaplay (Kaboom) motor başlatıcısı & global k.gameOver yönetimi
    ├── config.js               # Sınıf/Araba ayar şablonları (CAR_TYPES)
    ├── utils.js                # Patlama kıvılcımları ve hasar görsel efektleri
    ├── states.js               # FSM durum tanımları (CAR_STATES) ve geçiş yöneticisi (changeState)
    ├── collision.js            # Temel çarpışma ve hasar fiziği yönlendiricisi
    ├── clash.js                # Kafa kafaya çarpışma (düello) ve bas-bırak (button mash) mantığı
    ├── car.js                  # Araç oluşturucu (addCar) bileşeni ve görsel giysiler
    └── scenes/                 # Oyun sahneleri
        ├── menu.js             # Karakter/Araç seçim menü sahnesi ve UI yönetimi
        └── game.js             # Savaş alanı ve arena sahnesi kurulumu
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

---

## 🏎️ 4. Araç Sınıfları & İstatistikleri (CAR_TYPES)

* **DENGELI (Dengeli):** Standart şasi. Boyut: 46x26, Can: 100, Hız: 300, Kütle: 1.0.
* **HIZLI (Hızlı):** Rüzgarlıklı uzun şasi. Boyut: 48x24, Can: 80, Hız: 400, Kütle: 0.8.
* **HIPHIZLI (Hıphızlı):** Küçük ve ince şasi (Glass Cannon). Boyut: 40x20, Can: 60, Hız: 430, Kütle: 0.5.
* **GUCLU (Güçlü):** Ön koruma barlı kalın şasi. Boyut: 50x30, Can: 140, Hız: 240, Kütle: 1.5.
* **TANK (Tank):** En büyük, ağır üst plaka şasisi. Boyut: 54x34, Can: 180, Hız: 180, Kütle: 2.0.
* **DRIFT (Drift):** Yarış şeritli yan kayma şasisi. Boyut: 44x24, Can: 90, Hız: 320, Kütle: 0.9.

Araçların tekerlekleri, farları ve sınıf süslemeleri kendi şasi boyutlarına göre dinamik olarak ölçeklenir ve konumlandırılır.

---

## 📐 5. Kütle ve Çarpışma Fiziği (Momentum-Based Collisions)

Çarpışmalarda kimin saldırgan (attacker) kimin hasar alan mağdur (victim) olacağı ham hız yerine **Momentum (Hız × Kütle)** değerine göre belirlenir. Bu sayede hafif/jet sınıfı (KAAN, KEMANKES) bir araç çok hızlı gelse bile, hantal ama devasa kütleli bir tanka (ALTAY) önden çarptığında kendisi geri savrulur ve hasar alır:

* **Saldırgan Kararı:**
  $$\text{Saldırgan} = \text{Momentum}_1 > \text{Momentum}_2 \text{ ise } \text{Car}_1 \text{ aksi halde } \text{Car}_2$$
  $$\text{Momentum} = \text{Hız} \times \text{Kütle}$$
* **Düello (Clash) Koşulu:**
  **Yalnızca Kafa Kafaya Modunda** geçerlidir. Her iki araç da tampon tampona (bumper-to-bumper) çarpışıyorsa ve aktif şekilde ileri sürüyorlarsa (`speed > 50`) düello mini-oyunu tetiklenir. Normal modda düello tetiklenmez.
* **Geri Tepme (Recoil):**
  $$\text{victim.speed} = -\text{victimSign} \times \text{attacker.speed} \times 0.7 \times \left( \frac{\text{attacker.mass}}{\text{victim.mass}} \right)$$

---

## 🎮 6. Oyun Modları (Game Modes)

Oyun iki farklı savaş modu sunar. Seçim ekranında `Q` tuşu ile değiştirilir:

1. **NORMAL MOD (Momentum Savaşı):**
   * Oyuncular diledikleri farklı araçları seçebilirler (Örn: ALTAY vs KAAN).
   * Çarpışmalarda üstünlük momentum (Hız × Kütle) ile belirlenir. Kafa kafaya bas-bırak düellosu devre dışıdır. Tamamen asimetrik taktiksel sürüşe odaklanır.
2. **KAFA KAFAYA MODU (Simetrik Düello):**
   * Oyuncular aynı aracı seçmek zorundadır. Farklı seçerlerse, oyun başlangıcında ikisinden birinin seçimi **rastgele** ortak araç olarak atanır.
   * Kafa kafaya tampon tampona çarpışmalar bas-bırak düello mini-oyununu tetikler. Eşit şartlarda saf refleks/hız savaşıdır.

---

## 🔮 7. Aktif Yetenek Sistemi (Active Skill System)

Oyunda her sınıfın kendine has, görsel çizim gerektirmeyen, matematik ve fizik tabanlı aktif yetenekleri bulunur:

* **Kontroller:**
  * **Oyuncu 1 (Mavi):** Sol Shift (`"shift"`) tuşu ile yeteneği tetikler.
  * **Oyuncu 2 (Kırmızı):** Enter / Numpad Enter (`"enter"`) tuşu ile yeteneği tetikler.
* **Yetenek Arayüzü (HUD):**
  * Her aracın üzerinde, can barının 6px üstünde küçük bir **Yetenek Barı** bulunur.
  * Yetenek aktifken bar **Açık Mavi** parlar ve kalan süreyi gösterir.
  * Cooldown (bekleme) sürecinde **Gri** dolmaktadır.
  * Yetenek kullanıma hazır olduğunda **Yeşil** renkte sabit kalır.
* **Sınıf Yetenekleri:**
  1. **DENGELI ➔ Kalkan (Shield):** 1.5 saniye hasarsızlık kazanır, araç etrafında beyaz outline çizilir.
  2. **HIZLI ➔ Nitro:** 0.4 saniye boyunca anlık 1.6 kat hız kazanır.
  3. **HIPHIZLI ➔ Hayalet (Ghost):** 0.8 saniye boyunca rakibin içinden geçebilir hale gelir (`isGhost` modu, yarı saydamlık).
  4. **GUCLU ➔ Öfke (Rage):** 2.0 saniye boyunca kütlesi 3 katına çıkar (altın outline efekti).
  5. **TANK ➔ Demir Duvar (Iron Wall):** 1.2 saniye boyunca aracı yere sabitler (`mass = 99999`, hız sıfırlanır, hasarsızlık aktif).
  6. **DRIFT ➔ Turbo Drift:** 1.5 saniye boyunca dönüş hızı 1.8 katına çıkar.

---

## 🚀 8. Gelecek Geliştirme & Ağa Hazır (Multiplayer-Ready) Kuralları

1. **Sahne Ayrımı (Scenes):** 
   Giriş menüsü (`k.scene("menu")`) ve oyun sahnesi (`k.scene("game")`) tamamen ayrılmıştır. Oyun sahnesi, oyuncu seçimlerini (`playerSettings`) dışarıdan parametre alarak başlatır.
2. **Klavye Kontrol Soyutlaması:**
   Girdiler parametrik `car.controls` nesnesi üzerinden tetiklenir, ağ üzerinden gelen girdilerle kolayca beslenebilir.
