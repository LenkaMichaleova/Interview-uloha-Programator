FROM php:8.3-cli-alpine

WORKDIR /app

COPY backend /app/backend

# Render injects PORT automatically. Fallback keeps local container runs simple.
CMD ["sh", "-c", "php -S 0.0.0.0:${PORT:-10000} -t /app/backend/public"]
