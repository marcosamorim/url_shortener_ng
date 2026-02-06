import { environment as devEnv } from './environment';
import { environment as dockerEnv } from './environment.docker';
import { environment as prodEnv } from './environment.prod';

describe('Environment compatibility', () => {
  it('should keep API version aligned with shortener backend (v1)', () => {
    expect(devEnv.API_VERSION).toBe('1');
    expect(dockerEnv.API_VERSION).toBe('1');
    expect(prodEnv.API_VERSION).toBe('1');
  });

  it('should define API base URLs', () => {
    expect(devEnv.SHORTENER_API_BASE_URL).toBeTruthy();
    expect(devEnv.AUTH_API_BASE_URL).toBeTruthy();
    expect(dockerEnv.SHORTENER_API_BASE_URL).toBeTruthy();
    expect(dockerEnv.AUTH_API_BASE_URL).toBeTruthy();
    expect(prodEnv.SHORTENER_API_BASE_URL).toBeTruthy();
    expect(prodEnv.AUTH_API_BASE_URL).toBeTruthy();
  });
});
