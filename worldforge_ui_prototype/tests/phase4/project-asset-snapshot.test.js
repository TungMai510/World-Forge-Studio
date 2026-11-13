import test from 'node:test';
import assert from 'node:assert/strict';
import { AssetRegistry } from '../../src/assets/asset-registry.js';
import { AssetLoader } from '../../src/assets/asset-loader.js';
import { captureProjectAssetSnapshots, sha256Fallback } from '../../src/services/project-asset-snapshot-service.js';

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
