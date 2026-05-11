#!/bin/bash

# ProdUS Platform - Stop Script

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}🛑 Stopping ProdUS Services${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

STOPPED=false

# Stop backend
if [ -f /tmp/produs-backend.pid ]; then
    BACKEND_PID=$(cat /tmp/produs-backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${YELLOW}Stopping backend (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID 2>/dev/null
        sleep 2
        kill -9 $BACKEND_PID 2>/dev/null
        echo -e "${GREEN}✓${NC} Backend stopped"
        STOPPED=true
    fi
    rm /tmp/produs-backend.pid
fi

# Stop frontend
if [ -f /tmp/produs-frontend.pid ]; then
    FRONTEND_PID=$(cat /tmp/produs-frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${YELLOW}Stopping frontend (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID 2>/dev/null
        sleep 2
        kill -9 $FRONTEND_PID 2>/dev/null
        echo -e "${GREEN}✓${NC} Frontend stopped"
        STOPPED=true
    fi
    rm /tmp/produs-frontend.pid
fi

# Fallback: Kill by process name
if ! $STOPPED; then
    echo -e "${YELLOW}Searching for running processes...${NC}"
    
    if pkill -f "spring-boot:run"; then
        echo -e "${GREEN}✓${NC} Backend stopped"
        STOPPED=true
    fi
    
    if pkill -f "next-env"; then
        echo -e "${GREEN}✓${NC} Frontend stopped"
        STOPPED=true
    fi
fi

# Check if anything was stopped
if ! $STOPPED; then
    echo -e "${YELLOW}No running services found${NC}"
else
    echo ""
    echo -e "${GREEN}================================${NC}"
    echo -e "${GREEN}✅ All Services Stopped${NC}"
    echo -e "${GREEN}================================${NC}"
fi

echo ""
echo -e "${BLUE}Docker Containers:${NC}"
echo "  PostgreSQL: docker stop produs-db"
echo "  MinIO:      docker stop produs-minio"
echo "  To stop all: docker stop produs-db produs-minio"
echo ""
