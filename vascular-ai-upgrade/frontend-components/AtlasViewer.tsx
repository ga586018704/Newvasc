import React, { useState, useEffect } from 'react';
import { Dicom3DViewer } from '../3d-engine/Dicom3DViewer';

interface Vessel {
  id: string;
  latin_name: string;
  russian_name: string;
  segments: any[];
  topography_relations: TopographyRelation[];
}

interface TopographyRelation {
  id: string;
  related_structure: string;
  relation_type: string;
  distance_mm: number;
  clinical_note: string;
  layer: string;
}

export const AtlasViewer: React.FC = () => {
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');
  const [selectedDicom, setSelectedDicom] = useState<ArrayBuffer | null>(null);

  useEffect(() => {
    fetch('/api/items/vessels?fields=*,topography_relations.*')
      .then(r => r.json())
      .then(data => setVessels(data.data));
  }, []);

  const getRelationColor = (type: string) => {
    const colors: Record<string, string> = {
      anterior: '#ff6b6b',
      posterior: '#4ecdc4',
      lateral: '#ffe66d',
      medial: '#95e1d3',
      deep: '#a8e6cf',
      superficial: '#ffb6b9'
    };
    return colors[type] || '#ccc';
  };

  return (
    <div className="atlas-container" style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar с деревом сосудов */}
      <div style={{ width: 300, background: '#f5f5f5', padding: 20, overflow: 'auto' }}>
        <h3>Анатомический атлас</h3>
        <div className="vessel-tree">
          {vessels.map(vessel => (
            <div 
              key={vessel.id}
              onClick={() => setSelectedVessel(vessel)}
              style={{
                padding: 10,
                margin: '5px 0',
                background: selectedVessel?.id === vessel.id ? '#007bff' : 'white',
                color: selectedVessel?.id === vessel.id ? 'white' : 'black',
                cursor: 'pointer',
                borderRadius: 4,
                border: '1px solid #ddd'
              }}
            >
              <div style={{ fontWeight: 'bold' }}>{vessel.russian_name}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>{vessel.latin_name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Основная область */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Toolbar */}
        <div style={{ padding: 10, background: '#fff', borderBottom: '1px solid #ddd', display: 'flex', gap: 10 }}>
          <button onClick={() => setViewMode('2d')}>2D Срезы</button>
          <button onClick={() => setViewMode('3d')}>3D Реконструкция</button>
          <input 
            type="file" 
            accept=".dcm" 
            onChange={(e) => {
              if (e.target.files?.[0]) {
                e.target.files[0].arrayBuffer().then(setSelectedDicom);
              }
            }}
          />
        </div>

        {/* Контент */}
        <div style={{ flex: 1, display: 'flex' }}>
          {/* 3D/2D Viewer */}
          <div style={{ flex: 2, background: '#000' }}>
            {viewMode === '3d' && selectedDicom && (
              <Dicom3DViewer 
                dicomSeries={selectedDicom}
                vesselMask={selectedVessel ? {
                  // Здесь должна быть загрузка маски сосуда из Terminus
                  data: new Uint8Array(1000),
                  dimensions: [100, 100, 100],
                  origin: [0, 0, 0],
                  spacing: [1, 1, 1],
                  color: [1, 0, 0]
                } : undefined}
              />
            )}
            {viewMode === '2d' && <div>2D Slice Viewer (Cornerstone.js)</div>}
          </div>

          {/* Информационная панель */}
          <div style={{ width: 350, background: '#fff', padding: 20, overflow: 'auto', borderLeft: '1px solid #ddd' }}>
            {selectedVessel ? (
              <>
                <h2>{selectedVessel.russian_name}</h2>
                <h4 style={{ color: '#666' }}>{selectedVessel.latin_name}</h4>
                
