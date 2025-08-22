# 🔍 How to Check if Backend is Running on Render

## 🎯 **Quick Health Checks**

### **Method 1: Direct Health Endpoint (Fastest)**
Replace `your-backend-name` with your actual Render service name:

```bash
# In browser or curl
https://your-backend-name.onrender.com/api/health
```

**✅ Expected Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-23T18:44:53.746Z",
    "version": "1.0.0",
    "environment": "production",
    "uptime": "2m 15s"
  }
}
```

### **Method 2: API Info Endpoint**
```bash
https://your-backend-name.onrender.com/api
```

**✅ Expected Response:**
```json
{
  "success": true,
  "message": "POS API Server",
  "version": "1.0.0",
  "environment": "production",
  "endpoints": {
    "health": "/api/health",
    "products": "/api/v1/products",
    "orders": "/api/v1/orders",
    "pos-terminals": "/api/v1/pos-terminals"
  }
}
```

### **Method 3: Test API Endpoints**
```bash
# Products endpoint
https://your-backend-name.onrender.com/api/v1/products

# POS Terminals endpoint
https://your-backend-name.onrender.com/api/v1/pos-terminals
```

## 🖥️ **Check in Render Dashboard**

### **1. Service Status**
1. Go to [render.com](https://render.com) dashboard
2. Find your backend service
3. Check the status indicator:
   - 🟢 **Live** = Running successfully
   - 🟡 **Building** = Currently deploying
   - 🔴 **Failed** = Deployment failed
   - ⚪ **Sleeping** = Free tier service sleeping

### **2. Build Logs**
1. Click on your backend service
2. Go to **"Logs"** tab
3. Look for:
   ```
   🚀 POS API Server running on port 10000
   📝 Environment: production
   🔗 API Base URL: https://your-backend.onrender.com/api/v1
   💚 Health Check: https://your-backend.onrender.com/api/health
   ```

### **3. Events Tab**
- Shows deployment history
- Recent builds and their status
- Any error messages

## 🧪 **Command Line Testing**

### **Using curl:**
```bash
# Health check
curl https://your-backend-name.onrender.com/api/health

# With headers
curl -H "Content-Type: application/json" https://your-backend-name.onrender.com/api/health

# Test products endpoint
curl https://your-backend-name.onrender.com/api/v1/products
```

### **Using PowerShell (Windows):**
```powershell
# Health check
Invoke-RestMethod -Uri "https://your-backend-name.onrender.com/api/health"

# Products endpoint
Invoke-RestMethod -Uri "https://your-backend-name.onrender.com/api/v1/products"
```

## 🚨 **Common Issues & Solutions**

### **❌ Service Shows "Failed"**
**Check:**
1. **Build logs** for error messages
2. **Environment variables** are set correctly
3. **Root directory** is set to `backend`
4. **Node.js version** compatibility

### **❌ 503 Service Unavailable**
**Causes:**
- Service is starting up (wait 1-2 minutes)
- Free tier service is sleeping
- Build failed

**Solution:**
- Check service status in dashboard
- Look at recent deployment logs

### **❌ Health endpoint returns 404**
**Check:**
1. URL is correct: `/api/health` (not `/health`)
2. Service is actually running
3. Routes are properly configured

### **❌ CORS errors when testing from frontend**
**Check:**
1. `ALLOWED_ORIGINS` environment variable includes frontend URL
2. `FRONTEND_URL` is set correctly
3. Both services are deployed

## 🎯 **Quick Diagnostic Checklist**

### **✅ Backend is Working When:**
- [ ] Service status shows "Live" 🟢
- [ ] Health endpoint returns 200 status
- [ ] Build logs show "Server running on port 10000"
- [ ] API endpoints return JSON responses
- [ ] No error messages in logs

### **❌ Backend Has Issues When:**
- [ ] Service status shows "Failed" 🔴
- [ ] Health endpoint returns 404 or 503
- [ ] Build logs show error messages
- [ ] API endpoints don't respond
- [ ] Frontend shows "Demo Mode" warning

## 🔄 **Troubleshooting Steps**

### **1. Check Service Status**
```bash
# Visit in browser
https://your-backend-name.onrender.com/api/health
```

### **2. Review Build Logs**
- Go to Render dashboard → Your service → Logs
- Look for build errors or startup issues

### **3. Verify Environment Variables**
- Check all required variables are set
- Ensure Supabase credentials are correct

### **4. Test Endpoints**
```bash
# Test each endpoint
https://your-backend-name.onrender.com/api/health
https://your-backend-name.onrender.com/api
https://your-backend-name.onrender.com/api/v1/products
```

### **5. Check Frontend Integration**
- Update frontend `NEXT_PUBLIC_API_URL` with backend URL
- Verify CORS settings in backend

## 🎉 **Success Indicators**

### **✅ Everything Working When:**
1. **Backend health check** returns 200 ✅
2. **Frontend loads** without "Demo Mode" warning ✅
3. **POS terminals** can be added/edited/deleted ✅
4. **Data persists** after page refresh ✅
5. **API calls succeed** in browser network tab ✅

## 📱 **Quick Mobile Test**
Visit on your phone: `https://your-backend-name.onrender.com/api/health`

If it loads and shows JSON, your backend is publicly accessible! 🎉

---

## 🔗 **Your Backend URLs**
Replace `your-backend-name` with your actual service name:

- **Health Check**: `https://your-backend-name.onrender.com/api/health`
- **API Info**: `https://your-backend-name.onrender.com/api`
- **Products**: `https://your-backend-name.onrender.com/api/v1/products`
- **POS Terminals**: `https://your-backend-name.onrender.com/api/v1/pos-terminals`

**The health endpoint is your best friend for quick status checks! 🩺**