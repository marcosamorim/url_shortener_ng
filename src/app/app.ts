import { Component, ChangeDetectorRef } from '@angular/core';
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
  isLoading = false;
  error: string | null = null;
  result: ShortenResponse | null = null;
  apiBaseUrl = environment.apiBaseUrl;

  constructor(
    private urlShortener: UrlShortenerService,
    private cdr: ChangeDetectorRef,
  ) {}

  onSubmit() {
    if (!this.url) {
      this.error = 'Please enter a URL.';
      return;
    }

    let inputUrl = this.url.trim();
    if (!inputUrl.startsWith('http://') && !inputUrl.startsWith('https://')) {
      inputUrl = 'https://' + inputUrl;
    }

    this.error = null;
    this.result = null;
    this.isLoading = true;
    this.cdr.detectChanges(); // reflect loading state immediately

    this.urlShortener.shorten(inputUrl).subscribe({
      next: (res) => {
        this.result = res;
        this.isLoading = false;
        this.cdr.detectChanges(); // FORCE UI UPDATE
      },
      error: (err) => {
        this.isLoading = false;
        this.error =
          err?.error?.detail ||
          err.message ||
          'Failed to shorten URL. Please try again.';
        this.cdr.detectChanges(); // FORCE UI UPDATE
      },
    });
  }

  async copyShortUrl() {
    if (!this.result?.short_url) return;
    try {
      await navigator.clipboard.writeText(this.result.short_url);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }
}
