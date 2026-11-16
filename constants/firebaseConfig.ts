/**
 * Configuración del proyecto de Firebase (Project settings → Your apps → Web).
 * Estos valores NO son secretos: viajan en el código de cualquier app web con Firebase.
 * Lo que protege los datos son las reglas de Firestore (firestore.rules).
 */
export const firebaseConfig = {
  apiKey: 'AIzaSyCLlMgxUclJEwwN9tDLmIkwhOQ6H0Hj2iw',
  authDomain: 'alabamas-5638b.firebaseapp.com',
  projectId: 'alabamas-5638b',
  storageBucket: 'alabamas-5638b.firebasestorage.app',
  messagingSenderId: '1041773216328',
  appId: '1:1041773216328:web:be83847f8c632113dbce7d',
};

/** Mientras no se llene la configuración, la app funciona solo en modo invitado. */
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
