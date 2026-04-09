const { createDirectus, rest, createItems, readItems } = require('@directus/sdk');

const client = createDirectus(process.env.DIRECTUS_URL).with(rest());

const topographyData = [
  {
    vessel_latin: "Arteria femoralis communis",
    relations: [
      {
        related_structure: "Бедренная вена",
        relation_type: "medial",
        distance_mm: 5,
        clinical_note: "При пункции АФС риск повреждения вены — компрессия после процедуры обязательна",
        layer: "subcutaneous"
      },
      {
        related_structure: "Бедренный нерв",
        relation_type: "lateral",
        distance_mm: 15,
        clinical_note: "Никогда не делать пункцию латерально от артерии — риск невропатии",
        layer: "deep"
      },
      {
        related_structure: "M. pectineus",
        relation_type: "posterior",
        distance_mm: 0,
        clinical_note: "Лежит на мыщце при выходе из бедренного кольца",
        layer: "muscular"
      }
    ]
  },
  {
    vessel_latin: "Aorta abdominalis",
    relations: [
      {
        related_structure: "Нижняя полая вена",
        relation_type: "anterior",
        distance_mm: 0,
        clinical_note: "Спереди от аорты на уровне L3-L4, риск повреждения при антеролатеральном подходе",
        layer: "retroperitoneal"
      },
      {
        related_structure: "Уретер",
        relation_type: "lateral",
        distance_mm: 20,
        clinical_note: "Перекрещивает сосуды спереди, важен при аортобифеморальном шунтировании",
        layer: "retroperitoneal"
      }
    ]
  }
];

async function importTopography() {
  const vessels = await client.request(readItems('vessels', {
    fields: ['id', 'latin_name'],
    limit: -1
  }));
  
  const vesselMap = new Map(vessels.map(v => [v.latin_name, v.id]));
  
  const relationsToCreate = [];
  
  for (const item of topographyData) {
    const vesselId = vesselMap.get(item.vessel_latin);
    if (!vesselId) {
      console.warn(`Vessel not found: ${item.vessel_latin}`);
      continue;
    }
    
    for (const rel of item.relations) {
      relationsToCreate.push({
        vessel_id: vesselId,
        ...rel
      });
    }
  }
  
  if (relationsToCreate.length > 0) {
    await client.request(createItems('topographic_relations', relationsToCreate));
    console.log(`Imported ${relationsToCreate.length} topographic relations`);
  }
}

importTopography().catch(console.error);
