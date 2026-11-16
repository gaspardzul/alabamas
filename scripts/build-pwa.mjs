#!/usr/bin/env node
/**
 * Genera dist/sw.js después de `expo export --platform web`.
 * Uso: WEB_BASE_URL=/alabamas node scripts/build-pwa.mjs [dist]
 *
 * WEB_BASE_URL ("" o "/prefijo") debe ser el mismo con el que se hizo el export (app.config.js):
 * se aplica a los enlaces de index.html, al manifiesto y a las rutas del service worker.
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
import { writeStaticPages } from './static-pages.mjs';

const dist = process.argv[2] ?? 'dist';
const base = (process.env.WEB_BASE_URL ?? '').replace(/\/+$/, ''); // "" o "/alabamas"

// index.html y manifiesto vienen de public/ con rutas absolutas a la raíz; prefijarlas.
if (base) {
  const htmlPath = join(dist, 'index.html');
  let html = readFileSync(htmlPath, 'utf8');
  html = html
    .replace('href="/manifest.webmanifest"', `href="${base}/manifest.webmanifest"`)
    .replaceAll('href="/icons/', `href="${base}/icons/`)
    .replace("register('/sw.js')", `register('${base}/sw.js', { scope: '${base}/' })`);
  writeFileSync(htmlPath, html);

  const manifestPath = join(dist, 'manifest.webmanifest');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  manifest.start_url = `${base}/`;
  manifest.scope = `${base}/`;
  manifest.icons = manifest.icons.map((icon) => ({ ...icon, src: base + icon.src }));
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

const files = walk(dist).map((f) => '/' + relative(dist, f).split('\\').join('/'));
const precacheFiles = [
  '/index.html',
  '/manifest.webmanifest',
  ...files.filter((f) => f.startsWith('/icons/')),
  ...files.filter((f) => f.startsWith('/_expo/static/') && /\.(js|css)$/.test(f)),
];
const precache = [`${base}/`, ...precacheFiles.map((f) => base + f)];

// La versión cambia cuando cambia cualquier archivo precacheado → el SW se actualiza.
const hash = createHash('sha256');
for (const f of precacheFiles) {
  hash.update(base + f);
  hash.update(readFileSync(join(dist, f)));
}
const version = hash.digest('hex').slice(0, 12);

const sw = `// Generado por scripts/build-pwa.mjs — no editar a mano.
const VERSION = '${version}';
const BASE = '${base}';
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
          caches.open(CACHE).then((cache) => cache.put(BASE + '/index.html', copy));
          return response;
        })
        .catch(() => caches.match(BASE + '/index.html'))
    );
    return;
  }

  // Archivos con hash: caché primero, guardar al primer uso.
  if (url.pathname.startsWith(BASE + '/_expo/') || url.pathname.startsWith(BASE + '/assets/')) {
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

// El 404.html sirve la app pero con estado HTTP 404. Para las rutas que alguien puede abrir
// directamente (y que verifica Google, como /privacidad) generamos una copia real: GitHub
// Pages sirve /privacidad desde privacidad.html con estado 200.
const PUBLIC_ROUTES = ['bible', 'explore', 'favorites', 'mylists', 'about'];
for (const route of PUBLIC_ROUTES) {
  writeFileSync(join(dist, `${route}.html`), readFileSync(join(dist, 'index.html')));
}

// /acerca y /privacidad: HTML estático legible sin JavaScript ni sesión (verificación de Google).
writeStaticPages(dist, base);
writeFileSync(join(dist, '.nojekyll'), '');
console.log(`sw.js generado (versión ${version}, base "${base || '/'}", ${precache.length} archivos precacheados)`);
