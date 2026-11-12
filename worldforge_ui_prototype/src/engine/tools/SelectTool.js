import { BaseTool } from './BaseTool.js';
import { getImageObjectCorners } from '../objects/ImageObjectRenderer.js';

const MIN_IMAGE_SIZE = 8;
const HANDLE_SIZE = 8;
const ROTATE_OFFSET = 24;

function imageHandles(object, zoom = 1) {
    const corners = getImageObjectCorners(object);
    const center = { x: object.x + object.width / 2, y: object.y + object.height / 2 };
    const topMid = {
        x: (corners[0].x + corners[1].x) / 2,
        y: (corners[0].y + corners[1].y) / 2
    };
    const dx = topMid.x - center.x;
    const dy = topMid.y - center.y;
    const length = Math.hypot(dx, dy) || 1;
    return {
        corners,
        resize: corners[2],
        rotate: {
            x: topMid.x + (dx / length) * ROTATE_OFFSET / zoom,
            y: topMid.y + (dy / length) * ROTATE_OFFSET / zoom
        }
    };
}

function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

export class SelectTool extends BaseTool {
    pointerDown({ world }) {
        const selected = this.engine.findObject(this.engine.selectedObjectId);
        if (selected?.type === 'image') {
            const handles = imageHandles(selected, this.engine.getZoom());
            const tolerance = 10 / this.engine.getZoom();
            if (distance(world, handles.rotate) <= tolerance) {
                if (!this.startImageEdit(selected, 'rotate')) return false;
                this.startAngle = Math.atan2(
                    world.y - (selected.y + selected.height / 2),
                    world.x - (selected.x + selected.width / 2)
                );
                return true;
            }
            if (distance(world, handles.resize) <= tolerance) {
                return this.startImageEdit(selected, 'resize');
            }
        }

        const object = this.engine.getObjectAt(world);
        this.engine.setSelection(object ? object.id : null);
        if (!object) return false;
        const layer = this.engine.map.layers.find(item => item.id === object.layerId);
        if (!layer || layer.locked) return false;
        this.engine.beginEditGroup('Move object');
        this.draggedObjectId = object.id;
        this.editMode = 'move';
        this.previousWorld = world;
        return true;
    }

    startImageEdit(object, mode) {
        const layer = this.engine.map.layers.find(item => item.objects.some(entry => entry.id === object.id));
        if (!layer || layer.locked || !layer.visible) return false;
        this.engine.beginEditGroup(mode === 'resize' ? 'Resize image' : 'Rotate image');
        this.draggedObjectId = object.id;
        this.editMode = mode;
        this.startObject = { ...object };
        this.previousWorld = null;
        return true;
    }

    pointerMove({ world }) {
        if (!this.draggedObjectId) return;
        const entry = this.engine.findObjectEntry(this.draggedObjectId);
        if (!entry) return;
        const current = entry.layer.objects[entry.index];

        if (this.editMode === 'move') {
            const dx = world.x - this.previousWorld.x;
            const dy = world.y - this.previousWorld.y;
            if (dx || dy) {
                this.engine.translateObject(this.draggedObjectId, dx, dy);
                this.previousWorld = world;
            }
            return;
        }

        const original = this.startObject;
        const center = { x: original.x + original.width / 2, y: original.y + original.height / 2 };
        const angle = (original.rotation || 0) * Math.PI / 180;
        const dx = world.x - center.x;
        const dy = world.y - center.y;
        const localX = dx * Math.cos(angle) + dy * Math.sin(angle);
        const localY = -dx * Math.sin(angle) + dy * Math.cos(angle);
        let changes;

        if (this.editMode === 'resize') {
            const width = Math.max(MIN_IMAGE_SIZE, localX * 2);
            const height = Math.max(MIN_IMAGE_SIZE, localY * 2);
            changes = { x: center.x - width / 2, y: center.y - height / 2, width, height };
        } else if (this.editMode === 'rotate') {
            const pointerAngle = Math.atan2(world.y - center.y, world.x - center.x);
            const delta = (pointerAngle - this.startAngle) * 180 / Math.PI;
            changes = { rotation: ((original.rotation || 0) + delta + 360) % 360 };
        }

        entry.layer.objects[entry.index] = this.engine.validateObject({ ...current, ...changes });
        this.engine.scheduleRender();
    }

    pointerUp() {
        if (!this.draggedObjectId) return;
        this.engine.commitEditGroup();
        this.resetEdit();
    }

    cancel() {
        if (this.draggedObjectId) this.engine.cancelEditGroup();
        this.resetEdit();
    }

    resetEdit() {
        this.draggedObjectId = null;
        this.previousWorld = null;
        this.startObject = null;
        this.startAngle = null;
        this.editMode = null;
    }

    renderPreview(context, { zoom = 1, selectedObjectId }) {
        const object = this.engine.findObject(selectedObjectId);
        if (!object || object.type !== 'image') return;
        const handles = imageHandles(object, zoom);
        const corners = handles.corners;
        context.save();
        context.strokeStyle = '#2563eb';
        context.lineWidth = 1.5 / zoom;
        context.setLineDash([5 / zoom, 3 / zoom]);
        context.beginPath();
        context.moveTo(corners[0].x, corners[0].y);
        for (let index = 1; index < corners.length; index += 1) {
            context.lineTo(corners[index].x, corners[index].y);
        }
        context.closePath();
        context.stroke();
        context.setLineDash([]);
        context.beginPath();
        context.moveTo((corners[0].x + corners[1].x) / 2, (corners[0].y + corners[1].y) / 2);
        context.lineTo(handles.rotate.x, handles.rotate.y);
        context.stroke();
        for (const point of [handles.resize, handles.rotate]) {
            context.beginPath();
            context.fillStyle = '#ffffff';
            context.strokeStyle = '#2563eb';
            context.lineWidth = 1.5 / zoom;
            context.arc(point.x, point.y, HANDLE_SIZE / zoom, 0, Math.PI * 2);
            context.fill();
            context.stroke();
        }
        context.restore();
    }
}
