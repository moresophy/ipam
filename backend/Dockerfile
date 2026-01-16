FROM python:3.9-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directory for database
RUN mkdir -p /data

# Expose port
EXPOSE 5000

# Set environment variables
ENV FLASK_APP=app.py
ENV DATABASE_URI=sqlite:////data/ipam.db

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Run the application
CMD ["/entrypoint.sh"]
