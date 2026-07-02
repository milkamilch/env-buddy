#!/bin/bash

# Farben
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

ROOT="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
    echo -e "\n${RED}Stopping...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

# Alte Instanzen beenden
echo -e "${RED}Killing old instances...${NC}"
pkill -f "uvicorn app.main:app" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 1

echo -e "${BLUE}Starting Backend...${NC}"
cd "$ROOT/backend"
source venv/bin/activate
# Auto-detect Colima socket if DOCKER_HOST not set and default socket missing
if [ -z "$DOCKER_HOST" ] && [ ! -S /var/run/docker.sock ] && [ -S "$HOME/.colima/default/docker.sock" ]; then
    export DOCKER_HOST="unix://$HOME/.colima/default/docker.sock"
    echo -e "${BLUE}Using Colima socket: $DOCKER_HOST${NC}"
fi
uvicorn app.main:app --reload &
BACKEND_PID=$!

echo -e "${GREEN}Starting Frontend...${NC}"
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

echo -e "\n${GREEN}App running!${NC}"
echo -e "  Backend:  http://localhost:8000"
echo -e "  Frontend: http://localhost:5173"
echo -e "\nPress Ctrl+C to stop.\n"

wait $BACKEND_PID $FRONTEND_PID
