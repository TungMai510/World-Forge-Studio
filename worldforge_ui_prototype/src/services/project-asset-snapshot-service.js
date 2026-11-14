const MAX_SNAPSHOT_BYTES = 20 * 1024 * 1024;
const SNAPSHOT_SCHEMA_VERSION = 1;
const MAX_IMAGE_DIMENSION = 8192;
const MAX_IMAGE_PIXELS = 64 * 1024 * 1024;

export function decodeBase64Bytes(value) {
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

function toBase64(bytes) {
    let binary = '';
    const chunkSize = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
    }
    return btoa(binary);
}

function readUint32BE(bytes, offset) {
    return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) |
        (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
}

function readUint16LE(bytes, offset) {
    return bytes[offset] | (bytes[offset + 1] << 8);
}

function readUint32LE(bytes, offset) {
    return (bytes[offset] | (bytes[offset + 1] << 8) |
        (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
}

function validateDimensions(width, height, context) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 ||
        width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION || width * height > MAX_IMAGE_PIXELS) {
        throw new Error(`${context} has invalid or oversized image dimensions.`);
    }
}

export function validateImageBytes(bytes, mimeType, context = 'Project snapshot') {
    if (!(bytes instanceof Uint8Array)) throw new Error(`${context} data is invalid.`);
    if (mimeType === 'image/png') {
        const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
        if (bytes.length < 33 || !signature.every((value, index) => bytes[index] === value)) {
            throw new Error(`${context} failed its PNG signature or structure check.`);
        }
        let offset = 8;
        let hasHeader = false;
        let hasData = false;
        let hasEnd = false;
        while (offset + 12 <= bytes.length) {
            const length = readUint32BE(bytes, offset);
            const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
            const end = offset + 12 + length;
            if (end > bytes.length) throw new Error(`${context} contains a truncated PNG chunk.`);
            if (type === 'IHDR') {
                if (hasHeader || length !== 13) throw new Error(`${context} contains an invalid PNG header.`);
                validateDimensions(readUint32BE(bytes, offset + 8), readUint32BE(bytes, offset + 12), context);
                hasHeader = true;
            } else if (type === 'IDAT' && length > 0) {
                hasData = true;
            } else if (type === 'IEND') {
                if (length !== 0 || end !== bytes.length) throw new Error(`${context} contains an invalid PNG end chunk.`);
                hasEnd = true;
                break;
            }
            offset = end;
        }
        if (!hasHeader || !hasData || !hasEnd) throw new Error(`${context} is not a complete PNG image.`);
        return true;
    }
    if (mimeType === 'image/gif') {
        if (bytes.length < 14 || !['GIF87a', 'GIF89a'].includes(String.fromCharCode(...bytes.subarray(0, 6))) || bytes[bytes.length - 1] !== 0x3b) {
            throw new Error(`${context} failed its GIF structure check.`);
        }
        validateDimensions(bytes[6] | (bytes[7] << 8), bytes[8] | (bytes[9] << 8), context);
        return true;
    }
    if (mimeType === 'image/jpeg') {
        if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[bytes.length - 2] !== 0xff || bytes[bytes.length - 1] !== 0xd9) {
            throw new Error(`${context} failed its JPEG structure check.`);
        }
        for (let offset = 2; offset + 9 < bytes.length;) {
            if (bytes[offset] !== 0xff) { offset += 1; continue; }
            const marker = bytes[offset + 1];
            if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
                const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
                if (length >= 7 && offset + 8 < bytes.length) {
                    validateDimensions((bytes[offset + 7] << 8) | bytes[offset + 8], (bytes[offset + 5] << 8) | bytes[offset + 6], context);
                    return true;
                }
            }
            if (marker === 0xd8 || marker === 0xd9) offset += 2;
            else if (offset + 3 < bytes.length) offset += 2 + ((bytes[offset + 2] << 8) | bytes[offset + 3]);
            else break;
        }
        throw new Error(`${context} does not contain a valid JPEG frame.`);
    }
    if (mimeType === 'image/webp') {
        if (bytes.length < 16 || String.fromCharCode(...bytes.subarray(0, 4)) !== 'RIFF' || String.fromCharCode(...bytes.subarray(8, 12)) !== 'WEBP') {
            throw new Error(`${context} failed its WebP structure check.`);
        }
        const chunk = String.fromCharCode(...bytes.subarray(12, 16));
        const chunkSize = readUint32LE(bytes, 16);
        const dataOffset = 20;
        if (chunkSize > bytes.length - dataOffset) throw new Error(`${context} contains a truncated WebP chunk.`);
        if (chunk === 'VP8X' && chunkSize >= 10) {
            const width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
            const height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
            validateDimensions(width, height, context);
        } else if (chunk === 'VP8 ' && chunkSize >= 10) {
            if (bytes[dataOffset + 3] !== 0x9d || bytes[dataOffset + 4] !== 0x01 || bytes[dataOffset + 5] !== 0x2a) {
                throw new Error(`${context} does not contain a valid VP8 frame.`);
            }
            validateDimensions(
                readUint16LE(bytes, dataOffset + 6) & 0x3fff,
                readUint16LE(bytes, dataOffset + 8) & 0x3fff,
                context
            );
        } else if (chunk === 'VP8L' && chunkSize >= 5) {
            if (bytes[dataOffset] !== 0x2f) throw new Error(`${context} does not contain a valid VP8L frame.`);
            const width = 1 + ((bytes[dataOffset + 1] | (bytes[dataOffset + 2] << 8)) & 0x3fff);
            const height = 1 + ((bytes[dataOffset + 2] >> 6) | (bytes[dataOffset + 3] << 2) | ((bytes[dataOffset + 4] & 0x0f) << 10));
            validateDimensions(width, height, context);
        } else {
            throw new Error(`${context} does not contain a valid WebP frame.`);
        }
        return true;
    }
    throw new Error(`${context} has an unsupported MIME type.`);
}

export function verifySnapshotIntegrity(snapshot, context = 'Project snapshot') {
    const bytes = decodeBase64Bytes(snapshot?.data);
    if (!snapshot || !['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(snapshot.mimeType) ||
        !Number.isInteger(snapshot.size) || snapshot.size !== bytes.length || bytes.length > MAX_SNAPSHOT_BYTES ||
        typeof snapshot.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(snapshot.sha256) || sha256Fallback(bytes) !== snapshot.sha256) {
        throw new Error(`${context} failed its metadata or SHA-256 integrity check.`);
    }
    validateImageBytes(bytes, snapshot.mimeType, context);
    return bytes;
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

const SHA256_K = new Uint32Array([
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
]);

export function sha256Fallback(input) {
    const source = input instanceof Uint8Array ? input : new Uint8Array(input);
    const bitLength = source.length * 8;
    const paddedLength = Math.ceil((source.length + 9) / 64) * 64;
    const data = new Uint8Array(paddedLength);
    data.set(source);
    data[source.length] = 0x80;
    const view = new DataView(data.buffer);
    const high = Math.floor(bitLength / 0x100000000);
    view.setUint32(paddedLength - 8, high);
    view.setUint32(paddedLength - 4, bitLength >>> 0);

    const h = new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]);
    const w = new Uint32Array(64);
    const rotr = (x,n) => (x >>> n) | (x << (32-n));
    for (let offset=0; offset<paddedLength; offset+=64) {
        for(let i=0;i<16;i++) w[i]=view.getUint32(offset+i*4);
        for(let i=16;i<64;i++) {
            const x=w[i-15], y=w[i-2];
            const s0=rotr(x,7)^rotr(x,18)^(x>>>3);
            const s1=rotr(y,17)^rotr(y,19)^(y>>>10);
            w[i]=(w[i-16]+s0+w[i-7]+s1)>>>0;
        }
        let [a,b,c,d,e,f,g,hh]=h;
        for(let i=0;i<64;i++) {
            const s1=rotr(e,6)^rotr(e,11)^rotr(e,25);
            const ch=(e&f)^(~e&g);
            const t1=(hh+s1+ch+SHA256_K[i]+w[i])>>>0;
            const s0=rotr(a,2)^rotr(a,13)^rotr(a,22);
            const maj=(a&b)^(a&c)^(b&c);
            const t2=(s0+maj)>>>0;
            hh=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;
        }
        h[0]=(h[0]+a)>>>0;h[1]=(h[1]+b)>>>0;h[2]=(h[2]+c)>>>0;h[3]=(h[3]+d)>>>0;
        h[4]=(h[4]+e)>>>0;h[5]=(h[5]+f)>>>0;h[6]=(h[6]+g)>>>0;h[7]=(h[7]+hh)>>>0;
    }
    return [...h].map(value=>value.toString(16).padStart(8,'0')).join('');
}

async function sha256(bytes) {
    if (globalThis.crypto?.subtle) {
        const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
        return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
    }
    // Web Crypto is unavailable on non-secure origins such as a LAN HTTP address.
    return sha256Fallback(bytes);
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
