import React from 'react';
import { useVesselDetails } from '../hooks/useTerminus';

const dangerColors = {
  '1': '#4caf50',
  '2': '#8bc34a', 
  '3': '#ffc107',
  '4': '#ff9800',
  '5': '#f44336'
};

const relationIcons = {
  anterior: '→',
  posterior: '←',
  lateral: '↔',
  medial: '↕',
  deep: '↓',
  superficial: '↑'
};

const TopographyPanel = ({ vesselId }) => {
  const data = useVesselDetails(vesselId);

  if (!data) return <div>Загрузка топографии...</div>;

  return (
    <div className="topography-panel">
      <h3>Топографические связи</h3>
      <div className="relations-list">
        {data.topography.map((rel, idx) => (
          <div 
            key={idx} 
            className="relation-card"
            style={{ borderLeftColor: dangerColors[rel.danger] || '#ccc' }}
          >
            <div className="relation-header">
              <span className="relation-icon">{relationIcons[rel.relation]}</span>
              <span className="structure-name">{rel.structure}</span>
              <span 
                className="danger-badge"
                style={{ background: dangerColors[rel.danger] }}
              >
                {rel.danger}
              </span>
            </div>
            <div className="relation-details">
              <span>{rel.relation} • {rel.distance} мм</span>
            </div>
            <div className="clinical-note">
              {rel.note}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopographyPanel;
