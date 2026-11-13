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

## Tablet breakpoint follow-up

At the user's request, side-by-side illustration placement now starts at `md` (48rem / 768px). At 768–1023px, the copy spans the full grid width; the terminal and a 192px illustration share the next row with a 24px column gap. At `lg` (1024px), the existing 320px artwork and desktop grid return. Below 768px, the art remains below the terminal. No negative offsets or new type sizes were introduced.

Production-browser evidence: `/private/tmp/xkcdpass-md-layout/tablet-768.jpg`, 768 × 1024 viewport pixels at density 1. The command/output fit, the illustration is beside the terminal, and the install strip remains reachable. In-app Browser logs contained no warnings/errors. Viewport override was reset and preview left open.

Focused Chromium and WebKit responsive/keyboard/axe tests both passed. The existing width loop now also verifies the illustration is beside the terminal from 768px and below it at narrower widths, including 767/768 and 1023/1024 boundaries. Build/typecheck, lint, and formatting passed. Desktop/mobile appearance outside the changed tablet interval is preserved. Final result remains passed.

### Illustration size correction

The user clarified that changing the stacking threshold should not shrink the illustration. Removed the 192px tablet sizing override. Artwork now retains the prior 288 × 408px tablet size across 767/768px; its 320px desktop width is unchanged. The tablet grid reserves 288px for it, uses a 16px column gap and 16px terminal horizontal padding, and retains full-width headline/copy. The `--separator -` flag group stays together when the narrower terminal command wraps. No copy or font sizes changed.

Current evidence: `/private/tmp/xkcdpass-md-layout/tablet-768-restored.jpg`, 768 × 1024 at density 1. Reviewed the rendered page and measured the illustration at 288 × 408.05 CSS pixels. A new continuity assertion compares art height immediately below and above the md boundary. Focused initial-render and responsive/keyboard/axe tests pass in both Chromium and WebKit (4 tests); source lint, build/typecheck, and format checks pass. This supersedes the smaller-artwork evidence above. Final result remains passed.

### Persistent image column clarification

The user clarified that copy must wrap in its own left column throughout the side-by-side range. Removed the tablet copy's full-width span and placed the illustration in the right column spanning both hero rows from 768px upward. It retains its existing 288 × 408px tablet size. Below 768px, the whole image moves below the copy/terminal. This supersedes the full-width tablet-copy statements above.

Verified at 768 × 1024 in the in-app Browser: copy right edge 432px, artwork left edge 448px, artwork dimensions 288 × 408.05px; heading/subtitle wrap within the left column. Evidence: `/private/tmp/xkcdpass-md-layout/tablet-own-column.jpg`. Chromium and WebKit responsive/keyboard/axe checks passed (2 tests); the layout assertion now checks the artwork is beside both copy and terminal throughout the side-by-side range. Lint, build/typecheck, and formatting pass. Final result remains passed.
