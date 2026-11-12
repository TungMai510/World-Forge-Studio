import test from 'node:test';
import assert from 'node:assert/strict';
import { MapCanvasEngine } from '../../src/engine/MapCanvasEngine.js';
import { CanvasLayerRenderer } from '../../src/engine/layers/CanvasLayerRenderer.js';
import {
    normalizeImageObject,
    getImageObjectBounds,
    hitTestImageObject,
    ImageObjectRenderer
} from '../../src/engine/objects/ImageObjectRenderer.js';

const validImage = {
    id: 'img-001',
    type: 'image',
    schemaVersion: 1,
    assetRef: { packId: 'com.worldforge.classic-fantasy', assetId: 'MNT-001' },
    x: 100,
    y: 120,
    width: 180,
    height: 140
};

test('image object: normalizes schema defaults and asset reference', () => {
    const normalized = normalizeImageObject(validImage);
    assert.equal(normalized.schemaVersion, 1);
    assert.deepEqual(normalized.assetRef, {
        packId: 'com.worldforge.classic-fantasy',
        assetId: 'MNT-001'
    });
    assert.equal(normalized.rotation, 0);
    assert.equal(normalized.opacity, 1);
    assert.equal(normalized.fit, 'contain');
});

test('image object: rejects missing references, invalid geometry and unsupported fit', () => {
    assert.throws(() => normalizeImageObject({ ...validImage, assetRef: null }), /Asset Pack and asset reference/);
    assert.throws(() => normalizeImageObject({ ...validImage, width: 0 }), /geometry, rotation or opacity/);
    assert.throws(() => normalizeImageObject({ ...validImage, opacity: 1.1 }), /geometry, rotation or opacity/);
    assert.throws(() => normalizeImageObject({ ...validImage, fit: 'stretch' }), /fit must be/);
});

test('image object: computes rotated axis-aligned bounds', () => {
    const bounds = getImageObjectBounds({ ...validImage, rotation: 90 });
    assert.ok(Math.abs(bounds.x - 120) < 1e-8);
    assert.ok(Math.abs(bounds.y - 100) < 1e-8);
    assert.ok(Math.abs(bounds.width - 140) < 1e-8);
    assert.ok(Math.abs(bounds.height - 180) < 1e-8);
});

test('image object: hit testing accounts for rotation', () => {
    const object = { ...validImage, rotation: 90 };
    assert.equal(hitTestImageObject(object, { x: 190, y: 210 }), true);
    assert.equal(hitTestImageObject(object, { x: 110, y: 130 }), false);
});

test('engine: validates image objects and rejects unsupported schema versions', () => {
    const engine = Object.create(MapCanvasEngine.prototype);
    const normalized = engine.validateObject(validImage);
    assert.equal(normalized.type, 'image');
    assert.equal(normalized.assetRef.assetId, 'MNT-001');
    assert.throws(() => engine.validateObject({ ...validImage, schemaVersion: 2 }), /schema version/);
    assert.throws(() => engine.validateObject({ ...validImage, id: '' }), /ID/);
});

test('canvas layer renderer: delegates image drawing and hit testing', () => {
    const calls = [];
    const renderer = new CanvasLayerRenderer({
        imageRenderer: { draw: (_context, object) => calls.push(object.id) }
    });
    renderer.drawObject({}, validImage);
    assert.deepEqual(calls, ['img-001']);
    assert.equal(renderer.hitTest(validImage, { x: 150, y: 160 }, 0), true);
});

test('image renderer: loads an AssetLoader URL and redraws after image load', () => {
    let invalidations = 0;
    let drawCalls = 0;
    class FakeImage {
        constructor() { this.complete = false; this.naturalWidth = 100; this.naturalHeight = 80; }
        set src(value) { this.source = value; }
    }
    const renderer = new ImageObjectRenderer({
        assetLoader: { load: () => ({ url: 'blob:test-image' }) },
        createImage: () => new FakeImage(),
        onInvalidate: () => { invalidations += 1; }
    });
    const context = {
        save() {}, restore() {}, translate() {}, rotate() {},
        drawImage() { drawCalls += 1; },
        beginPath() {}, rect() {}, clip() {},
        fillRect() {}, strokeRect() {}, moveTo() {}, lineTo() {}, stroke() {}
    };
    renderer.draw(context, validImage);
    const cached = [...renderer.images.values()][0];
    assert.equal(cached.status, 'loading');
    cached.image.complete = true;
    cached.image.onload();
    renderer.draw(context, validImage);
    assert.equal(cached.status, 'ready');
    assert.equal(drawCalls, 1);
    assert.equal(invalidations, 1);
});
