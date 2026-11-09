# xkcdpass marketing site

Static HTML, CSS, and JavaScript for <https://xkcdpass.tvr.works>. This repository is separate from the [xkcdpass application](https://github.com/tvanreenen/xkcdpass). Its application links and Homebrew command remain unchanged by the marketing repository transfer.

Use Node `26.13.0` and npm `11.20.0`:

```sh
npm ci --ignore-scripts
npm run check
npm run test:browser
```

For local browser tests, install the matching Chromium and WebKit browsers once with `npx playwright install chromium webkit`. CI uses the pinned Playwright image, which already includes browsers and Linux dependencies.

`npm run build` validates the source and copies only the declared public files into `dist/`, generating security headers and a commit/checksum manifest. `npm run preview` serves that artifact at `http://127.0.0.1:4175`. The preview server applies this site's generated header rules for local testing; hosted verification checks actual Cloudflare delivery separately.

There are no browser runtime dependencies or compilation framework. Formatting covers the automation, configuration, and documentation. Existing public files are excluded from formatter rewrites to preserve the published source. JavaScript linting includes `main.js`; HTML parsing, local reference checks, metadata tests, and browser coverage check the static site. There is no TypeScript source requiring a type-check step.

See [CI and deployment](docs/ci-deployment.md) for the rollout settings, publication gate, indexing policy, and recovery procedure.
