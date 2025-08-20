# Supabase Setup Guide

This guide will help you set up Supabase for the POS application with the required database schema and configuration.

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `pos-application` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your location
5. Click "Create new project"
6. Wait for the project to be created (2-3 minutes)

## 2. Get Project Configuration

Once your project is ready:

1. Go to **Settings** → **API**
2. Copy the following values (you'll need these for environment variables):
   - **Project URL** (e.g., `https://your-project-id.supabase.co`)
   - **Project API Keys**:
     - `anon` `public` key (for frontend)
     - `service_role` `secret` key (for backend API)

## 3. Run Database Migrations

### Option A: Using Supabase Dashboard (Recommended)

1. Go to **SQL Editor** in your Supabase dashboard
2. Create a new query
3. Copy and paste the contents of `database/migrations/001_initial_schema.sql`
4. Click "Run" to execute the schema creation
5. Create another new query
6. Copy and paste the contents of `database/migrations/002_rls_policies.sql`
7. Click "Run" to set up Row Level Security

### Option B: Using Supabase CLI (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-id

# Run migrations
supabase db push
```

## 4. Seed Sample Data (Optional)

To add sample data for testing:

1. Go to **SQL Editor** in Supabase dashboard
2. Create a new query
3. Copy and paste the contents of `database/seeds/001_sample_data.sql`
4. Click "Run" to insert sample data

## 5. Configure Authentication

1. Go to **Authentication** → **Settings**
2. Configure **Site URL**: `http://localhost:3000` (for development)
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `https://your-production-domain.com/auth/callback` (for production)
4. Enable **Email Auth** (default is enabled)
5. Optionally configure other providers (Google, GitHub, etc.)

## 6. Environment Variables

Create these environment variables for your applications:

### Frontend (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Backend (.env)
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:your-db-password@db.your-project-id.supabase.co:5432/postgres
```

## 7. Verify Setup

### Check Tables
1. Go to **Table Editor** in Supabase dashboard
2. You should see these tables:
   - `products`
   - `pos_terminals`
   - `customers`
   - `orders`
   - `order_items`

### Test Data
1. Click on each table to view the sample data
2. Try adding/editing records to test functionality

### Check Policies
1. Go to **Authentication** → **Policies**
2. You should see RLS policies for each table

## 8. Database Schema Overview

```
products
├── id (UUID, Primary Key)
├── barcode (VARCHAR, Unique)
├── name (VARCHAR)
├── price (DECIMAL)
├── image_url (TEXT)
├── category (VARCHAR)
├── stock_quantity (INTEGER)
├── is_active (BOOLEAN)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

pos_terminals
├── id (UUID, Primary Key)
├── terminal_name (VARCHAR)
├── location (VARCHAR)
├── is_active (BOOLEAN)
├── configuration (JSONB)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

customers
├── id (UUID, Primary Key)
├── name (VARCHAR)
├── email (VARCHAR)
├── phone (VARCHAR)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

orders
├── id (UUID, Primary Key)
├── order_number (VARCHAR, Unique)
├── pos_terminal_id (UUID, FK → pos_terminals.id)
├── customer_id (UUID, FK → customers.id)
├── total_amount (DECIMAL)
├── payment_method (VARCHAR)
├── order_status (VARCHAR)
├── order_date (TIMESTAMP)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

order_items
├── id (UUID, Primary Key)
├── order_id (UUID, FK → orders.id)
├── product_id (UUID, FK → products.id)
├── quantity (INTEGER)
├── unit_price (DECIMAL)
├── line_total (DECIMAL)
└── created_at (TIMESTAMP)
```

## 9. Security Notes

- **Row Level Security (RLS)** is enabled on all tables
- Only authenticated users can access data
- The service role key bypasses RLS (use only in backend)
- Never expose the service role key in frontend code
- Use the anon key for frontend Supabase client

## 10. Next Steps

After completing this setup:

1. ✅ Supabase project created and configured
2. ✅ Database schema deployed
3. ✅ Sample data loaded (optional)
4. ✅ Environment variables configured
5. 🔄 Ready to proceed with Express.js backend setup (Task 2)

## Troubleshooting

### Common Issues

**Migration Fails**
- Check for syntax errors in SQL
- Ensure UUID extension is enabled
- Verify you have proper permissions

**RLS Policies Not Working**
- Ensure RLS is enabled on tables
- Check policy conditions
- Verify user authentication

**Connection Issues**
- Double-check project URL and API keys
- Ensure network connectivity
- Check firewall settings

### Useful SQL Queries

```sql
-- Check table structure
\d products

-- View all policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Test data counts
SELECT 
  'products' as table_name, COUNT(*) as count FROM products
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'order_items', COUNT(*) FROM order_items;
```

For additional help, refer to the [Supabase Documentation](https://supabase.com/docs) or contact support.