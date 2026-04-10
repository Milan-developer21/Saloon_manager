import request from 'supertest';
import app from '../app.js';

describe('API Server Integration Tests', () => {
  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/healthz')
        .expect(200);

      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  // TODO: Add more integration tests for auth, saloons, bookings routes
});
