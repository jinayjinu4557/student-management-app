#!/bin/bash
set -e

echo "Current directory: $(pwd)"
echo "Listing contents:"
ls -la

echo "Changing to frontend directory..."
cd frontend

echo "Frontend directory contents:"
ls -la

echo "Installing dependencies..."
npm install

echo "Building frontend..."
npm run build

echo "Build completed. Build directory contents:"
ls -la build/

echo "Moving back to root..."
cd ..

echo "Final build directory location:"
ls -la frontend/build/ 