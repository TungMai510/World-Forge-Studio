import { BaseTool } from './BaseTool.js';

export class EraserTool extends BaseTool {
    pointerDown({ world }) {
        this.objectIds = new Set();
        this.eraseAt(world);
        return true;
    }

    pointerMove({ world }) {
        if (this.objectIds) this.eraseAt(world);
    }

    pointerUp() {
        if (!this.objectIds) return;
        const ids = [...this.objectIds];
        this.objectIds = null;
        if (ids.length) this.engine.deleteObjects(ids, 'Erase objects');
    }

    cancel() {
        this.objectIds = null;
    }

    eraseAt(world) {
        const id = this.engine.hitTest(world, this.options.size / 2);
        if (id) this.objectIds.add(id);
    }

    renderPreview(context, { cursorWorld }) {
        if (!cursorWorld) return;
        context.save();
        context.strokeStyle = '#ef4444';
        context.lineWidth = 2 / this.engine.viewport.zoom;
        context.beginPath();
        context.arc(cursorWorld.x, cursorWorld.y, this.options.size / 2, 0, Math.PI * 2);
        context.stroke();
        context.restore();
    }
}
