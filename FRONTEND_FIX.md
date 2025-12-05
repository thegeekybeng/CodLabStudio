# Frontend Authentication Fix

## Issues Identified

### Issue 1: CORS Configuration
**Location**: `docker-compose.yml` line 36, `backend/src/index.ts` lines 31, 44
**Problem**: CORS_ORIGIN is `http://localhost:3000` but if accessing from NAS IP, requests will be blocked
**Fix**: Update to allow NAS IP or use environment variable

### Issue 2: API URL Configuration  
**Location**: `docker-compose.yml` line 57, `frontend/lib/api.ts` line 3
**Problem**: NEXT_PUBLIC_API_URL is `http://localhost:3001` but browser needs NAS IP
**Fix**: Update to use NAS IP when accessing remotely

### Issue 3: Response Structure Verification
**Status**: ✅ CORRECT
- Backend returns: `{ success: true, data: { user, tokens } }`
- Frontend expects: `response.data.data.tokens` ✅

### Issue 4: Error Handling
**Status**: ✅ CORRECT  
- Backend returns: `{ success: false, error: { message } }`
- Frontend expects: `err.response?.data?.error?.message` ✅

## Fixes Required

### Fix 1: Update CORS to Allow NAS IP

**Option A: Use Environment Variable (Recommended)**
Update `docker-compose.yml` to use environment variable that can be set to NAS IP.

**Option B: Allow Multiple Origins**
Update backend CORS to accept array of origins.

### Fix 2: Update Frontend API URL

Set `NEXT_PUBLIC_API_URL` to NAS IP in docker-compose.yml or .env file.

### Fix 3: Verify Network Connectivity

Ensure browser can reach:
- Frontend: `http://nas-ip:3000`
- Backend: `http://nas-ip:3001`

