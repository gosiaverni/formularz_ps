-- Uruchom w Supabase SQL Editor tylko po sprawdzeniu obecnego schematu.
-- Mapa korzysta już z: id, title, lat, lon, institution, end_date,
-- cover_image, category, link. Dodajemy pola używane przez formularz,
-- jeśli jeszcze ich nie ma.

alter table public.events
  add column if not exists start_date date,
  add column if not exists location text;

-- Sprawdź polityki RLS przed udostępnieniem formularza publicznie.
-- Nie wyłączaj RLS i nigdy nie umieszczaj service_role key w przeglądarce.
-- Jeżeli formularz ma być publiczny, rozważ zapis przez Edge Function
-- lub bezpieczny proces moderacji zamiast otwartej polityki INSERT.
