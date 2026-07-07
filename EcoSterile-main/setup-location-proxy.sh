#!/bin/bash
# Quick setup script for Location Proxy Server
# Run this to get everything ready

echo "🚀 EcoSterile Location Proxy - Quick Setup"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo "✅ NPM found: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Dependencies installed successfully!"
    echo ""
    echo "🎉 Setup complete! You can now run the server with:"
    echo ""
    echo "   npm start"
    echo ""
    echo "The server will start on http://localhost:3000"
    echo ""
    echo "Verify it's running by visiting:"
    echo "   http://localhost:3000/health"
    echo ""
else
    echo "❌ Failed to install dependencies"
    exit 1
fi
