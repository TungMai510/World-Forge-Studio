import { BaseTool, createObjectId } from './BaseTool.js';

export class LakeTool extends BaseTool {
    pointerDown({ world }) {
        this.start = world;
        this.current = world;
        return true;
    }

    pointerMove({ world }) {
        if (this.start) this.current = world;
    }

    pointerUp({ world }) {
        if (!this.start) return;
        this.current = world;
        const x = Math.min(this.start.x, world.x);
        const y = Math.min(this.start.y, world.y);
        const radiusX = Math.abs(world.x - this.start.x) / 2;
        const radiusY = Math.abs(world.y - this.start.y) / 2;
        if (radiusX >= 2 && radiusY >= 2) {
            this.addObject({
                id: createObjectId('lake'),
                type: 'ellipse',
                feature: 'lake',
                x: x + radiusX,
                y: y + radiusY,
                radiusX,
                radiusY,
                fill: this.options.color,
                stroke: this.options.stroke || '#1e6091',
                strokeWidth: this.options.size
            }, 'Lake');
        }
        this.start = null;
        this.current = null;
    }

    cancel() {
        this.start = null;
        this.current = null;
    }

    renderPreview(context) {
        if (!this.start || !this.current) return;
        const x = Math.min(this.start.x, this.current.x);
        const y = Math.min(this.start.y, this.current.y);
        const radiusX = Math.abs(this.current.x - this.start.x) / 2;
        const radiusY = Math.abs(this.current.y - this.start.y) / 2;
        if (!radiusX || !radiusY) return;
        context.save();
        context.fillStyle = `${this.options.color}88`;
        context.strokeStyle = this.options.stroke || '#1e6091';
        context.lineWidth = this.options.size;
        context.beginPath();
        context.ellipse(x + radiusX, y + radiusY, radiusX, radiusY, 0, 0, Math.PI * 2);
        context.fill();
        context.stroke();
        context.restore();
    }
}
