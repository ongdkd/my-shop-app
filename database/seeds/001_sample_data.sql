-- =============================================
-- Sample Data for POS Application
-- Test data for development and demonstration
-- =============================================

-- =============================================
-- SAMPLE POS TERMINALS
-- =============================================
INSERT INTO pos_terminals (terminal_name, location, configuration) VALUES
('Main Counter', 'Front Store', '{"theme": "light", "receipt_printer": true, "cash_drawer": true}'),
('Express Lane', 'Side Counter', '{"theme": "dark", "receipt_printer": true, "cash_drawer": false}'),
('Mobile POS', 'Roaming', '{"theme": "light", "receipt_printer": false, "cash_drawer": false}');

-- =============================================
-- SAMPLE PRODUCTS
-- =============================================
INSERT INTO products (barcode, name, price, category, stock_quantity, image_url) VALUES
-- Electronics
('1234567890123', 'Wireless Bluetooth Headphones', 79.99, 'Electronics', 25, 'https://i.postimg.cc/1XwH0hRB/headphones.png'),
('2345678901234', 'USB-C Charging Cable', 19.99, 'Electronics', 50, 'https://i.postimg.cc/2jK8vN9L/usb-cable.png'),
('3456789012345', 'Portable Power Bank 10000mAh', 39.99, 'Electronics', 30, 'https://i.postimg.cc/3xR7sT2M/power-bank.png'),
('4567890123456', 'Smartphone Screen Protector', 12.99, 'Electronics', 75, 'https://i.postimg.cc/4xL9mP6Q/screen-protector.png'),

-- Food & Beverages
('5678901234567', 'Organic Coffee Beans 1lb', 24.99, 'Food & Beverages', 40, 'https://i.postimg.cc/8cR5nT7W/coffee-beans.png'),
('6789012345678', 'Energy Drink 16oz', 3.49, 'Food & Beverages', 100, 'https://i.postimg.cc/9fK2mL8X/energy-drink.png'),
('7890123456789', 'Protein Bar Chocolate', 4.99, 'Food & Beverages', 60, 'https://i.postimg.cc/7YN3pQ9R/protein-bar.png'),
('8901234567890', 'Sparkling Water 12-pack', 8.99, 'Food & Beverages', 35, 'https://i.postimg.cc/1tX5vM2K/sparkling-water.png'),

-- Office Supplies
('9012345678901', 'Wireless Computer Mouse', 29.99, 'Office Supplies', 45, 'https://i.postimg.cc/6qT8wR5L/wireless-mouse.png'),
('0123456789012', 'Notebook Set (3-pack)', 15.99, 'Office Supplies', 80, 'https://i.postimg.cc/9MK7nL3P/notebooks.png'),
('1357924680135', 'Blue Ink Pens (10-pack)', 8.99, 'Office Supplies', 120, 'https://i.postimg.cc/2yV5xT9Q/blue-pens.png'),
('2468013579246', 'Desktop Organizer', 22.99, 'Office Supplies', 25, 'https://i.postimg.cc/5tR8mN4L/desk-organizer.png'),

-- Health & Beauty
('3691472580369', 'Hand Sanitizer 8oz', 6.99, 'Health & Beauty', 90, 'https://i.postimg.cc/7hP9qR2S/hand-sanitizer.png'),
('4815926037481', 'Face Masks (50-pack)', 19.99, 'Health & Beauty', 55, 'https://i.postimg.cc/3wK8mL5T/face-masks.png'),
('5927384061592', 'Vitamin C Tablets', 16.99, 'Health & Beauty', 40, 'https://i.postimg.cc/9fX7nR4M/vitamin-c.png'),

-- Home & Garden
('6048271593604', 'LED Desk Lamp', 34.99, 'Home & Garden', 20, 'https://i.postimg.cc/8zY5nT7W/desk-lamp.png'),
('7159382604715', 'Plant Pot Set (3-pack)', 18.99, 'Home & Garden', 35, 'https://i.postimg.cc/4xL9mP6Q/plant-pots.png'),
('8260493715826', 'Air Freshener Spray', 7.99, 'Home & Garden', 65, 'https://i.postimg.cc/2jK8vN9L/air-freshener.png');

-- =============================================
-- SAMPLE CUSTOMERS
-- =============================================
INSERT INTO customers (name, email, phone) VALUES
('John Smith', 'john.smith@email.com', '+1-555-0101'),
('Sarah Johnson', 'sarah.j@email.com', '+1-555-0102'),
('Mike Davis', 'mike.davis@email.com', '+1-555-0103'),
('Emily Brown', 'emily.brown@email.com', '+1-555-0104'),
('David Wilson', 'david.w@email.com', '+1-555-0105');

-- =============================================
-- SAMPLE ORDERS WITH ORDER ITEMS
-- =============================================

-- Get terminal and customer IDs for sample orders
DO $$
DECLARE
    terminal1_id UUID;
    terminal2_id UUID;
    customer1_id UUID;
    customer2_id UUID;
    order1_id UUID;
    order2_id UUID;
    order3_id UUID;
    product1_id UUID;
    product2_id UUID;
    product3_id UUID;
    product4_id UUID;
    product5_id UUID;
BEGIN
    -- Get IDs for sample data
    SELECT id INTO terminal1_id FROM pos_terminals WHERE terminal_name = 'Main Counter' LIMIT 1;
    SELECT id INTO terminal2_id FROM pos_terminals WHERE terminal_name = 'Express Lane' LIMIT 1;
    SELECT id INTO customer1_id FROM customers WHERE name = 'John Smith' LIMIT 1;
    SELECT id INTO customer2_id FROM customers WHERE name = 'Sarah Johnson' LIMIT 1;
    
    -- Get product IDs
    SELECT id INTO product1_id FROM products WHERE barcode = '1234567890123' LIMIT 1; -- Headphones
    SELECT id INTO product2_id FROM products WHERE barcode = '2345678901234' LIMIT 1; -- USB Cable
    SELECT id INTO product3_id FROM products WHERE barcode = '5678901234567' LIMIT 1; -- Coffee
    SELECT id INTO product4_id FROM products WHERE barcode = '6789012345678' LIMIT 1; -- Energy Drink
    SELECT id INTO product5_id FROM products WHERE barcode = '9012345678901' LIMIT 1; -- Mouse

    -- Sample Order 1: Electronics purchase
    INSERT INTO orders (order_number, pos_terminal_id, customer_id, total_amount, payment_method, order_date)
    VALUES ('ORD-001-' || TO_CHAR(NOW(), 'YYYYMMDD'), terminal1_id, customer1_id, 109.97, 'card', NOW() - INTERVAL '2 days')
    RETURNING id INTO order1_id;

    -- Order 1 Items
    INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total) VALUES
    (order1_id, product1_id, 1, 79.99, 79.99),  -- Headphones
    (order1_id, product2_id, 1, 19.99, 19.99),  -- USB Cable
    (order1_id, product5_id, 1, 29.99, 29.99);  -- Mouse

    -- Sample Order 2: Food & Beverages
    INSERT INTO orders (order_number, pos_terminal_id, customer_id, total_amount, payment_method, order_date)
    VALUES ('ORD-002-' || TO_CHAR(NOW(), 'YYYYMMDD'), terminal2_id, customer2_id, 35.47, 'cash', NOW() - INTERVAL '1 day')
    RETURNING id INTO order2_id;

    -- Order 2 Items
    INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total) VALUES
    (order2_id, product3_id, 1, 24.99, 24.99),  -- Coffee
    (order2_id, product4_id, 3, 3.49, 10.47);   -- Energy Drinks

    -- Sample Order 3: Mixed items (no customer)
    INSERT INTO orders (order_number, pos_terminal_id, total_amount, payment_method, order_date)
    VALUES ('ORD-003-' || TO_CHAR(NOW(), 'YYYYMMDD'), terminal1_id, 62.97, 'digital', NOW() - INTERVAL '3 hours')
    RETURNING id INTO order3_id;

    -- Order 3 Items
    INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total) VALUES
    (order3_id, product2_id, 2, 19.99, 39.98),  -- USB Cables
    (order3_id, product4_id, 2, 3.49, 6.98),    -- Energy Drinks
    (order3_id, (SELECT id FROM products WHERE barcode = '0123456789012' LIMIT 1), 1, 15.99, 15.99); -- Notebooks

END $$;

-- =============================================
-- UPDATE STOCK QUANTITIES AFTER ORDERS
-- =============================================

-- Reduce stock based on sample orders
UPDATE products SET stock_quantity = stock_quantity - 1 WHERE barcode = '1234567890123'; -- Headphones
UPDATE products SET stock_quantity = stock_quantity - 3 WHERE barcode = '2345678901234'; -- USB Cable
UPDATE products SET stock_quantity = stock_quantity - 1 WHERE barcode = '5678901234567'; -- Coffee
UPDATE products SET stock_quantity = stock_quantity - 5 WHERE barcode = '6789012345678'; -- Energy Drink
UPDATE products SET stock_quantity = stock_quantity - 1 WHERE barcode = '9012345678901'; -- Mouse
UPDATE products SET stock_quantity = stock_quantity - 1 WHERE barcode = '0123456789012'; -- Notebooks

-- =============================================
-- VERIFICATION QUERIES (for testing)
-- =============================================

-- These queries can be run to verify the data was inserted correctly

-- Count records in each table
-- SELECT 'products' as table_name, COUNT(*) as record_count FROM products
-- UNION ALL
-- SELECT 'pos_terminals', COUNT(*) FROM pos_terminals
-- UNION ALL
-- SELECT 'customers', COUNT(*) FROM customers
-- UNION ALL
-- SELECT 'orders', COUNT(*) FROM orders
-- UNION ALL
-- SELECT 'order_items', COUNT(*) FROM order_items;

-- Sample query to get order details with items
-- SELECT 
--     o.order_number,
--     o.total_amount,
--     o.payment_method,
--     o.order_date,
--     pt.terminal_name,
--     c.name as customer_name,
--     oi.quantity,
--     p.name as product_name,
--     oi.unit_price,
--     oi.line_total
-- FROM orders o
-- LEFT JOIN pos_terminals pt ON o.pos_terminal_id = pt.id
-- LEFT JOIN customers c ON o.customer_id = c.id
-- LEFT JOIN order_items oi ON o.id = oi.order_id
-- LEFT JOIN products p ON oi.product_id = p.id
-- ORDER BY o.order_date DESC, o.order_number;