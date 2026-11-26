-- ============================================================================
-- CineBook - Movie Ticket Booking System
-- MySQL Database Schema & Sample Data
-- ============================================================================

CREATE DATABASE IF NOT EXISTS movie_booking_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE movie_booking_db;

-- Drop tables in reverse dependency order for clean re-initialization
DROP TABLE IF EXISTS booking_seats;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS seats;
DROP TABLE IF EXISTS shows;
DROP TABLE IF EXISTS screens;
DROP TABLE IF EXISTS theatres;
DROP TABLE IF EXISTS movies;
DROP TABLE IF EXISTS admin;

-- ============================================================================
-- Table 1: Movies
-- ============================================================================
CREATE TABLE movies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  genre VARCHAR(100) NOT NULL,
  language VARCHAR(100) NOT NULL,
  duration INT NOT NULL COMMENT 'Duration in minutes',
  release_date DATE NOT NULL,
  rating DECIMAL(3, 1) NOT NULL DEFAULT 0.0,
  poster_url VARCHAR(500) DEFAULT NULL,
  status ENUM('Now Showing', 'Upcoming') NOT NULL DEFAULT 'Now Showing',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_movies_status (status),
  INDEX idx_movies_genre (genre),
  INDEX idx_movies_language (language),
  INDEX idx_movies_title (title)
) ENGINE=InnoDB;

-- ============================================================================
-- Table 2: Theatres
-- ============================================================================
CREATE TABLE theatres (
  id INT AUTO_INCREMENT PRIMARY KEY,
  theatre_name VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  location VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_theatres_city (city)
) ENGINE=InnoDB;

-- ============================================================================
-- Table 3: Screens
-- ============================================================================
CREATE TABLE screens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  theatre_id INT NOT NULL,
  screen_name VARCHAR(100) NOT NULL,
  total_seats INT NOT NULL,
  CONSTRAINT fk_screens_theatre
    FOREIGN KEY (theatre_id) REFERENCES theatres(id)
    ON DELETE CASCADE,
  UNIQUE KEY uq_theatre_screen (theatre_id, screen_name)
) ENGINE=InnoDB;

-- ============================================================================
-- Table 4: Shows
-- ============================================================================
CREATE TABLE shows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  movie_id INT NOT NULL,
  screen_id INT NOT NULL,
  show_date DATE NOT NULL,
  show_time TIME NOT NULL,
  ticket_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_shows_movie
    FOREIGN KEY (movie_id) REFERENCES movies(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_shows_screen
    FOREIGN KEY (screen_id) REFERENCES screens(id)
    ON DELETE CASCADE,
  UNIQUE KEY uq_screen_date_time (screen_id, show_date, show_time),
  INDEX idx_shows_movie_date (movie_id, show_date)
) ENGINE=InnoDB;

-- ============================================================================
-- Table 5: Seats
-- ============================================================================
CREATE TABLE seats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  screen_id INT NOT NULL,
  seat_number VARCHAR(10) NOT NULL,
  seat_type ENUM('Regular', 'Premium', 'VIP') NOT NULL DEFAULT 'Regular',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_seats_screen
    FOREIGN KEY (screen_id) REFERENCES screens(id)
    ON DELETE CASCADE,
  UNIQUE KEY uq_screen_seat (screen_id, seat_number)
) ENGINE=InnoDB;

-- ============================================================================
-- Table 6: Bookings
-- ============================================================================
CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_reference VARCHAR(32) NOT NULL UNIQUE,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(30) NOT NULL,
  show_id INT NOT NULL,
  total_seats INT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  booking_status ENUM('CONFIRMED', 'CANCELLED') NOT NULL DEFAULT 'CONFIRMED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookings_show
    FOREIGN KEY (show_id) REFERENCES shows(id)
    ON DELETE CASCADE,
  INDEX idx_bookings_email (customer_email),
  INDEX idx_bookings_show (show_id)
) ENGINE=InnoDB;

-- ============================================================================
-- Table 7: Booking_Seats
-- ============================================================================
-- UNIQUE (show_id, seat_id) enforces at the database level that a seat
-- cannot be double-booked for the same show. On cancellation, rows are
-- deleted inside a transaction to release the seats.
CREATE TABLE booking_seats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  show_id INT NOT NULL,
  seat_id INT NOT NULL,
  ticket_price DECIMAL(10, 2) NOT NULL,
  CONSTRAINT fk_booking_seats_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_booking_seats_show
    FOREIGN KEY (show_id) REFERENCES shows(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_booking_seats_seat
    FOREIGN KEY (seat_id) REFERENCES seats(id)
    ON DELETE CASCADE,
  UNIQUE KEY uq_show_seat (show_id, seat_id)
) ENGINE=InnoDB;

-- ============================================================================
-- Table 8: Admin
-- ============================================================================
CREATE TABLE admin (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================================
-- Sample Data: Admin User (username: admin, password: admin123)
-- ============================================================================
INSERT INTO admin (username, password_hash) VALUES
  ('admin', '$2a$10$i1dUZeEVrVQdXXT1.AOdpOfSLcQJtQSDGvbnUgC7cFrBSH2g4ouJe');

-- ============================================================================
-- Sample Data: Movies (12 Popular Indian Movies)
-- ============================================================================
INSERT INTO movies (title, description, genre, language, duration, release_date, rating, poster_url, status) VALUES
  (
    'RRR',
    'A fearless revolutionary and an officer in the British force, who once shared a deep bond, decide to join forces and chart out an inspirational path of freedom against the despotic rulers.',
    'Action',
    'Telugu',
    182,
    '2022-03-25',
    8.8,
    'https://image.tmdb.org/t/p/w500/nEufeZlyAOLqO2brRs0yeF1lgXO.jpg',
    'Now Showing'
  ),
  (
    'Baahubali 2: The Conclusion',
    'When Shiva, the son of Bahubali, learns about his heritage, he begins to look for answers. His story is juxtaposed with past events that unfolded in the Mahishmati Kingdom.',
    'Action',
    'Telugu',
    167,
    '2017-04-28',
    8.7,
    'https://image.tmdb.org/t/p/w500/21sC2assImQIYCEDA84Qh9d1RsK.jpg',
    'Now Showing'
  ),
  (
    'Kalki 2898 AD',
    'A modern-day avatar of Vishnu, a Hindu god, who is believed to have descended to earth to protect the world from evil forces in a dystopian future.',
    'Sci-Fi',
    'Telugu',
    181,
    '2024-06-27',
    8.2,
    'https://image.tmdb.org/t/p/w500/rstcAnGUh51zN8p20p0N8b0bQ2D.jpg',
    'Now Showing'
  ),
  (
    'Pushpa 2: The Rule',
    'The clash is on as Pushpa and Bhanwar Singh continue their rivalry in this epic conclusion to the two-part action drama.',
    'Action',
    'Telugu',
    200,
    '2024-12-05',
    8.1,
    'https://image.tmdb.org/t/p/w500/7vjaCdMw15FEbXyLQTVa04URsPm.jpg',
    'Now Showing'
  ),
  (
    'Jawan',
    'A high-octane action thriller which outlines the emotional journey of a man who is set to rectify the wrongs in the society.',
    'Thriller',
    'Hindi',
    169,
    '2023-09-07',
    7.9,
    'https://image.tmdb.org/t/p/w500/jFt1gS4BGHlK8xt76Y81Alp4dbt.jpg',
    'Now Showing'
  ),
  (
    'Pathaan',
    'An Indian agent races against a doomsday clock as a ruthless mercenary, with a bitter vendetta, mounts an apocalyptic attack against the country.',
    'Action',
    'Hindi',
    146,
    '2023-01-25',
    7.5,
    'https://image.tmdb.org/t/p/w500/arf00BkwvXo0CFKbaD9OpqdE4Nu.jpg',
    'Now Showing'
  ),
  (
    'Leo',
    'Parthiban is a mild-mannered cafe owner in Kashmir, who fends off a gang of murderous thugs and gains attention from a drug cartel claiming he was once a part of them.',
    'Thriller',
    'Tamil',
    164,
    '2023-10-19',
    7.8,
    'https://image.tmdb.org/t/p/w500/pD6sL4vntUOXHmuvJPPZAgvyfd9.jpg',
    'Now Showing'
  ),
  (
    'Salaar: Part 1 - Ceasefire',
    'A gang leader makes a promise to a dying friend by taking on other criminal gangs in the dystopian city-state of Khansaar.',
    'Action',
    'Telugu',
    175,
    '2023-12-22',
    7.6,
    'https://image.tmdb.org/t/p/w500/k9tv1rXZbOhH7eiCk378x61kNQ1.jpg',
    'Now Showing'
  ),
  (
    '3 Idiots',
    'Two friends are searching for their long lost companion. They revisit their college days and recall the memories of their friend who inspired them to think differently.',
    'Comedy',
    'Hindi',
    170,
    '2009-12-25',
    8.9,
    'https://image.tmdb.org/t/p/w500/66A9MqXOyVFCssoloscw79z8Tew.jpg',
    'Now Showing'
  ),
  (
    'Kantara',
    'When greed paves the way for betrayal, scheming and murder, a young tribal reluctantly dons the traditions of his ancestors to seek justice.',
    'Drama',
    'Kannada',
    148,
    '2022-09-30',
    8.5,
    'https://image.tmdb.org/t/p/w500/j4cS2K8wA7kL3tG2U2Q0m5oN3M2.jpg',
    'Now Showing'
  ),
  (
    'Spirit',
    'An intense action drama following a fearless IPS officer who takes on an international syndicate.',
    'Action',
    'Telugu',
    165,
    '2027-04-14',
    0.0,
    'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    'Upcoming'
  ),
  (
    'Ramayana: Part 1',
    'A grand mythological epic retelling the timeless tale of Dharma, devotion, and courage.',
    'Drama',
    'Hindi',
    180,
    '2027-10-22',
    0.0,
    'https://image.tmdb.org/t/p/w500/1E5baAaEse26fej7uHcjOgEE2t2.jpg',
    'Upcoming'
  );

-- ============================================================================
-- Sample Data: Theatres in Hyderabad
-- ============================================================================
INSERT INTO theatres (theatre_name, city, location) VALUES
  ('AMB Cinemas', 'Hyderabad', 'Gachibowli, Kondapur'),
  ('PVR Cinemas', 'Hyderabad', 'Irrum Manzil, Banjara Hills'),
  ('INOX', 'Hyderabad', 'GVK One Mall, Banjara Hills'),
  ('Asian Cinemas', 'Hyderabad', 'Mantra Mall, Attapur');

-- ============================================================================
-- Sample Data: Screens (50 seats per screen)
-- ============================================================================
INSERT INTO screens (theatre_id, screen_name, total_seats) VALUES
  (1, 'Screen 1 - Laser IMAX', 50),
  (1, 'Screen 2 - Dolby Atmos', 50),
  (2, 'Screen 1 - PVR Luxe', 50),
  (3, 'Screen 1 - INOX Insignia', 50),
  (4, 'Screen 1 - Asian Grand', 50);

-- ============================================================================
-- Sample Data: Seats (50 seats per screen: Rows A-E, Columns 1-10)
-- ============================================================================
INSERT INTO seats (screen_id, seat_number, seat_type)
SELECT
  s.id AS screen_id,
  CONCAT(r.row_letter, c.col_num) AS seat_number,
  CASE
    WHEN r.row_letter IN ('A', 'B') THEN 'Regular'
    WHEN r.row_letter IN ('C', 'D') THEN 'Premium'
    ELSE 'VIP'
  END AS seat_type
FROM screens s
CROSS JOIN (
  SELECT 'A' AS row_letter UNION ALL
  SELECT 'B' UNION ALL
  SELECT 'C' UNION ALL
  SELECT 'D' UNION ALL
  SELECT 'E'
) r
CROSS JOIN (
  SELECT 1 AS col_num UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL
  SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10
) c
ORDER BY s.id, r.row_letter, c.col_num;

-- ============================================================================
-- Sample Data: Shows (Today, Tomorrow, Day After Tomorrow)
-- ============================================================================
INSERT INTO shows (movie_id, screen_id, show_date, show_time, ticket_price) VALUES
  -- RRR (movie_id = 1)
  (1, 1, CURDATE(), '10:30:00', 250.00),
  (1, 1, CURDATE(), '18:30:00', 320.00),
  (1, 3, CURDATE(), '14:15:00', 280.00),
  (1, 4, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:00:00', 260.00),
  (1, 5, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '19:00:00', 220.00),

  -- Baahubali 2 (movie_id = 2)
  (2, 2, CURDATE(), '11:15:00', 240.00),
  (2, 4, CURDATE(), '17:45:00', 290.00),
  (2, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '15:00:00', 300.00),

  -- Kalki 2898 AD (movie_id = 3)
  (3, 1, CURDATE(), '14:00:00', 350.00),
  (3, 3, CURDATE(), '20:30:00', 340.00),
  (3, 5, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '18:00:00', 250.00),
  (3, 2, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '19:30:00', 310.00),

  -- Pushpa 2 (movie_id = 4)
  (4, 2, CURDATE(), '15:30:00', 295.00),
  (4, 5, CURDATE(), '21:00:00', 260.00),
  (4, 3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '16:30:00', 310.00),

  -- Jawan (movie_id = 5)
  (5, 3, CURDATE(), '11:00:00', 250.00),
  (5, 4, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '14:30:00', 280.00),

  -- Pathaan (movie_id = 6)
  (6, 4, CURDATE(), '13:00:00', 240.00),
  (6, 2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '20:00:00', 275.00),

  -- Leo (movie_id = 7)
  (7, 5, CURDATE(), '16:00:00', 220.00),
  (7, 1, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '18:15:00', 290.00),

  -- Salaar (movie_id = 8)
  (8, 2, CURDATE(), '20:45:00', 280.00),
  (8, 4, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '15:30:00', 270.00),

  -- 3 Idiots (movie_id = 9)
  (9, 3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '12:00:00', 200.00),
  (9, 5, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '17:00:00', 180.00),

  -- Kantara (movie_id = 10)
  (10, 4, CURDATE(), '21:15:00', 240.00),
  (10, 1, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '14:00:00', 260.00);

-- ============================================================================
-- Sample Data: Initial Bookings (for testing My Bookings & Admin Dashboard)
-- ============================================================================
INSERT INTO bookings (booking_reference, customer_name, customer_email, customer_phone, show_id, total_seats, total_amount, booking_status) VALUES
  ('CB-DEMO01', 'Aarav Sharma', 'aarav@example.com', '9876543210', 1, 2, 500.00, 'CONFIRMED'),
  ('CB-DEMO02', 'Priya Reddy', 'priya@example.com', '9123456780', 9, 3, 1050.00, 'CONFIRMED');

-- Reserve seats C4, C5 for Show 1 (Screen 1) and D5, D6, D7 for Show 9 (Screen 1)
INSERT INTO booking_seats (booking_id, show_id, seat_id, ticket_price)
SELECT 1, 1, id, 250.00 FROM seats WHERE screen_id = 1 AND seat_number IN ('C4', 'C5');

INSERT INTO booking_seats (booking_id, show_id, seat_id, ticket_price)
SELECT 2, 9, id, 350.00 FROM seats WHERE screen_id = 1 AND seat_number IN ('D5', 'D6', 'D7');
