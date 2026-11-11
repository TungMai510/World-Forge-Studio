import { PolygonTool } from './PolygonTool.js';

export class LandmassTool extends PolygonTool {
    constructor(engine, options = {}) {
        super(engine, { color: '#78a56a', size: 3, ...options });
    }
}
