export type AppEnvironmentName = 'development' | 'preview' | 'production' | 'test';

export interface AppEnvironment {
  apiUrl: string | null;
  name: AppEnvironmentName;
}

const ENVIRONMENT_NAMES: readonly AppEnvironmentName[] = [
  'development',
  'preview',
  'production',
  'test',
];

function parseEnvironmentName(value: string | undefined): AppEnvironmentName {
  const name = value ?? 'development';

  if (!ENVIRONMENT_NAMES.includes(name as AppEnvironmentName)) {
    throw new Error(
      `EXPO_PUBLIC_APP_ENV must be one of: ${ENVIRONMENT_NAMES.join(', ')}. Received: ${name}`,
    );
  }

  return name as AppEnvironmentName;
}

function parseApiUrl(value: string | undefined, environment: AppEnvironmentName): string | null {
  if (!value) {
    if (environment === 'production') {
      throw new Error('EXPO_PUBLIC_API_URL is required for production builds.');
    }

    return null;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('EXPO_PUBLIC_API_URL must be a valid absolute URL.');
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('EXPO_PUBLIC_API_URL must use HTTP or HTTPS.');
  }

  if (url.username || url.password) {
    throw new Error('EXPO_PUBLIC_API_URL must not contain credentials.');
  }

  if (url.search || url.hash) {
    throw new Error('EXPO_PUBLIC_API_URL must not contain a query string or fragment.');
  }

  if (environment === 'production' && url.protocol !== 'https:') {
    throw new Error('EXPO_PUBLIC_API_URL must use HTTPS in production.');
  }

  return url.toString().replace(/\/$/, '');
}

export function parseAppEnvironment(
  source: Readonly<Record<string, string | undefined>>,
): AppEnvironment {
  const name = parseEnvironmentName(source.EXPO_PUBLIC_APP_ENV);

  return {
    apiUrl: parseApiUrl(source.EXPO_PUBLIC_API_URL, name),
    name,
  };
}

export const appEnvironment = parseAppEnvironment({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
});
