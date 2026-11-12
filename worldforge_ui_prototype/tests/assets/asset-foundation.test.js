import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createZipArchive, readZipArchive } from '../../src/services/archive-service.js';
import { validateAssetPackManifest } from '../../src/assets/asset-pack-validator.js';
import { AssetRegistry } from '../../src/assets/asset-registry.js';
import { AssetLoader } from '../../src/assets/asset-loader.js';
import { AssetPackService } from '../../src/assets/asset-pack-service.js';
import { createFixturePng } from './fixture-png.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixtureDir = resolve(here, 'fixtures');
const fixturePath = resolve(fixtureDir, 'classic-fantasy.wfpack');
const png = createFixturePng(96, 64, 'mountain');
const forestPng = createFixturePng(64, 96, 'forest');
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

function createSampleArchive(overrides = {}) {
    const packManifest = { ...manifest, ...overrides };
    const files = {
        'pack.json': JSON.stringify(packManifest, null, 2),
        'assets/mountains/mountain.png': png,
        'assets/forests/forest.png': forestPng,
        'LICENSE.txt': 'CC0-1.0 — sample QA assets.'
    };
    return createZipArchive(files);
}

let fixtureBytes;
test('fixture: generate and persist a real .wfpack archive', async () => {
    await mkdir(fixtureDir, { recursive: true });
    fixtureBytes = createSampleArchive();
    await writeFile(fixturePath, fixtureBytes);
    assert.ok(fixtureBytes.byteLength > png.byteLength);
    assert.match((await readFile(fixturePath)).subarray(0, 4).toString('hex'), /^504b0304$/);
});

test('archive: read generated ZIP and recover manifest and image bytes', () => {
    const files = readZipArchive(fixtureBytes);
    assert.ok(files.has('pack.json'));
    assert.deepEqual(files.get('assets/mountains/mountain.png'), png);
    assert.deepEqual(files.get('assets/forests/forest.png'), forestPng);
    assert.equal(JSON.parse(new TextDecoder().decode(files.get('pack.json'))).id, manifest.id);
});

test('validator: accepts a valid manifest and returns normalized metadata', () => {
    const result = validateAssetPackManifest(manifest);
    assert.equal(result.name, manifest.name);
    assert.deepEqual(result.assets[0].tags, ['mountain', 'nature']);
});

test('validator: rejects path traversal', () => {
    const invalid = structuredClone(manifest);
    invalid.assets[0].file = 'assets/../../outside.png';
    assert.throws(() => validateAssetPackManifest(invalid), /safe relative path/);
});

test('validator: accepts optional usage capabilities and preserves unknown strings', () => {
    const extended = structuredClone(manifest);
    extended.assets[0].usages = ['stamp', 'scatter', 'future-capability'];
    const result = validateAssetPackManifest(extended);
    assert.deepEqual(result.assets[0].usages, ['stamp', 'scatter', 'future-capability']);
    const legacy = validateAssetPackManifest(manifest);
    assert.equal(Object.hasOwn(legacy.assets[0], 'usages'), false);
});

test('validator: rejects malformed usage capability metadata', () => {
    const invalid = structuredClone(manifest);
    invalid.assets[0].usages = ['stamp', ''];
    assert.throws(() => validateAssetPackManifest(invalid), /invalid usages/);
    invalid.assets[0].usages = ['stamp', 'stamp'];
    assert.throws(() => validateAssetPackManifest(invalid), /invalid usages/);
});

test('validator: rejects duplicate asset IDs within one Pack', () => {
    const invalid = structuredClone(manifest);
    invalid.assets[1].id = invalid.assets[0].id;
    assert.throws(() => validateAssetPackManifest(invalid), /unique within a Pack/);
});

test('validator: rejects unsupported script-like archive entries', () => {
    const files = new Map([
        ['pack.json', new TextEncoder().encode('{}')],
        ['assets/mountains/mountain.png', png],
        ['scripts/evil.js', new TextEncoder().encode('alert(1)')]
    ]);
    assert.throws(() => validateAssetPackManifest(manifest, { files }), /Unsupported Pack entry/);
});

test('validator: checks image signature against declared extension', () => {
    const files = new Map([
        ['pack.json', new TextEncoder().encode('{}')],
        ['assets/mountains/mountain.png', new TextEncoder().encode('not a png')],
        ['assets/forests/forest.png', png],
        ['LICENSE.txt', new TextEncoder().encode('CC0')]
    ]);
    assert.throws(() => validateAssetPackManifest(manifest, { files }), /does not match its image extension/);
});

test('validator: rejects a Pack requiring a newer WorldForge version', () => {
    const invalid = structuredClone(manifest);
    invalid.compatibility.minWorldForgeVersion = '99.0.0';
    assert.throws(() => validateAssetPackManifest(invalid, { worldForgeVersion: '1.0.0' }), /requires WorldForge/);
});

test('integration: Archive → Validator → Registry → Loader', async () => {
    const registry = new AssetRegistry();
    const loader = new AssetLoader(registry);
    const service = new AssetPackService({ registry, loader, worldForgeVersion: '1.0.0' });
    const pack = service.installPack(fixtureBytes);
    assert.equal(pack.manifest.id, manifest.id);
    assert.equal(registry.listPacks().length, 1);

    const asset = registry.getAsset(manifest.id, 'MNT-001');
    assert.equal(asset.key, 'com.worldforge.classic-fantasy::MNT-001');
    assert.equal(asset.packVersion, '1.0.0');
    assert.equal(registry.listAssets({ category: 'mountains' }).length, 1);

    const loaded = loader.load(manifest.id, 'MNT-001');
    assert.equal(loaded.mimeType, 'image/png');
    assert.equal(loaded.blob.size, png.byteLength);
    assert.match(loaded.url, /^blob:/);
    const response = await fetch(loaded.url);
    assert.equal(response.status, 200);
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), png);

    const revokedUrls = [];
    const originalRevoke = URL.revokeObjectURL;
    try {
        URL.revokeObjectURL = url => revokedUrls.push(url);
        assert.equal(service.setPackEnabled(manifest.id, false), false);
        assert.ok(revokedUrls.includes(loaded.url));
        assert.equal(registry.getAsset(manifest.id, 'MNT-001'), null);
        assert.throws(() => loader.load(manifest.id, 'MNT-001'), /missing or its Pack is disabled/);
        service.setPackEnabled(manifest.id, true);
        const reloaded = loader.load(manifest.id, 'MNT-001');
        assert.equal(service.uninstallPack(manifest.id), true);
        assert.ok(revokedUrls.includes(reloaded.url));
        assert.equal(loader.cache.size, 0);
        assert.equal(registry.getPack(manifest.id), null);
        assert.equal(registry.listAssets().length, 0);
    } finally {
        URL.revokeObjectURL = originalRevoke;
        loader.clear();
    }
});

test('registry: same local asset ID can exist in different Packs', () => {
    const registry = new AssetRegistry();
    const files = new Map([['assets/mountains/mountain.png', png]]);
    const makePack = (id, name) => ({
        manifest: { id, name, version: '1.0.0', author: 'QA', assets: [{ id: 'MNT-001', name, category: 'mountains', file: 'assets/mountains/mountain.png' }] },
        files
    });
    registry.registerPack(makePack('com.example.pack-one', 'Mountain One'));
    registry.registerPack(makePack('com.example.pack-two', 'Mountain Two'));
    assert.equal(registry.getAsset('com.example.pack-one', 'MNT-001').name, 'Mountain One');
    assert.equal(registry.getAsset('com.example.pack-two', 'MNT-001').name, 'Mountain Two');
});

test('service: rejects duplicate installation of the same Pack ID', () => {
    const registry = new AssetRegistry();
    const service = new AssetPackService({ registry });
    service.installPack(fixtureBytes);
    assert.throws(() => service.installPack(fixtureBytes), /already installed/);
});

test('loader: evicts oldest cache entry and revokes its object URL', () => {
    const registry = new AssetRegistry();
    registry.registerPack({
        manifest: { id: 'com.example.cache-test', name: 'Cache Test', version: '1.0.0', assets: [
            { id: 'A', name: 'A', file: 'assets/a.png' },
            { id: 'B', name: 'B', file: 'assets/b.png' }
        ] },
        files: new Map([['assets/a.png', png], ['assets/b.png', png]])
    });
    const revoked = [];
    const original = URL.revokeObjectURL;
    URL.revokeObjectURL = url => revoked.push(url);
    try {
        const loader = new AssetLoader(registry, { maxCacheEntries: 1 });
        const first = loader.load('com.example.cache-test', 'A');
        loader.load('com.example.cache-test', 'B');
        assert.equal(loader.cache.size, 1);
        assert.deepEqual(revoked, [first.url]);
        loader.clear();
    } finally {
        URL.revokeObjectURL = original;
    }
});
