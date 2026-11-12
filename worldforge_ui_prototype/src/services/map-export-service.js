import { CanvasLayerRenderer } from '../engine/layers/CanvasLayerRenderer.js';
import { MapCanvasEngine } from '../engine/MapCanvasEngine.js';

const MAX_PIXELS = 32_000_000;
const CAPTION_HEIGHT = 40;
const STYLE_FILTERS = {
    standard: 'none',
    parchment: 'sepia(0.55) saturate(0.8)',
    monochrome: 'grayscale(1) contrast(1.1)',
    vivid: 'contrast(1.2) saturate(1.25)'
};

function escapeXml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
    })[character]);
}

function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
            if (blob) resolve(blob);
            else reject(new Error(`The browser could not encode the ${type} map image.`));
        }, type, quality);
    });
}

function pathData(commands) {
    return commands.map(command => {
        if (command.type === 'close') return 'Z';
        return `${command.type === 'moveTo' ? 'M' : 'L'} ${command.x} ${command.y}`;
    }).join(' ');
}

function svgObject(object, imageHref = null) {
    const fill = object.fill === 'transparent' ? 'none' : escapeXml(object.fill || '#d97706');
    const stroke = escapeXml(object.stroke || '#78350f');
    const strokeWidth = Number.isFinite(object.strokeWidth) ? object.strokeWidth : 2;
    if (object.type === 'rect') {
        return `<rect x="${object.x}" y="${object.y}" width="${object.width}" height="${object.height}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
    }
    if (object.type === 'circle') {
        return `<circle cx="${object.x}" cy="${object.y}" r="${object.radius}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
    }
    if (object.type === 'ellipse') {
        return `<ellipse cx="${object.x}" cy="${object.y}" rx="${object.radiusX}" ry="${object.radiusY}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
    }
    if (object.type === 'path') {
        const dash = Array.isArray(object.dash) ? ` stroke-dasharray="${object.dash.join(' ')}"` : '';
        return `<path d="${pathData(object.commands)}" fill="${object.closed ? fill : 'none'}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="${escapeXml(object.lineCap || 'butt')}" stroke-linejoin="${escapeXml(object.lineJoin || 'miter')}"${dash}/>`;
    }
    if (object.type === 'text') {
        return `<text x="${object.x}" y="${object.y}" fill="${escapeXml(object.color || object.fill || '#1f2937')}" font-size="${object.fontSize}" font-family="${escapeXml(object.fontFamily || 'sans-serif')}">${escapeXml(object.text)}</text>`;
    }
    if (object.type === 'icon') {
        const size = object.size || 24;
        const color = escapeXml(object.color || '#7c2d12');
        if (object.icon === 'capital') {
            const half = size / 2;
            return `<g fill="${color}"><path d="M ${object.x - half} ${object.y + half * .65} L ${object.x - half} ${object.y} L ${object.x - half / 2} ${object.y + half * .3} L ${object.x} ${object.y - half} L ${object.x + half / 2} ${object.y + half * .3} L ${object.x + half} ${object.y} L ${object.x + half} ${object.y + half * .65} Z"/><rect x="${object.x - half}" y="${object.y + half * .65}" width="${size}" height="${half * .35}" fill="none" stroke="${color}"/></g>`;
        }
        if (object.icon === 'port') {
            const half = size / 2;
            return `<path d="M ${object.x - half} ${object.y} L ${object.x + half} ${object.y} M ${object.x - half * .8} ${object.y + half * .3} Q ${object.x} ${object.y + size} ${object.x + half * .8} ${object.y + half * .3} M ${object.x} ${object.y - half} L ${object.x} ${object.y + half * .3}" fill="none" stroke="${color}" stroke-width="${Math.max(1.5, size / 12)}" stroke-linecap="round"/>`;
        }
        if (object.icon === 'village') {
            const half = size / 2;
            return `<g fill="none" stroke="${color}" stroke-width="${Math.max(1.5, size / 12)}"><path d="M ${object.x - half} ${object.y} L ${object.x - half / 2} ${object.y - half * .55} L ${object.x} ${object.y} L ${object.x + half / 2} ${object.y - half * .55} L ${object.x + half} ${object.y} L ${object.x + half * .8} ${object.y + half} L ${object.x - half * .8} ${object.y + half} Z"/><rect x="${object.x - half * .18}" y="${object.y + half * .2}" width="${half * .36}" height="${half * .8}"/></g>`;
        }
        return `<g fill="none" stroke="${color}" stroke-width="${Math.max(1.5, size / 12)}"><circle cx="${object.x}" cy="${object.y}" r="${size * .34}"/><circle cx="${object.x}" cy="${object.y}" r="${size * .15}"/></g>`;
    }
    if (object.type === 'terrain') {
        const size = object.size;
        const color = escapeXml(object.color || '#334155');
        return object.points.map(point => {
            const r = size / 2;
            const colors = { mountain: '#8b7355', forest: '#47734a', hills: '#9a8b48', desert: '#c49b58', swamp: '#52786b', snow: '#b8cbd3' };
            const fill = colors[object.terrain] || colors.mountain;
            if (object.terrain === 'hills') {
                return `<path d="M ${point.x - r * .42} ${point.y + r * .25} A ${r * .42} ${r * .42} 0 0 1 ${point.x + r * .42} ${point.y + r * .25}" fill="none" stroke="${color}" stroke-width="${Math.max(1, r / 8)}"/>`;
            }
            if (object.terrain === 'forest') {
                return `<g fill="${fill}" stroke="${color}" stroke-width="${Math.max(1, r / 8)}"><path d="M ${point.x} ${point.y - r * .6} L ${point.x - r * .5} ${point.y + r * .35} L ${point.x + r * .5} ${point.y + r * .35} Z"/><path d="M ${point.x} ${point.y + r * .25} L ${point.x} ${point.y + r * .75}" fill="none"/></g>`;
            }
            if (object.terrain === 'mountain' || object.terrain === 'snow') {
                const points = `${point.x - r * .65},${point.y + r * .4} ${point.x},${point.y - r * .7} ${point.x + r * .65},${point.y + r * .4}`;
                return `<polygon points="${points}" fill="${fill}" stroke="${color}" stroke-width="${Math.max(1, r / 8)}"/>`;
            }
            return `<circle cx="${point.x}" cy="${point.y}" r="${Math.max(1, r * .15)}" fill="${fill}"/>`;
        }).join('');
    }
    if (object.type === 'image') {
        if (!imageHref) throw new Error('Image export requires a loaded AssetLoader and image data.');
        const centerX = object.x + object.width / 2;
        const centerY = object.y + object.height / 2;
        const preserve = object.fit === 'cover' ? 'xMidYMid slice' : object.fit === 'fill' ? 'none' : 'xMidYMid meet';
        return `<image x="${object.x}" y="${object.y}" width="${object.width}" height="${object.height}" opacity="${object.opacity ?? 1}" preserveAspectRatio="${preserve}" transform="rotate(${object.rotation || 0} ${centerX} ${centerY})" href="${escapeXml(imageHref)}"/>`;
    }
    throw new Error(`Cannot export map object type "${object.type}" as SVG.`);
}

export class MapExportService {
    constructor(renderer = new CanvasLayerRenderer()) {
        this.renderer = renderer;
        this.validator = Object.create(MapCanvasEngine.prototype);
        this.validator.renderers = new Map([['canvas', true]]);
    }

    validateOptions(map, options) {
        if (!options || typeof options !== 'object') throw new Error('Map export options are required.');
        const normalizedMap = this.validator.validateMap(map);
        const width = Number(options.width);
        const height = Number(options.height);
        const dpi = Number(options.dpi);
        if (!Number.isInteger(width) || width < 256 || width > 8192 ||
            !Number.isInteger(height) || height < 256 || height > 8192) {
            throw new Error('Export width and height must be whole numbers between 256 and 8192.');
        }
        if (![96, 150, 300].includes(dpi)) throw new Error('Export resolution must be 96, 150 or 300 DPI.');
        const format = String(options.format || '').toLowerCase();
        if (!['png', 'jpg', 'svg', 'pdf'].includes(format)) throw new Error('Unsupported map export format.');
        const style = options.style || 'standard';
        if (!Object.prototype.hasOwnProperty.call(STYLE_FILTERS, style)) throw new Error('Unsupported map export style.');
        const availableLayerIds = new Set(normalizedMap.layers.map(layer => layer.id));
        const layerIds = options.layerIds === undefined
            ? normalizedMap.layers.map(layer => layer.id)
            : options.layerIds;
        if (!Array.isArray(layerIds) || layerIds.some(id => !availableLayerIds.has(id))) {
            throw new Error('Selected map layers are invalid.');
        }
        const scale = dpi / 96;
        const pixelWidth = Math.round(width * scale);
        const pixelHeight = Math.round((height + (options.caption ? CAPTION_HEIGHT : 0)) * scale);
        if (format !== 'svg' && pixelWidth * pixelHeight > MAX_PIXELS) {
            throw new Error(`Export would exceed the ${MAX_PIXELS.toLocaleString()} pixel safety limit.`);
        }
        return {
            map: normalizedMap,
            format,
            style,
            layerIds: new Set(layerIds),
            transparent: options.transparent === true && ['png', 'svg'].includes(format),
            caption: typeof options.caption === 'string' ? options.caption.trim().slice(0, 300) : '',
            width,
            height,
            dpi,
            scale,
            pixelWidth,
            pixelHeight
        };
    }

    async exportMap(map, options) {
        const config = this.validateOptions(map, options);
        const imageObjects = config.map.layers
            .filter(layer => layer.visible && config.layerIds.has(layer.id))
            .flatMap(layer => layer.objects.filter(object => object.type === 'image'));
        if (imageObjects.length) {
            if (!this.renderer.imageRenderer) throw new Error('Image export is unavailable because no AssetLoader is connected to the map renderer.');
            await this.renderer.imageRenderer.preload(imageObjects);
        }
        if (config.format === 'svg') return new Blob([await this.renderSvg(config)], { type: 'image/svg+xml;charset=utf-8' });
        const canvas = this.renderCanvas(config, config.format === 'jpg' || config.format === 'pdf');
        if (config.format === 'png') return canvasToBlob(canvas, 'image/png');
        if (config.format === 'jpg') return canvasToBlob(canvas, 'image/jpeg', 0.94);
        const jpeg = await canvasToBlob(canvas, 'image/jpeg', 0.94);
        return this.createPdf(new Uint8Array(await jpeg.arrayBuffer()), config);
    }

    renderCanvas(config, forceOpaque) {
        const canvas = document.createElement('canvas');
        canvas.width = config.pixelWidth;
        canvas.height = config.pixelHeight;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Could not create an export canvas.');
        if (!config.transparent || forceOpaque) {
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
        }
        const mapHeight = config.height * config.scale;
        const scale = Math.min(config.width * config.scale / config.map.width, mapHeight / config.map.height);
        const offsetX = (config.width * config.scale - config.map.width * scale) / 2;
        const offsetY = (mapHeight - config.map.height * scale) / 2;
        context.save();
        context.translate(offsetX, offsetY);
        context.scale(scale, scale);
        context.filter = STYLE_FILTERS[config.style];
        for (const layer of config.map.layers) {
            if (!layer.visible || !config.layerIds.has(layer.id) ||
                (config.transparent && layer.role === 'background')) continue;
            context.save();
            context.globalAlpha = layer.opacity;
            const renderer = layer.renderer === 'canvas' ? this.renderer : null;
            if (!renderer) throw new Error(`No renderer is available for layer "${layer.name}".`);
            renderer.draw(context, layer, { selectedObjectId: null, zoom: scale });
            context.restore();
        }
        context.restore();
        if (config.caption) {
            context.filter = 'none';
            context.fillStyle = '#1f2937';
            context.font = `${Math.max(12, Math.round(14 * config.scale))}px sans-serif`;
            context.textBaseline = 'middle';
            context.fillText(config.caption, Math.round(16 * config.scale), mapHeight + Math.round(20 * config.scale), canvas.width - 32 * config.scale);
        }
        return canvas;
    }

    async renderSvg(config) {
        const mapHeight = config.height * config.scale;
        const scale = Math.min(config.width * config.scale / config.map.width, mapHeight / config.map.height);
        const offsetX = (config.width * config.scale - config.map.width * scale) / 2;
        const offsetY = (mapHeight - config.map.height * scale) / 2;
        const background = config.transparent ? '' : `<rect width="${config.pixelWidth}" height="${config.pixelHeight}" fill="#ffffff"/>`;
        const layers = (await Promise.all(config.map.layers.filter(layer => layer.visible && config.layerIds.has(layer.id) &&
            !(config.transparent && layer.role === 'background')).map(async layer => {
            const objects = (await Promise.all(layer.objects.map(async object => {
                if (object.type !== 'image') return svgObject(object);
                const loaded = this.renderer.imageRenderer.assetLoader.load(object.assetRef.packId, object.assetRef.assetId);
                const bytes = new Uint8Array(await loaded.blob.arrayBuffer());
                let binary = '';
                for (let offset = 0; offset < bytes.length; offset += 0x8000) {
                    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
                }
                const imageHref = `data:${loaded.mimeType};base64,${btoa(binary)}`;
                return svgObject(object, imageHref);
            }))).join('');
            return `<g opacity="${layer.opacity}" filter="url(#${config.style})"><g transform="translate(${offsetX} ${offsetY}) scale(${scale})">${objects}</g></g>`;
        }))).join('');
        const caption = config.caption
            ? `<text x="${16 * config.scale}" y="${mapHeight + 20 * config.scale}" fill="#1f2937" font-size="${14 * config.scale}" font-family="sans-serif">${escapeXml(config.caption)}</text>`
            : '';
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${config.pixelWidth / config.dpi}in" height="${config.pixelHeight / config.dpi}in" viewBox="0 0 ${config.pixelWidth} ${config.pixelHeight}"><defs>
            <filter id="standard"><feComponentTransfer><feFuncR type="identity"/></feComponentTransfer></filter>
            <filter id="parchment"><feColorMatrix type="saturate" values="0.8"/><feComponentTransfer><feFuncR type="linear" slope="0.9" intercept="0.08"/></feComponentTransfer></filter>
            <filter id="monochrome"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="linear" slope="1.1"/></feComponentTransfer></filter>
            <filter id="vivid"><feColorMatrix type="saturate" values="1.25"/></filter>
            </defs>${background}${layers}${caption}</svg>`;
    }

    createPdf(jpegBytes, config) {
        const pageWidth = config.pixelWidth * 72 / config.dpi;
        const pageHeight = config.pixelHeight * 72 / config.dpi;
        const content = `q ${pageWidth} 0 0 ${pageHeight} 0 0 cm /Im0 Do Q`;
        const objects = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`,
            `<< /Type /XObject /Subtype /Image /Width ${config.pixelWidth} /Height ${config.pixelHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`,
            `<< /Length ${new TextEncoder().encode(content).length} >>\nstream\n${content}\nendstream`
        ];
        const chunks = [new TextEncoder().encode('%PDF-1.4\n')];
        const offsets = [0];
        let length = chunks[0].length;
        for (let index = 0; index < objects.length; index += 1) {
            offsets.push(length);
            const header = new TextEncoder().encode(`${index + 1} 0 obj\n`);
            chunks.push(header);
            length += header.length;
            if (index === 3) {
                const streamHeader = new TextEncoder().encode(`${objects[index]}`);
                const streamTail = new TextEncoder().encode('\nendstream\nendobj\n');
                chunks.push(streamHeader, jpegBytes, streamTail);
                length += streamHeader.length + jpegBytes.length + streamTail.length;
            } else {
                const body = new TextEncoder().encode(`${objects[index]}\nendobj\n`);
                chunks.push(body);
                length += body.length;
            }
        }
        const xrefOffset = length;
        let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
        for (const offset of offsets.slice(1)) xref += `${String(offset).padStart(10, '0')} 00000 n \n`;
        xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
        chunks.push(new TextEncoder().encode(xref));
        return new Blob(chunks, { type: 'application/pdf' });
    }
}
