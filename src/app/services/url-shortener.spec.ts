import { TestBed } from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';

import { UrlShortenerService } from './url-shortener.service';

describe('UrlShortenerService', () => {
  let service: UrlShortenerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    service = TestBed.inject(UrlShortenerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
