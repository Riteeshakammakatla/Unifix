#!/bin/bash
# Shell script to start Django backend on macOS/Linux

# Check if .venv exists, if not create and install requirements
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
    source .venv/bin/activate
    echo "Installing requirements..."
    pip install -r backend/requirements.txt
else
    source .venv/bin/activate
fi

cd backend

echo "Running migrations..."
python3 manage.py migrate

echo "Bootstrapping admin account..."
# We check if create_admin command exists before running
python3 manage.py create_admin || echo "Admin creation skipped or command not found"

echo "Starting Django server..."
python3 manage.py runserver
