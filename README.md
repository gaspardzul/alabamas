# Welcome to your Expo app 👋

Este es un proyecto [Expo](https://expo.dev) creado con [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Empezar

1. Instalar dependencias

   ```bash
   npm install
   ```

2. Iniciar la aplicación

   ```bash
    npx expo start
   ```

En la salida, encontrarás opciones para abrir la aplicación en un

- [build de desarrollo](https://docs.expo.dev/develop/development-builds/introduction/)
- [emulador de Android](https://docs.expo.dev/workflow/android-studio-emulator/)
- [simulador de iOS](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), un sandbox limitado para probar el desarrollo de aplicaciones con Expo

Puedes comenzar a desarrollar editando los archivos dentro del directorio **app**. Este proyecto utiliza [enrutamiento basado en archivos](https://docs.expo.dev/router/introduction).

## Actualización y publicación

Para actualizar y publicar tu aplicación, sigue estos pasos:

1. Instala EAS CLI globalmente (si aún no lo has hecho):

   ```bash
   npm install -g eas-cli
   ```

2. Configura tu proyecto para usar EAS Update (si es la primera vez):

   ```bash
   npx eas update:configure
   ```

3. Para publicar una actualización, usa:

   ```bash
   npx eas update
   ```

### Subir una actualización de la app

Cuando hayas realizado cambios en tu aplicación y quieras subir una actualización, sigue estos pasos:

1. Asegúrate de haber hecho commit de todos tus cambios en git.

2. Incrementa la versión de tu aplicación en el archivo `app.json`:

   ```json
   {
     "expo": {
       "version": "1.0.1",
       "android": {
         "versionCode": 2
       },
       "ios": {
         "buildNumber": "2"
       }
     }
   }
   ```

3. Crea una nueva compilación de producción:

   ```bash
   eas build --platform all
   ```

   Esto creará nuevas compilaciones para iOS y Android.

4. Una vez que las compilaciones estén listas, publica la actualización:

   ```bash
   eas submit --platform all
   ```

   Esto enviará las nuevas compilaciones a la App Store y Google Play Store.

5. Después de que la actualización haya sido aprobada y publicada en las tiendas, puedes enviar una actualización OTA (Over The Air) para los usuarios existentes:

   ```bash
   eas update --branch production --message "Descripción de la actualización"
   ```

Nota: `expo publish` será descontinuado el 12 de febrero de 2024. Se recomienda migrar a `eas update` como se muestra arriba.

## Comandos útiles

- Para ejecutar cualquier comando de Expo, usa `npx` seguido de `expo`. Por ejemplo:

  ```bash
  npx expo start
  ```

## Obtener un proyecto nuevo

Cuando estés listo, ejecuta:

```bash
npm run reset-project
```

Este comando moverá el código de inicio al directorio **app-example** y creará un directorio **app** en blanco donde puedes comenzar a desarrollar.

## Aprende más

Para aprender más sobre el desarrollo de tu proyecto con Expo, consulta los siguientes recursos:

- [Documentación de Expo](https://docs.expo.dev/): Aprende los fundamentos o profundiza en temas avanzados con nuestras [guías](https://docs.expo.dev/guides).
- [Tutorial Aprende Expo](https://docs.expo.dev/tutorial/introduction/): Sigue un tutorial paso a paso donde crearás un proyecto que se ejecuta en Android, iOS y web.

## Únete a la comunidad

Únete a nuestra comunidad de desarrolladores que crean aplicaciones universales.

- [Expo en GitHub](https://github.com/expo/expo): Ve nuestra plataforma de código abierto y contribuye.
- [Comunidad de Discord](https://chat.expo.dev): Chatea con usuarios de Expo y haz preguntas.
