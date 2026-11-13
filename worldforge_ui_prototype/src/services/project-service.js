import { HistoryService } from './history-service.js';
import { ENTITY_TYPES, GeographyService } from './geography-service.js';
import { CivilizationService } from './civilization-service.js';
import { MapCanvasEngine, createEmptyMap } from '../engine/MapCanvasEngine.js';
import { createZipArchive, decodeAssetDataUrl, encodeDataUrlAsset, readZipArchive } from './archive-service.js';
import { sha256Fallback } from './project-asset-snapshot-service.js';

export const SCHEMA_VERSION = 2;
const MAX_NAME_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_COVER_LENGTH = 3 * 1024 * 1024;
const MAX_RECENT_PROJECTS = 10;
const MAX_PROJECT_ARCHIVE_SIZE = 100 * 1024 * 1024;
const MAX_PROJECT_ARCHIVE_ENTRIES = 10000;
const MAX_PROJECT_SNAPSHOT_BYTES = 20 * 1024 * 1024;
const MAX_PROJECT_SNAPSHOT_FILE_BYTES = 15 * 1024 * 1024;
const PROJECT_ARCHIVE_FORMAT = 'WorldForgeStudioProject';
const PROJECT_ARCHIVE_VERSION = 2;

const SNAPSHOT_TYPES = Object.freeze({
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif'
});

function bytesFromBase64(value) {
    if (typeof value !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(value) || value.length % 4 === 1) {
        throw new Error('Project snapshot data is not valid base64.');
    }
    let binary;
    try {
        binary = atob(value);
    } catch {
        throw new Error('Project snapshot data is not valid base64.');
    }
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes;
}

function hasImageSignature(bytes, mimeType) {
    if (mimeType === 'image/png') return bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
    if (mimeType === 'image/jpeg') return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    if (mimeType === 'image/gif') return bytes.length >= 6 && new TextDecoder().decode(bytes.subarray(0, 6)) === 'GIF87a' || new TextDecoder().decode(bytes.subarray(0, 6)) === 'GIF89a';
    if (mimeType === 'image/webp') return bytes.length >= 12 && new TextDecoder().decode(bytes.subarray(0, 4)) === 'RIFF' && new TextDecoder().decode(bytes.subarray(8, 12)) === 'WEBP';
    return false;
}

function snapshotPath(snapshot) {
    const extension = SNAPSHOT_TYPES[snapshot.mimeType];
    return `assets/${snapshot.sha256}.${extension}`;
}

function validateSnapshotBytes(snapshot, bytes, context = 'Project snapshot') {
    if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) throw new Error(`${context} metadata is invalid.`);
    const extension = SNAPSHOT_TYPES[snapshot.mimeType];
    if (!extension || !Number.isInteger(snapshot.size) || snapshot.size !== bytes.length || bytes.length > MAX_PROJECT_SNAPSHOT_FILE_BYTES) {
        throw new Error(`${context} has an invalid byte length or MIME type.`);
    }
    if (typeof snapshot.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(snapshot.sha256) || sha256Fallback(bytes) !== snapshot.sha256) {
        throw new Error(`${context} failed its SHA-256 integrity check.`);
    }
    if (!hasImageSignature(bytes, snapshot.mimeType)) throw new Error(`${context} failed its image signature check.`);
    return extension;
}

function validateMap(map) {
    const validator = Object.create(MapCanvasEngine.prototype);
    validator.renderers = new Map([['canvas', true]]);
    return validator.validateMap(map);
}

export class ProjectService {
    constructor(database) {
        this.database = database;
    }

    async createProject(input) {
        const fields = this.validateFields(input);
        const id = await this.createUniqueId();
        const now = new Date().toISOString();
        const project = {
            id,
            name: fields.name,
            description: fields.description,
            coverImage: fields.coverImage,
            createdAt: now,
            updatedAt: now,
            schemaVersion: SCHEMA_VERSION,
            data: this.validateProjectData({})
        };
        return this.insertNewProject(project);
    }

    async getProjects() {
        const projects = await this.database.getProjects();
        return projects.sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt));
    }

    getProject(id) {
        return this.database.getProject(id);
    }

    async openProject(id) {
        const stored = await this.database.getProject(id);
        if (!stored) throw new Error('Project not found.');
        const project = this.validateProject(stored);
        if (project.schemaVersion !== stored.schemaVersion) await this.database.putProject(project);
        await this.database.putRecentProject({ projectId: id, openedAt: new Date().toISOString() });
        return project;
    }

    async getRecentProjects() {
        const entries = await this.database.getRecentProjects();
        entries.sort((left, right) => new Date(right.openedAt) - new Date(left.openedAt));
        const projects = [];
        for (const entry of entries.slice(0, MAX_RECENT_PROJECTS)) {
            const project = await this.database.getProject(entry.projectId);
            if (project) projects.push({ ...project, lastOpenedAt: entry.openedAt });
            else await this.database.deleteRecentProject(entry.projectId);
        }
        return projects;
    }

    async updateProject(id, changes) {
        if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
            throw new Error('Project changes must be an object.');
        }
        const stored = await this.database.getProject(id);
        if (!stored) throw new Error('Project not found.');
        const project = this.validateProject(stored);
        const fields = this.validateFields({
            name: changes.name === undefined ? project.name : changes.name,
            description: changes.description === undefined ? project.description : changes.description,
            coverImage: changes.coverImage === undefined ? project.coverImage : changes.coverImage
        });
        const updated = this.validateProject({ ...project, ...fields, updatedAt: new Date().toISOString() });
        await this.database.putProject(updated);
        return updated;
    }

    async saveProject(id, data) {
        const stored = await this.database.getProject(id);
        if (!stored) throw new Error('Project not found.');
        const project = this.validateProject(stored);
        const serializableData = this.validateProjectData(this.cloneJsonObject(data));
        const updated = this.validateProject({
            ...project,
            data: serializableData,
            updatedAt: new Date().toISOString()
        });
        await this.database.putProject(updated);
        return updated;
    }

    async duplicateProject(id) {
        const stored = await this.database.getProject(id);
        if (!stored) throw new Error('Project not found.');
        const source = this.validateProject(stored);
        const now = new Date().toISOString();
        const copy = {
            ...source,
            id: await this.createUniqueId(),
            name: this.validateFields({ name: `${source.name.slice(0, MAX_NAME_LENGTH - 7)} (Copy)` }).name,
            createdAt: now,
            updatedAt: now,
            data: JSON.parse(JSON.stringify(source.data))
        };
        return this.insertNewProject(copy);
    }

    async deleteProject(id) {
        const project = await this.database.getProject(id);
        if (!project) throw new Error('Project not found.');
        await this.database.deleteProjectAndRecent(id);
    }

    async importProject(input) {
        const project = this.validateProject(input);
        const exists = await this.database.getProject(project.id);
        const now = new Date().toISOString();
        const imported = {
            ...project,
            id: exists ? await this.createUniqueId() : project.id,
            name: exists
                ? this.validateFields({ name: `${project.name.slice(0, MAX_NAME_LENGTH - 11)} (Imported)` }).name
                : project.name,
            createdAt: exists ? now : project.createdAt,
            updatedAt: now,
            data: JSON.parse(JSON.stringify(project.data))
        };
        const saved = exists ? await this.insertNewProject(imported) : await this.insertImportedProject(imported);
        return { project: saved, idChanged: Boolean(exists) || saved.id !== project.id };
    }

    exportProjectPackage(project) {
        const validated = this.validateProject(project);
        const exportedProject = JSON.parse(JSON.stringify(validated));
        const snapshots = Array.isArray(exportedProject.data.assetSnapshots)
            ? exportedProject.data.assetSnapshots
            : [];
        const snapshotFiles = new Map();
        const snapshotManifest = [];
        let snapshotBytes = 0;
        const snapshotKeys = new Set();
        for (const snapshot of snapshots) {
            if (snapshotKeys.has(snapshot?.key)) throw new Error(`Project contains duplicate asset snapshot "${snapshot?.key}".`);
            snapshotKeys.add(snapshot?.key);
            const bytes = bytesFromBase64(snapshot?.data);
            validateSnapshotBytes(snapshot, bytes);
            snapshotBytes += bytes.length;
            if (snapshotBytes > MAX_PROJECT_SNAPSHOT_BYTES) throw new Error('Project asset snapshots exceed the 20 MB archive limit.');
            const path = snapshotPath(snapshot);
            const existing = snapshotFiles.get(path);
            if (existing && (existing.length !== bytes.length || sha256Fallback(existing) !== sha256Fallback(bytes))) {
                throw new Error(`Project snapshot path collision for "${snapshot.key}".`);
            }
            snapshotFiles.set(path, bytes);
            snapshotManifest.push({
                key: snapshot.key,
                packId: snapshot.packId,
                ...(snapshot.packVersion ? { packVersion: snapshot.packVersion } : {}),
                assetId: snapshot.assetId,
                mimeType: snapshot.mimeType,
                extension: SNAPSHOT_TYPES[snapshot.mimeType],
                byteLength: bytes.length,
                sha256: snapshot.sha256,
                path
            });
        }
        exportedProject.data.assetSnapshots = snapshots.map(({ data, ...snapshot }) => snapshot);
        const files = {};
        let assetIndex = 0;
        let totalAssetBytes = 0;
        const externalizeAssets = value => {
            if (typeof value === 'string') {
                const asset = encodeDataUrlAsset(value);
                if (!asset) return value;
                if (assetIndex >= MAX_PROJECT_ARCHIVE_ENTRIES - 2) {
                    throw new Error('Project package exceeds the 10,000 file limit.');
                }
                totalAssetBytes += asset.bytes.length;
                if (totalAssetBytes > MAX_PROJECT_ARCHIVE_SIZE) {
                    throw new Error('Project assets exceed the 100 MB package limit.');
                }
                const path = `assets/${String(assetIndex).padStart(6, '0')}.${asset.extension}`;
                assetIndex += 1;
                files[path] = asset.bytes;
                return `wforge-asset:${path}`;
            }
            if (Array.isArray(value)) return value.map(externalizeAssets);
            if (value && typeof value === 'object') {
                for (const [key, nested] of Object.entries(value)) value[key] = externalizeAssets(nested);
            }
            return value;
        };
        externalizeAssets(exportedProject);
        const projectJson = JSON.stringify(exportedProject);
        const projectJsonBytes = new TextEncoder().encode(projectJson);
        if (totalAssetBytes + snapshotBytes + projectJsonBytes.length > MAX_PROJECT_ARCHIVE_SIZE) {
            throw new Error('Project package exceeds the 100 MB export limit.');
        }
        files['project.json'] = projectJsonBytes;
        for (const [path, bytes] of snapshotFiles) files[path] = bytes;
        files['manifest.json'] = JSON.stringify({
            format: PROJECT_ARCHIVE_FORMAT,
            formatVersion: PROJECT_ARCHIVE_VERSION,
            projectEntry: 'project.json',
            assetCount: assetIndex,
            snapshotCount: snapshotManifest.length,
            snapshotEntryCount: snapshotFiles.size,
            projectSha256: sha256Fallback(projectJsonBytes),
            snapshots: snapshotManifest
        });
        const archive = createZipArchive(files);
        if (archive.length > MAX_PROJECT_ARCHIVE_SIZE) {
            throw new Error('Project package exceeds the 100 MB export limit.');
        }
        return archive;
    }

    importProjectPackage(bytes) {
        if (!(bytes instanceof Uint8Array) || bytes.length > MAX_PROJECT_ARCHIVE_SIZE) {
            throw new Error('Project package is missing or exceeds the 100 MB import limit.');
        }
        const files = readZipArchive(bytes, { maxUncompressedSize: MAX_PROJECT_ARCHIVE_SIZE });
        const readText = path => {
            const file = files.get(path);
            if (!file) throw new Error(`Project package is missing "${path}".`);
            return new TextDecoder().decode(file);
        };
        let manifest;
        let project;
        try {
            manifest = JSON.parse(readText('manifest.json'));
            if (manifest.format !== PROJECT_ARCHIVE_FORMAT || ![1, PROJECT_ARCHIVE_VERSION].includes(manifest.formatVersion) ||
                manifest.projectEntry !== 'project.json' || !Number.isInteger(manifest.assetCount) || manifest.assetCount < 0) {
                throw new Error('Unsupported WorldForge project package format.');
            }
            const projectBytes = files.get(manifest.projectEntry);
            if (manifest.formatVersion === PROJECT_ARCHIVE_VERSION &&
                (typeof manifest.projectSha256 !== 'string' || sha256Fallback(projectBytes) !== manifest.projectSha256)) {
                throw new Error('Project entry failed its SHA-256 integrity check.');
            }
            project = JSON.parse(new TextDecoder().decode(projectBytes));
        } catch (error) {
            throw new Error(`Could not read project package: ${error.message}`);
        }
        if (manifest.formatVersion === PROJECT_ARCHIVE_VERSION) {
            if (!Number.isInteger(manifest.snapshotCount) || manifest.snapshotCount < 0 ||
                !Number.isInteger(manifest.snapshotEntryCount) || manifest.snapshotEntryCount < 0 ||
                !Array.isArray(manifest.snapshots) || manifest.snapshots.length !== manifest.snapshotCount ||
                !Array.isArray(project.data?.assetSnapshots) || project.data.assetSnapshots.length !== manifest.snapshotCount) {
                throw new Error('Project snapshot metadata does not match its manifest.');
            }
            const snapshotByKey = new Map(project.data.assetSnapshots.map(snapshot => [snapshot?.key, snapshot]));
            const snapshotKeys = new Set();
            const snapshotPaths = new Set();
            const snapshotFiles = new Set();
            let totalSnapshotBytes = 0;
            for (const entry of manifest.snapshots) {
                if (!entry || typeof entry.key !== 'string' || snapshotKeys.has(entry.key) || snapshotFiles.has(entry.path) || snapshotPaths.has(entry.path) ||
                    entry.path !== snapshotPath(entry) || !Number.isInteger(entry.byteLength)) {
                    throw new Error('Project snapshot manifest contains invalid or duplicate metadata.');
                }
                const file = files.get(entry.path);
                if (!file) throw new Error(`Project package is missing snapshot "${entry.path}".`);
                if (!snapshotByKey.has(entry.key)) throw new Error(`Project snapshot "${entry.key}" is missing from project data.`);
                const snapshot = snapshotByKey.get(entry.key);
                if (snapshot.packId !== entry.packId || snapshot.assetId !== entry.assetId ||
                    snapshot.packVersion !== entry.packVersion || snapshot.mimeType !== entry.mimeType ||
                    snapshot.size !== entry.byteLength || snapshot.sha256 !== entry.sha256) {
                    throw new Error(`Project snapshot "${entry.key}" does not match its manifest.`);
                }
                validateSnapshotBytes({ ...entry, size: entry.byteLength }, file, `Project snapshot "${entry.key}"`);
                totalSnapshotBytes += file.length;
                if (totalSnapshotBytes > MAX_PROJECT_SNAPSHOT_BYTES) throw new Error('Project asset snapshots exceed the 20 MB import limit.');
                snapshotPaths.add(entry.path);
                snapshotFiles.add(entry.path);
                snapshotKeys.add(entry.key);
                snapshot.data = (() => {
                    let binary = '';
                    for (let offset = 0; offset < file.length; offset += 0x8000) binary += String.fromCharCode(...file.subarray(offset, offset + 0x8000));
                    return btoa(binary);
                })();
            }
            const actualSnapshotFiles = [...files.keys()].filter(path => path.startsWith('assets/'));
            if (snapshotFiles.size !== manifest.snapshotEntryCount || actualSnapshotFiles.length !== snapshotFiles.size ||
                actualSnapshotFiles.some(path => !snapshotFiles.has(path))) {
                throw new Error('Project package snapshot entries do not match its manifest.');
            }
        }
        const referencedAssets = new Set();
        const restoreAssets = value => {
            if (typeof value === 'string' && value.startsWith('wforge-asset:')) {
                const path = value.slice('wforge-asset:'.length);
                const file = files.get(path);
                if (!file || !/^assets\/[A-Za-z0-9._/-]+$/.test(path) || path.split('/').includes('..')) {
                    throw new Error(`Project asset "${path}" is missing or has an invalid path.`);
                }
                referencedAssets.add(path);
                const extension = path.split('.').pop().toLowerCase();
                const mimeType = {
                    png: 'image/png',
                    jpg: 'image/jpeg',
                    jpeg: 'image/jpeg',
                    webp: 'image/webp',
                    gif: 'image/gif',
                    svg: 'image/svg+xml'
                }[extension];
                if (!mimeType) throw new Error(`Unsupported project asset extension "${extension}".`);
                return decodeAssetDataUrl(file, mimeType);
            }
            if (Array.isArray(value)) return value.map(restoreAssets);
            if (value && typeof value === 'object') {
                for (const [key, nested] of Object.entries(value)) value[key] = restoreAssets(nested);
            }
            return value;
        };
        const assetEntries = [...files.keys()].filter(path => path.startsWith('assets/'));
        const legacyAssetEntries = assetEntries.filter(path => /^assets\/\d{6,}\.(png|jpg|webp|gif|svg)$/.test(path));
        if ([...files.keys()].some(path => !['manifest.json', 'project.json'].includes(path) &&
            (manifest.formatVersion === PROJECT_ARCHIVE_VERSION
                ? !/^assets\/[a-f0-9]{64}\.(png|jpg|webp|gif)$/.test(path)
                : !/^assets\/\d{6,}\.(png|jpg|webp|gif|svg)$/.test(path)))) {
            throw new Error('Project package contains an unexpected file entry.');
        }
        if ((manifest.formatVersion === 1 ? assetEntries : legacyAssetEntries).length !== manifest.assetCount) {
            throw new Error('Project package asset count does not match its manifest.');
        }
        const restoredProject = restoreAssets(project);
        if (manifest.formatVersion === 1 && referencedAssets.size !== assetEntries.length) {
            throw new Error('Project package contains missing or unreferenced assets.');
        }
        return this.importProject(restoredProject);
    }

    validateProject(project) {
        if (!project || typeof project !== 'object' || Array.isArray(project)) {
            throw new Error('Project file must contain a project object.');
        }
        if (typeof project.id !== 'string' || !project.id.trim() || project.id.length > 200) {
            throw new Error('Project ID is missing or invalid.');
        }
        if (!Number.isInteger(project.schemaVersion) || project.schemaVersion < 1 ||
            project.schemaVersion > SCHEMA_VERSION) {
            throw new Error(`Unsupported project schema version: ${project.schemaVersion}.`);
        }
        if (!this.isValidDate(project.createdAt) || !this.isValidDate(project.updatedAt)) {
            throw new Error('Project dates are missing or invalid.');
        }
        const fields = this.validateFields(project);
        const migrated = this.migrateProject({ ...project, ...fields, data: this.cloneJsonObject(project.data) });
        migrated.data = this.validateProjectData(migrated.data);
        return migrated;
    }

    migrateProject(project) {
        let migrated = { ...project };
        while (migrated.schemaVersion < SCHEMA_VERSION) {
            if (migrated.schemaVersion === 1) {
                migrated = {
                    ...migrated,
                    schemaVersion: 2,
                    data: {
                        ...migrated.data,
                        history: migrated.data.history || {}
                    }
                };
                continue;
            }
            throw new Error(`No migration is available for project schema version ${migrated.schemaVersion}.`);
        }
        return migrated;
    }

    validateProjectData(data) {
        const map = data.map === undefined ? createEmptyMap() : validateMap(data.map);
        const geography = new GeographyService(data.geography || {});
        const civilization = new CivilizationService(data.civilization || {}, geography.data);
        const history = new HistoryService(data.history || {}, geography.data, civilization.data);
        for (const location of geography.data.locations) {
            for (const eventId of location.eventIds || []) {
                if (!history.get('events', eventId)) {
                    throw new Error(`Event ID "${eventId}" in Location "${location.name}" does not exist.`);
                }
            }
        }
        const mapObjects = new Map(map.layers.flatMap(layer =>
            layer.objects.map(object => [object.id, object])));
        const geographyRecords = new Map(ENTITY_TYPES.flatMap(type =>
            geography.data[type].map(record => [record.id, { type, record }])));
        for (const [type, records] of Object.entries(geography.data)) {
            for (const record of records) {
                if (!record.mapObjectId) continue;
                const object = mapObjects.get(record.mapObjectId);
                if (!object) throw new Error(`Map object ID "${record.mapObjectId}" in "${record.name}" does not exist.`);
                if (object.entityType !== type || object.entityId !== record.id) {
                    throw new Error(`Map object ID "${record.mapObjectId}" is not linked back to "${record.name}".`);
                }
            }
        }
        for (const [objectId, object] of mapObjects) {
            const hasEntityType = object.entityType !== undefined && object.entityType !== null && object.entityType !== '';
            const hasEntityId = object.entityId !== undefined && object.entityId !== null && object.entityId !== '';
            if (hasEntityType !== hasEntityId) {
                throw new Error(`Map object "${objectId}" must contain both entityType and entityId.`);
            }
            if (hasEntityType) {
                if (!ENTITY_TYPES.includes(object.entityType)) {
                    throw new Error(`Map object "${objectId}" references unsupported entity type "${object.entityType}".`);
                }
                const linkedRecord = geographyRecords.get(object.entityId);
                if (!linkedRecord || linkedRecord.type !== object.entityType || linkedRecord.record.mapObjectId !== objectId) {
                    throw new Error(`Map object "${objectId}" references a missing or inconsistent geography record.`);
                }
            }
        }
        return {
            ...data,
            map,
            geography: geography.data,
            civilization: civilization.data,
            history: history.data
        };
    }

    validateFields(input) {
        if (!input || typeof input !== 'object' || Array.isArray(input)) {
            throw new Error('Project fields must be provided as an object.');
        }
        const name = typeof input.name === 'string' ? input.name.trim() : '';
        const description = typeof input.description === 'string' ? input.description.trim() : '';
        const coverImage = typeof input.coverImage === 'string' ? input.coverImage.trim() : '';
        if (!name || name.length > MAX_NAME_LENGTH) {
            throw new Error(`Project name is required and must be ${MAX_NAME_LENGTH} characters or fewer.`);
        }
        if (description.length > MAX_DESCRIPTION_LENGTH) {
            throw new Error(`Project description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`);
        }
        if (coverImage.length > MAX_COVER_LENGTH) {
            throw new Error('Cover image is too large (maximum 3 MB).');
        }
        if (coverImage && !/^https?:\/\/|^data:image\/(?:png|jpeg|webp|gif);base64,/i.test(coverImage)) {
            throw new Error('Cover image must be an HTTP(S) URL or a supported image data URL.');
        }
        return { name, description, coverImage };
    }

    isValidDate(value) {
        return typeof value === 'string' && !Number.isNaN(Date.parse(value));
    }

    cloneJsonObject(data) {
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            throw new Error('Project data must be a JSON object.');
        }
        let clone;
        try {
            const serialized = JSON.stringify(data);
            if (typeof serialized !== 'string') throw new Error('Project data is not serializable.');
            clone = JSON.parse(serialized);
        } catch {
            throw new Error('Project data must contain only JSON-serializable values.');
        }
        if (!clone || typeof clone !== 'object' || Array.isArray(clone)) {
            throw new Error('Project data must be a JSON object.');
        }
        return clone;
    }

    async insertNewProject(project) {
        for (let attempt = 0; attempt < 10; attempt += 1) {
            if (attempt > 0) project.id = await this.createUniqueId();
            try {
                await this.database.addProject(project);
                return project;
            } catch (error) {
                if (!error || error.name !== 'ConstraintError') throw error;
            }
        }
        throw new Error('Could not reserve a unique project ID. Please try again.');
    }

    async insertImportedProject(project) {
        try {
            await this.database.addProject(project);
            return project;
        } catch (error) {
            if (!error || error.name !== 'ConstraintError') throw error;
            const replacement = {
                ...project,
                id: await this.createUniqueId(),
                name: this.validateFields({ name: `${project.name.slice(0, MAX_NAME_LENGTH - 11)} (Imported)` }).name
            };
            return this.insertNewProject(replacement);
        }
    }

    async createUniqueId() {
        for (let attempt = 0; attempt < 10; attempt += 1) {
            const id = globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function'
                ? globalThis.crypto.randomUUID()
                : `project-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            if (!await this.database.getProject(id)) return id;
        }
        throw new Error('Could not generate a unique project ID. Please try again.');
    }
}
