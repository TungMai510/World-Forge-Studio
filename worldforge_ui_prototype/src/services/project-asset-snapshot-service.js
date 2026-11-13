const MAX_SNAPSHOT_BYTES = 20 * 1024 * 1024;
const SNAPSHOT_SCHEMA_VERSION = 1;

function toBase64(bytes) {
    let binary = '';
    const chunkSize = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
    }
    return btoa(binary);
}

function snapshotKey(ref) {
    return `${ref.packId}::${ref.packVersion || 'latest'}::${ref.assetId}`;
}

function collectAssetRefs(value, refs = new Map()) {
    if (!value || typeof value !== 'object') return refs;
    if (Array.isArray(value)) {
        for (const item of value) collectAssetRefs(item, refs);
        return refs;
    }
    for (const [key, nested] of Object.entries(value)) {
        if (key === 'assetRef' || key === 'patternAssetRef' || key === 'textureAssetRef') {
            if (nested && typeof nested.packId === 'string' && typeof nested.assetId === 'string') {
                const ref = {
                    packId: nested.packId,
                    assetId: nested.assetId,
                    ...(typeof nested.packVersion === 'string' ? { packVersion: nested.packVersion } : {})
                };
                refs.set(snapshotKey(ref), ref);
            }
        } else if (nested && typeof nested === 'object') collectAssetRefs(nested, refs);
    }
    return refs;
}

async function sha256(bytes) {
    if (!globalThis.crypto?.subtle) throw new Error('SHA-256 is unavailable in this browser context.');
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function captureProjectAssetSnapshots(data, registry, existingSnapshots = []) {
    if (!registry || typeof registry.getAssetFile !== 'function') {
        throw new Error('Asset snapshot capture requires an AssetRegistry.');
    }
    const refs = collectAssetRefs(data?.map || {});
    const previous = new Map((Array.isArray(existingSnapshots) ? existingSnapshots : [])
        .filter(item => item && typeof item.key === 'string').map(item => [item.key, item]));
    const snapshots = [];
    let totalBytes = 0;
    for (const [key, ref] of refs) {
        const pack = registry.getPack(ref.packId);
        const asset = registry.getAsset(ref.packId, ref.assetId, { includeDisabled: true });
        const existing = previous.get(key);
        if (!pack || !asset) {
            if (existing) {
                snapshots.push(existing);
                totalBytes += Math.ceil((existing.data || '').length * 3 / 4);
                continue;
            }
            throw new Error(`Cannot preserve "${key}": its Pack is unavailable and no embedded snapshot exists. Re-enable or re-import the Pack before saving.`);
        }
        if (ref.packVersion && ref.packVersion !== pack.manifest.version) {
            if (existing) {
                snapshots.push(existing);
                totalBytes += Math.ceil((existing.data || '').length * 3 / 4);
                continue;
            }
            throw new Error(`Asset "${key}" requires Pack version "${ref.packVersion}", but version "${pack.manifest.version}" is installed.`);
        }
        const bytes = registry.getAssetFile(ref.packId, ref.assetId);
        if (!bytes) throw new Error(`Asset file for "${key}" is unavailable.`);
        const mimeType = asset.mimeType || ({ png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' })[asset.file.split('.').pop().toLowerCase()];
        if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(mimeType)) {
            throw new Error(`Asset "${key}" has an unsupported snapshot MIME type.`);
        }
        totalBytes += bytes.length;
        if (totalBytes > MAX_SNAPSHOT_BYTES) throw new Error('Project asset snapshots exceed the 20 MB limit.');
        snapshots.push({
            schemaVersion: SNAPSHOT_SCHEMA_VERSION,
            key,
            packId: ref.packId,
            packVersion: pack.manifest.version,
            assetId: ref.assetId,
            name: asset.name,
            mimeType,
            size: bytes.length,
            sha256: await sha256(bytes),
            data: toBase64(bytes)
        });
    }
    return snapshots;
}
