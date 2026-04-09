import fitz  # PyMuPDF
import re
import json
from dataclasses import dataclass
from typing import List, Optional

@dataclass
class TreatmentStage:
    stage_number: int
    name: str
    procedures: List[dict]
    drugs: List[dict]
    indications: List[str]
    contraindications: List[str]

@dataclass
class Protocol:
    condition: str
    source: str
    evidence_level: str
    stages: List[TreatmentStage]
    vessel_target: Optional[str] = None

class MinzdravGuidelineParser:
    def __init__(self, pdf_path: str):
        self.pdf_path = pdf_path
        self.doc = fitz.open(pdf_path)
        
    def extract_text_with_structure(self):
        """Извлекает текст с сохранением структуры (заголовки, списки)"""
        structured_content = []
        
        for page_num in range(len(self.doc)):
            page = self.doc[page_num]
            blocks = page.get_text("blocks")
            
            for block in blocks:
                text = block[4].strip()
                if not text:
                    continue
                    
                # Определяем тип блока по форматированию
                if self._is_heading(text):
                    structured_content.append({
                        "type": "heading",
                        "level": self._get_heading_level(text),
                        "text": text
                    })
                elif self._is_list_item(text):
                    structured_content.append({
                        "type": "list_item",
                        "text": text,
                        "parent_heading": self._get_current_heading(structured_content)
                    })
                else:
                    structured_content.append({
                        "type": "paragraph",
                        "text": text
                    })
        
        return structured_content
    
    def _is_heading(self, text: str) -> bool:
        """Определяет заголовок по шаблонам (например, 4.2.1., раздел, глава)"""
        patterns = [
            r'^\d+\.\d+\.\d+',  # 4.2.1
            r'^Раздел\s+\d+',
            r'^Глава\s+\d+',
            r'^(Лечение|Диагностика|Показания)\s'
        ]
        return any(re.match(p, text) for p in patterns)
    
    def _is_list_item(self, text: str) -> bool:
        return text.startswith(('•', '-', '–', '1.', '2.', 'а)', 'б)'))
    
    def parse_treatment_protocols(self) -> List[Protocol]:
        """Парсит лечебные протоколы из текста"""
        content = self.extract_text_with_structure()
        protocols = []
        
        i = 0
        while i < len(content):
            item = content[i]
            
            # Ищем разделы о лечении
            if item["type"] == "heading" and "лечение" in item["text"].lower():
                protocol = self._extract_protocol_from_position(content, i)
                if protocol:
                    protocols.append(protocol)
            
            i += 1
        
        return protocols
    
    def _extract_protocol_from_position(self, content: List[dict], start_idx: int) -> Optional[Protocol]:
        """Извлекает протокол начиная с позиции заголовка"""
        heading = content[start_idx]["text"]
        
        # Определяем патологию из заголовка или предыдущего контекста
        condition = self._extract_condition(heading)
        evidence_level = self._extract_evidence_level(content, start_idx, min(start_idx + 20, len(content)))
        
        stages = []
        i = start_idx + 1
        
        while i < len(content) and not (content[i]["type"] == "heading" and self._is_new_section(content[i]["text"])):
            if content[i]["type"] in ["paragraph", "list_item"]:
                stage = self._parse_stage_content(content[i]["text"])
                if stage:
                    stages.append(stage)
            i += 1
        
        if stages:
            return Protocol(
                condition=condition,
                source=self.pdf_path,
                evidence_level=evidence_level,
                stages=stages
            )
        return None
    
    def _extract_condition(self, text: str) -> str:
        """Извлекает название заболевания из текста"""
        # Примеры паттернов: "Лечение критической ишемии", "Терапия аневризмы"
        patterns = [
            r'Лечение\s+([^.]+)',
            r'Терапия\s+([^.]+)',
            r'Хирургическое\s+лечение\s+([^.]+)'
        ]
        for p in patterns:
            match = re.search(p, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return text
    
    def _extract_evidence_level(self, content: List[dict], start: int, end: int) -> str:
        """Ищет уровень доказательности (A, B, C) в ближайшем тексте"""
        for i in range(start, end):
            text = content[i]["text"]
            if "уровень доказательности" in text.lower() or "класс рекомендации" in text.lower():
                if "A" in text or "I" in text:
                    return "A"
                elif "B" in text or "IIa" in text:
                    return "B"
        return "C"  # По умолчанию
    
    def _parse_stage_content(self, text: str) -> Optional[TreatmentStage]:
        """Парсит этап лечения из текста"""
        # Примеры: "1. Консервативная терапия", "Первый этап — медикаментозное лечение"
        stage_patterns = [
            r'(\d+)\s*[\.)]\s*(Консервативн|Медикаментоз|Хирургич|Эндоваскуляр)',
            r'(Первый|Второй|Третий)\s+этап'
        ]
        
        for p in stage_patterns:
            match = re.search(p, text, re.IGNORECASE)
            if match:
                stage_num = int(match.group(1)) if match.group(1).isdigit() else \
                           {"Первый": 1, "Второй": 2, "Третий": 3}.get(match.group(1), 1)
                
                # Парсим лекарства
                drugs = self._extract_drugs(text)
                
                return TreatmentStage(
                    stage_number=stage_num,
                    name=text[:100],
                    procedures=[],
                    drugs=drugs,
                    indications=[],
                    contraindications=[]
                )
        return None
    
    def _extract_drugs(self, text: str) -> List[dict]:
        """Извлекает названия лекарств и дозировки"""
        # Простой паттерн — в реальности нужен медицинский NER
        drug_pattern = r'([А-Я][а-я]+)\s+(\d+)\s*(мг|г|мл)'
        matches = re.findall(drug_pattern, text)
        
        drugs = []
        for name, dose, unit in matches:
            drugs.append({
                "name": name,
                "dosage": f"{dose} {unit}",
                "frequency": self._extract_frequency(text)
            })
        return drugs
    
    def _extract_frequency(self, text: str) -> str:
        """Извлекает частоту приема (1 раз в день, 2 р/сут и т.д.)"""
        patterns = [r'(\d+)\s*р[/]сут', r'(\d+)\s*раза?\s*в\s*(день|сутки)']
        for p in patterns:
            match = re.search(p, text)
            if match:
                return match.group(0)
        return "согласно схеме"

    def _is_new_section(self, text: str) -> bool:
        """Проверяет, является ли заголовок началом нового раздела"""
        return any(k in text.lower() for k in ["раздел", "глава", "приложение"])

def main():
    # Пример использования
    parser = MinzdravGuidelineParser("prikaz_123n_2024.pdf")
    protocols = parser.parse_treatment_protocols()
    
    # Сохраняем в JSON для импорта в Terminus
    with open("parsed_protocols.json", "w", encoding="utf-8") as f:
        json.dump([{
            "condition": p.condition,
            "source": p.source,
            "evidence_level": p.evidence_level,
            "stages": [
                {
                    "number": s.stage_number,
                    "name": s.name,
                    "drugs": s.drugs
                } for s in p.stages
            ]
        } for p in protocols], f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
