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
import { PlaceAssetTool } from './PlaceAssetTool.js';
import { ToolAssetBinding } from '../../assets/tool-asset-capabilities.js';

export const TOOL_DEFINITIONS = [
    { id: 'select', label: 'Select', shortcut: 'V', Tool: SelectTool },
    { id: 'brush', label: 'Brush', shortcut: 'B', Tool: BrushTool },
    { id: 'eraser', label: 'Eraser', shortcut: 'E', Tool: EraserTool },
    { id: 'landmass', label: 'Landmass', shortcut: 'L', Tool: LandmassTool },
    { id: 'terrain', label: 'Terrain', shortcut: 'T', Tool: TerrainTool,
        assetQuery: { requiredCapabilities: ['stamp'], acceptedTypes: ['image'] } },
    { id: 'river', label: 'River', shortcut: 'R', Tool: RiverTool },
    { id: 'lake', label: 'Lake', shortcut: 'A', Tool: LakeTool,
        assetQuery: { requiredCapabilities: ['texture-fill'], acceptedTypes: ['image'] } },
    { id: 'border', label: 'Border', shortcut: 'D', Tool: BorderTool,
        assetQuery: { requiredCapabilities: ['pattern-stroke'], acceptedTypes: ['image'] } },
    { id: 'text', label: 'Text', shortcut: 'X', Tool: TextTool },
    { id: 'icon', label: 'Icon', shortcut: 'I', Tool: IconTool,
        assetQuery: { requiredCapabilities: ['icon'], acceptedTypes: ['image'] } },
    { id: 'place-asset', label: 'Place Asset', shortcut: 'P', Tool: PlaceAssetTool,
        assetQuery: { requiredCapabilities: ['stamp'], acceptedTypes: ['image'] }, allowLegacyGeneric: true }
];

export class ToolManager {
    constructor(engine, { onToolChange = () => {}, assetRegistry = null } = {}) {
        this.engine = engine;
        this.onToolChange = onToolChange;
        this.tools = new Map(TOOL_DEFINITIONS.map(({ id, Tool }) => [id, new Tool(engine)]));
        this.assetRegistry = null;
        this.assetBindings = new Map();
        this.activeToolId = 'select';
        if (assetRegistry) this.setAssetRegistry(assetRegistry);
    }

    getActiveTool() {
        return this.tools.get(this.activeToolId);
    }

    getTool(id) {
        return this.tools.get(id) || null;
    }

    setAssetRegistry(registry) {
        if (!registry || typeof registry.listAssets !== 'function' || typeof registry.getAsset !== 'function') {
            throw new Error('ToolManager requires a valid AssetRegistry.');
        }
        this.assetRegistry = registry;
        this.assetBindings.clear();
        for (const definition of TOOL_DEFINITIONS) {
            if (!definition.assetQuery) continue;
            this.assetBindings.set(definition.id, new ToolAssetBinding({
                registry,
                toolId: definition.id,
                query: definition.assetQuery,
                allowLegacyGeneric: definition.allowLegacyGeneric === true
            }));
        }
        return this.assetBindings.size;
    }

    getAssetBinding(toolId = this.activeToolId) {
        return this.assetBindings.get(toolId) || null;
    }

    listAssetsForTool(toolId = this.activeToolId, options = {}) {
        const binding = this.getAssetBinding(toolId);
        if (!binding) return [];
        return binding.listAssets(options);
    }

    selectAssetForTool(toolId, assetRef) {
        const binding = this.getAssetBinding(toolId);
        const tool = this.getTool(toolId);
        if (!binding || !tool) throw new Error(`Tool "${toolId}" does not accept Asset Pack resources.`);
        const resolved = binding.resolveAssetRef(assetRef);
        if (typeof tool.setAssetSelection !== 'function') {
            throw new Error(`Tool "${toolId}" does not implement the asset selection contract yet.`);
        }
        tool.setAssetSelection(resolved);
        this.engine.scheduleRender?.();
        return resolved;
    }

    selectAssetForActiveTool(assetRef) {
        return this.selectAssetForTool(this.activeToolId, assetRef);
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
