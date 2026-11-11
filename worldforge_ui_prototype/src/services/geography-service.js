const ENTITY_TYPES = ['worlds', 'continents', 'countries', 'cities', 'locations'];
const MAX_NAME_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 4000;

function createId(type) {
    return globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function'
        ? `${type}-${globalThis.crypto.randomUUID()}`
        : `${type}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function entityPrefix(type) {
    return {
        worlds: 'world',
        continents: 'continent',
        countries: 'country',
        cities: 'city',
        locations: 'location'
    }[type];
}

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function emptyDatabase() {
    return Object.fromEntries(ENTITY_TYPES.map(type => [type, []]));
}

export class GeographyService {
    constructor(data = {}) {
        this.data = GeographyService.validateDatabase(data);
    }

    static validateDatabase(input = {}) {
        if (!input || typeof input !== 'object' || Array.isArray(input)) {
            throw new Error('Geography database must be an object.');
        }
        const database = emptyDatabase();
        const ids = new Set();
        for (const type of ENTITY_TYPES) {
            const records = input[type] === undefined ? [] : input[type];
            if (!Array.isArray(records)) throw new Error(`Geography "${type}" must be an array.`);
            database[type] = records.map(record => {
                if (!record || typeof record !== 'object' || typeof record.id !== 'string' ||
                    !record.id.trim() || ids.has(record.id.trim())) {
                    throw new Error('Geography records must have globally unique IDs.');
                }
                const id = record.id.trim();
                ids.add(id);
                return GeographyService.validateRecord(type, { ...record, id });
            });
        }
        const service = Object.create(GeographyService.prototype);
        service.data = database;
        service.validateRelations();
        return database;
    }

    static validateRecord(type, record) {
        const name = typeof record.name === 'string' ? record.name.trim() : '';
        const description = typeof record.description === 'string' ? record.description.trim() : '';
        if (!name || name.length > MAX_NAME_LENGTH) {
            throw new Error('Name is required and must be 120 characters or fewer.');
        }
        if (description.length > MAX_DESCRIPTION_LENGTH) {
            throw new Error('Description must be 4000 characters or fewer.');
        }
        const mapObjectId = record.mapObjectId === undefined || record.mapObjectId === null
            ? null
            : typeof record.mapObjectId === 'string' ? record.mapObjectId.trim() : record.mapObjectId;
        if (mapObjectId !== null && (typeof mapObjectId !== 'string' || !mapObjectId)) {
            throw new Error('Map object link must be a non-empty ID.');
        }
        const base = {
            ...record,
            id: typeof record.id === 'string' ? record.id.trim() : record.id,
            name,
            description,
            createdAt: GeographyService.validateDate(record.createdAt || new Date().toISOString(), 'Created date'),
            updatedAt: GeographyService.validateDate(record.updatedAt || new Date().toISOString(), 'Updated date'),
            mapPosition: GeographyService.validatePosition(record.mapPosition),
            mapObjectId
        };
        if (type === 'worlds') return base;
        if (type === 'continents') return { ...base, worldId: GeographyService.requiredId(record.worldId, 'World') };
        if (type === 'countries') {
            return {
                ...base,
                continentId: GeographyService.requiredId(record.continentId, 'Continent'),
                capitalCityId: record.capitalCityId ? GeographyService.requiredId(record.capitalCityId, 'Capital city') : null
            };
        }
        if (type === 'cities') {
            const settlementType = record.settlementType || 'settlement';
            if (!['capital', 'settlement'].includes(settlementType)) {
                throw new Error('City type must be capital or settlement.');
            }
            return {
                ...base,
                countryId: GeographyService.requiredId(record.countryId, 'Country'),
                settlementType
            };
        }
        if (type === 'locations') {
            const eventIds = record.eventIds === undefined ? [] : record.eventIds;
            if (!Array.isArray(eventIds) || eventIds.some(id => typeof id !== 'string' || !id.trim())) {
                throw new Error('Location event links must be a list of unique event IDs.');
            }
            const normalizedEventIds = eventIds.map(id => id.trim());
            if (new Set(normalizedEventIds).size !== normalizedEventIds.length) {
                throw new Error('Location event links must be a list of unique event IDs.');
            }
            return {
                ...base,
                cityId: GeographyService.requiredId(record.cityId, 'City'),
                eventIds: normalizedEventIds
            };
        }
        throw new Error(`Unknown geography type "${type}".`);
    }

    static requiredId(value, label) {
        if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} is required.`);
        return value.trim();
    }

    static validateDate(value, label) {
        if (typeof value !== 'string' || !value.trim() || !Number.isFinite(Date.parse(value))) {
            throw new Error(`${label} must be a valid date.`);
        }
        return value;
    }

    static validatePosition(position) {
        if (position === undefined || position === null) return null;
        if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y)) {
            throw new Error('Map coordinates must be finite numbers.');
        }
        return { x: position.x, y: position.y };
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
        const relations = {
            worlds: [],
            continents: [['world', 'worlds', record.worldId]],
            countries: [['continent', 'continents', record.continentId]],
            cities: [['country', 'countries', record.countryId]],
            locations: [['city', 'cities', record.cityId]]
        }[type];
        const detail = { ...record };
        for (const [key, relatedType, relatedId] of relations) {
            detail[key] = this.get(relatedType, relatedId);
        }
        if (type === 'countries') detail.settlements = this.data.cities
            .filter(city => city.countryId === id).map(city => clone(city));
        if (type === 'cities') detail.locations = this.data.locations
            .filter(location => location.cityId === id).map(location => clone(location));
        return detail;
    }

    search(type, { query = '', filters = {} } = {}) {
        this.requireType(type);
        const normalizedQuery = String(query).trim().toLocaleLowerCase();
        return this.data[type].filter(record => {
            const matchesQuery = !normalizedQuery ||
                `${record.name} ${record.description}`.toLocaleLowerCase().includes(normalizedQuery);
            const matchesFilters = Object.entries(filters).every(([key, value]) =>
                value === '' || value === null || value === undefined || record[key] === value);
            return matchesQuery && matchesFilters;
        }).map(record => clone(record));
    }

    create(type, input) {
        this.requireType(type);
        const now = new Date().toISOString();
        const record = GeographyService.validateRecord(type, {
            ...input,
            id: input && input.id ? input.id : createId(entityPrefix(type)),
            createdAt: now,
            updatedAt: now
        });
        if (ENTITY_TYPES.some(bucket => this.data[bucket].some(item => item.id === record.id))) {
            throw new Error(`Geography ID "${record.id}" already exists.`);
        }
        const next = { ...clone(this.data), [type]: [...this.data[type], record] };
        this.syncCapitalRelations(next, type, record, null);
        this.commitDatabase(next);
        return clone(record);
    }

    update(type, id, changes) {
        this.requireType(type);
        if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
            throw new Error('Geography changes must be an object.');
        }
        const index = this.data[type].findIndex(record => record.id === id);
        if (index < 0) throw new Error('Geography record not found.');
        const updated = GeographyService.validateRecord(type, {
            ...this.data[type][index],
            ...changes,
            id,
            createdAt: this.data[type][index].createdAt,
            updatedAt: new Date().toISOString()
        });
        const records = [...this.data[type]];
        records[index] = updated;
        const next = { ...clone(this.data), [type]: records };
        this.syncCapitalRelations(next, type, updated, this.data[type][index]);
        this.commitDatabase(next);
        return clone(updated);
    }

    delete(type, id) {
        this.requireType(type);
        const record = this.data[type].find(item => item.id === id);
        if (!record) throw new Error('Geography record not found.');
        const childTypes = {
            worlds: ['continents', item => item.worldId === id],
            continents: ['countries', item => item.continentId === id],
            countries: ['cities', item => item.countryId === id],
            cities: ['locations', item => item.cityId === id],
            locations: null
        };
        const child = childTypes[type];
        if (child) {
            const dependent = this.data[child[0]].find(child[1]);
            if (dependent) throw new Error(`Cannot delete "${record.name}" while "${dependent.name}" is linked to it.`);
        }
        const next = { ...clone(this.data), [type]: this.data[type].filter(item => item.id !== id) };
        this.syncCapitalRelations(next, type, null, record);
        this.commitDatabase(next);
        return clone(record);
    }

    setMapLink(type, id, mapObjectId, mapPosition) {
        return this.update(type, id, {
            mapObjectId: mapObjectId || null,
            mapPosition: GeographyService.validatePosition(mapPosition)
        });
    }

    getByMapObjectId(mapObjectId) {
        for (const type of ENTITY_TYPES) {
            const record = this.data[type].find(item => item.mapObjectId === mapObjectId);
            if (record) return { type, record: clone(record) };
        }
        return null;
    }

    commit(type, records) {
        const next = { ...this.data, [type]: records };
        this.commitDatabase(next);
    }

    commitDatabase(next) {
        this.data = GeographyService.validateDatabase(next);
    }

    syncCapitalRelations(database, type, record, previous) {
        if (type === 'cities' && previous && previous.settlementType === 'capital' &&
            (!record || record.countryId !== previous.countryId || record.settlementType !== 'capital')) {
            const previousCountry = database.countries.find(country => country.id === previous.countryId);
            if (previousCountry && previousCountry.capitalCityId === previous.id) {
                const replacement = database.cities.find(city =>
                    city.countryId === previousCountry.id && city.id !== previous.id);
                previousCountry.capitalCityId = replacement ? replacement.id : null;
            }
        }
        if (type === 'cities' && record && record.settlementType === 'capital') {
            const country = database.countries.find(item => item.id === record.countryId);
            if (!country) throw new Error('Country is required.');
            country.capitalCityId = record.id;
        }
        if (type === 'countries' && record) {
            const country = database.countries.find(item => item.id === record.id);
            if (country && country.capitalCityId) {
                const capital = database.cities.find(city => city.id === country.capitalCityId);
                if (!capital || capital.countryId !== country.id) {
                    throw new Error('Capital city must belong to this country.');
                }
                capital.settlementType = 'capital';
            }
        }
        for (const country of database.countries) {
            for (const city of database.cities) {
                if (city.countryId === country.id) {
                    city.settlementType = city.id === country.capitalCityId ? 'capital' : 'settlement';
                }
            }
        }
    }

    validateRelations() {
        const find = (type, id) => this.data[type].find(record => record.id === id);
        const ids = new Set();
        for (const type of ENTITY_TYPES) {
            for (const record of this.data[type]) {
                if (record.worldId && !find('worlds', record.worldId)) throw new Error(`Continent "${record.name}" references a missing world.`);
                if (record.continentId && !find('continents', record.continentId)) throw new Error(`Country "${record.name}" references a missing continent.`);
                if (record.countryId && !find('countries', record.countryId)) throw new Error(`City "${record.name}" references a missing country.`);
                if (record.cityId && !find('cities', record.cityId)) throw new Error(`Location "${record.name}" references a missing city.`);
                if (record.mapObjectId) {
                    if (ids.has(record.mapObjectId)) throw new Error('A map object may link to only one geography record.');
                    ids.add(record.mapObjectId);
                }
            }
        }
        for (const country of this.data.countries) {
            const countryCities = this.data.cities.filter(city => city.countryId === country.id);
            if (countryCities.length && !country.capitalCityId) {
                throw new Error(`Country "${country.name}" must have a capital when it has settlements.`);
            }
            if (!country.capitalCityId) continue;
            const capital = find('cities', country.capitalCityId);
            if (!capital || capital.countryId !== country.id || capital.settlementType !== 'capital') {
                throw new Error(`Country "${country.name}" has an invalid capital city link.`);
            }
        }
        for (const city of this.data.cities) {
            if (city.settlementType !== 'capital') continue;
            const country = find('countries', city.countryId);
            if (!country || country.capitalCityId !== city.id) {
                throw new Error(`Capital "${city.name}" must be linked from its country.`);
            }
        }
    }

    requireType(type) {
        if (!ENTITY_TYPES.includes(type)) throw new Error(`Unknown geography type "${type}".`);
    }
}

export { ENTITY_TYPES };
