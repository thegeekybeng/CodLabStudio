#!/bin/bash
# Quick fix script to get backend running
# Run this on your NAS: bash RUN_THIS_NOW.sh

cd /volume2/docker/UniversoteBook

echo "=== Step 1: Stopping containers ==="
sudo docker compose down

echo "=== Step 2: Removing old database volume ==="
sudo docker volume rm universotebook_postgres_data 2>/dev/null || echo "Volume already removed or doesn't exist"

echo "=== Step 3: Starting containers ==="
sudo docker compose up -d

echo "=== Step 4: Waiting for PostgreSQL to initialize (45 seconds) ==="
sleep 45

echo "=== Step 5: Checking PostgreSQL status ==="
if sudo docker compose exec postgres pg_isready -U notebook_user 2>/dev/null; then
    echo "✅ PostgreSQL is ready"
else
    echo "❌ PostgreSQL is not ready - checking logs..."
    sudo docker compose logs postgres | tail -20
    exit 1
fi

echo "=== Step 6: Initializing database schema ==="
sudo docker compose exec backend npm run db:generate
echo "Pushing database schema (this may take a moment)..."
sudo docker compose exec backend npm run db:push

echo "=== Step 7: Checking backend status ==="
sleep 5
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Backend is responding"
else
    echo "❌ Backend is not responding - checking logs..."
    sudo docker compose logs backend | tail -20
    exit 1
fi

echo "=== Step 8: Final status check ==="
sudo docker compose ps

echo ""
echo "=== ✅ Setup Complete ==="
echo "Backend should now be accessible at http://localhost:3001"
echo "Frontend should be accessible at http://localhost:3000"
echo ""
echo "Try registering an account now!"

