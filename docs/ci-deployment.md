# CI and Cloudflare deployment

## Publication contract

The intended repository is public `tvr-works/xkcdpass-site`. This is the marketing site, not the xkcdpass application/library. Cloudflare's native Git integration remains the publisher: `main` publishes production and other repository branches publish previews. GitHub stores no Cloudflare API token or deploy hook.

These files prepare the rollout; checking them in does not establish that hosting has been configured or that a live gate test has passed. The cutover owner must record those results after verification.

Keep the existing Personal-account Pages project `xkcdpass-site` (ID `3cc5b841-fa26-4b25-b6b3-3c3828eeeecb`), its deployment history, `xkcdpass.tvr.works`, and `xkcdpass-site.pages.dev`. No DNS change or replacement project is required. Transfer/reconnection and visibility changes are coordinated separately.

After the transferred repository is public, its Cloudflare GitHub App access is verified, and validated source is on `main`, configure:

| Setting                                                | Value                                   |
| ------------------------------------------------------ | --------------------------------------- |
| Git repository                                         | `tvr-works/xkcdpass-site`               |
| Production branch, in project and source configuration | `main`                                  |
| Automatic production deployments                       | Enabled                                 |
| Preview branches                                       | All non-production repository branches  |
| Root directory                                         | Repository root                         |
| Build command                                          | `npm run ci:gate && npm run build`      |
| Output directory                                       | `dist`                                  |
| Runtime                                                | Checked-in `.node-version` and `.npmrc` |

Pause automatic builds before disconnecting/reconnecting the source, preserve all existing project settings, and verify the readback before resuming. The organization's Cloudflare App uses selected-repository access. Identity verification may require Tim to complete the GitHub prompt. Rebase older branches onto the migration; branches missing the gate or workflow must fail rather than publish unchecked source. Migration commit messages start with `[CF-Pages-Skip]` to avoid an unintended publication before the coordinated cutover.

## Validation

`ci.yml` runs on every branch push, PR, and manual request. Only a push run can authorize publication. The workflow uses read-only repository permissions, pinned action commits, disabled checkout credential persistence, per-ref cancellation, and a twelve-minute validation timeout. It runs:

- Exact Node/npm runtime checks and lockfile installation without lifecycle scripts.
- High/critical dependency auditing, formatting of maintained tooling/docs, TypeScript and JavaScript linting (including shadcn rules), type checking, HTML/reference/indexing validation, and gate contract tests using Node's test runner.
- An allowlisted static build with budgets, followed by Chromium desktop and narrow WebKit tests against that artifact.

Blacksmith's organization installation covers all repositories. Availability for this repository was established by the successful migration-branch run recorded below. The browser container uses Microsoft's Playwright `1.64.1` Noble image pinned by manifest digest; the installed test package must match. Update tag, digest, package version, lockfile, and compatibility assertion together. There is no browser-install/apt step or browser cache in CI; setup-node caches npm downloads.

Browser coverage includes the prerendered hero and compiled assets, example/install anchor navigation, real Chromium clipboard writes and rejected writes, static content/navigation without JavaScript, skip-link navigation, widths from 320 to 1920px (including breakpoints), single-line passphrase output, desktop/mobile axe scans, metadata/XML, strict CSP hashes, missing-page status, and artifact checksums. Physical devices and manual screen-reader testing remain separate checks. CI rejects focused tests. Failure screenshots, traces, and HTML reports are retained for seven days. Successful non-PR runs retain the tested `dist/` artifact for seven days.

Budgets in `build-budgets.json` bound JavaScript, CSS, HTML, images, and total raw output. Text groups also have deterministic gzip limits. These are build guards, not measurements of CDN transfer size. Investigate changes before increasing limits. Output validation rejects unexpected files and symlinks; dependencies, configuration, tests, scripts, and Git metadata must never enter `dist/`.

## Credential-free gate

`scripts/wait-for-ci.mjs` follows the hardened company-site protocol. It reads Cloudflare's full `CF_PAGES_COMMIT_SHA` and `CF_PAGES_BRANCH`, queries public GitHub Actions for `ci.yml`, and accepts only successful push CI for that exact SHA and branch. It chooses the newest run number and rerun attempt rather than trusting response order or an earlier success. It rejects missing/invalid context, malformed responses, failed/canceled/skipped CI, denied/rate-limited access, network errors, and late responses.

The gate has a sixteen-minute deadline, longer than validation's twelve-minute timeout, with bounded fetch timeouts and polling backoff of 15, 30, then 60 seconds. Queue time can still exhaust the deadline. GitHub's unauthenticated allowance is 60 requests/hour per originating IP, so concurrent builds sharing an egress IP can be rate-limited. Such failures block publication. During the coordinated company-site rollout on November 9, a preview passed this protocol but a subsequent production lookup was denied with HTTP 403; publication stopped and the existing production artifact remained live. The coordinator reported this shared-IP quota event during this rollout. Keep the gate closed and retry Pages after successful CI and quota recovery. Repository visibility must remain public for this approach. Reassess the integration before making it private.

CI cancellation does not cancel Cloudflare builds. A canceled run cannot authorize publication; no workflow success from another SHA, branch, PR, or manual dispatch can substitute. A repository-controlled gate assumes trusted repository writers and is not tamper-proof against someone who can modify the workflow or gate. It does not prove that a successful SHA is still the branch tip or that two Cloudflare builds finish in order. Before retrying an old build, compare its SHA with the current branch head.

Cloudflare compiles and prerenders the validated React/Vite source again rather than deploying the CI artifact byte-for-byte. The server render bundle is temporary and never published. `deployment.json` identifies the commit, branch, and checksums of the output files. Production remains publicly indexable with the existing canonical, robots, and sitemap. The redesigned hero replaces the old page; below-the-fold content is deferred. Keyboard focus, responsive layouts, accessible clipboard feedback, and the scrolling install command remain covered. Pages' `X-Robots-Tag: noindex` protects preview/immutable deployment URLs; verify this on the live URLs rather than assuming a local server proves provider behavior. A root `404.html` prevents Pages' default SPA fallback and marks missing pages `noindex`.

## Acceptance and recovery

Before declaring the rollout complete:

1. Verify repository identity, public visibility, organization App access, and successful push CI on the intended `main` SHA.
2. Read back the existing Pages project/source, branch controls, build command, output, domains, and preserved deployment history.
3. On a disposable preview branch, introduce a failing gate-covered test and observe CI failure stopping the Cloudflare build before publication. Confirm production remains unchanged. Remove the failure on that branch and prove successful exact-SHA preview publication.
4. Prove successful exact-SHA `main` publication, then run the hosted smoke check on the immutable deployment URL and production domain. Keep test failures out of `main`.
5. Record the CI links, deployment IDs, logs showing gate acceptance/rejection, and smoke results in the migration record below.

```sh
DEPLOYMENT_ENV=production \
DEPLOYMENT_URL=https://DEPLOYMENT_ID.xkcdpass-site.pages.dev \
EXPECTED_SHA=FULL_COMMIT_SHA npm run verify:deployment
```

For preview, set `DEPLOYMENT_ENV=preview`, `EXPECTED_BRANCH` to the full repository branch name, and optionally `PREVIEW_ALIAS=https://BRANCH.xkcdpass-site.pages.dev`. Production requires branch `main`. Preview verification never requires production to match a feature-branch SHA. The immutable deployment URL uses Pages' eight-character hexadecimal deployment prefix.

Smoke checks assert the published commit, public-file checksums, canonical/indexing policy, generated CSP, content/referrer/framing headers, robots MIME/content, real nested 404s, and absence of development files. Each origin has three bounded attempts for edge propagation. This script requires the new manifest/headers; it cannot verify the pre-migration site.

Failed CI or a denied/unreadable gate leaves the last successful publication in place. A later CI rerun does not automatically retry a failed Pages build: after verifying successful CI for the same branch/SHA and checking the branch head, retry through Pages. Prefer a revert through the same CI/gate for content recovery. Emergency Pages rollback restores a previous artifact, not GitHub ownership, Git connection, or project settings; record the action and reconcile `main` afterward. The native Cloudflare Pages check reports publication separately from Actions validation.

## Migration record

On November 9, 2026, the disclosure preflight reviewed all six existing commits and fourteen historical file blobs, including deleted text/assets. The official Gitleaks `v8.30.1` Darwin arm64 release was checked against its published SHA-256 checksums, then run with fully redacted output on Git history and separately on all historical blobs. Both scans exited successfully with zero findings. Current sharing artwork and deleted `assets/hero.png`/`assets/mockup.png` were inspected visually; no private material was found. Existing author identity/email remains in Git metadata. Authenticated GitHub inventory showed zero issues, PRs, releases, Actions runs, and artifacts, with wiki/discussions disabled. Local redacted evidence is under `/private/tmp/xkcdpass-disclosure-jzopix62`; it is not part of the public artifact.

The coordinator completed the transfer to public `tvr-works/xkcdpass-site`, retaining repository ID `1220528012`. Local `origin` now uses `https://github.com/tvr-works/xkcdpass-site.git`; remote `main` was verified at `b1f8ecd5958dc6425e0da87b33e7fedf303f047e` before migration implementation. The xkcdpass application/library was not transferred or modified by this work.

[Blacksmith push validation](https://github.com/tvr-works/xkcdpass-site/actions/runs/42659984563) passed on November 9 for `4c982914ab75281558038c51669dad1cd1b261e8` on `codex/ci-pages-gate`. The run used `blacksmith-4vcpu-ubuntu-2404`, passed all 45 contract/static tests, passed 13 browser cases with one documented WebKit clipboard skip, reported zero audit vulnerabilities, and uploaded the tested artifact. The exact-SHA, exact-branch CLI gate then accepted that real push run using the anonymous API. This proves the GitHub side and CLI protocol, not Cloudflare publication. The preceding run exposed a CI-container Git ownership restriction; using platform-provided commit identity fixed it, with regression coverage that builds without Git on PATH.

Local desktop Chromium at 1440×900 and mobile WebKit at 390×844 verified page identity, no runtime errors, and no horizontal overflow. Browser automation used Playwright because the Browser plugin was unavailable. Physical devices, manual screen readers, and real WebKit clipboard permission flows remain unverified. Local screenshot evidence is in `/private/tmp/xkcdpass-disclosure-jzopix62/qa-desktop.png` and `qa-mobile.png`.

The coordinator saved and freshly verified selected-repository access for the existing Cloudflare GitHub App. Main integration `ce2dc99d029b1eb9815f0426d7e7c02c7c0d8dd9` passed [push CI](https://github.com/tvr-works/xkcdpass-site/actions/runs/42660854957) before hosting cutover. The existing Pages Git source was disconnected and reconnected through the documented source endpoints, then read back as `tvr-works/xkcdpass-site` with the same repository/project IDs, domains and deployment history. Both production-branch fields remain `main`, production automation remains enabled, and all branch previews remain enabled. Build command is `npm run ci:gate && npm run build`, output `dist`, root unchanged.

The negative preview acceptance used disposable branch `codex/ci-publication-verification`, commit `860d3fb6ec9db6758be71663695cb3514f1cce5f`, and [intentionally failing push CI](https://github.com/tvr-works/xkcdpass-site/actions/runs/42661491097). Cloudflare deployment `94bc41cc-dd79-4e96-be25-5ad420fc6cd3` cloned the organization repository and rejected the failed run at the gate. Its deployment stage never started, and canonical production remained `135e43dc-50cc-4e22-ba05-0381005b3abf`. The intentional failure stays out of main. Successful preview and production publications are verified separately against their exact commits and immutable URLs.

## References

- [GitHub workflow-run API](https://docs.github.com/en/rest/actions/workflow-runs#list-workflow-runs-for-a-workflow)
- [GitHub unauthenticated rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)
- [Pages branch controls](https://developers.cloudflare.com/pages/configuration/branch-build-controls/)
- [Pages build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/)
- [Pages preview indexing](https://developers.cloudflare.com/pages/configuration/preview-deployments/)
- [Pages 404 behavior](https://developers.cloudflare.com/pages/configuration/serving-pages/)
- [Playwright image compatibility](https://playwright.dev/docs/docker)
