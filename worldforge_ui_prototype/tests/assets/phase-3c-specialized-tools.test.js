import test from 'node:test';
import assert from 'node:assert/strict';
import { IconTool } from '../../src/engine/tools/IconTool.js';
import { TerrainTool } from '../../src/engine/tools/TerrainTool.js';
import { LakeTool } from '../../src/engine/tools/LakeTool.js';
import { CanvasLayerRenderer } from '../../src/engine/layers/CanvasLayerRenderer.js';

function createEngine() {
    const objects = [];
    return {
        objects,
        layerManager: { getActiveLayer: () => ({ id: 'layer-1', visible: true, locked: false }) },
        addObject: (_layerId, object) => objects.push(object),
        scheduleRender() {}
    };
}

test('IconTool keeps vector fallback when no asset is selected', () => {
    const engine = createEngine();
    const tool = new IconTool(engine);
    tool.pointerDown({ world: { x: 120, y: 80 } });
    assert.equal(engine.objects.length, 1);
    assert.equal(engine.objects[0].type, 'icon');
    assert.equal(Object.hasOwn(engine.objects[0], 'assetRef'), false);
});

test('IconTool creates a semantic icon object with a namespaced asset reference', () => {
    const engine = createEngine();
    const tool = new IconTool(engine);
    const assetRef = { packId: 'org.example.symbols', assetId: 'CAPITAL-01', packVersion: '1.0.0' };
    tool.setAssetSelection({
        asset: { id: 'CAPITAL-01', packId: 'org.example.symbols' },
        assetRef
    });
    tool.pointerDown({ world: { x: 120, y: 80 } });
    assert.equal(engine.objects.length, 1);
    assert.equal(engine.objects[0].type, 'icon');
    assert.deepEqual(engine.objects[0].assetRef, assetRef);
    assert.equal(engine.objects[0].x, 120);
    assert.equal(engine.objects[0].y, 80);
});

test('CanvasLayerRenderer delegates asset-backed icon drawing to ImageObjectRenderer', () => {
    const calls = [];
    const renderer = new CanvasLayerRenderer({
        imageRenderer: { draw: (_context, object) => calls.push(object) }
    });
    renderer.drawObject({ save() {}, restore() {} }, {
        id: 'icon-1',
        type: 'icon',
        x: 50,
        y: 70,
        size: 32,
        assetRef: { packId: 'org.example.symbols', assetId: 'CAPITAL-01', packVersion: '1.0.0' }
    });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].type, 'image');
    assert.deepEqual(calls[0].assetRef, {
        packId: 'org.example.symbols',
        assetId: 'CAPITAL-01',
        packVersion: '1.0.0'
    });
    assert.deepEqual(
        { x: calls[0].x, y: calls[0].y, width: calls[0].width, height: calls[0].height },
        { x: 34, y: 54, width: 32, height: 32 }
    );
});


test('TerrainTool keeps polygon mode when no stamp asset is selected', () => {
    const engine = createEngine();
    const tool = new TerrainTool(engine);
    tool.pointerDown({ world: { x: 10, y: 10 }, event: { detail: 1 } });
    tool.pointerDown({ world: { x: 90, y: 10 }, event: { detail: 1 } });
    tool.pointerDown({ world: { x: 50, y: 80 }, event: { detail: 2 } });
    assert.equal(engine.objects.length, 1);
    assert.equal(engine.objects[0].type, 'path');
    assert.equal(engine.objects[0].feature, 'terrain');
});

test('TerrainTool places a centered image stamp with the selected asset reference', () => {
    const engine = createEngine();
    const tool = new TerrainTool(engine);
    const assetRef = { packId: 'com.worldforge.classic-fantasy', assetId: 'MNT-001', packVersion: '1.0.0' };
    tool.setAssetSelection({
        asset: { id: 'MNT-001', packId: assetRef.packId, defaultSize: { width: 180, height: 120 } },
        assetRef
    });
    tool.pointerDown({ world: { x: 200, y: 150 } });
    assert.equal(engine.objects.length, 1);
    assert.equal(engine.objects[0].type, 'image');
    assert.equal(engine.objects[0].feature, 'terrain-stamp');
    assert.deepEqual(engine.objects[0].assetRef, assetRef);
    assert.deepEqual(
        { x: engine.objects[0].x, y: engine.objects[0].y, width: engine.objects[0].width, height: engine.objects[0].height },
        { x: 110, y: 90, width: 180, height: 120 }
    );
});

 test('CanvasLayerRenderer routes terrain image stamps through the image renderer', () => {
    const calls = [];
    const renderer = new CanvasLayerRenderer({ imageRenderer: { draw: (_context, object) => calls.push(object) } });
    const object = { type: 'image', assetRef: { packId: 'com.worldforge.classic-fantasy', assetId: 'MNT-001' }, x: 10, y: 20, width: 180, height: 120 };
    renderer.drawObject({}, object);
    assert.deepEqual(calls, [object]);
});


test('LakeTool keeps the solid-color ellipse workflow without a texture selection', () => {
    const engine = createEngine();
    const tool = new LakeTool(engine, { color: '#3b82f6' });
    tool.pointerDown({ world: { x: 10, y: 20 } });
    tool.pointerUp({ world: { x: 110, y: 80 } });
    assert.equal(engine.objects.length, 1);
    assert.equal(engine.objects[0].type, 'ellipse');
    assert.equal(engine.objects[0].feature, 'lake');
    assert.equal(engine.objects[0].fill, '#3b82f6');
    assert.equal(Object.hasOwn(engine.objects[0], 'textureAssetRef'), false);
});

test('LakeTool stores the selected texture Asset Pack reference on the lake object', () => {
    const engine = createEngine();
    const tool = new LakeTool(engine, { color: '#3b82f6' });
    const assetRef = { packId: 'com.example.water', assetId: 'WATER-01', packVersion: '1.2.0' };
    tool.setAssetSelection({
        asset: { id: 'WATER-01', packId: assetRef.packId },
        assetRef
    });
    tool.pointerDown({ world: { x: 10, y: 20 } });
    tool.pointerUp({ world: { x: 110, y: 80 } });
    assert.equal(engine.objects.length, 1);
    assert.deepEqual(engine.objects[0].textureAssetRef, assetRef);
    assert.deepEqual(
        { x: engine.objects[0].x, y: engine.objects[0].y, radiusX: engine.objects[0].radiusX, radiusY: engine.objects[0].radiusY },
        { x: 60, y: 50, radiusX: 50, radiusY: 30 }
    );
});

test('CanvasLayerRenderer fills a lake ellipse with its repeated texture image', () => {
    const calls = [];
    const image = { naturalWidth: 32, naturalHeight: 32 };
    const renderer = new CanvasLayerRenderer({
        imageRenderer: { getImage: object => {
            calls.push(object);
            return image;
        } }
    });
    const context = {
        save() {}, restore() {}, beginPath() {}, ellipse() {}, clip() {}, stroke() {},
        createPattern: (source, repetition) => ({ source, repetition }),
        fillRect: (...args) => calls.push(args)
    };
    renderer.drawObject(context, {
        type: 'ellipse', x: 50, y: 40, radiusX: 30, radiusY: 20,
        fill: '#3b82f6', stroke: '#1e6091',
        textureAssetRef: { packId: 'com.example.water', assetId: 'WATER-01' }
    });
    assert.equal(calls[0].assetRef.assetId, 'WATER-01');
    assert.deepEqual(calls[1], [20, 20, 60, 40]);
});
