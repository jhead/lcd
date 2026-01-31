// Shared color palette - Bloomberg terminal aesthetic

// Difficulty colors (hex values for charts)
export const DIFFICULTY_COLORS = {
  easy: '#4ade80',     // green-400
  medium: '#facc15',   // yellow-400
  hard: '#f87171',     // red-400
} as const;

// Tailwind class mappings
export const DIFFICULTY_CLASSES = {
  easy: { text: 'text-green-400', bg: 'bg-green-500' },
  medium: { text: 'text-yellow-400', bg: 'bg-yellow-500' },
  hard: { text: 'text-red-400', bg: 'bg-red-500' },
} as const;
