# Entropy lesson and compact usage QA

final result: passed

The selected continuation adds only an entropy lesson and a two-flag usage reference, separated by whitespace. The hero now shows the actual default call (`xkcdpass`) with four joined words. Existing hero copy, illustration, responsive independent-column behavior, and installation command are retained.

## Visual truth and evidence

- Selected mockup: `/Users/tim.vanreenen/.codex/generated_images/01a1ba14-77ce-75a0-abc9-5a6d464ab3a6/exec-1180d0f5-3051-4017-8feb-166f7b8338e9.png` (1073 × 1466 pixels).
- Implementation: <http://127.0.0.1:4175/>. Final continuation capture: `/private/tmp/xkcdpass-below-fold-qa/below-fold-final.jpg` (1073 × 1525 pixels).
- Comparison viewport: 1073 × 2800 CSS pixels, density 1. Both artifacts represent four words selected and the disclosure closed. The implementation is a content crop starting 76px above the section heading, through the complete footer. A tall viewport was used to paint all content; this browser's full-page screenshots otherwise leave off-screen content unpainted. There is no CSS dependence on viewport height in the continuation layout.
- Combined comparison: `/private/tmp/xkcdpass-below-fold-qa/comparison-final.png`. Source left, implementation right, both at the same 536px display width. Source has bottom padding added to match the implementation's canvas; neither artifact is stretched.
- Focused entropy comparison: `/private/tmp/xkcdpass-below-fold-qa/entropy-focused.png` (same relative crop of the formula/result, source above, implementation below).
- Mobile (390 × 844, density 1): `/private/tmp/xkcdpass-below-fold-qa/mobile-default.jpg`, `mobile-expanded.jpg`, and `mobile-usage.jpg`. These show the wrapped word factors, readable alternate annotation, disclosure, usage reference, and complete wrapped six-word output.

## Findings and iteration history

- First comparison (`comparison-first.png`): [P2] heading wrapped at a different word; the result lacked the selected emphasis; background `cover` scaled the original art over the taller page. Added a dedicated heading break at the appropriate width, used standard `text-5xl` for the desktop result, and repeated the existing background at its width-preserving aspect rather than stretching it to page height.
- Final combined and focused comparisons reviewed after fixes. No actionable P0/P1/P2 findings remain.
- The implementation retains the site's established Tailwind typography and container scale rather than copying every raster text size. Supporting text/control sizes are 14/16px, body 18/20px, section headings 30/36/48px; native monospace metrics vary by OS. These are intentional framework/context adaptations.
- Small generated chalk contour/stroke differences, the additional existing license link in the footer, and modest total-height differences are P3/intentional. No unrelated sections or content were added.

## Required fidelity surfaces

- **Fonts/type:** existing self-hosted Geist and native monospace retained; standard weights and named Tailwind sizes. Header/default terminal and section hierarchy verified. Selected copy is retained except for technical details revealed in the disclosure and the required precise six-word calculation.
- **Spacing/layout:** 24/32px internal rhythm, 96/128px before the lesson and usage, and 80/96px before the footer. No new section HRs. The word factors wrap together on small screens. The illustration still keeps its own column from 768px, with copy wrapping beside it; tests preserve height continuity across 767/768px.
- **Colors/tokens:** existing midnight navy, white, gray, icy blue, translucent command surfaces, focus ring, and state colors. No new theme or hardcoded component-call colors. Background aspect remains stable as page height grows.
- **Images:** real generated chalk brace/annotation at `public/assets/entropy-annotation.webp`, 2003 × 180, transparent lossless WebP, about 25 KiB. Black ink is displayed white using CSS inversion. Source generated image remains outside the repo. Mobile replaces the unreadably small annotation with equivalent live explanatory text. Existing hero illustration reused. No handcrafted SVG/CSS drawings substitute for artwork.
- **Copy/content:** only the entropy explanation, word-count controls, math disclosure, compact usage, platform/source links, and footer. Hero: `$ xkcdpass` → `turtlerocketcactusdonut`. Usage: `xkcdpass --words 6 --separator -` → `turtle-rocket-cactus-donut-ladder-lemon`. No FAQ, use-case feature grid, repeat install prompt, strength meter, or cracking-time claim.

## Math and accessibility

- Exact possibilities use BigInt powers of 7,776. Human-readable magnitudes are rounded using integer arithmetic, avoiding precision loss or Intl's unsupported larger-unit fallback.
- 3 words: 470,184,984,576 possibilities, 38.8 bits. 4: 3,656,158,440,062,976, 51.7 bits. 5: 28,430,288,029,929,701,376, 64.6 bits. 6: 221,073,919,720,733,357,899,776, 77.5 bits.
- Six words calculate to 77.548875 bits; the one-decimal display is 77.5, correcting the README's earlier 77.6 rounding. No application source was changed in its separate repository.
- Shadcn/Base UI ToggleGroup and Collapsible provide keyboard, pressed, focus, expanded, and control relationships. One selected count is always retained; keyboard arrows move between choices and Space selects. The result announces a complete textual equivalent in a polite live output. Decorative visual math is hidden from the accessibility tree to avoid repetitive number announcements.
- Core default content is prerendered. Client-only controls are disabled until hydration. No-JavaScript visitors retain the default lesson, explanatory fallback, usage, navigation, and install instructions.

## Verification

- `npm run check` passed: runtime, formatting, Oxlint/shadcn lint, TypeScript, HTML/reference/indexing validation, static budgets, and all 54 Node tests. Numerical tests include exact counts beyond Number precision and unsupported word counts.
- Full `npm run test:browser`: 13 passed; one intentional WebKit clipboard permission skip. After final visual changes, the render, responsive/keyboard/axe, and interactive math checks passed again in both engines (6 tests).
- Responsive coverage includes 320, 360, 390, 639, 640, 767, 768, 1023, 1024, 1279, 1280, 1422, and 1920px. Axe scans include six words and expanded math on desktop/mobile. Copy success/rejection, Examples/Install anchors, no-JavaScript content, true 404, robots/sitemap/canonical, CSP hashes, security headers, public asset allowlisting, and deployment checksums remain covered.
- In-app Browser available through CUA; no browser fallback used. Production preview identity, no blank/error overlay, actual mobile six-word selection and disclosure expansion, and console health verified. No console warnings/errors. Preview is left running locally.
- Final measured output: about 829 KiB raw total, 89.7 KiB gzip JavaScript, 30.7 KiB raw / 5.6 KiB gzip CSS. CSS raw guard increased from 30 to 32 KiB for the two sections and component states; other budgets remain unchanged. No new installed runtime dependencies were required; registry primitives were adapted to existing utility conventions and inline-style restrictions.
- Exact-commit publication gate and strict CSP retained. Nothing pushed or deployed.

## Remaining limits

Physical-device and manual screen-reader testing were not performed. P3 font/raster differences noted above remain. Prior hero/design history is preserved in Git; local QA images are not published assets.
