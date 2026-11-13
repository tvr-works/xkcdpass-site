import { useState } from 'react';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import {
  WORD_COUNTS,
  WORDLIST_SIZE,
  isWordCount,
  passphraseStrength,
  type WordCount,
} from '@/lib/passphrase-strength';
import { useHydrated } from '@/lib/use-hydrated';

const wordPositions = [1, 2, 3, 4, 5, 6];

export function EntropyExplorer() {
  const [wordCount, setWordCount] = useState<WordCount>(4);
  const ready = useHydrated();
  const strength = passphraseStrength(wordCount);
  const choices = WORDLIST_SIZE.toLocaleString('en-US');

  return (
    <section className="entropy-section" id="strength" aria-labelledby="entropy-title">
      <div className="continuation-copy">
        <h2 className="section-title" id="entropy-title">
          Why simple words can make strong passwords.
        </h2>
        <p className="section-intro">
          Every word is chosen independently at random from {choices} possibilities. Each extra word
          multiplies the possibilities by {choices}.
        </p>
        <p className="entropy-assumptions">
          The EFF wordlist is public. These counts assume independent random selection, with the
          wordlist and count already known.
        </p>
        <noscript>
          <p className="entropy-assumptions">
            Entropy is the base-two logarithm of the number of possible sequences. Enable JavaScript
            to compare word counts.
          </p>
        </noscript>
      </div>
      <div className="entropy-panel">
        <div className="word-count-controls">
          <span className="word-count-label" id="word-count-label">
            Word count
          </span>
          <ToggleGroup
            aria-labelledby="word-count-label"
            value={[String(wordCount)]}
            disabled={!ready}
            onValueChange={(values) => {
              const next = Number(values[0]);
              if (isWordCount(next)) setWordCount(next);
            }}
          >
            {WORD_COUNTS.map((count) => (
              <ToggleGroupItem key={count} value={String(count)}>
                {count} words
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="entropy-calculation" aria-hidden="true">
          <div className="word-choices">
            {wordPositions.slice(0, wordCount).map((position) => (
              <div className="word-factor" key={position}>
                {position > 1 ? <span className="multiplication">×</span> : null}
                <span className="word-choice">{choices}</span>
              </div>
            ))}
          </div>
        </div>
        <output className="sr-only" aria-live="polite" aria-atomic="true">
          {wordCount} independent words, {choices} choices per word. About{' '}
          {strength.possibilitiesLabel} possible sequences. {strength.bitsLabel} bits of entropy.
        </output>
        <Collapsible>
          <p className="entropy-result" aria-hidden="true">
            <span className="entropy-number">{strength.possibilitiesLabel}</span>{' '}
            <span className="entropy-result-label">possible sequences</span>
          </p>
          <div className="entropy-summary">
            <p className="entropy-bits" aria-hidden="true">
              {strength.bitsLabel} bits of entropy
            </p>
            <CollapsibleTrigger disabled={!ready}>
              How the math works <ChevronDown aria-hidden="true" />
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <div className="math-explanation">
              <p>
                Entropy measures the range of possible sequences. Each independent word multiplies
                that range by {choices}, even when the wordlist and word count are known.
              </p>
              <p>
                With {wordCount} words: {choices}
                <sup>{wordCount}</sup> ={' '}
                <span className="exact-count">
                  {strength.possibilities.toLocaleString('en-US')}
                </span>{' '}
                sequences. In bits, that is {wordCount} × log<sub>2</sub>({choices}) ≈{' '}
                {strength.bitsLabel}.
              </p>
              <p>
                xkcdpass selects words uniformly using Go’s <code>crypto/rand</code>. The
                calculation applies to independently generated words, rather than a phrase you
                choose yourself.
              </p>
              <a href="https://www.eff.org/dice">
                About the EFF wordlist <ArrowUpRight aria-hidden="true" />
              </a>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </section>
  );
}
