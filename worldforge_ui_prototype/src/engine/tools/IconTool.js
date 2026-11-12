import { BaseTool, createObjectId } from './BaseTool.js';

export class IconTool extends BaseTool {
    constructor(engine, options = {}) {
        super(engine, { color: '#7c2d12', size: 24, icon: 'city', ...options });
    }

    setOptions(options) {
        const size = options.size === undefined ? this.options.size : options.size;
        if (!Number.isFinite(size) || size < 8 || size > 256) {
            throw new Error('Icon size must be a number between 8 and 256.');
        }
        super.setOptions(options);
    }

    pointerDown({ world }) {
        this.addObject({
            id: createObjectId('icon'),
            type: 'icon',
            feature: 'icon',
            x: world.x,
            y: world.y,
            icon: this.options.icon,
            size: this.options.size,
            color: this.options.color,
            ...(this.assetSelection ? { assetRef: { ...this.assetSelection.assetRef } } : {})
        }, 'Map icon');
        return false;
    }
}
