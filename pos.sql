-- =========================================================
-- PROFESSIONAL MULTI-TENANT SAAS POS DATABASE
-- PostgreSQL Schema
-- Supports:
-- Retail, Restaurant, Pharmacy, Grocery, Stores
-- Multi-Store
-- SaaS Subscription
-- RBAC Authentication & Authorization
-- Inventory Management
-- Product Variants
-- Restaurant Tables
-- Pharmacy Expiry/Batches
-- =========================================================

-- =========================================================
-- EXTENSIONS
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================
-- UPDATED_AT FUNCTION
-- =========================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- SUBSCRIPTION PLANS
-- =========================================================

CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,

    price NUMERIC(12,2) DEFAULT 0,
    duration_days INTEGER NOT NULL DEFAULT 30,

    max_users INTEGER DEFAULT 5,
    max_stores INTEGER DEFAULT 1,

    features JSONB,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscription_plans_code
ON subscription_plans(code);

-- =========================================================
-- TENANTS / COMPANIES
-- =========================================================

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    subscription_plan_id UUID REFERENCES subscription_plans(id)
    ON DELETE SET NULL,

    business_name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,

    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),

    logo TEXT,

    subscription_status VARCHAR(50) DEFAULT 'trial',

    trial_starts_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    trial_ends_at TIMESTAMP,

    subscribed_at TIMESTAMP,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tenants_slug
ON tenants(slug);

CREATE INDEX idx_tenants_email
ON tenants(email);

-- =========================================================
-- STORES
-- =========================================================

CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL REFERENCES tenants(id)
    ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    code VARCHAR(100),

    store_type VARCHAR(50) NOT NULL,

    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    zip_code VARCHAR(20),

    phone VARCHAR(50),
    email VARCHAR(255),

    currency VARCHAR(20) DEFAULT 'PKR',
    timezone VARCHAR(100) DEFAULT 'Asia/Karachi',
    date_format VARCHAR(50) DEFAULT 'd-m-Y',

    tax_number VARCHAR(100),

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stores_tenant_id
ON stores(tenant_id);

CREATE INDEX idx_stores_type
ON stores(store_type);

-- =========================================================
-- USERS
-- =========================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL REFERENCES tenants(id)
    ON DELETE CASCADE,

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),

    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,

    phone VARCHAR(50),
    avatar TEXT,

    last_login_at TIMESTAMP,

    is_super_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_tenant_id
ON users(tenant_id);

CREATE INDEX idx_users_email
ON users(email);

-- =========================================================
-- ROLES
-- =========================================================

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL REFERENCES tenants(id)
    ON DELETE CASCADE,

    name VARCHAR(100) NOT NULL,
    description TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_role_per_tenant UNIQUE (tenant_id, name)
);

CREATE INDEX idx_roles_tenant_id
ON roles(tenant_id);

-- =========================================================
-- PERMISSIONS
-- =========================================================

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(150) UNIQUE NOT NULL,
    module VARCHAR(100),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- ROLE PERMISSIONS
-- =========================================================

CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id)
    ON DELETE CASCADE,

    permission_id UUID NOT NULL REFERENCES permissions(id)
    ON DELETE CASCADE,

    PRIMARY KEY (role_id, permission_id)
);

-- =========================================================
-- USER ROLES
-- =========================================================

CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id)
    ON DELETE CASCADE,

    role_id UUID NOT NULL REFERENCES roles(id)
    ON DELETE CASCADE,

    PRIMARY KEY (user_id, role_id)
);

-- =========================================================
-- SETTINGS
-- =========================================================

CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL REFERENCES tenants(id)
    ON DELETE CASCADE,

    store_id UUID REFERENCES stores(id)
    ON DELETE CASCADE,

    setting_key VARCHAR(255) NOT NULL,
    setting_value TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_setting UNIQUE (tenant_id, store_id, setting_key)
);

CREATE INDEX idx_settings_tenant_id
ON settings(tenant_id);

-- =========================================================
-- CATEGORIES
-- =========================================================

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL REFERENCES tenants(id)
    ON DELETE CASCADE,

    parent_id UUID REFERENCES categories(id)
    ON DELETE SET NULL,

    name VARCHAR(255) NOT NULL,
    image TEXT,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_tenant_id
ON categories(tenant_id);

-- =========================================================
-- BRANDS
-- =========================================================

CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL REFERENCES tenants(id)
    ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_brands_tenant_id
ON brands(tenant_id);

-- =========================================================
-- UNITS
-- =========================================================

CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL REFERENCES tenants(id)
    ON DELETE CASCADE,

    name VARCHAR(100) NOT NULL,
    short_name VARCHAR(20) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_units_tenant_id
ON units(tenant_id);

-- =========================================================
-- TAXES
-- =========================================================

CREATE TABLE taxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL REFERENCES tenants(id)
    ON DELETE CASCADE,

    name VARCHAR(100) NOT NULL,
    rate NUMERIC(5,2) NOT NULL,

    tax_type VARCHAR(50) DEFAULT 'percentage',

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_taxes_tenant_id
ON taxes(tenant_id);

-- =========================================================
-- PRODUCTS
-- =========================================================

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL REFERENCES tenants(id)
    ON DELETE CASCADE,

    category_id UUID REFERENCES categories(id)
    ON DELETE SET NULL,

    brand_id UUID REFERENCES brands(id)
    ON DELETE SET NULL,

    unit_id UUID REFERENCES units(id)
    ON DELETE SET NULL,

    tax_id UUID REFERENCES taxes(id)
    ON DELETE SET NULL,

    name VARCHAR(255) NOT NULL,

    sku VARCHAR(100),
    barcode VARCHAR(255),

    product_type VARCHAR(50) DEFAULT 'simple',

    cost_price NUMERIC(12,2) DEFAULT 0,
    selling_price NUMERIC(12,2) DEFAULT 0,

    stock_quantity NUMERIC(12,2) DEFAULT 0,
    stock_alert_quantity NUMERIC(12,2) DEFAULT 0,

    has_expiry BOOLEAN DEFAULT FALSE,
    has_batch BOOLEAN DEFAULT FALSE,

    image TEXT,
    description TEXT,

    is_active BOOLEAN DEFAULT TRUE,

    created_by UUID REFERENCES users(id)
    ON DELETE SET NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_product_sku_per_tenant UNIQUE (tenant_id, sku)
);

CREATE INDEX idx_products_tenant_id
ON products(tenant_id);

CREATE INDEX idx_products_category_id
ON products(category_id);

CREATE INDEX idx_products_barcode
ON products(barcode);

CREATE INDEX idx_products_name
ON products(name);

-- =========================================================
-- PRODUCT VARIANTS
-- =========================================================

CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    product_id UUID NOT NULL REFERENCES products(id)
    ON DELETE CASCADE,

    variant_name VARCHAR(255) NOT NULL,

    sku VARCHAR(100),
    barcode VARCHAR(255),

    cost_price NUMERIC(12,2) DEFAULT 0,
    selling_price NUMERIC(12,2) DEFAULT 0,

    stock_quantity NUMERIC(12,2) DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_variants_product_id
ON product_variants(product_id);

-- =========================================================
-- PRODUCT BATCHES (PHARMACY)
-- =========================================================

CREATE TABLE product_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    product_id UUID NOT NULL REFERENCES products(id)
    ON DELETE CASCADE,

    batch_no VARCHAR(100) NOT NULL,

    manufacture_date DATE,
    expiry_date DATE,

    quantity NUMERIC(12,2) DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_batches_product_id
ON product_batches(product_id);

CREATE INDEX idx_product_batches_expiry
ON product_batches(expiry_date);

-- =========================================================
-- CUSTOMERS
-- =========================================================

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL REFERENCES tenants(id)
    ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,

    phone VARCHAR(100),
    email VARCHAR(255),

    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),

    loyalty_points INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_tenant_id
ON customers(tenant_id);

CREATE INDEX idx_customers_phone
ON customers(phone);

-- =========================================================
-- SUPPLIERS
-- =========================================================

CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL REFERENCES tenants(id)
    ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,

    phone VARCHAR(100),
    email VARCHAR(255),

    address TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_suppliers_tenant_id
ON suppliers(tenant_id);

-- =========================================================
-- SALES
-- =========================================================

CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL REFERENCES tenants(id)
    ON DELETE CASCADE,

    store_id UUID NOT NULL REFERENCES stores(id)
    ON DELETE CASCADE,

    customer_id UUID REFERENCES customers(id)
    ON DELETE SET NULL,

    invoice_no VARCHAR(100) NOT NULL,

    subtotal NUMERIC(12,2) DEFAULT 0,
    discount NUMERIC(12,2) DEFAULT 0,
    tax NUMERIC(12,2) DEFAULT 0,
    shipping NUMERIC(12,2) DEFAULT 0,

    grand_total NUMERIC(12,2) DEFAULT 0,

    payment_status VARCHAR(50) DEFAULT 'pending',
    sale_status VARCHAR(50) DEFAULT 'completed',

    notes TEXT,

    created_by UUID REFERENCES users(id)
    ON DELETE SET NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_invoice_per_store UNIQUE (store_id, invoice_no)
);

CREATE INDEX idx_sales_tenant_id
ON sales(tenant_id);

CREATE INDEX idx_sales_store_id
ON sales(store_id);

CREATE INDEX idx_sales_customer_id
ON sales(customer_id);

CREATE INDEX idx_sales_created_at
ON sales(created_at);

-- =========================================================
-- SALE ITEMS
-- =========================================================

CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    sale_id UUID NOT NULL REFERENCES sales(id)
    ON DELETE CASCADE,

    product_id UUID REFERENCES products(id)
    ON DELETE SET NULL,

    product_variant_id UUID REFERENCES product_variants(id)
    ON DELETE SET NULL,

    quantity NUMERIC(12,2) NOT NULL DEFAULT 1,

    price NUMERIC(12,2) NOT NULL DEFAULT 0,
    discount NUMERIC(12,2) DEFAULT 0,
    tax NUMERIC(12,2) DEFAULT 0,

    total NUMERIC(12,2) NOT NULL DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sale_items_sale_id
ON sale_items(sale_id);

CREATE INDEX idx_sale_items_product_id
ON sale_items(product_id);

-- =========================================================
-- PURCHASES
-- =========================================================

CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL REFERENCES tenants(id)
    ON DELETE CASCADE,

    store_id UUID NOT NULL REFERENCES stores(id)
    ON DELETE CASCADE,

    supplier_id UUID REFERENCES suppliers(id)
    ON DELETE SET NULL,

    invoice_no VARCHAR(100),

    subtotal NUMERIC(12,2) DEFAULT 0,
    discount NUMERIC(12,2) DEFAULT 0,
    tax NUMERIC(12,2) DEFAULT 0,

    grand_total NUMERIC(12,2) DEFAULT 0,

    payment_status VARCHAR(50) DEFAULT 'pending',

    notes TEXT,

    created_by UUID REFERENCES users(id)
    ON DELETE SET NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_purchases_tenant_id
ON purchases(tenant_id);

CREATE INDEX idx_purchases_store_id
ON purchases(store_id);

-- =========================================================
-- PURCHASE ITEMS
-- =========================================================

CREATE TABLE purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    purchase_id UUID NOT NULL REFERENCES purchases(id)
    ON DELETE CASCADE,

    product_id UUID REFERENCES products(id)
    ON DELETE SET NULL,

    quantity NUMERIC(12,2) DEFAULT 1,

    cost_price NUMERIC(12,2) DEFAULT 0,
    tax NUMERIC(12,2) DEFAULT 0,
    discount NUMERIC(12,2) DEFAULT 0,

    total NUMERIC(12,2) DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_purchase_items_purchase_id
ON purchase_items(purchase_id);

-- =========================================================
-- STOCK MOVEMENTS
-- =========================================================

CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL REFERENCES tenants(id)
    ON DELETE CASCADE,

    store_id UUID REFERENCES stores(id)
    ON DELETE CASCADE,

    product_id UUID NOT NULL REFERENCES products(id)
    ON DELETE CASCADE,

    movement_type VARCHAR(50) NOT NULL,

    quantity NUMERIC(12,2) NOT NULL,

    reference_type VARCHAR(50),
    reference_id UUID,

    notes TEXT,

    created_by UUID REFERENCES users(id)
    ON DELETE SET NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stock_movements_product_id
ON stock_movements(product_id);

CREATE INDEX idx_stock_movements_tenant_id
ON stock_movements(tenant_id);

-- =========================================================
-- RESTAURANT TABLES
-- =========================================================

CREATE TABLE restaurant_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL REFERENCES tenants(id)
    ON DELETE CASCADE,

    store_id UUID NOT NULL REFERENCES stores(id)
    ON DELETE CASCADE,

    table_name VARCHAR(100) NOT NULL,
    capacity INTEGER DEFAULT 1,

    status VARCHAR(50) DEFAULT 'available',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_restaurant_tables_store_id
ON restaurant_tables(store_id);

-- =========================================================
-- CASH REGISTERS
-- =========================================================

CREATE TABLE cash_registers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL REFERENCES tenants(id)
    ON DELETE CASCADE,

    store_id UUID NOT NULL REFERENCES stores(id)
    ON DELETE CASCADE,

    user_id UUID REFERENCES users(id)
    ON DELETE SET NULL,

    opening_balance NUMERIC(12,2) DEFAULT 0,
    closing_balance NUMERIC(12,2),

    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP,

    status VARCHAR(50) DEFAULT 'open'
);

CREATE INDEX idx_cash_registers_store_id
ON cash_registers(store_id);

-- =========================================================
-- EXPENSE CATEGORIES
-- =========================================================

CREATE TABLE expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL REFERENCES tenants(id)
    ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- EXPENSES
-- =========================================================

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL REFERENCES tenants(id)
    ON DELETE CASCADE,

    store_id UUID REFERENCES stores(id)
    ON DELETE CASCADE,

    category_id UUID REFERENCES expense_categories(id)
    ON DELETE SET NULL,

    amount NUMERIC(12,2) NOT NULL,

    notes TEXT,

    expense_date DATE DEFAULT CURRENT_DATE,

    created_by UUID REFERENCES users(id)
    ON DELETE SET NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expenses_tenant_id
ON expenses(tenant_id);

-- =========================================================
-- AUDIT LOGS
-- =========================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID REFERENCES tenants(id)
    ON DELETE CASCADE,

    user_id UUID REFERENCES users(id)
    ON DELETE SET NULL,

    module VARCHAR(100),
    action VARCHAR(100),

    record_id UUID,

    old_values JSONB,
    new_values JSONB,

    ip_address VARCHAR(100),
    user_agent TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_tenant_id
ON audit_logs(tenant_id);

CREATE INDEX idx_audit_logs_user_id
ON audit_logs(user_id);

-- =========================================================
-- SUBSCRIPTIONS
-- =========================================================

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL REFERENCES tenants(id)
    ON DELETE CASCADE,

    subscription_plan_id UUID REFERENCES subscription_plans(id)
    ON DELETE SET NULL,

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    amount NUMERIC(12,2) DEFAULT 0,

    payment_status VARCHAR(50) DEFAULT 'pending',
    status VARCHAR(50) DEFAULT 'active',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_tenant_id
ON subscriptions(tenant_id);

-- =========================================================
-- TRIGGERS FOR UPDATED_AT
-- =========================================================

CREATE TRIGGER trg_subscription_plans_updated_at
BEFORE UPDATE ON subscription_plans
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_tenants_updated_at
BEFORE UPDATE ON tenants
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_stores_updated_at
BEFORE UPDATE ON stores
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_roles_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_brands_updated_at
BEFORE UPDATE ON brands
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_units_updated_at
BEFORE UPDATE ON units
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_product_variants_updated_at
BEFORE UPDATE ON product_variants
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_customers_updated_at
BEFORE UPDATE ON customers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_suppliers_updated_at
BEFORE UPDATE ON suppliers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_sales_updated_at
BEFORE UPDATE ON sales
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_purchases_updated_at
BEFORE UPDATE ON purchases
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_restaurant_tables_updated_at
BEFORE UPDATE ON restaurant_tables
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- DEFAULT PERMISSIONS
-- =========================================================

INSERT INTO permissions(name, module) VALUES
('dashboard.view', 'dashboard'),

('products.create', 'products'),
('products.view', 'products'),
('products.update', 'products'),
('products.delete', 'products'),

('sales.create', 'sales'),
('sales.view', 'sales'),
('sales.update', 'sales'),
('sales.delete', 'sales'),

('purchases.create', 'purchases'),
('purchases.view', 'purchases'),
('purchases.update', 'purchases'),
('purchases.delete', 'purchases'),

('customers.create', 'customers'),
('customers.view', 'customers'),
('customers.update', 'customers'),
('customers.delete', 'customers'),

('suppliers.create', 'suppliers'),
('suppliers.view', 'suppliers'),
('suppliers.update', 'suppliers'),
('suppliers.delete', 'suppliers'),

('users.create', 'users'),
('users.view', 'users'),
('users.update', 'users'),
('users.delete', 'users'),

('reports.view', 'reports'),
('settings.manage', 'settings');

-- =========================================================
-- MULTI LANGUAGE SUPPORT
-- =========================================================

CREATE TABLE languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    native_name VARCHAR(100),

    is_rtl BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_languages_code
ON languages(code);

-- =========================================================
-- TRANSLATIONS
-- =========================================================

CREATE TABLE translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID REFERENCES tenants(id)
    ON DELETE CASCADE,

    language_id UUID NOT NULL REFERENCES languages(id)
    ON DELETE CASCADE,

    translation_group VARCHAR(100) NOT NULL,
    translation_key VARCHAR(255) NOT NULL,
    translation_value TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_translation UNIQUE (
        tenant_id,
        language_id,
        translation_group,
        translation_key
    )
);

CREATE INDEX idx_translations_language_id
ON translations(language_id);

CREATE INDEX idx_translations_tenant_id
ON translations(tenant_id);

-- =========================================================
-- PRODUCT TRANSLATIONS
-- =========================================================

CREATE TABLE product_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    product_id UUID NOT NULL REFERENCES products(id)
    ON DELETE CASCADE,

    language_id UUID NOT NULL REFERENCES languages(id)
    ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    description TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_product_language UNIQUE (
        product_id,
        language_id
    )
);

CREATE INDEX idx_product_translations_product_id
ON product_translations(product_id);

-- =========================================================
-- CATEGORY TRANSLATIONS
-- =========================================================

CREATE TABLE category_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    category_id UUID NOT NULL REFERENCES categories(id)
    ON DELETE CASCADE,

    language_id UUID NOT NULL REFERENCES languages(id)
    ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_category_language UNIQUE (
        category_id,
        language_id
    )
);

CREATE INDEX idx_category_translations_category_id
ON category_translations(category_id);

-- =========================================================
-- STORE LANGUAGE SETTINGS
-- =========================================================

CREATE TABLE store_languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    store_id UUID NOT NULL REFERENCES stores(id)
    ON DELETE CASCADE,

    language_id UUID NOT NULL REFERENCES languages(id)
    ON DELETE CASCADE,

    is_default BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_store_language UNIQUE (
        store_id,
        language_id
    )
);

CREATE INDEX idx_store_languages_store_id
ON store_languages(store_id);

-- =========================================================
-- DEFAULT LANGUAGES
-- =========================================================

INSERT INTO languages(code, name, native_name, is_default) VALUES
('en', 'English', 'English', TRUE),
('ur', 'Urdu', 'اردو', FALSE),
('ar', 'Arabic', 'العربية', FALSE),
('fr', 'French', 'Français', FALSE),
('es', 'Spanish', 'Español', FALSE);

-- =========================================================
-- PRODUCT ATTRIBUTES / OPTIONS / SIZES / COLORS
-- =========================================================

CREATE TABLE attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL REFERENCES tenants(id)
    ON DELETE CASCADE,

    name VARCHAR(100) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attribute_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    attribute_id UUID NOT NULL REFERENCES attributes(id)
    ON DELETE CASCADE,

    value VARCHAR(100) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_attribute_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    product_id UUID NOT NULL REFERENCES products(id)
    ON DELETE CASCADE,

    attribute_id UUID NOT NULL REFERENCES attributes(id)
    ON DELETE CASCADE,

    attribute_value_id UUID NOT NULL REFERENCES attribute_values(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_attributes_tenant_id
ON attributes(tenant_id);

CREATE INDEX idx_attribute_values_attribute_id
ON attribute_values(attribute_id);

CREATE INDEX idx_product_attribute_values_product_id
ON product_attribute_values(product_id);

-- =========================================================
-- DUMMY / REALISTIC SEED DATA
-- =========================================================

-- Subscription Plan
INSERT INTO subscription_plans (
    id,
    name,
    code,
    price,
    duration_days,
    max_users,
    max_stores
)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Professional Plan',
    'PRO',
    49.99,
    30,
    50,
    10
);

-- Tenant
INSERT INTO tenants (
    id,
    subscription_plan_id,
    business_name,
    slug,
    email,
    phone,
    subscription_status,
    trial_ends_at
)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Demo POS Company',
    'demo-pos-company',
    'admin@demopos.com',
    '+92-300-0000000',
    'active',
    CURRENT_TIMESTAMP + INTERVAL '7 days'
);

-- Attributes
INSERT INTO attributes (id, tenant_id, name)
VALUES
('10101010-1010-1010-1010-101010101010', '22222222-2222-2222-2222-222222222222', 'Size'),
('20202020-2020-2020-2020-202020202020', '22222222-2222-2222-2222-222222222222', 'Color'),
('30303030-3030-3030-3030-303030303030', '22222222-2222-2222-2222-222222222222', 'Flavor');

-- Attribute Values
INSERT INTO attribute_values (id, attribute_id, value)
VALUES
('11110000-0000-0000-0000-000000000001', '10101010-1010-1010-1010-101010101010', 'Small'),
('11110000-0000-0000-0000-000000000002', '10101010-1010-1010-1010-101010101010', 'Medium'),
('11110000-0000-0000-0000-000000000003', '10101010-1010-1010-1010-101010101010', 'Large'),
('22220000-0000-0000-0000-000000000001', '20202020-2020-2020-2020-202020202020', 'Black'),
('22220000-0000-0000-0000-000000000002', '20202020-2020-2020-2020-202020202020', 'White'),
('33330000-0000-0000-0000-000000000001', '30303030-3030-3030-3030-303030303030', 'Vanilla'),
('33330000-0000-0000-0000-000000000002', '30303030-3030-3030-3030-303030303030', 'Chocolate');

-- Stores
INSERT INTO stores (
    id,
    tenant_id,
    name,
    code,
    store_type,
    city,
    country
)
VALUES
(
    '33333333-3333-3333-3333-333333333331',
    '22222222-2222-2222-2222-222222222222',
    'Main Retail Store',
    'RET-001',
    'retail',
    'Peshawar',
    'Pakistan'
),
(
    '33333333-3333-3333-3333-333333333332',
    '22222222-2222-2222-2222-222222222222',
    'Restaurant Branch',
    'RES-001',
    'restaurant',
    'Islamabad',
    'Pakistan'
),
(
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    'Pharmacy Store',
    'PHA-001',
    'pharmacy',
    'Lahore',
    'Pakistan'
);

-- Users
INSERT INTO users (
    id,
    tenant_id,
    first_name,
    last_name,
    email,
    password_hash,
    is_super_admin
)
VALUES
(
    '44444444-4444-4444-4444-444444444441',
    '22222222-2222-2222-2222-222222222222',
    'Super',
    'Admin',
    'superadmin@demopos.com',
    '$2b$10$abcdefghijklmnopqrstuv',
    TRUE
),
(
    '44444444-4444-4444-4444-444444444442',
    '22222222-2222-2222-2222-222222222222',
    'Cashier',
    'One',
    'cashier@demopos.com',
    '$2b$10$abcdefghijklmnopqrstuv',
    FALSE
);

-- Roles
INSERT INTO roles (
    id,
    tenant_id,
    name
)
VALUES
(
    '55555555-5555-5555-5555-555555555551',
    '22222222-2222-2222-2222-222222222222',
    'Admin'
),
(
    '55555555-5555-5555-5555-555555555552',
    '22222222-2222-2222-2222-222222222222',
    'Cashier'
);

-- User Roles
INSERT INTO user_roles(user_id, role_id)
VALUES
(
    '44444444-4444-4444-4444-444444444441',
    '55555555-5555-5555-5555-555555555551'
),
(
    '44444444-4444-4444-4444-444444444442',
    '55555555-5555-5555-5555-555555555552'
);

-- Categories
INSERT INTO categories (
    id,
    tenant_id,
    name
)
VALUES
('66666666-6666-6666-6666-666666666661', '22222222-2222-2222-2222-222222222222', 'Beverages'),
('66666666-6666-6666-6666-666666666662', '22222222-2222-2222-2222-222222222222', 'Medicines'),
('66666666-6666-6666-6666-666666666663', '22222222-2222-2222-2222-222222222222', 'Electronics'),
('66666666-6666-6666-6666-666666666664', '22222222-2222-2222-2222-222222222222', 'Fast Food');

-- Brands
INSERT INTO brands (
    id,
    tenant_id,
    name
)
VALUES
('77777777-7777-7777-7777-777777777771', '22222222-2222-2222-2222-222222222222', 'Nestle'),
('77777777-7777-7777-7777-777777777772', '22222222-2222-2222-2222-222222222222', 'Samsung'),
('77777777-7777-7777-7777-777777777773', '22222222-2222-2222-2222-222222222222', 'Pfizer');

-- Units
INSERT INTO units (
    id,
    tenant_id,
    name,
    short_name
)
VALUES
('88888888-8888-8888-8888-888888888881', '22222222-2222-2222-2222-222222222222', 'Piece', 'PCS'),
('88888888-8888-8888-8888-888888888882', '22222222-2222-2222-2222-222222222222', 'Kilogram', 'KG'),
('88888888-8888-8888-8888-888888888883', '22222222-2222-2222-2222-222222222222', 'Liter', 'LTR');

-- Taxes
INSERT INTO taxes (
    id,
    tenant_id,
    name,
    rate
)
VALUES
('99999999-9999-9999-9999-999999999991', '22222222-2222-2222-2222-222222222222', 'GST', 18),
('99999999-9999-9999-9999-999999999992', '22222222-2222-2222-2222-222222222222', 'VAT', 5);

-- Products
INSERT INTO products (
    id,
    tenant_id,
    category_id,
    brand_id,
    unit_id,
    tax_id,
    name,
    sku,
    barcode,
    cost_price,
    selling_price,
    stock_quantity,
    created_by
)
VALUES
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    '22222222-2222-2222-2222-222222222222',
    '66666666-6666-6666-6666-666666666661',
    '77777777-7777-7777-7777-777777777771',
    '88888888-8888-8888-8888-888888888883',
    '99999999-9999-9999-9999-999999999991',
    'Pepsi 1L',
    'PEP-001',
    '123456789',
    100,
    150,
    200,
    '44444444-4444-4444-4444-444444444441'
),
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    '22222222-2222-2222-2222-222222222222',
    '66666666-6666-6666-6666-666666666663',
    '77777777-7777-7777-7777-777777777772',
    '88888888-8888-8888-8888-888888888881',
    '99999999-9999-9999-9999-999999999991',
    'Samsung Headphones',
    'SAM-001',
    '987654321',
    2000,
    3500,
    25,
    '44444444-4444-4444-4444-444444444441'
);

-- Customers
INSERT INTO customers (
    id,
    tenant_id,
    name,
    phone,
    email,
    city,
    country
)
VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '22222222-2222-2222-2222-222222222222', 'Ali Khan', '+92-300-1111111', 'ali@example.com', 'Peshawar', 'Pakistan'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '22222222-2222-2222-2222-222222222222', 'Ahmed Raza', '+92-300-2222222', 'ahmed@example.com', 'Lahore', 'Pakistan'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', '22222222-2222-2222-2222-222222222222', 'John Smith', '+1-555-111111', 'john@example.com', 'New York', 'USA');

-- Suppliers
INSERT INTO suppliers (
    id,
    tenant_id,
    name,
    phone,
    email
)
VALUES
('cccccccc-cccc-cccc-cccc-ccccccccccc1', '22222222-2222-2222-2222-222222222222', 'Global Traders', '+92-300-5555555', 'supplier1@example.com'),
('cccccccc-cccc-cccc-cccc-ccccccccccc2', '22222222-2222-2222-2222-222222222222', 'Tech Wholesale', '+92-300-6666666', 'supplier2@example.com');

-- Sales
INSERT INTO sales (
    id,
    tenant_id,
    store_id,
    customer_id,
    invoice_no,
    subtotal,
    tax,
    grand_total,
    created_by
)
VALUES
(
    'dddddddd-dddd-dddd-dddd-ddddddddddd1',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333331',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'INV-1001',
    150,
    27,
    177,
    '44444444-4444-4444-4444-444444444442'
);

-- Sale Items
INSERT INTO sale_items (
    sale_id,
    product_id,
    quantity,
    price,
    tax,
    total
)
VALUES
(
    'dddddddd-dddd-dddd-dddd-ddddddddddd1',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    1,
    150,
    27,
    177
);

-- Restaurant Tables
INSERT INTO restaurant_tables (
    tenant_id,
    store_id,
    table_name,
    capacity
)
VALUES
('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333332', 'Table 1', 4),
('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333332', 'Table 2', 6),
('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333332', 'VIP Table', 8);

-- Settings
INSERT INTO settings (
    tenant_id,
    store_id,
    setting_key,
    setting_value
)
VALUES
('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333331', 'currency', 'PKR'),
('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333331', 'date_format', 'd-m-Y'),
('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333332', 'enable_kitchen', 'true'),
('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'enable_expiry', 'true');

-- =========================================================
-- END OF PROFESSIONAL SAAS POS DATABASE
-- =========================================================
