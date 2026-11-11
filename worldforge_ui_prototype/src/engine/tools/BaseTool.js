export function createObjectId(prefix = 'object') {
    return globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function'
        ? `${prefix}-${globalThis.crypto.randomUUID()}`
        : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export class BaseTool {
    constructor(engine, options = {}) {
        this.engine = engine;
        this.options = { color: '#334155', size: 8, terrain: 'forest', icon: 'city', text: 'Label', ...options };
    }

    setOptions(options) {
        if (Object.hasOwn(options, 'size') &&
            (!Number.isFinite(options.size) || options.size < 1 || options.size > 512)) {
            throw new Error('Tool size must be a number between 1 and 512.');
        }
        if (Object.hasOwn(options, 'color') &&
            (typeof options.color !== 'string' || !/^#[\da-f]{6}$/i.test(options.color))) {
            throw new Error('Tool color must be a six-digit hexadecimal value.');
        }
        if (Object.hasOwn(options, 'terrain') &&
            !['mountain', 'forest', 'hills', 'desert', 'swamp', 'snow'].includes(options.terrain)) {
            throw new Error('Unsupported terrain type.');
        }
        if (Object.hasOwn(options, 'icon') &&
            !['capital', 'city', 'village', 'port'].includes(options.icon)) {
            throw new Error('Unsupported icon type.');
        }
        if (Object.hasOwn(options, 'text') &&
            (typeof options.text !== 'string' || options.text.length > 500)) {
            throw new Error('Tool text must contain no more than 500 characters.');
        }
        this.options = { ...this.options, ...options };
    }

    pointerDown() {
        return false;
    }

    pointerMove() {}

    pointerUp() {}

    keyDown() {
        return false;
    }

    cancel() {}

    renderPreview() {}

    addObject(object, label) {
        const layer = this.engine.layerManager.getActiveLayer();
        if (!layer) throw new Error('Select a visible, unlocked layer before drawing.');
        this.engine.addObject(layer.id, object, label);
    }
}
