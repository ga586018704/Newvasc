-- Расширенная схема для PostgreSQL (если Terminus использует PG)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";  -- Для 3D координат

-- Основная таблица сосудов
CREATE TABLE vessels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    latin_name VARCHAR(100) NOT NULL UNIQUE,
    russian_name VARCHAR(100) NOT NULL,
    english_name VARCHAR(100),
    category VARCHAR(50) CHECK (category IN ('artery', 'vein', 'lymphatic', 'anomalous')),
    parent_vessel_id UUID REFERENCES vessels(id),
    segmentation_mask_path VARCHAR(255),
    model_3d_gltf_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Топографические связи
CREATE TABLE topographic_relations (
    id UUID PRIMARY DEFAULT uuid_generate_v4(),
    vessel_id UUID NOT NULL REFERENCES vessels(id) ON DELETE CASCADE,
    related_structure VARCHAR(100) NOT NULL,
    relation_type VARCHAR(20) CHECK (relation_type IN ('anterior', 'posterior', 'lateral', 'medial', 'deep', 'superficial')),
    distance_mm INTEGER CHECK (distance_mm >= 0),
    distance_variability VARCHAR(50), -- 'constant', 'variable', 'contact'
    clinical_note TEXT,
    layer VARCHAR(50),
    danger_level INTEGER CHECK (danger_level BETWEEN 1 AND 5), -- 1=safe, 5=critical
    coordinates_3d POINT, -- PostGIS point для 3D позиции
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Сегменты сосудов
CREATE TABLE vessel_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vessel_id UUID NOT NULL REFERENCES vessels(id) ON DELETE CASCADE,
    segment_order INTEGER NOT NULL,
    name VARCHAR(100),
    start_landmark VARCHAR(100),
    end_landmark VARCHAR(100),
    average_length_mm DECIMAL(5,1),
    average_diameter_mm DECIMAL(4,1),
    diameter_range_min DECIMAL(4,1),
    diameter_range_max DECIMAL(4,1),
    anatomical_variation TEXT, -- JSON с вариантами
    puncture_safe BOOLEAN DEFAULT FALSE,
    stent_approved BOOLEAN DEFAULT FALSE,
    UNIQUE(vessel_id, segment_order)
);

-- Клинические протоколы
CREATE TABLE treatment_protocols (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vessel_id UUID REFERENCES vessels(id),
    condition_code VARCHAR(50) NOT NULL, -- CLI_TASC_C, AAA_55mm
    condition_name VARCHAR(200),
    source_document VARCHAR(200), -- 'Приказ МЗ РФ № 123н'
    source_paragraph VARCHAR(50), -- 'п. 4.2.1'
    evidence_level CHAR(1) CHECK (evidence_level IN ('A', 'B', 'C')),
    first_line BOOLEAN DEFAULT FALSE,
    protocol_json JSONB NOT NULL, -- Полная структура протокола
    valid_from DATE,
    valid_to DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для производительности
CREATE INDEX idx_vessels_category ON vessels(category);
CREATE INDEX idx_vessels_parent ON vessels(parent_vessel_id);
CREATE INDEX idx_topo_vessel ON topographic_relations(vessel_id);
CREATE INDEX idx_topo_structure ON topographic_relations(related_structure);
CREATE INDEX idx_protocols_vessel ON treatment_protocols(vessel_id);
CREATE INDEX idx_protocols_condition ON treatment_protocols(condition_code);

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vessels_updated_at BEFORE UPDATE ON vessels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Начальные данные (основные сосуды)
INSERT INTO vessels (latin_name, russian_name, category) VALUES
('Aorta abdominalis', 'Брюшная аорта', 'artery'),
('Arteria iliaca communis', 'Общая подвздошная артерия', 'artery'),
('Arteria iliaca externa', 'Наружная подвздошная артерия', 'artery'),
('Arteria femoralis communis', 'Общая бедренная артерия', 'artery'),
('Arteria femoralis superficialis', 'Поверхностная бедренная артерия', 'artery'),
('Arteria poplitea', 'Подколенная артерия', 'artery'),
('Arteria tibialis anterior', 'Передняя большеберцовая артерия', 'artery'),
('Arteria tibialis posterior', 'Задняя большеберцовая артерия', 'artery');

-- Топографические данные для бедренной артерии
INSERT INTO topographic_relations 
    (vessel_id, related_structure, relation_type, distance_mm, clinical_note, layer, danger_level)
SELECT 
    v.id,
    'Бедренная вена',
    'medial',
    5,
    'Риск повреждения при пункции - обязательна компрессия',
    'subcutaneous',
    4
FROM vessels v WHERE v.latin_name = 'Arteria femoralis communis';

INSERT INTO topographic_relations 
    (vessel_id, related_structure, relation_type, distance_mm, clinical_note, layer, danger_level)
SELECT 
    v.id,
    'Бедренный нерв',
    'lateral',
    15,
    'Никогда не делать пункцию латерально - риск невропатии',
    'deep',
    5
FROM vessels v WHERE v.latin_name = 'Arteria femoralis communis';
