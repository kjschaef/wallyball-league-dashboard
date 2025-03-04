import { getEnvironment } from './config';

describe('Database Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('getEnvironment should return development by default', () => {
    // Ensure NODE_ENV is not set for this test
    delete process.env.NODE_ENV;
    
    const env = getEnvironment();
    expect(env).toBe('development');
  });

  test('getEnvironment should return the correct environment', () => {
    process.env.NODE_ENV = 'production';
    
    const env = getEnvironment();
    expect(env).toBe('production');
  });
});