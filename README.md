# Punkt Sztuki — formularz dodawania wydarzeń

## Pliki
- `formularz.html` — struktura formularza.
- `formularz.css` — styl oparty na przesłanym projekcie (bordowy panel, jasne zaokrąglone pola).
- `formularz.js` — autocomplete lokalizacji, walidacja i zapis do Supabase.
- `supabase-migration.sql` — minimalne dodanie pól `start_date` i `location`.

## Integracja z istniejącym projektem
1. Umieść pliki w projekcie i dostosuj ścieżki.
2. Załaduj **ten sam** skrypt inicjalizujący Supabase co mapa, przed `formularz.js`. Musi udostępniać `window.supabaseClient`.
3. Ustaw `window.GEOCODE_URL` na istniejący endpoint geokodowania, którego używa mapa. Endpoint ma przyjmować `?q=...` i zwracać tablicę wyników z polami `lat`, `lon` oraz `display_name` (format zgodny z Nominatim). Formularz celowo korzysta z tego samego endpointu, aby zachować spójność.
4. W `formularz.html` dopasuj wartości kategorii do wartości użytych w checkboxach mapy. Porównanie kategorii w kodzie mapy jest niewrażliwe na wielkość liter, ale wartości muszą znaczeniowo się zgadzać.
5. Uruchom SQL z `supabase-migration.sql` tylko jeśli kolumn `start_date` i `location` brakuje. Nie zmieniaj nazw kolumn, których mapa już używa.

## Ważne o schemacie
Z kodu mapy wynika, że tabela `public.events` ma co najmniej kolumny:
`id`, `title`, `lat`, `lon`, `institution`, `end_date`, `cover_image`, `category`, `link`.
Formularz zapisuje dokładnie te nazwy oraz dodatkowo `start_date` i `location`. Jeśli istniejące kolumny mają inne typy lub ograniczenia `NOT NULL`, dopasuj payload / migrację do faktycznego schematu.

## Autocomplete
Po wpisaniu minimum 3 znaków formularz z opóźnieniem 350 ms pyta `GEOCODE_URL`. Użytkownik musi kliknąć podpowiedź; dopiero wtedy `lat` i `lon` zostają zapisane. Zmiana tekstu po wybraniu podpowiedzi unieważnia wybór, żeby nie zapisać współrzędnych innego miejsca.

## Supabase i bezpieczeństwo
- Przeglądarka może używać tylko klucza `anon` / publishable.
- Nigdy nie umieszczaj `service_role` key w HTML/JS.
- Przy włączonym RLS insert musi być dozwolony dla zalogowanych użytkowników albo obsługiwany przez backend/Edge Function. Nie dodawaj publicznej polityki INSERT bez przemyślenia moderacji i spamu.

## Uwaga o geokoderze
Kod mapy pokazuje `window.GEOCODE_URL`, ale przesłany fragment nie zawiera implementacji tego endpointu. Jeśli endpoint zwraca obiekt zamiast tablicy, albo inne nazwy pól, dopasuj `searchPlaces()` w `formularz.js`.
