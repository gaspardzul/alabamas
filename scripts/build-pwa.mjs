#!/usr/bin/env node
/**
 * Genera dist/sw.js después de `expo export --platform web`.
 * Uso: node scripts/build-pwa.mjs [dist]
 *
 * Estrategia del service worker:
 *  - Precache: index.html, manifest, íconos y los bundles JS (incluyen todos los himnos).
 *  - /_expo/* y /assets/* (archivos con hash, inmutables): cache-first, se guardan al usarse.
 *    Así no se precachean los ~20 MB de fuentes que la app no usa.
 *  - Navegación: network-first con respaldo a index.html (SPA y modo sin conexión).
 *  - La Biblia (bible.helloao.org) no pasa por aquí: la guarda la app en IndexedDB.
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const dist = process.argv[2] ?? 'dist';

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

const files = walk(dist).map((f) => '/' + relative(dist, f).split('\\').join('/'));
const precache = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  ...files.filter((f) => f.startsWith('/icons/')),
  ...files.filter((f) => f.startsWith('/_expo/static/') && /\.(js|css)$/.test(f)),
];

// La versión cambia cuando cambia cualquier archivo precacheado → el SW se actualiza.
const hash = createHash('sha256');
for (const f of precache) {
  if (f === '/') continue;
  hash.update(f);
  hash.update(readFileSync(join(dist, f)));
}
const version = hash.digest('hex').slice(0, 12);

const sw = `// Generado por scripts/build-pwa.mjs — no editar a mano.
const VERSION = '${version}';
const CACHE = 'alaba-' + VERSION;
const PRECACHE = ${JSON.stringify(precache, null, 2)};

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('alaba-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navegación (SPA): red primero, si no hay conexión servir index.html desde caché.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Archivos con hash: caché primero, guardar al primer uso.
  if (url.pathname.startsWith('/_expo/') || url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
    return;
  }

  // Resto (manifest, íconos): caché y actualizar en segundo plano.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
`;

writeFileSync(join(dist, 'sw.js'), sw);

// Hosting estático sin reglas de reescritura (GitHub Pages): servir la SPA también en rutas
// profundas como /bible, y evitar que Jekyll ignore las carpetas que empiezan con "_" (_expo).
writeFileSync(join(dist, '404.html'), readFileSync(join(dist, 'index.html')));
writeFileSync(join(dist, '.nojekyll'), '');
console.log(`sw.js generado (versión ${version}, ${precache.length} archivos precacheados)`);
