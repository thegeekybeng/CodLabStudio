# Fix Guest Mode and Login Issues

## Changes Made

### 1. Dashboard Page
- Now checks for guest mode before trying to authenticate
- Creates a guest user object when in guest mode
- Shows "Guest Mode - Temporary access" indicator
- Doesn't try to load notebooks/executions in guest mode

### 2. Home Page
- Checks for guest mode first before authentication
- Allows guest users to access dashboard

### 3. Notebook Page
- Supports guest mode
- Creates guest user object when needed

## Testing

After rebuilding the frontend:

1. **Admin Login:**
   - Email: `admin@universalnotebook.local`
   - Password: `Admin@UniversalNotebook2024!`

2. **Guest Mode:**
   - Click "Continue as Guest" button
   - Should access dashboard without authentication

## Rebuild Frontend

Run on your NAS:

```bash
cd /volume2/docker/UniversoteBook

# Rebuild frontend
sudo docker compose build frontend

# Restart frontend
sudo docker compose restart frontend

# Check logs
sudo docker compose logs frontend | tail -20
```

## Troubleshooting

If login still fails:
1. Check backend is running: `sudo docker compose ps`
2. Check backend logs: `sudo docker compose logs backend | tail -30`
3. Verify admin user was created: Check backend logs for "Admin user created"
4. Test login API directly:
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@universalnotebook.local","password":"Admin@UniversalNotebook2024!"}'
   ```

