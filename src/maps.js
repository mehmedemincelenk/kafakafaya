export const MAPS = [
  {
    name: "NEON",
    bgColor: [18, 18, 20],
    borderColor: [0, 240, 255],
    gridColor: [30, 45, 60],
    obstacles: [
      { x: 960, y: 300, w: 200, h: 60, color: [0, 240, 255] },
      { x: 960, y: 780, w: 200, h: 60, color: [0, 240, 255] }
    ]
  },
  {
    name: "VOLKAN",
    bgColor: [25, 10, 10],
    borderColor: [255, 70, 85],
    gridColor: [60, 30, 30],
    obstacles: [
      { x: 350, y: 250, w: 100, h: 100, color: [180, 40, 20] },
      { x: 1570, y: 250, w: 100, h: 100, color: [180, 40, 20] },
      { x: 350, y: 830, w: 100, h: 100, color: [180, 40, 20] },
      { x: 1570, y: 830, w: 100, h: 100, color: [180, 40, 20] }
    ]
  },
  {
    name: "HANGAR",
    bgColor: [20, 24, 28], // Askeri Çelik Grisi
    borderColor: [0, 255, 128], // Radar Yeşili
    gridColor: [30, 42, 36], // Radar Ekranı Izgarası
    obstacles: [
      { x: 960, y: 540, w: 350, h: 50, color: [0, 200, 100] }, // Merkez Bölme Duvarı
      { x: 500, y: 300, w: 50, h: 180, color: [0, 200, 100] },  // Üst Sol Engel
      { x: 1420, y: 780, w: 50, h: 180, color: [0, 200, 100] }  // Alt Sağ Engel
    ]
  }
];
