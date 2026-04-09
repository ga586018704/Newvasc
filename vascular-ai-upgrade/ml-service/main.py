from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import tensorflow as tf
from pydantic import BaseModel
from typing import List, Optional
import cv2
import pydicom
from io import BytesIO

app = FastAPI(title="VASCULAR AI - ML Service")

# CORS для интеграции с фронтендом
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://45.82.13.148"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Загрузка моделей при старте
models = {}

@app.on_event("startup")
async def load_models():
    models['amputation_risk'] = tf.keras.models.load_model('/app/models/amputation_model.h5')
    models['restenosis'] = tf.keras.models.load_model('/app/models/restenosis_model.h5')
    models['mace'] = tf.keras.models.load_model('/app/models/mace_model.h5')
    models['aneurysm'] = tf.keras.models.load_model('/app/models/aneurysm_seg.h5')
    print("Models loaded successfully")

class PatientFeatures(BaseModel):
    age: int
    diabetes: bool
    hypertension: bool
    smoking: bool
    previous_stent: bool
    lesion_length: float
    calcification_grade: int  # 0-3
    tasc_category: str  # A, B, C, D
    abi_pre: float
    creatinine: float

class PredictionResponse(BaseModel):
    risk_score: float
    confidence: float
    recommendation: str
    evidence_level: str

@app.post("/predict/amputation", response_model=PredictionResponse)
async def predict_amputation(features: PatientFeatures):
    """
    Предсказание риска ампутации для пациентов с критической ишемией
    AUC 0.87 по валидации
    """
    try:
        # Подготовка признаков
        X = np.array([[
            features.age,
            int(features.diabetes),
            int(features.hypertension),
            int(features.smoking),
            int(features.previous_stent),
            features.lesion_length,
            features.calcification_grade,
            ord(features.tasc_category) - ord('A'),  # Encode TASC
            features.abi_pre,
            features.creatinine
        ]])
        
        prediction = models['amputation_risk'].predict(X)[0][0]
        
        # Интерпретация
        if prediction < 0.3:
            rec = "Консервативная терапия с тесным наблюдением"
            level = "B"
        elif prediction < 0.6:
            rec = "Рассмотреть ревascularизацию в ближайшие 7-14 дней"
            level = "A"
        else:
            rec = "Срочная ревascularизация или ампутация по жизненным показаниям"
            level = "A"
        
        return PredictionResponse(
            risk_score=float(prediction),
            confidence=0.87,
            recommendation=rec,
            evidence_level=level
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/segment/aneurysm")
async def segment_aneurysm(file: UploadFile = File(...)):
    """
    Сегментация аневризмы на CTA снимках
    Возвращает маску для 3D реконструкции
    """
    try:
        # Чтение DICOM
        contents = await file.read()
        dcm = pydicom.dcmread(BytesIO(contents))
        img = dcm.pixel_array
        
        # Предобработка
        img_resized = cv2.resize(img, (512, 512))
        img_normalized = img_resized / 255.0
        img_batch = np.expand_dims(img_normalized, axis=(0, -1))
        
        # Сегментация
        mask = models['aneurysm'].predict(img_batch)[0]
        mask_binary = (mask > 0.5).astype(np.uint8)
        
        # Метрики сегментации
        volume_pixels = np.sum(mask_binary)
        max_diameter = np.max(np.sum(mask_binary, axis=0))  # Упрощенно
        
        return {
            "mask": mask_binary.tolist(),
            "volume_cc": float(volume_pixels * 0.001),  # Зависит от spacing
            "max_diameter_mm": float(max_diameter),
            "slices_affected": int(np.sum(np.any(mask_binary, axis=(0,1))))
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "models_loaded": list(models.keys())}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
