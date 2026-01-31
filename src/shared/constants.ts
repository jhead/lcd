// Dashboard display limits
export const MAX_SKILLS_DISPLAYED = 8;
export const MAX_CHART_DATA_POINTS = 30;

// Prediction settings
export const MAX_PREDICTION_DAYS = 730;
export const REGRESSION_WINDOW_DAYS = 14;

// Comment form limits
export const MAX_COMMENT_NAME_LENGTH = 50;
export const MAX_COMMENT_MESSAGE_LENGTH = 500;

// API URL - derived from window location for portability
export const API_URL = typeof window !== 'undefined' ? window.location.origin : '';
