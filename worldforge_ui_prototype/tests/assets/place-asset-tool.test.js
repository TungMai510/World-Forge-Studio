import test from 'node:test';
import assert from 'node:assert/strict';
import { PlaceAssetTool } from '../../src/engine/tools/PlaceAssetTool.js';
import { ToolManager, TOOL_DEFINITIONS } from '../../src/engine/tools/ToolManager.js';

const assetRef = {
    packId: 'com.worldforge.classic-fantasy',
    assetId: 'MNT-001',
    packVersion: '1.0.0'
};

function createEngine() {
    const added = [];
    const layer = { id: 'layer-map', visible: true, locked: false };
    return {
        added,
        layerManager: { getActiveLayer: () => layer },
        addObject(layerId, object, label) {
            added.push({ layerId, object, label });
            return object;
        },
        scheduleRender() {}
    };
}

test('PlaceAssetTool is registered with the P shortcut', () => {
    const definition = TOOL_DEFINITIONS.find(item => item.id === 'place-asset');
    assert.ok(definition);
    assert.equal(definition.shortcut, 'P');
    const manager = new ToolManager(createEngine());
    assert.ok(manager.getTool('place-asset') instanceof PlaceAssetTool);
});

test('PlaceAssetTool places a default-sized image centered on a click', () => {
    const engine = createEngine();
    const tool = new PlaceAssetTool(engine, {
        assetRef,
        defaultSize: { width: 180, height: 120 },
        opacity: 0.75,
        rotation: 15
    });
    assert.equal(tool.pointerDown({ world: { x: 300, y: 200 }, screen: { x: 30, y: 20 } }), true);
    tool.pointerUp({ world: { x: 300, y: 200 } });

    assert.equal(engine.added.length, 1);
    const { layerId, object, label } = engine.added[0];
    assert.equal(layerId, 'layer-map');
    assert.equal(label, 'Place asset');
    assert.equal(object.type, 'image');
    assert.equal(object.schemaVersion, 1);
    assert.deepEqual(object.assetRef, assetRef);
    assert.deepEqual(
        { x: object.x, y: object.y, width: object.width, height: object.height },
        { x: 210, y: 140, width: 180, height: 120 }
    );
    assert.equal(object.opacity, 0.75);
    assert.equal(object.rotation, 15);
    assert.equal(object.fit, 'contain');
});

test('PlaceAssetTool drag placement normalizes bounds in every drag direction', () => {
    const engine = createEngine();
    const tool = new PlaceAssetTool(engine, { assetRef });
    tool.pointerDown({ world: { x: 400, y: 350 }, screen: { x: 40, y: 35 } });
    tool.pointerMove({ world: { x: 180, y: 120 }, screen: { x: 18, y: 12 } });
    tool.pointerUp({ world: { x: 180, y: 120 } });

    const object = engine.added[0].object;
    assert.deepEqual(
        { x: object.x, y: object.y, width: object.width, height: object.height },
        { x: 180, y: 120, width: 220, height: 230 }
    );
});

test('PlaceAssetTool requires a selected asset and a usable active layer', () => {
    const engine = createEngine();
    const tool = new PlaceAssetTool(engine);
    assert.throws(
        () => tool.pointerDown({ world: { x: 10, y: 10 }, screen: { x: 1, y: 1 } }),
        /Choose an asset/
    );
    tool.setOptions({ assetRef });
    engine.layerManager.getActiveLayer = () => ({ id: 'locked', visible: true, locked: true });
    assert.throws(
        () => tool.pointerDown({ world: { x: 10, y: 10 }, screen: { x: 1, y: 1 } }),
        /visible, unlocked layer/
    );
    assert.equal(engine.added.length, 0);
});

test('PlaceAssetTool validates options and cancel discards an unfinished placement', () => {
    const engine = createEngine();
    const tool = new PlaceAssetTool(engine, { assetRef });
    assert.throws(() => tool.setOptions({ opacity: 2 }), /opacity/);
    assert.throws(() => tool.setOptions({ fit: 'stretch' }), /fit/);
    assert.throws(() => tool.setOptions({ defaultSize: { width: 0, height: 20 } }), /Default asset size/);

    tool.pointerDown({ world: { x: 50, y: 60 }, screen: { x: 5, y: 6 } });
    tool.pointerMove({ world: { x: 90, y: 100 }, screen: { x: 9, y: 10 } });
    tool.cancel();
    tool.pointerUp({ world: { x: 90, y: 100 } });
    assert.equal(engine.added.length, 0);
});
