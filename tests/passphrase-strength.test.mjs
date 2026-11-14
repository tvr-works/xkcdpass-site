import assert from 'node:assert/strict';
import { test } from 'node:test';
import { passphraseStrength } from '../src/lib/passphrase-strength.ts';

const cases = [
  [3, 470184984576n, '470.2 billion', '38.8'],
  [4, 3656158440062976n, '3.7 quadrillion', '51.7'],
  [5, 28430288029929701376n, '28.4 quintillion', '64.6'],
  [6, 221073919720733357899776n, '221.1 sextillion', '77.5'],
];
for (const [count, possibilities, label, bits] of cases) {
  test(`${count} words retain exact combinations and readable strength`, () => {
    const result = passphraseStrength(count);
    assert.equal(result.possibilities, possibilities);
    assert.equal(result.possibilitiesLabel, label);
    assert.equal(result.bitsLabel, bits);
  });
}
test('the educational range rejects unsupported or fractional word counts', () => {
  for (const value of [0, 2, 7, 4.5, NaN, Infinity, '4', undefined])
    assert.throws(() => passphraseStrength(value), RangeError);
});
