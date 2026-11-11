import { PolygonTool } from './PolygonTool.js';

export class TerrainTool extends PolygonTool {
    constructor(engine, options = {}) {
        super(engine, { color: '#a88954', size: 2, terrain: 'mountain', ...options });
        this.feature = 'terrain';
    }
}
