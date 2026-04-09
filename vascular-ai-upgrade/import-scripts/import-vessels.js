const TerminusDB = require("@terminusdb/terminusdb-client");
const data = require("../data/complete-vessels.json");

const client = new TerminusDB.WOQLClient("http://localhost:3055/api", {
  user: "admin",
  key: "your_password_here",
  db: "vascular_ai"
});

async function importVessels() {
  try {
    // Создаем БД если нет
    try {
      await client.createDatabase("vascular_ai", {
        label: "Vascular AI Database",
        comment: "Medical atlas and protocols",
        schema: true
      });
      console.log("Database created");
    } catch (e) {
      console.log("Database exists");
    }

    // Импортируем партиями
    for (const vessel of data.vessels) {
      const doc = {
        "@type": "Vessel",
        ...vessel,
        "@id": `Vessel_${vessel.latin_name.replace(/\s+/g, "_")}`
      };
      
      await client.addDocument(doc, {
        graph_type: "instance",
        author: "import_script",
        message: `Import ${vessel.latin_name}`
      });
      console.log(`Imported: ${vessel.russian_name}`);
    }
    
    console.log("Import completed successfully");
  } catch (error) {
    console.error("Import failed:", error);
  }
}

importVessels();
