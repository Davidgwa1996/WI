FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY backend/ .

# ✅ CRITICAL: This runs the server and keeps the container alive
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]