# backend_admin/Dockerfile

# 1. Base image
FROM python:3.10-slim

# 2. Set working directory
WORKDIR /app

# 3. Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. Copy project files
COPY . .

# 5. Expose Django port
EXPOSE 8000

# 6. Run Django development server
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
