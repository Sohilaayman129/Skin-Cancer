FROM python:3.11-slim

WORKDIR /app

# Install system dependencies needed for compiling native extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy source code, documents, and sample guidelines
COPY backend/ ./backend/
COPY skin-cancer-counseling-final-recommendation.pdf ./
COPY atsdr-toxicological-profile-h2s-cos.txt ./

# Environment variables
ENV PYTHONUNBUFFERED=1 \
    PORT=8000

EXPOSE 8000

# Run FastAPI via Uvicorn
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
