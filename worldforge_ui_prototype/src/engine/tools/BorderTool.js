import { BrushTool } from './BrushTool.js';
import { createObjectId } from './BaseTool.js';

export class BorderTool extends BrushTool {
    constructor(engine, options = {}) {
        super(engine, { color: '#7c2d12', size: 3, ...options });
    }

    pointerUp({ world }) {
        if (!this.points) return;
        this.pointerMove({ world });
        if (this.points.length === 1) {
            const { x, y } = this.points[0];
            this.points.push({ x: x + 0.01, y: y + 0.01 });
        }
        this.addObject({
            id: createObjectId('border'),
            type: 'path',
            feature: 'border',
            commands: this.points.map((point, index) => ({
                type: index === 0 ? 'moveTo' : 'lineTo',
                x: point.x,
                y: point.y
            })),
            closed: false,
            fill: 'transparent',
            stroke: this.options.color,
            strokeWidth: this.options.size,
            dash: [12, 8]
        }, 'Border');
        this.points = null;
    }
}
