export interface HistoryEntry {
  id?: number;
  timestamp: number;
  total_easy: number;
  total_medium: number;
  total_hard: number;
  tags_json: string;
}

export interface LSRSnapshot {
  id: number;
  timestamp: number;
  strong: number;
  learning: number;
  weak: number;
  leech: number;
  unknown: number;
  total: number;
}

// Top 150 list totals (as of Jan 2026 - rarely changes)
export const TOP150_TOTALS = {
  easy: 29,
  medium: 91,
  hard: 30,
} as const;

export interface Env {
  DB: D1Database;
  LEETCODE_COOKIE: string;
  LEETCODE_CSRF: string;
  GH_TOKEN?: string;
  LEETCODE_USERNAME: string;
  LEETCODE_USER_SLUG: string;
  LSR_API_KEY?: string;
  TRIGGER_API_KEY?: string;
}

export interface InitialData {
  history: HistoryEntry[];
  lsrHistory: LSRSnapshot[];
}

declare global {
  interface Window {
    __INITIAL_DATA__?: InitialData;
  }
}
