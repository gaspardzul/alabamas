import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useThemeColor';
import { Fonts, Radius, Spacing } from '@/constants/Typography';

/**
 * Política de privacidad pública (https://alabamas.org/privacidad).
 * Es una ruta pública: app/_layout.tsx no muestra la bienvenida aquí, porque Google
 * (verificación de la marca OAuth) y cualquier visitante deben poder leerla sin entrar.
 * Si cambia qué datos se guardan, actualizar este texto y LAST_UPDATED.
 */
const LAST_UPDATED = '16 de noviembre de 2026';
const CONTACT_EMAIL = 'casper088@gmail.com';

const SECTIONS: { title: string; body: (string | { bullets: string[] })[] }[] = [
  {
    title: 'Quiénes somos',
    body: [
      'Alaba+ es una aplicación gratuita de himnario, listas para el culto y lectura de la Biblia, disponible en alabamas.org y como aplicación móvil. La desarrolla y mantiene el Hno. Gaspar Dzul.',
      'Esta política explica qué información usa la aplicación, para qué y cómo puedes eliminarla.',
    ],
  },
  {
    title: 'Si usas la app como invitado',
    body: [
      'No pedimos ningún dato personal. Tus favoritos, listas, tamaño de letra, orden de la lista y preferencias de la Biblia se guardan solamente en tu dispositivo o navegador. No se envían a ningún servidor nuestro y se borran si desinstalas la aplicación o borras los datos del navegador.',
    ],
  },
  {
    title: 'Si inicias sesión con Google',
    body: [
      'Cuando eliges “Continuar con Google”, Google nos comparte:',
      { bullets: ['Tu nombre y foto de perfil.', 'Tu dirección de correo electrónico.', 'Un identificador interno de tu cuenta.'] },
      'Además guardamos en tu cuenta la información que tú generas en la aplicación:',
      {
        bullets: [
          'Himnos marcados como favoritos.',
          'Listas de alabanzas que creas (nombre, himnos y fechas).',
          'Ajustes: tamaño de letra y orden de la lista.',
          'Traducción de la Biblia elegida y el último capítulo que leíste.',
        ],
      },
      'Usamos esta información únicamente para mostrarte tu cuenta y para que tus datos estén disponibles en todos tus dispositivos. No pedimos acceso a tus contactos, calendario, archivos ni ningún otro dato de tu cuenta de Google.',
    ],
  },
  {
    title: 'Dónde se guarda',
    body: [
      'Los datos de las cuentas se almacenan en Firebase (Authentication y Cloud Firestore), un servicio de Google, en servidores ubicados en Estados Unidos. Las reglas de seguridad de la base de datos solo permiten que cada usuario lea y modifique su propia información.',
      'Google procesa estos datos según su propia política de privacidad: policies.google.com/privacy.',
    ],
  },
  {
    title: 'Lo que no hacemos',
    body: [
      {
        bullets: [
          'No mostramos publicidad.',
          'No vendemos, alquilamos ni compartimos tu información con terceros con fines comerciales.',
          'No usamos herramientas de analítica ni de rastreo.',
        ],
      },
    ],
  },
  {
    title: 'Lectura de la Biblia',
    body: [
      'El texto bíblico se descarga de la Free Use Bible API (bible.helloao.org). Al consultar un capítulo o descargar una traducción, ese servicio recibe la petición desde tu dispositivo, incluida tu dirección IP, como ocurre con cualquier sitio web. No le enviamos tu nombre, correo ni ningún dato de tu cuenta.',
    ],
  },
  {
    title: 'Cómo eliminar tus datos',
    body: [
      {
        bullets: [
          'Al cerrar sesión (Perfil → Cerrar sesión), tus datos se borran de ese dispositivo; siguen guardados en tu cuenta para cuando vuelvas a entrar.',
          `Para eliminar por completo tu cuenta y todos tus datos de nuestros servidores, escríbenos a ${CONTACT_EMAIL} desde el correo de tu cuenta de Google. Los eliminaremos en un plazo máximo de 30 días y te confirmaremos por correo.`,
          'También puedes retirar el acceso de Alaba+ a tu cuenta en myaccount.google.com/permissions.',
        ],
      },
    ],
  },
  {
    title: 'Menores de edad',
    body: [
      'La aplicación puede usarse sin cuenta. Si un menor de 13 años desea iniciar sesión, debe hacerlo con el permiso y la supervisión de su madre, padre o tutor.',
    ],
  },
  {
    title: 'Cambios a esta política',
    body: [
      'Si cambiamos la información que usamos, actualizaremos esta página y la fecha de la última actualización.',
    ],
  },
  {
    title: 'Contacto',
    body: [`Para cualquier duda sobre tu privacidad escríbenos a ${CONTACT_EMAIL}.`],
  },
];

export default function PrivacyPolicy() {
  const theme = useTheme();

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <ThemedText type="label">Alaba+</ThemedText>
        <ThemedText style={styles.title}>Política de privacidad</ThemedText>
        <ThemedText type="caption">Última actualización: {LAST_UPDATED}</ThemedText>
      </View>

      {SECTIONS.map((section) => (
        <View key={section.title} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
          {section.body.map((block, i) =>
            typeof block === 'string' ? (
              <ThemedText key={i} style={[styles.paragraph, { color: theme.text }]}>
                {block}
              </ThemedText>
            ) : (
              <View key={i} style={styles.bullets}>
                {block.bullets.map((item) => (
                  <View key={item} style={styles.bulletRow}>
                    <View style={[styles.dot, { backgroundColor: theme.secondary }]} />
                    <ThemedText style={[styles.paragraph, styles.bulletText, { color: theme.text }]}>{item}</ThemedText>
                  </View>
                ))}
              </View>
            )
          )}
        </View>
      ))}

      <Text
        style={[styles.mail, { color: theme.secondary }]}
        onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=Privacidad%20Alaba%2B`)}
      >
        {CONTACT_EMAIL}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl * 2,
    gap: Spacing.md,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  hero: { gap: Spacing.xs, marginBottom: Spacing.sm },
  title: { fontFamily: Fonts.serifBold, fontSize: 28, lineHeight: 36 },
  card: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.gutter, gap: Spacing.sm + 2 },
  sectionTitle: { fontFamily: Fonts.serifBold, fontSize: 18, lineHeight: 26 },
  paragraph: { fontFamily: Fonts.serifLight, fontSize: 16, lineHeight: 26 },
  bullets: { gap: Spacing.sm },
  bulletRow: { flexDirection: 'row', gap: Spacing.sm + 2 },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 11 },
  bulletText: { flex: 1 },
  mail: { fontFamily: Fonts.sansSemiBold, fontSize: 15, textAlign: 'center', marginTop: Spacing.sm },
});
