-- SQLite schema bootstrap (CREATE IF NOT EXISTS).
-- Demo data is loaded via: python -m database.seed

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------
-- Schema (CREATE IF NOT EXISTS)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
    id INTEGER NOT NULL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email ON users (email);

CREATE TABLE IF NOT EXISTS missions (
    id INTEGER NOT NULL PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    target VARCHAR(255) NOT NULL,
    location VARCHAR(120) NOT NULL,
    progress INTEGER NOT NULL,
    created_at DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    updated_at DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    last_activity_at DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS user_mission_links (
    user_id INTEGER NOT NULL,
    mission_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, mission_id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (mission_id) REFERENCES missions (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leads (
    id INTEGER NOT NULL PRIMARY KEY,
    mission_id INTEGER NOT NULL,
    name VARCHAR(160) NOT NULL,
    description VARCHAR(255) NOT NULL,
    location VARCHAR(120) NOT NULL,
    website VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(60) NOT NULL,
    score INTEGER NOT NULL,
    why JSON NOT NULL,
    missing JSON NOT NULL,
    recommended JSON NOT NULL,
    evidence JSON NOT NULL,
    sources_scanned JSON NOT NULL,
    created_at DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    updated_at DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    FOREIGN KEY (mission_id) REFERENCES missions (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_leads_mission_id ON leads (mission_id);
