# Backend Deployment Guide

## Render.com Deployment

### Prerequisites
1. Supabase project with database schema deployed
2. Render.com account
3. GitHub repository with the backend code

### Step 1: Prepare Environment Variables

Before deploying, you'll need to set up the following environment variables in Render.com:

#### Required Environment Variables:
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# JWT Configuration
JWT_SECRET=your-secure-jwt-secret-key-here

# Frontend Configuration
FRONTEND_URL=https://your-frontend-app.onrender.com
ALLOWED_ORIGINS=https://your-frontend-app.onrender.com,http://localhost:3000

# Database Configuration (optional)
DATABASE_URL=postgresql://postgres:your-password@db.your-project-id.supabase.co:5432/postgres
```

#### Optional Environment Variables (already set in render.yaml):
```bash
NODE_ENV=production
PORT=10000
HOST=0.0.0.0
API_VERSION=v1
API_PREFIX=/api
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
LOG_FORMAT=combined
HELMET_ENABLED=true
CORS_ENABLED=true
```

### Step 2: Deploy to Render.com

#### Option A: Using Render Dashboard
1. Go to [Render.com](https://render.com) and sign in
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `pos-backend-api`
   - **Environment**: `Node`
   - **Region**: `Oregon` (or your preferred region)
   - **Branch**: `main` (or your deployment branch)
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free` (or upgrade as needed)

5. Add environment variables in the "Environment" section
6. Set **Health Check Path**: `/api/health`
7. Click "Create Web Service"

#### Option B: Using render.yaml (Infrastructure as Code)
1. Ensure `backend/render.yaml` is in your repository
2. Go to Render Dashboard → "New +" → "Blueprint"
3. Connect your repository and select the `backend/render.yaml` file
4. Add the required environment variables
5. Deploy

### Step 3: Verify Deployment

After deployment, verify the API is working:

1. **Health Check**: `https://your-backend-app.onrender.com/api/health`
2. **API Info**: `https://your-backend-app.onrender.com/api`
3. **Detailed Health**: `https://your-backend-app.onrender.com/api/health/detailed`

Expected health check response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "uptime": 123.456,
    "environment": "production",
    "version": "1.0.0",
    "node_version": "v18.x.x"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Step 4: Test API Endpoints

Test key endpoints to ensure they're working:

```bash
# Products
GET https://your-backend-app.onrender.com/api/v1/products

# Orders
GET https://your-backend-app.onrender.com/api/v1/orders

# POS Terminals
GET https://your-backend-app.onrender.com/api/v1/pos-terminals
```

### Step 5: Configure Frontend

Update your frontend environment variables to point to the deployed backend:

```bash
NEXT_PUBLIC_API_URL=https://your-backend-app.onrender.com
```

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Ensure `ALLOWED_ORIGINS` includes your frontend URL
2. **Database Connection**: Verify Supabase credentials and URL
3. **Build Failures**: Check Node.js version compatibility (requires Node 18+)
4. **Health Check Failures**: Ensure `/api/health` endpoint is accessible

### Logs and Monitoring:

- View logs in Render Dashboard → Your Service → Logs
- Monitor health checks in the service dashboard
- Use the detailed health endpoint for database connectivity status

### Performance Optimization:

1. **Upgrade Plan**: Consider upgrading from Free tier for better performance
2. **Database Optimization**: Use connection pooling for high traffic
3. **Caching**: Implement Redis caching for frequently accessed data
4. **CDN**: Use a CDN for static assets if needed

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to version control
2. **JWT Secret**: Use a strong, randomly generated secret
3. **CORS**: Restrict origins to only your frontend domains
4. **Rate Limiting**: Adjust limits based on your usage patterns
5. **HTTPS**: Render.com provides HTTPS by default
6. **Database Security**: Use RLS policies in Supabase

## Monitoring and Maintenance

1. **Health Checks**: Monitor the `/api/health/detailed` endpoint
2. **Error Logging**: Check application logs regularly
3. **Performance**: Monitor response times and database queries
4. **Updates**: Keep dependencies updated for security patches
5. **Backups**: Ensure Supabase backups are configured

## Next Steps

After successful backend deployment:
1. Update frontend environment variables
2. Deploy frontend (Task 15)
3. Perform end-to-end testing
4. Set up monitoring and alerts
5. Configure automated deployments