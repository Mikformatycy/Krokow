import { useEffect, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import type { PlacesResponse } from '@krok/contracts';
import { Keyboard, Text, TextInput } from 'react-native';
import type { View } from 'react-native';
import type { RouteApi } from '../../adapters/api/MockRouteApi';
import { focusControl } from '../../adapters/accessibility/focusControl';
import { ScreenHeading } from '../../adapters/accessibility/ScreenHeading';
import { ActionButton } from '../../components/ActionButton';
import { LiveMessage } from '../../components/LiveMessage';
import { SectionHeading } from '../../components/SectionHeading';
import { colors } from '../../components/theme';
import { placeCountText } from './routeText';
import { searchCatalog } from './searchCatalog';
import type { PlaceChoice } from './searchCatalog';
import { formStyles as styles } from './styles';

/** Results are requested and announced once typing or dictation pauses, not after every character. */
const QUERY_SETTLE_MS = 350;
const SHORT_LIST = 5;
type CatalogStatus = 'loading' | 'ready' | 'short' | 'error';
type Place = PlacesResponse['places'][number];

export function PlaceStep({ step, question, fieldLabel, api, cityId, mode, selectedId, excludeId, error, inputRef, onSelect, onPlaces, before, after }: {
  step: string; question: string; fieldLabel: string; api: RouteApi; cityId: string; mode: PlacesResponse['mode'];
  selectedId: string; excludeId: string; error: string | undefined; inputRef: RefObject<TextInput | null>;
  onSelect: (place: Place) => void; onPlaces: (places: readonly Place[]) => void; before?: ReactNode; after?: ReactNode;
}) {
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<PlaceChoice[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [attribution, setAttribution] = useState('');
  const [unavailable, setUnavailable] = useState('');
  const [status, setStatus] = useState<CatalogStatus>('loading');
  const [resultQuery, setResultQuery] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [focused, setFocused] = useState(false);
  const immediate = useRef(false);
  const focusAfterResults = useRef(false);
  const firstResult = useRef<View>(null);
  // Dictation often appends punctuation or repeats its final text.
  const search = query.trim().replace(/[.,!?;:]+$/u, '').trim();
  useEffect(() => {
    let active = true;
    const delay = search && !immediate.current ? QUERY_SETTLE_MS : 0;
    immediate.current = false;
    // Only a scheduled search may enter loading; unchanged native text events must not lock results.
    setStatus('loading');
    // Earlier results stay rendered until the next answer, so the result that has focus is not unmounted.
    const timer = setTimeout(() => {
      if (search.length === 1) { setPlaces([]); setStatus('short'); return; }
      void searchCatalog(api, cityId, mode, search).then((response) => {
        if (!active) return;
        setPlaces(response.choices); setTotal(response.total); setHasMore(response.hasMore); setAttribution(response.attribution);
        setResultQuery(search); setStatus('ready'); setExpanded(false);
        onPlaces(response.choices.flatMap(choice => choice.place ? [choice.place] : []));
      }).catch(() => { if (active) { setPlaces([]); setStatus('error'); } });
    }, delay);
    return () => { active = false; clearTimeout(timer); };
  }, [api, cityId, mode, search, attempt, onPlaces]);
  useEffect(() => {
    if (!focusAfterResults.current || status === 'loading') return;
    focusAfterResults.current = false;
    if (status === 'ready') focusControl(firstResult);
  }, [status, places]);
  // The single exit path from the field: native blur of this input, then RN's dismissal of whatever input it tracks.
  function dismissInput() {
    inputRef.current?.blur();
    Keyboard.dismiss();
  }
  function requestSearch(nextQuery = query) {
    dismissInput();
    immediate.current = true;
    focusAfterResults.current = true;
    setUnavailable('');
    setStatus('loading');
    setQuery(nextQuery);
    // Explicit actions also request again when the query is unchanged after an error.
    setAttempt((count) => count + 1);
  }

  const choices = places.filter((choice) => choice.place?.id !== excludeId);
  const visible = expanded ? choices : choices.slice(0, SHORT_LIST);
  return <>
    <Text style={styles.caption}>{step}</Text>
    <ScreenHeading>{question}</ScreenHeading>
    {before}
    {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    <TextInput ref={inputRef} accessibilityLabel={fieldLabel} placeholder="Wpisz nazwę miejsca" placeholderTextColor={colors.muted}
      accessibilityHint={error ?? 'Klawisz Szukaj albo gest Z chowa klawiaturę.'}
      value={query} onChangeText={(value) => { focusAfterResults.current = false; setUnavailable(''); setQuery(value); }} maxLength={100} autoCorrect={false} returnKeyType="search" enterKeyHint="search"
      submitBehavior="blurAndSubmit" onSubmitEditing={() => requestSearch()}
      // VoiceOver's "Z" gesture on the field closes the keyboard (confirmed by the user on iPhone).
      onAccessibilityEscape={dismissInput}
      onFocus={() => { focusAfterResults.current = false; setFocused(true); }} onBlur={() => setFocused(false)}
      onKeyPress={(event) => { if (event.nativeEvent.key === 'Escape') dismissInput(); }}
      style={[styles.input, focused && styles.inputFocused]} />
    <SectionHeading>{resultQuery ? 'Wyniki' : 'Propozycje'}</SectionHeading>
    {status === 'loading' && places.length === 0 && <Text style={styles.body}>Wczytywanie miejsc…</Text>}
    {status === 'short' && <LiveMessage text="Wpisz co najmniej 2 znaki." style={styles.body} />}
    {status === 'ready' && resultQuery !== '' && <LiveMessage text={total ? `${placeCountText(total)} dla „${resultQuery}”.${hasMore ? ' Pokazano pierwsze 10. Doprecyzuj nazwę lub adres.' : ''}` : 'Brak pasujących miejsc.'} style={styles.body} />}
    {mode === 'pilot' && <Text style={styles.caption}>Szukasz w całym Krakowie. Trasy obejmują wybrane punkty w centrum.</Text>}
    {unavailable !== '' && <LiveMessage alert text={unavailable} style={styles.error} />}
    {mode === 'pilot' && resultQuery !== '' && status !== 'loading' && <ActionButton label="Pokaż punkty z trasami" onPress={() => requestSearch('')} />}
    {status === 'ready' && resultQuery === '' && choices.length === 0 && <Text style={styles.body}>Katalog nie zawiera innych miejsc.</Text>}
    {status === 'error' && <>
      <LiveMessage alert text="Nie można wczytać miejsc." style={styles.error} />
      <ActionButton label="Ponów wczytywanie" onPress={() => requestSearch()} />
    </>}
    {visible.map((place, index) => {
      // Display only: the qualifier ("punkt na ciągu pieszym") moves to a second line; readers get the full name.
      const [title = place.name, ...rest] = place.name.split(' — ');
      const detail = [rest.join(' — '), place.detail].filter(Boolean).join('. ');
      return <ActionButton key={place.id} variant="row" label={title} {...(detail ? { detail } : {})}
        {...(index === 0 ? { buttonRef: firstResult } : {})}
        accessibilityLabel={place.detail ? `${place.name}. ${place.detail}` : place.name} disabled={status !== 'ready' || resultQuery !== search}
        selected={place.place?.id === selectedId} onPress={() => {
          dismissInput();
          if (place.place) onSelect(place.place);
          else setUnavailable(`${place.name}: ${place.detail} Wybierz inny punkt albo pokaż punkty z trasami.`);
        }} />;
    })}
    {choices.length > SHORT_LIST && <ActionButton label={expanded ? 'Mniej propozycji' : `Więcej propozycji (${choices.length - SHORT_LIST})`}
      expanded={expanded} onPress={() => setExpanded(!expanded)} />}
    {attribution !== '' && <Text style={styles.caption}>{attribution}</Text>}
    {after}
  </>;
}
