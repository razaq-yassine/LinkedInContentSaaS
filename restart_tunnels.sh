#!/bin/bash

# Script to restart Cloudflare tunnels and update configuration

echo "🔄 Restarting Cloudflare Tunnels..."
echo "======================================"

# Kill existing tunnels
killall cloudflared 2>/dev/null
sleep 2

# Start new tunnels
echo "Starting frontend tunnel..."
cloudflared tunnel --url http://localhost:3000 > /tmp/frontend_tunnel.log 2>&1 &
FRONTEND_PID=$!

echo "Starting backend tunnel..."
cloudflared tunnel --url http://localhost:8000 > /tmp/backend_tunnel.log 2>&1 &
BACKEND_PID=$!

echo "Waiting for tunnels to initialize..."
sleep 6

# Extract URLs
FRONTEND_URL=$(grep "trycloudflare.com" /tmp/frontend_tunnel.log | grep -o "https://[^ ]*" | head -1)
BACKEND_URL=$(grep "trycloudflare.com" /tmp/backend_tunnel.log | grep -o "https://[^ ]*" | head -1)

echo ""
echo "✅ Tunnels Restarted!"
echo "======================================"
echo "Frontend URL: $FRONTEND_URL"
echo "Backend URL:  $BACKEND_URL"
echo ""
echo "⚠️  IMPORTANT: Update Google Cloud Console with new redirect URI:"
echo "   $BACKEND_URL/api/auth/google/callback"
echo ""
echo "Save PIDs:"
echo $FRONTEND_PID > /tmp/frontend_tunnel.pid
echo $BACKEND_PID > /tmp/backend_tunnel.pid
echo ""
echo "To stop tunnels: killall cloudflared"
echo "======================================"


