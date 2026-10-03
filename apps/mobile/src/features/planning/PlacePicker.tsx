import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import type { PlacesResponse } from '@krok/contracts';
import { Text, TextInput, View } from 'react-native';
import type { RouteApi } from '../../adapters/api/MockRouteApi';
import { ActionButton } from '../../components/ActionButton';
import { SectionHeading } from '../../components/SectionHeading';
import { formStyles } from './styles';

export function PlacePicker({ label, value, onChange, api, cityId, inputRef, error }: {
  label: string; value: string; onChange: (id: string) => void; api: RouteApi; cityId: string;
  inputRef: RefObject<TextInput | null>; error: string | undefined;
}) {
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<PlacesResponse['places']>([]);
  const [message, setMessage] = useState('Wczytywanie katalogu…');
  useEffect(() => { if (value) setQuery(''); }, [value]);
  useEffect(() => {
    let active = true;
    const search = query.trim();
    setPlaces([]);
    if (search.length === 1) { setMessage('Wpisz co najmniej 2 znaki lub wyczyść wyszukiwanie.'); return; }
    setMessage('Wczytywanie katalogu…');
    void api.places(cityId, search).then((response) => {
      if (!active) return;
      setPlaces(response.places);
      setMessage(response.places.length ? '' : 'Brak punktów pasujących do wyszukiwania.');
    }).catch(() => { if (active) setMessage('Nie można wczytać katalogu. Zmień wyszukiwanie, aby ponowić.'); });
    return () => { active = false; };
  }, [api, cityId, query]);
  return <View style={formStyles.section}>
    <SectionHeading>{label}</SectionHeading>
    <Text style={formStyles.body}>Wyszukaj nazwę lub wybierz punkt poniżej.</Text>
    <TextInput ref={inputRef} accessibilityLabel={`${label}: szukaj punktu`} accessibilityHint={error ?? 'Wybierz punkt z listy wyników.'}
      value={query} onChangeText={(text) => { setQuery(text); onChange(''); }} maxLength={100}
      style={formStyles.input} autoCorrect={false} />
    {error && <Text accessibilityRole="alert" style={formStyles.error}>{error}</Text>}
    {message !== '' && <Text accessibilityLiveRegion="polite" style={formStyles.body}>{message}</Text>}
    {places.map((place) => <ActionButton key={place.id} label={`${label}: ${place.name}`} selected={value === place.id} onPress={() => onChange(place.id)} />)}
    <Text style={formStyles.body}>{value ? 'Wybrany punkt oznaczono znakiem ✓.' : 'Nie wybrano punktu.'}</Text>
  </View>;
}
