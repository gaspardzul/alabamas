/**
 * Páginas estáticas (HTML puro, sin JavaScript) que genera build-pwa.mjs dentro de dist/:
 *  - acerca.html     → https://alabamas.org/acerca     (página principal pública de la app)
 *  - privacidad.html → https://alabamas.org/privacidad (política de privacidad)
 *
 * Existen porque la verificación de la marca de Google (pantalla de consentimiento OAuth)
 * exige una página principal y una política accesibles sin iniciar sesión y legibles sin
 * ejecutar la app. El texto de la política sale de constants/privacyPolicy.json, el mismo
 * que usa la pantalla app/privacidad.tsx dentro de la app.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const policy = JSON.parse(readFileSync(join(root, 'constants/privacyPolicy.json'), 'utf8'));
const hymnCount = JSON.parse(readFileSync(join(root, 'assets/himnos/lista.json'), 'utf8')).lista.length;
// Funciones activas (la Biblia está oculta hasta tener la licencia de la RVR1960).
const features = JSON.parse(readFileSync(join(root, 'constants/features.json'), 'utf8'));
const tagline = features.bible ? 'Himnario y Biblia' : 'Himnario';
const links = JSON.parse(readFileSync(join(root, 'constants/links.json'), 'utf8'));

const esc = (text) =>
  String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const withEmail = (text) => text.replaceAll('{{email}}', policy.contactEmail);

// Mismos tokens que constants/Colors.ts ("Sanctuary Warmth").
const CSS = `
:root{--bg:#FBF9F5;--card:#FFFFFF;--border:#EAE6DF;--text:#1C1E21;--muted:#706E6B;--primary:#1B2A4A;--on-primary:#FFFFFF;--accent:#9A5B32;--chip:#F4EFEA}
@media (prefers-color-scheme: dark){:root{--bg:#121417;--card:#1B1E23;--border:#2A2E35;--text:#ECEAE6;--muted:#9C9993;--primary:#B7C6EE;--on-primary:#0A1A3A;--accent:#FFB68B;--chip:#23272E}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
main{max-width:720px;margin:0 auto;padding:32px 20px 64px}
.serif,h1,h2,p.body,li{font-family:Merriweather,Georgia,"Times New Roman",serif}
.label{color:var(--accent);font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase}
h1{font-size:34px;line-height:1.2;margin:4px 0 8px}
h2{font-size:19px;margin:0 0 8px}
.muted{color:var(--muted);font-size:14px}
.card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px;margin:16px 0}
.card p,.card ul{margin:8px 0}
ul{padding-left:20px}
li{margin:6px 0}
li::marker{color:var(--accent)}
a{color:var(--accent)}
.brand{display:flex;align-items:center;gap:14px;margin-bottom:24px}
.brand img{width:56px;height:56px;border-radius:14px}
.button{display:inline-block;background:var(--primary);color:var(--on-primary);text-decoration:none;font-weight:600;padding:14px 22px;border-radius:8px;margin:12px 0}
.back{display:inline-block;margin-bottom:20px;text-decoration:none;font-weight:600}
.lead{font-size:18px}
.amounts{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}
.amounts .button{margin:0;flex:1 1 20%;min-width:70px;text-align:center}
.button.outline{background:transparent;color:var(--primary);border:1px solid var(--primary)}
footer{margin-top:40px;padding-top:20px;border-top:1px solid var(--border);font-size:14px;color:var(--muted)}
`;

const page = ({ base, title, description, body }) => `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="icon" type="image/png" href="${base}/icons/icon-192.png" />
<style>${CSS}</style>
</head>
<body>
<main>
${body}
<footer>
  <p>${esc(policy.appName)} · <a href="${base}/acerca">Acerca de</a> · <a href="${base}/privacidad">Política de privacidad</a> · <a href="mailto:${esc(policy.contactEmail)}">${esc(policy.contactEmail)}</a></p>
</footer>
</main>
</body>
</html>
`;

function renderPrivacy(base) {
  const sections = policy.sections
    .map((section) => {
      const blocks = section.body
        .map((block) =>
          typeof block === 'string'
            ? `<p class="body">${esc(withEmail(block))}</p>`
            : `<ul>${block.bullets.map((b) => `<li>${esc(withEmail(b))}</li>`).join('')}</ul>`
        )
        .join('\n');
      return `<section class="card"><h2>${esc(section.title)}</h2>\n${blocks}</section>`;
    })
    .join('\n');

  return page({
    base,
    title: `Política de privacidad · ${policy.appName}`,
    description: `Qué información usa ${policy.appName}, para qué y cómo eliminarla.`,
    body: `<a class="back" href="${base}/">← Abrir ${esc(policy.appName)}</a>
<div class="label">${esc(policy.appName)}</div>
<h1>Política de privacidad</h1>
<p class="muted">Última actualización: ${esc(policy.lastUpdated)}</p>
${sections}`,
  });
}

function renderAbout(base) {
  const app = esc(policy.appName);
  return page({
    base,
    title: `${policy.appName} · ${tagline}`,
    description: features.bible
      ? `${policy.appName}: himnario de alabanzas, listas para el culto y lectura de la Biblia. Gratis, sin anuncios y sin conexión.`
      : `${policy.appName}: himnario de alabanzas y listas para el culto. Gratis, sin anuncios y sin conexión.`,
    body: `<div class="brand">
  <img src="${base}/icons/icon-192.png" alt="Ícono de ${app}" />
  <div><div class="label">${tagline}</div><h1 style="margin:0">${app}</h1></div>
</div>
<p class="lead body">${app} es un himnario de alabanzas para la iglesia, con listas para preparar el culto${features.bible ? ' y lectura de la Biblia en español' : ''}. Es gratuito, no tiene anuncios y funciona sin conexión a internet.</p>
<a class="button" href="${base}/">Abrir ${app}</a>

<section class="card">
  <h2>Qué puedes hacer</h2>
  <ul>
    <li><strong>${hymnCount} alabanzas</strong> organizadas por categorías, con búsqueda por número, título o tema.</li>
    <li>Marcar tus <strong>favoritos</strong> y ajustar el <strong>tamaño de letra</strong> para leer cómodamente.</li>
    <li>Crear <strong>listas para el culto</strong>, ordenarlas, proyectarlas en modo presentación y compartirlas en PDF.</li>
    ${features.bible ? '' : '<!-- Biblia oculta (constants/features.json) -->'}${features.bible ? `<li>Leer la <strong>Biblia</strong> en varias traducciones en español (Reina-Valera 1909, Reina-Valera Gómez y otras), con búsqueda de libro, capítulo y versículo, y descargarla para leer sin conexión.</li>` : ''}
  </ul>
</section>

<section class="card">
  <h2>Cuenta opcional con Google</h2>
  <p class="body">Puedes usar ${app} como invitado, sin dar ningún dato: todo se guarda en tu dispositivo. Si inicias sesión con tu cuenta de Google, tus favoritos, listas y ajustes se guardan en tu cuenta para verlos en todos tus dispositivos, y puedes agregar amigos con un enlace de invitación para compartirles listas de alabanzas (solo lectura o con permiso de edición). Solo usamos tu nombre, correo y foto para mostrar tu cuenta. Consulta la <a href="${base}/privacidad">política de privacidad</a>.</p>
</section>

<section class="card">
  <h2>Apoya ${app}</h2>
  <p class="body">${app} es gratuita y sin anuncios, pero su mantenimiento tiene un costo mensual. Si te ha sido de bendición, puedes apoyarla con el monto que tú elijas.</p>
  <div class="amounts">
    ${links.donationOptions.map((o) => `<a class="button" href="${esc(o.url)}" rel="noopener" target="_blank">${esc(o.label)}</a>`).join('\n    ')}
    <a class="button outline" href="${esc(links.donationUrl)}" rel="noopener" target="_blank">Otro monto</a>
  </div>
  <p class="muted">El pago se hace en ${esc(links.donationProvider)}; ${app} no recibe ni guarda tus datos de pago.</p>
</section>

<section class="card">
  <h2>Instálala en tu teléfono</h2>
  <ul>
    <li><strong>Android (Chrome):</strong> abre ${app}, toca el menú ⋮ y elige “Instalar app”.</li>
    <li><strong>iPhone (Safari):</strong> abre ${app}, toca Compartir y elige “Agregar a inicio”.</li>
  </ul>
</section>`,
  });
}

/** Escribe acerca.html y privacidad.html en `dist` usando el prefijo `base` ("" o "/alabamas"). */
export function writeStaticPages(dist, base) {
  writeFileSync(join(dist, 'privacidad.html'), renderPrivacy(base));
  writeFileSync(join(dist, 'acerca.html'), renderAbout(base));
}
