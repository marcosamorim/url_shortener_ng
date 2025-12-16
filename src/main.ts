import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';

import { App } from './app/app';
import { authInterceptor } from './app/core/auth/auth.interceptor';

bootstrapApplication(App, {
  providers: [
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor]),
    ),
  ],
}).catch((err) => console.error(err));
