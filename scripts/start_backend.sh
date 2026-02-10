#!/bin/bash
echo "=== PROPER29 STARTUP SCRIPT ==="
echo "Current directory: $(pwd)"
echo "Listing directory contents:"
ls -la

echo "Checking for Python environment..."
if [ -d "/opt/venv" ]; then
    echo "Found /opt/venv, activating..."
    source /opt/venv/bin/activate
elif [ -d ".venv" ]; then
    echo "Found .venv, activating..."
    source .venv/bin/activate
else
    echo "No virtual environment found in standard locations."
fi

echo "Python version:"
python --version || echo "python not found"
python3 --version || echo "python3 not found"

echo "Checking installed packages (looking for uvicorn):"
pip list | grep uvicorn || echo "uvicorn not found in pip list"

echo "Starting Application with python -m uvicorn..."
# We use python -m uvicorn to ensure we use the installed module
exec python -m uvicorn backend.main:app --host 0.0.0.0 --port $PORT
