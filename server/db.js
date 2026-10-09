/**
 * SQLite Database Initialization and Connection Manager
 * Uses better-sqlite3 with foreign keys enabled and WAL mode.
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, 'data');

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'configurator.db');
const db = new Database(dbPath);

// Enable Foreign Keys and WAL Mode for high performance and integrity
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Initialize Relational Schema
export function initDatabase() {
    db.exec(`
        -- Users Table
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Configurations Table
        CREATE TABLE IF NOT EXISTS configurations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            porsche_code TEXT UNIQUE NOT NULL,
            user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            title TEXT,
            model_id TEXT NOT NULL,
            trim_id TEXT NOT NULL,
            color_id TEXT NOT NULL,
            wheel_id TEXT NOT NULL,
            wheel_finish_id TEXT NOT NULL,
            caliper_id TEXT NOT NULL,
            interior_id TEXT NOT NULL,
            seat_id TEXT NOT NULL,
            currency TEXT DEFAULT 'USD' CHECK(currency IN ('USD', 'EUR', 'RUB')),
            status TEXT DEFAULT 'saved' CHECK(status IN ('draft', 'saved', 'ordered')),
            base_price REAL NOT NULL,
            equipment_price REAL NOT NULL,
            delivery_fee REAL NOT NULL,
            total_price REAL NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Many-to-Many Configuration Options Table
        CREATE TABLE IF NOT EXISTS configuration_options (
            configuration_id INTEGER REFERENCES configurations(id) ON DELETE CASCADE,
            option_id TEXT NOT NULL,
            PRIMARY KEY (configuration_id, option_id)
        );

        -- Orders Table for state transitions
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_number TEXT UNIQUE NOT NULL,
            configuration_id INTEGER REFERENCES configurations(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            dealer_city TEXT NOT NULL,
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'in_production', 'completed', 'cancelled')),
            total_price REAL NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Indices for fast lookups
        CREATE INDEX IF NOT EXISTS idx_configs_porsche_code ON configurations(porsche_code);
        CREATE INDEX IF NOT EXISTS idx_configs_user_id ON configurations(user_id);
        CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    `);

    // Seed default demo user if not exists (demo / porsche123)
    const existingDemo = db.prepare('SELECT id FROM users WHERE username = ?').get('demo');
    if (!existingDemo) {
        const hash = bcrypt.hashSync('porsche123', 10);
        db.prepare('INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)').run(
            'demo',
            'demo@porsche.com',
            hash,
            'user'
        );
    }
}

initDatabase();

export default db;
