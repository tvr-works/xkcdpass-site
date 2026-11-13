# xkcdpass marketing site

React, TypeScript, Vite, and Tailwind CSS marketing site for <https://xkcdpass.tvr.works>. Uses shadcn's `base-nova` configuration with Base UI primitives, Geist, and Lucide, following the Frame, Key, and Figure sites. The [xkcdpass application](https://github.com/tvr-works/xkcdpass) is a separate repository.

```sh
brew install tvr-works/tap/xkcdpass
```

Use Node `26.13.0` and npm `11.20.0`:

```sh
npm ci --ignore-scripts
npm run dev                  # http://127.0.0.1:5173
npm run check                # format, Oxlint/shadcn lint, TypeScript, artifact/gate tests
npm run test:browser          # Chromium and WebKit against the production artifact
npm run build
npm run preview              # http://127.0.0.1:4175
```

Install local browsers once with `npx playwright install chromium webkit`. CI uses the matching pinned Playwright image.

`src/App.tsx` composes the approved hero, terminal example, illustration, and install strip. Semantic links share the Button variants; actual actions use the Base UI Button. Shared visual tokens and responsive layout live in `src/styles.css`. Add further components on demand with `npx shadcn@4.22.1 add @shadcn/<component>`; the CLI is not an installed dependency. Clipboard feedback is announced, failure leaves the selectable command available, and reduced motion is respected. Generated illustration/background assets live in `public/assets`; the transparent black illustration is displayed in white with CSS inversion. The terminal is a selectable example, not a browser password generator.

Vite compiles the client and a temporary server entry. `scripts/build-site.mjs` prerenders the same React tree into HTML, then removes the server bundle. No server runtime is published. Navigation, copy text, and installation instructions remain available without JavaScript; clipboard interaction hydrates on the client. The static artifact retains the canonical URL, robots/sitemap, true 404, strict CSP, security headers, exact commit identity, and file checksums. Publication validates explicit public assets and hashed compiler output and enforces build budgets (including React and the self-hosted font).

The earlier below-the-fold content is intentionally deferred; the complete prior site is preserved at Git commit `891d7b5`. Add selected sections in later work rather than restoring them by default.

See [CI and deployment](docs/ci-deployment.md) for the existing exact-commit publication gate and recovery procedure. This redesign does not change hosting settings or publish automatically until pushed through the established Git flow.
