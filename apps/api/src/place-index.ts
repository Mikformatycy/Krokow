import { spokenAddressAlias } from './spoken-address';

/** Local autocomplete. Queries never leave this process or enter logs/caches. */
export function normalizeSearch(text: string): string {
  return text.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('pl-PL').replace(/ł/g, 'l')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
}
const stopWords = new Set(['ul', 'ulica', 'al', 'aleja', 'aleje', 'os', 'osiedle']);
function tokens(text: string): string[] { return [...new Set(normalizeSearch(text).split(' ').filter(t => t && !stopWords.has(t)))]; }
function compare(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0; }

/** One insertion/deletion/substitution or adjacent transposition, never numbers. */
function near(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1 || /\d/.test(a + b)) return false;
  if (a.length === b.length) {
    const mismatch: number[] = [];
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) { mismatch.push(i); if (mismatch.length > 2) return false; }
    if (mismatch.length < 2) return true;
    const [i, j] = mismatch as [number, number];
    return j === i + 1 && a[i] === b[j] && a[j] === b[i];
  }
  const shorter = a.length < b.length ? a : b; const longer = a.length < b.length ? b : a;
  let i = 0; while (i < shorter.length && shorter[i] === longer[i]) i++;
  return shorter.slice(i) === longer.slice(i + 1);
}
export interface IndexEntry<T> { id: string; name: string; fields: string[]; priority: number; value: T }
export function createPlaceIndex<T>(entries: readonly IndexEntry<T>[]) {
  const documents = entries.map(e => ({ ...e, normalName: normalizeSearch(e.name), normalFields: e.fields.map(normalizeSearch) }));
  const postings = new Map<string, number[]>();
  for (let i = 0; i < documents.length; i++) {
    const document = documents[i]!;
    for (const token of tokens([document.name, ...document.fields].join(' '))) {
      const values = postings.get(token); if (values) values.push(i); else postings.set(token, [i]);
    }
  }
  const dictionary = [...postings.keys()].sort(compare);
  const byLength = new Map<number, string[]>();
  for (const token of dictionary) { const list = byLength.get(token.length); if (list) list.push(token); else byLength.set(token.length, [token]); }
  function prefix(word: string): string[] {
    // House numbers and house-number suffixes must be exact: 7 never matches 77/7a.
    if (/^\d/.test(word)) return postings.has(word) ? [word] : [];
    let low = 0; let high = dictionary.length;
    while (low < high) { const mid = (low + high) >>> 1; if (dictionary[mid]! < word) low = mid + 1; else high = mid; }
    const result: string[] = [];
    for (let i = low; i < dictionary.length && dictionary[i]!.startsWith(word); i++) result.push(dictionary[i]!);
    return result;
  }
  function candidates(words: string[], fuzzy: boolean): Map<number, number> {
    const groups = words.map(word => {
      const hits = new Map<number, number>();
      for (const term of prefix(word)) for (const id of postings.get(term)!) hits.set(id, 0);
      if (fuzzy && word.length >= 5 && !/\d/.test(word)) {
        for (const length of [word.length - 1, word.length, word.length + 1]) for (const term of byLength.get(length) ?? []) {
          if (near(word, term)) for (const id of postings.get(term)!) if (!hits.has(id)) hits.set(id, 1);
        }
      }
      return hits;
    }).sort((a, b) => a.size - b.size);
    const result = new Map<number, number>();
    for (const [id, cost] of groups[0] ?? []) {
      let total = cost;
      for (const group of groups.slice(1)) { const score = group.get(id); if (score === undefined) { total = 2; break; } total += score; }
      if (total <= 1) result.set(id, total);
    }
    return result;
  }
  return {
    search(query: string): { items: T[]; total: number } {
      const normal = normalizeSearch(query);
      const alias = spokenAddressAlias(normal);
      const variants = (alias ? [normal, alias] : [normal]).map(text => ({ text, words: tokens(text) }));
      const found = new Map<number, { document: typeof documents[number]; cost: number; variant: number; rank: number }>();
      const collect = (fuzzy: boolean) => {
        for (const [variant, { text, words }] of variants.entries()) {
          for (const [id, cost] of candidates(words, fuzzy)) {
            const previous = found.get(id);
            if (previous && previous.cost <= cost) continue;
            const document = documents[id]!;
            const rank = document.normalName === text ? 0 : document.normalFields.includes(text) ? 1
              : document.normalName.startsWith(text) ? 2 : 3;
            found.set(id, { document, cost, variant, rank });
          }
        }
      };
      collect(false);
      if (!found.size) collect(true);
      const scored = [...found.values()].sort((a, b) => a.cost - b.cost || a.variant - b.variant || a.rank - b.rank || a.document.priority - b.document.priority
        || compare(a.document.normalName, b.document.normalName) || compare(a.document.id, b.document.id));
      return { items: scored.slice(0, 10).map(item => item.document.value), total: found.size };
    },
  };
}
