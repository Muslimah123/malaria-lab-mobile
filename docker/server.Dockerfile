FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=app.py
ENV FLASK_ENV=production

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgcc-s1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY server/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy server code
COPY server/ .

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 5000

# Run the application
CMD ["python", "app.py"]
