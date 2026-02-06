import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { UrlShortenerService } from './url-shortener.service';
import { environment } from '../../environments/environment';

describe('UrlShortenerService', () => {
  let service: UrlShortenerService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UrlShortenerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call shorten endpoint using configured API version', () => {
    service.shorten('https://example.com').subscribe();

    const req = httpMock.expectOne(
      `${environment.SHORTENER_API_BASE_URL}/api/v${environment.API_VERSION}/shorten`,
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ url: 'https://example.com' });
    req.flush({
      code: 'abc123',
      short_url: 'http://localhost:8000/abc123',
      original_url: 'https://example.com',
    });
  });

  it('should call stats endpoint using configured API version', () => {
    service.stats('abc123').subscribe();

    const req = httpMock.expectOne(
      `${environment.SHORTENER_API_BASE_URL}/api/v${environment.API_VERSION}/stats/abc123`,
    );
    expect(req.request.method).toBe('GET');
    req.flush({ code: 'abc123', clicks: 0 });
  });

  it('should call myUrls endpoint using configured API version', () => {
    service.myUrls(2, 5).subscribe();

    const req = httpMock.expectOne(
      `${environment.SHORTENER_API_BASE_URL}/api/v${environment.API_VERSION}/me/urls?page=2&page_size=5`,
    );
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], page: 2, page_size: 5, total: 0 });
  });

  it('should call updateLink endpoint using configured API version', () => {
    service.updateLink('abc123', { is_active: false }).subscribe();

    const req = httpMock.expectOne(
      `${environment.SHORTENER_API_BASE_URL}/api/v${environment.API_VERSION}/links/abc123`,
    );
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ is_active: false });
    req.flush({});
  });
});
