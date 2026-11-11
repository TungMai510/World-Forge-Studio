import { BaseTool, createObjectId } from './BaseTool.js';

export class BrushTool extends BaseTool {
    pointerDown({ world }) {
        this.points = [world];
        return true;
    }

    pointerMove({ world }) {
        if (!this.points) return;
        const previous = this.points[this.points.length - 1];
        if (Math.hypot(world.x - previous.x, world.y - previous.y) >= Math.max(1, this.options.size * 0.2)) {
            this.points.push(world);
        }
    }

    pointerUp({ world }) {
        if (!this.points) return;
        this.pointerMove({ world });
        if (this.points.length === 1) {
            const { x, y } = this.points[0];
            this.points.push({ x: x + 0.01, y: y + 0.01 });
        }
        this.addObject({
            id: createObjectId('brush'),
            type: 'path',
            feature: 'brush',
            commands: this.points.map((point, index) => ({
                type: index === 0 ? 'moveTo' : 'lineTo',
                x: point.x,
                y: point.y
            })),
            closed: false,
            fill: 'transparent',
            stroke: this.options.color,
            strokeWidth: this.options.size
        }, 'Brush stroke');
        this.points = null;
    }

    cancel() {
        this.points = null;
    }

    renderPreview(context) {
        if (!this.points || this.points.length < 2) return;
        context.save();
        context.strokeStyle = this.options.color;
        context.lineWidth = this.options.size;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.beginPath();
        this.points.forEach((point, index) => {
            if (index === 0) context.moveTo(point.x, point.y);
            else context.lineTo(point.x, point.y);
        });
        context.stroke();
        context.restore();
    }
}
