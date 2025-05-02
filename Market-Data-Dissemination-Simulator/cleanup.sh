#!/bin/bash

echo "Cleaning up build artifacts and generated files..."

echo "Removing .NET build artifacts..."
rm -rf bin/
rm -rf obj/

echo "Removing node_modules..."
rm -rf api/node_modules/
rm -rf frontend/node_modules/
rm -rf node_modules/

echo "Removing next.js artifacts..."
rm -rf frontend/.next/

echo "Removing macOS helper scripts..."
rm -f *.command

echo "Cleanup complete!"
echo
echo "Note: To restore dependencies, you'll need to run:"
echo "  dotnet restore"
echo "  cd api && npm install"
echo "  cd frontend && npm install"

# Make this script executable with:
# chmod +x cleanup.sh 