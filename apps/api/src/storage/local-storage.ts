import { constants } from 'node:fs';
import { access, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

export const UPLOAD_ROOT = resolve(process.cwd(), 'uploads');
export const NEWS_UPLOAD_DIRECTORY = resolve(UPLOAD_ROOT, 'news');
export const PROCUREMENT_UPLOAD_DIRECTORY = resolve(UPLOAD_ROOT, 'procurements');
export const TEMP_UPLOAD_DIRECTORY = resolve(UPLOAD_ROOT, 'temp');

export async function prepareLocalStorage(root = UPLOAD_ROOT) {
  await Promise.all(
    ['news', 'procurements', 'temp'].map((directory) =>
      mkdir(resolve(root, directory), { recursive: true }),
    ),
  );
}

export async function checkLocalStorage(root = UPLOAD_ROOT) {
  await access(root, constants.R_OK | constants.W_OK);
}
