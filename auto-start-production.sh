#!/bin/bash

# PostInAI Production Auto-Start Script
# This script starts both frontend and backend services using PM2

set -e

echo "🚀 Starting PostInAI Production Services..."

# Change to project directory
cd /home/LinkedInContentSaaS

# Activate Python virtual environment (for backend)
source backend/venv/bin/activate

# Start backend with PM2
echo "📦 Starting backend service..."
pm2 start ecosystem.config.js --only postinai-backend

# Start frontend with PM2
echo "🌐 Starting frontend service..."
pm2 start ecosystem.config.js --only postinai-frontend

# Save PM2 process list
pm2 save

# Show status
echo ""
echo "✅ Services started! Current PM2 status:"
pm2 list

echo ""
echo "📋 To view logs:"
echo "   Backend:  pm2 logs postinai-backend"
echo "   Frontend: pm2 logs postinai-frontend"
echo ""
echo "🔄 To restart services:"
echo "   pm2 restart postinai-backend postinai-frontend"
echo ""
