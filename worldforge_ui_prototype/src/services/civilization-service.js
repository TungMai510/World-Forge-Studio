export const CIVILIZATION_TYPES = ['characters', 'races', 'cultures', 'religions', 'organizations'];

const TYPE_LABELS = {
    characters: 'Character',
    races: 'Race',
    cultures: 'Culture',
    religions: 'Religion',
    organizations: 'Organization'
};

const REFERENCE_FIELDS = {
    characters: {
        countryIds: ['countries', 'Country'],
        cityIds: ['cities', 'City'],
        organizationIds: ['organizations', 'Organization'],
        characterIds: ['characters', 'Character'],
        raceIds: ['races', 'Race'],
        cultureIds: ['cultures', 'Culture'],
        religionIds: ['religions', 'Religion']
    },
    races: { regionIds: [null, 'Region'] },
    cultures: { countryIds: ['countries', 'Country'] },
    religions: { countryIds: ['countries', 'Country'] },
    organizations: { countryIds: ['countries', 'Country'], cityIds: ['cities', 'City'] }
};

function createId(type) {
    return globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function'
        ? `${type.slice(0, -1)}-${globalThis.crypto.randomUUID()}`
        : `${type.slice(0, -1)}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function emptyData() {
    return Object.fromEntries(CIVILIZATION_TYPES.map(type => [type, []]));
}

function normalizeIds(value, field) {
    if (value === undefined || value === null || value === '') return [];
    const ids = Array.isArray(value) ? value : String(value).split(',');
    if (ids.some(id => typeof id !== 'string' || !id.trim())) {
        throw new Error(`${field} must contain non-empty IDs.`);
    }
    const normalized = ids.map(id => id.trim());
    if (new Set(normalized).size !== normalized.length) {
        throw new Error(`${field} cannot contain duplicate IDs.`);
    }
    return normalized;
}

function normalizeCustomFields(value) {
    if (value === undefined || value === null || value === '') return {};
    if (typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('Custom fields must be a JSON object.');
    }
    const fields = {};
    for (const [key, fieldValue] of Object.entries(value)) {
        const name = key.trim();
        if (!name || name.length > 80) throw new Error('Custom field names must be 1-80 characters.');
        if (typeof fieldValue === 'string' && fieldValue.length > 4000) {
            throw new Error(`Custom field "${name}" is too long.`);
        }
        fields[name] = fieldValue;
    }
    return fields;
}

export class CivilizationService {
    constructor(data = {}, geography = {}) {
        this.geography = geography || {};
        this.data = CivilizationService.validateDatabase(data);
        const geographyIds = new Set(Object.values(this.geography).flatMap(records =>
            Array.isArray(records) ? records.map(record => record.id) : []));
        if (CIVILIZATION_TYPES.some(type => this.data[type].some(record => geographyIds.has(record.id)))) {
            throw new Error('Civilization IDs must be unique across the project.');
        }
        this.validateRelations();
    }

    static validateDatabase(input = {}) {
        if (!input || typeof input !== 'object' || Array.isArray(input)) {
            throw new Error('Civilization database must be an object.');
        }
        const data = emptyData();
        const ids = new Set();
        for (const type of CIVILIZATION_TYPES) {
            const records = input[type] === undefined ? [] : input[type];
            if (!Array.isArray(records)) throw new Error(`Civilization "${type}" must be an array.`);
            data[type] = records.map(record => {
                if (!record || typeof record !== 'object' || Array.isArray(record) ||
                    typeof record.id !== 'string' || !record.id.trim() || ids.has(record.id.trim())) {
                    throw new Error('Civilization records must have globally unique IDs.');
                }
                const normalized = CivilizationService.validateRecord(type, { ...record, id: record.id.trim() });
                ids.add(normalized.id);
                return normalized;
            });
        }
        return data;
    }

    static validateRecord(type, record) {
        if (!CIVILIZATION_TYPES.includes(type)) throw new Error(`Unknown civilization type "${type}".`);
        const name = typeof record.name === 'string' ? record.name.trim() : '';
        const description = typeof record.description === 'string' ? record.description.trim() : '';
        const image = typeof record.image === 'string' ? record.image.trim() : '';
        if (!name || name.length > 160) throw new Error('Name is required and must be 160 characters or fewer.');
        if (description.length > 12000) throw new Error('Description must be 12000 characters or fewer.');
        if (image.length > 3 * 1024 * 1024) throw new Error('Illustration URL or data must be 3 MB or less.');
        if (/^\s*(javascript|vbscript):/i.test(image)) throw new Error('Illustration must be an image URL or data URL.');
        const attributes = normalizeCustomFields(record.attributes);
        const relations = {};
        for (const field of Object.keys(REFERENCE_FIELDS[type])) {
            relations[field] = normalizeIds(record[field], field);
        }
        const createdAt = record.createdAt || new Date().toISOString();
        const updatedAt = record.updatedAt || createdAt;
        if (!Number.isFinite(Date.parse(createdAt)) || !Number.isFinite(Date.parse(updatedAt))) {
            throw new Error('Civilization record dates must be valid.');
        }
        return {
            ...record,
            ...relations,
            id: record.id,
            name,
            description,
            image,
            attributes,
            createdAt,
            updatedAt
        };
    }

    getAll(type) {
        this.requireType(type);
        return this.data[type].map(record => clone(record));
    }

    get(type, id) {
        this.requireType(type);
        const record = this.data[type].find(item => item.id === id);
        return record ? clone(record) : null;
    }

    getDetail(type, id) {
        const record = this.get(type, id);
        if (!record) return null;
        const relations = {};
        for (const [field, [targetType]] of Object.entries(REFERENCE_FIELDS[type])) {
            relations[field] = record[field].map(targetId => this.lookup(targetType, targetId)).filter(Boolean);
        }
        return { ...record, relations };
    }

    search(type, { query = '', filters = {} } = {}) {
        this.requireType(type);
        const normalizedQuery = String(query).trim().toLocaleLowerCase();
        return this.data[type].filter(record => {
            const haystack = `${record.name} ${record.description} ${JSON.stringify(record.attributes)}`.toLocaleLowerCase();
            return (!normalizedQuery || haystack.includes(normalizedQuery)) &&
                Object.entries(filters).every(([field, value]) => {
                    if (value === '' || value === null || value === undefined) return true;
                    return Array.isArray(record[field]) ? record[field].includes(value) : record[field] === value;
                });
        }).map(record => clone(record));
    }

    create(type, input) {
        this.requireType(type);
        const now = new Date().toISOString();
        const record = CivilizationService.validateRecord(type, {
            ...input,
            id: input && input.id ? input.id : createId(type),
            createdAt: now,
            updatedAt: now
        });
        if (this.findAny(record.id)) throw new Error(`Civilization ID "${record.id}" already exists.`);
        const next = { ...clone(this.data), [type]: [...this.data[type], record] };
        this.commit(next);
        return clone(record);
    }

    update(type, id, changes) {
        this.requireType(type);
        if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
            throw new Error('Civilization changes must be an object.');
        }
        const index = this.data[type].findIndex(item => item.id === id);
        if (index < 0) throw new Error('Civilization record not found.');
        const updated = CivilizationService.validateRecord(type, {
            ...this.data[type][index],
            ...changes,
            id,
            createdAt: this.data[type][index].createdAt,
            updatedAt: new Date().toISOString()
        });
        const next = { ...clone(this.data), [type]: [...this.data[type]] };
        next[type][index] = updated;
        this.commit(next);
        return clone(updated);
    }

    delete(type, id) {
        this.requireType(type);
        const record = this.data[type].find(item => item.id === id);
        if (!record) throw new Error('Civilization record not found.');
        const usages = this.findReferences(type, id);
        if (usages.length) throw new Error(`Cannot delete "${record.name}" while it is linked from ${usages[0]}.`);
        const next = { ...clone(this.data), [type]: this.data[type].filter(item => item.id !== id) };
        this.commit(next);
        return clone(record);
    }

    lookup(type, id) {
        if (!type) {
            for (const group of Object.values(this.geography)) {
                if (Array.isArray(group)) {
                    const match = group.find(record => record.id === id);
                    if (match) return { ...clone(match), type: 'region' };
                }
            }
            return null;
        }
        const database = CIVILIZATION_TYPES.includes(type) ? this.data : this.geography;
        const records = database && Array.isArray(database[type]) ? database[type] : [];
        return records.find(record => record.id === id) || null;
    }

    findAny(id) {
        return CIVILIZATION_TYPES.some(type => this.data[type].some(record => record.id === id)) ||
            Object.values(this.geography).some(records =>
                Array.isArray(records) && records.some(record => record.id === id));
    }

    findReferences(type, id) {
        const usages = [];
        for (const ownerType of CIVILIZATION_TYPES) {
            for (const record of this.data[ownerType]) {
                for (const [field, [targetType]] of Object.entries(REFERENCE_FIELDS[ownerType])) {
                    const matchesType = targetType ? targetType === type : !CIVILIZATION_TYPES.includes(type);
                    if (matchesType && record[field].includes(id)) {
                        usages.push(`${TYPE_LABELS[ownerType]} "${record.name}"`);
                    }
                }
            }
        }
        return usages;
    }

    commit(next) {
        const data = CivilizationService.validateDatabase(next);
        const previous = this.data;
        this.data = data;
        try {
            this.validateRelations();
        } catch (error) {
            this.data = previous;
            throw error;
        }
    }

    validateRelations() {
        for (const type of CIVILIZATION_TYPES) {
            for (const record of this.data[type]) {
                for (const [field, [targetType, label]] of Object.entries(REFERENCE_FIELDS[type])) {
                    for (const targetId of record[field]) {
                        if (targetType === type && targetId === record.id) {
                            throw new Error(`${TYPE_LABELS[type]} "${record.name}" cannot link to itself.`);
                        }
                        if (!this.lookup(targetType, targetId)) {
                            throw new Error(`${label} ID "${targetId}" in "${record.name}" does not exist.`);
                        }
                    }
                }
            }
        }
    }

    requireType(type) {
        if (!CIVILIZATION_TYPES.includes(type)) throw new Error(`Unknown civilization type "${type}".`);
    }
}

export { TYPE_LABELS };
