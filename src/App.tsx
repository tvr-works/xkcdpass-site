import { ArrowUpRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { EntropyExplorer } from '@/components/entropy-explorer';
import { InstallationSection } from '@/components/installation-section';

const application = 'https://github.com/tvr-works/xkcdpass';
function TerminalExample() {
  return (
    <section className="terminal" id="example" aria-label="Example terminal command and output">
      <div className="terminal-titlebar">
        <div className="terminal-controls" aria-hidden="true">
          <span className="terminal-close" />
          <span className="terminal-minimize" />
          <span className="terminal-maximize" />
        </div>
        <h2>Terminal — xkcdpass</h2>
      </div>
      <div className="terminal-body">
        <pre className="terminal-command">
          <code>
            <span aria-hidden="true">$ </span>xkcdpass
          </code>
        </pre>
        <pre className="terminal-output">
          <samp>turtlerocketcactusdonut</samp>
        </pre>
      </div>
    </section>
  );
}

function UsageSection() {
  return (
    <section className="usage-section" id="usage" aria-labelledby="usage-title">
      <div className="continuation-copy">
        <h2 className="section-title" id="usage-title">
          Choose your format.
        </h2>
        <dl className="flag-reference">
          <div>
            <dt>
              <code>--words 6</code>
            </dt>
            <dd>Word count · default: 4</dd>
          </div>
          <div>
            <dt>
              <code>--separator -</code>
            </dt>
            <dd>Separator · default: none</dd>
          </div>
        </dl>
      </div>
      <div className="usage-demo">
        <div className="usage-example" aria-label="Six-word passphrase example">
          <pre>
            <code>
              <span aria-hidden="true">$ </span>xkcdpass --words 6{' '}
              <span className="whitespace-nowrap">--separator -</span>
            </code>
          </pre>
          <pre>
            <samp>turtle-rocket-cactus-donut-ladder-lemon</samp>
          </pre>
        </div>
        <p className="usage-note">Fixed separators add no entropy.</p>
      </div>
    </section>
  );
}

export default function App() {
  return (
    <div className="page" id="top">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header shell">
        <div className="brand-group">
          <a className="brand" href="#top" aria-label="xkcdpass home">
            xkcdpass
          </a>
          <a className="brand-credit" href="https://tvr.works/software">
            by TVR Works
          </a>
        </div>
        <nav className="site-nav" aria-label="Primary">
          <a className="nav-github" href={application}>
            GitHub <ArrowUpRight aria-hidden="true" />
          </a>
          <a className={buttonVariants()} href="#install">
            Install
          </a>
        </nav>
      </header>
      <main className="shell" id="main" tabIndex={-1}>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">Command-line passphrase generator</p>
            <h1 id="hero-title">
              Easy to use.
              <br />
              Hard to guess.
            </h1>
            <p className="hero-subtitle">
              Cryptographically strong passphrases, generated locally in your terminal.
              <br className="desktop-break" /> Familiar words you can read, retype, and say aloud.
            </p>
            <div className="hero-actions">
              <a className={buttonVariants({ size: 'lg' })} href="#install">
                Install xkcdpass
              </a>
              <a className={buttonVariants({ variant: 'link', size: 'lg' })} href={application}>
                View on GitHub <ArrowUpRight aria-hidden="true" data-icon="inline-end" />
              </a>
            </div>
          </div>
          <TerminalExample />
          <img
            className="hero-illustration"
            src="/assets/passphrase-thought.webp"
            width="962"
            height="1363"
            alt="A thinking stick figure pictures a turtle, rocket, cactus, and donut: ‘I can type that.’"
            fetchPriority="high"
          />
        </section>
        <EntropyExplorer />
        <UsageSection />
        <InstallationSection repositoryUrl={application} />
      </main>
      <footer className="site-footer shell">
        <p>
          Inspired by <a href="https://xkcd.com/936/">xkcd #936</a>.
        </p>
        <a href="https://tvr.works/software">by TVR Works</a>
      </footer>
    </div>
  );
}
