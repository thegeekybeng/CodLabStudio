# Utility Scripts

Testing and diagnostic scripts for system verification.

## TEST_BACKEND.sh

Tests backend endpoints and connectivity.

**Usage:**
```bash
bash scripts/utils/TEST_BACKEND.sh
```

**What it does:**
1. Tests health check endpoint (`/health`)
2. Tests registration endpoint (should be disabled)
3. Shows recent backend logs
4. Displays container status

**When to use:**
- After deployment to verify backend is working
- When troubleshooting connection issues
- To verify endpoints are responding correctly

