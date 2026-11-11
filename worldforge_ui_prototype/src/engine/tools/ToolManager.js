import { SelectTool } from './SelectTool.js';
import { BrushTool } from './BrushTool.js';
import { EraserTool } from './EraserTool.js';
import { LandmassTool } from './LandmassTool.js';
import { TerrainTool } from './TerrainTool.js';
import { RiverTool } from './RiverTool.js';
import { LakeTool } from './LakeTool.js';
import { BorderTool } from './BorderTool.js';
import { TextTool } from './TextTool.js';
import { IconTool } from './IconTool.js';

export const TOOL_DEFINITIONS = [
    { id: 'select', label: 'Select', shortcut: 'V', Tool: SelectTool },
    { id: 'brush', label: 'Brush', shortcut: 'B', Tool: BrushTool },
    { id: 'eraser', label: 'Eraser', shortcut: 'E', Tool: EraserTool },
    { id: 'landmass', label: 'Landmass', shortcut: 'L', Tool: LandmassTool },
    { id: 'terrain', label: 'Terrain', shortcut: 'T', Tool: TerrainTool },
    { id: 'river', label: 'River', shortcut: 'R', Tool: RiverTool },
    { id: 'lake', label: 'Lake', shortcut: 'A', Tool: LakeTool },
    { id: 'border', label: 'Border', shortcut: 'D', Tool: BorderTool },
    { id: 'text', label: 'Text', shortcut: 'X', Tool: TextTool },
    { id: 'icon', label: 'Icon', shortcut: 'I', Tool: IconTool }
];

export class ToolManager {
    constructor(engine, { onToolChange = () => {} } = {}) {
        this.engine = engine;
        this.onToolChange = onToolChange;
        this.tools = new Map(TOOL_DEFINITIONS.map(({ id, Tool }) => [id, new Tool(engine)]));
        this.activeToolId = 'select';
    }

    getActiveTool() {
        return this.tools.get(this.activeToolId);
    }

    getTool(id) {
        return this.tools.get(id) || null;
    }

    selectTool(id) {
        if (!this.tools.has(id)) throw new Error(`Unknown map tool "${id}".`);
        if (id === this.activeToolId) return;
        this.getActiveTool().cancel();
        this.activeToolId = id;
        this.engine.scheduleRender();
        this.onToolChange(id, TOOL_DEFINITIONS.find(tool => tool.id === id));
    }

    setOptions(id, options) {
        const tool = this.getTool(id);
        if (!tool) throw new Error(`Unknown map tool "${id}".`);
        if (!options || typeof options !== 'object' || Array.isArray(options)) {
            throw new Error('Tool options must be an object.');
        }
        tool.setOptions(options);
        this.engine.scheduleRender();
    }

    pointerDown(payload) {
        return Boolean(this.getActiveTool().pointerDown(payload));
    }

    pointerMove(payload) {
        this.getActiveTool().pointerMove(payload);
        this.engine.scheduleRender();
    }

    pointerUp(payload) {
        this.getActiveTool().pointerUp(payload);
        this.engine.scheduleRender();
    }

    keyDown(event) {
        if (this.getActiveTool().keyDown(event)) {
            this.engine.scheduleRender();
            return true;
        }
        const definition = TOOL_DEFINITIONS.find(tool => tool.shortcut.toLowerCase() === event.key.toLowerCase());
        if (!definition) return false;
        this.selectTool(definition.id);
        return true;
    }

    cancel() {
        this.getActiveTool().cancel();
        this.engine.scheduleRender();
    }

    renderPreview(context, state) {
        this.getActiveTool().renderPreview(context, state);
    }
}
