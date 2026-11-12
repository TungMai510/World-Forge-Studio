const PACK_SCHEMA_VERSION = '1.0';
const MAX_MANIFEST_BYTES = 1024 * 1024;
const MAX_PACK_BYTES = 100 * 1024 * 1024;
const MAX_PACK_ENTRIES = 2000;
const MAX_ASSET_BYTES = 15 * 1024 * 1024;
const PACK_ID_PATTERN = /^[a-z0-9]+(?:[.-][a-z0-9]+)*(?:\.[a-z0-9]+(?:[.-][a-z0-9]+)*)+$/;
const ASSET_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const IMAGE_TYPES = {
    png: { mime: 'image/png', matches: b => b.length >= 8 && [137,80,78,71,13,10,26,10].every((v,i) => b[i] === v) },
    jpg: { mime: 'image/jpeg', matches: b => b.length >= 3 && b[0] === 255 && b[1] === 216 && b[2] === 255 },
    jpeg: { mime: 'image/jpeg', matches: b => b.length >= 3 && b[0] === 255 && b[1] === 216 && b[2] === 255 },
    webp: { mime: 'image/webp', matches: b => b.length >= 12 && String.fromCharCode(...b.subarray(0,4)) === 'RIFF' && String.fromCharCode(...b.subarray(8,12)) === 'WEBP' },
    gif: { mime: 'image/gif', matches: b => b.length >= 6 && ['GIF87a','GIF89a'].includes(String.fromCharCode(...b.subarray(0,6))) }
};
function isObject(value) { return Boolean(value) && typeof value === 'object' && !Array.isArray(value); }
function safePath(path, label) {
    if (typeof path !== 'string' || !path || path.length > 240 || path.startsWith('/') ||
        path.includes('\\') || /^[a-zA-Z]:/.test(path) ||
        path.split('/').some(part => !part || part === '.' || part === '..') ||
        /[\u0000-\u001f\u007f]/.test(path)) {
        throw new Error(`${label} must be a safe relative path inside the Asset Pack.`);
    }
    return path;
}
function validateVersion(value, label) {
    if (typeof value !== 'string' || !SEMVER_PATTERN.test(value)) throw new Error(`${label} must use Semantic Versioning.`);
}
function compareVersions(a, b) {
    const left = a.split(/[+-]/,1)[0].split('.').map(Number);
    const right = b.split(/[+-]/,1)[0].split('.').map(Number);
    for (let i=0;i<3;i++) if (left[i] !== right[i]) return left[i]-right[i];
    return 0;
}
export function validateAssetPackManifest(manifest, { worldForgeVersion='1.0.0', files=null }={}) {
    if (!isObject(manifest)) throw new Error('Asset Pack manifest must be a JSON object.');
    if (manifest.schemaVersion !== PACK_SCHEMA_VERSION) throw new Error(`Unsupported Asset Pack schema version "${manifest.schemaVersion}".`);
    if (typeof manifest.id !== 'string' || !PACK_ID_PATTERN.test(manifest.id)) throw new Error('Pack id must be a unique reverse-domain identifier, e.g. com.author.pack-name.');
    if (typeof manifest.name !== 'string' || !manifest.name.trim() || manifest.name.length > 100) throw new Error('Pack name must contain 1–100 characters.');
    validateVersion(manifest.version,'Pack version');
    if (typeof manifest.author !== 'string' || !manifest.author.trim() || manifest.author.length > 100) throw new Error('Pack author must contain 1–100 characters.');
    if (typeof manifest.description !== 'string' || manifest.description.length > 1000) throw new Error('Pack description must be no more than 1000 characters.');
    if (typeof manifest.license !== 'string' || !manifest.license.trim() || manifest.license.length > 100) throw new Error('Pack license is required (maximum 100 characters).');
    if (!isObject(manifest.compatibility)) throw new Error('Pack compatibility metadata is required.');
    validateVersion(manifest.compatibility.minWorldForgeVersion,'Minimum WorldForge version');
    if (compareVersions(worldForgeVersion,manifest.compatibility.minWorldForgeVersion)<0) throw new Error(`This Pack requires WorldForge ${manifest.compatibility.minWorldForgeVersion} or newer.`);
    if (!Array.isArray(manifest.categories) || manifest.categories.length>100) throw new Error('Pack categories must be an array of at most 100 entries.');
    const categories=new Set();
    for (const category of manifest.categories) {
        if (typeof category!=='string' || !/^[a-z0-9][a-z0-9-]{0,39}$/.test(category) || categories.has(category)) throw new Error('Pack categories must be unique lowercase slugs.');
        categories.add(category);
    }
    if (!Array.isArray(manifest.assets) || manifest.assets.length>MAX_PACK_ENTRIES-1) throw new Error('Pack assets exceed the entry limit.');
    const ids=new Set();
    const referencedFiles=new Set();
    for (const asset of manifest.assets) {
        if (!isObject(asset)) throw new Error('Each Pack asset must be an object.');
        if (typeof asset.id!=='string' || !ASSET_ID_PATTERN.test(asset.id) || ids.has(asset.id)) throw new Error('Asset IDs must be unique within a Pack.');
        ids.add(asset.id);
        if (typeof asset.name!=='string' || !asset.name.trim() || asset.name.length>120) throw new Error(`Asset "${asset.id}" has an invalid name.`);
        if (typeof asset.category!=='string' || !categories.has(asset.category)) throw new Error(`Asset "${asset.id}" references an undeclared category.`);
        if (asset.type!=='image') throw new Error(`Asset "${asset.id}" has an unsupported type; Phase 1 supports images only.`);
        safePath(asset.file,`Asset "${asset.id}" file`);
        if (!asset.file.startsWith('assets/')) throw new Error('Asset files must be inside assets/.');
        if (referencedFiles.has(asset.file)) throw new Error('Each asset must reference a distinct file path.');
        referencedFiles.add(asset.file);
        const ext=asset.file.split('.').pop().toLowerCase();
        if (!IMAGE_TYPES[ext]) throw new Error(`Asset "${asset.id}" has an unsupported image format.`);
        if (asset.thumbnail) {
            safePath(asset.thumbnail,`Asset "${asset.id}" thumbnail`);
            if (!asset.thumbnail.startsWith('thumbnails/')) throw new Error('Thumbnails must be inside thumbnails/.');
            if (!IMAGE_TYPES[asset.thumbnail.split('.').pop().toLowerCase()]) throw new Error('Thumbnail format must be PNG, JPEG, WebP or GIF.');
        }
        if (asset.tags!==undefined && (!Array.isArray(asset.tags) || asset.tags.length>30 || asset.tags.some(tag=>typeof tag!=='string'||tag.length>40))) throw new Error(`Asset "${asset.id}" has invalid tags.`);
        if (asset.usages!==undefined && (!Array.isArray(asset.usages) || asset.usages.length>20 ||
            asset.usages.some(usage=>typeof usage!=='string'||!usage.trim()||usage.length>40) ||
            new Set(asset.usages).size!==asset.usages.length)) {
            throw new Error(`Asset "${asset.id}" has invalid usages; expected up to 20 unique non-empty strings.`);
        }
        if (asset.defaultSize!==undefined && (!isObject(asset.defaultSize) || !Number.isFinite(asset.defaultSize.width) || asset.defaultSize.width<=0 || asset.defaultSize.width>8192 || !Number.isFinite(asset.defaultSize.height) || asset.defaultSize.height<=0 || asset.defaultSize.height>8192)) throw new Error(`Asset "${asset.id}" has invalid default dimensions.`);
    }
    if (files) {
        if (!(files instanceof Map) || files.size>MAX_PACK_ENTRIES) throw new Error('Asset Pack file table is invalid or too large.');
        let total=0;
        for (const [path,bytes] of files) {
            safePath(path,'Pack entry path');
            if (path !== 'pack.json' && path !== 'preview.png' && path !== 'LICENSE.txt' &&
                !path.startsWith('assets/') && !path.startsWith('thumbnails/')) {
                throw new Error(`Unsupported Pack entry "${path}". Only manifest, image, preview and license files are allowed.`);
            }
            if (!(bytes instanceof Uint8Array)) throw new Error(`Pack entry "${path}" is not binary data.`);
            total+=bytes.byteLength;
            if (total>MAX_PACK_BYTES) throw new Error('Asset Pack expands beyond 100 MB.');
        }
        if (!files.has('pack.json')) throw new Error('Asset Pack is missing pack.json.');
        for (const asset of manifest.assets) {
            const bytes=files.get(asset.file);
            const ext=asset.file.split('.').pop().toLowerCase();
            if (!bytes || !bytes.length || bytes.length>MAX_ASSET_BYTES) throw new Error(`Asset file "${asset.file}" is missing, empty or exceeds 15 MB.`);
            if (!IMAGE_TYPES[ext].matches(bytes)) throw new Error(`Asset file "${asset.file}" does not match its image extension.`);
            if (asset.mimeType!==undefined && asset.mimeType!==IMAGE_TYPES[ext].mime) throw new Error(`Asset "${asset.id}" MIME type does not match its extension.`);
            if (asset.thumbnail) {
                const thumb=files.get(asset.thumbnail);
                const thumbExt=asset.thumbnail.split('.').pop().toLowerCase();
                if (!thumb || !thumb.length || thumb.length>MAX_ASSET_BYTES || !IMAGE_TYPES[thumbExt].matches(thumb)) throw new Error(`Thumbnail "${asset.thumbnail}" is missing, oversized or has an invalid image signature.`);
            }
        }
    }
    return {...manifest,name:manifest.name.trim(),author:manifest.author.trim(),description:manifest.description.trim(),license:manifest.license.trim(),categories:[...manifest.categories],assets:manifest.assets.map(asset=>({...asset,name:asset.name.trim(),tags:Array.isArray(asset.tags)?[...asset.tags]:[],...(asset.usages===undefined?{}:{usages:[...asset.usages]})}))};
}
export const ASSET_PACK_LIMITS=Object.freeze({manifestBytes:MAX_MANIFEST_BYTES,packBytes:MAX_PACK_BYTES,entries:MAX_PACK_ENTRIES,assetBytes:MAX_ASSET_BYTES});
export {MAX_MANIFEST_BYTES};
