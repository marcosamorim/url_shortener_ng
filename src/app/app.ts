import { Component, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  UrlShortenerService,
  ShortenResponse,
} from './services/url-shortener.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

    let inputUrl = trimmed;

    if (
      !inputUrl.startsWith('http://') &&
      !inputUrl.startsWith('https://')
    ) {
      inputUrl = 'https://' + inputUrl;
    }

    this.error.set(null);
    this.result.set(null);
    this.isLoading.set(true);
    this.cdr.detectChanges();

    this.urlShortener.shorten(inputUrl).subscribe({
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
