#!/bin/bash
echo "=================================================="
echo "Starting CSS-Server (Glass Calculator)"
echo "=================================================="

# Check node_modules
if [ ! -d "node_modules" ]; then
    echo "Installing node dependencies..."
    npm install
fi

# Compile CSS
echo "Compiling modular Sass stylesheets..."
npm run build:css

# Launch Dev server
echo "Launching CSS-Server dev environment..."
npm run dev
