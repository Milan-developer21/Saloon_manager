import { HealthCheckResponse } from '../generated/api.js';

describe('API Zod Schemas', () => {
  describe('HealthCheckResponse', () => {
    it('should validate valid health response', () => {
      const validData = { status: 'ok' };
      const result = HealthCheckResponse.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('ok');
      }
    });

    it('should reject invalid health response', () => {
      const invalidData = { status: 123 }; // status should be string
      const result = HealthCheckResponse.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing status', () => {
      const invalidData = {};
      const result = HealthCheckResponse.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
