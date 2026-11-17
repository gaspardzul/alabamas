// Prueba de extremo a extremo de amigos y listas compartidas contra los emuladores.
// Requiere: npm run emulators  y  npm run web:emulators (puerto 8082). Uso: node tests/e2e-social.mjs <dirCapturas>
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const BASE = 'http://localhost:8082';
const OUT = process.argv[2] ?? '.';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
const check = (label, ok, extra = '') => {
  if (!ok) failures++;
  console.log(`${ok ? '✔' : '✖'} ${label}${extra ? ` (${extra})` : ''}`);
};

// Acceso directo al emulador (sin reglas) para preparar y verificar datos.
const env = await initializeTestEnvironment({ projectId: 'demo-alabamas', firestore: { host: '127.0.0.1', port: 8080 } });
await env.clearFirestore();
const admin = async (fn) => {
  let result;
  await env.withSecurityRulesDisabled(async (ctx) => { result = await fn(ctx.firestore()); });
  return result;
};
const read = (path) => admin(async (db) => (await getDoc(doc(db, path))).data() ?? null);

async function browser(port, name) {
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new', '--disable-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=${OUT}/e2e-${name}`, 'about:blank',
  ], { stdio: 'ignore' });
  let target;
  for (let i = 0; i < 40 && !target; i++) {
    await sleep(250);
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page'); } catch {}
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0; const pending = new Map(); const errors = [];
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result ?? m.error); pending.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description?.slice(0, 200));
  };
  await new Promise((r) => (ws.onopen = r));
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  const ev = async (x) => (await send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true }))?.result?.value;
  return {
    errors,
    ev,
    go: async (path, wait = 4000) => { await send('Page.navigate', { url: BASE + path }); await sleep(wait); },
    text: () => ev('document.body.innerText'),
    click: (txt) => ev(`(() => { const el=[...document.querySelectorAll('div,span')].reverse().find(n=>n.textContent.trim()===${JSON.stringify(txt)}&&n.offsetParent); if(!el) return false; el.click(); return true; })()`),
    clickLabel: (label, i = 0) => ev(`(() => { const b=[...document.querySelectorAll('[aria-label=${JSON.stringify(label)}]')][${i}]; if(!b) return false; b.click(); return true; })()`),
    type: (placeholderStart, value) => ev(`(() => { const i=[...document.querySelectorAll('input')].find(n=>n.placeholder.startsWith(${JSON.stringify(placeholderStart)})); if(!i) return false; const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; set.call(i, ${JSON.stringify(value)}); i.dispatchEvent(new Event('input',{bubbles:true})); return true; })()`),
    shot: async (file) => { const s = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${OUT}/${file}.png`, Buffer.from(s.data, 'base64')); },
    close: () => { ws.close(); chrome.kill(); },
  };
}

const ana = await browser(9401, 'ana');
const beto = await browser(9402, 'beto');

// El emulador asigna su propio uid: lo devuelve el helper de inicio de sesión.
const signIn = (who, id, name) => who.ev(`window.__alabaTestSignIn(${JSON.stringify(id)}, ${JSON.stringify(name)}).then(c => c.user.uid)`);

// 1) Ana inicia sesión. Luego una versión anterior de la app escribe una lista en el formato
//    viejo (dentro de users/{uid}) → debe migrarse a lists/{uid}_111.
await ana.go('/', 6000);
const A = await signIn(ana, 'ana', 'Ana Ruiz');
check('Ana inicia sesión', !!A, A);
await sleep(5000);
await admin((db) => setDoc(doc(db, `users/${A}`), {
  lists: [{ id: 111, name: 'Lista vieja', himnos: ['3'], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }],
}, { merge: true }));
await sleep(3000);
await ana.go('/mylists', 5000);
check('Migración: "Lista vieja" aparece en Mis Listas', (await ana.text()).includes('Lista vieja'));
const anaUser = await read(`users/${A}`);
check('Migración: users/{uid} ya no guarda listas', anaUser && !('lists' in anaUser) && anaUser.listsMigrated === true);
check('Migración: lists/{uid}_111 existe', !!(await read(`lists/${A}_111`)));

// 2) Ana crea "Culto domingo" y le agrega el himno 1 desde el menú ⋮.
await ana.clickLabel('Crear'); await sleep(800);
await ana.type('Nombre de la lista', 'Culto domingo'); await sleep(300);
await ana.click('Crear'); await sleep(2000);
check('Ana crea "Culto domingo"', (await ana.text()).includes('Culto domingo'));
await ana.go('/explore', 4000);
await ana.clickLabel('Más opciones', 0); await sleep(800);
await ana.click('Agregar a lista'); await sleep(800);
await ana.click('Culto domingo'); await sleep(1500);
check('Himno 1 agregado desde ⋮', (await ana.text()).includes('Agregado a “Culto domingo”'));

// 3) Ana genera su enlace de invitación.
await ana.go('/about', 4000);
await ana.clickLabel('Invitar amigos'); await sleep(3000);
const code = (await read(`users/${A}`))?.inviteCode;
check('Ana tiene código de invitación', !!code, code);
check('Perfil: sincronización inicial termina', (await ana.text()).includes('Tus datos están sincronizados'));
await ana.clickLabel('Aumentar letra'); await sleep(3000);
check('Ajustes: A+ en Perfil llega a la nube', (await read(`users/${A}`))?.settings?.fontSize === 22, String((await read(`users/${A}`))?.settings?.fontSize));
await ana.shot('e2e_1_perfil_ana');

// 4) Beto abre el enlace sin cuenta, inicia sesión y acepta.
await beto.go(`/invitar/${code}`, 6000);
check('Invitación sin sesión pide iniciar sesión', (await beto.text()).includes('Te invitaron a Alaba+'));
const B = await signIn(beto, 'beto', 'Beto Pérez');
await sleep(5000);
check('Beto ve quién lo invitó', (await beto.text()).includes('Ana Ruiz te invitó'));
await beto.shot('e2e_2_invitacion');
await beto.click('Aceptar invitación'); await sleep(3000);
check('Beto acepta: "¡Ahora son amigos!"', (await beto.text()).includes('¡Ahora son amigos!'));
check('Amistad en ambos lados', !!(await read(`users/${A}/friends/${B}`)) && !!(await read(`users/${B}/friends/${A}`)));
await ana.go('/about', 4000);
check('Ana ve a Beto en Amigos', (await ana.text()).includes('Beto Pérez'));

// 5) Ana comparte "Culto domingo" con Beto como lector.
const listId = await admin(async (db) => {
  const { collection, getDocs, query, where } = await import('firebase/firestore');
  const snap = await getDocs(query(collection(db, 'lists'), where('name', '==', 'Culto domingo')));
  return snap.docs[0]?.id;
});
await ana.go(`/ListDetail?listId=${listId}&name=Culto%20domingo`, 4000);
await ana.clickLabel('Compartir lista'); await sleep(1500);
await ana.clickLabel('Beto Pérez: Lectura'); await sleep(300);
await ana.click('Guardar'); await sleep(2000);
check('Lista compartida con Beto como lector', (await read(`lists/${listId}`))?.members?.[B] === 'viewer');

await beto.go('/mylists', 5000);
const betoLists = await beto.text();
// Las etiquetas de sección se muestran en mayúsculas (textTransform): comparar sin distinguir.
check('Beto ve "Compartidas conmigo"', betoLists.toLowerCase().includes('compartidas conmigo') && betoLists.includes('De Ana Ruiz · Solo lectura'));
await beto.shot('e2e_3_compartidas_beto');
await beto.go(`/ListDetail?listId=${listId}&name=Culto%20domingo`, 4000);
check('Lector: sin botón de reordenar ni quitar', !(await beto.ev(`!!document.querySelector('[aria-label="Reordenar"]') || !!document.querySelector('[aria-label="Quitar de la lista"]')`)));
check('Lector: aviso de solo lectura', (await beto.text()).includes('solo lectura'));
await beto.shot('e2e_4_lector');

// 6) Ana lo cambia a editor; Beto agrega el himno 2 y Ana lo ve en vivo.
await ana.go(`/ListDetail?listId=${listId}&name=Culto%20domingo`, 4000);
await ana.clickLabel('Compartir lista'); await sleep(1500);
await ana.clickLabel('Beto Pérez: Edición'); await sleep(300);
await ana.click('Guardar'); await sleep(2000);
check('Beto ahora es editor', (await read(`lists/${listId}`))?.members?.[B] === 'editor');
await beto.go('/explore', 4000);
await beto.clickLabel('Más opciones', 1); await sleep(800);
await beto.click('Agregar a lista'); await sleep(1000);
check('Editor ve la lista de Ana para agregar', (await beto.text()).includes('Lista de Ana Ruiz'));
await beto.click('Culto domingo'); await sleep(2500);
const anaLive = await ana.text();
check('Ana ve el himno agregado por Beto sin recargar', anaLive.includes('2 himnos'), anaLive.match(/\d+ himnos?/)?.[0]);
await ana.shot('e2e_5_en_vivo_ana');

// 7) Beto sale de la lista.
await beto.go('/mylists', 4000);
await beto.clickLabel('Salir de la lista'); await sleep(800);
await beto.click('Salir de la lista'); await sleep(2500);
const afterLeave = await read(`lists/${listId}`);
check('Beto salió de la lista', afterLeave && !afterLeave.memberIds.includes(B) && !afterLeave.members[B]);
check('Beto ya no la ve', !(await beto.text()).includes('Culto domingo'));

// 8) Beto comparte una lista suya con Ana; luego Ana elimina su cuenta.
await beto.go('/mylists', 4000);
await beto.clickLabel('Crear'); await sleep(800);
await beto.type('Nombre de la lista', 'Ensayo'); await sleep(300);
await beto.click('Crear'); await sleep(2000);
const ensayoId = await admin(async (db) => {
  const { collection, getDocs, query, where } = await import('firebase/firestore');
  return (await getDocs(query(collection(db, 'lists'), where('name', '==', 'Ensayo')))).docs[0]?.id;
});
await beto.go(`/ListDetail?listId=${ensayoId}&name=Ensayo`, 4000);
await beto.clickLabel('Compartir lista'); await sleep(1500);
await beto.clickLabel('Ana Ruiz: Lectura'); await sleep(300);
await beto.click('Guardar'); await sleep(2000);
check('Beto comparte "Ensayo" con Ana', (await read(`lists/${ensayoId}`))?.members?.[A] === 'viewer');

await ana.go('/about', 5000);
await ana.click('Eliminar mi cuenta'); await sleep(800);
await ana.shot('e2e_6_eliminar');
await ana.click('Eliminar cuenta'); await sleep(6000);
check('Eliminar cuenta: users/{uid} borrado', (await read(`users/${A}`)) === null);
check('Eliminar cuenta: sus listas borradas', (await read(`lists/${listId}`)) === null && (await read(`lists/${A}_111`)) === null);
const ensayo = await read(`lists/${ensayoId}`);
check('Eliminar cuenta: salió de la lista de Beto', ensayo && !ensayo.memberIds.includes(A) && !ensayo.members[A]);
check('Eliminar cuenta: amistad borrada en ambos lados', (await read(`users/${B}/friends/${A}`)) === null);
check('Eliminar cuenta: invitación borrada', (await read(`invites/${code}`)) === null);
check('Eliminar cuenta: vuelve a la bienvenida', (await ana.text()).includes('Continuar con Google'));
const authUsers = await (await fetch('http://127.0.0.1:9099/emulator/v1/projects/demo-alabamas/accounts', { headers: {} }).catch(() => null))?.json().catch(() => null);
if (authUsers?.userInfo) check('Eliminar cuenta: usuario de Auth borrado', !authUsers.userInfo.some((u) => u.localId === A));

console.log('Errores de consola Ana:', ana.errors.length ? ana.errors : 'ninguno');
console.log('Errores de consola Beto:', beto.errors.length ? beto.errors : 'ninguno');
console.log(failures ? `\n${failures} verificaciones fallaron` : '\nTodas las verificaciones pasaron');
ana.close(); beto.close(); await env.cleanup();
process.exit(failures ? 1 : 0);
