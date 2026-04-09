import svgwrite
import json
import math
from dataclasses import dataclass
from typing import List, Tuple

@dataclass
class VesselPoint:
    x: float
    y: float
    diameter: float
    label: str = ""

class AnatomySVGGenerator:
    def __init__(self, output_dir: str = "atlas_svg"):
        self.output_dir = output_dir
        self.colors = {
            'artery': '#cc0000',
            'vein': '#0000cc',
            'nerve': '#ffff00',
            'bone': '#dddddd',
            'muscle': '#cc6600',
            'organ': '#ff6600',
            'text': '#000000'
        }
    
    def generate_femoral_triangle(self, filename: "femoral_triangle.svg"):
        """Генерация схемы бедренного треугольника"""
        dwg = svgwrite.Drawing(filename, size=(600, 800), profile='tiny')
        
        # Фон
        dwg.add(dwg.rect(insert=(0,0), size=(600,800), fill='#f8f9fa'))
        
        # Заголовок
        dwg.add(dwg.text('Trigonum femorale (Бедренный треугольник)', 
                        insert=(300, 30), 
                        font_size='20px', 
                        text_anchor='middle',
                        font_weight='bold'))
        
        # Координаты ключевых точек (относительные)
        inguinal_ligament_start = (100, 100)
        inguinal_ligament_end = (500, 100)
        pubic_tubercle = (450, 100)
        asis = (150, 100)  # Anterior superior iliac spine
        
        # Нижняя граница треугольника (m. sartorius)
        apex = (200, 600)
        
        # Рисуем границы треугольника (пунктир)
        dwg.add(dwg.line(start=inguinal_ligament_start, end=apex, 
                        stroke='#666', stroke_width=2, stroke_dasharray='5,5'))
        dwg.add(dwg.line(start=pubic_tubercle, end=apex, 
                        stroke='#666', stroke_width=2, stroke_dasharray='5,5'))
        
        # Inguinal ligament (верхняя граница)
        dwg.add(dwg.line(start=inguinal_ligament_start, end=inguinal_ligament_end,
                        stroke='#333', stroke_width=3))
        dwg.add(dwg.text('Lig. inguinale', insert=(300, 90), font_size='12px', text_anchor='middle'))
        
        # Общая бедренная артерия (центр)
        cfa_points = [
            (300, 130),  # Под связкой
            (300, 200),  # Проекция деления
            (300, 350)   # Глубокая артерия бедра
        ]
        
        # Рисуем артерию с переменной толщиной
        for i in range(len(cfa_points)-1):
            start = cfa_points[i]
            end = cfa_points[i+1]
            # Толщина уменьшается дистально
            width = 12 - i * 2
            
            dwg.add(dwg.line(start=start, end=end, 
                           stroke=self.colors['artery'], 
                           stroke_width=width,
                           stroke_linecap='round'))
        
        # Метки сосудов
        dwg.add(dwg.text('A. femoralis communis', 
                        insert=(320, 150), 
                        font_size='14px', 
                        fill=self.colors['artery']))
        
        # Бифуркация
        dwg.add(dwg.circle(center=(300, 200), r=3, fill=self.colors['artery']))
        dwg.add(dwg.text('Бифуркация (AFC → AFS + AFD)', 
                        insert=(320, 200), 
                        font_size='11px'))
        
        # Поверхностная артерия (продолжение вниз)
        sfa_points = [(300, 200), (300, 400), (300, 600)]
        dwg.add(dwg.polyline(points=sfa_points, 
                            stroke=self.colors['artery'], 
                            stroke_width=8, 
                            fill='none',
                            stroke_linecap='round'))
        dwg.add(dwg.text('A. femoralis superficialis', 
                        insert=(320, 300), 
                        font_size='12px',
                        fill=self.colors['artery']))
        
        # Глубокая артерия бедра (латерально)
        dfa_start = (300, 200)
        dfa_end = (400, 250)
        dwg.add(dwg.line(start=dfa_start, end=dfa_end,
                        stroke=self.colors['artery'], 
                        stroke_width=6,
                        stroke_linecap='round'))
        dwg.add(dwg.polygon(points=[dfa_end, (395, 245), (405, 245)], 
                          fill=self.colors['artery']))
        dwg.add(dwg.text('A. profunda femoris', 
                        insert=(410, 240), 
                        font_size='12px'))
        
        # Бедренная вена (медиально, синяя, пунктир)
        femoral_vein_points = [(250, 130), (250, 200), (250, 400), (250, 600)]
        dwg.add(dwg.polyline(points=femoral_vein_points,
                            stroke=self.colors['vein'],
                            stroke_width=10,
                            fill='none',
                            stroke_linecap='round'))
        dwg.add(dwg.text('V. femoralis', 
                        insert=(230, 150), 
                        font_size='12px',
                        fill=self.colors['vein']))
        
        # Бедренный нерв (латерально, желтый)
        nerve_points = [(350, 130), (360, 200), (380, 350)]
        dwg.add(dwg.polyline(points=nerve_points,
                            stroke=self.colors['nerve'],
                            stroke_width=4,
                            fill='none',
                            stroke_linecap='round',
                            stroke_dasharray='2,2'))
        dwg.add(dwg.text('N. femoralis', 
                        insert=(370, 140), 
                        font_size='12px',
                        fill=self.colors['nerve']))
        
        # Лимфатические узлы (зеленые кружки)
        lymph_nodes = [(280, 160), (320, 180), (290, 220)]
        for node in lymph_nodes:
            dwg.add(dwg.circle(center=node, r=4, fill='#00aa00', opacity=0.6))
        dwg.add(dwg.text('Nodi lymphoidei', 
                        insert=(340, 220), 
                        font_size='10px',
                        fill='#00aa00'))
        
        # Зона пункции (зеленый прямоугольник с прозрачностью)
        dwg.add(dwg.rect(insert=(280, 120), size=(40, 60),
                        fill='green', opacity=0.2, stroke='green'))
        dwg.add(dwg.text('Зона безопасной пункции', 
                        insert=(300, 115), 
                        font_size='10px',
                        text_anchor='middle',
                        fill='green'))
        
        # Легенда
        legend_y = 700
        dwg.add(dwg.text('Легенда:', insert=(50, legend_y), font_size='14px', font_weight='bold'))
        
        items = [
            (self.colors['artery'], 'Артерия'),
            (self.colors['vein'], 'Вена'),
            (self.colors['nerve'], 'Нерв'),
        ]
        
        for idx, (color, label) in enumerate(items):
            y = legend_y + 25 + idx * 20
            dwg.add(dwg.line(start=(50, y), end=(80, y), stroke=color, stroke_width=4))
            dwg.add(dwg.text(label, insert=(90, y+4), font_size='12px'))
        
        dwg.save()
        print(f"Generated: {filename}")

    def generate_aorta_branches(self, filename: str = "aorta_branches.svg"):
        """Генерация схемы ветвей брюшной аорты"""
        dwg = svgwrite.Drawing(filename, size=(800, 1000), profile='tiny')
        
        # Брюшная аорта (вертикальная)
        aorta_x = 400
        aorta_top = 100
        aorta_bottom = 800
        
        # Основной ствол аорты с сегментами
        segments = [
            (100, 180, 'Suprarenal (Zumm I)', 25),      # Надпочечный
            (180, 260, 'Pararenal (Zumm II)', 22),       # Почечный
            (260, 450, 'Infrarenal (Zumm III)', 20),     # Подпочечный
            (450, 550, 'Bifurcation zone', 18),          # Бифуркация
        ]
        
        for y_start, y_end, label, width in segments:
            # Сосуд
            dwg.add(dwg.line(start=(aorta_x, y_start), end=(aorta_x, y_end),
                           stroke=self.colors['artery'], 
                           stroke_width=width,
                           stroke_linecap='butt'))
            
            # Подпись сегмента
            dwg.add(dwg.text(label, 
                           insert=(aorta_x + 30, (y_start + y_end)/2),
                           font_size='11px',
                           fill='#666'))
        
        # Ветви (почечные артерии)
        # Левая почечная артерия
        left_renal_y = 220
        dwg.add(dwg.line(start=(aorta_x, left_renal_y), 
                        end=(aorta_x - 80, left_renal_y),
                        stroke=self.colors['artery'], 
                        stroke_width=6))
        dwg.add(dwg.text('A. renalis sinistra', 
                        insert=(aorta_x - 140, left_renal_y),
                        font_size='12px'))
        
        # Правая почечная артерия (длиннее, проходит за ИВС)
        right_renal_y = 240
        dwg.add(dwg.path(d=f'M {aorta_x} {right_renal_y} Q {aorta_x+40} {right_renal_y} {aorta_x+80} {right_renal_y-20} L {aorta_x+120} {right_renal_y-20}',
                        stroke=self.colors['artery'], 
                        stroke_width=6,
                        fill='none'))
        dwg.add(dwg.text('A. renalis dextra', 
                        insert=(aorta_x + 130, right_renal_y - 25),
                        font_size='12px'))
        
        # Чревный ствол
        celiac_y = 140
        dwg.add(dwg.line(start=(aorta_x, celiac_y), 
                        end=(aorta_x - 60, celiac_y - 30),
                        stroke=self.colors['artery'], 
                        stroke_width=7))
        dwg.add(dwg.text('Truncus coeliacus', 
                        insert=(aorta_x - 80, celiac_y - 35),
                        font_size='12px',
                        font_weight='bold'))
        
        # Верхняя брыжеечная артерия
        mesenteric_y = 300
        dwg.add(dwg.line(start=(aorta_x, mesenteric_y), 
                        end=(aorta_x - 50, mesenteric_y + 40),
                        stroke=self.colors['artery'], 
                        stroke_width=8))
        dwg.add(dwg.text('A. mesenterica superior', 
                        insert=(aorta_x - 90, mesenteric_y + 50),
                        font_size='12px'))
        
        # Нижняя брыжеечная артерия
        inferior_mes_y = 480
        dwg.add(dwg.line(start=(aorta_x, inferior_mes_y), 
                        end=(aorta_x - 40, inferior_mes_y + 30),
                        stroke=self.colors['artery'], 
                        stroke_width=6))
        dwg.add(dwg.text('A. mesenterica inferior', 
                        insert=(aorta_x - 70, inferior_mes_y + 40),
                        font_size='11px'))
        
        # Общие подвздошные артерии (бифуркация)
        dwg.add(dwg.line(start=(aorta_x, 550), 
                        end=(aorta_x - 100, 650),
                        stroke=self.colors['artery'], 
                        stroke_width=12))
        dwg.add(dwg.line(start=(aorta_x, 550), 
                        end=(aorta_x + 100, 650),
                        stroke=self.colors['artery'], 
                        stroke_width=12))
        
        dwg.add(dwg.text('A. iliaca communis dextra', 
                        insert=(aorta_x + 110, 660),
                        font_size='12px'))
        dwg.add(dwg.text('A. iliaca communis sinistra', 
                        insert=(aorta_x - 110, 660),
                        font_size='12px',
                        text_anchor='end'))
        
        # Анатомические ориентиры (силуэты)
        # Позвоночник (сзади, серый)
        for i in range(5):
            y = 200 + i * 100
            dwg.add(dwg.rect(insert=(aorta_x - 15, y), size=(30, 80),
                           fill='#cccccc', opacity=0.5, rx=5))
            dwg.add(dwg.text(f'L{i+1}', insert=(aorta_x, y + 40),
                           font_size='10px',
                           text_anchor='middle',
                           fill='#666'))
        
        # Топографические подсказки
        dwg.add(dwg.text('Передняя поверхность: Брюшинная полость (брюшные органы)',
                        insert=(50, 50),
                        font_size='11px',
                        fill='#666'))
        dwg.add(dwg.text('Задняя поверхность: Тела поясничных позвонков',
                        insert=(50, 70),
                        font_size='11px',
                        fill='#666'))
        
        dwg.save()
        print(f"Generated: {filename}")

# Использование
if __name__ == "__main__":
    gen = AnatomySVGGenerator()
    gen.generate_femoral_triangle()
    gen.generate_aorta_branches()
    
    # Генерация для всех сосудов из базы
    with open('vessels.json', 'r', encoding='utf-8') as f:
        vessels = json.load(f)
    
    for vessel in vessels:
        if 'femoral' in vessel['latin_name'].lower():
            gen.generate_femoral_triangle(f"{vessel['id']}_diagram.svg")
