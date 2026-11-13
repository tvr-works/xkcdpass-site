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

`src/App.tsx` composes the approved hero, default terminal example, illustration, install strip, entropy lesson, and compact usage reference. Semantic links share the Button variants; actual actions use the Base UI Button. Shared visual tokens and responsive layout live in `src/styles.css`. Add further components on demand with `npx shadcn@4.22.1 add @shadcn/<component>`; the CLI is not an installed dependency. Clipboard feedback is announced, failure leaves the selectable command available, and reduced motion is respected. Generated illustration/background assets live in `public/assets`; the transparent black illustration is displayed in white with CSS inversion. The terminals are selectable examples, not browser password generators. `EntropyExplorer` uses a Base UI ToggleGroup and Collapsible. Its 3–6 word controls update exact BigInt combination counts, human-readable magnitudes, and bits calculated from the 7,776-word list. Results are announced to assistive technology. At one decimal place, six words round to 77.5 bits (77.5489 before rounding). The math disclosure explains the security assumptions.

Vite compiles the client and a temporary server entry. `scripts/build-site.mjs` prerenders the same React tree into HTML, then removes the server bundle. No server runtime is published. Navigation, copy text, and installation instructions remain available without JavaScript; clipboard and explorer controls hydrate on the client; the initial four-word lesson and usage examples are present without JavaScript. The static artifact retains the canonical URL, robots/sitemap, true 404, strict CSP, security headers, exact commit identity, and file checksums. Publication validates explicit public assets and hashed compiler output and enforces build budgets (including React and the self-hosted font).

The below-the-fold continuation intentionally contains only the entropy lesson and the two-flag reference, separated by whitespace. The previous feature grid, use-case section, and FAQ remain excluded. The complete earlier site is preserved at Git commit `891d7b5` for reference.

See [CI and deployment](docs/ci-deployment.md) for the existing exact-commit publication gate and recovery procedure. This redesign does not change hosting settings or publish automatically until pushed through the established Git flow.
