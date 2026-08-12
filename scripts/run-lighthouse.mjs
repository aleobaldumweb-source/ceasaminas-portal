import { chromium } from '@playwright/test';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const cli = require.resolve('@lhci/cli/src/cli.js');
const result = spawnSync(process.execPath, [cli, 'autorun'], {
  cwd: process.cwd(),
  env: { ...process.env, CHROME_PATH: chromium.executablePath() },
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
