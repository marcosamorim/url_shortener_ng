import { Component, ChangeDetectorRef, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { QRCodeComponent } from 'angularx-qrcode';
import html2canvas from 'html2canvas';

import { UrlShortenerService, ShortenResponse } from './services/url-shortener.service';
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

  // --- Shorten form ---
  url = '';

  // --- Login form (optional) ---
  email = '';
  password = '';

  // --- UI state ---
  isLoggedIn = signal(false);

  isLoading = signal(false);
  error = signal<string | null>(null);
  result = signal<ShortenResponse | null>(null);

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
    this.isLoggedIn.set(!!this.tokenService.token());
  }

  // -------------------------
  // Auth (optional)
  // -------------------------
  login() {
    this.error.set(null);
    this.isLoading.set(true);

    const email = this.email.trim();
    const password = this.password;

    this.auth.login(email, password).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isLoggedIn.set(true);
        this.showToast('Logged in');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err?.error?.detail || err?.message || 'Login failed';
        this.error.set(msg);
        this.cdr.detectChanges();
      },
    });
  }

  // Frontend-only logout: just remove token locally
  logout() {
    this.tokenService.clear();
    this.isLoggedIn.set(false);
    this.showToast('Logged out');
    this.cdr.detectChanges();
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
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg =
          err?.error?.detail ||
          err?.message ||
          'Failed to shorten URL. Please try again.';
        this.error.set(msg);
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
