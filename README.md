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

`src/App.tsx` composes the hero, entropy lesson, usage reference, installation section, and footer. Static hero and usage markup stay local to the page. `src/components/installation-section.tsx` owns the install command, clipboard feedback, and platform links. Only the latest clipboard request can update feedback or start its reset timer; unmounting invalidates pending requests. Semantic links share the Button variants, and actions use the Base UI Button.

`EntropyExplorer` uses a Base UI ToggleGroup and Collapsible. Its 3–6 word controls use the pure calculation in `src/lib/passphrase-strength.ts` to produce exact BigInt combination counts, readable magnitudes, and bits from the 7,776-word list. Results are announced to assistive technology. At one decimal place, six words round to 77.5 bits (77.5489 before rounding). The disclosure explains the random-selection assumptions and links to EFF's wordlist guidance. The terminal examples are selectable text; the site does not generate passwords in the browser.

Shared visual tokens, typography, and responsive layouts live in `src/styles.css`. Tailwind scans only `src` and `index.html`, so documentation and tests do not add production utilities. The background is a static CSS glow over navy. Illustration assets live in `public/assets`; the transparent black hero illustration is displayed in white with CSS inversion. Native anchor scrolling respects reduced-motion preferences. Add components on demand with `npx shadcn@4.22.1 add @shadcn/<component>`; the CLI is not an installed dependency.

The 1200 × 630 social image is `public/assets/xkcdpass-social.png`. Edit its source in `assets/social-card.html`, then run `npm run generate:social` with the installed Playwright Chromium browser. This offline authoring step reuses the hero illustration and local Geist font; normal builds publish the checked-in PNG. Search, Open Graph, and Twitter metadata live in `index.html`. Artifact tests verify the image URL, dimensions, alt text, favicon, and structured data.

Vite compiles the client and a temporary server entry. `scripts/build-site.mjs` prerenders the React tree into HTML, then removes the server bundle. No server runtime is published. The initial four-word lesson, examples, links, and installation command remain available without JavaScript. Clipboard actions and explorer controls hydrate on the client.

`scripts/artifact-policy.mjs` defines the public-file inventory and permitted compiled asset names for both local validation and deployment verification. The static artifact retains the canonical URL, robots/sitemap, true 404, strict CSP, security headers, exact commit identity, and file checksums. Publication validates the public files and hashed compiler output and enforces build budgets for the complete artifact.

The page ends with usage and installation, separated by whitespace. Design iteration notes are in `design-qa.md`; the earlier site is preserved at Git commit `891d7b5`.

See [CI and deployment](docs/ci-deployment.md) for the existing exact-commit publication gate and recovery procedure. This redesign does not change hosting settings or publish automatically until pushed through the established Git flow.
