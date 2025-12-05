# Scripted Fixes

Automated scripts for fixing common issues.

## FINAL_FIX.sh

Fixes Prisma client generation issues and restarts the backend.

**Usage:**

```bash
cd /volume2/docker/UniversoteBook
bash docs/troubleshooting/scripted-fixes/FINAL_FIX.sh
```

**What it does:**

1. Generates Prisma client
2. Restarts backend
3. Waits for backend to start
4. Tests backend health endpoint
5. Shows container status

**When to use:**

- After rebuilding containers
- When seeing "Prisma client did not initialize" errors
- After database schema changes

**Related documentation:**

- [../documented-changes/FIX_MIGRATION.md](../documented-changes/FIX_MIGRATION.md)
- [../documented-changes/FIX_OPENSSL.md](../documented-changes/FIX_OPENSSL.md)
