import { BaseTool } from './BaseTool.js';

export class SelectTool extends BaseTool {
    pointerDown({ world }) {
        const object = this.engine.getObjectAt(world);
        this.engine.setSelection(object ? object.id : null);
        if (!object) return false;
        const layer = this.engine.map.layers.find(item => item.id === object.layerId);
        if (!layer || layer.locked) return false;
        this.engine.beginEditGroup('Move object');
        this.draggedObjectId = object.id;
        this.previousWorld = world;
        return true;
    }

    pointerMove({ world }) {
        if (!this.draggedObjectId) return;
        const dx = world.x - this.previousWorld.x;
        const dy = world.y - this.previousWorld.y;
        if (dx || dy) {
            this.engine.translateObject(this.draggedObjectId, dx, dy);
            this.previousWorld = world;
        }
    }

    pointerUp() {
        if (!this.draggedObjectId) return;
        this.engine.commitEditGroup();
        this.draggedObjectId = null;
        this.previousWorld = null;
    }

    cancel() {
        if (this.draggedObjectId) this.engine.cancelEditGroup();
        this.draggedObjectId = null;
        this.previousWorld = null;
    }
}
