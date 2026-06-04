-- MakeMyEvent / Event Nest - MySQL schema
-- Run once: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS makemyevent
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE makemyevent;

-- ---------------------------------------------------------------------------
-- Core accounts (user, vendor, admin share one table via role)
-- ---------------------------------------------------------------------------
CREATE TABLE users (
    user_id       INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    address       VARCHAR(255),
    contact       VARCHAR(20),
    gender        ENUM('male', 'female', 'other'),
    age           INT,
    role          ENUM('user', 'vendor', 'admin') NOT NULL DEFAULT 'user',
    profile_image VARCHAR(500),
    status        ENUM('active', 'blocked') NOT NULL DEFAULT 'active',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- Vendor business profile (approved vendors only)
-- ---------------------------------------------------------------------------
CREATE TABLE vendor_profiles (
    vendor_id      INT AUTO_INCREMENT PRIMARY KEY,
    user_id        INT NOT NULL UNIQUE,
    business_name  VARCHAR(200) NOT NULL,
    service_category VARCHAR(100),
    city           VARCHAR(100),
    badge          VARCHAR(150),
    description    TEXT,
    location       VARCHAR(200),
    rating         DECIMAL(3,2) DEFAULT 0.00,
    review_count   INT DEFAULT 0,
    price_from     VARCHAR(50),
    image_url      VARCHAR(500),
    status         ENUM('pending', 'approved', 'rejected', 'suspended') DEFAULT 'pending',
    availability   ENUM('available', 'busy', 'offline') DEFAULT 'available',
    profile_views  INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Homepage "Become a Vendor" modal (before admin approval)
CREATE TABLE vendor_registration_requests (
    request_id     INT AUTO_INCREMENT PRIMARY KEY,
    full_name      VARCHAR(150) NOT NULL,
    business_name  VARCHAR(200) NOT NULL,
    email          VARCHAR(150) NOT NULL,
    phone          VARCHAR(20) NOT NULL,
    service_type   VARCHAR(100) NOT NULL,
    city           VARCHAR(100) NOT NULL,
    status         ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- Event catalog (browse vendors page)
-- ---------------------------------------------------------------------------
CREATE TABLE event_categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    slug        VARCHAR(50) NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    icon        VARCHAR(80)
);

CREATE TABLE marketplace_vendors (
    vendor_listing_id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id         INT,
    name              VARCHAR(200) NOT NULL,
    event_type_slug   VARCHAR(50) NOT NULL,
    badge             VARCHAR(150),
    location          VARCHAR(200),
    image_url         VARCHAR(500),
    description       TEXT,
    rating            DECIMAL(3,2) DEFAULT 0.00,
    review_count      INT DEFAULT 0,
    price_from        VARCHAR(50),
    is_active         TINYINT(1) DEFAULT 1,
    FOREIGN KEY (vendor_id) REFERENCES vendor_profiles(vendor_id) ON DELETE SET NULL,
    FOREIGN KEY (event_type_slug) REFERENCES event_categories(slug)
);

CREATE TABLE vendor_packages (
    package_id    INT AUTO_INCREMENT PRIMARY KEY,
    listing_id    INT NOT NULL,
    tier          VARCHAR(50),
    tier_class    VARCHAR(50),
    title         VARCHAR(200) NOT NULL,
    subtitle      VARCHAR(255),
    image_url     VARCHAR(500),
    score         DECIMAL(3,2),
    review_count  INT DEFAULT 0,
    quote_text    TEXT,
    quote_author  VARCHAR(200),
    FOREIGN KEY (listing_id) REFERENCES marketplace_vendors(vendor_listing_id) ON DELETE CASCADE
);

CREATE TABLE package_services (
    item_id    INT AUTO_INCREMENT PRIMARY KEY,
    package_id INT NOT NULL,
    label      VARCHAR(255) NOT NULL,
    icon       VARCHAR(80),
    price      DECIMAL(12,2) NOT NULL DEFAULT 0,
    FOREIGN KEY (package_id) REFERENCES vendor_packages(package_id) ON DELETE CASCADE
);

-- Vendor dashboard: "My Services" (services.html)
CREATE TABLE vendor_services (
    service_id   INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id    INT NOT NULL,
    name         VARCHAR(200) NOT NULL,
    category     VARCHAR(100) NOT NULL,
    price_label  VARCHAR(50),
    description  TEXT,
    image_url    VARCHAR(500),
    status       ENUM('Active', 'Inactive') DEFAULT 'Active',
    FOREIGN KEY (vendor_id) REFERENCES vendor_profiles(vendor_id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- Bookings & requests
-- ---------------------------------------------------------------------------
CREATE TABLE bookings (
    booking_id   INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT NOT NULL,
    vendor_id    INT,
    listing_id   INT,
    package_id   INT,
    event_type   VARCHAR(100),
    event_date   DATE,
    venue        VARCHAR(255),
    total_amount DECIMAL(12,2) DEFAULT 0,
    status       ENUM('pending', 'approved', 'completed', 'cancelled') DEFAULT 'pending',
    notes        TEXT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendor_profiles(vendor_id) ON DELETE SET NULL,
    FOREIGN KEY (listing_id) REFERENCES marketplace_vendors(vendor_listing_id) ON DELETE SET NULL,
    FOREIGN KEY (package_id) REFERENCES vendor_packages(package_id) ON DELETE SET NULL
);

CREATE TABLE booking_line_items (
    line_id      INT AUTO_INCREMENT PRIMARY KEY,
    booking_id   INT NOT NULL,
    service_label VARCHAR(255) NOT NULL,
    price        DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
);

-- User "My Requests" from events_vendors page
CREATE TABLE service_requests (
    request_id   INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT NOT NULL,
    listing_id   INT,
    package_id   INT,
    vendor_name  VARCHAR(200),
    event_type   VARCHAR(100),
    selected_services JSON,
    total_amount DECIMAL(12,2) DEFAULT 0,
    status       ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- Wishlist, reviews, messages, gallery
-- ---------------------------------------------------------------------------
CREATE TABLE wishlist (
    wishlist_id  INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT NOT NULL,
    listing_id   INT,
    package_id   INT,
    vendor_name  VARCHAR(200),
    event_type   VARCHAR(100),
    added_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_wishlist (user_id, listing_id, package_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE reviews (
    review_id   INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    vendor_id   INT NOT NULL,
    booking_id  INT,
    rating      DECIMAL(3,2) NOT NULL,
    comment     TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendor_profiles(vendor_id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE SET NULL
);

CREATE TABLE messages (
    message_id   INT AUTO_INCREMENT PRIMARY KEY,
    sender_id    INT NOT NULL,
    receiver_id  INT NOT NULL,
    vendor_id    INT,
    subject      VARCHAR(200),
    body         TEXT NOT NULL,
    is_read      TINYINT(1) DEFAULT 0,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE gallery_images (
    image_id    INT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(200),
    image_url   VARCHAR(500) NOT NULL,
    category    VARCHAR(100),
    is_public   TINYINT(1) DEFAULT 1,
    uploaded_by INT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE admin_settings (
    setting_key   VARCHAR(100) PRIMARY KEY,
    setting_value TEXT
);
CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);


-- ---------------------------------------------------------------------------
-- Seed data
-- ---------------------------------------------------------------------------
INSERT INTO event_categories (slug, name, icon) VALUES
('wedding', 'Weddings', 'fa-rings-wedding'),
('corporate', 'Corporate Events', 'fa-briefcase'),
('birthday', 'Birthdays', 'fa-cake-candles'),
('anniversary', 'Anniversaries', 'fa-heart'),
('babyshower', 'Baby Showers', 'fa-baby'),
('party', 'Parties', 'fa-champagne-glasses'),
('movie', 'Movie Screenings', 'fa-film'),
('cultural', 'Cultural Events', 'fa-masks-theater');

-- Default admin (password: Admin@123 — change after first login)
INSERT INTO users (username, email, password_hash, role)
VALUES ('Admin', 'meena.murali1217@gmail.com',
        SHA2(CONCAT('1217@Mkvm', 'makemyevent_salt'), 256), 'admin');
