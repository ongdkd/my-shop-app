# 🔍 API Endpoints Debugging Guide

## 🎯 **Issue: Health Works, Other Endpoints Fail**

Since `/api/health` works but other endpoints fail, this is likely a **database connection issue**.

## 🧪 **Step-by-Step Diagnosis**

### **1. Test Basic API Info Endpoint**
Try this URL first (should work without database):
```
https://your-backend-name.onrender.com/api
```

**✅ Expected Response:**
```json
{
  "success": true,
  "message": "POS API Server",
  "version": "v1",
  "endpoints": {
    "health": "/health",
    "products": "/api/v1/products",
    "orders": "/api/v1/orders",
    "posTerminals": "/api/v1/pos-terminals"
  }
}
```

### **2. Test Products Endpoint (Most Likely to Fail)**
```
https://your-backend-name.onrender.com/api/v1/products
```

**❌ If this fails, you'll likely see:**
- 500 Internal Server Error
- Database connection error
- Supabase authentication error

### **3. Check Render Logs**
1. Go to Render dashboard → Your backend service
2. Click **"Logs"** tab
3. Look for error messages like:
   ```
   ⚠️ SUPABASE_URL environment variable is missing
   ⚠️ SUPABASE_SERVICE_ROLE_KEY environment variable is missing
   Database connection test failed
   ```

## 🔧 **Most Likely Fixes**

### **Fix 1: Check Environment Variables**
In your Render backend service, verify these are set:

```bash
SUPABASE_URL=https://hfhycostuzgjzfihicmm.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmaHljb3N0dXpnanpmaWhpY21tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE2MzQxNiwiZXhwIjoyMDY5NzM5NDE2fQ.-0SlMsdpRQNjJB_8eOMQMfMU6tl3wJDBIYTu-KbsyUo
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmaHljb3N0dXpnanpmaWhpY21tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNjM0MTYsImV4cCI6MjA2OTczOTQxNn0.ueQP6maHqnzTJBYqD2XwjKGPnmxREg3JsJCVUdxEDHM
DATABASE_URL=postgresql://postgres:M31102543@db.hfhycostuzgjzfihicmm:5432/postgres
```

### **Fix 2: Test Database Connection**
Create a simple test endpoint to check database connectivity.

### **Fix 3: Check Supabase Database Setup**
Verify your Supabase database has the required tables:
- `products`
- `orders`
- `pos_terminals`
- `order_items`

## 🚨 **Common Error Patterns**

### **Error: "SUPABASE_URL environment variable is missing"**
**Solution:** Add missing environment variables in Render dashboard

### **Error: "Database connection test failed"**
**Solution:** 
1. Check Supabase credentials are correct
2. Verify Supabase project is active
3. Check database tables exist

### **Error: "Authentication failed"**
**Solution:**
1. Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
2. Check key hasn't expired
3. Ensure RLS policies allow service role access

### **Error: "Table 'products' doesn't exist"**
**Solution:** Run database migrations in Supabase

## 🧪 **Quick Test Commands**

### **Test API Info (Should Work):**
```bash
curl https://your-backend-name.onrender.com/api
```

### **Test Products (Might Fail):**
```bash
curl https://your-backend-name.onrender.com/api/v1/products
```

### **Test with Verbose Output:**
```bash
curl -v https://your-backend-name.onrender.com/api/v1/products
```

## 🔍 **Debugging Steps**

### **Step 1: Check Environment Variables**
1. Go to Render dashboard
2. Click your backend service
3. Go to **Environment** tab
4. Verify all Supabase variables are set

### **Step 2: Check Build Logs**
1. Go to **Logs** tab
2. Look for startup messages:
   ```
   🚀 POS API Server running on port 10000
   ✅ Database connection successful
   ```

### **Step 3: Check Runtime Logs**
1. Try accessing failing endpoint
2. Check logs for error messages
3. Look for database connection errors

### **Step 4: Test Database Directly**
1. Go to Supabase dashboard
2. Check if tables exist
3. Try running a simple query

## 🎯 **Most Common Issue: Missing Environment Variables**

**99% of the time, this is the issue!**

### **Quick Fix:**
1. Go to Render dashboard
2. Your backend service → **Environment** tab
3. Add missing variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_ANON_KEY`
   - `DATABASE_URL`
4. **Save** (this will redeploy)
5. Wait 2-3 minutes
6. Test endpoints again

## 🎉 **Success Indicators**

### **✅ Everything Working When:**
- `/api` returns API info ✅
- `/api/v1/products` returns products array ✅
- Logs show "Database connection successful" ✅
- No error messages in logs ✅
- Frontend stops showing "Demo Mode" ✅

## 📞 **Need Help?**

**Share these details:**
1. What error message do you see when testing `/api/v1/products`?
2. What do the Render logs show?
3. Are all environment variables set in Render dashboard?

**Most likely it's just missing environment variables! 🔧**