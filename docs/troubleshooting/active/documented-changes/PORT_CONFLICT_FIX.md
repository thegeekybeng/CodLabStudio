# Port Conflict Fix - PostgreSQL

## Issue

Ports 5432 and 5433 are already in use on your NAS (likely another PostgreSQL instance).

## Solution: Remove External Port Mapping (Applied)

Since the backend connects to PostgreSQL via Docker's internal network, we don't need to expose PostgreSQL externally.

**The `docker-compose.yml` has been updated to remove the port mapping.**

**Why this works:**

- Backend container connects using service name `postgres:5432`
- This uses Docker's internal network (not external ports)
- No port conflicts, and more secure (PostgreSQL not exposed)

**Steps:**

1. Restart containers:
   ```bash
   sudo docker compose down
   sudo docker compose up -d
   ```

**Note**: PostgreSQL will only be accessible from within the Docker network. If you need external access, see Option 2 or 3 below.

### Option 2: Stop Existing PostgreSQL

If you want to use port 5432, stop the existing PostgreSQL service:

```bash
# Find what's using port 5432
sudo lsof -i :5432
# or
sudo netstat -tulpn | grep 5432

# Stop the service (example commands, adjust based on your NAS)
sudo systemctl stop postgresql
# or
sudo service postgresql stop
```

Then restart Docker containers:

```bash
sudo docker compose up -d
```

### Option 3: Use Existing PostgreSQL

If you have an existing PostgreSQL and want to use it instead:

1. **Update `.env` file:**

   ```bash
   DATABASE_URL=postgresql://username:password@host:5432/database_name
   ```

2. **Remove PostgreSQL service from docker-compose.yml:**

   - Comment out or remove the `postgres` service
   - Remove `depends_on: postgres` from backend service
   - Update `DATABASE_URL` to point to your existing PostgreSQL

3. **Restart:**
   ```bash
   sudo docker compose up -d
   ```

## Verify Fix

After applying the fix:

```bash
# Check containers are running
sudo docker compose ps

# Check logs
sudo docker compose logs postgres

# Test database connection
sudo docker compose exec backend npm run db:generate
sudo docker compose exec backend npm run db:migrate
```

## Current Configuration

- **PostgreSQL**: No external port (internal Docker network only, port 5432)
- **Backend**: Port 3001
- **Frontend**: Port 3000

**PostgreSQL is accessible only from within Docker containers via the service name `postgres` on port 5432.**
