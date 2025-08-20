# Backend Deployment Checklist

## Pre-Deployment Checklist

### ✅ Code Preparation
- [ ] All code committed and pushed to repository
- [ ] TypeScript compilation successful (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] Environment validation passes (`npm run validate:env`)
- [ ] All tests passing (`npm test`)

### ✅ Environment Configuration
- [ ] Supabase project created and configured
- [ ] Database schema deployed (migrations run)
- [ ] Sample data seeded (if needed)
- [ ] RLS policies configured
- [ ] Service role key obtained

### ✅ Deployment Files
- [ ] `render.yaml` configured
- [ ] `Dockerfile` created (if using Docker)
- [ ] `.dockerignore` configured
- [ ] `DEPLOYMENT.md` documentation complete
- [ ] Environment variables documented

## Deployment Steps

### Step 1: Render.com Setup
- [ ] Render.com account created
- [ ] Repository connected to Render
- [ ] Web service created with correct settings:
  - [ ] Name: `pos-backend-api`
  - [ ] Environment: Node
  - [ ] Build Command: `npm install && npm run build`
  - [ ] Start Command: `npm start`
  - [ ] Health Check Path: `/api/health`

### Step 2: Environment Variables
Set the following in Render dashboard:

#### Required Variables:
- [ ] `SUPABASE_URL` - Your Supabase project URL
- [ ] `SUPABASE_ANON_KEY` - Supabase anonymous key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- [ ] `JWT_SECRET` - Secure random string (32+ characters)
- [ ] `FRONTEND_URL` - Your frontend deployment URL
- [ ] `ALLOWED_ORIGINS` - Comma-separated allowed origins

#### Optional Variables (defaults provided):
- [ ] `NODE_ENV=production`
- [ ] `PORT=10000`
- [ ] `HOST=0.0.0.0`
- [ ] `API_VERSION=v1`
- [ ] `API_PREFIX=/api`
- [ ] `RATE_LIMIT_WINDOW_MS=900000`
- [ ] `RATE_LIMIT_MAX_REQUESTS=100`
- [ ] `LOG_LEVEL=info`
- [ ] `HELMET_ENABLED=true`
- [ ] `CORS_ENABLED=true`

### Step 3: Deploy
- [ ] Trigger deployment in Render dashboard
- [ ] Monitor build logs for errors
- [ ] Wait for deployment to complete
- [ ] Note the deployed URL

## Post-Deployment Verification

### Step 4: Health Checks
Test the following endpoints:

- [ ] **Basic Health**: `GET /api/health`
  ```json
  Expected: {"success": true, "data": {"status": "healthy", ...}}
  ```

- [ ] **Detailed Health**: `GET /api/health/detailed`
  ```json
  Expected: {"success": true, "data": {"checks": {"database": "healthy", ...}}}
  ```

- [ ] **API Info**: `GET /api`
  ```json
  Expected: {"success": true, "message": "POS API Server", ...}
  ```

### Step 5: API Endpoint Testing
Test core functionality:

- [ ] **Products API**:
  - [ ] `GET /api/v1/products` - List products
  - [ ] `POST /api/v1/products` - Create product (with auth)
  - [ ] `GET /api/v1/products/barcode/{barcode}` - Barcode lookup

- [ ] **Orders API**:
  - [ ] `GET /api/v1/orders` - List orders
  - [ ] `POST /api/v1/orders` - Create order
  - [ ] `GET /api/v1/orders/{id}` - Get order details

- [ ] **POS Terminals API**:
  - [ ] `GET /api/v1/pos-terminals` - List terminals
  - [ ] `POST /api/v1/pos-terminals` - Create terminal (with auth)

### Step 6: Security Verification
- [ ] CORS working correctly (frontend can access API)
- [ ] Rate limiting active (test with multiple requests)
- [ ] Authentication required for protected endpoints
- [ ] HTTPS enabled (Render provides this automatically)
- [ ] Security headers present (Helmet middleware)

### Step 7: Performance Testing
- [ ] Response times acceptable (< 500ms for simple queries)
- [ ] Database connections working
- [ ] Memory usage stable
- [ ] No memory leaks detected

## Troubleshooting

### Common Issues:

#### Build Failures:
- [ ] Check Node.js version (requires 18+)
- [ ] Verify all dependencies in package.json
- [ ] Check TypeScript compilation errors
- [ ] Review build logs in Render dashboard

#### Runtime Errors:
- [ ] Verify environment variables are set correctly
- [ ] Check Supabase connection credentials
- [ ] Review application logs
- [ ] Test database connectivity

#### CORS Issues:
- [ ] Verify `ALLOWED_ORIGINS` includes frontend URL
- [ ] Check CORS middleware configuration
- [ ] Test preflight OPTIONS requests

#### Database Connection Issues:
- [ ] Verify Supabase URL and keys
- [ ] Check RLS policies allow service role access
- [ ] Test connection with detailed health endpoint

### Monitoring Setup:
- [ ] Set up log monitoring
- [ ] Configure uptime monitoring
- [ ] Set up error alerting
- [ ] Monitor resource usage

## Rollback Plan

If deployment fails:
- [ ] Revert to previous working commit
- [ ] Redeploy from stable branch
- [ ] Check environment variable changes
- [ ] Review recent code changes

## Documentation Updates

After successful deployment:
- [ ] Update API documentation with production URLs
- [ ] Update frontend environment variables
- [ ] Document any configuration changes
- [ ] Update team on new deployment URL

## Next Steps

- [ ] Deploy frontend (Task 15)
- [ ] Update frontend API URL configuration
- [ ] Perform end-to-end testing
- [ ] Set up monitoring and alerts
- [ ] Configure automated deployments (CI/CD)

---

## Deployment URLs

After deployment, update these URLs:

- **Backend API**: `https://your-backend-app.onrender.com`
- **Health Check**: `https://your-backend-app.onrender.com/api/health`
- **API Documentation**: `https://your-backend-app.onrender.com/api`

Remember to update the frontend `NEXT_PUBLIC_API_URL` environment variable with the deployed backend URL!