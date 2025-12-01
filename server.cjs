const express = require('express');
const path = require('path');

const app = express();

const distDir = path.join(__dirname, 'dist', 'url-shortener-ng', 'browser');

app.use(express.static(distDir));

app.get('*', (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Frontend listening on port ${port}`);
});
