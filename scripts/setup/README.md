# Setup Scripts

Scripts for initial setup and applying configuration changes.

## APPLY_CHANGES.sh

Applies backend changes including:
- Admin account seeding
- Registration disabling
- Guest mode support

**Usage:**
```bash
bash scripts/setup/APPLY_CHANGES.sh
```

**What it does:**
1. Rebuilds backend with new changes
2. Restarts backend
3. Checks for admin creation
4. Tests login endpoint
5. Verifies registration is disabled

## RUN_THIS_NOW.sh

Complete initial setup script for fresh deployment.

**Usage:**
```bash
bash scripts/setup/RUN_THIS_NOW.sh
```

**What it does:**
1. Stops all containers
2. Removes old database volume
3. Starts containers fresh
4. Waits for PostgreSQL initialization
5. Generates Prisma client
6. Pushes database schema
7. Verifies backend is responding

**Note:** This script performs a complete reset. Use with caution in production.

