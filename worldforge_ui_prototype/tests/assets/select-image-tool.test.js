import test from 'node:test';
import assert from 'node:assert/strict';
import { SelectTool } from '../../src/engine/tools/SelectTool.js';

const image = {
    id: 'image-1', type: 'image', schemaVersion: 1,
    assetRef: { packId: 'com.example.test', assetId: 'mountain' },
    x: 100, y: 100, width: 100, height: 80, rotation: 0, opacity: 1, fit: 'contain'
};

function createEngine({ locked = false, visible = true } = {}) {
    const layer = { id: 'layer-1', locked, visible, objects: [{ ...image }] };
    const engine = {
        map: { layers: [layer] },
        selectedObjectId: image.id,
        history: [],
        findObject(id) { const item = layer.objects.find(object => object.id === id); return item ? { ...item } : null; },
        findObjectEntry(id) { const index = layer.objects.findIndex(object => object.id === id); return index < 0 ? null : { layer, index, object: layer.objects[index] }; },
        getObjectAt(point) { return point.x >= 100 && point.x <= 200 && point.y >= 100 && point.y <= 180 ? { ...image, layerId: layer.id } : null; },
        getZoom() { return 1; },
        setSelection(id) { this.selectedObjectId = id; },
        beginEditGroup(label) { this.history.push(['begin', label]); },
        commitEditGroup() { this.history.push(['commit']); },
        cancelEditGroup() { layer.objects[0] = { ...image }; this.history.push(['cancel']); },
        translateObject(id, dx, dy) { const entry = this.findObjectEntry(id); entry.layer.objects[entry.index] = { ...entry.object, x: entry.object.x + dx, y: entry.object.y + dy }; },
        validateObject(object) { return { ...object }; },
        scheduleRender() {}
    };
    return { engine, layer };
}

test('SelectTool moves a selected image and commits one edit group', () => {
    const { engine, layer } = createEngine();
    const tool = new SelectTool(engine);
    tool.pointerDown({ world: { x: 150, y: 140 } });
    tool.pointerMove({ world: { x: 170, y: 155 } });
    tool.pointerUp();
    assert.deepEqual([layer.objects[0].x, layer.objects[0].y], [120, 115]);
    assert.deepEqual(engine.history, [['begin', 'Move object'], ['commit']]);
});

test('SelectTool resizes an image from its bottom-right handle around its center', () => {
    const { engine, layer } = createEngine();
    const tool = new SelectTool(engine);
    tool.pointerDown({ world: { x: 200, y: 180 } });
    tool.pointerMove({ world: { x: 230, y: 200 } });
    tool.pointerUp();
    const result = layer.objects[0];
    assert.deepEqual([result.x, result.y, result.width, result.height], [70, 80, 160, 120]);
    assert.deepEqual(engine.history, [['begin', 'Resize image'], ['commit']]);
});

test('SelectTool rotates an image using the external rotation handle', () => {
    const { engine, layer } = createEngine();
    const tool = new SelectTool(engine);
    tool.pointerDown({ world: { x: 150, y: 76 } });
    tool.pointerMove({ world: { x: 250, y: 140 } });
    tool.pointerUp();
    assert.ok(Math.abs(layer.objects[0].rotation - 90) < 1e-8);
    assert.deepEqual(engine.history, [['begin', 'Rotate image'], ['commit']]);
});

test('SelectTool refuses resize and rotate handles on locked or hidden layers', () => {
    for (const state of [{ locked: true }, { visible: false }]) {
        const { engine, layer } = createEngine(state);
        const tool = new SelectTool(engine);
        const started = tool.pointerDown({ world: { x: 200, y: 180 } });
        assert.equal(started, false);
        assert.deepEqual(engine.history, []);
        assert.equal(layer.objects[0].width, 100);
    }
});

test('SelectTool cancel rolls back an unfinished image resize', () => {
    const { engine, layer } = createEngine();
    const tool = new SelectTool(engine);
    tool.pointerDown({ world: { x: 200, y: 180 } });
    tool.pointerMove({ world: { x: 240, y: 220 } });
    tool.cancel();
    assert.deepEqual(layer.objects[0], image);
    assert.deepEqual(engine.history, [['begin', 'Resize image'], ['cancel']]);
});
