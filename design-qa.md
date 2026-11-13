# Approved hero implementation QA

final result: passed

Reviewed the selected mockup against the compiled, prerendered page at <http://127.0.0.1:4175/>. This pass covers the hero, terminal example, illustration, install strip, and footer. Below-the-fold sections remain deferred.

## Visual evidence

- Source: `/Users/tim.vanreenen/.codex/generated_images/01a1ba14-77ce-75a0-abc9-5a6d464ab3a6/exec-f70925b7-465d-4264-a5bd-047621b06831.png` (1422 × 1106 pixels).
- Final implementation: `/private/tmp/xkcdpass-hero-qa/desktop-final.jpg` (1422 × 1119 full-page pixels).
- Desktop CSS viewport: 1422 × 1106, device pixel ratio 1, default route, no hover/focus/copy state. The extra 13 pixels are bottom padding. Comparison uses the first 1106 pixels of the rendered capture, without resizing the underlying layout.
- Combined comparison: `/private/tmp/xkcdpass-hero-qa/comparison-final.png`. Source at left, implementation at right; both shown at 50% scale.
- Focused terminal comparison: `/private/tmp/xkcdpass-hero-qa/terminal-comparison.png`. Source above, implementation below; native 1:1 crops confirm command, output, titlebar, border, typography, and absent helper caption.
- Mobile: `/private/tmp/xkcdpass-hero-qa/mobile-top.jpg` and `/private/tmp/xkcdpass-hero-qa/mobile-install.jpg`, 390 × 844 viewport captures at density 1. Captured separately because this browser's full-page capture did not paint content below its viewport reliably.

## Findings and comparison history

1. Initial comparison (`comparison-first.png`): [P2] hero actions/terminal began about 24 pixels too low; regenerated art was too tall, pushing installation and footer down. Reduced eyebrow spacing, headline line height, action spacing, illustration width, and installation padding. Second comparison (`comparison-second.png`) confirmed the corrected major-region alignment.
2. Tablet review: [P2] the sample phrase wrapped. Added a narrower tablet type scale and an assertion that the entire output remains on one line. The new assertion then caught the same issue at 1001 pixels; adjusted desktop output scaling. Final Chromium and WebKit runs pass at 320, 360, 390, 700, 701, 1000, 1001, 1422, and 1920 pixels.
3. Interaction review: reserved additional space only while clipboard feedback is present, preventing feedback/footer collisions. Rejected-copy behavior and feedback bounds pass the browser test.
4. Final combined and focused comparisons: no actionable P0/P1/P2 differences remain.

## Required fidelity surfaces

- **Typography:** self-hosted Geist Variable, bold two-line headline, muted two-line desktop subtitle, larger monospace output, handwritten reaction inside the illustration. Copy is verbatim. Footer uses italic styling. Native monospace metrics vary slightly by OS; an acceptable P3 difference from the image-generated reference.
- **Spacing/layout:** 1280-pixel maximum content width, sparse header, terminal occupying about 72% of the desktop demonstration row, raised illustration, bottom install strip. Desktop terminal placement/dimensions and installation divider align closely with the mockup. Mobile stacks terminal before art, preserves a two-line headline, and keeps controls reachable.
- **Colors/tokens:** centralized dark navy, white, muted gray, icy-blue accent, terminal transparency, and titlebar/traffic-light tokens. Generated background is smoother and its blue glow varies slightly from the reference; acceptable P3 variation.
- **Images:** original generated transparent illustration and separate atmospheric background, stored in `public/assets`. All four objects are recognizable, reaction text is exact, alpha is clean, and aspect ratio is preserved. Black raster ink is inverted to white. Minor differences in hand-drawn contours are acceptable P3 variation. UI arrows/copy/check are Lucide icons.
- **Content:** exact approved headline/subtitle; exact CLI invocation and sample phrase; no terminal example/comic caption; Homebrew command and footer attribution preserved. The terminal is an example, not an interactive generator.

## Behavior and verification

- In-app Browser available through CUA; no external browser fallback used. Production preview identity, meaningful content, absence of framework overlays, anchor navigation, and actual copy action verified. Copy changed to “Copied” and announced “Install command copied.” No errors from the production preview; earlier development-only font import reload errors were fixed before the final build. Fresh Chromium/WebKit test contexts report no console/runtime errors.
- `npm run check`: runtime, formatting, Oxlint + shadcn rules, TypeScript, HTML/reference/indexing validation, static build budgets, and all 49 Node tests passed.
- `npm run test:browser`: 11 passed; one intentionally skipped WebKit clipboard test because that harness does not expose clipboard permissions. Real clipboard success, reset, rejection, and feedback placement verified in Chromium.
- Browser coverage: keyboard skip link, example/install navigation, no-JavaScript content/navigation, selectable scrolling install command, viewport overflow, unwrapped phrase output, desktop/mobile WCAG A/AA axe scans, CSP hashes/security headers, robots/sitemap, canonical/structured data, true 404, compiled assets, and artifact checksums.
- `npm audit --audit-level=high`: zero vulnerabilities after removing the on-demand shadcn CLI from installed dependencies. Components and `@shadcn/lint` remain installed.
- Build output: about 751.5 KiB raw total, 80.4 KiB gzip JavaScript, self-hosted Latin font. Existing exact-commit publication gate retained. No deployment performed.

## Architecture and maintenance

Chose React + Vite compilation with build-time prerendering over introducing a routed application/server framework: this is one marketing page, and Frame/Key already demonstrate the same static pattern. The production artifact remains static and the temporary server bundle is removed. Base UI supplies action semantics; native links share shadcn Button variants. This avoids turning navigation into button semantics. Components define reusable variants rather than per-call visual overrides. Oxlint/shadcn lint checks semantic styling and the shared stylesheet.

The selected assets were produced with built-in ImageGen, using the approved mockup as reference. The illustration prompt requested only the four-object thought bubble, thinking character, exact handwritten reaction, and ground scribble on transparency. The background prompt requested only the smooth midnight navy/cool blue atmosphere, without objects or text. Final assets: `public/assets/passphrase-thought.webp` and `public/assets/hero-background.webp`.

## Remaining limits

Manual screen-reader use and physical-device testing were not performed. Small raster/monospace differences above are P3 follow-up polish, not blockers. The prior full site remains at Git commit `891d7b5` for future below-the-fold selection. Screenshots are local review evidence and are not published with the site.
