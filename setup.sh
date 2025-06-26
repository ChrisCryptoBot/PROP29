#!/bin/bash

echo "========================================"
echo "PROPER 2.9 - Setup Script"
echo "========================================"
echo

echo "Checking prerequisites..."
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python is not installed!"
    echo "Please install Python 3.11+ from https://python.org/"
    exit 1
fi

echo "Prerequisites check passed!"
echo

echo "Installing dependencies..."
echo

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install Node.js dependencies!"
    exit 1
fi

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install frontend dependencies!"
    exit 1
fi
cd ..

# Install Python dependencies
echo "Installing Python dependencies..."
cd backend
pip3 install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install Python dependencies!"
    exit 1
fi
cd ..

echo
echo "Dependencies installed successfully!"
echo

echo "Setting up database..."
echo

# Setup database
npm run setup:database
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to setup database!"
    exit 1
fi

echo
echo "Database setup completed!"
echo

echo "========================================"
echo "Setup completed successfully!"
echo "========================================"
echo
echo "To start the application:"
echo "1. Run: npm start"
echo "2. Open: http://localhost:3000"
echo "3. Login with: admin@proper29.com / admin123"
echo
read -p "Press Enter to start the application now..."

echo
echo "Starting PROPER 2.9..."
echo

# Start the application
npm start 