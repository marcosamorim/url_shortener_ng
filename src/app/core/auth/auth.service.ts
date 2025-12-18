import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenService } from '../../services/token.service';

export interface TokenResponse {
  access_token: string;
  token_type?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authBaseUrl = environment.AUTH_API_BASE_URL;

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
  ) {}

  login(email: string, password: string): Observable<TokenResponse> {
    const body = new URLSearchParams();
    body.set('username', email);
    body.set('password', password);
    body.set('client_id', 'angular-web');

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    return this.http
      .post<TokenResponse>(`${this.authBaseUrl}/auth/login`, body.toString(), { headers })
      .pipe(
        tap((res) => {
          // THIS is what you are missing
          this.tokenService.set(res.access_token);
        }),
      );
  }

  logout() {
    this.tokenService.clear();
  }

  isLoggedIn(): boolean {
    return !!this.tokenService.get();
  }
}
