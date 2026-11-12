import { PolygonTool } from './PolygonTool.js';
import { createObjectId } from './BaseTool.js';

export class TerrainTool extends PolygonTool {
    constructor(engine, options = {}) {
        super(engine, { color: '#a88954', size: 2, terrain: 'mountain', ...options });
        this.feature = 'terrain';
    }

    pointerDown(payload) {
        if (!this.assetSelection) return super.pointerDown(payload);

        const { world } = payload;
        const defaultSize = this.assetSelection.asset.defaultSize || { width: 180, height: 120 };
        const width = Number.isFinite(defaultSize.width) && defaultSize.width > 0 ? defaultSize.width : 180;
        const height = Number.isFinite(defaultSize.height) && defaultSize.height > 0 ? defaultSize.height : 120;
        this.addObject({
            id: createObjectId('terrain-stamp'),
            type: 'image',
            feature: 'terrain-stamp',
            assetRef: { ...this.assetSelection.assetRef },
            x: world.x - width / 2,
            y: world.y - height / 2,
            width,
            height,
            rotation: 0,
            opacity: 1,
            fit: 'contain'
        }, 'Terrain asset stamp');
        return false;
    }
}
