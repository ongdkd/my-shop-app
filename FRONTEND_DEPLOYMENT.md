# Frontend Deployment Guide

## Render.com Deployment for Next.js Frontend

### Prerequisites
1. Backend API deployed and running (Task 14 completed)
2. Supabase project configured with database schema
3. Render.com account
4. GitHub repository with the frontend code

### Step 1: Prepare Environment Variables

Before deploying, you'll need to set up the following environment variables in Render.com:

#### Required Environment Variables:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Backend API Configuration
NEXT_PUBLIC_API_URL=https://your-backend-app.onrender.com

# Application Settings (optional - defaults provided)
NODE_ENV=production
PORT=10000
```

#### Optional Environment Variables:
```bash
# Image Upload Services (if using external image hosting)
IMGBB_API_KEY=your-imgbb-api-key-here
POSTIMG_API_KEY=your-postimg-api-key-here
```

### Step 2: Deploy to Render.com

#### Option A: Using Render Dashboard
1. Go to [Render.com](https://render.com) and sign in
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `my-shop-pos-app`
   - **Environment**: `Node`
   - **Region**: `Oregon` (or your preferred region)
   - **Branch**: `main` (or your deployment branch)
   - **Root Directory**: Leave empty (deploy from root)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free` (or upgrade as needed)

5. Add environment variables in the "Environment" section
6. Set **Health Check Path**: `/api/health`
7. Click "Create Web Service"

#### Option B: Using render.yaml (Infrastructure as Code)
1. Ensure `render.yaml` is in your repository root
2. Go to Render Dashboard → "New +" → "Blueprint"
3. Connect your repository and select the `render.yaml` file
4. Add the required environment variables
5. Deploy

### Step 3: Configure Backend CORS

After frontend deployment, update your backend's `ALLOWED_ORIGINS` environment variable to include the frontend URL:

```bash
# In your backend Render service environment variables
ALLOWED_ORIGINS=https://your-frontend-app.onrender.com,http://localhost:3000
FRONTEND_URL=https://your-frontend-app.onrender.com
```

### Step 4: Verify Deployment

After deployment, verify the application is working:

1. **Frontend Health**: `https://your-frontend-app.onrender.com/api/health`
2. **Main Application**: `https://your-frontend-app.onrender.com`
3. **POS Interface**: `https://your-frontend-app.onrender.com/pos/pos1`
4. **Admin Dashboard**: `https://your-frontend-app.onrender.com/admin`

## End-to-End Testing Checklist

### Step 5: Complete Application Testing

#### Authentication Testing:
- [ ] **Login Flow**: Test user login with Supabase Auth
- [ ] **Protected Routes**: Verify admin routes require authentication
- [ ] **Role-Based Access**: Test admin vs POS operator permissions
- [ ] **Session Management**: Test automatic token refresh

#### Product Management Testing:
- [ ] **Product Listing**: Verify products load from database
- [ ] **Add Product**: Test creating new products via API
- [ ] **Edit Product**: Test updating existing products
- [ ] **Delete Product**: Test product deletion
- [ ] **Barcode Scanning**: Test barcode scanner integration
- [ ] **Image Upload**: Test product image upload functionality

#### POS Interface Testing:
- [ ] **Product Search**: Test product search and filtering
- [ ] **Cart Management**: Test adding/removing items from cart
- [ ] **Barcode Scanning**: Test barcode scanner in POS interface
- [ ] **Order Creation**: Test complete order workflow
- [ ] **Payment Processing**: Test different payment methods
- [ ] **Order Completion**: Verify orders are saved to database

#### Admin Dashboard Testing:
- [ ] **Order History**: Verify orders display from database
- [ ] **Sales Analytics**: Test sales reporting and statistics
- [ ] **Real-time Updates**: Test automatic data refresh
- [ ] **POS Terminal Management**: Test terminal configuration
- [ ] **User Management**: Test user roles and permissions

#### Integration Testing:
- [ ] **Frontend-Backend Communication**: All API calls working
- [ ] **Database Persistence**: Data persists across sessions
- [ ] **Real-time Updates**: Changes reflect immediately
- [ ] **Error Handling**: Proper error messages displayed
- [ ] **Loading States**: Loading indicators working correctly

#### Performance Testing:
- [ ] **Page Load Times**: Acceptable loading performance
- [ ] **API Response Times**: Backend responses under 500ms
- [ ] **Image Loading**: Product images load efficiently
- [ ] **Mobile Responsiveness**: Works on mobile devices
- [ ] **Offline Handling**: Graceful offline behavior

#### Security Testing:
- [ ] **HTTPS**: All connections use HTTPS
- [ ] **Authentication**: Unauthorized access blocked
- [ ] **CORS**: Cross-origin requests properly configured
- [ ] **Input Validation**: Malicious input handled safely
- [ ] **Environment Variables**: Sensitive data not exposed

## Troubleshooting

### Common Issues:

#### Build Failures:
- [ ] Check Node.js version (requires 18+)
- [ ] Verify all dependencies in package.json
- [ ] Check Next.js build errors
- [ ] Review build logs in Render dashboard

#### Runtime Errors:
- [ ] Verify environment variables are set correctly
- [ ] Check API URL configuration
- [ ] Review application logs
- [ ] Test backend connectivity

#### API Connection Issues:
- [ ] Verify `NEXT_PUBLIC_API_URL` points to deployed backend
- [ ] Check backend CORS configuration
- [ ] Test API endpoints directly
- [ ] Verify backend is running and healthy

#### Authentication Issues:
- [ ] Verify Supabase URL and keys
- [ ] Check Supabase project configuration
- [ ] Test authentication flow
- [ ] Review Supabase dashboard logs

### Debug Commands:
```bash
# Test build locally
npm run build && npm start

# Check environment variables
echo $NEXT_PUBLIC_API_URL
echo $NEXT_PUBLIC_SUPABASE_URL

# Test API connectivity
curl $NEXT_PUBLIC_API_URL/api/health
```

## Performance Optimization

### Production Optimizations:
1. **Image Optimization**: Next.js automatic image optimization
2. **Code Splitting**: Automatic code splitting by Next.js
3. **Static Generation**: Use ISR for product pages if needed
4. **Caching**: Implement proper caching headers
5. **CDN**: Render.com provides CDN automatically

### Monitoring Setup:
- [ ] Set up uptime monitoring
- [ ] Configure error tracking
- [ ] Monitor Core Web Vitals
- [ ] Set up performance alerts

## Deployment URLs

After successful deployment, update these URLs:

- **Frontend Application**: `https://your-frontend-app.onrender.com`
- **Backend API**: `https://your-backend-app.onrender.com`
- **Admin Dashboard**: `https://your-frontend-app.onrender.com/admin`
- **POS Interface**: `https://your-frontend-app.onrender.com/pos/pos1`

## Next Steps

After successful deployment:
1. **User Testing**: Conduct user acceptance testing
2. **Performance Monitoring**: Set up monitoring and alerts
3. **Documentation**: Update user documentation
4. **Training**: Train users on the new system
5. **Backup Strategy**: Ensure data backup procedures
6. **Maintenance Plan**: Plan for ongoing maintenance and updates

---

## Support

If you encounter issues:
1. Check the deployment logs in Render dashboard
2. Test the health endpoint: `/api/health`
3. Verify environment variables are set correctly
4. Test backend API connectivity
5. Check Supabase dashboard for database issues
6. Review browser console for frontend errors

**The frontend is ready for production deployment! 🚀**