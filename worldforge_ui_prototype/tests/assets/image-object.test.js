import test from 'node:test';
import assert from 'node:assert/strict';
import { MapCanvasEngine } from '../../src/engine/MapCanvasEngine.js';
import { CanvasLayerRenderer } from '../../src/engine/layers/CanvasLayerRenderer.js';
import { MapExportService } from '../../src/services/map-export-service.js';
import { AssetRegistry } from '../../src/assets/asset-registry.js';
import { AssetLoader } from '../../src/assets/asset-loader.js';
import { AssetPackService } from '../../src/assets/asset-pack-service.js';
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

test('image renderer: loads an AssetLoader URL and redraws after image load', async () => {
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
    const initialInvalidations = invalidations;
    const context = {
        save() {}, restore() {}, translate() {}, rotate() {},
        drawImage() { drawCalls += 1; },
        beginPath() {}, rect() {}, clip() {},
        fillRect() {}, strokeRect() {}, moveTo() {}, lineTo() {}, stroke() {}
    };
    const preload = renderer.preload([validImage]);
    const cached = [...renderer.images.values()][0];
    assert.equal(cached.status, 'loading');
    cached.image.complete = true;
    cached.image.onload();
    await preload;
    renderer.draw(context, validImage);
    assert.equal(cached.status, 'ready');
    assert.equal(drawCalls, 1);
    assert.equal(invalidations, initialInvalidations + 1);
});


test('map export: embeds image assets in standalone SVG output', async () => {
    const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    const renderer = new CanvasLayerRenderer({
        imageRenderer: {
            assetLoader: {
                load: () => ({
                    blob: new Blob([bytes], { type: 'image/png' }),
                    mimeType: 'image/png'
                })
            }
        }
    });
    const service = new MapExportService(renderer);
    const image = normalizeImageObject({ ...validImage, rotation: 30, opacity: 0.5, fit: 'cover' });
    const svg = await service.renderSvg({
        map: {
            width: 1000,
            height: 500,
            groups: [],
            layers: [{ id: 'layer-1', name: 'Images', visible: true, opacity: 1, role: null, objects: [image] }]
        },
        width: 1000,
        height: 500,
        scale: 1,
        pixelWidth: 1000,
        pixelHeight: 500,
        dpi: 96,
        transparent: true,
        caption: '',
        style: 'standard',
        layerIds: new Set(['layer-1'])
    });
    assert.match(svg, /<image /);
    assert.match(svg, /href="data:image\/png;base64,/);
    assert.match(svg, /preserveAspectRatio="xMidYMid slice"/);
    assert.match(svg, /opacity="0.5"/);
    assert.match(svg, /rotate\(30 /);
});


test('image renderer: invalidates decoded images when an Asset Pack is disabled or removed', async () => {
    const listeners = new Set();
    let available = true;
    let loads = 0;
    class CompleteImage {
        constructor() { this.complete = true; this.naturalWidth = 64; this.naturalHeight = 64; }
        set src(value) { this.source = value; }
    }
    const assetLoader = {
        load() {
            loads += 1;
            if (!available) throw new Error('Asset Pack is disabled.');
            return { url: `blob:image-${loads}` };
        },
        subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
        emit(event) { for (const listener of listeners) listener(event); }
    };
    const renderer = new ImageObjectRenderer({ assetLoader, createImage: () => new CompleteImage() });
    await renderer.ensureImage(validImage);
    assert.equal(renderer.images.size, 1);
    assert.ok(renderer.getImage(validImage));

    available = false;
    assetLoader.emit({ type: 'pack-invalidated', packId: validImage.assetRef.packId });
    assert.equal(renderer.images.size, 0);
    assert.equal(renderer.getImage(validImage), null);
    assert.equal(renderer.images.size, 1);
    assert.equal([...renderer.images.values()][0].status, 'error');

    available = true;
    assetLoader.emit({ type: 'pack-invalidated', packId: validImage.assetRef.packId });
    assert.equal(renderer.images.size, 0);
    renderer.getImage(validImage);
    assert.equal([...renderer.images.values()][0].status, 'ready');
    assert.equal(loads, 3);
});

test('image renderer: invalidating a pending image rejects preload and prevents stale cache resurrection', async () => {
    const listeners = new Set();
    class PendingImage {
        constructor() { this.complete = false; this.naturalWidth = 32; this.naturalHeight = 32; }
        set src(value) { this.source = value; }
    }
    const assetLoader = {
        load: () => ({ url: 'blob:pending' }),
        subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
        emit(event) { for (const listener of listeners) listener(event); }
    };
    const renderer = new ImageObjectRenderer({ assetLoader, createImage: () => new PendingImage() });
    const preload = renderer.preload([validImage]);
    const entry = [...renderer.images.values()][0];
    assetLoader.emit({ type: 'pack-invalidated', packId: validImage.assetRef.packId });
    await assert.rejects(preload, /invalidated while loading/);
    entry.image.onload();
    assert.equal(renderer.images.size, 0);
});

test('image renderer: immediately decoded images trigger a redraw notification', async () => {
    let invalidations = 0;
    class CompleteImage {
        constructor() { this.complete = true; this.naturalWidth = 100; this.naturalHeight = 80; }
        set src(value) { this.source = value; }
    }
    const renderer = new ImageObjectRenderer({
        assetLoader: { load: () => ({ url: 'blob:already-loaded' }) },
        createImage: () => new CompleteImage(),
        onInvalidate: () => { invalidations += 1; }
    });
    const initialInvalidations = invalidations;
    await renderer.ensureImage(validImage);
    assert.equal(invalidations, initialInvalidations + 1);
    assert.ok(renderer.getImage(validImage));
});


test('asset pack lifecycle: disabling a Pack invalidates the renderer decoded-image cache', async () => {
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    let nextUrl = 0;
    URL.createObjectURL = () => `blob:asset-${++nextUrl}`;
    URL.revokeObjectURL = () => {};
    try {
        const packId = validImage.assetRef.packId;
        const registry = new AssetRegistry();
        registry.registerPack({
            enabled: true,
            manifest: {
                id: packId,
                name: 'Test Pack',
                version: '1.0.0',
                assets: [{ id: validImage.assetRef.assetId, name: 'Mountain', file: 'assets/mountain.png', mimeType: 'image/png' }]
            },
            files: new Map([['assets/mountain.png', new Uint8Array([137,80,78,71,13,10,26,10])]])
        });
        const loader = new AssetLoader(registry);
        const service = new AssetPackService({ registry, loader });
        class CompleteImage {
            constructor() { this.complete = true; this.naturalWidth = 40; this.naturalHeight = 40; }
            set src(value) { this.source = value; }
        }
        const renderer = new ImageObjectRenderer({ assetLoader: loader, createImage: () => new CompleteImage() });
        await renderer.ensureImage(validImage);
        assert.equal(renderer.images.size, 1);

        service.setPackEnabled(packId, false);
        assert.equal(renderer.images.size, 0);
        assert.throws(() => loader.load(packId, validImage.assetRef.assetId), /Pack is disabled/);

        service.setPackEnabled(packId, true);
        await renderer.ensureImage(validImage);
        assert.equal(renderer.images.size, 1);
        assert.equal(nextUrl, 2);
        renderer.destroy();
        loader.clear();
    } finally {
        URL.createObjectURL = originalCreate;
        URL.revokeObjectURL = originalRevoke;
    }
});

test('image renderer: rejects a reference to a different Pack version', async () => {
    const renderer = new ImageObjectRenderer({
        assetLoader: { load: () => ({ url: 'blob:wrong-version', packVersion: '2.0.0' }) },
        createImage: () => ({})
    });
    const versioned = { ...validImage, assetRef: { ...validImage.assetRef, packVersion: '1.0.0' } };
    await assert.rejects(renderer.ensureImage(versioned), /requires Pack version "1.0.0"/);
});


test('image renderer: contain, cover and fill use the expected draw geometry', async () => {
    const cases = [
        { fit: 'contain', expected: [-50, -25, 100, 50], clips: 0 },
        { fit: 'cover', expected: [-100, -50, 200, 100], clips: 1 },
        { fit: 'fill', expected: [-50, -50, 100, 100], clips: 0 }
    ];
    for (const item of cases) {
        const renderer = new ImageObjectRenderer({
            assetLoader: { load: () => ({ url: 'blob:fit-test' }) },
            createImage: () => ({ complete: true, naturalWidth: 100, naturalHeight: 50, set src(value) { this.source = value; } })
        });
        const object = normalizeImageObject({ ...validImage, width: 100, height: 100, fit: item.fit, opacity: 0.4, rotation: 30 });
        await renderer.ensureImage(object);
        const calls = { draw: null, clips: 0, rotation: null, alpha: null };
        const context = {
            globalAlpha: 1,
            save() {}, restore() {}, translate() {},
            rotate(value) { calls.rotation = value; },
            drawImage(...args) { calls.draw = args.slice(1); calls.alpha = this.globalAlpha; },
            beginPath() {}, rect() {}, clip() { calls.clips += 1; },
            fillRect() {}, strokeRect() {}, moveTo() {}, lineTo() {}, stroke() {}
        };
        renderer.draw(context, object);
        assert.deepEqual(calls.draw, item.expected, `${item.fit} draw geometry`);
        assert.equal(calls.clips, item.clips, `${item.fit} clipping`);
        assert.ok(Math.abs(calls.rotation - Math.PI / 6) < 1e-10);
        assert.equal(calls.alpha, 0.4);
        renderer.destroy();
    }
});

test('image renderer: failed image decode reports an error and does not expose a drawable image', async () => {
    let reported = null;
    class BrokenImage {
        constructor() { this.complete = false; this.naturalWidth = 0; this.naturalHeight = 0; }
        set src(value) { this.source = value; }
    }
    const renderer = new ImageObjectRenderer({
        assetLoader: { load: () => ({ url: 'blob:broken-image' }) },
        createImage: () => new BrokenImage(),
        onError: error => { reported = error; }
    });
    const pending = renderer.ensureImage(validImage);
    const entry = [...renderer.images.values()][0];
    entry.image.onerror();
    await assert.rejects(pending, /Unable to decode image asset/);
    assert.match(reported.message, /Unable to decode image asset/);
    assert.equal(renderer.getImage(validImage), null);
    renderer.destroy();
});
