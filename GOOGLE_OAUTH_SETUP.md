# Google OAuth2 Setup Guide

## 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API

## 2. Create OAuth2 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Configure the consent screen first if prompted
4. Choose **Web application** as application type
5. Add authorized origins:
   - `http://localhost:5173` (for development)
   - Your production domain
6. Add authorized redirect URIs:
   - `http://localhost:5173` (for development)
   - Your production domain

## 3. Configure Environment Variables

### Backend (.env)
```
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### Frontend (.env)
```
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

## 4. Install Dependencies

### Backend
```bash
cd backend
npm install googleapis jsonwebtoken
```

### Frontend
```bash
cd frontend/ECGenius_frontend
npm install @google-cloud/local-auth
```

## 5. Test the Integration

1. Start your backend server: `npm run dev`
2. Start your frontend: `npm run dev`
3. Navigate to login/register pages
4. Click the Google sign-in button
5. Complete the OAuth flow

## Security Notes

- Never commit your actual client secrets to version control
- Use different OAuth credentials for development and production
- Regularly rotate your client secrets
- Implement proper error handling for OAuth failures