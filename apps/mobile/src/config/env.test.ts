import { parseAppEnvironment } from '@/src/config/env';

describe('parseAppEnvironment', () => {
  it('uses safe development defaults', () => {
    expect(parseAppEnvironment({})).toEqual({ apiUrl: null, name: 'development' });
  });

  it('normalizes a configured API URL', () => {
    expect(
      parseAppEnvironment({
        EXPO_PUBLIC_API_URL: 'http://localhost:8080/',
        EXPO_PUBLIC_APP_ENV: 'development',
      }),
    ).toEqual({ apiUrl: 'http://localhost:8080', name: 'development' });
  });

  it('rejects credentials embedded in the API URL', () => {
    expect(() =>
      parseAppEnvironment({
        EXPO_PUBLIC_API_URL: 'https://operator:secret@api.example.com',
      }),
    ).toThrow('EXPO_PUBLIC_API_URL must not contain credentials.');
  });

  it('rejects query strings and fragments in the API base URL', () => {
    expect(() =>
      parseAppEnvironment({
        EXPO_PUBLIC_API_URL: 'https://api.example.com?token=secret#fragment',
      }),
    ).toThrow('EXPO_PUBLIC_API_URL must not contain a query string or fragment.');
  });

  it('requires an API URL for production', () => {
    expect(() => parseAppEnvironment({ EXPO_PUBLIC_APP_ENV: 'production' })).toThrow(
      'EXPO_PUBLIC_API_URL is required for production builds.',
    );
  });

  it('requires HTTPS in production', () => {
    expect(() =>
      parseAppEnvironment({
        EXPO_PUBLIC_API_URL: 'http://api.example.com',
        EXPO_PUBLIC_APP_ENV: 'production',
      }),
    ).toThrow('EXPO_PUBLIC_API_URL must use HTTPS in production.');
  });

  it('rejects invalid environment names', () => {
    expect(() => parseAppEnvironment({ EXPO_PUBLIC_APP_ENV: 'staging' })).toThrow(
      'EXPO_PUBLIC_APP_ENV must be one of:',
    );
  });
});
