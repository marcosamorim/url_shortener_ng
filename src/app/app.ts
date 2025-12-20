import { Component, ChangeDetectorRef, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { QRCodeComponent } from 'angularx-qrcode';
import html2canvas from 'html2canvas';

import { UrlShortenerService, ShortenResponse, MyUrlItem } from './services/url-shortener.service';
import { AuthService } from './core/auth/auth.service';
import { TokenService } from './services/token.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, QRCodeComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  title = 'URL Shortener';
  private logoutTimerId: number | null = null;

  // --- Shorten form ---
  url = '';

  // --- Login form (optional) ---
  email = '';
  password = '';
  confirmPassword = '';

  // --- UI state ---
  isLoggedIn = signal(false);
  isAuthOpen = signal(false);
  isLogoutOpen = signal(false);
  authLoading = signal(false);
  authError = signal<string | null>(null);
  authMode = signal<'login' | 'register'>('login');

  isLoading = signal(false);
  error = signal<string | null>(null);
  result = signal<ShortenResponse | null>(null);
  myUrls = signal<MyUrlItem[]>([]);
  myUrlsTotal = signal(0);
  myUrlsPage = signal(1);
  myUrlsPageSize = 5;
  myUrlsLoading = signal(false);
  myUrlsError = signal<string | null>(null);
  myUrlsOpen = signal(false);

  toastMessage = signal<string | null>(null);

  showQr = signal(false);
  toggleQr() {
    this.showQr.update((v) => !v);
  }

  @ViewChild('qrCard') qrCardRef?: ElementRef<HTMLDivElement>;

  constructor(
    private urlShortener: UrlShortenerService,
    private auth: AuthService,
    private tokenService: TokenService,
    private cdr: ChangeDetectorRef,
  ) {
    // Initial state
    this.syncAuthState(false);
  }

  // -------------------------
  // Auth (optional)
  // -------------------------
  login() {
    this.authError.set(null);
    this.authLoading.set(true);

    const email = this.email.trim();
    const password = this.password;

    this.auth.login(email, password).subscribe({
      next: () => {
        this.authLoading.set(false);
        this.isAuthOpen.set(false);
        this.result.set(null);
        this.showQr.set(false);
        this.syncAuthState(true);
        this.showToast('Logged in');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.authLoading.set(false);
        this.authError.set(this.formatError(err, 'Auth service is unavailable. Please try again.'));
        this.cdr.detectChanges();
      },
    });
  }

  register() {
    this.authError.set(null);
    this.authLoading.set(true);

    const email = this.email.trim();
    const password = this.password;

    if (!email || !password || this.passwordsMismatch()) {
      this.authLoading.set(false);
      this.authError.set('Please check your details and try again.');
      return;
    }

    this.auth.register(email, password).subscribe({
      next: () => {
        this.auth.login(email, password).subscribe({
          next: () => {
            this.authLoading.set(false);
            this.isAuthOpen.set(false);
            this.result.set(null);
            this.showQr.set(false);
            this.syncAuthState(true);
            this.showToast('Account created');
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.authLoading.set(false);
            this.authError.set(this.formatError(err, 'Login failed after registration.'));
            this.cdr.detectChanges();
          },
        });
      },
      error: (err) => {
        this.authLoading.set(false);
        this.authError.set(this.formatError(err, 'Registration failed. Please try again.'));
        this.cdr.detectChanges();
      },
    });
  }

  // Frontend-only logout: just remove token locally
  logout() {
    this.tokenService.clear();
    this.isLoggedIn.set(false);
    this.myUrls.set([]);
    this.myUrlsTotal.set(0);
    this.myUrlsPage.set(1);
    this.result.set(null);
    this.showQr.set(false);
    this.email = '';
    this.password = '';
    this.confirmPassword = '';
    this.isLogoutOpen.set(false);
    this.clearLogoutTimer();
    this.showToast('Logged out');
    this.cdr.detectChanges();
  }

  openAuth() {
    this.authError.set(null);
    this.isAuthOpen.set(true);
  }

  closeAuth() {
    this.isAuthOpen.set(false);
  }

  openLogoutConfirm() {
    this.isLogoutOpen.set(true);
  }

  closeLogoutConfirm() {
    this.isLogoutOpen.set(false);
  }

  setAuthMode(mode: 'login' | 'register') {
    this.authMode.set(mode);
    this.authError.set(null);
    this.confirmPassword = '';
  }

  isRegisterMode(): boolean {
    return this.authMode() === 'register';
  }

  passwordsMismatch(): boolean {
    return this.isRegisterMode() && !!this.confirmPassword && this.password !== this.confirmPassword;
  }

  canSubmitAuth(): boolean {
    if (!this.email.trim() || !this.password) return false;
    if (this.isRegisterMode() && this.password !== this.confirmPassword) return false;
    return true;
  }

  loadMyUrls(page: number) {
    if (!this.isLoggedIn()) return;
    this.myUrlsLoading.set(true);
    this.myUrlsError.set(null);
    this.myUrlsPage.set(page);

    this.urlShortener.myUrls(page, this.myUrlsPageSize).subscribe({
      next: (res) => {
        this.myUrls.set(res.items);
        this.myUrlsTotal.set(res.total);
        this.myUrlsLoading.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.myUrlsLoading.set(false);
        this.myUrlsError.set(
          this.formatError(err, 'Shortener service is unavailable. Please try again.'),
        );
        this.cdr.detectChanges();
      },
    });
  }

  refreshMyUrls() {
    this.loadMyUrls(this.myUrlsPage());
  }

  toggleMyUrls() {
    this.myUrlsOpen.update((value) => !value);
  }

  get myUrlsTotalPages(): number {
    return Math.max(1, Math.ceil(this.myUrlsTotal() / this.myUrlsPageSize));
  }

  nextMyUrlsPage() {
    const next = this.myUrlsPage() + 1;
    if (next <= this.myUrlsTotalPages) {
      this.loadMyUrls(next);
    }
  }

  prevMyUrlsPage() {
    const prev = this.myUrlsPage() - 1;
    if (prev >= 1) {
      this.loadMyUrls(prev);
    }
  }

  formatDate(value: string | undefined): string {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString();
  }

  private syncAuthState(showExpiredToast: boolean) {
    const token = this.tokenService.get();
    if (!token) {
      this.isLoggedIn.set(false);
      this.clearLogoutTimer();
      return;
    }

    if (this.tokenService.isExpired()) {
      this.tokenService.clear();
      this.isLoggedIn.set(false);
      this.clearLogoutTimer();
      if (showExpiredToast) {
        this.showToast('Session expired');
      }
      return;
    }

    this.isLoggedIn.set(true);
    this.loadMyUrls(1);
    this.scheduleLogout();
  }

  private scheduleLogout() {
    this.clearLogoutTimer();
    if (typeof window === 'undefined') return;

    const exp = this.tokenService.getExpiryEpochSeconds();
    if (!exp) return;

    const delayMs = exp * 1000 - Date.now();
    if (delayMs <= 0) {
      this.syncAuthState(true);
      return;
    }

    this.logoutTimerId = window.setTimeout(() => {
      this.syncAuthState(true);
      this.cdr.detectChanges();
    }, delayMs);
  }

  private clearLogoutTimer() {
    if (this.logoutTimerId === null || typeof window === 'undefined') return;
    window.clearTimeout(this.logoutTimerId);
    this.logoutTimerId = null;
  }

  private formatError(err: unknown, fallback: string): string {
    const anyErr = err as { status?: number; message?: string; error?: { detail?: string } };
    if (anyErr?.status === 0) {
      return fallback;
    }
    return anyErr?.error?.detail || anyErr?.message || fallback;
  }

  // -------------------------
  // Shorten (anonymous OR logged in)
  // -------------------------
  onSubmit() {
    const trimmed = this.url.trim();

    if (!trimmed) {
      this.error.set('Please enter a URL.');
      return;
    }

    // 1) Normalise (add https:// if missing)
    const normalisedUrl = this.normaliseUrl(trimmed);

    // 2) Validate
    const validationError = this.validateUrl(normalisedUrl);
    if (validationError) {
      this.error.set(validationError);
      this.result.set(null);
      return;
    }

    // 3) Clear previous state and call API
    this.error.set(null);
    this.result.set(null);
    this.isLoading.set(true);
    this.showQr.set(false);
    this.cdr.detectChanges();

    this.urlShortener.shorten(normalisedUrl).subscribe({
      next: (res) => {
        this.result.set(res);
        this.isLoading.set(false);
        if (this.isLoggedIn()) {
          this.loadMyUrls(1);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set(this.formatError(err, 'Failed to shorten URL. Please try again.'));
        this.cdr.detectChanges();
      },
    });
  }

  private normaliseUrl(raw: string): string {
    const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(raw);
    return hasScheme ? raw : `https://${raw}`;
  }

  private validateUrl(url: string): string | null {
    try {
      const parsed = new URL(url);

      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return 'Only http and https URLs are supported.';
      }
      if (!parsed.hostname) {
        return 'Please enter a valid domain.';
      }
      if (!parsed.hostname.includes('.')) {
        return 'Please enter a full domain (e.g. example.com).';
      }
      return null;
    } catch {
      return 'Please enter a valid URL.';
    }
  }

  get shortUrlLabel(): string | null {
    const url = this.result()?.short_url;
    if (!url) return null;
    return url.replace(/^https?:\/\//, '');
  }

  async copyShortUrl() {
    const current = this.result();
    if (!current?.short_url) return;

    try {
      await navigator.clipboard.writeText(current.short_url);
      this.showToast('Copied!');
    } catch {
      this.showToast('Copy failed');
    }
  }

  showToast(message: string) {
    this.toastMessage.set(message);

    setTimeout(() => {
      this.toastMessage.set(null);
      this.cdr.detectChanges();
    }, 2000);
  }

  async downloadQrCard() {
    if (!this.qrCardRef) {
      this.showToast('QR card not ready');
      return;
    }

    const element = this.qrCardRef.nativeElement;

    try {
      const canvas = await html2canvas(element, {
        scale: 3,
        backgroundColor: null,
      });

      const dataUrl = canvas.toDataURL('image/png');

      const short = this.result()?.short_url ?? 'rdrt-link';
      const slug = short.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9_-]/g, '_');

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `qr-${slug}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.showToast('QR card downloaded');
    } catch {
      this.showToast('Failed to download QR card');
    }
  }

  copyQrCardToClipboard() {
    if (!this.qrCardRef) {
      this.showToast('QR card not ready');
      return;
    }

    const hasClipboardWrite =
      'clipboard' in navigator &&
      typeof (navigator as any).clipboard.write === 'function' &&
      typeof (window as any).ClipboardItem === 'function';

    if (!hasClipboardWrite) {
      this.showToast('Image clipboard is not supported in this browser');
      return;
    }

    const element = this.qrCardRef.nativeElement;

    const clipboardItem = new (window as any).ClipboardItem({
      'image/png': new Promise<Blob>(async (resolve, reject) => {
        try {
          const canvas = await html2canvas(element, {
            scale: 3,
            backgroundColor: null,
          });

          canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('Failed to create blob'))),
            'image/png',
          );
        } catch (err) {
          reject(err);
        }
      }),
    });

    (navigator as any).clipboard
      .write([clipboardItem])
      .then(() => this.showToast('QR card copied!'))
      .catch(() => this.showToast('Failed to copy QR card'));
  }
}
