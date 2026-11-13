import test from 'node:test';
import assert from 'node:assert/strict';
import { AssetRegistry } from '../../src/assets/asset-registry.js';
import { AssetLoader } from '../../src/assets/asset-loader.js';
import { captureProjectAssetSnapshots, sha256Fallback } from '../../src/services/project-asset-snapshot-service.js';
import { createEmptyMap } from '../../src/engine/MapCanvasEngine.js';
import { createZipArchive, readZipArchive } from '../../src/services/archive-service.js';
import { ProjectService } from '../../src/services/project-service.js';

function fixtureRegistry() {
    const registry = new AssetRegistry();
    const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
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

function projectWithSnapshot() {
    const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
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
    assert.throws(() => service.exportProjectPackage(project), /invalid byte length or MIME type/i);

    const invalid = projectWithSnapshot();
    invalid.project.data.assetSnapshots[0].data = btoa('not-an-image');
    invalid.project.data.assetSnapshots[0].size = 12;
    invalid.project.data.assetSnapshots[0].sha256 = sha256Fallback(new TextEncoder().encode('not-an-image'));
    assert.throws(() => service.exportProjectPackage(invalid.project), /image signature/i);
});

test('rejects an archive larger than the project import limit before parsing', () => {
    const service = archiveProjectService();
    const oversized = new Uint8Array(100 * 1024 * 1024 + 1);
    assert.throws(() => service.importProjectPackage(oversized), /100 MB import limit/i);
});
