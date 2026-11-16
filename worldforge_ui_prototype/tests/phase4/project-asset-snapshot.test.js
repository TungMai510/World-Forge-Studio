import test from 'node:test';
import assert from 'node:assert/strict';
import { AssetRegistry } from '../../src/assets/asset-registry.js';
import { AssetLoader } from '../../src/assets/asset-loader.js';
import { captureProjectAssetSnapshots, sha256Fallback, validateImageBytes } from '../../src/services/project-asset-snapshot-service.js';
import { MapCanvasEngine, createEmptyMap } from '../../src/engine/MapCanvasEngine.js';
import { createZipArchive, readZipArchive } from '../../src/services/archive-service.js';
import { ProjectService } from '../../src/services/project-service.js';
import { createFixturePng } from '../assets/fixture-png.js';

function fixtureRegistry() {
    const registry = new AssetRegistry();
    const bytes = createFixturePng(8, 8, 'mountain');
    registry.registerPack({
        manifest: {
            id: 'test-pack',
            name: 'Test Pack',
            version: '1.0.0',
            assets: [{ id: 'asset-1', name: 'Test Asset', file: 'assets/test.png', mimeType: 'image/png' }]
        },
        files: new Map([['assets/test.png', bytes]])
    });
    return { registry, bytes };
}

const projectData = {
    map: { layers: [{ objects: [
        { id: 'one', type: 'image', assetRef: { packId: 'test-pack', assetId: 'asset-1', packVersion: '1.0.0' } },
        { id: 'two', type: 'image', assetRef: { packId: 'test-pack', assetId: 'asset-1', packVersion: '1.0.0' } }
    ] }] }
};

test('captures one integrity-stamped snapshot for duplicate references', async () => {
    const { registry, bytes } = fixtureRegistry();
    const snapshots = await captureProjectAssetSnapshots(projectData, registry);
    assert.equal(snapshots.length, 1);
    assert.equal(snapshots[0].size, bytes.length);
    assert.match(snapshots[0].sha256, /^[a-f0-9]{64}$/);
    assert.equal(snapshots[0].packVersion, '1.0.0');
});

test('retains an existing snapshot when its Pack is no longer installed', async () => {
    const { registry } = fixtureRegistry();
    const snapshots = await captureProjectAssetSnapshots(projectData, registry);
    registry.unregisterPack('test-pack');
    const retained = await captureProjectAssetSnapshots(projectData, registry, snapshots);
    assert.deepEqual(retained, snapshots);
});

test('AssetLoader resolves a disabled or absent Pack asset from the project snapshot', async () => {
    const { registry } = fixtureRegistry();
    const snapshots = await captureProjectAssetSnapshots(projectData, registry);
    registry.setPackEnabled('test-pack', false);
    const loader = new AssetLoader(registry);
    loader.setProjectSnapshots(snapshots);
    const loaded = loader.load('test-pack', 'asset-1', '1.0.0');
    assert.equal(loaded.source, 'project-snapshot');
    assert.equal(loaded.mimeType, 'image/png');
    loader.clear();
});

test('SHA-256 fallback matches the standard digest without Web Crypto', () => {
    const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    assert.equal(
        sha256Fallback(bytes),
        '4c4b6a3be1314ab86138bef4314dde022e600960d8689a2c8f8631802d20dab6'
    );
});

test('same-session fallback works after snapshots are activated and Pack is removed', async () => {
    const { registry } = fixtureRegistry();
    const snapshots = await captureProjectAssetSnapshots(projectData, registry);
    const loader = new AssetLoader(registry);
    loader.setProjectSnapshots(snapshots);
    registry.unregisterPack('test-pack');
    loader.invalidatePack('test-pack');
    const loaded = loader.load('test-pack', 'asset-1', '1.0.0');
    assert.equal(loaded.source, 'project-snapshot');
    loader.clear();
});

function archiveProjectService() {
    const stored = new Map();
    return new ProjectService({
        async getProject(id) { return stored.get(id) || null; },
        async addProject(project) { stored.set(project.id, project); }
    });
}

function unknownFieldProject() {
    const map = createEmptyMap();
    map.mapUnknown = { source: 'map-sentinel', nested: { value: 17 } };
    map.layers[0] = {
        ...map.layers[0],
        name: '  Background  ',
        layerUnknown: { source: 'layer-sentinel', nested: { value: 23 } },
        objects: [{
            id: 'unknown-object',
            type: 'rect',
            x: 10,
            y: 20,
            width: 40,
            height: 50,
            objectUnknown: { source: 'object-sentinel', nested: { value: 29 } }
        }]
    };
    return {
        id: 'unknown-fields-project',
        name: 'Unknown Fields',
        description: '',
        coverImage: '',
        createdAt: '2026-11-13T00:00:00.000Z',
        updatedAt: '2026-11-13T00:00:00.000Z',
        schemaVersion: 2,
        data: { map, geography: {}, civilization: {}, history: {} }
    };
}

function persistentProjectService(project) {
    let stored = structuredClone(project);
    return {
        service: new ProjectService({
            async getProject(id) {
                return id === stored.id ? structuredClone(stored) : null;
            },
            async putProject(next) {
                stored = structuredClone(next);
            },
            async addProject(next) {
                stored = structuredClone(next);
            },
            async putRecentProject() {
            }
        }),
        getStored: () => structuredClone(stored)
    };
}

function projectWithSnapshot() {
    const bytes = createFixturePng(8, 8, 'mountain');
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return {
        project: {
            id: 'archive-project',
            name: 'Archive Project',
            description: '',
            coverImage: '',
            createdAt: '2026-11-13T00:00:00.000Z',
            updatedAt: '2026-11-13T00:00:00.000Z',
            schemaVersion: 2,
            data: {
                map: createEmptyMap(),
                assetSnapshots: [{
                    schemaVersion: 1,
                    key: 'test-pack::1.0.0::asset-1',
                    packId: 'test-pack',
                    packVersion: '1.0.0',
                    assetId: 'asset-1',
                    name: 'Test Asset',
                    mimeType: 'image/png',
                    size: bytes.length,
                    sha256: sha256Fallback(bytes),
                    data: btoa(binary)
                }]
            }
        },
        bytes
    };
}

test('preserves unknown map fields through normalization and a known-field edit', async () => {
    const project = unknownFieldProject();
    const { service } = persistentProjectService(project);
    const loaded = await service.openProject(project.id);
    loaded.data.map.width = 2048;
    const saved = await service.saveProject(project.id, loaded.data);

    assert.deepEqual(saved.data.map.mapUnknown, { source: 'map-sentinel', nested: { value: 17 } });
});

test('preserves unknown layer fields through normalization and a known-field edit', async () => {
    const project = unknownFieldProject();
    const { service } = persistentProjectService(project);
    const loaded = await service.openProject(project.id);
    loaded.data.map.layers[0].name = 'Renamed Background';
    const saved = await service.saveProject(project.id, loaded.data);

    assert.deepEqual(saved.data.map.layers[0].layerUnknown, {
        source: 'layer-sentinel',
        nested: { value: 23 }
    });
});

test('preserves nested unknown fields on map objects', async () => {
    const project = unknownFieldProject();
    const { service } = persistentProjectService(project);
    const loaded = await service.openProject(project.id);
    loaded.data.map.layers[0].objects[0].width = 80;
    const saved = await service.saveProject(project.id, loaded.data);

    assert.deepEqual(saved.data.map.layers[0].objects[0].objectUnknown, {
        source: 'object-sentinel',
        nested: { value: 29 }
    });
});

test('preserves map and layer unknown fields through archive export and import', async () => {
    const project = unknownFieldProject();
    const { service } = persistentProjectService(project);
    const loaded = await service.openProject(project.id);
    const saved = await service.saveProject(project.id, loaded.data);
    const imported = await service.importProjectPackage(service.exportProjectPackage(saved));

    assert.deepEqual(imported.project.data.map.mapUnknown, {
        source: 'map-sentinel',
        nested: { value: 17 }
    });
    assert.deepEqual(imported.project.data.map.layers[0].layerUnknown, {
        source: 'layer-sentinel',
        nested: { value: 23 }
    });
    assert.deepEqual(imported.project.data.map.layers[0].objects[0].objectUnknown, {
        source: 'object-sentinel',
        nested: { value: 29 }
    });
});

test('continues normalizing known map fields while preserving unknown fields', () => {
    const project = unknownFieldProject();
    const validator = Object.create(MapCanvasEngine.prototype);
    validator.renderers = new Map([['canvas', true]]);
    const normalized = validator.validateMap(project.data.map);

    assert.equal(normalized.layers[0].name, 'Background');
    assert.equal(normalized.layers[0].visible, true);
    assert.equal(normalized.layers[0].objects[0].width, 40);
    assert.deepEqual(normalized.mapUnknown, project.data.map.mapUnknown);
    assert.deepEqual(normalized.layers[0].layerUnknown, project.data.map.layers[0].layerUnknown);
});

function webpFixture(kind, width, height) {
    const payload = kind === 'VP8X'
        ? new Uint8Array([0, 0, 0, 0, (width - 1) & 0xff, (width - 1) >> 8 & 0xff, (width - 1) >> 16 & 0xff,
            (height - 1) & 0xff, (height - 1) >> 8 & 0xff, (height - 1) >> 16 & 0xff])
        : kind === 'VP8 '
            ? new Uint8Array([0, 0, 0, 0x9d, 0x01, 0x2a, width & 0xff, width >> 8 & 0x3f, height & 0xff, height >> 8 & 0x3f])
            : new Uint8Array([0x2f, (width - 1) & 0xff, ((width - 1) >> 8 & 0x3f) | ((height - 1) << 6 & 0xc0),
                (height - 1) >> 2 & 0xff, (height - 1) >> 10 & 0x0f]);
    const bytes = new Uint8Array(20 + payload.length);
    bytes.set([0x52, 0x49, 0x46, 0x46, (bytes.length - 8) & 0xff, (bytes.length - 8) >> 8 & 0xff,
        (bytes.length - 8) >> 16 & 0xff, (bytes.length - 8) >> 24 & 0xff, 0x57, 0x45, 0x42, 0x50], 0);
    for (let index = 0; index < 4; index += 1) bytes[12 + index] = kind.charCodeAt(index);
    bytes[16] = payload.length;
    bytes.set(payload, 20);
    return bytes;
}

test('validates dimensions for WebP VP8, VP8L and VP8X payloads', () => {
    for (const kind of ['VP8 ', 'VP8L', 'VP8X']) {
        assert.doesNotThrow(() => validateImageBytes(webpFixture(kind, 64, 32), 'image/webp', kind));
        assert.throws(() => validateImageBytes(webpFixture(kind, 9000, 9000), 'image/webp', kind), /dimensions/i);
    }
});

test('exports formatVersion 2 with deterministic binary snapshot entries', () => {
    const service = archiveProjectService();
    const { project, bytes } = projectWithSnapshot();
    const archive = service.exportProjectPackage(project);
    const files = readZipArchive(archive);
    const manifest = JSON.parse(new TextDecoder().decode(files.get('manifest.json')));
    assert.equal(manifest.formatVersion, 2);
    assert.equal(manifest.snapshotCount, 1);
    assert.equal(manifest.snapshotEntryCount, 1);
    assert.equal(manifest.snapshots[0].path, `assets/${sha256Fallback(bytes)}.png`);
    assert.deepEqual([...files.keys()].sort(), ['assets/' + sha256Fallback(bytes) + '.png', 'manifest.json', 'project.json'].sort());
    assert.deepEqual(files.get(manifest.snapshots[0].path), bytes);
    assert.doesNotMatch(new TextDecoder().decode(files.get('project.json')), /"data":"/);
});

test('imports formatVersion 2 and reconstructs embedded snapshot data', () => {
    const service = archiveProjectService();
    const { project } = projectWithSnapshot();
    const archive = service.exportProjectPackage(project);
    return service.importProjectPackage(archive).then(result => {
        assert.equal(result.project.data.assetSnapshots.length, 1);
        assert.equal(result.project.data.assetSnapshots[0].data.length > 0, true);
        assert.equal(result.project.data.assetSnapshots[0].sha256, project.data.assetSnapshots[0].sha256);
    });
});

test('round-trips formatVersion 2 with Data URL assets and Pack snapshots together', async () => {
    const service = archiveProjectService();
    const { project, bytes } = projectWithSnapshot();
    const dataUrl = `data:image/png;base64,${Buffer.from(bytes).toString('base64')}`;
    project.coverImage = dataUrl;
    const archive = service.exportProjectPackage(project);
    const files = readZipArchive(archive);
    const manifest = JSON.parse(new TextDecoder().decode(files.get('manifest.json')));
    assert.equal(manifest.embeddedAssetCount, 1);
    assert.equal(manifest.snapshotEntryCount, 1);
    assert.ok(files.has('assets/000000.png'));
    assert.ok(files.has(`assets/${sha256Fallback(bytes)}.png`));
    const result = await service.importProjectPackage(archive);
    assert.equal(result.project.coverImage, dataUrl);
    assert.equal(result.project.data.assetSnapshots.length, 1);
});

test('counts snapshot, embedded asset and metadata entries against the archive file limit', () => {
    const service = archiveProjectService();
    const { project, bytes } = projectWithSnapshot();
    const dataUrl = `data:image/png;base64,${Buffer.from(bytes).toString('base64')}`;
    project.data.embeddedAssets = Array.from({ length: 9998 }, () => dataUrl);
    assert.throws(() => service.exportProjectPackage(project), /10,000 file limit/i);
});

test('rejects a same-size snapshot mutation during project validation and loader activation', () => {
    const { project } = projectWithSnapshot();
    const corrupted = structuredClone(project);
    const original = corrupted.data.assetSnapshots[0].data;
    corrupted.data.assetSnapshots[0].data = `${original[0] === 'A' ? 'B' : 'A'}${original.slice(1)}`;
    const service = archiveProjectService();
    assert.throws(() => service.validateProject(corrupted), /SHA-256 integrity/i);
    const { registry } = fixtureRegistry();
    const loader = new AssetLoader(registry);
    assert.throws(() => loader.setProjectSnapshots(corrupted.data.assetSnapshots), /SHA-256 integrity/i);
});

test('rejects a formatVersion 2 snapshot whose binary is corrupted', () => {
    const service = archiveProjectService();
    const { project } = projectWithSnapshot();
    const archive = service.exportProjectPackage(project);
    const files = readZipArchive(archive);
    const manifest = JSON.parse(new TextDecoder().decode(files.get('manifest.json')));
    const corrupted = files.get(manifest.snapshots[0].path).slice();
    corrupted[corrupted.length - 1] ^= 0xff;
    files.set(manifest.snapshots[0].path, corrupted);
    assert.throws(() => service.importProjectPackage(createZipArchive(Object.fromEntries(files))), /integrity|signature/i);
});

test('imports legacy formatVersion 1 project packages', async () => {
    const service = archiveProjectService();
    const { project, bytes } = projectWithSnapshot();
    delete project.data.assetSnapshots;
    project.data.legacyAsset = 'wforge-asset:assets/000000.png';
    const archive = createZipArchive({
        'project.json': JSON.stringify(project),
        'manifest.json': JSON.stringify({
            format: 'WorldForgeStudioProject',
            formatVersion: 1,
            projectEntry: 'project.json',
            assetCount: 1
        }),
        'assets/000000.png': bytes
    });
    const result = await service.importProjectPackage(archive);
    assert.equal(result.project.data.legacyAsset, `data:image/png;base64,${Buffer.from(bytes).toString('base64')}`);
});

test('preserves unknown map and layer fields during v1 to v2 migration', async () => {
    const service = archiveProjectService();
    const project = unknownFieldProject();
    project.schemaVersion = 1;
    delete project.data.history;
    const archive = createZipArchive({
        'project.json': JSON.stringify(project),
        'manifest.json': JSON.stringify({
            format: 'WorldForgeStudioProject',
            formatVersion: 1,
            projectEntry: 'project.json',
            assetCount: 0
        })
    });

    const result = await service.importProjectPackage(archive);

    assert.equal(result.project.schemaVersion, 2);
    assert.deepEqual(result.project.data.map.mapUnknown, project.data.map.mapUnknown);
    assert.deepEqual(result.project.data.map.layers[0].layerUnknown, project.data.map.layers[0].layerUnknown);
});

test('rejects a formatVersion 2 archive with a missing snapshot entry', () => {
    const service = archiveProjectService();
    const { project } = projectWithSnapshot();
    const files = readZipArchive(service.exportProjectPackage(project));
    const manifest = JSON.parse(new TextDecoder().decode(files.get('manifest.json')));
    files.delete(manifest.snapshots[0].path);
    assert.throws(() => service.importProjectPackage(createZipArchive(Object.fromEntries(files))), /missing snapshot/i);
});

test('rejects a formatVersion 2 archive with an undeclared snapshot entry', () => {
    const service = archiveProjectService();
    const { project, bytes } = projectWithSnapshot();
    const files = readZipArchive(service.exportProjectPackage(project));
    files.set(`assets/${'0'.repeat(64)}.png`, bytes);
    assert.throws(() => service.importProjectPackage(createZipArchive(Object.fromEntries(files))), /do not match its manifest/i);
});

test('rejects a formatVersion 2 archive when project.json integrity is stale', () => {
    const service = archiveProjectService();
    const { project } = projectWithSnapshot();
    const files = readZipArchive(service.exportProjectPackage(project));
    const projectBytes = files.get('project.json').slice();
    projectBytes[projectBytes.length - 2] ^= 1;
    files.set('project.json', projectBytes);
    assert.throws(() => service.importProjectPackage(createZipArchive(Object.fromEntries(files))), /Project entry failed its SHA-256/i);
});

test('malformed archive import is all-or-nothing before database writes', () => {
    let addCalls = 0;
    const service = new ProjectService({
        async getProject() { return null; },
        async addProject() { addCalls += 1; }
    });
    const { project } = projectWithSnapshot();
    const files = readZipArchive(service.exportProjectPackage(project));
    const manifest = JSON.parse(new TextDecoder().decode(files.get('manifest.json')));
    files.delete(manifest.snapshots[0].path);
    assert.throws(() => service.importProjectPackage(createZipArchive(Object.fromEntries(files))), /missing snapshot/i);
    assert.equal(addCalls, 0);
});

test('rejects snapshot export with unsupported MIME or invalid image signature', () => {
    const service = archiveProjectService();
    const { project } = projectWithSnapshot();
    project.data.assetSnapshots[0].mimeType = 'image/svg+xml';
    assert.throws(() => service.exportProjectPackage(project), /metadata|invalid byte length or MIME type/i);

    const invalid = projectWithSnapshot();
    invalid.project.data.assetSnapshots[0].data = btoa('not-an-image');
    invalid.project.data.assetSnapshots[0].size = 12;
    invalid.project.data.assetSnapshots[0].sha256 = sha256Fallback(new TextEncoder().encode('not-an-image'));
    assert.throws(() => service.exportProjectPackage(invalid.project), /signature|structure/i);
});

test('rejects an archive larger than the project import limit before parsing', () => {
    const service = archiveProjectService();
    const oversized = new Uint8Array(100 * 1024 * 1024 + 1);
    assert.throws(() => service.importProjectPackage(oversized), /100 MB import limit/i);
});
