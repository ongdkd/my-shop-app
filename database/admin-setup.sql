-- Set user role to admin using SQL
-- Replace 'user-email@example.com' with the actual user email

-- Method 1: Update user_metadata (recommended)
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'user-email@example.com';

-- Method 2: Update app_metadata (alternative)
UPDATE auth.users 
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'user-email@example.com';

-- Verify the update
SELECT id, email, raw_user_meta_data, raw_app_meta_data 
FROM auth.users 
WHERE email = 'user-email@example.com';

-- Example: Set multiple users as admin
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email IN (
  'admin1@example.com',
  'admin2@example.com',
  'manager@example.com'
);

-- Set first registered user as admin (useful for initial setup)
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE created_at = (SELECT MIN(created_at) FROM auth.users);