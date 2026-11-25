import type { ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

export const applicationRepositoryUrl = 'https://github.com/tvr-works/xkcdpass';

export function SiteFrame({
  children,
  privacy = false,
}: {
  children: ReactNode;
  privacy?: boolean;
}) {
  return (
    <div className="page" id="top">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header shell">
        <a className="brand" href={privacy ? '/' : '#top'} aria-label="xkcdpass home">
          xkcdpass
        </a>
        <nav className="site-nav" aria-label="Primary">
          <a className="nav-github" href={applicationRepositoryUrl}>
            GitHub <ArrowUpRight aria-hidden="true" />
          </a>
          <a className={buttonVariants()} href={privacy ? '/#install' : '#install'}>
            Install
          </a>
        </nav>
      </header>
      <main className="shell" id="main" tabIndex={-1}>
        {children}
      </main>
      <footer className="site-footer shell">
        <p className="site-footer-legal">
          <span>© 2026 TVR Works LLC</span>{' '}
          <span className="site-footer-legal-links">
            <span aria-hidden="true">·</span> <a href="https://tvr.works/software">Software</a>{' '}
            <span aria-hidden="true">·</span>{' '}
            <a href="/privacy" aria-current={privacy ? 'page' : undefined}>
              Privacy
            </a>
          </span>
        </p>
        <p className="site-footer-credit">
          Inspired by <a href="https://xkcd.com/936/">xkcd #936</a>.
        </p>
      </footer>
    </div>
  );
}
