import { setBaseUrl, setAuthTokenGetter, customFetch } from '../custom-fetch.js';

describe('Custom Fetch', () => {
  beforeEach(() => {
    setBaseUrl(null);
    setAuthTokenGetter(null);
  });

  describe('setBaseUrl', () => {
    it('should set and prepend base URL to relative paths', async () => {
      setBaseUrl('https://api.example.com');

      // Mock fetch
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'content-type': 'application/json' }),
          text: () => Promise.resolve('{"status": "ok"}'),
        } as Response)
      );

      await customFetch('/health');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/health',
        expect.any(Object)
      );
    });

    it('should not prepend to absolute URLs', async () => {
      setBaseUrl('https://api.example.com');

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'content-type': 'application/json' }),
          text: () => Promise.resolve('{"status": "ok"}'),
        } as Response)
      );

      await customFetch('https://other.com/health');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://other.com/health',
        expect.any(Object)
      );
    });
  });

  describe('setAuthTokenGetter', () => {
    it('should attach bearer token when getter returns token', async () => {
      setAuthTokenGetter(() => 'test-token');

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'content-type': 'application/json' }),
          text: () => Promise.resolve('{"status": "ok"}'),
        } as Response)
      );

      await customFetch('/health');

      const call = (global.fetch as jest.Mock).mock.calls[0];
      const headers = call[1].headers;
      expect(headers.get('authorization')).toBe('Bearer test-token');
    });

    it('should not attach token when getter returns null', async () => {
      setAuthTokenGetter(() => null);

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'content-type': 'application/json' }),
          text: () => Promise.resolve('{"status": "ok"}'),
        } as Response)
      );

      await customFetch('/health');

      const call = (global.fetch as jest.Mock).mock.calls[0];
      const headers = call[1].headers;
      expect(headers.has('authorization')).toBe(false);
    });
  });
});
