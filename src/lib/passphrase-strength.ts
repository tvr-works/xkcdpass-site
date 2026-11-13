export const WORDLIST_SIZE = 7776;
export const WORD_COUNTS = [3, 4, 5, 6] as const;
export type WordCount = (typeof WORD_COUNTS)[number];

export function isWordCount(value: number): value is WordCount {
  return WORD_COUNTS.some((count) => count === value);
}

const units = [
  { divisor: 10n ** 21n, label: 'sextillion' },
  { divisor: 10n ** 18n, label: 'quintillion' },
  { divisor: 10n ** 15n, label: 'quadrillion' },
  { divisor: 10n ** 12n, label: 'trillion' },
  { divisor: 10n ** 9n, label: 'billion' },
];

export function passphraseStrength(wordCount: number) {
  if (!isWordCount(wordCount)) throw new RangeError('Choose 3, 4, 5, or 6 words.');
  const possibilities = BigInt(WORDLIST_SIZE) ** BigInt(wordCount);
  const unit = units.find(({ divisor }) => possibilities >= divisor)!;
  // Round in integer arithmetic; these counts exceed Number's exact range.
  const tenths = (possibilities * 10n + unit.divisor / 2n) / unit.divisor;
  const fraction = tenths % 10n;
  const amount = `${tenths / 10n}${fraction ? `.${fraction}` : ''}`;
  const bits = wordCount * Math.log2(WORDLIST_SIZE);
  return {
    wordCount,
    possibilities,
    possibilitiesLabel: `${amount} ${unit.label}`,
    bits,
    bitsLabel: bits.toFixed(1),
  };
}
