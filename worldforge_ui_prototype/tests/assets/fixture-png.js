import { deflateSync } from 'node:zlib';

function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) {
        crc ^= byte;
        for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data = Buffer.alloc(0)) {
    const typeBytes = Buffer.from(type, 'ascii');
    const output = Buffer.alloc(12 + data.length);
    output.writeUInt32BE(data.length, 0);
    typeBytes.copy(output, 4);
    data.copy(output, 8);
    output.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 8 + data.length);
    return output;
}

export function createFixturePng(width, height, style = 'mountain') {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 8 || height < 8) {
        throw new Error('Fixture PNG dimensions must be integers of at least 8 pixels.');
    }
    const stride = width * 4 + 1;
    const raw = Buffer.alloc(stride * height);
    for (let y = 0; y < height; y += 1) {
        const row = y * stride;
        raw[row] = 0;
        for (let x = 0; x < width; x += 1) {
            const offset = row + 1 + x * 4;
            let color;
            if (style === 'forest') {
                color = [205, 224, 190, 255];
                const treeCenters = [width * 0.25, width * 0.5, width * 0.75];
                const tree = treeCenters.some(center => {
                    const localY = y - height * 0.2;
                    const halfWidth = Math.max(0, localY * 0.52);
                    return localY >= 0 && localY <= height * 0.55 && Math.abs(x - center) <= halfWidth;
                });
                const trunk = treeCenters.some(center => Math.abs(x - center) <= width * 0.035 &&
                    y >= height * 0.68 && y <= height * 0.9);
                if (tree) color = [48, 105, 66, 255];
                if (trunk) color = [105, 76, 48, 255];
            } else {
                color = [190, 218, 232, 255];
                const relativeY = y - height * 0.16;
                const mountain = relativeY >= 0 && relativeY <= height * 0.78 &&
                    Math.abs(x - width * 0.5) <= relativeY * 0.78;
                if (mountain) color = [111, 105, 96, 255];
                const snow = mountain && y < height * 0.42 &&
                    Math.abs(x - width * 0.5) <= Math.max(1, (y - height * 0.16) * 0.45);
                if (snow) color = [247, 246, 235, 255];
            }
            raw[offset] = color[0];
            raw[offset + 1] = color[1];
            raw[offset + 2] = color[2];
            raw[offset + 3] = color[3];
        }
    }
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8;
    ihdr[9] = 6;
    ihdr[10] = 0;
    ihdr[11] = 0;
    ihdr[12] = 0;
    return new Uint8Array(Buffer.concat([
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        pngChunk('IHDR', ihdr),
        pngChunk('IDAT', deflateSync(raw)),
        pngChunk('IEND')
    ]));
}
