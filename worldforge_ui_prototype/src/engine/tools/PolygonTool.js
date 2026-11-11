import { BaseTool, createObjectId } from './BaseTool.js';

export class PolygonTool extends BaseTool {
    constructor(engine, options = {}) {
        super(engine, options);
        this.feature = 'landmass';
    }

    pointerDown({ world, event }) {
        if (!this.points) this.points = [];
        this.points.push(world);
        if (event.detail > 1) this.finish();
        return false;
    }

    keyDown(event) {
        if (event.key === 'Enter') {
            this.finish();
            return true;
        }
        return false;
    }

    finish() {
        if (!this.points || this.points.length < 3) {
            this.points = null;
            return false;
        }
        const points = this.points;
        this.points = null;
        this.addObject({
            id: createObjectId(this.feature),
            type: 'path',
            feature: this.feature,
            commands: points.map((point, index) => ({
                type: index === 0 ? 'moveTo' : 'lineTo',
                x: point.x,
                y: point.y
            })).concat([{ type: 'close' }]),
            closed: true,
            fill: this.options.color,
            stroke: this.options.stroke || this.options.color,
            strokeWidth: this.options.size,
            terrainType: this.options.terrain
        }, this.feature === 'terrain' ? 'Terrain area' : 'Landmass');
        return true;
    }

    cancel() {
        this.points = null;
    }

    renderPreview(context, { cursorWorld }) {
        if (!this.points || !this.points.length) return;
        context.save();
        context.fillStyle = `${this.options.color}55`;
        context.strokeStyle = this.options.color;
        context.lineWidth = 2 / this.engine.viewport.zoom;
        context.setLineDash([6 / this.engine.viewport.zoom, 4 / this.engine.viewport.zoom]);
        context.beginPath();
        this.points.forEach((point, index) => {
            if (index === 0) context.moveTo(point.x, point.y);
            else context.lineTo(point.x, point.y);
        });
        if (cursorWorld) context.lineTo(cursorWorld.x, cursorWorld.y);
        context.stroke();
        context.restore();
    }
}
