FROM python:3.12-slim

WORKDIR /app

# Install dependencies first (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy only what the API needs at runtime
COPY ml_api.py .
COPY predictor.py .
COPY metadata.json .
COPY label_mapping.json .
COPY models/v2/LightECGNet_v2_inference.py ./models/v2/LightECGNet_v2_inference.py
COPY models/v2/models/ ./models/v2/models/

EXPOSE 8001

CMD ["uvicorn", "ml_api:app", "--host", "0.0.0.0", "--port", "8001"]
