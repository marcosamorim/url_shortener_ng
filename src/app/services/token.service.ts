import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'rdrt_access_token';

@Injectable({ providedIn: 'root' })
export class TokenService {
  token = signal<string | null>(null);

  constructor() {
    this.token.set(this.read());
  }

  set(token: string) {
    if (!this.isBrowser()) return;

    localStorage.setItem(STORAGE_KEY, token);
    this.token.set(token);
  }

  clear() {
    if (!this.isBrowser()) return;

    localStorage.removeItem(STORAGE_KEY);
    this.token.set(null);
  }

  get(): string | null {
    return this.token();
  }

  getExpiryEpochSeconds(): number | null {
    const token = this.token();
    if (!token || !this.isBrowser()) return null;

    const payload = this.parsePayload(token);
    if (!payload) return null;

    const exp = payload['exp'];
    return typeof exp === 'number' ? exp : null;
  }

  isExpired(leewaySeconds = 0): boolean {
    const exp = this.getExpiryEpochSeconds();
    if (!exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return exp <= now + leewaySeconds;
  }

  private read(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem(STORAGE_KEY);
  }

  private parsePayload(token: string): Record<string, unknown> | null {
    const parts = token.split('.');
    if (parts.length < 2) return null;

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

    try {
      const json = atob(padded);
      return JSON.parse(json) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage;
  }
}
