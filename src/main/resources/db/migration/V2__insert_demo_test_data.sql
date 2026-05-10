-- ============================================
-- DEMO TEST DATA - WEB TMDT System
-- ============================================
-- This script creates demo data for testing all roles and features

-- ============================================
-- 1. ADMIN ACCOUNT
-- ============================================
INSERT INTO users (email, password, role, status) VALUES
('admin@webtmdt.com', '$2b$10$o/YagCaKIryumkA2kOlyOeebuz8eS1ekkJt.BCwOI4LeTFTVOKHQS', 'ADMIN', 'ACTIVE')
ON DUPLICATE KEY UPDATE password = VALUES(password), status = VALUES(status);

-- ============================================
-- 2. CUSTOMER ACCOUNTS
-- ============================================
INSERT INTO users (email, password, role, status) VALUES
('customer.test@webtmdt.com', '$2b$10$o/YagCaKIryumkA2kOlyOeebuz8eS1ekkJt.BCwOI4LeTFTVOKHQS', 'CUSTOMER', 'ACTIVE')
ON DUPLICATE KEY UPDATE password = VALUES(password), status = VALUES(status);

-- Insert customer profile
INSERT INTO customers (user_id, full_name, phone, gender, birth_date, address) 
SELECT id, 'Khách Hàng Test', '0987654321', 'MALE', '1990-05-10', 'Hà Nội, Việt Nam'
FROM users WHERE email = 'customer.test@webtmdt.com'
ON DUPLICATE KEY UPDATE phone = VALUES(phone), full_name = VALUES(full_name);

-- ============================================
-- 3. EMPLOYEE ACCOUNTS - All Positions
-- ============================================
-- SALE Position
INSERT INTO users (email, password, role, status) VALUES
('sale.test@webtmdt.com', '$2b$10$o/YagCaKIryumkA2kOlyOeebuz8eS1ekkJt.BCwOI4LeTFTVOKHQS', 'EMPLOYEE', 'ACTIVE')
ON DUPLICATE KEY UPDATE password = VALUES(password), status = VALUES(status);

INSERT INTO employees (user_id, position, full_name, phone, address, first_login)
SELECT id, 'SALE', 'Nhân Viên Bán Hàng', '0912345678', 'HCM, Việt Nam', FALSE
FROM users WHERE email = 'sale.test@webtmdt.com'
ON DUPLICATE KEY UPDATE position = VALUES(position), full_name = VALUES(full_name);

-- CSKH (Customer Support) Position
INSERT INTO users (email, password, role, status) VALUES
('cskh.test@webtmdt.com', '$2b$10$o/YagCaKIryumkA2kOlyOeebuz8eS1ekkJt.BCwOI4LeTFTVOKHQS', 'EMPLOYEE', 'ACTIVE')
ON DUPLICATE KEY UPDATE password = VALUES(password), status = VALUES(status);

INSERT INTO employees (user_id, position, full_name, phone, address, first_login)
SELECT id, 'CSKH', 'Nhân Viên Hỗ Trợ Khách Hàng', '0923456789', 'HCM, Việt Nam', FALSE
FROM users WHERE email = 'cskh.test@webtmdt.com'
ON DUPLICATE KEY UPDATE position = VALUES(position), full_name = VALUES(full_name);

-- PM (Product Manager) Position
INSERT INTO users (email, password, role, status) VALUES
('pm.test@webtmdt.com', '$2b$10$o/YagCaKIryumkA2kOlyOeebuz8eS1ekkJt.BCwOI4LeTFTVOKHQS', 'EMPLOYEE', 'ACTIVE')
ON DUPLICATE KEY UPDATE password = VALUES(password), status = VALUES(status);

INSERT INTO employees (user_id, position, full_name, phone, address, first_login)
SELECT id, 'PRODUCT_MANAGER', 'Quản Lý Sản Phẩm', '0934567890', 'Đà Nẵng, Việt Nam', FALSE
FROM users WHERE email = 'pm.test@webtmdt.com'
ON DUPLICATE KEY UPDATE position = VALUES(position), full_name = VALUES(full_name);

-- WAREHOUSE Position
INSERT INTO users (email, password, role, status) VALUES
('warehouse.test@webtmdt.com', '$2b$10$o/YagCaKIryumkA2kOlyOeebuz8eS1ekkJt.BCwOI4LeTFTVOKHQS', 'EMPLOYEE', 'ACTIVE')
ON DUPLICATE KEY UPDATE password = VALUES(password), status = VALUES(status);

INSERT INTO employees (user_id, position, full_name, phone, address, first_login)
SELECT id, 'WAREHOUSE', 'Nhân Viên Kho Hàng', '0945678901', 'Bình Dương, Việt Nam', FALSE
FROM users WHERE email = 'warehouse.test@webtmdt.com'
ON DUPLICATE KEY UPDATE position = VALUES(position), full_name = VALUES(full_name);

-- ACCOUNTANT Position
INSERT INTO users (email, password, role, status) VALUES
('accountant.test@webtmdt.com', '$2b$10$o/YagCaKIryumkA2kOlyOeebuz8eS1ekkJt.BCwOI4LeTFTVOKHQS', 'EMPLOYEE', 'ACTIVE')
ON DUPLICATE KEY UPDATE password = VALUES(password), status = VALUES(status);

INSERT INTO employees (user_id, position, full_name, phone, address, first_login)
SELECT id, 'ACCOUNTANT', 'Nhân Viên Kế Toán', '0956789012', 'Hà Nội, Việt Nam', FALSE
FROM users WHERE email = 'accountant.test@webtmdt.com'
ON DUPLICATE KEY UPDATE position = VALUES(position), full_name = VALUES(full_name);

-- SHIPPER Position
INSERT INTO users (email, password, role, status) VALUES
('shipper.test@webtmdt.com', '$2b$10$o/YagCaKIryumkA2kOlyOeebuz8eS1ekkJt.BCwOI4LeTFTVOKHQS', 'EMPLOYEE', 'ACTIVE')
ON DUPLICATE KEY UPDATE password = VALUES(password), status = VALUES(status);

INSERT INTO employees (user_id, position, full_name, phone, address, first_login)
SELECT id, 'SHIPPER', 'Nhân Viên Giao Hàng', '0967890123', 'Hồ Chí Minh, Việt Nam', FALSE
FROM users WHERE email = 'shipper.test@webtmdt.com'
ON DUPLICATE KEY UPDATE position = VALUES(position), full_name = VALUES(full_name);

-- ============================================
-- 4. PRODUCT CATEGORIES
-- ============================================
INSERT INTO categories (name, description, image_url) VALUES
('Điện Thoại', 'Các loại điện thoại thông minh', 'https://via.placeholder.com/300x200?text=Smartphones'),
('Laptop', 'Máy tính xách tay', 'https://via.placeholder.com/300x200?text=Laptops'),
('Phụ Kiện', 'Phụ kiện điện tử', 'https://via.placeholder.com/300x200?text=Accessories'),
('Tablet', 'Máy tính bảng', 'https://via.placeholder.com/300x200?text=Tablets'),
('Đồ Gia Dụng', 'Các đồ gia dụng thông minh', 'https://via.placeholder.com/300x200?text=Home%20Appliances')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- ============================================
-- 5. SAMPLE PRODUCTS
-- ============================================
INSERT INTO products (category_id, name, price, sku, description, stock_quantity, reserved_quantity) VALUES
-- Smartphones
((SELECT id FROM categories WHERE name = 'Điện Thoại' LIMIT 1), 'iPhone 15 Pro Max', 25990000, 'IPHONE-15-PRO-MAX', 'Điện thoại cao cấp từ Apple', 50, 0),
((SELECT id FROM categories WHERE name = 'Điện Thoại' LIMIT 1), 'Samsung Galaxy S24', 19990000, 'SAMSUNG-S24', 'Điện thoại flagship Samsung', 45, 0),
((SELECT id FROM categories WHERE name = 'Điện Thoại' LIMIT 1), 'Xiaomi 14 Ultra', 14990000, 'XIAOMI-14-ULTRA', 'Điện thoại giá rẻ cao cấp', 60, 0),
-- Laptops
((SELECT id FROM categories WHERE name = 'Laptop' LIMIT 1), 'MacBook Pro M3', 35990000, 'MACBOOK-PRO-M3', 'Laptop siêu mạnh từ Apple', 30, 0),
((SELECT id FROM categories WHERE name = 'Laptop' LIMIT 1), 'Dell XPS 15', 26990000, 'DELL-XPS-15', 'Laptop gaming cao cấp', 25, 0),
-- Accessories
((SELECT id FROM categories WHERE name = 'Phụ Kiện' LIMIT 1), 'AirPods Pro 2', 5990000, 'AIRPODS-PRO-2', 'Tai nghe không dây Apple', 100, 0),
((SELECT id FROM categories WHERE name = 'Phụ Kiện' LIMIT 1), 'Samsung Galaxy Buds', 3990000, 'GALAXY-BUDS', 'Tai nghe không dây Samsung', 80, 0),
-- Tablets
((SELECT id FROM categories WHERE name = 'Tablet' LIMIT 1), 'iPad Air 2024', 18990000, 'IPAD-AIR-2024', 'Máy tính bảng Apple', 40, 0),
((SELECT id FROM categories WHERE name = 'Tablet' LIMIT 1), 'Samsung Tab S9', 12990000, 'SAMSUNG-TAB-S9', 'Máy tính bảng Samsung', 35, 0),
-- Home Appliances
((SELECT id FROM categories WHERE name = 'Đồ Gia Dụng' LIMIT 1), 'Robot Hút Bụi', 8990000, 'ROBOT-VACUUM', 'Robot hút bụi thông minh', 20, 0),
((SELECT id FROM categories WHERE name = 'Đồ Gia Dụng' LIMIT 1), 'Loa Thông Minh', 1990000, 'SMART-SPEAKER', 'Loa thông minh với AI', 50, 0)
ON DUPLICATE KEY UPDATE name = VALUES(name), price = VALUES(price), description = VALUES(description);

-- ============================================
-- 6. SAMPLE ORDERS (from customer)
-- ============================================
INSERT INTO orders (customer_id, total_amount, discount_amount, final_amount, shipping_address, order_status, created_at) 
SELECT 
    c.id,
    29990000,
    1000000,
    28990000,
    'Hà Nội, Việt Nam',
    'PENDING',
    NOW()
FROM customers c 
WHERE c.id NOT IN (SELECT customer_id FROM orders WHERE customer_id = c.id)
LIMIT 1;

-- ============================================
-- 7. SAMPLE ORDER ITEMS
-- ============================================
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
SELECT 
    o.id,
    p.id,
    1,
    p.price,
    p.price
FROM orders o, products p
WHERE o.id NOT IN (SELECT order_id FROM order_items WHERE order_id = o.id)
  AND p.sku = 'IPHONE-15-PRO-MAX'
LIMIT 1;

INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
SELECT 
    o.id,
    p.id,
    2,
    p.price / 2,
    p.price
FROM orders o, products p
WHERE o.id NOT IN (SELECT order_id FROM order_items WHERE order_id = o.id AND product_id = p.id)
  AND p.sku = 'AIRPODS-PRO-2'
LIMIT 1;

-- ============================================
-- 8. SAMPLE PAYMENTS
-- ============================================
INSERT INTO payments (order_id, amount, payment_method, payment_status, transaction_id, created_at)
SELECT 
    o.id,
    o.final_amount,
    'BANK_TRANSFER',
    'PENDING',
    CONCAT('TXN-', UNIX_TIMESTAMP(), FLOOR(RAND() * 10000)),
    NOW()
FROM orders o
WHERE o.id NOT IN (SELECT order_id FROM payments WHERE order_id = o.id)
LIMIT 1;

-- ============================================
-- 9. SAMPLE SUPPORT TICKETS
-- ============================================
INSERT INTO support_tickets (customer_id, title, description, status, priority, created_at)
SELECT 
    c.id,
    'Hỏi về bảo hành sản phẩm',
    'Tôi muốn biết sản phẩm này có bảo hành bao lâu?',
    'OPEN',
    'MEDIUM',
    NOW()
FROM customers c
WHERE c.id NOT IN (SELECT customer_id FROM support_tickets WHERE customer_id = c.id LIMIT 1)
LIMIT 1;

INSERT INTO support_tickets (customer_id, title, description, status, priority, created_at)
SELECT 
    c.id,
    'Vấn đề với đơn hàng',
    'Đơn hàng của tôi chưa được giao trong 5 ngày',
    'OPEN',
    'HIGH',
    NOW()
FROM customers c
WHERE c.id NOT IN (SELECT customer_id FROM support_tickets WHERE customer_id = c.id)
LIMIT 1;

-- ============================================
-- 10. SAMPLE PRODUCT REVIEWS
-- ============================================
INSERT INTO product_reviews (product_id, customer_id, rating, comment, created_at)
SELECT 
    p.id,
    c.id,
    5,
    'Sản phẩm rất tốt, giao hàng nhanh, đóng gói cẩn thận!',
    NOW()
FROM products p, customers c
WHERE p.sku = 'IPHONE-15-PRO-MAX' 
  AND p.id NOT IN (SELECT product_id FROM product_reviews WHERE customer_id = c.id AND product_id = p.id)
LIMIT 1;

INSERT INTO product_reviews (product_id, customer_id, rating, comment, created_at)
SELECT 
    p.id,
    c.id,
    4,
    'Chất lượng tốt, giá cả hợp lý',
    NOW()
FROM products p, customers c
WHERE p.sku = 'SAMSUNG-S24' 
  AND p.id NOT IN (SELECT product_id FROM product_reviews WHERE customer_id = c.id AND product_id = p.id)
LIMIT 1;

-- ============================================
-- 11. SAMPLE WISHLIST ITEMS
-- ============================================
INSERT INTO wishlist_items (customer_id, product_id, added_at)
SELECT 
    c.id,
    p.id,
    NOW()
FROM customers c, products p
WHERE p.sku = 'MACBOOK-PRO-M3'
  AND (c.id, p.id) NOT IN (SELECT customer_id, product_id FROM wishlist_items)
LIMIT 1;

INSERT INTO wishlist_items (customer_id, product_id, added_at)
SELECT 
    c.id,
    p.id,
    NOW()
FROM customers c, products p
WHERE p.sku = 'IPAD-AIR-2024'
  AND (c.id, p.id) NOT IN (SELECT customer_id, product_id FROM wishlist_items)
LIMIT 1;

-- ============================================
-- 12. SAMPLE CARTS
-- ============================================
INSERT INTO carts (customer_id, created_at, updated_at)
SELECT 
    c.id,
    NOW(),
    NOW()
FROM customers c
WHERE c.id NOT IN (SELECT customer_id FROM carts WHERE customer_id = c.id)
LIMIT 1;

INSERT INTO cart_items (cart_id, product_id, quantity, added_at)
SELECT 
    cart.id,
    p.id,
    1,
    NOW()
FROM carts cart, customers c, products p
WHERE cart.customer_id = c.id 
  AND p.sku = 'SAMSUNG-GALAXY-BUDS'
  AND cart.id NOT IN (SELECT cart_id FROM cart_items WHERE cart_id = cart.id AND product_id = p.id)
LIMIT 1;

-- ============================================
-- 13. SAMPLE WAREHOUSE INVENTORY
-- ============================================
INSERT INTO warehouse_products (product_id, warehouse_location, quantity_in_stock, quantity_reserved, last_updated)
SELECT 
    p.id,
    'KHO A - TẦNG 1',
    p.stock_quantity,
    0,
    NOW()
FROM products p
WHERE p.id NOT IN (SELECT product_id FROM warehouse_products WHERE product_id = p.id)
LIMIT 5;

-- ============================================
-- Verification - Print summary
-- ============================================
-- Note: These SELECT statements are for verification only

-- Count Users by Role
SELECT 'Admin Users' as Type, COUNT(*) as Total FROM users WHERE role = 'ADMIN'
UNION ALL
SELECT 'Customer Users' as Type, COUNT(*) as Total FROM users WHERE role = 'CUSTOMER'
UNION ALL
SELECT 'Employee Users' as Type, COUNT(*) as Total FROM users WHERE role = 'EMPLOYEE'
UNION ALL
SELECT 'Total Users' as Type, COUNT(*) as Total FROM users;

-- Count Employees by Position
SELECT position, COUNT(*) as Total FROM employees GROUP BY position;

-- Count Products
SELECT 'Total Products' as Type, COUNT(*) as Total FROM products;

-- Count Orders
SELECT 'Total Orders' as Type, COUNT(*) as Total FROM orders;

-- Count Support Tickets
SELECT 'Total Support Tickets' as Type, COUNT(*) as Total FROM support_tickets;

-- Count Product Reviews
SELECT 'Total Product Reviews' as Type, COUNT(*) as Total FROM product_reviews;
