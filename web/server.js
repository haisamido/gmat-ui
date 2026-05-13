#!/usr/bin/env node
/**
 * GMAT WASM HTTP Server
 * Custom server with logging format matching the Python server in build.sh
 *
 * Log format: TIMESTAMP - IP - [hash:GIT_HASH srv:SERVER_ID cli:CLIENT_ID] "REQUEST" STATUS SIZE
 */

const http   = require('http');
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

const PORT            = process.env.PORT || 8989;
const ROOT_DIR        = process.env.ROOT_DIR || '/gmat/out';
const SAMPLES_DIR     = process.env.SAMPLES_DIR || '/gmat/application/samples';
const GIT_COMMIT      = process.env.GIT_COMMIT || 'unknown';
const GIT_COMMIT_FULL = process.env.GIT_COMMIT_FULL || 'unknown';
const REPO_COMMIT_URL = process.env.REPO_COMMIT_URL || '';
const SERVER_ID       = crypto.randomBytes(4).toString('hex');

// MIME types for common file extensions
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.data': 'application/octet-stream',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.script': 'text/plain',
  '.yaml': 'text/yaml',
  '.yml': 'text/yaml',
};

function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace('Z', '+00:00');
}

function logRequest(req, statusCode, size) {
  const ts = getTimestamp();
  const ip = req.socket.remoteAddress || '-';
  const clientId = req.headers['x-session-id'] || '-';
  const requestLine = `${req.method} ${req.url} HTTP/${req.httpVersion}`;
  console.log(`${ts} - ${ip} - [hash:${GIT_COMMIT} srv:${SERVER_ID} cli:${clientId}] "${requestLine}" ${statusCode} ${size}`);
}

function serveFile(req, res, filePath) {
  fs.stat(filePath, (err, stats) => {
    if (err) {
      res.writeHead(404, {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'X-Session-ID',
        'Cache-Control': 'no-store'
      });
      res.end('Not Found');
      logRequest(req, 404, 9);
      return;
    }

    if (stats.isDirectory()) {
      // Try index.html in directory
      serveFile(req, res, path.join(filePath, 'index.html'));
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500, {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'X-Session-ID',
          'Cache-Control': 'no-store'
        });
        res.end('Internal Server Error');
        logRequest(req, 500, 21);
        return;
      }

      res.writeHead(200, {
        'Content-Type': mimeType,
        'Content-Length': data.length,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'X-Session-ID',
        'Cache-Control': 'no-store'
      });
      res.end(data);
      logRequest(req, 200, data.length);
    });
  });
}

const server = http.createServer((req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Session-ID',
      'Cache-Control': 'no-store'
    });
    res.end();
    logRequest(req, 204, 0);
    return;
  }

  // Parse URL (remove query string)
  const urlPath = req.url.split('?')[0];

  // /version endpoint
  if (urlPath === '/version' || urlPath === '/version/') {
    const data = JSON.stringify({
      hash: GIT_COMMIT,
      hashFull: GIT_COMMIT_FULL,
      repoCommitUrl: REPO_COMMIT_URL,
      srv: SERVER_ID
    });
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'X-Session-ID',
      'Cache-Control': 'no-store'
    });
    res.end(data);
    logRequest(req, 200, data.length);
    return;
  }

  // /samples endpoint — serves from the mounted samples directory
  if (urlPath === '/samples' || urlPath === '/samples/') {
    // List all .script files
    fs.readdir(SAMPLES_DIR, (err, files) => {
      if (err) {
        res.writeHead(404, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'X-Session-ID',
          'Cache-Control': 'no-store'
        });
        res.end(JSON.stringify({ error: 'Samples directory not found' }));
        logRequest(req, 404, 0);
        return;
      }
      const scripts = files.filter(f => f.endsWith('.script')).sort();
      const data = JSON.stringify(scripts);
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'X-Session-ID',
        'Cache-Control': 'no-store'
      });
      res.end(data);
      logRequest(req, 200, data.length);
    });
    return;
  }
  if (urlPath.startsWith('/samples/')) {
    const samplePath = path.join(SAMPLES_DIR, urlPath.slice('/samples/'.length));
    if (!samplePath.startsWith(SAMPLES_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' });
      res.end('Forbidden');
      logRequest(req, 403, 9);
      return;
    }
    serveFile(req, res, samplePath);
    return;
  }

  // Serve static files
  let filePath = path.join(ROOT_DIR, urlPath);

  // Security: prevent directory traversal
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, {
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store'
    });
    res.end('Forbidden');
    logRequest(req, 403, 9);
    return;
  }

  serveFile(req, res, filePath);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Git commit: ${GIT_COMMIT}`);
  console.log(`Server ID: ${SERVER_ID}`);
  console.log(`Serving ${ROOT_DIR} on http://0.0.0.0:${PORT}`);
});

process.on('SIGINT', () => {
  console.log('\nServer stopped.');
  process.exit(0);
});
