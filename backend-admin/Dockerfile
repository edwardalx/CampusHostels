# backend-admin/Dockerfile

FROM python:3.10-slim
WORKDIR /app

# Install dependencies
COPY backend_admin/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Django project
COPY backend_admin/ .

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
