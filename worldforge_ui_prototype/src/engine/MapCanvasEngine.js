import { ViewportTransform } from './ViewportTransform.js';
import { CanvasLayerRenderer } from './layers/CanvasLayerRenderer.js';
import { createDefaultLayers, LayerManager } from './layers/LayerManager.js';
import { HistoryManager } from './HistoryManager.js';
import { ToolManager } from './tools/ToolManager.js';

const MIN_MAP_SIZE = 256;
const MAX_MAP_SIZE = 8192;

export function createEmptyMap(width = 4096, height = 2048) {
    return { width, height, layers: createDefaultLayers(), groups: [] };
}

export class MapCanvasEngine {
    constructor(canvas, {
        onSelectionChange = () => {},
        onPointerMove = () => {},
        onViewportChange = () => {},
        getViewportInsets = () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
        onMapChange = () => {},
        onHistoryChange = () => {},
        onToolChange = () => {},
        onError = () => {}
    } = {}) {
        if (!(canvas instanceof HTMLCanvasElement)) throw new Error('MapCanvasEngine requires a canvas element.');
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        if (!this.context) throw new Error('Canvas 2D context is not available.');
        this.onSelectionChange = onSelectionChange;
        this.onPointerMove = onPointerMove;
        this.onViewportChange = onViewportChange;
        this.getViewportInsets = getViewportInsets;
        this.onMapChange = onMapChange;
        this.onError = onError;
        this.map = createEmptyMap();
        this.viewport = new ViewportTransform();
        this.selectedObjectId = null;
        this.spaceHeld = false;
        this.dragState = null;
        this.frameRequested = false;
        this.frameId = null;
        this.initialFitPending = true;
        this.eventController = new AbortController();
        this.renderers = new Map([['canvas', new CanvasLayerRenderer()]]);
        this.history = new HistoryManager({ onChange: onHistoryChange });
        this.layerManager = this.createLayerManager(this.map.layers, this.map.groups);
        this.toolManager = new ToolManager(this, { onToolChange });
        this.cursorWorld = null;
        this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
        this.resizeObserver.observe(this.canvas);
        this.bindEvents();
        this.resizeCanvas();
    }

    bindEvents() {
        const { signal } = this.eventController;
        this.canvas.addEventListener('pointerdown', event => this.handlePointerDown(event), { signal });
        this.canvas.addEventListener('pointermove', event => this.handlePointerMove(event), { signal });
        this.canvas.addEventListener('pointerup', event => this.handlePointerUp(event), { signal });
        this.canvas.addEventListener('pointercancel', event => this.handlePointerUp(event), { signal });
        this.canvas.addEventListener('wheel', event => this.handleWheel(event), { passive: false, signal });
        this.canvas.addEventListener('contextmenu', event => event.preventDefault(), { signal });
        window.addEventListener('keydown', event => this.handleKeyDown(event), { signal });
        window.addEventListener('keyup', event => this.handleKeyUp(event), { signal });
        window.addEventListener('blur', () => {
            this.spaceHeld = false;
            this.dragState = null;
            this.toolManager.cancel();
            this.updateCursor();
        }, { signal });
    }

    setMap(map) {
        const normalized = this.validateMap(map);
        this.toolManager.cancel();
        this.map = normalized;
        this.layerManager = this.createLayerManager(normalized.layers, normalized.groups);
        this.selectedObjectId = null;
        this.history.clear();
        this.initialFitPending = true;
        this.fitToScreen();
        this.onSelectionChange(null);
    }

    setTool(id) {
        this.toolManager.selectTool(id);
    }

    setToolOptions(id, options) {
        this.toolManager.setOptions(id, options);
    }

    validateMap(map) {
        if (!map || typeof map !== 'object' || Array.isArray(map)) throw new Error('Map data must be an object.');
        const { width, height } = map;
        if (!this.isValidSize(width) || !this.isValidSize(height)) {
            throw new Error(`Map dimensions must be whole numbers between ${MIN_MAP_SIZE} and ${MAX_MAP_SIZE}.`);
        }
        const layers = map.layers === undefined ? createDefaultLayers() : map.layers;
        if (!Array.isArray(layers) || layers.length === 0) throw new Error('A map must contain at least one layer.');
        const groups = map.groups === undefined ? [] : map.groups;
        if (!Array.isArray(groups)) throw new Error('Map layer groups must be an array.');
        const groupIds = new Set();
        const normalizedGroups = groups.map(group => {
            if (!group || typeof group.id !== 'string' || !group.id || groupIds.has(group.id) ||
                typeof group.name !== 'string' || !group.name.trim() || group.name.length > 80) {
                throw new Error('Layer groups must have unique IDs and valid names.');
            }
            groupIds.add(group.id);
            return { id: group.id, name: group.name.trim() };
        });
        const ids = new Set();
        const objectIds = new Set();
        const normalizedLayers = layers.map(layer => {
            if (!layer || typeof layer !== 'object' || typeof layer.id !== 'string' ||
                !layer.id || ids.has(layer.id) || typeof layer.name !== 'string' || !layer.name.trim()) {
                throw new Error('Map layers must have unique IDs and non-empty names.');
            }
            ids.add(layer.id);
            if (layer.renderer && !this.renderers.has(layer.renderer)) {
                throw new Error(`No renderer is registered for layer type "${layer.renderer}".`);
            }
            if (!Array.isArray(layer.objects)) throw new Error(`Layer "${layer.name}" must contain an object list.`);
            const opacity = layer.opacity === undefined ? 1 : layer.opacity;
            if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) {
                throw new Error(`Layer "${layer.name}" opacity must be between 0 and 1.`);
            }
            const groupId = layer.groupId === undefined ? null : layer.groupId;
            if (groupId !== null && !groupIds.has(groupId)) {
                throw new Error(`Layer "${layer.name}" references a missing group.`);
            }
            const objects = layer.objects.map(object => {
                const normalizedObject = this.validateObject(object);
                if (objectIds.has(normalizedObject.id)) {
                    throw new Error(`Map object ID "${normalizedObject.id}" is used more than once.`);
                }
                objectIds.add(normalizedObject.id);
                return normalizedObject;
            });
            return {
                id: layer.id,
                name: layer.name.trim(),
                visible: layer.visible !== false,
                locked: layer.locked === true,
                opacity,
                groupId,
                role: layer.role === 'background' || layer.id === 'layer-background' ? 'background' : null,
                renderer: layer.renderer || 'canvas',
                objects
            };
        });
        return { width, height, layers: normalizedLayers, groups: normalizedGroups };
    }

    validateObject(object) {
        if (!object || typeof object !== 'object' || typeof object.id !== 'string' || !object.id) {
            throw new Error('Map objects must have an ID.');
        }
        if (!['rect', 'circle', 'path'].includes(object.type)) {
            if (['ellipse', 'text', 'icon', 'terrain'].includes(object.type)) {
                return this.validateExtendedObject(object);
            }
            throw new Error(`Unsupported map object type "${object.type}".`);
        }
        if (object.type === 'rect' &&
            (![object.x, object.y, object.width, object.height].every(Number.isFinite) ||
                object.width <= 0 || object.height <= 0)) {
            throw new Error('Rectangle geometry is invalid.');
        }
        if (object.type === 'circle' &&
            (![object.x, object.y, object.radius].every(Number.isFinite) || object.radius <= 0)) {
            throw new Error('Circle geometry is invalid.');
        }
        if (object.type === 'path' &&
            (!Array.isArray(object.commands) || object.commands.length < 2 ||
                !object.commands[0] || object.commands[0].type !== 'moveTo' ||
                object.commands.filter(command => command && command.type !== 'close').length < 2 ||
                object.commands.some(command => !command || !['moveTo', 'lineTo', 'close'].includes(command.type) ||
                    (command.type !== 'close' && (!Number.isFinite(command.x) || !Number.isFinite(command.y)))))) {
            throw new Error('Path geometry is invalid.');
        }
        return { ...object };
    }

    validateExtendedObject(object) {
        if (object.type === 'ellipse' &&
            (![object.x, object.y, object.radiusX, object.radiusY].every(Number.isFinite) ||
                object.radiusX <= 0 || object.radiusY <= 0)) {
            throw new Error('Ellipse geometry is invalid.');
        }
        if (object.type === 'text' &&
            (!Number.isFinite(object.x) || !Number.isFinite(object.y) ||
                typeof object.text !== 'string' || !object.text.trim() || object.text.length > 500 ||
                !Number.isFinite(object.fontSize) || object.fontSize < 6 || object.fontSize > 512)) {
            throw new Error('Text object is invalid.');
        }
        if (object.type === 'icon' &&
            (!Number.isFinite(object.x) || !Number.isFinite(object.y) ||
                !['capital', 'city', 'village', 'port'].includes(object.icon) ||
                !Number.isFinite(object.size) || object.size < 8 || object.size > 256)) {
            throw new Error('Icon object is invalid.');
        }
        if (object.type === 'terrain' &&
            (!Array.isArray(object.points) || object.points.length === 0 ||
                object.points.some(point => !point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) ||
                !Number.isFinite(object.size) || object.size < 4 || object.size > 512 ||
                !['mountain', 'forest', 'hills', 'desert', 'swamp', 'snow'].includes(object.terrain))) {
            throw new Error('Terrain object is invalid.');
        }
        return { ...object };
    }

    createLayerManager(layers, groups = []) {
        return new LayerManager(layers, () => this.scheduleRender(), groups);
    }

    isValidSize(value) {
        return Number.isInteger(value) && value >= MIN_MAP_SIZE && value <= MAX_MAP_SIZE;
    }

    registerLayerRenderer(type, renderer) {
        if (typeof type !== 'string' || !type.trim() || !renderer || typeof renderer.draw !== 'function') {
            throw new Error('A layer renderer must have a type and a draw(context, layer, state) method.');
        }
        this.renderers.set(type, renderer);
    }

    getMapData() {
        return {
            width: this.map.width,
            height: this.map.height,
            groups: this.map.groups.map(group => ({ ...group })),
            layers: this.map.layers.map(layer => ({
                ...layer,
                objects: layer.objects.map(object => ({ ...object }))
            }))
        };
    }

    getViewportSize() {
        const insets = this.getViewportInsets();
        return {
            width: Math.max(0, this.canvas.clientWidth - (insets.left || 0) - (insets.right || 0)),
            height: Math.max(0, this.canvas.clientHeight - (insets.top || 0) - (insets.bottom || 0))
        };
    }

    resizeCanvas() {
        const bounds = this.canvas.getBoundingClientRect();
        if (bounds.width <= 0 || bounds.height <= 0) return;
        const pixelRatio = window.devicePixelRatio || 1;
        const width = Math.round(bounds.width * pixelRatio);
        const height = Math.round(bounds.height * pixelRatio);
        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;
        }
        if (this.initialFitPending) this.fitToScreen();
        else this.scheduleRender();
    }

    screenPoint(event) {
        const bounds = this.canvas.getBoundingClientRect();
        return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    }

    screenToWorld(point) {
        return this.viewport.screenToWorld(point);
    }

    worldToScreen(point) {
        return this.viewport.worldToScreen(point);
    }

    getZoom() {
        return this.viewport.zoom;
    }

    zoomAt(point, factor) {
        this.viewport.zoomAt(point, this.viewport.zoom * factor);
        this.scheduleRender();
    }

    zoomIn() {
        const { width, height } = this.getViewportSize();
        this.zoomAt({ x: width / 2, y: height / 2 }, 1.2);
    }

    zoomOut() {
        const { width, height } = this.getViewportSize();
        this.zoomAt({ x: width / 2, y: height / 2 }, 1 / 1.2);
    }

    fitToScreen() {
        const { width, height } = this.getViewportSize();
        if (width <= 0 || height <= 0) return;
        this.viewport.fitToScreen(this.map.width, this.map.height, width, height);
        this.initialFitPending = false;
        this.scheduleRender();
    }

    resetView() {
        this.viewport.reset();
        this.initialFitPending = false;
        this.scheduleRender();
    }

    centerOnWorld(point) {
        if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
            throw new Error('Map navigation requires finite world coordinates.');
        }
        const { width, height } = this.getViewportSize();
        if (width <= 0 || height <= 0) return;
        this.viewport.offsetX = width / 2 - point.x * this.viewport.zoom;
        this.viewport.offsetY = height / 2 - point.y * this.viewport.zoom;
        this.initialFitPending = false;
        this.scheduleRender();
    }

    setMapSize(width, height) {
        if (!this.isValidSize(width) || !this.isValidSize(height)) {
            throw new Error(`Map dimensions must be whole numbers between ${MIN_MAP_SIZE} and ${MAX_MAP_SIZE}.`);
        }
        const before = this.getMapData();
        this.map.width = width;
        this.map.height = height;
        this.fitToScreen();
        this.recordMapChange(before, 'Resize map', 'map-size');
    }

    addObject(layerId, input, label = 'Add object') {
        const layer = this.map.layers.find(item => item.id === layerId);
        if (!layer) throw new Error('Layer not found.');
        if (layer.locked) throw new Error('This layer is locked.');
        const object = this.validateObject(input);
        if (this.map.layers.some(item => item.objects.some(existing => existing.id === object.id))) {
            throw new Error(`Map object ID "${object.id}" already exists.`);
        }
        const before = this.getMapData();
        layer.objects.push(object);
        this.recordMapChange(before, label, 'add-object');
        this.setSelection(object.id);
        return object;
    }

    updateObject(objectId, changes, label = 'Edit object') {
        if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
            throw new Error('Object changes must be an object.');
        }
        const entry = this.findObjectEntry(objectId);
        if (!entry) throw new Error('Map object not found.');
        if (entry.layer.locked) throw new Error('This layer is locked.');
        const before = this.getMapData();
        entry.layer.objects[entry.index] = this.validateObject({ ...entry.object, ...changes });
        this.recordMapChange(before, label, 'edit-object');
        this.setSelection(objectId);
        return entry.layer.objects[entry.index];
    }

    translateObject(objectId, dx, dy) {
        if (!Number.isFinite(dx) || !Number.isFinite(dy)) throw new Error('Object movement must be finite.');
        const entry = this.findObjectEntry(objectId);
        if (!entry) throw new Error('Map object not found.');
        if (entry.layer.locked) throw new Error('This layer is locked.');
        const object = entry.layer.objects[entry.index];
        const changes = {};
        if (object.type === 'path') {
            changes.commands = object.commands.map(command => command.type === 'close'
                ? { ...command }
                : { ...command, x: command.x + dx, y: command.y + dy });
        } else if (object.type === 'terrain') {
            changes.points = object.points.map(point => ({ x: point.x + dx, y: point.y + dy }));
        } else {
            changes.x = object.x + dx;
            changes.y = object.y + dy;
        }
        entry.layer.objects[entry.index] = this.validateObject({ ...object, ...changes });
        this.scheduleRender();
        if (!this.history.group) this.onMapChange(this.getMapData(), 'move-object');
        if (this.selectedObjectId !== objectId) this.setSelection(objectId);
        return entry.layer.objects[entry.index];
    }

    deleteObjects(objectIds, label = 'Delete objects') {
        const ids = new Set(objectIds);
        for (const layer of this.map.layers) {
            if (layer.locked && layer.objects.some(object => ids.has(object.id))) {
                throw new Error(`Cannot delete objects from locked layer "${layer.name}".`);
            }
        }
        const before = this.getMapData();
        let removed = 0;
        for (const layer of this.map.layers) {
            if (layer.locked) continue;
            const remaining = layer.objects.filter(object => {
                if (!ids.has(object.id)) return true;
                removed += 1;
                return false;
            });
            layer.objects.splice(0, layer.objects.length, ...remaining);
        }
        if (removed) this.recordMapChange(before, label, 'delete-object');
        if (ids.has(this.selectedObjectId)) this.setSelection(null);
        return removed;
    }

    beginEditGroup(label) {
        this.history.beginGroup(this.getMapData(), label);
    }

    commitEditGroup() {
        const changed = this.history.commitGroup(this.getMapData());
        if (changed) this.onMapChange(this.getMapData(), 'edit-object');
        return changed;
    }

    cancelEditGroup() {
        const snapshot = this.history.cancelGroup();
        if (snapshot) this.restoreMap(snapshot);
    }

    addLayer(name) {
        const before = this.getMapData();
        const layer = this.layerManager.addLayer(name);
        this.recordMapChange(before, 'Add layer', 'add-layer');
        return layer;
    }

    renameLayer(id, name) {
        const before = this.getMapData();
        const layer = this.layerManager.renameLayer(id, name);
        this.recordMapChange(before, 'Rename layer', 'rename-layer');
        return layer;
    }

    removeLayer(id) {
        const before = this.getMapData();
        this.layerManager.removeLayer(id);
        this.recordMapChange(before, 'Remove layer', 'remove-layer');
        if (!this.findObject(this.selectedObjectId)) this.setSelection(null);
    }

    setLayerLocked(id, locked) {
        const before = this.getMapData();
        this.layerManager.setLocked(id, locked);
        this.recordMapChange(before, locked ? 'Lock layer' : 'Unlock layer', 'layer-lock');
    }

    setLayerVisibility(id, visible) {
        const before = this.getMapData();
        this.layerManager.setVisibility(id, visible);
        const selectedLayer = this.map.layers.find(layer =>
            layer.objects.some(object => object.id === this.selectedObjectId));
        if (selectedLayer && !selectedLayer.visible) this.setSelection(null);
        this.recordMapChange(before, 'Change layer visibility', 'layer-visibility');
    }

    setLayerOpacity(id, opacity) {
        const before = this.getMapData();
        this.layerManager.setOpacity(id, opacity);
        this.recordMapChange(before, 'Change layer opacity', 'layer-opacity');
    }

    reorderLayer(id, targetIndex) {
        const before = this.getMapData();
        const changed = this.layerManager.reorderLayer(id, targetIndex);
        if (changed) this.recordMapChange(before, 'Reorder layers', 'layer-order');
        return changed;
    }

    createLayerGroup(name) {
        const before = this.getMapData();
        const group = this.layerManager.createGroup(name);
        this.recordMapChange(before, 'Create layer group', 'create-layer-group');
        return group;
    }

    renameLayerGroup(id, name) {
        const before = this.getMapData();
        const group = this.layerManager.renameGroup(id, name);
        this.recordMapChange(before, 'Rename layer group', 'rename-layer-group');
        return group;
    }

    deleteLayerGroup(id) {
        const before = this.getMapData();
        this.layerManager.deleteGroup(id);
        this.recordMapChange(before, 'Delete layer group', 'delete-layer-group');
    }

    setLayerGroup(layerId, groupId) {
        const before = this.getMapData();
        const layer = this.layerManager.setLayerGroup(layerId, groupId);
        this.recordMapChange(before, groupId ? 'Group layer' : 'Ungroup layer', 'layer-group');
        return layer;
    }

    setActiveLayer(id) {
        return this.layerManager.setActiveLayer(id);
    }

    recordMapChange(before, label, reason) {
        const after = this.getMapData();
        this.history.record(before, after, label);
        this.scheduleRender();
        this.onMapChange(after, reason);
    }

    undo() {
        if (this.history.group) {
            this.toolManager.cancel();
            return false;
        }
        const snapshot = this.history.undo(this.getMapData());
        if (snapshot) this.restoreMap(snapshot);
        return Boolean(snapshot);
    }

    redo() {
        if (this.history.group) {
            this.toolManager.cancel();
            return false;
        }
        const snapshot = this.history.redo(this.getMapData());
        if (snapshot) this.restoreMap(snapshot);
        return Boolean(snapshot);
    }

    restoreMap(snapshot) {
        this.map = this.validateMap(snapshot);
        const activeLayerId = this.layerManager.activeLayerId;
        this.layerManager = this.createLayerManager(this.map.layers, this.map.groups);
        if (this.map.layers.some(layer => layer.id === activeLayerId && !layer.locked && layer.visible)) {
            this.layerManager.activeLayerId = activeLayerId;
        }
        const selected = this.findObject(this.selectedObjectId);
        if (!selected || !this.map.layers.find(layer => layer.id === selected.layerId).visible) {
            this.selectedObjectId = null;
        }
        this.onSelectionChange(this.findObject(this.selectedObjectId));
        this.scheduleRender();
        this.onMapChange(this.getMapData(), 'history');
    }

    findObjectEntry(objectId) {
        for (const layer of this.map.layers) {
            const index = layer.objects.findIndex(object => object.id === objectId);
            if (index >= 0) return { layer, index, object: layer.objects[index] };
        }
        return null;
    }

    setSelection(objectId) {
        this.selectedObjectId = objectId && this.findObject(objectId) ? objectId : null;
        const selection = this.findObject(this.selectedObjectId);
        this.onSelectionChange(selection);
        this.scheduleRender();
    }

    findObject(objectId) {
        for (const layer of this.map.layers) {
            const object = layer.objects.find(item => item.id === objectId);
            if (object) return { ...object, layerId: layer.id, layerName: layer.name };
        }
        return null;
    }

    getObjectAt(point) {
        const id = this.hitTest(point);
        return id ? this.findObject(id) : null;
    }

    handlePointerDown(event) {
        if (event.button === 1 || (event.button === 0 && this.spaceHeld)) {
            event.preventDefault();
            this.dragState = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
            this.canvas.setPointerCapture(event.pointerId);
            this.updateCursor();
            return;
        }
        if (event.button !== 0) return;
        const screen = this.screenPoint(event);
        const world = this.screenToWorld(screen);
        this.cursorWorld = world;
        try {
            const capture = this.toolManager.pointerDown({ world, screen, event });
            if (capture) this.canvas.setPointerCapture(event.pointerId);
        } catch (error) {
            this.toolManager.cancel();
            this.onError(error);
        }
        this.scheduleRender();
    }

    handlePointerMove(event) {
        const point = this.screenPoint(event);
        this.cursorWorld = this.screenToWorld(point);
        if (this.dragState && this.dragState.pointerId === event.pointerId) {
            this.viewport.panBy(event.clientX - this.dragState.x, event.clientY - this.dragState.y);
            this.dragState.x = event.clientX;
            this.dragState.y = event.clientY;
            this.scheduleRender();
        } else {
            try {
                this.toolManager.pointerMove({ world: this.cursorWorld, screen: point, event });
            } catch (error) {
                this.toolManager.cancel();
                this.onError(error);
            }
        }
        this.onPointerMove(this.cursorWorld, point);
    }

    handlePointerUp(event) {
        if (this.dragState && this.dragState.pointerId === event.pointerId) {
            this.dragState = null;
            this.updateCursor();
            return;
        }
        const screen = this.screenPoint(event);
        if (event.type === 'pointercancel') {
            this.toolManager.cancel();
            return;
        }
        try {
            this.toolManager.pointerUp({ world: this.screenToWorld(screen), screen, event });
        } catch (error) {
            this.toolManager.cancel();
            this.onError(error);
        }
        this.scheduleRender();
    }

    handleWheel(event) {
        event.preventDefault();
        this.zoomAt(this.screenPoint(event), event.deltaY < 0 ? 1.12 : 1 / 1.12);
    }

    handleKeyDown(event) {
        if (event.target instanceof HTMLElement &&
            (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName) || event.target.isContentEditable)) return;
        if (event.code === 'Space') {
            this.spaceHeld = true;
            this.updateCursor();
            event.preventDefault();
            return;
        }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
            event.preventDefault();
            if (event.shiftKey) this.redo();
            else this.undo();
            return;
        }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
            event.preventDefault();
            this.redo();
            return;
        }
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        if (event.key === '+' || event.key === '=') this.zoomIn();
        else if (event.key === '-') this.zoomOut();
        else if (event.key.toLowerCase() === 'f') this.fitToScreen();
        else if (event.key === '0') this.resetView();
        else if (event.key === 'Delete' || event.key === 'Backspace') {
            if (this.selectedObjectId) {
                try {
                    this.deleteObjects([this.selectedObjectId], 'Delete object');
                } catch (error) {
                    this.onError(error);
                }
            }
        } else if (event.key === 'Escape') {
            this.toolManager.cancel();
            this.setSelection(null);
        } else {
            try {
                if (this.toolManager.keyDown(event)) event.preventDefault();
            } catch (error) {
                this.onError(error);
            }
        }
    }

    handleKeyUp(event) {
        if (event.code === 'Space') {
            this.spaceHeld = false;
            this.updateCursor();
        }
    }

    updateCursor() {
        this.canvas.classList.toggle('is-panning', this.spaceHeld || Boolean(this.dragState));
    }

    hitTest(point, worldTolerance = 7 / this.viewport.zoom) {
        const tolerance = worldTolerance;
        for (let layerIndex = this.map.layers.length - 1; layerIndex >= 0; layerIndex -= 1) {
            const layer = this.map.layers[layerIndex];
            if (!layer.visible || layer.opacity === 0) continue;
            const renderer = this.renderers.get(layer.renderer);
            if (!renderer || typeof renderer.hitTest !== 'function') continue;
            for (let objectIndex = layer.objects.length - 1; objectIndex >= 0; objectIndex -= 1) {
                const object = layer.objects[objectIndex];
                if (renderer.hitTest(object, point, tolerance)) return object.id;
            }
        }
        return null;
    }

    scheduleRender() {
        if (this.frameRequested) return;
        this.frameRequested = true;
        this.frameId = requestAnimationFrame(() => {
            this.frameRequested = false;
            this.frameId = null;
            this.render();
        });
    }

    render() {
        const context = this.context;
        const pixelRatio = window.devicePixelRatio || 1;
        const { width, height } = this.getViewportSize();
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        context.setTransform(
            pixelRatio * this.viewport.zoom,
            0,
            0,
            pixelRatio * this.viewport.zoom,
            pixelRatio * this.viewport.offsetX,
            pixelRatio * this.viewport.offsetY
        );
        if (!this.map.layers.some(layer => layer.role === 'background')) {
            context.fillStyle = '#f1e6ce';
            context.fillRect(0, 0, this.map.width, this.map.height);
        }
        for (const layer of this.map.layers) {
            if (!layer.visible) continue;
            const renderer = this.renderers.get(layer.renderer);
            if (!renderer) {
                this.onError(new Error(`No renderer is registered for layer type "${layer.renderer}".`));
                continue;
            }
            context.save();
            context.globalAlpha *= layer.opacity;
            try {
                if (layer.role === 'background') {
                    context.fillStyle = '#f1e6ce';
                    context.fillRect(0, 0, this.map.width, this.map.height);
                }
                renderer.draw(context, layer, {
                    zoom: this.viewport.zoom,
                    selectedObjectId: this.selectedObjectId,
                    map: this.map,
                    viewport: this.viewport
                });
            } catch (error) {
                this.onError(error);
            } finally {
                context.restore();
            }
        }
        context.strokeStyle = '#9b8b6a';
        context.lineWidth = 1 / this.viewport.zoom;
        context.strokeRect(0, 0, this.map.width, this.map.height);
        try {
            this.toolManager.renderPreview(context, {
                zoom: this.viewport.zoom,
                map: this.map,
                cursorWorld: this.cursorWorld,
                selectedObjectId: this.selectedObjectId
            });
        } catch (error) {
            this.onError(error);
        }
        this.canvas.setAttribute('aria-label',
            `Map ${this.map.width} by ${this.map.height}, viewport ${Math.round(width)} by ${Math.round(height)}`);
        this.onViewportChange({
            zoom: this.viewport.zoom,
            offsetX: this.viewport.offsetX,
            offsetY: this.viewport.offsetY
        });
    }

    destroy() {
        this.toolManager.cancel();
        this.resizeObserver.disconnect();
        this.eventController.abort();
        if (this.frameId !== null) cancelAnimationFrame(this.frameId);
    }
}
