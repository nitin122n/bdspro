# Google OAuth Setup Guide

## Quick Setup

### 1. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Choose "Web application"
6. Add these redirect URIs:
   - `http://localhost:3000/api/auth/google` (for development)
   - `https://yourdomain.com/api/auth/google` (for production)

### 2. Create Environment File

Create a `.env.local` file in your project root with:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# JWT Configuration
JWT_SECRET=demo_jwt_secret_key_for_development
JWT_REFRESH_SECRET=demo_refresh_secret_key_for_development

# Database Configuration
MYSQL_HOST=hopper.proxy.rlwy.net
MYSQL_PORT=50359
MYSQL_USER=root
MYSQL_PASSWORD=QxNkIyShqDFSigZzxHaxiyZmqtzekoXL
MYSQL_DATABASE=railway

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Replace Credentials

Replace `your_google_client_id_here` and `your_google_client_secret_here` with your actual Google OAuth credentials.

### 4. Restart Server

```bash
npm run dev
```

### 5. Test

1. Go to `http://localhost:3000/login`
2. Click "Continue with Google"
3. Complete OAuth flow
4. You should be redirected to dashboard

## Features

- ✅ **Access & Refresh Tokens**: 15-minute access tokens, 7-day refresh tokens
- ✅ **Automatic Token Refresh**: No user intervention needed
- ✅ **Secure Storage**: Refresh tokens stored in database
- ✅ **User Creation**: New users automatically created
- ✅ **Existing User Login**: Existing users can sign in with Google

## Troubleshooting

- **"GOOGLE_CLIENT_ID is missing"**: Check your `.env.local` file
- **"Invalid redirect URI"**: Make sure redirect URI matches exactly in Google Console
- **"OAuth error"**: Check your Google OAuth credentials

## Security Notes

- Use strong JWT secrets in production
- Keep Google OAuth credentials secure
- Use HTTPS in production
- Consider implementing token rotation
