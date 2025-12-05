# Fix PostgreSQL Init Directory Permissions

## Issue
PostgreSQL container can't read `/docker-entrypoint-initdb.d/` due to permission issues.

## Solution 1: Fix Permissions (Recommended)

Run these commands on your NAS:

```bash
cd /volume2/docker/UniversoteBook

# Fix permissions on database/init directory
sudo chmod -R 755 database/init
sudo chown -R $(id -u):$(id -g) database/init

# Or make it world-readable (simpler)
sudo chmod -R 755 database/init

# Restart containers
sudo docker compose down
sudo docker compose up -d
```

## Solution 2: Remove Init Mount (Quick Fix)

If permissions are still problematic, the init script is optional (Prisma handles migrations). You can temporarily remove the mount:

**Edit `docker-compose.yml` and comment out the init mount:**
```yaml
volumes:
  - postgres_data:/var/lib/postgresql/data
  # - ./database/init:/docker-entrypoint-initdb.d  # Commented out due to permissions
```

Then:
```bash
sudo docker compose down
sudo docker compose up -d
```

The UUID extension can be enabled later via Prisma migrations if needed.

## Solution 3: Use Read-Only Mount

Make the mount read-only to avoid permission issues:

**Edit `docker-compose.yml`:**
```yaml
volumes:
  - postgres_data:/var/lib/postgresql/data
  - ./database/init:/docker-entrypoint-initdb.d:ro
```

## Verify Fix

After applying a solution:

```bash
# Check PostgreSQL logs (should not see permission errors)
sudo docker compose logs postgres

# Check container status
sudo docker compose ps

# Verify PostgreSQL is healthy
sudo docker compose exec postgres pg_isready -U notebook_user
```

