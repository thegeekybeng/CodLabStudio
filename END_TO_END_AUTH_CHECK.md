# End-to-End Authentication Flow Analysis

## Flow Analysis

### 1. Frontend Login Page (`frontend/app/login/page.tsx`)

**Line 20**: `await authApi.login(email, password)`
- Calls auth API login method

**Line 23**: Error handling
- Expects: `err.response?.data?.error?.message`
- Backend returns: `{ success: false, error: { message } }` ✅ MATCHES

### 2. Frontend Auth API (`frontend/lib/auth.ts`)

**Line 29**: `api.post('/auth/login', { email, password })`
- Makes POST request to `/api/auth/login`

**Line 30**: `response.data.data.tokens`
- Expects: `{ data: { tokens: { accessToken, refreshToken } } }`
- Backend returns: `{ success: true, data: { user, tokens } }` ✅ MATCHES

**Line 31-32**: Stores tokens in localStorage ✅ CORRECT

### 3. Frontend API Client (`frontend/lib/api.ts`)

**Line 3**: `API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'`
- ⚠️ **ISSUE**: If accessing from another machine, this should be NAS IP

**Line 6**: `baseURL: ${API_URL}/api`
- Full URL: `http://localhost:3001/api` or `http://nas-ip:3001/api`

### 4. Backend Auth Route (`backend/src/routes/auth.ts`)

**Line 28-44**: `/login` endpoint
- ✅ Validates with Zod schema
- ✅ Calls `authService.login(validated)`
- ✅ Returns `{ success: true, data: result }`

### 5. Backend Auth Service (`backend/src/services/auth/authService.ts`)

**Line 83-115**: `login` method
- ✅ Finds user by email
- ✅ Verifies password with bcrypt
- ✅ Generates tokens
- ✅ Returns `{ user, tokens }`

### 6. Backend CORS (`backend/src/index.ts`)

**Line 44**: `origin: process.env.CORS_ORIGIN || 'http://localhost:3000'`
- ⚠️ **ISSUE**: If accessing from NAS IP, CORS will block requests

## Issues Found

### Issue 1: CORS Configuration
**Problem**: CORS_ORIGIN is hardcoded to `http://localhost:3000`
**Impact**: Requests from `http://nas-ip:3000` will be blocked
**Fix**: Update CORS_ORIGIN to allow NAS IP or use wildcard in development

### Issue 2: API URL Configuration
**Problem**: Frontend API_URL defaults to `http://localhost:3001`
**Impact**: If accessing from another machine, frontend can't reach backend
**Fix**: Update NEXT_PUBLIC_API_URL to use NAS IP

### Issue 3: Network Access
**Problem**: Browser runs on user's machine, needs to reach NAS
**Impact**: localhost won't work from remote browser
**Fix**: Use NAS IP address for both CORS and API URL

## Verification Checklist

- [ ] Backend is running on port 3001
- [ ] Frontend is running on port 3000
- [ ] CORS_ORIGIN allows the actual origin
- [ ] NEXT_PUBLIC_API_URL points to accessible backend
- [ ] Network connectivity from browser to NAS
- [ ] Admin user exists in database
- [ ] Login endpoint is accessible
- [ ] Error responses are properly formatted

