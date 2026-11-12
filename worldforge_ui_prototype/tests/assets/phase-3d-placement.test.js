import test from 'node:test';
import assert from 'node:assert/strict';
import { PlaceAssetTool } from '../../src/engine/tools/PlaceAssetTool.js';

function createEngine(layer = { id: 'layer-1', visible: true, locked: false }) {
    const objects = [];
    return {
        objects,
        layerManager: { getActiveLayer: () => layer },
        addObject: (_layerId, object, label) => objects.push({ ...object, label }),
        scheduleRender() {}
    };
}

const selection = {
    asset: { id: 'MNT-001', packId: 'com.example.fantasy', defaultSize: { width: 180, height: 120 } },
    assetRef: { packId: 'com.example.fantasy', assetId: 'MNT-001', packVersion: '1.0.0' }
};

test('PlaceAssetTool places a click at the asset default dimensions, centered on the pointer', () => {
    const engine = createEngine();
    const tool = new PlaceAssetTool(engine);
    tool.setAssetSelection(selection);
    tool.pointerDown({ world: { x: 300, y: 200 }, screen: { x: 30, y: 20 } });
    tool.pointerUp({ world: { x: 300, y: 200 }, screen: { x: 30, y: 20 } });
    assert.equal(engine.objects.length, 1);
    assert.deepEqual(
        { x: engine.objects[0].x, y: engine.objects[0].y, width: engine.objects[0].width, height: engine.objects[0].height },
        { x: 210, y: 140, width: 180, height: 120 }
    );
    assert.deepEqual(engine.objects[0].assetRef, selection.assetRef);
});

test('PlaceAssetTool drag defines the placement rectangle and stores transform options', () => {
    const engine = createEngine();
    const tool = new PlaceAssetTool(engine);
    tool.setAssetSelection(selection);
    tool.setOptions({ rotation: 35, opacity: 0.65, fit: 'cover' });
    tool.pointerDown({ world: { x: 100, y: 120 }, screen: { x: 10, y: 12 } });
    tool.pointerMove({ world: { x: 260, y: 220 }, screen: { x: 26, y: 22 } });
    tool.pointerUp({ world: { x: 260, y: 220 }, screen: { x: 26, y: 22 } });
    assert.deepEqual(
        { x: engine.objects[0].x, y: engine.objects[0].y, width: engine.objects[0].width, height: engine.objects[0].height },
        { x: 100, y: 120, width: 160, height: 100 }
    );
    assert.equal(engine.objects[0].rotation, 35);
    assert.equal(engine.objects[0].opacity, 0.65);
    assert.equal(engine.objects[0].fit, 'cover');
});

test('PlaceAssetTool rejects placement without an asset or on hidden/locked layers', () => {
    const noAsset = new PlaceAssetTool(createEngine());
    assert.throws(() => noAsset.pointerDown({ world: { x: 0, y: 0 } }), /Choose an asset/);
    for (const layer of [
        { id: 'hidden', visible: false, locked: false },
        { id: 'locked', visible: true, locked: true }
    ]) {
        const tool = new PlaceAssetTool(createEngine(layer));
        tool.setAssetSelection(selection);
        assert.throws(() => tool.pointerDown({ world: { x: 0, y: 0 } }), /visible, unlocked layer/);
    }
});

test('PlaceAssetTool validates transform and fit options', () => {
    const tool = new PlaceAssetTool(createEngine());
    assert.throws(() => tool.setOptions({ opacity: 1.1 }), /opacity/);
    assert.throws(() => tool.setOptions({ rotation: Infinity }), /rotation/);
    assert.throws(() => tool.setOptions({ fit: 'stretch' }), /fit/);
    assert.throws(() => tool.setOptions({ defaultSize: { width: 0, height: 20 } }), /Default asset size/);
});
