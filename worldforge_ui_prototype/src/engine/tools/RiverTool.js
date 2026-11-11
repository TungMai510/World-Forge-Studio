import { BrushTool } from './BrushTool.js';
import { createObjectId } from './BaseTool.js';

export class RiverTool extends BrushTool {
    constructor(engine, options = {}) {
        super(engine, { color: '#328bc1', size: 8, ...options });
    }

    pointerUp({ world }) {
        if (!this.points) return;
        this.pointerMove({ world });
        if (this.points.length === 1) {
            const { x, y } = this.points[0];
            this.points.push({ x: x + 0.01, y: y + 0.01 });
        }
        this.addObject({
            id: createObjectId('river'),
            type: 'path',
            feature: 'river',
            commands: this.points.map((point, index) => ({
                type: index === 0 ? 'moveTo' : 'lineTo',
                x: point.x,
                y: point.y
            })),
            closed: false,
            fill: 'transparent',
            stroke: this.options.color,
            strokeWidth: this.options.size,
            lineCap: 'round',
            lineJoin: 'round'
        }, 'River');
        this.points = null;
    }
}
