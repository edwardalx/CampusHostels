# Dockerfile inside backend-admin

FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy requirements from the current context
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy all project files from the current context
COPY . .

# Expose Django port
EXPOSE 8000

# Run Django development server
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
