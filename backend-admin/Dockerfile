FROM python:3.10-slim

WORKDIR /app

# Install build dependencies for psycopg2
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY backend-admin/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY backend-admin/ .

EXPOSE 8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
