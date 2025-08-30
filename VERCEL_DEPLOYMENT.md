# Vercel Deployment Guide

## Project Structure
```
├── api/                    # Serverless API functions
│   ├── index.js           # Main API entry point
│   └── package.json       # API dependencies
├── frontend/ECGenius_frontend/  # React frontend
│   ├── dist/              # Build output (generated)
│   ├── public/            # Static assets
│   │   └── _redirects     # Routing configuration
│   └── package.json       # Frontend dependencies
├── backend/               # Backend source code
├── vercel.json           # Vercel configuration
└── package.json          # Root package.json
```

## Deployment Steps

### 1. Environment Variables
Set these in Vercel dashboard:
- `MONGO_URI`: Your MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `NODE_ENV`: production

### 2. Build Configuration
The project uses:
- **Frontend**: Vite static build (`@vercel/static-build`)
- **API**: Node.js serverless functions (`@vercel/node`)

### 3. Routing
- `/api/*` → Serverless functions in `/api/index.js`
- `/*` → Static frontend files from `/frontend/ECGenius_frontend/dist/`

### 4. Deploy Commands
```bash
# Install dependencies
npm run install-frontend
npm run install-api

# Build frontend
npm run build

# Deploy to Vercel
vercel --prod
```

### 5. Domain Configuration
Update CORS origins in `api/index.js` with your actual domain:
```javascript
origin: ['https://your-actual-domain.vercel.app']
```

## Troubleshooting

### Common Issues:
1. **404 on API routes**: Check that routes don't include `/api` prefix in the handler
2. **CORS errors**: Update allowed origins in `api/index.js`
3. **Build failures**: Ensure all dependencies are in correct package.json files
4. **MongoDB connection**: Verify MONGO_URI environment variable

### Testing Deployment:
1. Test API health: `https://your-domain.vercel.app/api/health`
2. Test authentication: `https://your-domain.vercel.app/api/auth/register`
3. Test frontend routing: Navigate through the app

## Performance Optimizations
- MongoDB connection pooling for serverless
- Static asset optimization with Vite
- Proper caching headers
- Minimal bundle sizes