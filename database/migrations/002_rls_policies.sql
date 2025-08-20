-- =============================================
-- Row Level Security (RLS) Policies
-- Secure data access based on user authentication
-- =============================================

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_terminals ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PRODUCTS POLICIES
-- =============================================

-- Allow authenticated users to read all products
CREATE POLICY "Allow authenticated users to read products" ON products
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert products
CREATE POLICY "Allow authenticated users to insert products" ON products
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update products
CREATE POLICY "Allow authenticated users to update products" ON products
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete products
CREATE POLICY "Allow authenticated users to delete products" ON products
    FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================
-- POS TERMINALS POLICIES
-- =============================================

-- Allow authenticated users to read all POS terminals
CREATE POLICY "Allow authenticated users to read pos_terminals" ON pos_terminals
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert POS terminals
CREATE POLICY "Allow authenticated users to insert pos_terminals" ON pos_terminals
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update POS terminals
CREATE POLICY "Allow authenticated users to update pos_terminals" ON pos_terminals
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete POS terminals
CREATE POLICY "Allow authenticated users to delete pos_terminals" ON pos_terminals
    FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================
-- CUSTOMERS POLICIES
-- =============================================

-- Allow authenticated users to read all customers
CREATE POLICY "Allow authenticated users to read customers" ON customers
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert customers
CREATE POLICY "Allow authenticated users to insert customers" ON customers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update customers
CREATE POLICY "Allow authenticated users to update customers" ON customers
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete customers
CREATE POLICY "Allow authenticated users to delete customers" ON customers
    FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================
-- ORDERS POLICIES
-- =============================================

-- Allow authenticated users to read all orders
CREATE POLICY "Allow authenticated users to read orders" ON orders
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert orders
CREATE POLICY "Allow authenticated users to insert orders" ON orders
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update orders
CREATE POLICY "Allow authenticated users to update orders" ON orders
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete orders (admin only in practice)
CREATE POLICY "Allow authenticated users to delete orders" ON orders
    FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================
-- ORDER ITEMS POLICIES
-- =============================================

-- Allow authenticated users to read all order items
CREATE POLICY "Allow authenticated users to read order_items" ON order_items
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert order items
CREATE POLICY "Allow authenticated users to insert order_items" ON order_items
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update order items
CREATE POLICY "Allow authenticated users to update order_items" ON order_items
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete order items
CREATE POLICY "Allow authenticated users to delete order_items" ON order_items
    FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================
-- SERVICE ROLE POLICIES (for backend API)
-- =============================================

-- Allow service role to bypass RLS for all operations
-- This is used by the Express.js backend with service role key

-- Note: When using the service role key in the backend,
-- RLS is automatically bypassed. These policies are for
-- client-side access with user JWT tokens.

-- =============================================
-- ADDITIONAL SECURITY FUNCTIONS
-- =============================================

-- Function to check if user has admin role (for future use)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- This can be extended to check user metadata for admin role
    -- For now, all authenticated users have full access
    RETURN auth.role() = 'authenticated';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user ID (for future user-specific data)
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;