/**
 * sw.js — Service Worker for GMAT Web GUI
 *
 * Injects X-Session-ID header on all requests for server-side logging.
 * Session ID is passed via query parameter during registration.
 */

// Extract session ID from the SW script URL query params
const SESSION_ID = new URL(self.location.href).searchParams.get('sid') || '-';

self.addEventListener('install', () => {
  // Activate immediately, don't wait for old SW to be replaced
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Take control of all clients immediately
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only modify same-origin requests
  if (new URL(request.url).origin !== self.location.origin) {
    return;
  }

  // Clone request with added header
  const modifiedHeaders = new Headers(request.headers);
  modifiedHeaders.set('X-Session-ID', SESSION_ID);

  const modifiedRequest = new Request(request, {
    headers: modifiedHeaders,
    cache: 'no-store'
  });

  event.respondWith(fetch(modifiedRequest));
});
