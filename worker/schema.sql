-- D1 Database Schema for LeetCode Dashboard
-- Run this with: wrangler d1 execute lcd-db --file=./schema.sql

CREATE TABLE IF NOT EXISTS snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  total_easy INTEGER NOT NULL DEFAULT 0,
  total_medium INTEGER NOT NULL DEFAULT 0,
  total_hard INTEGER NOT NULL DEFAULT 0,
  tags_json TEXT NOT NULL DEFAULT '{}',
  beats_json TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_timestamp ON snapshots(timestamp);

-- LSR (LeetCode Spaced Repetition) mastery snapshots
CREATE TABLE IF NOT EXISTS lsr_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  strong INTEGER NOT NULL DEFAULT 0,
  learning INTEGER NOT NULL DEFAULT 0,
  weak INTEGER NOT NULL DEFAULT 0,
  leech INTEGER NOT NULL DEFAULT 0,
  unknown INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_lsr_timestamp ON lsr_snapshots(timestamp);

-- Migration: Add beats_json column to existing tables
-- Run this manually if you have existing data:
-- ALTER TABLE snapshots ADD COLUMN beats_json TEXT NOT NULL DEFAULT '{}';
