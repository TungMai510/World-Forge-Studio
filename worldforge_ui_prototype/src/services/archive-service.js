const UTF8 = new TextEncoder();
const UTF8_DECODER = new TextDecoder();

function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) {
        crc ^= byte;
        for (let bit = 0; bit < 8; bit += 1) {
            crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
        }
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function write16(view, offset, value) {
    view.setUint16(offset, value, true);
}

function write32(view, offset, value) {
    view.setUint32(offset, value, true);
}

function concatBytes(chunks) {
    const result = new Uint8Array(chunks.reduce((size, chunk) => size + chunk.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }
    return result;
}

function read16(view, offset) {
    return view.getUint16(offset, true);
}

function read32(view, offset) {
    return view.getUint32(offset, true);
}

function decodeName(bytes) {
    return UTF8_DECODER.decode(bytes);
}

export function createZipArchive(files) {
    const chunks = [];
    const entries = [];
    let offset = 0;
    for (const [name, content] of Object.entries(files)) {
        const nameBytes = UTF8.encode(name);
        const data = typeof content === 'string' ? UTF8.encode(content) : content;
        const checksum = crc32(data);
        const local = new Uint8Array(30 + nameBytes.length);
        const localView = new DataView(local.buffer);
        write32(localView, 0, 0x04034b50);
        write16(localView, 4, 20);
        write16(localView, 6, 0x0800);
        write16(localView, 8, 0);
        write32(localView, 14, checksum);
        write32(localView, 18, data.length);
        write32(localView, 22, data.length);
        write16(localView, 26, nameBytes.length);
        local.set(nameBytes, 30);
        chunks.push(local, data);
        entries.push({ nameBytes, checksum, size: data.length, offset });
        offset += local.length + data.length;
    }

    const centralChunks = [];
    let centralSize = 0;
    for (const entry of entries) {
        const central = new Uint8Array(46 + entry.nameBytes.length);
        const view = new DataView(central.buffer);
        write32(view, 0, 0x02014b50);
        write16(view, 4, 20);
        write16(view, 6, 20);
        write16(view, 8, 0x0800);
        write16(view, 10, 0);
        write32(view, 16, entry.checksum);
        write32(view, 20, entry.size);
        write32(view, 24, entry.size);
        write16(view, 28, entry.nameBytes.length);
        write32(view, 42, entry.offset);
        central.set(entry.nameBytes, 46);
        centralChunks.push(central);
        centralSize += central.length;
    }
    const end = new Uint8Array(22);
    const endView = new DataView(end.buffer);
    write32(endView, 0, 0x06054b50);
    write16(endView, 8, entries.length);
    write16(endView, 10, entries.length);
    write32(endView, 12, centralSize);
    write32(endView, 16, offset);
    return concatBytes([...chunks, ...centralChunks, end]);
}

export function readZipArchive(bytes, { maxEntries = 10000, maxUncompressedSize = 100 * 1024 * 1024 } = {}) {
    if (!(bytes instanceof Uint8Array) || bytes.length < 22) throw new Error('Project package is not a valid ZIP archive.');
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let endOffset = -1;
    const earliest = Math.max(0, bytes.length - 65557);
    for (let index = bytes.length - 22; index >= earliest; index -= 1) {
        if (read32(view, index) === 0x06054b50) {
            endOffset = index;
            break;
        }
    }
    if (endOffset < 0) throw new Error('Project package is missing its ZIP directory.');
    const entryCount = read16(view, endOffset + 10);
    const centralSize = read32(view, endOffset + 12);
    const centralOffset = read32(view, endOffset + 16);
    if (entryCount > maxEntries || centralOffset + centralSize > endOffset) {
        throw new Error('Project package directory is invalid or too large.');
    }
    const files = new Map();
    let cursor = centralOffset;
    let totalSize = 0;
    for (let index = 0; index < entryCount; index += 1) {
        if (cursor + 46 > bytes.length || read32(view, cursor) !== 0x02014b50) {
            throw new Error('Project package contains a malformed ZIP entry.');
        }
        const flags = read16(view, cursor + 8);
        const method = read16(view, cursor + 10);
        const checksum = read32(view, cursor + 16);
        const compressedSize = read32(view, cursor + 20);
        const size = read32(view, cursor + 24);
        const nameLength = read16(view, cursor + 28);
        const extraLength = read16(view, cursor + 30);
        const commentLength = read16(view, cursor + 32);
        const localOffset = read32(view, cursor + 42);
        const entryEnd = cursor + 46 + nameLength + extraLength + commentLength;
        if (entryEnd > bytes.length || (flags & 1) || method !== 0 || compressedSize !== size) {
            throw new Error('Unsupported or encrypted compression in project package.');
        }
        const name = decodeName(bytes.subarray(cursor + 46, cursor + 46 + nameLength));
        if (!name || name.startsWith('/') || name.split('/').includes('..') || files.has(name)) {
            throw new Error('Project package contains an invalid or duplicate path.');
        }
        totalSize += size;
        if (totalSize > maxUncompressedSize) throw new Error('Project package expands beyond the import limit.');
        if (localOffset + 30 > bytes.length || read32(view, localOffset) !== 0x04034b50) {
            throw new Error(`Project package entry "${name}" has no valid local header.`);
        }
        const localNameLength = read16(view, localOffset + 26);
        const localExtraLength = read16(view, localOffset + 28);
        const localFlags = read16(view, localOffset + 6);
        const localMethod = read16(view, localOffset + 8);
        const localNameStart = localOffset + 30;
        const localNameEnd = localNameStart + localNameLength;
        if (localNameEnd > bytes.length || localFlags !== flags || localMethod !== method ||
            decodeName(bytes.subarray(localNameStart, localNameEnd)) !== name) {
            throw new Error(`Project package entry "${name}" has inconsistent ZIP headers.`);
        }
        const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
        const dataEnd = dataOffset + size;
        if (dataEnd > bytes.length) throw new Error(`Project package entry "${name}" is truncated.`);
        const data = bytes.slice(dataOffset, dataEnd);
        if (crc32(data) !== checksum) throw new Error(`Project package entry "${name}" failed its checksum.`);
        files.set(name, data);
        cursor = entryEnd;
    }
    return files;
}

export function encodeDataUrlAsset(dataUrl) {
    const match = /^data:(image\/(?:png|jpeg|webp|gif|svg\+xml));base64,([A-Za-z0-9+/=]+)$/i.exec(dataUrl);
    if (!match) return null;
    const binary = atob(match[2]);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    const extension = {
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/webp': 'webp',
        'image/gif': 'gif',
        'image/svg+xml': 'svg'
    }[match[1].toLowerCase()];
    return { bytes, extension };
}

export function decodeAssetDataUrl(bytes, mimeType) {
    let binary = '';
    const step = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += step) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + step));
    }
    return `data:${mimeType};base64,${btoa(binary)}`;
}
