## Opis zmian

Krótko opisz co zostało zmienione i dlaczego.

- Powiązane zgłoszenie (Development): `Closes #...` (lub `Refs #...`)
- Gałąź docelowa: `dev` (dla zmian developerskich) lub `main` (wyłącznie wydanie produkcyjne z podbitą wersją)

## Typ zmiany (Issue / PR Type)

- [ ] Poprawka błędu (`Bug`)
- [ ] Nowa funkcja (`Feature`)
- [ ] Zadanie techniczne / uczelnie / konfiguracja (`Task`)

## Pola projektu (Rift Daily Roadmap)

- **Platform**: `iOS & Android` / `USOS API`
- **Area**: `Offline & Storage` / `Notifications` / `Widgets` / `UI/UX` / `Universities`
- **Priority**: `High` / `Medium` / `Low`

## Lista kontrolna

- [ ] Pull Request skierowany jest do gałęzi `dev` (a nie bezpośrednio do `main`)
- [ ] Przetestowano kompilację TypeScript (`./node_modules/.bin/tsc --noEmit`)
- [ ] Zweryfikowano build strony WWW w `website/` (`npm run build`), jeśli dotyczy
- [ ] Zmiany nie zawierają kluczy API ani danych wrażliwych (`.env.local`)
- [ ] Zaktualizowano `CHANGELOG.md` (jeśli dotyczy)

## Zrzuty ekranu (opcjonalnie)
