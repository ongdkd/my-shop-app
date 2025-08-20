# 👑 Admin User Setup Guide

## How to Set Users as Admin

There are several ways to assign admin roles to users in your POS application. Choose the method that works best for your situation.

---

## 🎯 **Method 1: Supabase Dashboard (Easiest)**

### Steps:
1. **Go to your Supabase Dashboard**
   - Visit [supabase.com](https://supabase.com)
   - Sign in to your account
   - Select your POS project

2. **Navigate to Authentication**
   - Click on "Authentication" in the left sidebar
   - Click on "Users" tab

3. **Find the User**
   - Locate the user you want to make admin
   - Click on the user's email to open their details

4. **Edit User Metadata**
   - Scroll down to "Raw User Meta Data" section
   - Add or modify the JSON to include:
   ```json
   {
     "role": "admin"
   }
   ```

5. **Save Changes**
   - Click "Update user" button
   - The user will now have admin access

### Example User Metadata:
```json
{
  "role": "admin",
  "name": "John Admin",
  "department": "Management"
}
```

---

## 🛠️ **Method 2: SQL Query (Advanced)**

### Using Supabase SQL Editor:

1. **Go to SQL Editor** in your Supabase dashboard
2. **Run one of these queries:**

#### Set specific user as admin:
```sql
-- Replace 'admin@example.com' with actual email
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'admin@example.com';
```

#### Set multiple users as admin:
```sql
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email IN (
  'admin1@example.com',
  'admin2@example.com',
  'manager@example.com'
);
```

#### Set first registered user as admin:
```sql
-- Useful for initial setup
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE created_at = (SELECT MIN(created_at) FROM auth.users);
```

#### Verify the changes:
```sql
SELECT id, email, raw_user_meta_data->'role' as role
FROM auth.users 
WHERE raw_user_meta_data->>'role' = 'admin';
```

---

## 💻 **Method 3: Backend Script (Programmatic)**

### Using the provided script:

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

3. **Set environment variables** in `backend/.env`:
   ```bash
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Run the script:**
   ```bash
   node src/scripts/set-admin.js admin@example.com
   ```

### Script Features:
- ✅ Validates email format
- ✅ Checks if user exists
- ✅ Updates user metadata safely
- ✅ Provides clear feedback
- ✅ Error handling

---

## 🔐 **Method 4: During User Registration**

### For new users, you can set admin role during signup:

```typescript
// In your signup function
const { data, error } = await supabase.auth.signUp({
  email: 'newadmin@example.com',
  password: 'securepassword',
  options: {
    data: {
      role: 'admin',
      name: 'New Admin User'
    }
  }
});
```

---

## 🎭 **Available User Roles**

The system supports these roles:

| Role | Access Level | Description |
|------|-------------|-------------|
| `admin` | Full Access | Can access all admin features, manage products, view reports |
| `manager` | Limited Admin | Can manage products and view reports (if implemented) |
| `pos_operator` | POS Only | Can only use POS interface for sales |
| `user` | Basic | Default role, limited access |

---

## 🔍 **How to Verify Admin Access**

### 1. **Check in Database:**
```sql
SELECT email, raw_user_meta_data->'role' as role
FROM auth.users 
WHERE raw_user_meta_data->>'role' = 'admin';
```

### 2. **Test in Application:**
1. Log in with the admin user
2. Try to access `/admin` route
3. Check if admin features are visible
4. Verify no "Access Denied" messages

### 3. **Check User Profile:**
- Go to user profile in the app
- Role should display as "admin"
- Admin-specific options should be visible

---

## 🚨 **Troubleshooting**

### **Issue: User still can't access admin features**

**Solutions:**
1. **Clear browser cache and localStorage:**
   ```javascript
   localStorage.clear();
   // Then refresh the page
   ```

2. **Log out and log back in:**
   - The role is cached, so re-authentication is needed

3. **Verify role in database:**
   ```sql
   SELECT email, raw_user_meta_data 
   FROM auth.users 
   WHERE email = 'your-admin@example.com';
   ```

4. **Check for typos:**
   - Role must be exactly `"admin"` (lowercase)
   - Check JSON syntax in metadata

### **Issue: Script fails to run**

**Solutions:**
1. **Check environment variables:**
   ```bash
   echo $SUPABASE_URL
   echo $SUPABASE_SERVICE_ROLE_KEY
   ```

2. **Verify service role key:**
   - Must be the SERVICE ROLE key, not anon key
   - Check Supabase dashboard → Settings → API

3. **Check user exists:**
   - User must be registered first
   - Verify email spelling

---

## 🎯 **Quick Setup for Development**

### **Make first user admin automatically:**

1. **Register a user** through the app
2. **Run this SQL** in Supabase:
   ```sql
   -- Make the first registered user admin
   UPDATE auth.users 
   SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
   WHERE created_at = (SELECT MIN(created_at) FROM auth.users);
   ```

3. **Log out and log back in** to refresh the role

---

## 📋 **Best Practices**

### **Security:**
- ✅ Use service role key only on backend
- ✅ Never expose service role key in frontend
- ✅ Regularly audit admin users
- ✅ Use strong passwords for admin accounts

### **Management:**
- ✅ Document who has admin access
- ✅ Remove admin access when no longer needed
- ✅ Use descriptive names in user metadata
- ✅ Test admin features after role changes

### **Development:**
- ✅ Use separate admin accounts for testing
- ✅ Don't use production admin accounts in development
- ✅ Keep admin credentials secure

---

## 🎉 **Success!**

Once you've set up admin users, they will have access to:

- **Admin Dashboard** (`/admin`)
- **Product Management** (`/admin/pos-products`)
- **Order Management** (`/admin/orders`)
- **POS Terminal Management** (`/admin/pos`)
- **Settings and Configuration**
- **Sales Analytics and Reports**

**Your POS system is now ready with proper admin access! 🚀**