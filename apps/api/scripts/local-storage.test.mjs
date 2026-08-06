import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const { checkLocalStorage, prepareLocalStorage } = await import('../dist/storage/local-storage.js');

const roots = [];

after(async () => {
  await Promise.all(roots.map((root) => rm(root, { recursive: true, force: true })));
});

describe('armazenamento local', () => {
  it('prepara toda a estrutura exigida antes de aceitar tráfego', async () => {
    const parent = await mkdtemp(resolve(tmpdir(), 'ceasaminas-storage-'));
    roots.push(parent);
    const root = resolve(parent, 'uploads');

    await prepareLocalStorage(root);
    await checkLocalStorage(root);

    for (const directory of ['news', 'procurements', 'temp']) {
      assert.equal((await stat(resolve(root, directory))).isDirectory(), true);
    }
  });
});
