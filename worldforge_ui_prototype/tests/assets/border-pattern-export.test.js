import test from 'node:test';
import assert from 'node:assert/strict';
import { MapExportService } from '../../src/services/map-export-service.js';

test('MapExportService embeds repeated border pattern tiles in SVG export', async () => {
    const blob = new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' });
    const service = new MapExportService({
        imageRenderer: { assetLoader: { load: () => ({ blob, mimeType: 'image/png' }) }, preload: async () => {} },
        draw() {}
    });
    const config = {
        map: {
            width: 200, height: 100,
            layers: [{
                id: 'layer-1', name: 'Borders', visible: true, opacity: 1, role: 'content',
                objects: [{
                    id: 'border-1', type: 'path', feature: 'border',
                    commands: [{ type: 'moveTo', x: 10, y: 20 }, { type: 'lineTo', x: 106, y: 20 }],
                    closed: false, fill: 'transparent', stroke: '#7c2d12', strokeWidth: 3, dash: [12, 8],
                    patternAssetRef: { packId: 'com.worldforge.classic-fantasy', assetId: 'BND-001' },
                    patternSize: { width: 48, height: 16 }, patternScale: 1
                }]
            }]
        },
        layerIds: new Set(['layer-1']), width: 200, height: 100, scale: 1,
        pixelWidth: 200, pixelHeight: 100, transparent: true, style: 'standard', caption: ''
    };
    const svg = await service.renderSvg(config);
    assert.match(svg, /<path d="M 10 20 L 106 20"/);
    assert.match(svg, /href="data:image\/png;base64,/);
    assert.equal((svg.match(/<image /g) || []).length, 2);
});
