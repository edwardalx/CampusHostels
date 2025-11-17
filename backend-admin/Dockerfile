FROM python:3.11-slim

WORKDIR /app

# Install build dependencies for psycopg2 and others
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Set environment variables like your systemd service
ENV DJANGO_SETTINGS_MODULE=backend_admin.settings
ENV DEBUG=False

# Expose Gunicorn port
EXPOSE 8000

# Start Gunicorn with 3 workers, logging to stdout
CMD ["gunicorn", "--access-logfile", "-", "--workers", "3", "--bind", "0.0.0.0:8000", "backend_admin.wsgi:application"]

