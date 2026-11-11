import { BaseTool, createObjectId } from './BaseTool.js';

export class TextTool extends BaseTool {
    constructor(engine, options = {}) {
        super(engine, { color: '#1f2937', size: 32, text: 'Label', ...options });
    }

    setOptions(options) {
        const size = options.size === undefined ? this.options.size : options.size;
        if (!Number.isFinite(size) || size < 6 || size > 512) {
            throw new Error('Text size must be a number between 6 and 512.');
        }
        super.setOptions(options);
    }

    pointerDown({ world }) {
        const text = this.options.text.trim();
        if (!text) throw new Error('Enter text in the tool options before placing a label.');
        this.addObject({
            id: createObjectId('text'),
            type: 'text',
            feature: 'text',
            x: world.x,
            y: world.y,
            text,
            fontSize: this.options.size,
            color: this.options.color,
            fontFamily: 'sans-serif'
        }, 'Text label');
        return false;
    }
}
