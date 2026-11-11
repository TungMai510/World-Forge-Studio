const HISTORY_LIMIT = 100;

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

export class HistoryManager {
    constructor({ onChange = () => {} } = {}) {
        this.undoStack = [];
        this.redoStack = [];
        this.group = null;
        this.onChange = onChange;
    }

    beginGroup(map, label) {
        if (this.group) throw new Error('A history group is already active.');
        this.group = { before: clone(map), label };
    }

    commitGroup(map) {
        if (!this.group) return false;
        const group = this.group;
        this.group = null;
        return this.recordSnapshots(group.before, map, group.label);
    }

    cancelGroup() {
        if (!this.group) return null;
        const snapshot = this.group.before;
        this.group = null;
        return snapshot;
    }

    record(before, after, label) {
        if (this.group) return false;
        return this.recordSnapshots(before, after, label);
    }

    recordSnapshots(before, after, label) {
        const previous = JSON.stringify(before);
        const next = JSON.stringify(after);
        if (previous === next) return false;
        this.undoStack.push({ map: clone(before), label });
        if (this.undoStack.length > HISTORY_LIMIT) this.undoStack.shift();
        this.redoStack = [];
        this.onChange(this.getState());
        return true;
    }

    undo(currentMap) {
        if (this.group) throw new Error('Finish the current operation before undoing.');
        const entry = this.undoStack.pop();
        if (!entry) return null;
        this.redoStack.push({ map: clone(currentMap), label: entry.label });
        this.onChange(this.getState());
        return clone(entry.map);
    }

    redo(currentMap) {
        if (this.group) throw new Error('Finish the current operation before redoing.');
        const entry = this.redoStack.pop();
        if (!entry) return null;
        this.undoStack.push({ map: clone(currentMap), label: entry.label });
        this.onChange(this.getState());
        return clone(entry.map);
    }

    getState() {
        return {
            canUndo: this.undoStack.length > 0,
            canRedo: this.redoStack.length > 0,
            undoLabel: this.undoStack.length ? this.undoStack[this.undoStack.length - 1].label : null,
            redoLabel: this.redoStack.length ? this.redoStack[this.redoStack.length - 1].label : null
        };
    }

    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.group = null;
        this.onChange(this.getState());
    }
}
