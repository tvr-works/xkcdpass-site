# Typography and spacing correction QA

final result: passed

The user identified nonstandard type sizing and poor whitespace in the initial implementation. This review supersedes the earlier pixel-oriented acceptance: retain the approved composition, imagery, and copy, while using the framework's normal type scale and spacing rhythm.

## Evidence

- Original visual target: `/Users/tim.vanreenen/.codex/generated_images/01a1ba14-77ce-75a0-abc9-5a6d464ab3a6/exec-f70925b7-465d-4264-a5bd-047621b06831.png`, 1422 × 1106 pixels.
- Previous implementation: `/private/tmp/xkcdpass-hero-qa/desktop-final.jpg`, 1422 × 1119 pixels.
- Current implementation: `/private/tmp/xkcdpass-type-spacing/desktop.jpg`, 1422 × 1106 viewport pixels, density 1, default route and neutral interaction state, <http://127.0.0.1:4175/>.
- Combined before/after: `/private/tmp/xkcdpass-type-spacing/comparison.png`. Previous implementation at left, corrected implementation at right. Previous capture cropped to the same 1106-pixel viewport; both displayed at 50% with no layout rescaling.
- Focused original/mock terminal and corrected terminal: `/private/tmp/xkcdpass-type-spacing/terminal-comparison.png`. Native-size crops, no stretching; the smaller window is intentional because excess fixed height was removed.
- Mobile: `/private/tmp/xkcdpass-type-spacing/mobile.jpg` and `mobile-install.jpg`, 390 × 844, density 1. UI readback and production-browser screenshots reviewed; the final subsequent desktop-only terminal scale change does not affect mobile.

## Findings, fixes, and comparison history

- [P2, fixed] Disconnected type sizes: 26px buttons/install code, 20px footer, viewport-based custom body/terminal sizes, 750 font weight, and unusually tight headline leading. Replaced with Tailwind's named type utilities and regular/medium/semibold/bold weights. Display headings use normal line height; no fluid font-size formulas remain.
- [P2, fixed] Crowded text and actions: subtitle margin was 0.6rem, action margin 0.15rem. Established 24px heading-to-body spacing and 32px body-to-actions spacing, with 48px before the terminal and 64px before installation.
- [P2, fixed] Fragile image positioning and empty terminal: removed 103% image width, negative 9.1rem offset, fixed terminal minimum heights, and separate 700/1000/1440 tweaks. Desktop uses a real grid with the illustration spanning the copy/terminal rows and aligning at the bottom. Smaller widths follow normal document order. The window fits its content.
- Initial corrected comparison confirmed hierarchy and rhythm at desktop and mobile. Final desktop review retained terminal prominence using standard 30px command and 48px output at the xl breakpoint, while keeping surrounding controls restrained. Responsive/axe tests were rerun in both engines after this adjustment.
- Final combined/focused review: no actionable P0/P1/P2 findings remain. The original mockup's exact UI sizes and vertical placements are intentionally superseded by the user's correction.

## Required fidelity surfaces

- **Typography:** Geist retained. UI/navigation/footer 14px; buttons 14/16px; body 18/20px. Headline uses 36/60/72/96px at standard breakpoints. Terminal command uses 14/20/24/30px; output 16/24/30/48px. All values come from named Tailwind utilities. Native monospace metrics still vary by OS (P3).
- **Spacing/layout:** shared container and 4px-based Tailwind spacing utilities. Semantic gaps between copy, actions, demonstration, installation, and footer. Terminal no longer reserves unused vertical space. Image has a real grid track. Desktop and mobile controls remain reachable without page overflow.
- **Colors/tokens:** existing dark navy, white, muted gray, icy-blue, translucent terminal, focus, and traffic-light tokens preserved. Header link hover excludes button anchors so it cannot override primary button contrast.
- **Images:** exact existing generated background and four-object thought-bubble illustration reused without new drawings, distortion, or crop. Artwork and reaction remain recognizable. Lucide UI icons retained.
- **Content:** approved headline/subtitle, invocation, four-word output, Homebrew command, and xkcd attribution unchanged. No terminal caption, new sections, or below-the-fold content added.

## Verification

- `npm run check`: formatting, Oxlint/shadcn lint, TypeScript, source/indexing validation, build budgets, and 49 Node tests passed.
- Full `npm run test:browser`: 11 passed; one intentional WebKit clipboard permission skip. Final desktop terminal type adjustment followed by a focused Chromium/WebKit responsive, keyboard, and axe rerun: 2 passed.
- Breakpoints checked at 320, 360, 390, 639, 640, 767, 768, 1023, 1024, 1279, 1280, 1422, and 1920 pixels, including single-line passphrase output. Keyboard scrolling now checks the genuinely overflowing install command at 320px, rather than assuming overflow at 390px after reducing its font size.
- Browser path: available in-app Browser through CUA. Production preview identity and meaningful content confirmed, no framework overlay, no console errors/warnings. Mobile Install anchor and actual Copy action verified; button changed to Copied and announced Install command copied. Automated clipboard success/rejection and no-JavaScript content remain covered.
- Final production build passed with strict CSP, public metadata/robots/sitemap, true 404, checksums, and static publication gate intact. No deployment performed.

## Remaining limits

Manual screen-reader and physical-device checks were not performed. Native monospace glyphs and original generated ink contours retain minor P3 differences from the reference. The earlier site remains in Git for later below-the-fold selection. Local screenshots are review evidence, not public assets.
