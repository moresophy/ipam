#!/bin/bash
set -e

# Function to check database connection
wait_for_db() {
    echo "Waiting for database..."
    while ! python -c "import socket; s = socket.socket(socket.AF_INET, socket.SOCK_STREAM); s.connect(('postgres', 5432))" 2>/dev/null; do
        sleep 1
    done
    echo "Database started"
}

# Wait for DB to be ready
wait_for_db

# Initialize DB and create admin user if it doesn't exist
python -c "
from app import app, db
from models import User

with app.app_context():
    db.create_all()
    if not User.query.filter_by(username='admin').first():
        print('Creating default admin user...')
        admin = User(username='admin')
        admin.set_password('password')
        db.session.add(admin)
        db.session.commit()
        print('Admin user created.')
    else:
        print('Admin user already exists.')
"

# Start the application
exec gunicorn --bind 0.0.0.0:5000 app:app
