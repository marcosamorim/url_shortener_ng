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

  private read(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem(STORAGE_KEY);
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage;
  }
}
