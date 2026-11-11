const DEFAULT_LAYER_NAMES = [
    'Background', 'Ocean', 'Landmass', 'Elevation', 'Mountains', 'Forests',
    'Rivers', 'Lakes', 'Borders', 'Cities', 'Locations', 'Text', 'Decorations'
];

function createId(prefix) {
    return globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function'
        ? `${prefix}-${globalThis.crypto.randomUUID()}`
        : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createDefaultLayers() {
    return DEFAULT_LAYER_NAMES.map(name => ({
        id: `layer-${name.toLowerCase()}`,
        name,
        visible: true,
        locked: false,
        opacity: 1,
        groupId: null,
        ...(name === 'Background' ? { role: 'background' } : {}),
        renderer: 'canvas',
        objects: []
    }));
}

export class LayerManager {
    constructor(layers = createDefaultLayers(), onChange = () => {}, groups = []) {
        this.layers = layers;
        this.groups = groups;
        this.onChange = onChange;
        this.activeLayerId = layers.find(layer => !layer.locked && layer.visible)?.id || null;
    }

    getLayers() {
        return this.layers;
    }

    getGroups() {
        return this.groups;
    }

    getActiveLayer() {
        return this.layers.find(layer => layer.id === this.activeLayerId) || null;
    }

    setActiveLayer(id) {
        const layer = this.requireLayer(id);
        if (layer.locked) throw new Error('This layer is locked.');
        if (!layer.visible) throw new Error('Show this layer before selecting it.');
        this.activeLayerId = id;
        this.onChange('active-layer');
        return layer;
    }

    addLayer(name) {
        const normalizedName = this.validateName(name);
        const layer = {
            id: createId('layer'),
            name: normalizedName,
            visible: true,
            locked: false,
            opacity: 1,
            groupId: null,
            role: null,
            renderer: 'canvas',
            objects: []
        };
        this.layers.push(layer);
        this.activeLayerId = layer.id;
        this.onChange('add-layer');
        return layer;
    }

    renameLayer(id, name) {
        const layer = this.requireLayer(id);
        layer.name = this.validateName(name);
        this.onChange('rename-layer');
        return layer;
    }

    setVisibility(id, visible) {
        const layer = this.requireLayer(id);
        layer.visible = Boolean(visible);
        if (!layer.visible && this.activeLayerId === id) {
            this.activeLayerId = this.layers.find(item => item.visible && !item.locked && item.id !== id)?.id || null;
        }
        this.onChange('layer-visibility');
        return layer;
    }

    setLocked(id, locked) {
        const layer = this.requireLayer(id);
        layer.locked = Boolean(locked);
        if (layer.locked && this.activeLayerId === id) {
            this.activeLayerId = this.layers.find(item => item.visible && !item.locked && item.id !== id)?.id || null;
        } else if (!layer.locked && layer.visible && !this.activeLayerId) {
            this.activeLayerId = id;
        }
        this.onChange('layer-lock');
        return layer;
    }

    setOpacity(id, opacity) {
        const layer = this.requireLayer(id);
        if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) {
            throw new Error('Layer opacity must be a number between 0 and 1.');
        }
        layer.opacity = opacity;
        this.onChange('layer-opacity');
        return layer;
    }

    reorderLayer(id, targetIndex) {
        const currentIndex = this.layers.findIndex(layer => layer.id === id);
        if (currentIndex < 0) throw new Error('Layer not found.');
        if (!Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= this.layers.length) {
            throw new Error('Layer order index is out of range.');
        }
        if (currentIndex === targetIndex) return false;
        const [layer] = this.layers.splice(currentIndex, 1);
        this.layers.splice(targetIndex, 0, layer);
        this.onChange('layer-order');
        return true;
    }

    moveLayer(id, direction) {
        if (direction !== -1 && direction !== 1) throw new Error('Layer direction must be -1 or 1.');
        const index = this.layers.findIndex(layer => layer.id === id);
        if (index < 0) throw new Error('Layer not found.');
        return this.reorderLayer(id, index + direction);
    }

    createGroup(name) {
        const group = { id: createId('group'), name: this.validateName(name) };
        this.groups.push(group);
        this.onChange('create-layer-group');
        return group;
    }

    renameGroup(id, name) {
        const group = this.requireGroup(id);
        group.name = this.validateName(name);
        this.onChange('rename-layer-group');
        return group;
    }

    deleteGroup(id) {
        this.requireGroup(id);
        const index = this.groups.findIndex(group => group.id === id);
        this.groups.splice(index, 1);
        for (const layer of this.layers) {
            if (layer.groupId === id) layer.groupId = null;
        }
        this.onChange('delete-layer-group');
    }

    setLayerGroup(layerId, groupId) {
        const layer = this.requireLayer(layerId);
        if (groupId !== null) this.requireGroup(groupId);
        layer.groupId = groupId;
        this.onChange('layer-group');
        return layer;
    }

    removeLayer(id) {
        if (this.layers.length <= 1) throw new Error('A map must keep at least one layer.');
        const index = this.layers.findIndex(layer => layer.id === id);
        if (index < 0) throw new Error('Layer not found.');
        this.layers.splice(index, 1);
        if (this.activeLayerId === id) {
            this.activeLayerId = this.layers.find(layer => layer.visible && !layer.locked)?.id || null;
        }
        this.onChange('remove-layer');
    }

    requireLayer(id) {
        const layer = this.layers.find(item => item.id === id);
        if (!layer) throw new Error('Layer not found.');
        return layer;
    }

    requireGroup(id) {
        const group = this.groups.find(item => item.id === id);
        if (!group) throw new Error('Layer group not found.');
        return group;
    }

    validateName(name) {
        const normalizedName = typeof name === 'string' ? name.trim() : '';
        if (!normalizedName || normalizedName.length > 80) {
            throw new Error('Layer name is required and must be 80 characters or fewer.');
        }
        return normalizedName;
    }
}
