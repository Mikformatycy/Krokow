import { describe, expect, it } from 'vitest';
import { createPlaceIndex, normalizeSearch } from '../src/place-index';

const entries = [
  { id: '7', name: 'Przychodnia Łąkowa', fields: ['Pawia 7', 'Kraków', 'lekarz'], priority: 0, value: '7' },
  { id: '77', name: 'Przychodnia Łąkowa — oddział', fields: ['Pawia 77', 'Kraków'], priority: 1, value: '77' },
  { id: '7a', name: 'Apteka', fields: ['Pawia 7a', 'Kraków'], priority: 1, value: '7a' },
  { id: 'gallery', name: 'Galeria Krakowska', fields: ['centrum handlowe', 'Pawia 5'], priority: 0, value: 'gallery' },
  { id: 'high5', name: 'High5ive', fields: ['Pawia 7'], priority: 0, value: 'high5' },
];
describe('local place search index', () => {
  it('normalizes composed/decomposed Polish text, punctuation, case and whitespace', () => {
    expect(normalizeSearch('  ŁĄKOWA,  Śródmieście  ')).toBe('lakowa srodmiescie');
    const index = createPlaceIndex(entries);
    expect(index.search('  przychodnia   LAKO ').items).toEqual(['7', '77']);
    expect(index.search('Pawia ulica 7 Krakow').items).toEqual(['7']);
    expect(index.search('S\u0301ro\u0301dmies\u0301cie')).toEqual(index.search('Śródmieście'));
  });
  it('matches all query tokens in any order, including aliases, without numeric false matches', () => {
    const index = createPlaceIndex(entries);
    expect(index.search('7 pawia').items.sort()).toEqual(['7', 'high5']);
    expect(index.search('Pawia 7a').items).toEqual(['7a']);
    expect(index.search('centrum handl').items).toEqual(['gallery']);
    expect(index.search('High5').items).toEqual(['high5']);
    expect(index.search('paw 78').items).toEqual([]);
  });
  it('permits one bounded typo/transposition only after exact/prefix matching found nothing', () => {
    const index = createPlaceIndex(entries);
    expect(index.search('glaeria krakowska').items).toEqual(['gallery']);
    expect(index.search('glria krkowsk').items).toEqual([]);
    expect(index.search('???').items).toEqual([]);
    expect(index.search('abc').items).toEqual([]);
  });
  it('ranks exact names before prefix matches, returns at most 10 and is independent of input order', () => {
    const many = Array.from({ length: 50 }, (_, i) => ({ id: `id-${i}`, name: `Apteka oddział ${i}`, fields: [], priority: 1, value: `id-${i}` }));
    const all = [...many, ...entries];
    const result = createPlaceIndex(all).search('apteka');
    expect(result.total).toBe(51); expect(result.items).toHaveLength(10); expect(result.items[0]).toBe('7a');
    expect(createPlaceIndex([...all].reverse()).search('apteka')).toEqual(result);
  });

  it.each([
    ['jeden', '1'], ['pięć', '5'], ['dziesięć', '10'], ['jedenaście', '11'], ['piętnaście', '15'],
    ['dziewiętnaście', '19'], ['dwadzieścia', '20'], ['dwadzieścia trzy', '23'],
    ['sześćdziesiąt osiem', '68'], ['sto', '100'], ['sto jeden', '101'], ['sto jedenaście', '111'],
    ['dwieście dwanaście', '212'], ['trzysta czterdzieści pięć', '345'], ['czterysta', '400'],
    ['pięćset sześć', '506'], ['sześćset siedemdziesiąt', '670'], ['siedemset', '700'],
    ['osiemset osiemdziesiąt osiem', '888'], ['dziewięćset dziewięćdziesiąt dziewięć', '999'],
  ])('finds an exact address for the spoken suffix %s', (spoken, digits) => {
    const index = createPlaceIndex([
      { id: 'target', name: 'Wejście', fields: [`Pawia ${digits}`], priority: 0, value: 'target' },
      { id: 'longer', name: 'Inny numer', fields: [`Pawia ${digits}0`], priority: 0, value: 'longer' },
      { id: 'letter', name: 'Z literą', fields: [`Pawia ${digits}a`], priority: 0, value: 'letter' },
    ]);
    expect(index.search(`ul. PAWIA ${spoken}.`)).toEqual({ items: ['target'], total: 1 });
  });

  it('supports a building letter and keeps spelling correction bounded to the street', () => {
    const index = createPlaceIndex(entries);
    expect(index.search('Pawia siedem A').items).toEqual(['7a']);
    expect(index.search('Pwaia siedem a').items).toEqual(['7a']);
    expect(index.search('Pawia siedem').items.sort()).toEqual(['7', 'high5']);
    expect(index.search('  PAWIA PIĘĆ! ').items).toEqual(['gallery']);
  });

  it('preserves literal names and deduplicates both variants before counting and limiting', () => {
    const dual = Array.from({ length: 12 }, (_, i) => ({ id: `both-${i}`, name: `Pawia pięć lokal ${i}`,
      fields: ['Pawia 5'], priority: 1, value: `both-${i}` }));
    const all = [...dual, ...entries];
    const result = createPlaceIndex(all).search('Pawia pięć');
    expect(result.total).toBe(13);
    expect(result.items).toHaveLength(10);
    expect(new Set(result.items).size).toBe(10);
    expect(result.items.every(item => item.startsWith('both-'))).toBe(true);
    expect(createPlaceIndex([...all].reverse()).search('Pawia pięć')).toEqual(result);
    const combined = createPlaceIndex([dual[0]!, ...entries]).search('Pawia pięć');
    expect(combined).toEqual({ items: ['both-0', 'gallery'], total: 2 });
  });

  it('keeps numerals within place names and accepts a spoken house number after them', () => {
    const index = createPlaceIndex([
      { id: 'square', name: 'Plac Trzech Krzyży', fields: ['Plac Trzech Krzyży 5'], priority: 0, value: 'square' },
      { id: 'street', name: 'Aleja Trzeciego Maja', fields: [], priority: 0, value: 'street' },
      { id: 'literal', name: 'Klub Dwadzieścia Trzy', fields: [], priority: 0, value: 'literal' },
      { id: 'numeric', name: 'Klub 23', fields: [], priority: 0, value: 'numeric' },
    ]);
    expect(index.search('Plac Trzech Krzyży').items).toEqual(['square']);
    expect(index.search('Plac Trzech Krzyży pięć').items).toEqual(['square']);
    expect(index.search('Aleja Trzeciego Maja').items).toEqual(['street']);
    expect(index.search('Klub Dwadzieścia Trzy').items).toEqual(['literal', 'numeric']);
  });

  it.each(['Pawia pięć dwa', 'Pawia dwadzieścia sto', 'Pawia tysiąc pięć', 'Pawia 20 pięć',
    'Pawia pięć Kraków', 'Pawia pięć przez dwa', 'Pawia zero', 'pięć', 'ulica pięć'])(
    'does not guess an address from unsupported or incomplete input: %s', query => {
    expect(createPlaceIndex(entries).search(query).items).toEqual([]);
  });
});
