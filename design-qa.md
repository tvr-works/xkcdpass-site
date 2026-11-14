# Page layout and responsive QA

final result: passed

The approved two-column continuation is implemented with a shared, standard type scale: 36px section headings, 18px reading/UI/code text, and 48px numerical results. These sizes apply at mobile and desktop widths. All explanatory detail, exact calculations, security assumptions, interactive counts, and the math disclosure are retained.

## Hero caption revision

Changed the illustration caption to “I can type that.” and updated its alt text. The built-in imagegen tool generated the replacement lettering; only its caption region was integrated into the existing transparent artwork. Saved asset: `public/assets/passphrase-thought.webp`, lossless WebP, 962 × 1363, 149,520 bytes. A decoded-pixel comparison against the prior committed asset found zero visible changes outside x=500–961, y=680–979. The original turtle, rocket, cactus, donut, thought cloud, figure, ground, alpha, and layout dimensions are retained.

Generated source: `/Users/tim.vanreenen/.codex/generated_images/01a1ba14-77ce-75a0-abc9-5a6d464ab3a6/exec-bd70ec22-7c87-4175-99c7-4e46631001a0.png`. Tool prompt: “Use case: text-localization. Edit target: the provided existing black-ink comic illustration. Change ONLY the handwritten caption from 'I can pass that along.' to the exact text 'I can type that.' Use two handwritten lines: 'I can' above 'type that.' in the same informal slanted handwritten lettering, same position to the right of the thinking stick figure's head, with the existing simple underline. Preserve all other artwork exactly: the turtle, rocket, cactus, donut, their thought cloud, the three thought dots, the stick figure touching its face, ground scribble, original stroke shapes and weights, original framing and relative positions. Do not redraw or stylize the icons or character. Keep the same 962 by 1363 portrait canvas and composition. The reference is shown on white only to make the black strokes visible. Deliver BLACK ink strokes on a genuinely TRANSPARENT background, including inside the thought bubble and enclosed shapes. No white paper/matte, no additional marks or text. Text verbatim: 'I can type that.'”

Evidence: `/private/tmp/xkcdpass-caption/desktop.jpg` (1440 × 1000) and `mobile.jpg` (390 × 844), density 1, in-app Browser; both inspected. No caption clipping, matte rectangle, missing artwork, or console warnings/errors. Viewport override reset and preview left open. `npm run check` passed all 54 Node tests and static/lint/type/build checks. Targeted render/responsive/keyboard/axe tests passed in Chromium and WebKit (4 checks), covering 320–1920px. No actionable P0/P1/P2 findings remain.

## Installation and footer revision

The latest user-approved structure is hero → entropy → usage → installation → footer. The installation strip and divider below the hero are removed. A dedicated installation section after usage reuses the existing section grid, 36px heading, 18px reading/code, copy command, and 96/128px spacing. Platform links are grouped beneath the command, and no longer appear in usage. Header and hero install anchors point to the complete section.

The footer now contains only “Inspired by xkcd #936.” (the comic reference is linked) and the TVR Works link. The separate GitHub, Original comic, and Open source footer links are removed as requested. Deployment smoke coverage now checks the original comic attribution instead of requiring the removed license link; canonical application/download and security checks remain.

Current evidence: `/private/tmp/xkcdpass-install-section/desktop-install.jpg` (1440 × 1000), `mobile-install.jpg` (390 × 844), `narrow-install.jpg` (320 × 844), and `hero-transition.jpg` (1440 × 1000), all at density 1 in the in-app Browser. Each was inspected. Default four words, math closed. The desktop view shows usage, installation, and the simplified footer; mobile views show the grouped command/platform links and wrapping at narrow widths. The hero capture confirms the whitespace transition without a divider or install strip. No actionable P0/P1/P2 findings remain.

Verification: `npm run check` passed all 54 Node tests and static/lint/type/build checks. Full Chromium/WebKit suite: 15 passed, one expected clipboard-permission skip. Checks cover desktop/mobile install anchor destinations, section order, platform-link placement, absent divider, two-link footer, responsive overflow, shared type/padding, keyboard and axe, no-JavaScript content, clipboard success/failure, and copy feedback contained above the footer. No in-app console warnings/errors. Local preview remains open at `#install`, with temporary viewport overrides reset. Physical-device and manual screen-reader testing remain unverified.

The records below describe earlier iterations and their evidence.

## Earlier whole-page pass

The latest pass covers header, hero, terminal, install strip, lesson, usage, and footer on desktop, tablet, and mobile. The accepted layout, content, illustration breakpoint, and illustration height remain intact.

1. **Header and hero — passed.** Supporting labels now share 14px/20px metadata, header actions match the 16px hero actions, and the subtitle uses the same 18px/28px reading role as the lesson. Hero heading/display steps remain responsive.
2. **Terminal and installation — passed.** Mobile command/output now use 18px instead of 14/16px. All three main panels share 16px padding below 640px and 32px above it. Tight tracking keeps the joined hero passphrase on one line at 320px. Terminal title space is reserved beside the window controls; narrow-screen overlap is fixed. Header/copy buttons have 44px targets. Copy feedback takes a real grid row and preserves the following section gap when it wraps; an empty live region remains screen-reader accessible without taking layout space.
3. **Lesson, usage, footer — passed.** Existing 36px headings, 18px reading/UI/code, 48px results, 96/128px section gaps, and responsive grouping are retained. Duplicate footer font/spacing declarations were consolidated. Expanded six-word math, complete usage output, and all footer links remain readable.

Current-run screenshot evidence is in `/private/tmp/xkcdpass-final-polish/`, captured through the in-app Browser at density 1:

- `01-desktop-hero-before.jpg` / `01-desktop-hero-after.jpg`: 1440 × 1000, default four words, disclosure closed.
- `02-desktop-continuation-before.jpg` / `02-desktop-continuation-after.jpg`: 1440 × 1000, lesson through usage. `10-desktop-footer-after.jpg` includes the complete desktop footer.
- `03-mobile-hero-before.jpg` / `03-mobile-hero-after.jpg`: 390 × 844, default hero.
- `04-mobile-install-before.jpg` / `04-mobile-install-after.jpg`: 390 × 844, install strip and lesson copy.
- `05-mobile-usage-before.jpg` / `05-mobile-usage-after.jpg`: 390 × 844, flags/example. `09-mobile-footer-after.jpg` includes the complete mobile footer.
- `06-tablet-hero-before.jpg` / `06-tablet-hero-after.jpg`: 768 × 1000, preserved illustration column. The later title-space fix does not change this viewport's layout.
- `07-narrow-hero-after.jpg` exposed the remaining title/control overlap at 320 × 844. `07-narrow-hero-final.jpg` confirms the fix, with no text overlap or page overflow.
- `08-mobile-math-after.jpg`: 390 × 844, six words selected, math expanded. Default-four/closed state restored for handoff.

All accepted screenshots were inspected at capture time. One desktop capture initially retained an earlier scroll position; it is used only as footer evidence. The hero was recaptured at the correct top position. No stretched composites or off-screen full-page renders support this pass.

Verification: `npm run check` passed all 54 Node tests plus format, Oxlint/shadcn lint, TypeScript, static validation, and build budgets. Full Chromium/WebKit suite: 15 passed, one expected WebKit clipboard-permission skip. Extended acceptance checks cover shared type/padding roles and clear terminal controls at 320, 390, 640, 768, 1024, and 1374px; existing overflow/hero-placement coverage spans 320–1920px. Clipboard rejection is checked at 320, 640, and 1440px for contained feedback and unchanged section gaps. Keyboard, axe, no-JavaScript, metadata, CSP, and asset delivery checks pass. Manual six-word disclosure interaction passes; no in-app console warnings/errors. Preview remains open with the temporary viewport override reset.

No actionable P0/P1/P2 findings remain. Physical-device and manual screen-reader testing remain outside this pass. The comparison below records the earlier selected-layout implementation; its original screen captures are historical context.

## Visual truth and evidence

- Selected reference: `/Users/tim.vanreenen/.codex/generated_images/01a1ba14-77ce-75a0-abc9-5a6d464ab3a6/exec-0ecbce44-0bb4-4fbb-bf2a-94cd54dfbf82.png`, 1374 × 1145 pixels.
- Local implementation: <http://127.0.0.1:4175/#strength>.
- Desktop screenshot: `/private/tmp/xkcdpass-grouped-qa/desktop-final.jpg`, 1374 × 1154 pixels, captured in the in-app Browser at 1374 × 1400 CSS pixels, density 1. The screenshot is cropped from the painted viewport, starting 80px above the lesson through the footer. Default four words selected, math closed.
- Full-view comparison: `/private/tmp/xkcdpass-grouped-qa/comparison-final.png`. Source left, implementation right, both displayed at 687px wide. Nine pixels of source-height difference are padded, never stretched. Both complete sections and the complete footer are visible.
- Focused explorer comparison: `/private/tmp/xkcdpass-grouped-qa/entropy-focused.png`. Source left, implementation right, native pixel scale. Confirms the control/formula/result/summary grouping and the requested typography normalization.
- Mobile evidence at 390 × 844 CSS pixels, density 1: `/private/tmp/xkcdpass-grouped-qa/mobile-default.jpg` (lesson copy), `mobile-expanded.jpg` (six-word result and math), `mobile-math.jpg` (remaining security detail), and `mobile-usage.jpg` (flags, platform links, worked example).
- Narrow evidence: `/private/tmp/xkcdpass-grouped-qa/narrow-default.jpg`, 320 × 844 CSS pixels, density 1. The 48px result wraps between number and unit while remaining inside its panel. Controls retain 18px text and 44px targets.

## Findings and comparison history

- No actionable P0/P1/P2 findings remain in the first completed visual comparison. No visual-fix iteration was necessary.
- The reference's inconsistent raster type sizes are intentionally replaced with the approved three-step scale. This changes heading wrapping and reduces the calculation's display size. Reading text, control labels, monospace, flag notes, links, and footer share the same 18px size.
- Established Geist/native monospace, max-width container, component radii, background asset, and semantic colors remain the design authority. The reference's exact type metrics, glow placement, and border curvature are intentional adaptations to the existing site rather than outstanding defects.

## Required fidelity surfaces

- **Fonts and hierarchy:** shared `reading-text` utility uses Tailwind `text-lg` and `leading-7`; headings use `text-4xl` with tight leading; results use `text-5xl`. No responsive font-size variation in the continuation. Standard superscript/subscript math notation remains semantic. Geist is self-hosted; native monospace fallback is unchanged. Weight and color distinguish code, output, labels, and links without adding sizes. No clipping or truncation observed.
- **Spacing and layout:** shared 5/7 column split from 1024px, 48px desktop column gap, 40px stacked gap, 96/128px whitespace between sections, and 16/32px panel padding. The explorer groups inputs, inline multiplication, result, bits, and disclosure inside one translucent frame. Usage groups plain flag/default pairs and platform links on the left, example/note on the right. No new section HRs. The former large brace and outlined static values are removed.
- **Colors and tokens:** existing midnight navy, white, muted gray, icy blue, translucent terminal surface, selected control, and focus ring tokens. No new gradients or inline style exceptions. The background continues at its width-preserving aspect ratio.
- **Assets:** existing hero illustration and background reused unchanged. The selected layout has no brace, so its unused raster asset and public-file entries were removed. No generated asset or custom drawing was added.
- **Content:** public EFF wordlist, independent random selection, known list/count assumptions, exact integer counts, logarithmic entropy explanation, Go `crypto/rand`, and the warning about self-chosen phrases all remain. Both flag examples/defaults, fixed-separator note, platform links, and footer remain. Hero still shows the default call and joined output.

## Interaction and verification

- `npm run check` passed: runtime, formatting, Oxlint/shadcn lint, TypeScript, static HTML/reference/indexing validation, artifact budgets, and all 54 Node tests.
- Full Chromium/WebKit browser suite: 15 passed, one intentional WebKit clipboard-permissions skip. Includes navigation, clipboard success/rejection, keyboard controls, screen-reader summary, exact math, no-JavaScript content, axe accessibility, security headers/CSP, true 404, and indexing metadata.
- New observable acceptance check verifies the actual computed type sizes and explorer containment at 320, 390, 1024, and 1374px. It exercises every word count with math expanded and checks page overflow. Existing responsive/hero checks cover 320, 360, 390, 639, 640, 767, 768, 1023, 1024, 1279, 1280, 1422, and 1920px.
- In-app Browser manually verified desktop grouping, mobile six-word selection and expanded math, narrow four-word result, complete usage output, and console health. No warnings/errors. Temporary viewport override reset; local preview remains open.
- Exact counts and entropy model unchanged: 3 words 38.8 bits, 4 words 51.7 bits, 5 words 64.6 bits, 6 words 77.5 bits. BigInt preserves exact sequence counts.
- Build: approximately 800 KiB raw total, 89.7 KiB gzip JavaScript, 27.7 KiB raw / 5.6 KiB gzip CSS. No dependencies or budget increases. Strict CSP retained.

## Implementation checklist

- [x] Paired desktop sections and stacked mobile flow.
- [x] Consistent shared typography and whitespace.
- [x] Preserve explanatory detail and accessible interactions.
- [x] Visual comparison, static checks, browser acceptance checks.
- [x] Local incremental commits; nothing pushed or deployed.

## Follow-up polish and limits

No P3 fix is required for this scope. Physical-device and manual screen-reader testing were not performed. Native monospace metrics vary by OS. Reference and local QA screenshots are evidence only, not published assets. Earlier design history remains in Git.
