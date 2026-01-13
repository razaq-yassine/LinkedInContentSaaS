#!/bin/bash

echo "🌐 Starting Cloudflare Quick Tunnels..."
echo "======================================"

# Start frontend tunnel and capture URL
echo "Starting frontend tunnel (port 3000)..."
cloudflared tunnel --url http://localhost:3000 > /tmp/frontend_tunnel.log 2>&1 &
FRONTEND_TUNNEL_PID=$!

# Start backend tunnel and capture URL  
echo "Starting backend tunnel (port 8000)..."
cloudflared tunnel --url http://localhost:8000 > /tmp/backend_tunnel.log 2>&1 &
BACKEND_TUNNEL_PID=$!

echo "Waiting for tunnels to initialize..."
sleep 5

# Extract URLs from logs
FRONTEND_URL=$(grep -oP 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' /tmp/frontend_tunnel.log | head -1)
BACKEND_URL=$(grep -oP 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' /tmp/backend_tunnel.log | head -1)

echo ""
echo "✅ Tunnels are running!"
echo "======================================"
echo "Frontend URL: $FRONTEND_URL"
echo "Backend URL:  $BACKEND_URL"
echo ""
echo "Tunnel PIDs:"
echo "  Frontend: $FRONTEND_TUNNEL_PID"
echo "  Backend:  $BACKEND_TUNNEL_PID"
echo ""
echo "To stop tunnels, run: pkill -f 'cloudflared tunnel'"
echo "======================================"

# Save PIDs for later cleanup
echo $FRONTEND_TUNNEL_PID > /tmp/frontend_tunnel.pid
echo $BACKEND_TUNNEL_PID > /tmp/backend_tunnel.pid

# Keep script running
wait




