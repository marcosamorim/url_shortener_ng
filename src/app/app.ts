import { Component, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  UrlShortenerService,
  ShortenResponse,
} from './services/url-shortener.service';
import { environment } from '../environments/environment';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, QRCodeComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  title = 'URL Shortener';

  url = '';

  isLoading = signal(false);
  error = signal<string | null>(null);
  result = signal<ShortenResponse | null>(null);

  toastMessage = signal<string | null>(null);

  showQr = signal(false);

  toggleQr() {
    this.showQr.update((v) => !v);
  }

  apiBaseUrl = environment.apiBaseUrl;

  constructor(
    private urlShortener: UrlShortenerService,
    private cdr: ChangeDetectorRef,
  ) {}

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
          err.message ||
          'Failed to shorten URL. Please try again.';
        this.error.set(msg);
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Adds https:// if the user didn't type a scheme.
   */
  private normaliseUrl(raw: string): string {
    const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(raw);
    if (!hasScheme) {
      return 'https://' + raw;
    }
    return raw;
  }

  /**
   * Validates URL using the browser URL parser and enforces http/https.
   * Returns error message string, or null if valid.
   */
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

    return url.replace(/^https?:\/\//, "");
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
}
