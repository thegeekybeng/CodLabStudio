# Fix Registration Issue - Backend Connection

## Root Cause
Registration fails because the backend isn't running. The backend can't start because PostgreSQL has permission issues.

## Step-by-Step Fix

### Step 1: Fix PostgreSQL Permissions

Run these commands on your NAS:

```bash
cd /volume2/docker/UniversoteBook

# Fix permissions on database/init directory
sudo chmod -R 755 database/init

# Stop all containers
sudo docker compose down

# Start containers again
sudo docker compose up -d
```

### Step 2: Verify PostgreSQL is Running

```bash
# Check PostgreSQL logs (should NOT see permission errors)
sudo docker compose logs postgres | tail -20

# Check if PostgreSQL is healthy
sudo docker compose exec postgres pg_isready -U notebook_user

# Check container status
sudo docker compose ps
```

**Expected output:** PostgreSQL container should show "healthy" status.

### Step 3: Verify Backend is Running

```bash
# Check backend logs
sudo docker compose logs backend | tail -30

# Check if backend is running
sudo docker compose ps | grep backend

# Test backend API
curl http://localhost:3001/api/health || echo "Backend not responding"
```

**Expected:** Backend container should be running and API should respond.

### Step 4: Initialize Database Schema

If PostgreSQL is running but database isn't initialized:

```bash
# Generate Prisma client
sudo docker compose exec backend npm run db:generate

# Run migrations
sudo docker compose exec backend npm run db:migrate
```

### Step 5: Verify Frontend Can Connect

**If accessing from the NAS itself:**
- Frontend should work at `http://localhost:3000`
- Backend should be at `http://localhost:3001`

**If accessing from another computer:**
- Replace `localhost` with your NAS IP address
- Example: `http://your-nas-ip:3000`

**Check frontend configuration:**
```bash
# Verify frontend environment
sudo docker compose exec frontend printenv | grep NEXT_PUBLIC
```

Should show:
- `NEXT_PUBLIC_API_URL=http://localhost:3001`
- `NEXT_PUBLIC_WS_URL=ws://localhost:3001`

**If accessing from another machine, you may need to update these to use your NAS IP.**

### Step 6: Test Registration

1. Open browser to `http://your-nas-ip:3000` (or `http://localhost:3000` if on NAS)
2. Try registering with:
   - Email: your-email@example.com
   - Password: at least 12 characters

## Troubleshooting

### If PostgreSQL Still Fails

**Option A: Remove init mount temporarily**
```bash
# Edit docker-compose.yml
sudo nano docker-compose.yml

# Comment out this line (around line 14):
# - ./database/init:/docker-entrypoint-initdb.d:ro

# Save and restart
sudo docker compose down
sudo docker compose up -d
```

**Option B: Reset database volume**
```bash
sudo docker compose down -v
sudo docker compose up -d
sudo docker compose exec backend npm run db:generate
sudo docker compose exec backend npm run db:migrate
```

### If Backend Still Won't Start

```bash
# Check backend logs for errors
sudo docker compose logs backend

# Common issues:
# - Database connection failed → PostgreSQL not ready
# - Port 3001 in use → Change port in docker-compose.yml
# - Missing dependencies → Rebuild: sudo docker compose build backend
```

### If Frontend Can't Connect

**Check network connectivity:**
```bash
# From frontend container, test backend
sudo docker compose exec frontend wget -O- http://backend:3001/api/health

# Check if ports are exposed
sudo netstat -tulpn | grep -E '3000|3001'
```

**Update frontend API URL if needed:**
- If accessing from another machine, update `NEXT_PUBLIC_API_URL` in docker-compose.yml to use NAS IP
- Or create a `.env` file in frontend directory

## Quick Status Check

Run this to see everything at once:
```bash
echo "=== Container Status ==="
sudo docker compose ps

echo -e "\n=== PostgreSQL Health ==="
sudo docker compose exec postgres pg_isready -U notebook_user 2>/dev/null && echo "PostgreSQL is ready" || echo "PostgreSQL is NOT ready"

echo -e "\n=== Backend API ==="
curl -s http://localhost:3001/api/health 2>/dev/null && echo "Backend is responding" || echo "Backend is NOT responding"

echo -e "\n=== Recent Errors ==="
sudo docker compose logs --tail=10 | grep -i error
```

## Expected Final State

After fixes:
- ✅ PostgreSQL: Running and healthy
- ✅ Backend: Running on port 3001
- ✅ Frontend: Running on port 3000
- ✅ Database: Schema initialized
- ✅ Registration: Should work

