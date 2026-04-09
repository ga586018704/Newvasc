import React, { useState } from 'react';
import { useVessels } from '../hooks/useTerminus';

const VesselTree = ({ onSelect, selectedId }) => {
  const { vessels, loading } = useVessels();
  const [filter, setFilter] = useState('');

  if (loading) return <div>Загрузка атласа...</div>;

  const categories = {
    artery: 'Артерии',
    vein: 'Вены',
    lymphatic: 'Лимфатические сосуды'
  };

  const grouped = vessels.reduce((acc, vessel) => {
    if (!acc[vessel.category]) acc[vessel.category] = [];
    acc[vessel.category].push(vessel);
    return acc;
  }, {});

  return (
    <div className="vessel-tree">
      <input 
        type="text" 
        placeholder="Поиск сосуда..." 
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="search-input"
      />
      
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="category-group">
          <h4>{categories[cat] || cat}</h4>
          {items
            .filter(v => v.russianName.toLowerCase().includes(filter.toLowerCase()))
            .map(vessel => (
            <div 
              key={vessel.id}
              className={`vessel-item ${selectedId === vessel.id ? 'selected' : ''}`}
              onClick={() => onSelect(vessel)}
            >
              <div className="vessel-name">{vessel.russianName}</div>
              <div className="vessel-latin">{vessel.latinName}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default VesselTree;
