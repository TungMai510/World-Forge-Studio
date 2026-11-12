import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createZipArchive } from '../../src/services/archive-service.js';

const here = dirname(fileURLToPath(import.meta.url));
const output = resolve(here, 'fixtures/classic-fantasy.wfpack');
const png = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pWQAAAAASUVORK5CYII=', 'base64'));
const manifest = {
  schemaVersion: '1.0',
  id: 'com.worldforge.classic-fantasy',
  name: 'Classic Fantasy Sample',
  version: '1.0.0',
  author: 'WorldForge QA',
  description: 'A tiny test pack used to verify the Asset Foundation pipeline.',
  license: 'CC0-1.0',
  compatibility: { minWorldForgeVersion: '1.0.0' },
  categories: ['mountains', 'forests'],
  assets: [
    { id: 'MNT-001', name: 'Sample Mountain', category: 'mountains', type: 'image', file: 'assets/mountains/mountain.png', mimeType: 'image/png', tags: ['mountain', 'nature'], defaultSize: { width: 180, height: 140 } },
    { id: 'FST-001', name: 'Sample Forest', category: 'forests', type: 'image', file: 'assets/forests/forest.png', mimeType: 'image/png', tags: ['forest', 'nature'], defaultSize: { width: 160, height: 160 } }
  ]
};
const archive = createZipArchive({
  'pack.json': JSON.stringify(manifest, null, 2),
  'assets/mountains/mountain.png': png,
  'assets/forests/forest.png': png,
  'LICENSE.txt': 'CC0-1.0 — sample QA assets.'
});
await mkdir(dirname(output), { recursive: true });
await writeFile(output, archive);
console.log(`Created ${output} (${archive.byteLength} bytes)`);
