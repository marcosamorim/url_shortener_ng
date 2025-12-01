import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ShortenResponse {
  code: string;
  short_url: string;
  original_url: string;
}

@Injectable({
  providedIn: 'root',
})
export class UrlShortenerService {
  private readonly apiBaseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  shorten(url: string): Observable<ShortenResponse> {
    return this.http.post<ShortenResponse>(`${this.apiBaseUrl}/api/shorten`, {
      url,
    });
  }
}
