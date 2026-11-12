import { BaseTool, createObjectId } from './BaseTool.js';

function normalizeAssetRef(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value) ||
        typeof value.packId !== 'string' || !value.packId.trim() ||
        typeof value.assetId !== 'string' || !value.assetId.trim()) {
        throw new Error('Place Asset Tool requires a valid assetRef (packId and assetId).');
    }
    const result = { packId: value.packId.trim(), assetId: value.assetId.trim() };
    if (value.packVersion !== undefined) {
        if (typeof value.packVersion !== 'string' || !value.packVersion.trim()) {
            throw new Error('Asset Pack version must be a non-empty string.');
        }
        result.packVersion = value.packVersion.trim();
    }
    return result;
}

function normalizeSize(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value) ||
        !Number.isFinite(value.width) || !Number.isFinite(value.height) ||
        value.width < 1 || value.height < 1 || value.width > 8192 || value.height > 8192) {
        throw new Error('Default asset size must have width and height between 1 and 8192.');
    }
    return { width: value.width, height: value.height };
}

export class PlaceAssetTool extends BaseTool {
    constructor(engine, options = {}) {
        super(engine, {
            assetRef: null,
            defaultSize: { width: 128, height: 128 },
            rotation: 0,
            opacity: 1,
            fit: 'contain',
            ...options
        });
        this.placement = null;
        this.setOptions(options);
    }

    setAssetSelection(selection) {
        super.setAssetSelection(selection);
        const defaultSize = selection.asset.defaultSize || this.options.defaultSize;
        this.setOptions({ assetRef: selection.assetRef, defaultSize });
        return this.assetSelection;
    }

    setOptions(options) {
        if (!options || typeof options !== 'object' || Array.isArray(options)) {
            throw new Error('Place Asset Tool options must be an object.');
        }
        const next = { ...options };
        if (Object.hasOwn(next, 'assetRef')) {
            next.assetRef = next.assetRef === null ? null : normalizeAssetRef(next.assetRef);
        }
        if (Object.hasOwn(next, 'defaultSize')) next.defaultSize = normalizeSize(next.defaultSize);
        if (Object.hasOwn(next, 'rotation') &&
            (!Number.isFinite(next.rotation) || Math.abs(next.rotation) > 36000)) {
            throw new Error('Asset rotation must be a finite value within ±36000 degrees.');
        }
        if (Object.hasOwn(next, 'opacity') &&
            (!Number.isFinite(next.opacity) || next.opacity < 0 || next.opacity > 1)) {
            throw new Error('Asset opacity must be between 0 and 1.');
        }
        if (Object.hasOwn(next, 'fit') && !['contain', 'cover', 'fill'].includes(next.fit)) {
            throw new Error('Asset fit must be contain, cover or fill.');
        }
        super.setOptions(next);
        if (this.options.assetRef) this.options.assetRef = { ...this.options.assetRef };
        if (this.options.defaultSize) this.options.defaultSize = { ...this.options.defaultSize };
        this.engine.scheduleRender?.();
    }

    pointerDown({ world, screen }) {
        if (!this.options.assetRef) {
            throw new Error('Choose an asset in the Asset Library before placing it.');
        }
        const layer = this.engine.layerManager.getActiveLayer();
        if (!layer || layer.visible === false || layer.locked) {
            throw new Error('Select a visible, unlocked layer before placing an asset.');
        }
        this.placement = {
            start: { ...world },
            current: { ...world },
            startScreen: screen ? { ...screen } : null,
            dragged: false
        };
        this.engine.scheduleRender?.();
        return true;
    }

    pointerMove({ world, screen }) {
        if (!this.placement) return;
        this.placement.current = { ...world };
        if (screen && this.placement.startScreen) {
            const dx = screen.x - this.placement.startScreen.x;
            const dy = screen.y - this.placement.startScreen.y;
            this.placement.dragged = Math.hypot(dx, dy) >= 4;
        } else {
            this.placement.dragged = Math.hypot(
                world.x - this.placement.start.x,
                world.y - this.placement.start.y
            ) >= 4;
        }
    }

    getPlacementBounds(world = this.placement?.current) {
        if (!this.placement) return null;
        if (!this.placement.dragged) {
            const { width, height } = this.options.defaultSize;
            return {
                x: this.placement.start.x - width / 2,
                y: this.placement.start.y - height / 2,
                width,
                height
            };
        }
        return {
            x: Math.min(this.placement.start.x, world.x),
            y: Math.min(this.placement.start.y, world.y),
            width: Math.max(1, Math.abs(world.x - this.placement.start.x)),
            height: Math.max(1, Math.abs(world.y - this.placement.start.y))
        };
    }

    pointerUp({ world, screen }) {
        if (!this.placement) return;
        this.pointerMove({ world, screen });
        const placement = this.placement;
        this.placement = null;
        const bounds = this.getBoundsForPlacement(placement, world);
        this.addObject({
            id: createObjectId('image'),
            type: 'image',
            schemaVersion: 1,
            assetRef: { ...this.options.assetRef },
            ...bounds,
            rotation: this.options.rotation,
            opacity: this.options.opacity,
            fit: this.options.fit
        }, 'Place asset');
        this.engine.scheduleRender?.();
    }

    getBoundsForPlacement(placement, world) {
        if (!placement.dragged) {
            const { width, height } = this.options.defaultSize;
            return {
                x: placement.start.x - width / 2,
                y: placement.start.y - height / 2,
                width,
                height
            };
        }
        return {
            x: Math.min(placement.start.x, world.x),
            y: Math.min(placement.start.y, world.y),
            width: Math.max(1, Math.abs(world.x - placement.start.x)),
            height: Math.max(1, Math.abs(world.y - placement.start.y))
        };
    }

    renderPreview(context) {
        if (!this.placement) return;
        const bounds = this.getPlacementBounds();
        if (!bounds) return;
        context.save();
        context.fillStyle = 'rgba(59, 130, 246, 0.12)';
        context.strokeStyle = '#3b82f6';
        context.lineWidth = 2;
        context.setLineDash?.([6, 4]);
        context.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
        context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
        context.restore();
    }

    cancel() {
        this.placement = null;
        this.engine.scheduleRender?.();
    }
}
