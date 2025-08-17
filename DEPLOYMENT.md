# Deployment Guide for Render.com

This guide will help you deploy the My Shop POS application to Render.com.

## Prerequisites

1. **Git Repository**: Your code must be in a Git repository (GitHub, GitLab, Bitbucket)
2. **Render Account**: Create a free account at [render.com](https://render.com)

## Automatic Deployment (Recommended)

The project includes a `render.yaml` file for automatic deployment configuration.

### Steps:

1. **Push to Git Repository**:

   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Connect to Render**:

   - Go to [render.com](https://render.com) and sign in
   - Click "New +" → "Blueprint"
   - Connect your Git repository
   - Select the repository containing your POS app
   - Render will automatically detect the `render.yaml` file

3. **Deploy**:
   - Review the configuration
   - Click "Apply" to start deployment
   - Wait for the build to complete (5-10 minutes)

## Manual Deployment

If you prefer manual setup:

### Steps:

1. **Create Web Service**:

   - Go to Render Dashboard
   - Click "New +" → "Web Service"
   - Connect your Git repository

2. **Configure Service**:

   - **Name**: `my-shop-pos-app` (or your preferred name)
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free` (or upgrade as needed)

3. **Environment Variables** (Optional):

   - `NODE_ENV`: `production`
   - `PORT`: `10000` (Render will set this automatically)

4. **Deploy**:
   - Click "Create Web Service"
   - Wait for deployment to complete

## Post-Deployment

### 1. Test Your Application

Once deployed, test all major features:

- ✅ Home page loads correctly
- ✅ POS terminal selection works
- ✅ Product browsing and cart functionality
- ✅ Admin dashboard access
- ✅ Mobile responsiveness
- ✅ Barcode scanner (requires HTTPS)

### 2. Custom Domain (Optional)

To use a custom domain:

1. Go to your service settings in Render
2. Click "Custom Domains"
3. Add your domain and configure DNS

### 3. SSL Certificate

Render automatically provides SSL certificates for all deployments.

## Troubleshooting

### Common Issues:

1. **Build Fails**:

   - Check that all dependencies are in `package.json`
   - Ensure Node.js version compatibility
   - Review build logs for specific errors

2. **App Won't Start**:

   - Verify the start command is `npm start`
   - Check that the build completed successfully
   - Review application logs

3. **Images Not Loading**:

   - Ensure image URLs are HTTPS
   - Check Next.js image configuration in `next.config.ts`

4. **Barcode Scanner Issues**:
   - Barcode scanner requires HTTPS (works automatically on Render)
   - Check browser permissions for camera access

### Performance Optimization:

1. **Enable Compression**: Already configured in `next.config.ts`
2. **Image Optimization**: Configured for WebP and AVIF formats
3. **Caching**: Static assets are automatically cached by Render
4. **CDN**: Render provides global CDN for static assets

## Monitoring

### Health Checks:

- Render automatically monitors your app
- Health check endpoint: `/` (home page)
- Automatic restarts on failures

### Logs:

- View logs in Render dashboard
- Real-time log streaming available
- Error tracking and monitoring

## Scaling

### Free Plan Limitations:

- 512 MB RAM
- Shared CPU
- Sleeps after 15 minutes of inactivity
- 750 hours/month

### Upgrade Options:

- **Starter**: $7/month - No sleep, more resources
- **Standard**: $25/month - Dedicated resources
- **Pro**: $85/month - High performance

## Security

The application includes:

- ✅ Security headers configured
- ✅ HTTPS enforced by Render
- ✅ Content Security Policy headers
- ✅ XSS protection headers

## Backup and Data

**Important**: This application uses browser localStorage for data persistence. For production use, consider:

- Implementing a database backend
- Regular data export functionality
- User authentication system

## Support

For deployment issues:

- Check Render documentation: [render.com/docs](https://render.com/docs)
- Review application logs in Render dashboard
- Open an issue in the project repository
