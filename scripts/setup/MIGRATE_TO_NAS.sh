#!/bin/bash
# Script to help migrate CodLabStudio to NAS
# Run this on your NAS after cloning the repository

set -e

echo "=========================================="
echo "CodLabStudio NAS Migration Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}Warning: This script should be run with sudo for proper permissions${NC}"
    echo "Continuing anyway..."
    echo ""
fi

# Get NAS IP (if not set)
if [ -z "$NAS_IP" ]; then
    echo "Please enter your NAS IP address (e.g., 192.168.1.x):"
    read -r NAS_IP
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    cat > .env << EOF
# Database Configuration
POSTGRES_USER=notebook_user
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
POSTGRES_DB=codlabstudio
POSTGRES_PORT=5432

# Backend Configuration
JWT_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
BCRYPT_ROUNDS=12

# CORS and API URLs
CORS_ORIGIN=http://localhost:3000,http://${NAS_IP}:3000
NEXT_PUBLIC_API_URL=http://${NAS_IP}:3001
NEXT_PUBLIC_WS_URL=ws://${NAS_IP}:3001

# Admin Account
ADMIN_EMAIL=admin@codlabstudio.local
ADMIN_PASSWORD=Admin@CodLabStudio2024!
EOF
    echo -e "${GREEN}.env file created with secure random passwords${NC}"
    echo ""
else
    echo -e "${GREEN}.env file already exists${NC}"
    echo ""
fi

# Set permissions on database init scripts
echo "Setting permissions on database init scripts..."
chmod -R 755 database/init
echo -e "${GREEN}✓ Database init permissions set${NC}"

# Create repos directory for Git feature
echo "Creating repos directory..."
mkdir -p repos
chmod 777 repos
echo -e "${GREEN}✓ Repos directory created${NC}"

# Check Docker and Docker Compose
echo ""
echo "Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}✗ Docker Compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose are installed${NC}"

# Check if containers are already running
echo ""
echo "Checking for existing containers..."
if docker ps -a | grep -q "codlabstudio"; then
    echo -e "${YELLOW}Existing CodLabStudio containers found${NC}"
    echo "Do you want to stop and remove them? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "Stopping existing containers..."
        docker compose down
        echo -e "${GREEN}✓ Existing containers stopped${NC}"
    fi
fi

# Start services
echo ""
echo "Starting CodLabStudio services..."
docker compose up -d

# Wait for services to be healthy
echo ""
echo "Waiting for services to start..."
sleep 10

# Check service status
echo ""
echo "Checking service status..."
docker compose ps

# Health check
echo ""
echo "Performing health checks..."

# Check database
if docker compose exec -T postgres pg_isready -U notebook_user &> /dev/null; then
    echo -e "${GREEN}✓ Database is ready${NC}"
else
    echo -e "${RED}✗ Database is not ready${NC}"
fi

# Check backend
if curl -s http://localhost:3001/health &> /dev/null; then
    echo -e "${GREEN}✓ Backend is responding${NC}"
else
    echo -e "${YELLOW}⚠ Backend health check failed (may still be starting)${NC}"
fi

# Summary
echo ""
echo "=========================================="
echo "Migration Summary"
echo "=========================================="
echo ""
echo -e "NAS IP: ${GREEN}${NAS_IP}${NC}"
echo -e "Frontend URL: ${GREEN}http://${NAS_IP}:3000${NC}"
echo -e "Backend URL: ${GREEN}http://${NAS_IP}:3001${NC}"
echo ""
echo "Admin Credentials:"
echo -e "  Email: ${GREEN}admin@codlabstudio.local${NC}"
echo -e "  Password: ${GREEN}Admin@CodLabStudio2024!${NC}"
echo ""
echo "Next Steps:"
echo "1. Open http://${NAS_IP}:3000 in your browser"
echo "2. Login with admin credentials or use guest mode"
echo "3. Change the admin password after first login"
echo ""
echo "To view logs:"
echo "  docker compose logs -f"
echo ""
echo "To stop services:"
echo "  docker compose down"
echo ""
echo "=========================================="

