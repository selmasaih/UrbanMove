-- UrbanMove Web — MySQL Database Schema + Seed Data
-- IoT-Focused Smart Urban Mobility Platform

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS urbanmove CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE urbanmove;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user','admin','moderator') DEFAULT 'user',
    avatar VARCHAR(255) DEFAULT NULL,
    city ENUM('rabat','casablanca','tanger','marrakech','fes','agadir') DEFAULT 'rabat',
    wallet_balance DECIMAL(10,2) DEFAULT 0.00,
    is_verified TINYINT(1) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    last_login DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    license_plate VARCHAR(20) NOT NULL,
    type ENUM('car','motorcycle','truck','electric') DEFAULT 'car',
    color VARCHAR(30) DEFAULT '',
    is_electric TINYINT(1) DEFAULT 0,
    is_default TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Wallet transactions
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('topup','payment','refund','bonus') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description VARCHAR(255) DEFAULT '',
    reference VARCHAR(50) DEFAULT '',
    status ENUM('pending','completed','failed','cancelled') DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Parkings
CREATE TABLE IF NOT EXISTS parkings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type ENUM('outdoor','underground','multilevel','covered','smart') DEFAULT 'outdoor',
    street VARCHAR(200),
    city VARCHAR(50),
    postal_code VARCHAR(10),
    country VARCHAR(50) DEFAULT 'Maroc',
    lat DECIMAL(10,6),
    lng DECIMAL(10,6),
    total_spots INT NOT NULL DEFAULT 0,
    available_spots INT NOT NULL DEFAULT 0,
    hourly_price DECIMAL(6,2) NOT NULL DEFAULT 0,
    daily_price DECIMAL(8,2) DEFAULT NULL,
    monthly_price DECIMAL(10,2) DEFAULT NULL,
    rating DECIMAL(2,1) DEFAULT 0.0,
    review_count INT DEFAULT 0,
    has_sensors TINYINT(1) DEFAULT 0,
    sensor_provider VARCHAR(50) DEFAULT 'UrbanMove IoT',
    sensor_protocol VARCHAR(30) DEFAULT 'LoRaWAN',
    total_sensors INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    is_featured TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Parking amenities
CREATE TABLE IF NOT EXISTS parking_amenities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parking_id INT NOT NULL,
    amenity VARCHAR(50) NOT NULL,
    FOREIGN KEY (parking_id) REFERENCES parkings(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- IoT: Per-spot sensor data
CREATE TABLE IF NOT EXISTS parking_spots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parking_id INT NOT NULL,
    spot_id VARCHAR(10) NOT NULL,
    floor INT DEFAULT 1,
    status ENUM('available','occupied','reserved','maintenance') DEFAULT 'available',
    sensor_type VARCHAR(30) DEFAULT 'ultrasonic',
    sensor_status ENUM('active','inactive','error') DEFAULT 'active',
    battery_level INT DEFAULT 100,
    last_detection DATETIME DEFAULT NULL,
    vehicle_detected TINYINT(1) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parking_id) REFERENCES parkings(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- IoT: Environmental sensors
CREATE TABLE IF NOT EXISTS iot_environmental (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parking_id INT NOT NULL,
    temperature DECIMAL(4,1),
    humidity DECIMAL(4,1),
    air_quality ENUM('good','moderate','poor') DEFAULT 'good',
    co2_level INT DEFAULT 400,
    noise_level INT DEFAULT 45,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parking_id) REFERENCES parkings(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- IoT: LoRaWAN Gateways
CREATE TABLE IF NOT EXISTS iot_gateways (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gateway_id VARCHAR(20) NOT NULL UNIQUE,
    city VARCHAR(50) NOT NULL,
    location_name VARCHAR(100) NOT NULL,
    status ENUM('online','offline','maintenance') DEFAULT 'online',
    signal_strength INT DEFAULT 95,
    devices_connected INT DEFAULT 0,
    protocol VARCHAR(30) DEFAULT 'LoRaWAN 1.0.3',
    frequency VARCHAR(30) DEFAULT '868 MHz (EU868)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- IoT: Smart traffic lights per city
CREATE TABLE IF NOT EXISTS smart_lights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    city VARCHAR(50) NOT NULL,
    total_lights INT DEFAULT 0,
    smart_lights INT DEFAULT 0,
    coverage_pct INT DEFAULT 0,
    intersections INT DEFAULT 0,
    avg_wait_reduction INT DEFAULT 0,
    peak_optimization INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'en cours'
) ENGINE=InnoDB;

-- IoT: Hourly smart light data
CREATE TABLE IF NOT EXISTS smart_light_hourly (
    id INT AUTO_INCREMENT PRIMARY KEY,
    city VARCHAR(50) NOT NULL,
    hour_slot INT NOT NULL,
    avg_wait_without INT DEFAULT 55,
    avg_wait_with INT DEFAULT 32,
    vehicles_optimized INT DEFAULT 0,
    recorded_date DATE NOT NULL
) ENGINE=InnoDB;

-- Reservations
CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    parking_id INT NOT NULL,
    vehicle_id INT DEFAULT NULL,
    spot_number VARCHAR(10),
    floor VARCHAR(5),
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    duration INT NOT NULL,
    amount DECIMAL(8,2) NOT NULL DEFAULT 0,
    currency VARCHAR(5) DEFAULT 'MAD',
    payment_method ENUM('card','wallet','cash') DEFAULT 'wallet',
    payment_status ENUM('pending','paid','refunded','failed') DEFAULT 'pending',
    status ENUM('pending','confirmed','active','completed','cancelled','expired') DEFAULT 'pending',
    qr_code VARCHAR(64),
    confirmation_code VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parking_id) REFERENCES parkings(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Alerts
CREATE TABLE IF NOT EXISTS alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('accident','works','event','closure','traffic','weather','construction','other') NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    lat DECIMAL(10,6),
    lng DECIMAL(10,6),
    street VARCHAR(200),
    city VARCHAR(50),
    severity ENUM('low','medium','high','critical') DEFAULT 'medium',
    source ENUM('user','authority','sensor','system') DEFAULT 'user',
    reported_by INT DEFAULT NULL,
    is_active TINYINT(1) DEFAULT 1,
    user_reports INT DEFAULT 1,
    sensor_confidence DECIMAL(3,2) DEFAULT 0.70,
    estimated_end DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    parking_id INT NOT NULL,
    rating TINYINT NOT NULL,
    title VARCHAR(100),
    comment TEXT,
    cleanliness TINYINT DEFAULT NULL,
    security TINYINT DEFAULT NULL,
    accessibility TINYINT DEFAULT NULL,
    value_rating TINYINT DEFAULT NULL,
    is_verified TINYINT(1) DEFAULT 0,
    helpful_count INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parking_id) REFERENCES parkings(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_parking (user_id, parking_id)
) ENGINE=InnoDB;

-- =====================
-- SEED DATA
-- =====================

-- Demo users (password: demo123456 / admin123456 — bcrypt)
INSERT INTO users (first_name, last_name, email, phone, password_hash, role, city, wallet_balance, is_verified) VALUES
('Demo', 'User', 'demo@urbanmove.ma', '0612345678', '$2a$12$pWxJmWU3aGVRAlESq.wkze2VIuJhzC7FiTSkTs01aEi1K1YBdDKGa', 'user', 'rabat', 5000.00, 1),
('Admin', 'UrbanMove', 'admin@urbanmove.ma', '0600000000', '$2a$12$23eVXFtXOQuDJcFFjK5/.uPyLqxJcDs0etCUaUOg0cyZg7DIiEaRa', 'admin', 'rabat', 10000.00, 1);

-- Vehicles
INSERT INTO vehicles (user_id, brand, model, license_plate, type, is_default) VALUES
(1, 'Dacia', 'Logan', '12345-A-1', 'car', 1),
(1, 'Renault', 'Clio', '67890-B-2', 'car', 0);

-- Wallet transactions
INSERT INTO wallet_transactions (user_id, type, amount, description, reference, status) VALUES
(1, 'topup', 3000, 'Rechargement par carte bancaire', 'TOP-001', 'completed'),
(1, 'topup', 2500, 'Rechargement par Cash Plus', 'TOP-002', 'completed'),
(1, 'payment', -50, 'Réservation Parking Agdal Center', 'RES-001', 'completed'),
(1, 'payment', -400, 'Abonnement mensuel Parking Gare', 'RES-002', 'completed');

-- Parkings (6 parkings across 3 cities)
INSERT INTO parkings (name, description, type, street, city, postal_code, lat, lng, total_spots, available_spots, hourly_price, daily_price, monthly_price, rating, review_count, has_sensors, sensor_provider, sensor_protocol, total_sensors, is_active) VALUES
('Parking Agdal Center', 'Parking moderne au coeur de l''Agdal avec capteurs IoT', 'underground', 'Avenue Ibn Sina, Agdal', 'Rabat', '10080', 33.9897, -6.8498, 200, 45, 10, 60, 800, 4.5, 128, 1, 'UrbanMove IoT', 'LoRaWAN', 200, 1),
('Parking Tour Hassan', 'Parking à proximité de la Tour Hassan équipé IoT', 'outdoor', 'Boulevard Mohamed Lyazidi', 'Rabat', '10020', 34.0246, -6.8225, 150, 32, 8, 50, NULL, 4.2, 85, 1, 'UrbanMove IoT', 'LoRaWAN', 150, 1),
('Parking Gare Rabat Agdal', 'Parking de la gare ferroviaire Agdal connecté', 'outdoor', 'Gare Rabat Agdal', 'Rabat', '10080', 33.9918, -6.8556, 300, 120, 5, 40, NULL, 3.8, 64, 1, 'UrbanMove IoT', 'LoRaWAN', 300, 1),
('Parking Morocco Mall', 'Parking premium du Morocco Mall avec IoT avancé', 'underground', 'Morocco Mall, Corniche', 'Casablanca', '20000', 33.5920, -7.6325, 500, 180, 15, 80, NULL, 4.7, 250, 1, 'UrbanMove IoT', 'LoRaWAN', 500, 1),
('Parking Hay Riad', 'Parking résidentiel intelligent Hay Riad', 'outdoor', 'Quartier Hay Riad', 'Rabat', '10100', 33.9616, -6.8663, 120, 55, 6, 35, NULL, 4.0, 42, 1, 'UrbanMove IoT', 'LoRaWAN', 120, 1),
('Parking Tanger City Center', 'Parking moderne centre-ville Tanger', 'underground', 'Boulevard Mohammed V', 'Tanger', '90000', 35.7595, -5.8340, 250, 90, 12, 70, NULL, 4.3, 76, 1, 'UrbanMove IoT', 'LoRaWAN', 250, 1);

-- Parking amenities
INSERT INTO parking_amenities (parking_id, amenity) VALUES
(1,'security'),(1,'lighting'),(1,'elevator'),(1,'ev_charging'),
(2,'security'),(2,'lighting'),
(3,'security'),(3,'lighting'),(3,'disabled_access'),
(4,'security'),(4,'lighting'),(4,'elevator'),(4,'ev_charging'),
(5,'security'),(5,'lighting'),
(6,'security'),(6,'lighting'),(6,'elevator');

-- IoT Gateways
INSERT INTO iot_gateways (gateway_id, city, location_name, status, signal_strength, devices_connected, protocol, frequency) VALUES
('GW-RAB-01', 'Rabat', 'Tour Hassan', 'online', 98, 156, 'LoRaWAN 1.0.3', '868 MHz (EU868)'),
('GW-RAB-02', 'Rabat', 'Agdal Centre', 'online', 95, 134, 'LoRaWAN 1.0.3', '868 MHz (EU868)'),
('GW-RAB-03', 'Rabat', 'Hay Riad', 'online', 92, 118, 'LoRaWAN 1.0.3', '868 MHz (EU868)'),
('GW-CAS-01', 'Casablanca', 'Maarif', 'online', 97, 203, 'LoRaWAN 1.0.3', '868 MHz (EU868)'),
('GW-CAS-02', 'Casablanca', 'Ain Diab', 'online', 94, 178, 'LoRaWAN 1.0.3', '868 MHz (EU868)'),
('GW-TNG-01', 'Tanger', 'Centre Ville', 'online', 96, 98, 'LoRaWAN 1.0.3', '868 MHz (EU868)');

-- Smart Lights
INSERT INTO smart_lights (city, total_lights, smart_lights, coverage_pct, intersections, avg_wait_reduction, peak_optimization, status) VALUES
('Rabat', 47, 38, 81, 23, 42, 67, 'avancé'),
('Casablanca', 89, 62, 70, 41, 38, 58, 'en cours'),
('Tanger', 31, 22, 71, 14, 35, 52, 'en cours');

-- IoT Environmental (latest reading per parking)
INSERT INTO iot_environmental (parking_id, temperature, humidity, air_quality, co2_level, noise_level) VALUES
(1, 22.5, 55.0, 'good', 380, 42),
(2, 25.0, 48.0, 'good', 420, 55),
(3, 23.0, 52.0, 'moderate', 480, 60),
(4, 21.0, 45.0, 'good', 350, 38),
(5, 26.0, 50.0, 'good', 400, 50),
(6, 24.0, 58.0, 'good', 390, 44);

-- Alerts (IoT + user-generated)
INSERT INTO alerts (type, title, description, lat, lng, street, city, severity, source, is_active, user_reports, sensor_confidence) VALUES
('traffic', 'Trafic dense Avenue Mohammed V', 'Ralentissements importants sur l''Avenue Mohammed V direction Agdal', 34.0170, -6.8350, 'Avenue Mohammed V', 'Rabat', 'medium', 'sensor', 1, 12, 0.95),
('works', 'Travaux Boulevard Hassan II', 'Travaux de voirie en cours, circulation alternée', 34.0200, -6.8300, 'Boulevard Hassan II', 'Rabat', 'high', 'authority', 1, 8, 0.90),
('event', 'Match au Stade Moulay Abdellah', 'Affluence prévisible autour du stade pour le match de ce soir', 33.9589, -6.8669, 'Stade Moulay Abdellah', 'Rabat', 'medium', 'system', 1, 25, 0.85),
('accident', 'Accident Autoroute Rabat-Salé', 'Accident mineur, voie de droite bloquée', 34.0350, -6.8100, 'Autoroute Rabat-Salé', 'Rabat', 'high', 'user', 1, 15, 0.70),
('traffic', 'Congestion Ain Diab Casablanca', 'Embouteillages sur la corniche direction Morocco Mall', 33.5800, -7.6000, 'Corniche Ain Diab', 'Casablanca', 'medium', 'sensor', 1, 18, 0.95),
('construction', 'Chantier Tramway Tanger', 'Extension de la ligne de tramway en cours', 35.7650, -5.8200, 'Avenue de la Liberté', 'Tanger', 'low', 'authority', 1, 5, 0.90);

-- Reviews
INSERT INTO reviews (user_id, parking_id, rating, title, comment, cleanliness, security, accessibility, value_rating, is_verified) VALUES
(1, 1, 5, 'Excellent parking', 'Très propre, bien éclairé, capteurs IoT pratiques pour trouver une place rapidement.', 5, 5, 4, 4, 1),
(1, 2, 4, 'Bon emplacement', 'Proche de la Tour Hassan, tarifs raisonnables.', 4, 4, 4, 5, 1),
(2, 3, 4, 'Pratique gare', 'Idéal quand on prend le train. Application montre les places libres en temps réel.', 3, 4, 5, 5, 1),
(2, 4, 5, 'Premium quality', 'Le meilleur parking de Casablanca. Bornes de recharge et tout est connecté.', 5, 5, 5, 3, 1);

-- Sample reservations
INSERT INTO reservations (user_id, parking_id, vehicle_id, spot_number, floor, start_time, end_time, duration, amount, payment_method, payment_status, status, confirmation_code) VALUES
(1, 1, 1, 'A01', '1', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 46 HOUR), 120, 20, 'wallet', 'paid', 'completed', 'URB-1001'),
(1, 2, 1, 'B05', '1', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 21 HOUR), 180, 24, 'wallet', 'paid', 'completed', 'URB-1002'),
(1, 4, 2, 'C12', '2', DATE_ADD(NOW(), INTERVAL 1 HOUR), DATE_ADD(NOW(), INTERVAL 3 HOUR), 120, 30, 'wallet', 'paid', 'confirmed', 'URB-1003'),
(1, 1, 1, 'A03', '1', DATE_ADD(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 25 HOUR), 60, 10, 'wallet', 'paid', 'pending', 'URB-1004');

SET FOREIGN_KEY_CHECKS = 1;
