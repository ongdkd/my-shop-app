-- =============================================
-- Common Database Queries for POS Application
-- Useful queries for development and maintenance
-- =============================================

-- =============================================
-- PRODUCT QUERIES
-- =============================================

-- Get all active products with stock
SELECT 
    id,
    barcode,
    name,
    price,
    category,
    stock_quantity,
    image_url
FROM products 
WHERE is_active = true 
ORDER BY category, name;

-- Find product by barcode
SELECT * FROM products 
WHERE barcode = '1234567890123' 
AND is_active = true;

-- Low stock products (less than 10 items)
SELECT 
    barcode,
    name,
    stock_quantity,
    category
FROM products 
WHERE stock_quantity < 10 
AND is_active = true
ORDER BY stock_quantity ASC;

-- Products by category with stock value
SELECT 
    category,
    COUNT(*) as product_count,
    SUM(stock_quantity * price) as total_stock_value
FROM products 
WHERE is_active = true
GROUP BY category
ORDER BY total_stock_value DESC;

-- =============================================
-- ORDER QUERIES
-- =============================================

-- Complete order details with items
SELECT 
    o.order_number,
    o.order_date,
    o.total_amount,
    o.payment_method,
    pt.terminal_name,
    c.name as customer_name,
    c.email as customer_email,
    COUNT(oi.id) as item_count
FROM orders o
LEFT JOIN pos_terminals pt ON o.pos_terminal_id = pt.id
LEFT JOIN customers c ON o.customer_id = c.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.order_number, o.order_date, o.total_amount, 
         o.payment_method, pt.terminal_name, c.name, c.email
ORDER BY o.order_date DESC;

-- Order with line items detail
SELECT 
    o.order_number,
    o.order_date,
    o.total_amount,
    p.name as product_name,
    p.barcode,
    oi.quantity,
    oi.unit_price,
    oi.line_total
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE o.order_number = 'ORD-001-20241218'  -- Replace with actual order number
ORDER BY oi.created_at;

-- Daily sales summary
SELECT 
    DATE(order_date) as sale_date,
    COUNT(*) as order_count,
    SUM(total_amount) as daily_total,
    AVG(total_amount) as avg_order_value
FROM orders 
WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(order_date)
ORDER BY sale_date DESC;

-- Sales by payment method
SELECT 
    payment_method,
    COUNT(*) as order_count,
    SUM(total_amount) as total_sales,
    ROUND(AVG(total_amount), 2) as avg_order_value
FROM orders 
WHERE order_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY payment_method
ORDER BY total_sales DESC;

-- =============================================
-- PRODUCT PERFORMANCE QUERIES
-- =============================================

-- Best selling products (by quantity)
SELECT 
    p.name,
    p.barcode,
    p.category,
    SUM(oi.quantity) as total_sold,
    SUM(oi.line_total) as total_revenue
FROM products p
JOIN order_items oi ON p.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
WHERE o.order_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY p.id, p.name, p.barcode, p.category
ORDER BY total_sold DESC
LIMIT 10;

-- Revenue by category
SELECT 
    p.category,
    COUNT(DISTINCT p.id) as product_count,
    SUM(oi.quantity) as total_quantity_sold,
    SUM(oi.line_total) as total_revenue
FROM products p
JOIN order_items oi ON p.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
WHERE o.order_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY p.category
ORDER BY total_revenue DESC;

-- =============================================
-- POS TERMINAL PERFORMANCE
-- =============================================

-- Sales by POS terminal
SELECT 
    pt.terminal_name,
    pt.location,
    COUNT(o.id) as order_count,
    SUM(o.total_amount) as total_sales,
    AVG(o.total_amount) as avg_order_value
FROM pos_terminals pt
LEFT JOIN orders o ON pt.id = o.pos_terminal_id
WHERE o.order_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY pt.id, pt.terminal_name, pt.location
ORDER BY total_sales DESC;

-- =============================================
-- CUSTOMER ANALYSIS
-- =============================================

-- Customer purchase history
SELECT 
    c.name,
    c.email,
    COUNT(o.id) as order_count,
    SUM(o.total_amount) as total_spent,
    AVG(o.total_amount) as avg_order_value,
    MAX(o.order_date) as last_purchase
FROM customers c
JOIN orders o ON c.id = o.customer_id
GROUP BY c.id, c.name, c.email
ORDER BY total_spent DESC;

-- =============================================
-- INVENTORY MANAGEMENT
-- =============================================

-- Stock movement simulation (for inventory tracking)
-- This would be enhanced with actual stock movement tracking
SELECT 
    p.name,
    p.barcode,
    p.stock_quantity as current_stock,
    COALESCE(SUM(oi.quantity), 0) as total_sold,
    p.stock_quantity + COALESCE(SUM(oi.quantity), 0) as estimated_initial_stock
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id
WHERE o.order_date >= CURRENT_DATE - INTERVAL '30 days'
   OR o.order_date IS NULL
GROUP BY p.id, p.name, p.barcode, p.stock_quantity
ORDER BY p.name;

-- =============================================
-- FINANCIAL REPORTS
-- =============================================

-- Monthly sales report
SELECT 
    DATE_TRUNC('month', order_date) as month,
    COUNT(*) as order_count,
    SUM(total_amount) as monthly_revenue,
    AVG(total_amount) as avg_order_value
FROM orders 
WHERE order_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', order_date)
ORDER BY month DESC;

-- Hourly sales pattern (for staffing insights)
SELECT 
    EXTRACT(hour FROM order_date) as hour_of_day,
    COUNT(*) as order_count,
    SUM(total_amount) as hourly_sales
FROM orders 
WHERE order_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY EXTRACT(hour FROM order_date)
ORDER BY hour_of_day;

-- =============================================
-- DATA MAINTENANCE QUERIES
-- =============================================

-- Find orphaned order items (products that were deleted)
SELECT 
    oi.id,
    oi.order_id,
    oi.product_id,
    o.order_number
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
LEFT JOIN products p ON oi.product_id = p.id
WHERE p.id IS NULL;

-- Find orders without items (data integrity check)
SELECT 
    o.id,
    o.order_number,
    o.order_date,
    o.total_amount
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE oi.id IS NULL;

-- Update product stock after manual inventory count
-- UPDATE products 
-- SET stock_quantity = NEW_COUNT, updated_at = NOW()
-- WHERE barcode = 'PRODUCT_BARCODE';

-- =============================================
-- PERFORMANCE MONITORING
-- =============================================

-- Table sizes and row counts
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public' 
AND tablename IN ('products', 'orders', 'order_items', 'pos_terminals', 'customers');

-- Index usage statistics
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    most_common_vals
FROM pg_stats 
WHERE schemaname = 'public' 
AND tablename = 'products';

-- =============================================
-- BACKUP QUERIES
-- =============================================

-- Export products for backup (use with \copy in psql)
-- \copy (SELECT * FROM products WHERE is_active = true) TO 'products_backup.csv' WITH CSV HEADER;

-- Export orders for backup
-- \copy (SELECT * FROM orders WHERE order_date >= '2024-01-01') TO 'orders_backup.csv' WITH CSV HEADER;