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
    plan VARCHAR(60) NOT NULL,
    initials VARCHAR(4) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email ON users (email);

CREATE TABLE IF NOT EXISTS missions (
    id INTEGER NOT NULL PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    target VARCHAR(255) NOT NULL,
    location VARCHAR(120) NOT NULL,
    status VARCHAR(30) NOT NULL,
    progress INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    updated_at DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    last_activity_at DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_missions_user_id ON missions (user_id);

CREATE TABLE IF NOT EXISTS leads (
    id INTEGER NOT NULL PRIMARY KEY,
    slug VARCHAR(120) NOT NULL,
    mission_id INTEGER NOT NULL,
    name VARCHAR(160) NOT NULL,
    description VARCHAR(255) NOT NULL,
    location VARCHAR(120) NOT NULL,
    website VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(60) NOT NULL,
    initials VARCHAR(4) NOT NULL,
    logo_color VARCHAR(20) NOT NULL,
    contact_badge VARCHAR(120) NOT NULL,
    score INTEGER NOT NULL,
    score_label VARCHAR(40) NOT NULL,
    score_tone VARCHAR(20) NOT NULL,
    contactability INTEGER NOT NULL,
    confidence VARCHAR(20) NOT NULL,
    status VARCHAR(40) NOT NULL,
    category VARCHAR(40) NOT NULL,
    industry VARCHAR(120) NOT NULL,
    employees VARCHAR(60) NOT NULL,
    service_area VARCHAR(120) NOT NULL,
    business_type VARCHAR(120) NOT NULL,
    why JSON NOT NULL,
    missing JSON NOT NULL,
    recommended JSON NOT NULL,
    evidence JSON NOT NULL,
    sources_scanned JSON NOT NULL,
    ai_summary VARCHAR(600) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    updated_at DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    FOREIGN KEY (mission_id) REFERENCES missions (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_leads_slug ON leads (slug);
CREATE INDEX IF NOT EXISTS ix_leads_mission_id ON leads (mission_id);
