import { getLocalDateString, getLocalDateWithOffset } from '../lib/date.js';

describe('Date Utilities', () => {
  describe('getLocalDateString', () => {
    it('should return date in YYYY-MM-DD format', () => {
      const date = new Date(2024, 0, 15); // January 15, 2024
      const result = getLocalDateString(date);
      expect(result).toBe('2024-01-15');
    });

    it('should use current date when no date provided', () => {
      const fixedDate = new Date(2024, 0, 15);
      jest.spyOn(global, 'Date').mockImplementation(() => fixedDate);
      const result = getLocalDateString();
      expect(result).toBe('2024-01-15');
      jest.restoreAllMocks();
    });

    it('should pad single digit month and day', () => {
      const date = new Date(2024, 0, 1); // January 1, 2024
      const result = getLocalDateString(date);
      expect(result).toBe('2024-01-01');
    });
  });

  describe('getLocalDateWithOffset', () => {
    it('should return date with positive offset', () => {
      const base = new Date(2024, 0, 15); // January 15, 2024
      const result = getLocalDateWithOffset(1, base);
      expect(result).toBe('2024-01-16');
    });

    it('should return date with negative offset', () => {
      const base = new Date(2024, 0, 15); // January 15, 2024
      const result = getLocalDateWithOffset(-1, base);
      expect(result).toBe('2024-01-14');
    });

    it('should use current date when no base provided', () => {
      const fixedDate = new Date(2024, 0, 15);
      jest.spyOn(global, 'Date').mockImplementation(() => fixedDate);
      const result = getLocalDateWithOffset(1);
      expect(result).toBe('2024-01-16');
      jest.restoreAllMocks();
    });
  });
});
