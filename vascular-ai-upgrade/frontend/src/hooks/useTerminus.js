import { useState, useEffect } from 'react';
import TerminusClient from '@terminusdb/terminusdb-client';

const client = new TerminusClient.WOQLClient("http://localhost:3055/api");

export const useVessels = () => {
  const [vessels, setVessels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const query = TerminusClient.WOQL.and(
      TerminusClient.WOQL.triple("v: vessel", "rdf:type", "@schema:Vessel"),
      TerminusClient.WOQL.triple("v: vessel", "latin_name", "v: latin"),
      TerminusClient.WOQL.triple("v: vessel", "russian_name", "v: russian"),
      TerminusClient.WOQL.triple("v: vessel", "category", "v: cat")
    );

    client.query(query).then(result => {
      setVessels(result.bindings.map(b => ({
        id: b.vessel,
        latinName: b.latin,
        russianName: b.russian,
        category: b.cat
      })));
      setLoading(false);
    });
  }, []);

  return { vessels, loading };
};

export const useVesselDetails = (vesselId) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!vesselId) return;
    
    // Запрос со всеми связями
    const query = TerminusClient.WOQL.and(
      TerminusClient.WOQL.triple(vesselId, "rdf:type", "@schema:Vessel"),
      TerminusClient.WOQL.triple(vesselId, "topography", "v: topo"),
      TerminusClient.WOQL.triple("v: topo", "related_structure", "v: struct"),
      TerminusClient.WOQL.triple("v: topo", "relation_type", "v: rel"),
      TerminusClient.WOQL.triple("v: topo", "distance_mm", "v: dist"),
      TerminusClient.WOQL.triple("v: topo", "clinical_note", "v: note"),
      TerminusClient.WOQL.triple("v: topo", "danger_level", "v: danger")
    );

    client.query(query).then(result => {
      setData({
        topography: result.bindings.map(b => ({
          structure: b.struct,
          relation: b.rel,
          distance: b.dist,
          note: b.note,
          danger: b.danger
        }))
      });
    });
  }, [vesselId]);

  return data;
};
