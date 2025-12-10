# Manual Database Schema Setup

## Problem
Prisma's schema engine is failing in Alpine Linux. We'll use SQL scripts instead.

## Solution: Use SQL Scripts Directly

I've created a complete SQL schema script that will run automatically when PostgreSQL starts.

## Quick Fix - Run This

```bash
cd /path/to/docker/UniversoteBook

# Step 1: Stop containers
sudo docker compose down

# Step 2: Remove database volume (fresh start with SQL script)
sudo docker volume rm universotebook_postgres_data

# Step 3: Start containers (SQL script will run automatically)
sudo docker compose up -d

# Step 4: Wait for PostgreSQL to initialize (30 seconds)
sleep 30

# Step 5: Verify tables were created
sudo docker compose exec postgres psql -U notebook_user -d codlabstudio -c "\dt"

# Step 6: Generate Prisma client (still needed for backend)
sudo docker compose exec backend npm run db:generate

# Step 7: Restart backend
sudo docker compose restart backend

# Step 8: Wait and check backend
sleep 5
curl http://localhost:3001/api/health
```

## Verify Schema Was Created

Check if all tables exist:

```bash
sudo docker compose exec postgres psql -U notebook_user -d codlabstudio -c "\dt"
```

Should show:
- users
- notebooks
- executions
- debug_sessions
- files
- audit_logs

## If SQL Script Doesn't Run Automatically

If the init script doesn't run, execute it manually:

```bash
# Copy SQL script into container and run it
sudo docker compose exec postgres psql -U notebook_user -d codlabstudio < database/init/02-schema.sql

# Or run it directly
sudo docker compose exec -T postgres psql -U notebook_user -d codlabstudio < database/init/02-schema.sql
```

## What Changed

- Created `database/init/02-schema.sql` with complete schema
- Re-enabled init mount in docker-compose.yml
- SQL script runs automatically when PostgreSQL first starts
- Prisma client still needs to be generated (just for TypeScript types)

## After Setup

1. Database schema is created via SQL
2. Prisma client is generated for TypeScript
3. Backend should start successfully
4. Registration should work

