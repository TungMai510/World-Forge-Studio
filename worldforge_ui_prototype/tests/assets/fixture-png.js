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
            if (style === 'icon') {
                const cx = width / 2;
                const cy = height / 2;
                const radius = Math.min(width, height) * 0.44;
                const dx = x - cx;
                const dy = y - cy;
                const insideBadge = dx * dx + dy * dy <= radius * radius;
                color = insideBadge ? [43, 54, 76, 255] : [0, 0, 0, 0];
                const left = width * 0.27;
                const right = width * 0.73;
                const base = height * 0.72;
                const wallTop = height * 0.43;
                const towerLeft = width * 0.39;
                const towerRight = width * 0.61;
                const towerTop = height * 0.25;
                const inWall = x >= left && x <= right && y >= wallTop && y <= base;
                const inTower = x >= towerLeft && x <= towerRight && y >= towerTop && y <= base;
                const battlement = y >= height * 0.36 && y <= wallTop &&
                    ((x >= left && x <= width * 0.38) || (x >= width * 0.62 && x <= right));
                const gate = x >= width * 0.45 && x <= width * 0.55 && y >= height * 0.56 && y <= base;
                if (insideBadge && (inWall || inTower || battlement) && !gate) color = [235, 204, 133, 255];
                if (insideBadge && x >= width * 0.47 && x <= width * 0.53 && y >= height * 0.28 && y <= height * 0.4) color = [43, 54, 76, 255];
            } else if (style === 'forest') {
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
            } else if (style === 'border') {
                const motifX = x % 12;
                const centerBand = y >= height * 0.3 && y <= height * 0.7;
                const diamondWidth = Math.max(1, Math.floor((height * 0.34) - Math.abs(y - height / 2) * 0.7));
                const diamond = Math.abs(motifX - 6) <= diamondWidth;
                color = centerBand ? [102, 75, 55, 255] : [0, 0, 0, 0];
                if (diamond) color = [224, 190, 128, 255];
                if ((y === 2 || y === height - 3) && motifX >= 2 && motifX <= 9) color = [154, 119, 79, 255];
            } else if (style === 'water') {
                const wave = Math.sin(x * 0.42 + Math.sin(y * 0.24) * 1.8) * 2.2;
                const line = Math.abs((y % 12) - 6 + wave) < 1.7;
                color = line ? [190, 231, 244, 255] : [45, 125, 164, 255];
                if ((x + y) % 29 < 2) color = [117, 190, 211, 255];
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
