import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseManager } from '../../src/data/database-manager.js';
import { ProjectService } from '../../src/services/project-service.js';
import { formatPersistenceError, requestStoragePersistence } from '../../src/services/storage-persistence-service.js';
import { UIController } from '../../src/ui/layout.js';
import { createEmptyMap } from '../../src/engine/MapCanvasEngine.js';

function fakeDatabase({ failure = null } = {}) {
    let transaction;
    const database = {
        transaction() {
            transaction = {
                readyState: 'active',
                error: failure,
                objectStore() {
                    return {
                        put() {
                            const request = { result: undefined };
                            queueMicrotask(() => {
                                if (failure) {
                                    request.error = failure;
                                    request.onerror?.();
                                    transaction.readyState = 'finished';
                                    transaction.onabort?.();
                                    return;
                                }
                                request.result = undefined;
                                request.onsuccess?.();
                                transaction.readyState = 'finished';
                                transaction.oncomplete?.();
                            });
                            return request;
                        }
                    };
                },
                abort() {
                    transaction.readyState = 'finished';
                    transaction.onabort?.();
                }
            };
            return transaction;
        }
    };
    return { database, getTransaction: () => transaction };
}

function validProject() {
    return {
        id: 'safe-save-project',
        name: 'Safe Save',
        description: '',
        coverImage: '',
        createdAt: '2026-11-16T00:00:00.000Z',
        updatedAt: '2026-11-16T00:00:00.000Z',
        schemaVersion: 2,
        data: { map: createEmptyMap(), geography: {}, civilization: {}, history: {} }
    };
}

test('DatabaseManager completes a normal IndexedDB write only after transaction completion', async () => {
    const fake = fakeDatabase();
    const database = new DatabaseManager();
    database.open = () => Promise.resolve(fake.database);

    await database.putProject(validProject());

    assert.equal(fake.getTransaction().readyState, 'finished');
});

test('DatabaseManager aborts and surfaces QuotaExceededError from a failed write', async () => {
    const quotaError = Object.assign(new Error('storage is full'), { name: 'QuotaExceededError' });
    const fake = fakeDatabase({ failure: quotaError });
    const database = new DatabaseManager();
    database.open = () => Promise.resolve(fake.database);

    await assert.rejects(database.putProject(validProject()), error => {
        assert.equal(error, quotaError);
        assert.equal(error.name, 'QuotaExceededError');
        assert.equal(error.persistenceFailure, true);
        return true;
    });
    assert.equal(fake.getTransaction().readyState, 'finished');
});

test('DatabaseManager surfaces non-quota IndexedDB write failures without deleting data', async () => {
    const writeError = Object.assign(new Error('disk failure'), { name: 'UnknownError' });
    const fake = fakeDatabase({ failure: writeError });
    const database = new DatabaseManager();
    database.open = () => Promise.resolve(fake.database);

    await assert.rejects(database.putProject(validProject()), writeError);
    assert.equal(writeError.persistenceFailure, true);
    assert.equal(fake.getTransaction().readyState, 'finished');
});

test('failed ProjectService save keeps the last valid persisted project unchanged', async () => {
    const previous = validProject();
    let stored = structuredClone(previous);
    let recentWrites = 0;
    const quotaError = Object.assign(new Error('storage is full'), { name: 'QuotaExceededError' });
    const service = new ProjectService({
        async getProject() {
            return structuredClone(stored);
        },
        async putProject() {
            throw quotaError;
        },
        async putRecentProject() {
            recentWrites += 1;
        }
    });

    await assert.rejects(
        service.saveProject(previous.id, { ...previous.data, map: { ...previous.data.map, width: 2048 } }),
        quotaError
    );

    assert.deepEqual(stored, previous);
    assert.equal(recentWrites, 0);
});

test('UI save failure keeps the in-memory project state and reports a backup reminder', async () => {
    const status = { textContent: '' };
    const previous = validProject();
    const quotaError = Object.assign(new Error('storage is full'), { name: 'QuotaExceededError' });
    globalThis.document = { getElementById: id => id === 'save-status' ? status : null };
    const controller = Object.create(UIController.prototype);
    controller.currentProject = structuredClone(previous);
    controller.historyService = null;
    controller.geographyService = null;
    controller.civilizationService = null;
    controller.assetRegistry = { getAssetFile() { return null; } };
    controller.canvasEngine = { getMapData() { return createEmptyMap(); } };
    controller.projectService = { async saveProject() { throw quotaError; } };
    let message = '';
    controller.notify = value => { message = value; };

    await controller.saveCurrentProject();

    assert.deepEqual(controller.currentProject, previous);
    assert.equal(status.textContent, 'Lưu thất bại');
    assert.match(message, /xuất bản sao lưu|giải phóng dung lượng/i);
});

test('storage persistence request reports supported true and is idempotent', async () => {
    let persistCalls = 0;
    const navigatorLike = {
        storage: {
            async persisted() { return false; },
            async persist() { persistCalls += 1; return true; }
        }
    };
    const database = new DatabaseManager();
    const first = await database.requestStoragePersistence(navigatorLike);
    const second = await database.requestStoragePersistence(navigatorLike);

    assert.deepEqual(first, { status: 'granted', persisted: true });
    assert.deepEqual(second, first);
    assert.equal(persistCalls, 1);
});

test('storage persistence request reports denied, unsupported and rejected states', async () => {
    const denied = await requestStoragePersistence({
        storage: { async persist() { return false; } }
    });
    const unsupported = await requestStoragePersistence({});
    const rejection = new Error('permission unavailable');
    const rejected = await requestStoragePersistence({
        storage: { async persist() { throw rejection; } }
    });

    assert.deepEqual(denied, { status: 'denied', persisted: false });
    assert.deepEqual(unsupported, { status: 'unsupported', persisted: false });
    assert.equal(rejected.status, 'error');
    assert.equal(rejected.persisted, false);
    assert.equal(rejected.error, rejection);
});

test('storage persistence request contains unexpected feature-detection errors', async () => {
    const failure = new Error('storage getter failed');
    const result = await requestStoragePersistence({
        get storage() {
            throw failure;
        }
    });

    assert.equal(result.status, 'error');
    assert.equal(result.error, failure);
});

test('persistence errors produce actionable messages without automatic cleanup', () => {
    const quota = formatPersistenceError(Object.assign(new Error('full'), { name: 'QuotaExceededError' }));
    const other = formatPersistenceError(Object.assign(new Error('disk failure'), { persistenceFailure: true }));
    const validation = formatPersistenceError(new Error('Map dimensions are invalid.'));

    assert.match(quota, /bộ nhớ trình duyệt có thể đã đầy/i);
    assert.match(quota, /xuất bản sao lưu|giải phóng dung lượng/i);
    assert.match(other, /không thể ghi dữ liệu/i);
    assert.match(other, /bản lưu trước đó vẫn được giữ/i);
    assert.equal(validation, 'Map dimensions are invalid.');
    assert.doesNotMatch(`${quota} ${other}`, /xóa|delete/i);
});
