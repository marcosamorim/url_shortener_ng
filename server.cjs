const express = require('express');
const path = require('path');

const app = express();

// Make sure this matches where Angular puts index.html
const distDir = path.join(__dirname, 'dist', 'url-shortener-ng', 'browser');

app.use(express.static(distDir));

// Optional health check
app.get('/health', (req, res) => {
  res.send('OK');
});

// Catch-all for SPA routes – use REGEX to avoid Express 5 '*' issues
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Frontend listening on port ${port}`);
});
