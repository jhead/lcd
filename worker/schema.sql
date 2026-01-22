-- D1 Database Schema for LeetCode Dashboard
-- Run this with: wrangler d1 execute lcd-db --file=./schema.sql

CREATE TABLE IF NOT EXISTS snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  total_easy INTEGER NOT NULL DEFAULT 0,
  total_medium INTEGER NOT NULL DEFAULT 0,
  total_hard INTEGER NOT NULL DEFAULT 0,
  tags_json TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_timestamp ON snapshots(timestamp);
