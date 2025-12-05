# Admin Account Setup

## Automatic Admin Creation

When the backend container starts, it automatically creates an admin account if one doesn't exist.

## Default Admin Credentials

- **Email**: `admin@codlabstudio.local`
- **Password**: `Admin@CodLabStudio2024!`
- **Role**: `ADMIN`

## Customize Admin Credentials

Set these environment variables in your `.env` file or `docker-compose.yml`:

```bash
ADMIN_EMAIL=your-admin@email.com
ADMIN_PASSWORD=YourSecurePassword123!
```

## After First Login

**IMPORTANT**: Change the default admin password immediately after first login for security.

## Registration Disabled

- Registration endpoint is disabled (returns 403)
- Only the auto-created admin account can log in
- Guest mode is available for temporary access

## Guest Mode

- Users can access the app in guest mode without authentication
- Guest sessions are temporary
- All file operations and usage are monitored
- Guest data is not persisted permanently

## Security Notes

1. Change default admin password immediately
2. Use strong passwords (12+ characters)
3. Guest mode is for temporary access only
4. All actions are logged in audit logs
