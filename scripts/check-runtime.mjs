import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
assert.equal(process.versions.node, pkg.engines.node, 'Use the pinned .node-version runtime.');
const npm =
  process.env.npm_config_user_agent?.match(/\bnpm\/([^ ]+)/)?.[1] ??
  execFileSync('npm', ['--version'], { encoding: 'utf8' }).trim();
assert.equal(npm, pkg.engines.npm, 'Use the pinned npm version.');
assert.equal(pkg.packageManager, `npm@${npm}`);
assert.equal(
  readFileSync(new URL('../.node-version', import.meta.url), 'utf8').trim(),
  pkg.engines.node,
);
