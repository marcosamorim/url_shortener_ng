import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { App } from './app/app';

bootstrapApplication(App, {
  providers: [provideHttpClient(withFetch())],
}).catch((err) => console.error(err));
