import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createZipArchive } from '../../src/services/archive-service.js';
import { createFixturePng } from './fixture-png.js';

const here = dirname(fileURLToPath(import.meta.url));
const output = resolve(here, 'fixtures/classic-fantasy.wfpack');
const mountainPng = createFixturePng(96, 64, 'mountain');
const forestPng = createFixturePng(64, 96, 'forest');
const manifest = {
  schemaVersion: '1.0',
  id: 'com.worldforge.classic-fantasy',
  name: 'Classic Fantasy Sample',
  version: '1.0.0',
  author: 'WorldForge QA',
  description: 'A visual QA pack with differently sized mountain and forest PNG fixtures.',
  license: 'CC0-1.0',
  compatibility: { minWorldForgeVersion: '1.0.0' },
  categories: ['mountains', 'forests'],
  assets: [
    { id: 'MNT-001', name: 'Sample Mountain', category: 'mountains', type: 'image', file: 'assets/mountains/mountain.png', mimeType: 'image/png', tags: ['mountain', 'nature'], defaultSize: { width: 180, height: 120 } },
    { id: 'FST-001', name: 'Sample Forest', category: 'forests', type: 'image', file: 'assets/forests/forest.png', mimeType: 'image/png', tags: ['forest', 'nature'], defaultSize: { width: 100, height: 150 } }
  ]
};
const archive = createZipArchive({
  'pack.json': JSON.stringify(manifest, null, 2),
  'assets/mountains/mountain.png': mountainPng,
  'assets/forests/forest.png': forestPng,
  'LICENSE.txt': 'CC0-1.0 — generated technical QA artwork.'
});
await mkdir(dirname(output), { recursive: true });
await writeFile(output, archive);
console.log(`Created ${output} (${archive.byteLength} bytes)`);
