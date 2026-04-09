const { createDirectus, rest, createItems, readItems } = require('@directus/sdk');
const fs = require('fs');
const path = require('path');

// Конфигурация
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN; // Получите из Terminus

const client = createDirectus(DIRECTUS_URL).with(rest());

// Полные данные по сосудам (расширенный набор)
const vesselsData = [
  {
    latin_name: "Aorta abdominalis",
    russian_name: "Брюшная аорта",
    segments: [
      {
        id: "suprarenal",
        name: "Надпочечный сегмент (Zumm I)",
        boundaries: ["T12", "L1"],
        length_mm: "30-50",
        diameter_mm: "25-30",
        branches: ["A. phrenica inferior", "A. suprarenalis media"],
        variations: []
      },
      {
        id: "pararenal",
        name: "Почечный сегмент (Zumm II)",
        boundaries: ["L1", "L2"],
        length_mm: "40-60",
        diameter_mm: "20-25",
        branches: ["A. renalis dextra/sinistra"],
        variations: [
          {
            type: "accessory_renal_artery",
            prevalence: 0.25,
            description: "Дополнительная почечная артерия (нижняя полюсная)"
          }
        ]
      },
      {
        id: "infrarenal",
        name: "Подпочечный сегмент (Zumm III)",
        boundaries: ["L2", "L4"],
        length_mm: "80-120",
        diameter_mm: "18-22",
        branches: ["A. mesenterica superior", "A. renalis media (редко)"],
        variations: []
      },
      {
        id: "bifurcation",
        name: "Сегмент бифуркации",
        boundaries: ["L4", "L4-L5"],
        length_mm: "10-20",
        diameter_mm: "15-18",
        bifurcates_into: ["A. iliaca communis dextra", "A. iliaca communis sinistra"],
        aneurysm_risk_zone: true
      }
    ],
    illustrations: {
      svg_schematic: "/uploads/atlas/aorta_schematic.svg",
      photo_real: "/uploads/atlas/aorta_cadaveric.jpg",
      ct_slices: [
        { level: "T12", file: "/uploads/atlas/aorta_axial_t12.jpg" },
        { level: "L1", file: "/uploads/atlas/aorta_axial_l1.jpg" },
        { level: "L3", file: "/uploads/atlas/aorta_axial_l3.jpg" }
      ]
    }
  },
  {
    latin_name: "Arteria iliaca communis",
    russian_name: "Общая подвздошная артерия",
    segments: [
      {
        id: "entire",
        name: "Общая подвздошная",
        length_mm: "40-50",
        diameter_mm: "10-12",
        bifurcates_at: "Сacroiliac joint"
      }
    ],
    illustrations: {
      svg_schematic: "/uploads/atlas/iliac_common.svg"
    }
  },
  {
    latin_name: "Arteria iliaca externa",
    russian_name: "Наружная подвздошная артерия",
    topography_notes: "Проходит вдоль pelvic brim, медиально к подвздошной вене, латерально к уретеру",
    segments: [
      {
        id: "proximal",
        name: "Проксимальная часть",
        relations: ["M. psoas major (posterior)", "Ureter (medial)"],
        puncture_zone: false // Опасно из-за уретера
      },
      {
        id: "distal",
        name: "Дистальная часть (infrainguinal)",
        puncture_zone: true,
        landmark: "Мидпоинт between ASIS and pubic symphysis"
      }
    ]
  },
  {
    latin_name: "Arteria femoralis communis",
    russian_name: "Общая бедренная артерия",
    segments: [
      {
        id: "proximal",
        name: "Проксимальный сегмент (femoral triangle)",
        length_mm: "40-50",
        diameter_mm: "8-10",
        topography: {
          anterior: ["Fascia lata", "Кожа"],
          posterior: ["M. pectineus", "Суставная капсула таза"],
          lateral: ["N. femoralis", "M. sartorius"],
          medial: ["V. femoralis", "A. femoralis (после бифуркации)"]
        },
        puncture_site: "1 см ниже midpoint ингвинальной связки"
      }
    ]
  },
  // ... добавьте еще 25+ сосудов по аналогии
];

async function importVessels() {
  try {
    console.log('Starting vessel import...');
    
    // Проверяем существующие
    const existing = await client.request(readItems('vessels', {
      fields: ['latin_name'],
      limit: -1
    }));
    
    const existingNames = new Set(existing.map(v => v.latin_name));
    const newVessels = vesselsData.filter(v => !existingNames.has(v.latin_name));
    
    if (newVessels.length === 0) {
      console.log('All vessels already imported');
      return;
    }
    
    // Импортируем партиями по 5 штук
    const batchSize = 5;
    for (let i = 0; i < newVessels.length; i += batchSize) {
      const batch = newVessels.slice(i, i + batchSize);
      await client.request(createItems('vessels', batch));
      console.log(`Imported batch ${i/batchSize + 1}/${Math.ceil(newVessels.length/batchSize)}`);
    }
    
    console.log(`Successfully imported ${newVessels.length} vessels`);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

// Запуск
if (require.main === module) {
  importVessels();
}

module.exports = { importVessels, vesselsData };
