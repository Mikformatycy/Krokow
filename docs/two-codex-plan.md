# Kroków — aktualny podział dwóch Codexów

Ustalenie B na prośbę użytkownika, 2026-10-03, po konsolidacji repozytorium.
Zastępuje wcześniejszy plan pracy podczas uruchamiania telefonu.
To podział przyszłych zadań, nie raport ich wykonania.

## Miejsce pracy i odpowiedzialność

Obie rozmowy pracują w `C:/Users/rapma/Documents/GitHUb/Kroków`, na wspólnym
`main`. Nie tworzymy kopii/worktrees i nie wracamy do archiwum. B wybrał
ten sposób realizacji prośby o nowy podział w uporządkowanym projekcie.
Zastępuje wcześniejsze zalecenie osobnych worktrees w instrukcjach startowych;
wymaga ścisłego rozdzielenia zapisu oraz operacji Git.

| Rola | Kto | Własność | Pierwszy rezultat |
| --- | --- | --- | --- |
| A — aplikacja | Nowa, świeża rozmowa | `apps/mobile/**`, `docs/handoff-mobile.md` | M-04: symulacja w UI, tekst i wspólny odsłuch. |
| B — backend/integracja | Dotychczasowa rozmowa | `apps/api/**`, `packages/routing/**`, później `packages/ingestion/**`, `infra/**`, `docs/handoff-backend.md` | B-03: resolver dowodów z testami na istniejącym kontrakcie. |

B obsługuje Git, CI, root manifesty, lockfile, dokumentację ogólną i generowanie
wspólnych artefaktów. Kontrakty i semantyka rankingu nadal wymagają przeglądu
obu stron; własność integracji nie oznacza samodzielnego zatwierdzenia.

## Potwierdzona baza

- Na GitHubie jest pełna integracja. Commit przed tą iteracją: `a5f4352`;
  stan roboczy przy rozpoczęciu przeglądu był czysty.
- Istnieją formularz, mock/HTTP, porównanie, dowody, odsłuch i routing synthetic.
- M-04 ma już `plan`, `controller`, `session`, `text` i kolejkę mowy.
  **Nie jest podłączone do ekranu. Nie pisać rdzenia od nowa.**
- `speechText.ts` przy równym dystansie umieszcza odcinki przed zdarzeniami;
  wymaga korekty względem istniejącej kolejności kontraktu.
- B-03 oraz import/graf realnego obszaru nie są zaimplementowane.
  `HttpRouteApi` jawnie akceptuje tylko synthetic/preview_only.
- Wcześniejsza integracja: 369 wykonań testów, eksport web i CI (w tym
  PostGIS na runnerze) PASS; osobny runner symulacji/mowy 29 PASS.
  To wcześniejsze wyniki, nie wyniki nowych zmian.
- Użytkownik potwierdził otwarcie aplikacji na iPhonie. Odsłuch i czytniki
  pozostają bez potwierdzonego odbioru. Ngrok zatrzymany przy porządkowaniu;
  nie zakładać, że poprzedni publiczny QR działa.

## A — pierwsza iteracja M-04/M-03

1. Podłączyć istniejącą SimulationSession do wyniku i wybranego wariantu.
   Jawne „Symulacja”, tekst zdarzenia/postępu, start, pauza, wznowienie,
   powtórzenie, reset i zakończenie. Bez GPS i prowadzenia terenowego.
2. Jeden właściciel koordynatora mowy dla planu i symulacji. Zmiana formularza,
   wariantu/odpowiedzi, wyjście i tło zatrzymują starą sesję oraz mowę.
   Powrót nie wznawia automatycznie; czytnik blokuje własny TTS.
3. Ujednolicić opis i symulację z istniejącym kontraktem: sortowanie po
   dystansie, przy remisie start → zdarzenia → odcinek → koniec.
   Naprawić klienta, nie kontrakt w celu dopasowania do starego błędu.
4. Przetestować UI i regresję planowania/odsłuchu; wynik iPhone/VoiceOver
   zapisać osobno. Bez telefonu: „nieprzetestowane na urządzeniu”.

Odbiór: działające sterowanie w web, brak dwóch głosów, podwójnych zdarzeń
i starej sesji po zmianie trasy. Pełny M-03/M-04 nadal wymaga testu telefonu.
Nie wdrażać teraz pilot, mapy, kont ani GPS. Dokumenty m04-simulation.md
i m04-speech-session.md opisują kod już scalony; ich instrukcje kopiowania
z dawnego worktree są historyczne.

## B — pierwsza iteracja B-03

Czysty EvidenceResolver w packages/routing, z wstrzykiwanym zegarem i jawną
polityką; wyjście zgodne z aktualnymi DTO. Rozróżnienie unknown/known(false)/
conflicting; zakres obiektu, cechy, strony, kierunku i poziomu; deduplikacja
pochodzenia. Ponowny import nie odmładza obserwacji. Nowsza data/etykieta
źródła nie zamyka konfliktu; zastąpienie wymaga udokumentowanej weryfikacji
i audytu. Metadane wewnętrzne nie muszą zmieniać publicznego kontraktu.

Odbiór: testy braków, konfliktów, czasu, zakresu, kolejności i idempotencji;
regresja synthetic HTTP i twardych wymagań. Najpierw rozwój czystego modułu;
podłączenie do API w oknie integracji po testach A.

## Zasady wspólnego checkoutu

- A nie wykonuje operacji zapisujących Git (także add/commit/push/stash),
  pull/checkout/switch/reset/merge/rebase. B nie przełącza gałęzi ani nie
  aktualizuje całego checkoutu podczas pracy A.
- A nie zmienia backendu, kontraktów, examples, root manifestów i lockfile.
  B nie edytuje mobile podczas zadania A. Przed edycją sprawdzać Git status;
  nie poprawiać ani nie cofać cudzych zmian.
- A zapisuje zakres przed implementacją i wyniki w docs/handoff-mobile.md;
  B używa docs/handoff-backend.md. Czytać oba raporty na początku i końcu
  iteracji. Plik jest skrzynką przekazania, nie automatyczną wiadomością.
- W trakcie równoległej pracy docs/status.md aktualizuje tylko B swoim
  wpisem, linkując raport A. A nie edytuje centralnego statusu ani ogólnych
  instrukcji. Nie powstają równoczesne zapisy tego samego dokumentu.
- Wspólną zmianę/zależność opisać w handoffie; kontynuować niezależny zakres.
  Instalacje i lockfile obsługuje B. Nie planujemy nowych zależności.
- A ma porty testowe 8085/3002. B nie uruchamia test:mobile jednocześnie.
  Backend korzysta z testów in-memory/inject lub innego portu.
- B jest operatorem podglądu 8081/3001/8082 i tunelu. A nie zabija/restartuje
  tych procesów; swoje serwery testowe uruchamia runnerem.
- Po testach A oznacza handoff **GOTOWE DO INTEGRACJI** i przestaje edytować
  przekazany zakres. B przegląda diff, wykonuje wspólne kontrole, stage'uje
  wyłącznie jawnie wskazane pliki i publikuje według polecenia użytkownika.
  Bez git add . / git add -A podczas równoległej pracy.
- Następna iteracja zaczyna się po integracji, z nowym zakresem. Nie tworzyć
  dodatkowych subagentów do tych samych zadań. Dwie rozmowy nie mnożą limitu.

## Kontrole i dalsza kolejność

Node 24.21.0 / pnpm 10.34.6, rzeczywiste skrypty w manifestach.
A: lint, typecheck, test:contracts, runner test/simulation.config.ts,
test:mobile i build:web. B: lint, typecheck, test:contracts, test:routing,
test:api, check:generated. Pełne pnpm test B wykonuje w oknie integracji.
Jeśli kontrola trafia na cudzą niedokończoną zmianę, zapisać blokadę,
nie zmieniać obcego modułu ani nie deklarować zaliczenia.

Po M-04/B-03: B audytuje i importuje mały snapshot OSM (B-04), potem buduje
graf i katalog rzeczywistych punktów (B-05/B-06). A domyka iPhone/VoiceOver
i przygotowuje klienta pilot dopiero na uzgodnionych przykładach.
Sam import punktów nie daje rzeczywistych tras; synthetic nie staje się
prawdziwe przez zmianę etykiety. Film/prezentacja pozostają na później.
