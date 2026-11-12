export const ASSET_CAPABILITIES = Object.freeze([
    'stamp',
    'icon',
    'scatter',
    'texture-fill',
    'pattern-stroke',
    'decoration'
]);

const KNOWN_CAPABILITIES = new Set(ASSET_CAPABILITIES);
const LEGACY_GENERIC_CAPABILITIES = Object.freeze(['stamp', 'decoration']);

export function normalizeAssetQuery(query = {}) {
    if (!query || typeof query !== 'object' || Array.isArray(query)) {
        throw new Error('Asset query must be an object.');
    }
    const requiredCapabilities = query.requiredCapabilities ?? [];
    const anyCapabilities = query.anyCapabilities ?? [];
    const categories = query.categories ?? [];
    const tags = query.tags ?? [];
    const acceptedTypes = query.acceptedTypes ?? ['image'];
    for (const [label, value] of [
        ['requiredCapabilities', requiredCapabilities],
        ['anyCapabilities', anyCapabilities],
        ['categories', categories],
        ['tags', tags],
        ['acceptedTypes', acceptedTypes]
    ]) {
        if (!Array.isArray(value) || value.some(item => typeof item !== 'string' || !item.trim())) {
            throw new Error(`Asset query ${label} must be an array of non-empty strings.`);
        }
    }
    if ([...requiredCapabilities, ...anyCapabilities].some(capability => !KNOWN_CAPABILITIES.has(capability))) {
        throw new Error('Asset query contains an unsupported capability.');
    }
    return {
        requiredCapabilities: [...new Set(requiredCapabilities)],
        anyCapabilities: [...new Set(anyCapabilities)],
        categories: [...new Set(categories)],
        tags: [...new Set(tags.map(tag => tag.toLocaleLowerCase()))],
        acceptedTypes: [...new Set(acceptedTypes)]
    };
}

export function getAssetCapabilities(asset, { allowLegacyGeneric = false } = {}) {
    if (!asset || typeof asset !== 'object') return [];
    if (asset.usages === undefined) {
        return allowLegacyGeneric ? [...LEGACY_GENERIC_CAPABILITIES] : [];
    }
    if (!Array.isArray(asset.usages)) return [];
    return [...new Set(asset.usages.filter(value => typeof value === 'string' && KNOWN_CAPABILITIES.has(value)))];
}

export function assetMatchesQuery(asset, query, options = {}) {
    const normalized = normalizeAssetQuery(query);
    if (!asset || typeof asset !== 'object' || asset.enabled === false) return false;
    if (normalized.acceptedTypes.length && !normalized.acceptedTypes.includes(asset.type)) return false;
    if (normalized.categories.length && !normalized.categories.includes(asset.category)) return false;
    const ownTags = Array.isArray(asset.tags) ? asset.tags.map(tag => String(tag).toLocaleLowerCase()) : [];
    if (!normalized.tags.every(tag => ownTags.includes(tag))) return false;
    const capabilities = getAssetCapabilities(asset, options);
    return normalized.requiredCapabilities.every(capability => capabilities.includes(capability)) &&
        (!normalized.anyCapabilities.length || normalized.anyCapabilities.some(capability => capabilities.includes(capability)));
}

export class ToolAssetBinding {
    constructor({ registry, toolId, query, allowLegacyGeneric = false } = {}) {
        if (!registry || typeof registry.listAssets !== 'function' ||
            typeof registry.getAsset !== 'function' || typeof toolId !== 'string' || !toolId.trim()) {
            throw new Error('ToolAssetBinding requires an AssetRegistry and tool ID.');
        }
        this.registry = registry;
        this.toolId = toolId;
        this.query = normalizeAssetQuery(query);
        this.allowLegacyGeneric = Boolean(allowLegacyGeneric);
    }

    listAssets({ packId = null, query = '' } = {}) {
        const search = typeof query === 'string' ? query.trim().toLocaleLowerCase() : '';
        return this.registry.listAssets({ packId }).filter(asset => {
            if (!assetMatchesQuery(asset, this.query, { allowLegacyGeneric: this.allowLegacyGeneric })) return false;
            if (!search) return true;
            const haystack = [asset.name, asset.id, asset.packName, ...(asset.tags || [])]
                .join(' ').toLocaleLowerCase();
            return haystack.includes(search);
        });
    }

    resolveAssetRef(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value) ||
            typeof value.packId !== 'string' || !value.packId.trim() ||
            typeof value.assetId !== 'string' || !value.assetId.trim()) {
            throw new Error(`Tool "${this.toolId}" requires a valid asset reference.`);
        }
        const asset = this.registry.getAsset(value.packId.trim(), value.assetId.trim());
        if (!asset) throw new Error('Selected asset is missing or its Pack is disabled.');
        if (value.packVersion !== undefined && value.packVersion !== asset.packVersion) {
            throw new Error('Selected asset Pack version does not match the installed Pack.');
        }
        if (!assetMatchesQuery(asset, this.query, { allowLegacyGeneric: this.allowLegacyGeneric })) {
            throw new Error(`Asset is not compatible with tool "${this.toolId}".`);
        }
        return {
            asset,
            assetRef: {
                packId: asset.packId,
                assetId: asset.id,
                packVersion: asset.packVersion
            }
        };
    }
}
