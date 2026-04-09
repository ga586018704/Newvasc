FROM tensorflow/tensorflow:2.15.0-gpu

WORKDIR /app

# Установка зависимостей
RUN pip install fastapi uvicorn pydicom opencv-python-headless python-multipart pydantic

# Копирование кода
COPY main.py .
COPY models/ /app/models/

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
