# URL Shortener Frontend (Angular)

A minimal Angular frontend for a FastAPI-based URL shortener service.  
Users can enter a URL, send it to the API, and receive a shortened link with a simple, clean interface.

## Related Services

These repos are related but designed to run standalone as well:

- Auth service: https://github.com/marcosamorim/auth-service
- URL shortener API: https://github.com/marcosamorim/url_shortener

## Features
- Input field to submit a URL
- Auto-adds `https://` if the scheme is missing
- Calls backend `/api/shorten`
- Displays original + shortened URL
- Copy-to-clipboard support
- Lightweight UI using plain CSS

## Tech Stack
- Angular 17+ (standalone components)
- TypeScript
- Angular HttpClient (with `fetch`)
- Pure CSS

## Setup

### Install dependencies
```bash
npm install
```

### Start development server
```bash
ng serve
```

Frontend runs at:
http://localhost:4200/

### Backend expected
Your API should expose:

`POST /api/shorten`

Configure the API URL in:
`src/environments/environment.ts`

## Docker Compose (optional)

Run the full microservice stack locally:

```bash
docker compose up
```

To build just this service locally while the others use images, keep the same command and add a `docker-compose.override.yml` with a `build:` for this repo (already provided).

## Auth Flow (JWT)

This frontend authenticates against the [`auth-service`](https://github.com/marcosamorim/auth-service) and attaches the JWT to the [`url_shortener`](https://github.com/marcosamorim/url_shortener) requests.

- Login: `POST {AUTH_API_BASE_URL}/auth/login` with `username`, `password`, `client_id=angular-web`.
- Token storage: saved in `localStorage` by `TokenService`.
- Requests: `authInterceptor` adds `Authorization: Bearer <token>` to API calls.

Configure base URLs in:
- `src/environments/environment.ts` (dev)
- `src/environments/environment.prod.ts` (prod)

## Build for production
```bash
ng build
```

Output will be available in `dist/`.

## Project Structure (core files)
```
src/
  main.ts
  index.html
  styles.css
  environments/
    environment.ts
  app/
    app.ts
    app.html
    app.css
    services/
      url-shortener.service.ts
```

## Roadmap
- Stats page (`/api/stats/{code}`)
- Better UI styling
- Local history of shortened URLs
- Custom aliases
