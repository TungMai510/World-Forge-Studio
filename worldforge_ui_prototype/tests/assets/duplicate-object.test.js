import test from 'node:test';
import assert from 'node:assert/strict';
import { MapCanvasEngine } from '../../src/engine/MapCanvasEngine.js';

function createEngine(object, { locked = false, visible = true } = {}) {
    const layer = { id: 'layer-1', name: 'Assets', locked, visible, objects: [{ ...object }] };
    const engine = Object.create(MapCanvasEngine.prototype);
    engine.map = { layers: [layer] };
    engine.selectedObjectId = object.id;
    engine.findObjectEntry = id => {
        const index = layer.objects.findIndex(item => item.id === id);
        return index < 0 ? null : { layer, index, object: layer.objects[index] };
    };
    engine.addObject = (layerId, copy, label) => {
        assert.equal(layerId, layer.id);
        assert.equal(label, 'Duplicate object');
        layer.objects.push(copy);
        engine.selectedObjectId = copy.id;
        return copy;
    };
    return { engine, layer };
}

const image = {
    id: 'image-1', type: 'image', schemaVersion: 1,
    assetRef: { packId: 'com.example.test', assetId: 'mountain', packVersion: '1.0.0' },
    x: 100, y: 80, width: 120, height: 90, rotation: 35, opacity: 0.8, fit: 'contain'
};

test('duplicateObject clones image metadata, offsets position and selects the copy', () => {
    const { engine, layer } = createEngine(image);
    const copy = engine.duplicateObject();
    assert.equal(layer.objects.length, 2);
    assert.notEqual(copy.id, image.id);
    assert.deepEqual(copy.assetRef, image.assetRef);
    assert.deepEqual([copy.x, copy.y, copy.width, copy.height, copy.rotation, copy.opacity, copy.fit],
        [116, 96, 120, 90, 35, 0.8, 'contain']);
    assert.equal(engine.selectedObjectId, copy.id);
    assert.deepEqual([layer.objects[0].x, layer.objects[0].y], [100, 80]);
});

test('duplicateObject offsets path commands and terrain points without mutating source', () => {
    const pathObject = { id: 'path-1', type: 'path', commands: [
        { type: 'moveTo', x: 1, y: 2 }, { type: 'lineTo', x: 5, y: 8 }, { type: 'close' }
    ] };
    const { engine, layer } = createEngine(pathObject);
    const copy = engine.duplicateObject('path-1', 10);
    assert.deepEqual(copy.commands, [
        { type: 'moveTo', x: 11, y: 12 }, { type: 'lineTo', x: 15, y: 18 }, { type: 'close' }
    ]);
    assert.deepEqual(layer.objects[0].commands, pathObject.commands);
});

test('duplicateObject rejects locked and hidden layers and invalid offsets', () => {
    for (const state of [{ locked: true }, { visible: false }]) {
        const { engine, layer } = createEngine(image, state);
        assert.throws(() => engine.duplicateObject(), /locked or hidden layer/);
        assert.equal(layer.objects.length, 1);
    }
    const { engine } = createEngine(image);
    assert.throws(() => engine.duplicateObject(image.id, -1), /offset must be between/);
});
