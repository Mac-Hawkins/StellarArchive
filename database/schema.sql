-- SERIAL for auto-incrementing IDs 
-- FOREIGN KEY defines relationships
-- TEXT for long text fields

-- I ran this script in pgAdmin while it was connected
-- to the AWS server.

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE apods (
    date DATE PRIMARY KEY,
    title VARCHAR(255),
    image_url VARCHAR(500),
    explanation TEXT
);

CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    apod_date DATE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (apod_date) REFERENCES apods(date)
);

CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    message TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    apod_date DATE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (apod_date) REFERENCES apods(date)
);
