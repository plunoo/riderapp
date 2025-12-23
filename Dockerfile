# ====================
# Backend (Production)
# ====================
FROM python:3.11-slim AS backend

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONPATH=/app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY backend/app/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/app ./app

EXPOSE 8000

# Removed health check temporarily for debugging

# Production command (simplified)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# ====================
# Frontend (Production)
# ====================
FROM node:20-alpine AS frontend-build

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./
RUN npm ci --only=production --include=dev

# Copy source code
COPY frontend ./

# Build for production
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN chmod +x node_modules/.bin/* || true
RUN npx vite build

# Production frontend
FROM nginx:alpine AS frontend

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache curl

# Copy nginx config
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=frontend-build /app/dist /usr/share/nginx/html

# Removed health check temporarily for debugging

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]