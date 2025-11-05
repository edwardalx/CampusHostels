# Dockerfile inside backend-admin

FROM python:3.10-slim
WORKDIR /app

# Copy requirements from the current context (backend-admin)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all project files inside backend-admin
COPY . .

EXPOSE 8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
