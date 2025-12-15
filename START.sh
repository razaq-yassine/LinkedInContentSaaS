#!/bin/bash

# LinkedIn Content SaaS - Development Startup Script

echo "🚀 Starting LinkedIn Content SaaS..."
echo "=================================="

# Colors
RED='\033[0:31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if MySQL is running
echo -e "\n${YELLOW}1. Checking MySQL...${NC}"
if ! mysql -u root -e "SELECT 1" &> /dev/null; then
    echo -e "${RED}❌ MySQL is not running${NC}"
    echo -e "${YELLOW}Starting MySQL...${NC}"
    brew services start mysql || mysql.server start
    sleep 3
    
    if mysql -u root -e "SELECT 1" &> /dev/null; then
        echo -e "${GREEN}✅ MySQL started${NC}"
    else
        echo -e "${RED}❌ Failed to start MySQL. Please start it manually.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ MySQL is running${NC}"
fi

# Initialize database if needed
echo -e "\n${YELLOW}2. Checking database...${NC}"
cd "$(dirname "$0")"

if ! mysql -u root -e "USE linkedin_content_saas" &> /dev/null; then
    echo -e "${YELLOW}Database not found. Initializing...${NC}"
    
    # Activate venv and run seed script
    cd backend
    if [ ! -d "venv" ]; then
        echo -e "${YELLOW}Creating Python virtual environment...${NC}"
        python3 -m venv venv
    fi
    
    source venv/bin/activate
    pip install -q -r requirements.txt
    
    cd ..
    python database/seed_data.py
else
    echo -e "${GREEN}✅ Database exists${NC}"
fi

# Check environment variables
echo -e "\n${YELLOW}3. Checking configuration...${NC}"

if [ ! -f "backend/.env" ]; then
    echo -e "${RED}❌ backend/.env not found${NC}"
    echo -e "${YELLOW}Creating template...${NC}"
    cat > backend/.env << EOF
DATABASE_URL=mysql+pymysql://root@localhost:3306/linkedin_content_saas
OPENAI_API_KEY=sk-your-key-here
JWT_SECRET_KEY=$(openssl rand -hex 32)
FRONTEND_URL=http://localhost:3000
EOF
    echo -e "${YELLOW}⚠️  Please add your OpenAI API key to backend/.env${NC}"
fi

if [ ! -f "frontend/.env.local" ]; then
    echo -e "${YELLOW}Creating frontend/.env.local...${NC}"
    cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF
fi

echo -e "${GREEN}✅ Configuration ready${NC}"

# Start backend in background
echo -e "\n${YELLOW}4. Starting backend...${NC}"
cd backend
source venv/bin/activate
python -m app.main &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
echo "   Backend: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"

# Wait for backend to be ready
echo -e "\n${YELLOW}5. Waiting for backend to be ready...${NC}"
sleep 3

# Start frontend in background
echo -e "\n${YELLOW}6. Starting frontend...${NC}"
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"
echo "   Frontend: http://localhost:3000"

echo -e "\n${GREEN}=================================="
echo -e "✅ LinkedIn Content SaaS is running!${NC}"
echo -e "=================================="
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Store PIDs for cleanup
echo $BACKEND_PID > /tmp/linkedin_saas_backend.pid
echo $FRONTEND_PID > /tmp/linkedin_saas_frontend.pid

# Wait for user to stop
trap "echo ''; echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; rm /tmp/linkedin_saas_*.pid 2>/dev/null; exit" INT

# Keep script running
wait


