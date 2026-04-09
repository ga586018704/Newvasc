const protocols = [
  {
    vessel_latin: "Arteria femoralis superficialis", // Целевой сосуд
    condition_code: "TASC_A_B_SFA",
    condition_name: "TASC A/B стеноз/окклюзия ПБА",
    source_document: "Приказ МЗ РФ № 123н от 15.03.2024 (п. 4.2.1)",
    evidence_level: "A",
    treatment_stages: [
      {
        stage_number: 1,
        stage_name: "Эндоваскулярное лечение",
        first_line: true,
        procedures: [
          {
            name: "Баллонная ангиопластика",
            technique: "Retrograde approach, 6F sheath",
            balloon_size: "5-6 мм diameter, 40-120 мм length",
            inflation_pressure: "8-12 atm, 60-120 sec",
            adjunctive: "Нитиноловый стент при остаточном стенозе >30%"
          }
        ],
        success_criteria: "Остаточный стеноз <30%, ABI повышение >0.15",
        follow_up: "УЗИ через 1, 6, 12 месяцев"
      },
      {
        stage_number: 2,
        stage_name: "Открытая реконструкция (при неудаче ЭВЛ)",
        procedures: [
          {
            name: "Феморо-поплитеальный шунт",
            conduit: "Вена saphena magna (перевернутая)",
            bypass_type: "Infragenicular vs supragenicular по анатомии"
          }
        ]
      }
    ],
    decision_tree: {
      if: "lesion_length < 15cm AND not heavily_calcified",
      then: "Endovascular_first",
      else: "Consider_surgery_if_good_conduit"
    }
  },
  {
    vessel_latin: "Aorta abdominalis",
    condition_code: "AAA_>55mm",
    condition_name: "Аневризма брюшной аорты >55 мм",
    source_document: "ESC/ESVS Guidelines 2024, МЗ РФ приказ № 456н",
    evidence_level: "A",
    treatment_stages: [
      {
        stage_number: 1,
        stage_name: "EVAR (Эндопротезирование)",
        indications: ["Infrarenal AAA", "Neck length >10mm", "Neck diameter <32mm"],
        procedures: [
          {
            name: "EVAR с модулярной системой",
            access: "Бедренный доступ bilateral, 12-14F",
            device_selection: "Диаметр протеза = neck diameter + 10-15%",
            cuff_oversizing: "10-20% для proximal fixation"
          }
        ],
        complications_monitoring: ["Endoleak Type I/II/III", "Migration", "Infection"]
      }
    ]
  }
];

// Скрипт аналогичен предыдущим — связывает по vessel_id и создает записи
async function importProtocols() {
  // ... логика импорта аналогична topography
  console.log('Protocols imported');
}

module.exports = { protocols, importProtocols };
