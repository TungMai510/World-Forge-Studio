export const HISTORY_TYPES = ['calendars', 'eras', 'periods', 'records', 'events'];

export const RELATION_TYPES = {
    countryIds: ['countries', 'Country'],
    characterIds: ['characters', 'Character'],
    organizationIds: ['organizations', 'Organization'],
    raceIds: ['races', 'Race'],
    religionIds: ['religions', 'Religion'],
    eventIds: ['events', 'Event'],
    recordIds: ['records', 'Historical record']
};

const LABELS = {
    calendars: 'Calendar',
    eras: 'Era',
    periods: 'Period',
    records: 'Historical record',
    events: 'Event'
};

const DATE_PRECISIONS = ['day', 'month', 'year', 'decade', 'century'];
const RELATION_FIELDS = Object.keys(RELATION_TYPES);

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function createId(type) {
    return globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function'
        ? `${type.slice(0, -1)}-${globalThis.crypto.randomUUID()}`
        : `${type.slice(0, -1)}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function emptyData() {
    return {
        calendars: [{ id: 'calendar-default', name: 'Default Calendar', months: [] }],
        eras: [],
        periods: [],
        records: [],
        events: []
    };
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

function normalizeDate(value, label) {
    if (value === undefined || value === null || value === '') return null;
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error(`${label} must be a calendar date object.`);
    }
    const { calendarId, year, month = null, day = null, precision } = value;
    if (typeof calendarId !== 'string' || !calendarId.trim() || !Number.isSafeInteger(year)) {
        throw new Error(`${label} must include a calendar and a whole-number year.`);
    }
    if (!DATE_PRECISIONS.includes(precision)) {
        throw new Error(`${label} precision must be day, month, year, decade or century.`);
    }
    const normalizedMonth = month === '' || month === undefined ? null : month;
    const normalizedDay = day === '' || day === undefined ? null : day;
    if (normalizedMonth !== null && (!Number.isInteger(normalizedMonth) || normalizedMonth < 1)) {
        throw new Error(`${label} month must be a positive whole number.`);
    }
    if (normalizedDay !== null && (!Number.isInteger(normalizedDay) || normalizedDay < 1)) {
        throw new Error(`${label} day must be a positive whole number.`);
    }
    if (precision === 'day' && (normalizedMonth === null || normalizedDay === null)) {
        throw new Error(`${label} with day precision requires a month and day.`);
    }
    if (precision === 'month' && (normalizedMonth === null || normalizedDay !== null)) {
        throw new Error(`${label} with month precision requires a month and no day.`);
    }
    if (['year', 'decade', 'century'].includes(precision) &&
        (normalizedMonth !== null || normalizedDay !== null)) {
        throw new Error(`${label} with ${precision} precision cannot include a month or day.`);
    }
    return {
        calendarId: calendarId.trim(),
        year,
        month: normalizedMonth,
        day: normalizedDay,
        precision
    };
}

function compareTuples(left, right) {
    for (let index = 0; index < left.length; index += 1) {
        const [a, b] = [left[index], right[index]];
        if (a !== b) return a - b;
    }
    return 0;
}

function dateBounds(date) {
    const lower = [date.year, date.month ?? 1, date.day ?? 1];
    if (date.precision === 'decade') return { lower, upper: [date.year + 9, 99, 99] };
    if (date.precision === 'century') return { lower, upper: [date.year + 99, 99, 99] };
    if (date.precision === 'year') return { lower, upper: [date.year, 99, 99] };
    if (date.precision === 'month') return { lower, upper: [date.year, date.month, 99] };
    return { lower, upper: [date.year, date.month, date.day] };
}

function compareDateStarts(left, right) {
    return compareTuples(dateBounds(left).lower, dateBounds(right).lower);
}

function compareDateRange(start, end) {
    return compareTuples(dateBounds(start).lower, dateBounds(end).upper);
}

function validateCalendarDate(value, calendar, label) {
    if (!value) return null;
    if (value.calendarId !== calendar.id) throw new Error(`${label} references a different calendar.`);
    const monthCount = calendar.months.length || 12;
    if (value.month !== null && value.month > monthCount) {
        throw new Error(`${label} month is outside "${calendar.name}".`);
    }
    if (value.day !== null) {
        const month = calendar.months[value.month - 1];
        const maximumDays = month && month.days ? month.days : 31;
        if (value.day > maximumDays) throw new Error(`${label} day is outside its calendar month.`);
    }
    return value;
}

export class HistoryService {
    constructor(data = {}, geography = {}, civilization = {}) {
        this.geography = geography || {};
        this.civilization = civilization || {};
        this.data = HistoryService.validateDatabase(data);
        const externalIds = this.externalIds();
        if (HISTORY_TYPES.some(type => this.data[type].some(record => externalIds.has(record.id)))) {
            throw new Error('History IDs must be unique across the project.');
        }
        this.validateRelations();
    }

    static validateDatabase(input = {}) {
        if (!input || typeof input !== 'object' || Array.isArray(input)) {
            throw new Error('History database must be an object.');
        }
        const base = emptyData();
        const data = Object.fromEntries(HISTORY_TYPES.map(type => [type, []]));
        const ids = new Set();
        for (const type of HISTORY_TYPES) {
            const records = input[type] === undefined ? base[type] : input[type];
            if (!Array.isArray(records)) throw new Error(`History "${type}" must be an array.`);
            data[type] = records.map(record => {
                if (!record || typeof record !== 'object' || Array.isArray(record) ||
                    typeof record.id !== 'string' || !record.id.trim() || ids.has(record.id.trim())) {
                    throw new Error('History records must have globally unique IDs.');
                }
                const normalized = HistoryService.validateRecord(type, { ...record, id: record.id.trim() });
                ids.add(normalized.id);
                return normalized;
            });
        }
        return data;
    }

    static validateRecord(type, record) {
        if (!HISTORY_TYPES.includes(type)) throw new Error(`Unknown history type "${type}".`);
        const id = typeof record.id === 'string' ? record.id.trim() : '';
        const name = typeof record.name === 'string' ? record.name.trim() : '';
        const description = typeof record.description === 'string' ? record.description.trim() : '';
        if (!id) throw new Error('History record ID is required.');
        if (!name || name.length > 160) throw new Error('Name is required and must be 160 characters or fewer.');
        if (description.length > 12000) throw new Error('Description must be 12000 characters or fewer.');
        const createdAt = record.createdAt || new Date().toISOString();
        const updatedAt = record.updatedAt || createdAt;
        if (typeof createdAt !== 'string' || !Number.isFinite(Date.parse(createdAt)) ||
            typeof updatedAt !== 'string' || !Number.isFinite(Date.parse(updatedAt))) {
            throw new Error('History record timestamps must be valid dates.');
        }
        const result = {
            ...record,
            id,
            name,
            description,
            createdAt,
            updatedAt
        };
        if (type === 'calendars') {
            const months = record.months === undefined ? [] : record.months;
            if (!Array.isArray(months) || months.some(month => !month || typeof month.name !== 'string' ||
                !month.name.trim() || month.name.length > 80 ||
                (month.days !== undefined && month.days !== null &&
                    (!Number.isInteger(month.days) || month.days < 1 || month.days > 10000)))) {
                throw new Error('Calendar months need a name and an optional positive day count.');
            }
            if (new Set(months.map(month => month.name.trim().toLocaleLowerCase())).size !== months.length) {
                throw new Error('Calendar month names must be unique.');
            }
            return { ...result, months: months.map(month => ({ name: month.name.trim(), days: month.days ?? null })) };
        }
        result.startDate = normalizeDate(record.startDate, 'Start date');
        result.endDate = normalizeDate(record.endDate, 'End date');
        if (type === 'periods') {
            result.eraId = requireOptionalId(record.eraId, 'Era');
        }
        if (type === 'records') {
            result.eraId = requireOptionalId(record.eraId, 'Era');
            result.periodId = requireOptionalId(record.periodId, 'Period');
        }
        if (type === 'events') {
            result.startDate = normalizeDate(record.startDate, 'Start date');
            result.endDate = normalizeDate(record.endDate, 'End date');
            if (!result.startDate) throw new Error('Event start date is required.');
            if (result.endDate && result.endDate.calendarId !== result.startDate.calendarId) {
                throw new Error('Event start and end dates must use the same calendar.');
            }
            if (result.endDate && compareDateRange(result.startDate, result.endDate) > 0) {
                throw new Error('Event end date cannot be before its start date.');
            }
            result.locationId = requireOptionalId(record.locationId, 'Location');
            result.eraId = requireOptionalId(record.eraId, 'Era');
            result.periodId = requireOptionalId(record.periodId, 'Period');
            result.causes = normalizeTextList(record.causes, 'Causes');
            result.consequences = normalizeTextList(record.consequences, 'Consequences');
        }
        for (const field of RELATION_FIELDS) result[field] = normalizeIds(record[field], field);
        return result;
    }

    externalIds() {
        const sources = [...Object.values(this.geography), ...Object.values(this.civilization)];
        return new Set(sources.flatMap(records =>
            Array.isArray(records) ? records.map(record => record.id) : []));
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

    lookup(type, id) {
        if (!type) {
            for (const group of Object.values(this.geography)) {
                if (Array.isArray(group)) {
                    const match = group.find(record => record.id === id);
                    if (match) return match;
                }
            }
            return null;
        }
        const database = HISTORY_TYPES.includes(type) ? this.data
            : this.civilization[type] ? this.civilization : this.geography;
        const records = database && Array.isArray(database[type]) ? database[type] : [];
        return records.find(record => record.id === id) || null;
    }

    getDetail(type, id) {
        const record = this.get(type, id);
        if (!record) return null;
        const relations = {};
        for (const field of RELATION_FIELDS) {
            relations[field] = (record[field] || [])
                .map(targetId => this.lookup(RELATION_TYPES[field][0], targetId)).filter(Boolean);
        }
        if (record.eraId) relations.era = this.lookup('eras', record.eraId);
        if (record.periodId) relations.period = this.lookup('periods', record.periodId);
        if (record.locationId) relations.location = this.lookup('locations', record.locationId);
        return { ...record, relations };
    }

    search(type, { query = '', filters = {} } = {}) {
        this.requireType(type);
        const needle = String(query).trim().toLocaleLowerCase();
        return this.data[type].filter(record => {
            const matchesQuery = !needle ||
                `${record.name} ${record.description} ${JSON.stringify(record)}`.toLocaleLowerCase().includes(needle);
            return matchesQuery && Object.entries(filters).every(([field, value]) => {
                if (value === '' || value === null || value === undefined) return true;
                return Array.isArray(record[field]) ? record[field].includes(value) : record[field] === value;
            });
        }).map(record => clone(record));
    }

    timeline() {
        return this.data.events.map(event => clone(event)).sort((left, right) => {
            const calendarOrder = left.startDate.calendarId.localeCompare(right.startDate.calendarId);
            return calendarOrder || compareDateStarts(left.startDate, right.startDate) || left.name.localeCompare(right.name);
        });
    }

    concurrentEvents(id) {
        const selected = this.data.events.find(event => event.id === id);
        if (!selected) return [];
        return this.timeline().filter(event => {
            if (event.id === id) return true;
            if (selected.periodId) return event.periodId === selected.periodId;
            if (event.startDate.calendarId !== selected.startDate.calendarId) return false;
            const selectedEnd = selected.endDate || selected.startDate;
            const eventEnd = event.endDate || event.startDate;
            return compareDateRange(event.startDate, selectedEnd) <= 0 &&
                compareDateRange(selected.startDate, eventEnd) <= 0;
        });
    }

    create(type, input) {
        this.requireType(type);
        const now = new Date().toISOString();
        const record = HistoryService.validateRecord(type, {
            ...input,
            id: input && input.id ? input.id : createId(type),
            createdAt: now,
            updatedAt: now
        });
        if (this.findAny(record.id)) throw new Error(`History ID "${record.id}" already exists.`);
        this.commit({ ...clone(this.data), [type]: [...this.data[type], record] });
        return clone(record);
    }

    update(type, id, changes) {
        this.requireType(type);
        if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
            throw new Error('History changes must be an object.');
        }
        const index = this.data[type].findIndex(record => record.id === id);
        if (index < 0) throw new Error('History record not found.');
        const current = this.data[type][index];
        const updated = HistoryService.validateRecord(type, {
            ...current,
            ...changes,
            id,
            createdAt: current.createdAt,
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
        if (!record) throw new Error('History record not found.');
        if (type === 'calendars' && this.data.calendars.length === 1) {
            throw new Error('At least one calendar must remain in the project.');
        }
        const usages = this.findReferences(type, id);
        if (usages.length) throw new Error(`Cannot delete "${record.name}" while it is linked from ${usages[0]}.`);
        this.commit({ ...clone(this.data), [type]: this.data[type].filter(item => item.id !== id) });
        return clone(record);
    }

    findReferences(type, id) {
        const usages = [];
        const check = (records, label, predicate) => {
            for (const record of records) if (predicate(record)) usages.push(`${label} "${record.name}"`);
        };
        if (type === 'locations') {
            check(this.data.events, 'Event', record => record.locationId === id);
        } else if (type === 'calendars') {
            for (const group of ['eras', 'periods', 'records', 'events']) {
                check(this.data[group], LABELS[group], record =>
                    [record.startDate, record.endDate].some(date => date && date.calendarId === id));
            }
        } else if (type === 'eras') {
            check(this.data.periods, 'Period', record => record.eraId === id);
            check(this.data.records, 'Historical record', record => record.eraId === id);
            check(this.data.events, 'Event', record => record.eraId === id);
        } else if (type === 'periods') {
            check(this.data.records, 'Historical record', record => record.periodId === id);
            check(this.data.events, 'Event', record => record.periodId === id);
        }
        const targetType = type === 'locations' ? null : type;
        if (targetType) {
            for (const ownerType of ['eras', 'periods', 'records', 'events']) {
                for (const record of this.data[ownerType]) {
                    for (const field of RELATION_FIELDS) {
                        if (RELATION_TYPES[field][0] === targetType && record[field].includes(id)) {
                            usages.push(`${LABELS[ownerType]} "${record.name}"`);
                        }
                    }
                }
            }
        }
        return usages;
    }

    validateRelations() {
        const calendarIds = new Set(this.data.calendars.map(calendar => calendar.id));
        for (const type of ['eras', 'periods', 'records', 'events']) {
            for (const record of this.data[type]) {
                const dates = [record.startDate, record.endDate].filter(Boolean);
                for (const date of dates) {
                    if (!calendarIds.has(date.calendarId)) {
                        throw new Error(`Calendar ID "${date.calendarId}" in "${record.name}" does not exist.`);
                    }
                    validateCalendarDate(date, this.data.calendars.find(calendar => calendar.id === date.calendarId), type);
                }
                if (record.startDate && record.endDate &&
                    (record.startDate.calendarId !== record.endDate.calendarId ||
                        compareDateRange(record.startDate, record.endDate) > 0)) {
                    throw new Error(`Date range for "${record.name}" is invalid.`);
                }
                if (record.eraId && !this.lookup('eras', record.eraId)) {
                    throw new Error(`Era ID "${record.eraId}" in "${record.name}" does not exist.`);
                }
                if (record.periodId) {
                    const period = this.lookup('periods', record.periodId);
                    if (!period) throw new Error(`Period ID "${record.periodId}" in "${record.name}" does not exist.`);
                    if (record.eraId && period.eraId && record.eraId !== period.eraId) {
                        throw new Error(`Period "${period.name}" does not belong to era "${record.eraId}".`);
                    }
                }
                if (type === 'events' && record.locationId && !this.lookup('locations', record.locationId)) {
                    throw new Error(`Location ID "${record.locationId}" in "${record.name}" does not exist.`);
                }
                for (const field of RELATION_FIELDS) {
                    for (const targetId of record[field]) {
                        const [targetType] = RELATION_TYPES[field];
                        if ((type === targetType && targetId === record.id) || !this.lookup(targetType, targetId)) {
                            throw new Error(`${RELATION_TYPES[field][1]} ID "${targetId}" in "${record.name}" is invalid.`);
                        }
                    }
                }
            }
        }
        for (const type of ['periods', 'records', 'events']) {
            for (const record of this.data[type]) {
                if (record.startDate && record.endDate && compareDateRange(record.startDate, record.endDate) > 0) {
                    throw new Error(`Date range for "${record.name}" is invalid.`);
                }
            }
        }
    }

    findAny(id) {
        return HISTORY_TYPES.some(type => this.data[type].some(record => record.id === id)) ||
            this.externalIds().has(id);
    }

    commit(next) {
        const normalized = HistoryService.validateDatabase(next);
        const previous = this.data;
        this.data = normalized;
        try {
            this.validateRelations();
        } catch (error) {
            this.data = previous;
            throw error;
        }
    }

    requireType(type) {
        if (!HISTORY_TYPES.includes(type)) throw new Error(`Unknown history type "${type}".`);
    }
}

function requireOptionalId(value, label) {
    if (value === undefined || value === null || value === '') return null;
    if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} ID must be a non-empty string.`);
    return value.trim();
}

function normalizeTextList(value, label) {
    if (value === undefined || value === null || value === '') return [];
    const entries = Array.isArray(value) ? value : String(value).split('\n');
    if (entries.some(item => typeof item !== 'string')) throw new Error(`${label} must contain text entries.`);
    return entries.map(item => item.trim()).filter(Boolean).map(item => {
        if (item.length > 2000) throw new Error(`${label} entries must be 2000 characters or fewer.`);
        return item;
    });
}

export { DATE_PRECISIONS, LABELS };
