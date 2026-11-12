import test from 'node:test';
import assert from 'node:assert/strict';
import { AssetRegistry } from '../../src/assets/asset-registry.js';
import {
    ASSET_CAPABILITIES,
    ToolAssetBinding,
    assetMatchesQuery,
    getAssetCapabilities,
    normalizeAssetQuery
} from '../../src/assets/tool-asset-capabilities.js';
import { ToolManager, TOOL_DEFINITIONS } from '../../src/engine/tools/ToolManager.js';
import { PlaceAssetTool } from '../../src/engine/tools/PlaceAssetTool.js';

const packId = 'com.example.tool-assets';
const assets = [
    { id: 'ICON-1', name: 'Capital Icon', category: 'symbols', type: 'image', usages: ['icon', 'stamp'], tags: ['capital'], defaultSize: { width: 48, height: 48 } },
    { id: 'MNT-1', name: 'Mountain Stamp', category: 'terrain', type: 'image', usages: ['stamp', 'scatter'], tags: ['mountain'], defaultSize: { width: 180, height: 140 } },
    { id: 'LAKE-1', name: 'Water Texture', category: 'water', type: 'image', usages: ['texture-fill'], tags: ['water'] },
    { id: 'BORDER-1', name: 'Border Pattern', category: 'lines', type: 'image', usages: ['pattern-stroke'], tags: ['border'] },
    { id: 'OLD-1', name: 'Legacy Decoration', category: 'misc', type: 'image', tags: ['ornament'] },
    { id: 'DECOR-1', name: 'Banner Decoration', category: 'decor', type: 'image', usages: ['decoration'], tags: ['banner'] }
];

function createRegistry() {
    const registry = new AssetRegistry();
    registry.registerPack({
        manifest: { id: packId, name: 'Tool Integration QA', version: '1.2.0', author: 'QA', assets },
        files: new Map()
    });
    return registry;
}

function createEngine() {
    const layer = { id: 'layer-map', visible: true, locked: false };
    return {
        layerManager: { getActiveLayer: () => layer },
        addObject() {},
        scheduleRender() {}
    };
}

test('capability vocabulary is stable and queries are normalized', () => {
    assert.deepEqual(ASSET_CAPABILITIES, ['stamp', 'icon', 'scatter', 'texture-fill', 'pattern-stroke', 'decoration']);
    assert.deepEqual(normalizeAssetQuery({
        requiredCapabilities: ['stamp', 'stamp'],
        categories: ['terrain'],
        tags: ['Mountain'],
        acceptedTypes: ['image']
    }), {
        requiredCapabilities: ['stamp'],
        categories: ['terrain'],
        tags: ['mountain'],
        acceptedTypes: ['image']
    });
    assert.throws(() => normalizeAssetQuery({ requiredCapabilities: ['execute-js'] }), /unsupported capability/);
    assert.throws(() => normalizeAssetQuery({ tags: 'mountain' }), /array/);
});

test('asset capability matching requires every requested capability', () => {
    assert.equal(assetMatchesQuery(assets[0], { requiredCapabilities: ['icon'] }), true);
    assert.equal(assetMatchesQuery(assets[0], { requiredCapabilities: ['icon', 'scatter'] }), false);
    assert.equal(assetMatchesQuery(assets[2], { requiredCapabilities: ['texture-fill'] }), true);
    assert.equal(assetMatchesQuery(assets[3], { requiredCapabilities: ['pattern-stroke'] }), true);
    assert.equal(assetMatchesQuery(assets[5], { anyCapabilities: ['stamp', 'decoration'] }), true);
    assert.equal(assetMatchesQuery(assets[5], { anyCapabilities: ['stamp', 'icon'] }), false);
});

test('unknown asset usages are ignored and never execute or grant capabilities', () => {
    assert.deepEqual(getAssetCapabilities({ usages: ['icon', 'execute-js', 42] }), ['icon']);
    assert.equal(assetMatchesQuery({ ...assets[0], usages: ['execute-js'] }, { requiredCapabilities: ['icon'] }), false);
});

test('legacy Pack v1 assets are generic-only and are not inferred from category names', () => {
    assert.deepEqual(getAssetCapabilities(assets[4]), ['stamp', 'decoration']);
    assert.equal(assetMatchesQuery(assets[4], { requiredCapabilities: ['stamp'] }), true);
    assert.equal(assetMatchesQuery(assets[4], { requiredCapabilities: ['icon'] }), false);
    assert.equal(assetMatchesQuery(assets[4], { requiredCapabilities: ['texture-fill'] }), false);
});

test('ToolAssetBinding filters by capability, optional metadata and search', () => {
    const binding = new ToolAssetBinding({
        registry: createRegistry(),
        toolId: 'terrain',
        query: { requiredCapabilities: ['stamp'], tags: [] }
    });
    assert.deepEqual(binding.listAssets().map(asset => asset.id), ['ICON-1', 'MNT-1', 'OLD-1']);
    assert.deepEqual(binding.listAssets({ query: 'mountain' }).map(asset => asset.id), ['MNT-1']);
    assert.deepEqual(binding.listAssets({ packId: 'com.example.other' }), []);
});

test('ToolAssetBinding resolves namespaced references and rejects stale or disabled Pack assets', () => {
    const registry = createRegistry();
    const binding = new ToolAssetBinding({ registry, toolId: 'icon', query: { requiredCapabilities: ['icon'] } });
    const resolved = binding.resolveAssetRef({ packId, assetId: 'ICON-1', packVersion: '1.2.0' });
    assert.deepEqual(resolved.assetRef, { packId, assetId: 'ICON-1', packVersion: '1.2.0' });
    assert.throws(() => binding.resolveAssetRef({ packId, assetId: 'ICON-1', packVersion: '1.0.0' }), /version/);
    assert.throws(() => binding.resolveAssetRef({ packId, assetId: 'LAKE-1' }), /not compatible/);
    registry.setPackEnabled(packId, false);
    assert.throws(() => binding.resolveAssetRef({ packId, assetId: 'ICON-1' }), /missing or its Pack is disabled/);
    assert.deepEqual(binding.listAssets(), []);
});

test('ToolManager exposes per-tool bindings without coupling tools to Pack parsing', () => {
    const registry = createRegistry();
    const manager = new ToolManager(createEngine(), { assetRegistry: registry });
    assert.deepEqual(manager.listAssetsForTool('icon').map(asset => asset.id), ['ICON-1']);
    assert.deepEqual(manager.listAssetsForTool('terrain').map(asset => asset.id), ['ICON-1', 'MNT-1', 'OLD-1']);
    assert.deepEqual(manager.listAssetsForTool('lake').map(asset => asset.id), ['LAKE-1']);
    assert.deepEqual(manager.listAssetsForTool('border').map(asset => asset.id), ['BORDER-1']);
    assert.deepEqual(manager.listAssetsForTool('place-asset').map(asset => asset.id), ['ICON-1', 'MNT-1', 'OLD-1', 'DECOR-1']);
    assert.deepEqual(manager.listAssetsForTool('select'), []);
});

test('ToolManager routes selected asset to tool contract and generic PlaceAssetTool', () => {
    const registry = createRegistry();
    const manager = new ToolManager(createEngine(), { assetRegistry: registry });
    const selected = manager.selectAssetForTool('place-asset', { packId, assetId: 'MNT-1' });
    assert.equal(selected.assetRef.packVersion, '1.2.0');
    const tool = manager.getTool('place-asset');
    assert.ok(tool instanceof PlaceAssetTool);
    assert.deepEqual(tool.options.assetRef, selected.assetRef);
    assert.deepEqual(tool.options.defaultSize, { width: 180, height: 140 });
    assert.deepEqual(tool.assetSelection.assetRef, selected.assetRef);
});

test('ToolManager refuses asset selection for tools without an explicit binding', () => {
    const manager = new ToolManager(createEngine(), { assetRegistry: createRegistry() });
    assert.throws(() => manager.selectAssetForTool('brush', { packId, assetId: 'MNT-1' }), /does not accept/);
    assert.throws(() => manager.selectAssetForTool('icon', { packId, assetId: 'LAKE-1' }), /not compatible/);
});

test('ToolManager can attach the runtime registry after editor initialization', () => {
    const manager = new ToolManager(createEngine());
    assert.deepEqual(manager.listAssetsForTool('icon'), []);
    assert.equal(manager.setAssetRegistry(createRegistry()), 5);
    assert.deepEqual(manager.listAssetsForTool('icon').map(asset => asset.id), ['ICON-1']);
});
