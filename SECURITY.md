# Polityka Bezpieczeństwa (Security Policy)

## Przechowywanie danych w Rift Daily

Rift Daily komunikuje się **bezpośrednio** z oficjalnym USOS API Twojej uczelni za pomocą protokołu OAuth 1.0a.
- Tokeny dostępu OAuth oraz PIN blokady aplikacji są przechowywane lokalnie w zaszyfrowanym magazynie urządzenia (`expo-secure-store`: Keychain na iOS / Keystore na Androidzie).
- Aplikacja nie wysyła haseł ani ocen na żadne zewnętrzne serwery pośredniczące.

## Zgłaszanie podatności

Jeśli znalazłeś lukę bezpieczeństwa, problem z obsługą OAuth, wyciek danych lub błąd w szyfrowaniu lokalnym:
1. **Nie** otwieraj publicznego zgłoszenia (Issue) z opisem exploita.
2. Napisz bezpośrednio do autora projektu przez GitHub (`@matiqueue`) lub skorzystaj z prywatnego zgłoszenia w zakładce **Security -> Advisories** na GitHubie.
3. Postaramy się odpowiedzieć i załatać problem tak szybko, jak to możliwe.
