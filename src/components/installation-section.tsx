import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHydrated } from '@/lib/use-hydrated';

const installCommand = 'brew install tvr-works/tap/xkcdpass';

function InstallCommand() {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const isHydrated = useHydrated();
  const copyRequest = useRef(0);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      copyRequest.current += 1;
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  async function copyCommand() {
    const request = ++copyRequest.current;
    if (resetTimer.current) clearTimeout(resetTimer.current);
    let result: 'copied' | 'error';
    try {
      await navigator.clipboard.writeText(installCommand);
      result = 'copied';
    } catch {
      result = 'error';
    }
    if (request !== copyRequest.current) return;
    setStatus(result);
    resetTimer.current = setTimeout(() => setStatus('idle'), 2500);
  }

  return (
    <div className="install-row">
      <div className="install-command">
        {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- The scrolling command must be keyboard accessible. */}
        <code id="install-command" tabIndex={0} aria-label="Homebrew install command">
          {installCommand}
        </code>
        {isHydrated ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={copyCommand}
            aria-label={status === 'copied' ? 'Copied' : 'Copy install command'}
          >
            {status === 'copied' ? <Check /> : <Copy />}
          </Button>
        ) : null}
      </div>
      <output className="copy-status" aria-live="polite">
        {status === 'copied'
          ? 'Install command copied.'
          : status === 'error'
            ? 'Could not copy. Select the command and copy it manually.'
            : ''}
      </output>
    </div>
  );
}

export function InstallationSection({ repositoryUrl }: { repositoryUrl: string }) {
  return (
    <section className="installation" id="install" aria-labelledby="install-title">
      <div className="section-copy">
        <h2 className="section-title" id="install-title">
          Install xkcdpass.
        </h2>
        <p className="section-intro">Install with Homebrew, or choose a build for your platform.</p>
      </div>
      <div className="installation-options">
        <InstallCommand />
        <ul className="platform-links" aria-label="Platform support">
          <li>
            <a href={`${repositoryUrl}#installation`}>macOS Apple Silicon</a>
          </li>
          <li>
            <a href={`${repositoryUrl}#installation`}>Linux x86_64</a>
          </li>
          <li>
            <a href={`${repositoryUrl}#installation`}>
              Other platforms <ArrowUpRight aria-hidden="true" />
            </a>
          </li>
        </ul>
      </div>
    </section>
  );
}
