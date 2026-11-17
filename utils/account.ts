/** En iOS/Android aún no hay cuentas (solo invitado). Misma interfaz que account.web.ts. */
export const accountDeletionAvailable = false;

export async function deleteAccount(): Promise<void> {
  throw new Error('Las cuentas aún no están disponibles en la app del teléfono.');
}
