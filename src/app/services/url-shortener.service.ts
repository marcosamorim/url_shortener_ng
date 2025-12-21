import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TokenService } from './token.service';

export interface ShortenResponse {
  code: string;
  short_url: string;
  original_url: string;
}

export interface StatsPublic {
  code: string;
  clicks: number;
}

export interface StatsPrivate extends StatsPublic {
  original_url: string;
  owner_client_id: string;
  created_by_user_id?: string | null;
  source_type: string;
  created_at?: string;
  expires_at?: string | null;
  is_active: boolean;
  extras?: Record<string, unknown> | null;
}

export interface MyUrlItem {
  code: string;
  short_url: string;
  original_url: string;
  clicks: number;
  created_at: string;
}

export interface MyUrlsResponse {
  items: MyUrlItem[];
  page: number;
  page_size: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class UrlShortenerService {
  private readonly apiBaseUrl = environment.SHORTENER_API_BASE_URL;
  private readonly apiVersion = environment.API_VERSION || '0';

  constructor(private http: HttpClient, private tokenService: TokenService) {}

  shorten(url: string): Observable<ShortenResponse> {
    return this.http.post<ShortenResponse>(`${this.apiBaseUrl}/api/v${this.apiVersion}/shorten`, {
      url,
    });
  }

  stats(code: string): Observable<StatsPublic | StatsPrivate> {
    return this.http.get<StatsPublic | StatsPrivate>(
      `${this.apiBaseUrl}/api/v${this.apiVersion}/stats/${code}`,
      {
        headers: this.authHeadersIfAny(),
      },
    );
  }

  myUrls(page = 1, pageSize = 10): Observable<MyUrlsResponse> {
    return this.http.get<MyUrlsResponse>(
      `${this.apiBaseUrl}/api/v${this.apiVersion}/me/urls?page=${page}&page_size=${pageSize}`,
    );
  }

  updateLink(code: string, payload: { is_active?: boolean; expires_at?: string | null }) {
    return this.http.patch(
      `${this.apiBaseUrl}/api/v${this.apiVersion}/links/${code}`,
      payload,
      {
        headers: this.authHeadersIfAny(),
      },
    );
  }

  private authHeadersIfAny(): HttpHeaders | undefined {
    const token = this.tokenService.token();
    if (!token) return undefined;
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}
