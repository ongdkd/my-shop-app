# 🔧 How to Fix "Running in Demo Mode"

## 🎯 **Why You're Seeing Demo Mode**

The POS Terminal Management page shows "Running in Demo Mode" because:

1. **Frontend is configured** to connect to `http://localhost:5000` (backend API)
2. **Backend is not running** locally on port 5000
3. **API client falls back** to sample data when it can't reach the backend

## 🚀 **Solutions (Choose One)**

### **Option 1: Start Backend Locally (Best for Development)**

#### **Quick Start:**
```bash
# In a new terminal, navigate to backend folder
cd backend

# Install dependencies (if not done)
npm install

# Build the backend
npm run build

# Start the backend server
npm start
```

#### **Alternative Development Start:**
```bash
cd backend
npm run start:dev  # Uses ts-node for development
```

#### **Verify Backend is Running:**
```bash
# Test the health endpoint
curl http://localhost:5000/api/health

# Or visit in browser:
# http://localhost:5000/api/health
```

### **Option 2: Use Deployed Backend (Production)**

If you have a deployed backend, update your frontend environment:

#### **Update `.env.local`:**
```bash
# Replace localhost with your deployed backend URL
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com

# Keep other settings the same
NEXT_PUBLIC_SUPABASE_URL=https://hfhycostuzgjzfihicmm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### **Restart Frontend:**
```bash
npm run dev
```

### **Option 3: Deploy Both Frontend and Backend**

Follow the deployment guides:

1. **Deploy Backend**: Use `backend/DEPLOYMENT.md`
2. **Deploy Frontend**: Use `FRONTEND_DEPLOYMENT.md`
3. **Update Environment Variables** with production URLs

## 🔍 **How to Verify It's Working**

### **When Backend is Connected:**
- ✅ No "Running in Demo Mode" warning
- ✅ Real data from Supabase database
- ✅ Changes persist when you add/edit/delete POS terminals
- ✅ API calls succeed

### **When in Demo Mode:**
- ⚠️ Yellow warning banner: "Running in Demo Mode"
- ⚠️ Sample data only (POS 1, POS 2, etc.)
- ⚠️ Changes don't persist
- ⚠️ "Backend API is not available" message

## 🛠️ **Troubleshooting Backend Startup**

If the backend won't start:

### **Check Dependencies:**
```bash
cd backend
npm install
```

### **Check Environment Variables:**
```bash
cd backend
npm run validate:env
```

### **Check TypeScript Compilation:**
```bash
cd backend
npm run type-check
```

### **Check Build:**
```bash
cd backend
npm run build
```

### **Check Logs:**
```bash
cd backend
npm start 2>&1  # See error output
```

### **Common Issues:**
1. **Port 5000 in use**: Change PORT in `backend/.env`
2. **Missing dependencies**: Run `npm install` in backend
3. **TypeScript errors**: Run `npm run type-check`
4. **Environment issues**: Check `backend/.env` file exists

## 🎯 **Recommended Development Setup**

### **Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev  # or npm start
```

### **Terminal 2 - Frontend:**
```bash
npm run dev
```

### **Verify Both Running:**
- Backend: http://localhost:5000/api/health
- Frontend: http://localhost:3000

## 🚀 **Production Deployment**

For production, both frontend and backend should be deployed:

### **Backend Deployment:**
- Use Render.com with `backend/render.yaml`
- Set environment variables in Render dashboard
- Get backend URL: `https://your-backend.onrender.com`

### **Frontend Deployment:**
- Use Render.com with `render.yaml`
- Set `NEXT_PUBLIC_API_URL` to backend URL
- Deploy and get frontend URL

### **Update CORS:**
- Add frontend URL to backend's `ALLOWED_ORIGINS`
- Redeploy backend

## 🎉 **Success Indicators**

### **Demo Mode Fixed When:**
- ✅ No yellow warning banner
- ✅ POS terminals load from database
- ✅ Add/Edit/Delete operations work
- ✅ Changes persist after page refresh
- ✅ Real-time data updates

### **API Health Check Returns:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-23T...",
    "version": "1.0.0",
    "environment": "development"
  }
}
```

## 🔄 **Quick Fix Summary**

**Fastest solution for development:**

1. Open new terminal
2. `cd backend`
3. `npm install` (if needed)
4. `npm run build`
5. `npm start`
6. Refresh your frontend page

**The "Demo Mode" warning should disappear immediately once the backend is running! 🎉**