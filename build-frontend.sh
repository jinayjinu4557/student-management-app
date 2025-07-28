#!/bin/bash
set -e

echo "=== Frontend Build Script ==="
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

echo ""
echo "Checking if frontend directory exists..."
if [ -d "frontend" ]; then
    echo "✅ frontend directory found"
    echo "Frontend directory contents:"
    ls -la frontend/
    
    echo ""
    echo "Checking if public directory exists in frontend..."
    if [ -d "frontend/public" ]; then
        echo "✅ frontend/public directory found"
        echo "Public directory contents:"
        ls -la frontend/public/
        
        echo ""
        echo "Checking if index.html exists..."
        if [ -f "frontend/public/index.html" ]; then
            echo "✅ index.html found in frontend/public/"
        else
            echo "❌ index.html NOT found in frontend/public/"
            exit 1
        fi
    else
        echo "❌ frontend/public directory NOT found"
        exit 1
    fi
    
    echo ""
    echo "Changing to frontend directory..."
    cd frontend
    
    echo "Current directory after cd: $(pwd)"
    echo "Directory contents after cd:"
    ls -la
    
    echo ""
    echo "Installing dependencies..."
    npm install
    
    echo ""
    echo "Building frontend..."
    npm run build
    
    echo ""
    echo "Build completed successfully!"
    echo "Build directory contents:"
    ls -la build/
    
    echo ""
    echo "Moving back to root..."
    cd ..
    
    echo "Final build directory location:"
    ls -la frontend/build/
else
    echo "❌ frontend directory NOT found"
    echo "Available directories:"
    ls -la
    exit 1
fi 