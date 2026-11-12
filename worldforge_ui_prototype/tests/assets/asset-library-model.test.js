import test from 'node:test';
import assert from 'node:assert/strict';
import { filterAssetLibraryAssets, listAssetLibraryCategories } from '../../src/assets/asset-library-model.js';

const entries = [
    { id: 'MNT-001', name: 'Snowy Mountain', category: 'mountains', packName: 'Classic Fantasy', description: 'High-altitude summit', tags: ['snow', 'peak'] },
    { id: 'FST-001', name: 'Pine Forest', category: 'forests', packName: 'Classic Fantasy', description: 'Dense woodland', tags: ['pine', 'green'] },
    { id: 'BLD-001', name: 'Stone Keep', category: 'buildings', packName: 'Medieval', description: 'Fortified castle', tags: ['castle'] },
    { id: 'OFF-001', name: 'Disabled Asset', category: 'misc', packName: 'Old Pack', enabled: false }
];

test('Asset Library search matches names, IDs, Pack names, descriptions and tags', () => {
    assert.equal(filterAssetLibraryAssets(entries, { query: 'snowy' }).length, 1);
    assert.equal(filterAssetLibraryAssets(entries, { query: 'mnt-001' }).length, 1);
    assert.equal(filterAssetLibraryAssets(entries, { query: 'classic fantasy' }).length, 2);
    assert.equal(filterAssetLibraryAssets(entries, { query: 'fortified' })[0].id, 'BLD-001');
    assert.equal(filterAssetLibraryAssets(entries, { query: 'pine' })[0].id, 'FST-001');
});

test('Asset Library category and search filters compose', () => {
    const result = filterAssetLibraryAssets(entries, { category: 'forests', query: 'green' });
    assert.deepEqual(result.map(asset => asset.id), ['FST-001']);
});

test('Asset Library excludes disabled entries', () => {
    assert.equal(filterAssetLibraryAssets(entries).some(asset => asset.id === 'OFF-001'), false);
});

test('Asset Library categories are unique, enabled-only and sorted', () => {
    assert.deepEqual(listAssetLibraryCategories(entries), ['buildings', 'forests', 'mountains']);
});

test('Asset Library helpers reject malformed collections', () => {
    assert.throws(() => filterAssetLibraryAssets(null), /must be an array/);
    assert.throws(() => listAssetLibraryCategories({}), /must be an array/);
});
