export function filterAssetLibraryAssets(assets, { category = '', query = '' } = {}) {
    if (!Array.isArray(assets)) throw new Error('Asset Library entries must be an array.');
    const normalizedCategory = typeof category === 'string' ? category.trim() : '';
    const normalizedQuery = typeof query === 'string' ? query.trim().toLocaleLowerCase() : '';
    return assets.filter(asset => {
        if (!asset || typeof asset !== 'object' || asset.enabled === false) return false;
        if (normalizedCategory && asset.category !== normalizedCategory) return false;
        if (!normalizedQuery) return true;
        const searchable = [
            asset.name, asset.id, asset.packName, asset.description,
            ...(Array.isArray(asset.tags) ? asset.tags : [])
        ].filter(value => typeof value === 'string').join(' ').toLocaleLowerCase();
        return searchable.includes(normalizedQuery);
    });
}

export function listAssetLibraryCategories(assets) {
    if (!Array.isArray(assets)) throw new Error('Asset Library entries must be an array.');
    return [...new Set(assets
        .filter(asset => asset && typeof asset === 'object' && asset.enabled !== false)
        .map(asset => asset.category)
        .filter(category => typeof category === 'string' && category.trim()))].sort((a, b) => a.localeCompare(b));
}
