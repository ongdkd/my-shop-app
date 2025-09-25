-- =============================================
-- POS Terminal Products Relationship
-- Migration to add product assignment to terminals
-- =============================================

-- =============================================
-- POS TERMINAL PRODUCTS TABLE
-- =============================================
CREATE TABLE pos_terminal_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  terminal_id UUID NOT NULL REFERENCES pos_terminals(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique product-terminal combinations
  UNIQUE(terminal_id, product_id)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_pos_terminal_products_terminal ON pos_terminal_products(terminal_id);
CREATE INDEX idx_pos_terminal_products_product ON pos_terminal_products(product_id);
CREATE INDEX idx_pos_terminal_products_active ON pos_terminal_products(is_active);
CREATE INDEX idx_pos_terminal_products_assigned_at ON pos_terminal_products(assigned_at);

-- =============================================
-- TRIGGER FOR UPDATED_AT
-- =============================================
CREATE TRIGGER update_pos_terminal_products_updated_at BEFORE UPDATE ON pos_terminal_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE pos_terminal_products ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all terminal product assignments
CREATE POLICY "Allow authenticated users to read pos_terminal_products" ON pos_terminal_products
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert terminal product assignments
CREATE POLICY "Allow authenticated users to insert pos_terminal_products" ON pos_terminal_products
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update terminal product assignments
CREATE POLICY "Allow authenticated users to update pos_terminal_products" ON pos_terminal_products
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete terminal product assignments
CREATE POLICY "Allow authenticated users to delete pos_terminal_products" ON pos_terminal_products
    FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================
COMMENT ON TABLE pos_terminal_products IS 'Many-to-many relationship between POS terminals and products';
COMMENT ON COLUMN pos_terminal_products.is_active IS 'Whether this product assignment is currently active';
COMMENT ON COLUMN pos_terminal_products.assigned_at IS 'When this product was assigned to the terminal';