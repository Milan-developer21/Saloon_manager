// Date utility functions for the Saloon Manager API
// Provides consistent date formatting and offset calculations

// Get date string in YYYY-MM-DD format
export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Get date string with day offset (e.g., +1 for tomorrow, -1 for yesterday)
export function getLocalDateWithOffset(offset: number, base = new Date()): string {
  const next = new Date(base);
  next.setDate(next.getDate() + offset);
  return getLocalDateString(next);
}
