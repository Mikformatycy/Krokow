// Keys use the same accent-free lowercase form as normalizeSearch.
const units = ['', 'jeden', 'dwa', 'trzy', 'cztery', 'piec', 'szesc', 'siedem', 'osiem', 'dziewiec'];
const teens = ['dziesiec', 'jedenascie', 'dwanascie', 'trzynascie', 'czternascie',
  'pietnascie', 'szesnascie', 'siedemnascie', 'osiemnascie', 'dziewietnascie'];
const tens = ['', '', 'dwadziescia', 'trzydziesci', 'czterdziesci', 'piecdziesiat',
  'szescdziesiat', 'siedemdziesiat', 'osiemdziesiat', 'dziewiecdziesiat'];
const hundreds = ['', 'sto', 'dwiescie', 'trzysta', 'czterysta', 'piecset',
  'szescset', 'siedemset', 'osiemset', 'dziewiecset'];

// A finite grammar rejects malformed phrases instead of adding arbitrary words.
const numbers = new Map<string, number>();
for (let value = 1; value <= 999; value++) {
  const remainder = value % 100;
  const belowHundred = remainder >= 10 && remainder < 20
    ? [teens[remainder - 10]] : [tens[Math.floor(remainder / 10)], units[remainder % 10]];
  numbers.set([hundreds[Math.floor(value / 100)], ...belowHundred].filter(Boolean).join(' '), value);
}
const numberWords = new Set([...units, ...teens, ...tens, ...hundreds,
  'zero', 'tysiac', 'tysiace', 'tysiecy', 'milion', 'miliony', 'milionow']);
const addressLabels = new Set(['ul', 'ulica', 'al', 'aleja', 'aleje', 'os', 'osiedle']);

/** An optional search alias, never a replacement for the original normalized query. */
export function spokenAddressAlias(normal: string): string | undefined {
  const words = normal.split(' ');
  const last = words.at(-1) ?? '';
  const letter = /^[a-z]$/.test(last) ? last : '';
  const end = words.length - (letter ? 1 : 0);
  for (let start = Math.max(1, end - 3); start < end; start++) {
    const value = numbers.get(words.slice(start, end).join(' '));
    if (value === undefined) continue;
    const prefix = words.slice(0, start);
    const previous = prefix.at(-1)!;
    // Do not reinterpret the tail of an invalid/unsupported or partly numeric number.
    if (numberWords.has(previous) || /\d/.test(previous)) return undefined;
    if (!prefix.some(word => !addressLabels.has(word))) return undefined;
    return `${prefix.join(' ')} ${value}${letter}`;
  }
  return undefined;
}
