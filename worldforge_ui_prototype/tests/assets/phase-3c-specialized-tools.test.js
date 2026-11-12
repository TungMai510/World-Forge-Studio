import test from 'node:test';
import assert from 'node:assert/strict';
import { IconTool } from '../../src/engine/tools/IconTool.js';
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
