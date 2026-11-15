# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Alabama+" — an offline Spanish hymnal (himnario) mobile app built with Expo SDK 58 / React Native 0.88 / React 19.3, using expo-router. UI text, comments and identifiers are mostly in Spanish; keep new user-facing strings in Spanish. Android package: `com.casper088.alabamas`.

## Commands

```bash
npm install                 # use npm (package-lock.json); add --legacy-peer-deps if peer conflicts appear
npm start                   # expo start (dev server)
npm run android | ios | web
npm run lint                # expo lint
npm test                    # jest --watchAll (jest-expo preset)
npx jest components/__tests__/ThemedText-test.tsx   # single test, no watch
npx tsc --noEmit            # type-check (strict mode)

npm run build:web           # PWA build: expo export --platform web + scripts/build-pwa.mjs (generates dist/sw.js)
npm run preview:web         # build and serve dist/ locally (SPA fallback)
# Every push to main deploys the PWA to GitHub Pages (.github/workflows/deploy-web.yml). WEB_BASE_URL ("" or "/alabamas") sets the
# web path prefix via app.config.js + scripts/build-pwa.mjs. In CI it comes from configure-pages: "/alabamas" on gaspardzul.github.io, "" with the custom domain alabamas.org.
# .npmrc sets legacy-peer-deps=true so `npm ci` works in CI and EAS.

npm run update              # publish OTA update: eas update --branch main
npm run build:apk           # EAS cloud build, "preview" profile → installable APK
npm run build:apk:local     # same build run locally
```

OTA updates use `runtimeVersion.policy: appVersion`, so bump `version` in `app.json` whenever a native dependency changes; otherwise `eas update` is enough for JS/data-only changes (e.g. adding hymns).

## Architecture

**Hymn data is static JSON bundled in the app** (no backend):
- `assets/himnos/lista.json` — `{ lista: [{ title, number, group: string[] }] }`, the index used for browsing/search and category grouping (`group` drives the categories on the home tab). Titles are stored UPPERCASE and shown via `toTitleCase` (`components/ListItem.tsx`); at least one entry has `group` as a plain string, so normalize with `toArray`.
- `assets/himnos/allHimnos.json` — object keyed by hymn number as a string → `{ title, number, lyrics: [{ verse, text, repeat? }] }`. `verse: 0` is the chorus (coro).
- Adding a hymn requires updating **both** files with the same `number`.
- `number` is an integer (35) or a string for variants (`"35-A"`, `"214-B"`, which are also the `allHimnos` keys). Never do arithmetic or `parseInt` on it: use `utils/hymnNumber.ts` (`compareHymnNumbers`, `hymnBase`, `sameHymn`, `formatHymnNumber`).

**Routing** (`app/`): expo-router file routes, but screens are navigated mostly with `useNavigation().navigate(...)`, with params typed in `ts/types.ts` (`RootStackParamList`).
- **Import `useNavigation`, `useRoute`, `useFocusEffect`, `ThemeProvider`/`DarkTheme`/`DefaultTheme` from `expo-router`, never from `@react-navigation/native`.** expo-router (SDK 55+) bundles its own copy of React Navigation, so the `@react-navigation/*` hooks throw "Couldn't find a navigation object". Only `import type` (`RouteProp`, `StackNavigationProp`) from `@react-navigation/*` is safe.
- `app/_layout.tsx` — root Stack: `(tabs)`, `HimnoDetail` (`{ number }`), `ListDetail` and `PresentationMode` (both `{ lista: { name, himnos } }`). New stack screens must be registered here.
- `app/(tabs)/` — Inicio, Alabanzas (`explore`, accepts a `category` param), Favoritos, Mis Listas, Acerca de. Tab screens are thin wrappers around the heavy components in `app/components/` (`ListComponent`, `ListFavorites`, `MyLists`, `LastViewedList`).
- `explore_backup.tsx`, `settings.tsx` (tab commented out) and `components/ListItem copy.tsx` are leftovers.

**Persistence** is AsyncStorage only, via hooks in `hooks/`:
- `useSettings` — single `userSettings` key holding `{ fontSize, order, userLists }`. **User-created lists live inside settings** (`userLists: Lista[]`), not in their own key; `Lista.himnos` is an array of hymn numbers as strings, resolved against `allHimnos.json` / `lista.json` at render time.
- `useStorage(key)` — favorites (used with key `'favoritos'`), sorted by the `order` setting.
- `useVisitedItems` (`useLastViews.ts`) — recently viewed hymns under `visitedItems`.
- These hooks each hold their own local state (no shared context), so screens re-read storage on focus (`useFocusEffect`) to stay in sync.

**Bible** (only feature that uses the network): `utils/bibleApi.ts` wraps the Free Use Bible API (`https://bible.helloao.org/api/{translation}/books.json` and `/{translation}/{BOOK}/{chapter}.json`; no key, USFM book ids like `PSA`, `MAT`). Reads go: downloaded translation → file cache (`Paths.cache/bible/...`, everything already read) → network. Bible data never goes in AsyncStorage (Android caps it around 6 MB). Full offline download lives in `utils/bibleOffline.ts`: it fetches `/{translation}/complete.json` (~1.4 MB gzip), splits it into one file per book under `Paths.document/bible-offline/{translation}/`, and writes a `.ready` marker last. Download progress is a small module-level store (`useOfflineStatus`), so it survives navigating away. `SPANISH_TRANSLATIONS` is a hand-picked list of free-licensed Spanish editions (RVR1960 is copyrighted and not in the API; default is `spa_r09`, RV1909). `hooks/useBibleState.ts` stores the chosen translation and last chapter read under its own `bibleState` key. UI: `app/(tabs)/bible.tsx` (books, chapter sheet, translation sheet) → `app/BibleReader.tsx` (stack screen, params `{ translationId, bookId, chapter, verse? }`; `verse` scrolls to and highlights it, and the "Versículo" button opens `components/VerseGrid.tsx`), which renders through `components/BibleChapterText.tsx`. That component turns the API's `chapter.content` (headings, `line_break`, `hebrew_subtitle`, verse items with `poem` indentation, `lineBreak` and `noteId` footnote markers) into paragraphs. When a translation has no paragraph breaks it shows one verse per line.

**Design system ("Sanctuary Warmth", warm editorial minimalism)**: ivory canvas, navy primary, terracotta accent, olive tags, white cards with 1px hairline borders, no gradients or heavy shadows.
- Tokens: `constants/Colors.ts` (light + dark palettes; get them with `useTheme()` from `hooks/useThemeColor.ts`) and `constants/Typography.ts` (`Fonts`, `Radius`, `Spacing`). Don't hardcode hex colors in screens.
- Fonts: Merriweather (serif: titles, lyrics) and Plus Jakarta Sans (UI), from `@expo-google-fonts/*`, loaded in `hooks/useFonts.ts` under the `Fonts.*` names. Pick weight via the family name, not `fontWeight`.
- Building blocks: `ScreenHeader` (eyebrow + serif title, handles safe area on tab screens), `SearchBar` (with sort sheet / create button), `ListItem` (card row with number box, tags, icon actions), `Sheet` (bottom sheet replacing modals), `Chip`, and `ThemedText` types `title | subtitle | Himno | label | caption | link`.

**Other pieces**: `utils/pdfGenerator.ts` builds HTML for one hymn or a whole list and shares it as PDF via `expo-print` + `expo-sharing`; `utils/functions.ts#normalizarTexto` strips accents for search. The splash screen waits on fonts. Import alias `@/*` maps to the repo root.

**Web / PWA** (`web.output: "single"`; `"static"` exported HTML with no script tags on SDK 58):
- `public/index.html` is the HTML template (manifest link, iOS meta tags, service worker registration on non-localhost). `public/manifest.webmanifest` and `public/icons/` are copied into `dist/`. `+html.tsx` is unused in single mode.
- `scripts/build-pwa.mjs` writes `dist/sw.js` after export. It precaches the app shell and JS bundles, which contain all hymns. Hashed `/_expo` and `/assets` files are cached on first use, so the ~20 MB of unused font weights are never precached. Bible API requests are not handled by the SW.
- **Never call `Alert.alert`**: it does nothing on react-native-web. Use `showDialog` from `utils/dialog.ts` (same signature): native `Alert` on iOS/Android, and `components/DialogHost.tsx` (mounted in `app/_layout.tsx`) on web.
- `expo-file-system` doesn't exist on web. Bible storage goes through `utils/bibleStorage.ts` (files) / `utils/bibleStorage.web.ts` (IndexedDB, with a sync localStorage `.ready` marker). Metro picks the right one by extension, and both must keep the same exports.

