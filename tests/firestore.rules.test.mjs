// Pruebas de firestore.rules contra el emulador.
// Ejecutar: npm run test:rules  (levanta el emulador de Firestore; requiere Java)
import { after, before, beforeEach, describe, test } from 'node:test';
import { readFileSync } from 'node:fs';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, deleteDoc, deleteField, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';

let env;
const as = (uid) => env.authenticatedContext(uid).firestore();
const anon = () => env.unauthenticatedContext().firestore();

// Lista compartida de A: B lector, C editor. D no es miembro.
const sharedList = {
  ownerId: 'A',
  name: 'Culto domingo',
  himnos: ['1', '35-A'],
  members: { A: 'owner', B: 'viewer', C: 'editor' },
  memberIds: ['A', 'B', 'C'],
  memberInfo: { A: { name: 'Ana' }, B: { name: 'Beto' }, C: { name: 'Caro' } },
  createdAt: '2026-11-16T00:00:00.000Z',
  updatedAt: '2026-11-16T00:00:00.000Z',
};

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-alabamas',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});

after(async () => env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'invites/codeA'), { uid: 'A', name: 'Ana' });
    await setDoc(doc(db, 'invites/codeC'), { uid: 'C', name: 'Caro' });
    await setDoc(doc(db, 'lists/L1'), sharedList);
    await setDoc(doc(db, 'users/A/friends/B'), { name: 'Beto', via: 'codeA' });
  });
});

describe('users/{uid}', () => {
  test('cada quien lee y escribe su documento', async () => {
    await assertSucceeds(setDoc(doc(as('A'), 'users/A'), { favorites: [], inviteCode: 'codeA' }));
    await assertSucceeds(getDoc(doc(as('A'), 'users/A')));
  });
  test('nadie más puede leerlo ni escribirlo', async () => {
    await assertFails(getDoc(doc(as('B'), 'users/A')));
    await assertFails(setDoc(doc(as('B'), 'users/A'), { favorites: [] }));
    await assertFails(getDoc(doc(anon(), 'users/A')));
  });
  test('no acepta campos desconocidos', async () => {
    await assertFails(setDoc(doc(as('A'), 'users/A'), { isAdmin: true }));
  });
  test('puede borrar el campo heredado lists (migración)', async () => {
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'users/A'), { lists: [{ id: 1 }] }));
    await assertSucceeds(updateDoc(doc(as('A'), 'users/A'), { lists: deleteField(), listsMigrated: true }));
  });
});

describe('invites/{code}', () => {
  test('se lee conociendo el código, con sesión', async () => {
    await assertSucceeds(getDoc(doc(as('B'), 'invites/codeA')));
    await assertFails(getDoc(doc(anon(), 'invites/codeA')));
  });
  test('no se pueden listar ni crear a nombre de otro', async () => {
    await assertFails(getDocs(collection(as('B'), 'invites')));
    await assertFails(setDoc(doc(as('B'), 'invites/fake'), { uid: 'A' }));
    await assertSucceeds(setDoc(doc(as('B'), 'invites/codeB'), { uid: 'B' }));
  });
  test('solo el dueño la borra (cambiar enlace)', async () => {
    await assertFails(deleteDoc(doc(as('B'), 'invites/codeA')));
    await assertSucceeds(deleteDoc(doc(as('A'), 'invites/codeA')));
  });
});

describe('amigos', () => {
  test('el invitado se agrega a los amigos de quien lo invitó con su código', async () => {
    await assertSucceeds(setDoc(doc(as('D'), 'users/A/friends/D'), { name: 'Dani', via: 'codeA' }));
  });
  test('no puede hacerlo con un código falso o de otra persona', async () => {
    await assertFails(setDoc(doc(as('D'), 'users/A/friends/D'), { name: 'Dani', via: 'nope' }));
    await assertFails(setDoc(doc(as('D'), 'users/A/friends/D'), { name: 'Dani', via: 'codeC' }));
    await assertFails(setDoc(doc(as('D'), 'users/A/friends/D'), { name: 'Dani' }));
  });
  test('no puede escribir la ficha de otro en listas ajenas', async () => {
    await assertFails(setDoc(doc(as('D'), 'users/A/friends/E'), { name: 'Eve', via: 'codeA' }));
  });
  test('cada quien maneja su propia lista de amigos', async () => {
    await assertSucceeds(setDoc(doc(as('B'), 'users/B/friends/A'), { name: 'Ana', via: 'codeA' }));
    await assertSucceeds(getDocs(collection(as('A'), 'users/A/friends')));
    await assertFails(getDocs(collection(as('C'), 'users/A/friends')));
  });
  test('cualquiera de los dos termina la amistad; un tercero no', async () => {
    await assertFails(deleteDoc(doc(as('C'), 'users/A/friends/B')));
    await assertSucceeds(deleteDoc(doc(as('B'), 'users/A/friends/B')));
  });
  test('solo se actualiza la propia ficha (nombre/foto)', async () => {
    await assertSucceeds(updateDoc(doc(as('B'), 'users/A/friends/B'), { name: 'Beto R.' }));
    await assertFails(updateDoc(doc(as('B'), 'users/A/friends/B'), { via: 'codeC' }));
  });
});

describe('lists/{id}', () => {
  test('crear una lista propia', async () => {
    await assertSucceeds(
      setDoc(doc(as('D'), 'lists/L2'), { ...sharedList, ownerId: 'D', members: { D: 'owner' }, memberIds: ['D'] })
    );
    await assertFails(
      setDoc(doc(as('D'), 'lists/L3'), { ...sharedList, ownerId: 'A', members: { A: 'owner' }, memberIds: ['A'] })
    );
  });
  test('los miembros la leen; los demás no', async () => {
    for (const uid of ['A', 'B', 'C']) await assertSucceeds(getDoc(doc(as(uid), 'lists/L1')));
    await assertFails(getDoc(doc(as('D'), 'lists/L1')));
  });
  test('consulta de "mis listas" por memberIds', async () => {
    const { query, where } = await import('firebase/firestore');
    await assertSucceeds(getDocs(query(collection(as('B'), 'lists'), where('memberIds', 'array-contains', 'B'))));
    await assertFails(getDocs(collection(as('B'), 'lists')));
  });
  test('lector: no puede modificar nada', async () => {
    await assertFails(updateDoc(doc(as('B'), 'lists/L1'), { himnos: ['1'] }));
    await assertFails(updateDoc(doc(as('B'), 'lists/L1'), { name: 'Hackeada' }));
  });
  test('editor: agrega, quita y reordena himnos', async () => {
    await assertSucceeds(updateDoc(doc(as('C'), 'lists/L1'), { himnos: ['35-A', '1', '2'], updatedAt: 'x' }));
  });
  test('editor: no renombra, no comparte, no se vuelve dueño', async () => {
    await assertFails(updateDoc(doc(as('C'), 'lists/L1'), { name: 'Otra' }));
    await assertFails(updateDoc(doc(as('C'), 'lists/L1'), { 'members.D': 'editor', memberIds: ['A', 'B', 'C', 'D'] }));
    await assertFails(updateDoc(doc(as('C'), 'lists/L1'), { ownerId: 'C' }));
  });
  test('dueño: renombra y comparte, pero no cede la propiedad', async () => {
    await assertSucceeds(updateDoc(doc(as('A'), 'lists/L1'), { name: 'Culto vespertino' }));
    await assertSucceeds(
      updateDoc(doc(as('A'), 'lists/L1'), { 'members.D': 'viewer', memberIds: ['A', 'B', 'C', 'D'] })
    );
    await assertFails(updateDoc(doc(as('A'), 'lists/L1'), { ownerId: 'B' }));
    await assertFails(updateDoc(doc(as('A'), 'lists/L1'), { 'members.A': 'viewer' }));
  });
  test('un miembro puede salirse, pero no sacar a otros', async () => {
    const { deleteField: del } = await import('firebase/firestore');
    await assertSucceeds(
      updateDoc(doc(as('B'), 'lists/L1'), { 'members.B': del(), 'memberInfo.B': del(), memberIds: ['A', 'C'] })
    );
    await assertFails(
      updateDoc(doc(as('C'), 'lists/L1'), { 'members.A': del(), memberIds: ['B', 'C'] })
    );
  });
  test('solo el dueño la borra', async () => {
    await assertFails(deleteDoc(doc(as('C'), 'lists/L1')));
    await assertSucceeds(deleteDoc(doc(as('A'), 'lists/L1')));
  });
});
