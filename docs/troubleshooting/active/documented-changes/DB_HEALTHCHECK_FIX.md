# PostgreSQL Healthcheck Failure - Diagnostic Guide

## Issue
PostgreSQL container is marked as "unhealthy" and backend won't start.

## Step 1: Check PostgreSQL Logs

First, see what's actually happening:

```bash
cd /path/to/docker/UniversoteBook

# Check PostgreSQL container logs
sudo docker compose logs postgres

# Check if container is running
sudo docker compose ps
```

## Step 2: Common Causes and Fixes

### Cause 1: Volume Permission Issues

If you see permission errors in logs:

```bash
# Stop containers
sudo docker compose down

# Remove the volume (WARNING: deletes database data)
sudo docker volume rm universotebook_postgres_data

# Recreate and start
sudo docker compose up -d
```

### Cause 2: Database Initialization Taking Too Long

The healthcheck might be too strict. Try starting PostgreSQL alone first:

```bash
# Start only PostgreSQL
sudo docker compose up -d postgres

# Wait 30 seconds, then check logs
sudo docker compose logs postgres

# Check health manually
sudo docker compose exec postgres pg_isready -U notebook_user
```

### Cause 3: Corrupted Volume

If the volume is corrupted from a previous failed start:

```bash
# Stop everything
sudo docker compose down

# Remove volume
sudo docker volume rm universotebook_postgres_data

# Start fresh
sudo docker compose up -d
```

### Cause 4: Healthcheck Too Strict

If PostgreSQL is actually running but healthcheck fails, we can make it more lenient.

## Step 3: Temporary Fix - Relax Healthcheck

If PostgreSQL starts but healthcheck is too strict, we can adjust it:

**Option A: Increase retries and timeout**

Edit `docker-compose.yml` and change:
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-notebook_user}"]
  interval: 10s
  timeout: 10s  # Increased from 5s
  retries: 10   # Increased from 5
  start_period: 30s  # Give it time to initialize
```

**Option B: Remove healthcheck temporarily**

Comment out the healthcheck to see if PostgreSQL actually works:
```yaml
# healthcheck:
#   test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-notebook_user}"]
#   interval: 10s
#   timeout: 5s
#   retries: 5
```

And change backend dependency to:
```yaml
depends_on:
  postgres:
    condition: service_started  # Changed from service_healthy
```

## Step 4: Manual Database Verification

Once PostgreSQL container is running:

```bash
# Check if PostgreSQL is actually ready
sudo docker compose exec postgres pg_isready -U notebook_user

# Try connecting
sudo docker compose exec postgres psql -U notebook_user -d codlabstudio -c "SELECT version();"

# Check if init script ran
sudo docker compose exec postgres psql -U notebook_user -d codlabstudio -c "\dx"
```

## Step 5: Check System Resources

PostgreSQL might be failing due to resource constraints:

```bash
# Check disk space
df -h

# Check memory
free -h

# Check Docker resources
sudo docker stats --no-stream
```

## Quick Fix Commands

**Complete reset (deletes all data):**
```bash
sudo docker compose down -v
sudo docker compose up -d
```

**Start PostgreSQL alone to debug:**
```bash
sudo docker compose up -d postgres
sudo docker compose logs -f postgres
```

**Check what's actually wrong:**
```bash
# See container status
sudo docker ps -a | grep codlabstudio-db

# See detailed logs
sudo docker logs codlabstudio-db

# Check if it's actually running
sudo docker exec codlabstudio-db pg_isready -U notebook_user
```

## Next Steps

1. Run the diagnostic commands above
2. Share the PostgreSQL logs output
3. We'll identify the specific issue and fix it

