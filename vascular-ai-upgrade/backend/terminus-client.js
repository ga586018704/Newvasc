const TerminusDB = require("@terminusdb/terminusdb-client");

class VascularDatabase {
  constructor() {
    this.client = new TerminusDB.WOQLClient("http://localhost:3055/api", {
      user: process.env.TERMINUS_USER || "admin",
      key: process.env.TERMINUS_KEY || "root",
      db: "vascular_ai"
    });
  }

  async getVesselWithTopography(latinName) {
    const query = TerminusDB.WOQL.and(
      TerminusDB.WOQL.triple("v: vessel", "rdf:type", "@schema:Vessel"),
      TerminusDB.WOQL.eq("v: vessel", "@schema:latin_name", latinName),
      TerminusDB.WOQL.triple("v: vessel", "topography", "v: topo"),
      TerminusDB.WOQL.triple("v: topo", "related_structure", "v: structure"),
      TerminusDB.WOQL.triple("v: topo", "relation_type", "v: rel_type"),
      TerminusDB.WOQL.triple("v: topo", "clinical_note", "v: note")
    );
    
    return await this.client.query(query);
  }

  async getVesselsByCategory(category) {
    const query = TerminusDB.WOQL.and(
      TerminusDB.WOQL.triple("v: vessel", "rdf:type", "@schema:Vessel"),
      TerminusDB.WOQL.eq("v: vessel", "@schema:category", category)
    );
    
    return await this.client.query(query);
  }

  async getProtocolsForVessel(vesselId) {
    const query = TerminusDB.WOQL.and(
      TerminusDB.WOQL.triple("v: protocol", "rdf:type", "@schema:TreatmentProtocol"),
      TerminusDB.WOQL.triple("v: vessel", "protocols", "v: protocol"),
      TerminusDB.WOQL.eq("v: vessel", "@id", vesselId)
    );
    
    return await this.client.query(query);
  }

  async addDicomStudy(vesselId, dicomMetadata) {
    // Добавляем связь с DICOM
    const doc = {
      "@type": "DicomStudy",
      "vessel": { "@id": vesselId },
      "study_uid": dicomMetadata.studyUid,
      "series_uid": dicomMetadata.seriesUid,
      "slice_count": dicomMetadata.sliceCount,
      "uploaded_at": new Date().toISOString()
    };
    
    return await this.client.addDocument(doc);
  }
}

module.exports = VascularDatabase;
