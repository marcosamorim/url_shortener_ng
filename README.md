# URL Shortener Frontend (Angular)

A minimal Angular frontend for a FastAPI-based URL shortener service.  
Users can enter a URL, send it to the API, and receive a shortened link with a simple, clean interface.

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
