import { getImageObjectBounds, hitTestImageObject } from '../objects/ImageObjectRenderer.js';

export class CanvasLayerRenderer {
    constructor({ imageRenderer = null } = {}) {
        this.imageRenderer = imageRenderer;
    }

    draw(context, layer, { selectedObjectId, zoom }) {
        for (const object of layer.objects) {
            this.drawObject(context, object);
            if (object.id === selectedObjectId) this.drawSelection(context, object, zoom);
        }
    }

    drawObject(context, object) {
        if (object.type === 'image') {
            this.imageRenderer?.draw(context, object);
            return;
        }
        context.save();
        context.fillStyle = object.fill || '#d97706';
        context.strokeStyle = object.stroke || '#78350f';
        context.lineWidth = Number.isFinite(object.strokeWidth) ? object.strokeWidth : 2;
        context.lineCap = object.lineCap || 'butt';
        context.lineJoin = object.lineJoin || 'miter';
        if (Array.isArray(object.dash)) context.setLineDash(object.dash);

        if (object.type === 'rect') {
            if (object.fill !== 'transparent') context.fillRect(object.x, object.y, object.width, object.height);
            context.strokeRect(object.x, object.y, object.width, object.height);
        } else if (object.type === 'circle') {
            context.beginPath();
            context.arc(object.x, object.y, object.radius, 0, Math.PI * 2);
            if (object.fill !== 'transparent') context.fill();
            context.stroke();
        } else if (object.type === 'ellipse') {
            context.beginPath();
            context.ellipse(object.x, object.y, object.radiusX, object.radiusY, 0, 0, Math.PI * 2);
            if (object.fill !== 'transparent') {
                const textureImage = object.textureAssetRef && this.imageRenderer
                    ? this.imageRenderer.getImage({
                        type: 'image',
                        assetRef: object.textureAssetRef,
                        x: object.x - object.radiusX,
                        y: object.y - object.radiusY,
                        width: object.radiusX * 2,
                        height: object.radiusY * 2
                    })
                    : null;
                if (textureImage && typeof context.createPattern === 'function') {
                    context.save();
                    context.clip();
                    const pattern = context.createPattern(textureImage, 'repeat');
                    if (pattern) {
                        context.fillStyle = pattern;
                        context.fillRect(
                            object.x - object.radiusX,
                            object.y - object.radiusY,
                            object.radiusX * 2,
                            object.radiusY * 2
                        );
                    } else {
                        context.fill();
                    }
                    context.restore();
                } else {
                    context.fill();
                }
            }
            context.stroke();
        } else if (object.type === 'text') {
            context.fillStyle = object.color || object.fill || '#1f2937';
            context.font = `${object.fontSize || 24}px ${object.fontFamily || 'sans-serif'}`;
            context.textBaseline = 'alphabetic';
            context.fillText(object.text, object.x, object.y);
        } else if (object.type === 'icon') {
            this.drawIcon(context, object);
        } else if (object.type === 'terrain') {
            this.drawTerrain(context, object);
        } else if (object.type === 'path') {
            this.drawPath(context, object);
        }
        context.restore();
    }

    drawIcon(context, object) {
        if (object.assetRef && this.imageRenderer) {
            const size = object.size || 24;
            this.imageRenderer.draw(context, {
                type: 'image',
                assetRef: object.assetRef,
                x: object.x - size / 2,
                y: object.y - size / 2,
                width: size,
                height: size,
                rotation: 0,
                opacity: 1,
                fit: 'contain'
            });
            return;
        }
        const size = object.size || 24;
        const half = size / 2;
        context.save();
        context.translate(object.x, object.y);
        context.strokeStyle = object.color || '#7c2d12';
        context.fillStyle = object.color || '#7c2d12';
        context.lineWidth = Math.max(1.5, size / 12);
        context.lineJoin = 'round';
        context.lineCap = 'round';

        if (object.icon === 'capital') {
            context.beginPath();
            context.moveTo(-half, half * 0.65);
            context.lineTo(-half, 0);
            context.lineTo(-half / 2, half * 0.3);
            context.lineTo(0, -half);
            context.lineTo(half / 2, half * 0.3);
            context.lineTo(half, 0);
            context.lineTo(half, half * 0.65);
            context.closePath();
            context.fill();
            context.strokeRect(-half, half * 0.65, size, half * 0.35);
        } else if (object.icon === 'port') {
            context.beginPath();
            context.moveTo(-half, 0);
            context.lineTo(half, 0);
            context.moveTo(-half * 0.8, half * 0.3);
            context.quadraticCurveTo(0, size, half * 0.8, half * 0.3);
            context.moveTo(0, -half);
            context.lineTo(0, half * 0.3);
            context.stroke();
        } else if (object.icon === 'village') {
            context.beginPath();
            context.moveTo(-half, 0);
            context.lineTo(-half / 2, -half * 0.55);
            context.lineTo(0, 0);
            context.lineTo(half / 2, -half * 0.55);
            context.lineTo(half, 0);
            context.lineTo(half * 0.8, half);
            context.lineTo(-half * 0.8, half);
            context.closePath();
            context.stroke();
            context.strokeRect(-half * 0.18, half * 0.2, half * 0.36, half * 0.8);
        } else {
            context.beginPath();
            context.arc(0, 0, half * 0.68, 0, Math.PI * 2);
            context.fill();
            context.strokeStyle = '#fff';
            context.lineWidth = Math.max(1, size / 16);
            context.beginPath();
            context.arc(0, 0, half * 0.3, 0, Math.PI * 2);
            context.stroke();
        }
        context.restore();
    }

    drawTerrain(context, object) {
        for (const point of object.points) {
            const radius = object.size / 2;
            this.drawTerrainMark(context, point.x, point.y, radius * 2, object.terrain, object.color);
        }
    }

    drawTerrainMark(context, x, y, size, terrain, color) {
        const radius = size / 2;
        const colors = {
            mountain: '#8b7355',
            forest: '#47734a',
            hills: '#9a8b48',
            desert: '#c49b58',
            swamp: '#52786b',
            snow: '#b8cbd3'
        };
        context.save();
        context.fillStyle = colors[terrain] || '#8b7355';
        context.strokeStyle = color || '#334155';
        context.lineWidth = Math.max(1, radius / 8);
        if (terrain === 'mountain' || terrain === 'snow') {
            context.beginPath();
            context.moveTo(x - radius * 0.65, y + radius * 0.4);
            context.lineTo(x, y - radius * 0.7);
            context.lineTo(x + radius * 0.65, y + radius * 0.4);
            context.closePath();
            context.fill();
            context.stroke();
        } else if (terrain === 'forest') {
            context.beginPath();
            context.moveTo(x, y - radius * 0.6);
            context.lineTo(x - radius * 0.5, y + radius * 0.35);
            context.lineTo(x + radius * 0.5, y + radius * 0.35);
            context.closePath();
            context.fill();
            context.beginPath();
            context.moveTo(x, y + radius * 0.25);
            context.lineTo(x, y + radius * 0.75);
            context.stroke();
        } else if (terrain === 'hills') {
            context.beginPath();
            context.arc(x, y + radius * 0.25, radius * 0.42, Math.PI, Math.PI * 2);
            context.stroke();
        } else {
            context.beginPath();
            context.arc(x, y, Math.max(1, radius * 0.15), 0, Math.PI * 2);
            context.fill();
        }
        context.restore();
    }

    drawPath(context, object) {
        context.beginPath();
        for (const command of object.commands) {
            switch (command.type) {
                case 'moveTo':
                    context.moveTo(command.x, command.y);
                    break;
                case 'lineTo':
                    context.lineTo(command.x, command.y);
                    break;
                case 'close':
                    context.closePath();
                    break;
                default:
                    throw new Error(`Unsupported canvas path command: ${command.type}.`);
            }
        }
        if (object.closed && object.fill !== 'transparent') {
            context.fill();
            if (object.feature === 'terrain') this.drawTerrainPattern(context, object);
        }
        context.stroke();
        if (object.feature === 'border' && object.patternAssetRef) {
            this.drawPatternStroke(context, object);
        }
    }

    drawPatternStroke(context, object) {
        if (!this.imageRenderer) return false;
        const image = this.imageRenderer.getImage({
            type: 'image',
            assetRef: object.patternAssetRef,
            x: 0,
            y: 0,
            width: 1,
            height: 1
        });
        if (!image) return false;

        const scale = Number.isFinite(object.patternScale) && object.patternScale > 0
            ? object.patternScale
            : 1;
        const tileWidth = Math.max(1, (object.patternSize?.width || image.naturalWidth || image.width || 48) * scale);
        const tileHeight = Math.max(1, (object.patternSize?.height || image.naturalHeight || image.height || 16) * scale);
        const subpaths = [];
        let current = [];
        for (const command of object.commands || []) {
            if (command.type === 'moveTo') {
                if (current.length > 1) subpaths.push(current);
                current = [{ x: command.x, y: command.y }];
            } else if (command.type === 'lineTo' && current.length) {
                current.push({ x: command.x, y: command.y });
            }
        }
        if (current.length > 1) subpaths.push(current);

        let drawn = 0;
        for (const points of subpaths) {
            const segments = [];
            let totalLength = 0;
            for (let index = 1; index < points.length; index += 1) {
                const start = points[index - 1];
                const end = points[index];
                const length = Math.hypot(end.x - start.x, end.y - start.y);
                if (length <= 0) continue;
                segments.push({ start, end, length, startDistance: totalLength });
                totalLength += length;
            }
            if (!segments.length) continue;

            const tileCount = Math.max(1, Math.round(totalLength / tileWidth));
            const spacing = totalLength / tileCount;
            for (let index = 0; index < tileCount; index += 1) {
                const distance = spacing * (index + 0.5);
                let segment = segments[0];
                for (const candidate of segments) {
                    if (candidate.startDistance <= distance) segment = candidate;
                    else break;
                }
                const localDistance = Math.min(segment.length, Math.max(0, distance - segment.startDistance));
                const ratio = localDistance / segment.length;
                const x = segment.start.x + (segment.end.x - segment.start.x) * ratio;
                const y = segment.start.y + (segment.end.y - segment.start.y) * ratio;
                const angle = Math.atan2(segment.end.y - segment.start.y, segment.end.x - segment.start.x);
                context.save();
                context.translate(x, y);
                context.rotate(angle);
                context.drawImage(image, -tileWidth / 2, -tileHeight / 2, tileWidth, tileHeight);
                context.restore();
                drawn += 1;
            }
        }
        return drawn > 0;
    }

    drawTerrainPattern(context, object) {
        const bounds = this.getBounds(object);
        if (!bounds) return;
        const markArea = Math.max(1, bounds.width * bounds.height);
        const spacing = Math.max(24, Math.sqrt(markArea / 1000));
        context.save();
        context.clip();
        context.fillStyle = 'rgba(255,255,255,0.3)';
        for (let y = bounds.y + spacing / 2; y < bounds.y + bounds.height; y += spacing) {
            for (let x = bounds.x + spacing / 2; x < bounds.x + bounds.width; x += spacing) {
                this.drawTerrainMark(context, x, y, spacing * 0.7, object.terrainType, object.stroke);
            }
        }
        context.restore();
    }

    drawSelection(context, object, zoom) {
        const bounds = this.getBounds(object);
        if (!bounds) return;
        context.save();
        context.strokeStyle = '#3b82f6';
        context.lineWidth = 2 / zoom;
        context.setLineDash([6 / zoom, 4 / zoom]);
        context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
        context.restore();
    }

    getBounds(object) {
        if (object.type === 'image') return getImageObjectBounds(object);
        if (object.type === 'rect') {
            return { x: object.x, y: object.y, width: object.width, height: object.height };
        }
        if (object.type === 'circle') {
            return {
                x: object.x - object.radius,
                y: object.y - object.radius,
                width: object.radius * 2,
                height: object.radius * 2
            };
        }
        if (object.type === 'ellipse') {
            return {
                x: object.x - object.radiusX,
                y: object.y - object.radiusY,
                width: object.radiusX * 2,
                height: object.radiusY * 2
            };
        }
        if (object.type === 'text') {
            const size = object.fontSize || 24;
            return { x: object.x, y: object.y - size, width: Math.max(size, object.text.length * size * 0.7), height: size * 1.25 };
        }
        if (object.type === 'icon') {
            const size = object.size || 24;
            return { x: object.x - size / 2, y: object.y - size / 2, width: size, height: size };
        }
        if (object.type === 'terrain' && object.points.length) {
            const radius = object.size / 2;
            const xs = object.points.map(point => point.x);
            const ys = object.points.map(point => point.y);
            return {
                x: Math.min(...xs) - radius,
                y: Math.min(...ys) - radius,
                width: Math.max(...xs) - Math.min(...xs) + radius * 2,
                height: Math.max(...ys) - Math.min(...ys) + radius * 2
            };
        }
        if (object.type === 'path') {
            const points = object.commands.filter(command => Number.isFinite(command.x) && Number.isFinite(command.y));
            if (!points.length) return null;
            const xs = points.map(point => point.x);
            const ys = points.map(point => point.y);
            const padding = object.feature === 'border' && object.patternAssetRef
                ? Math.max(object.patternSize?.width || 48, object.patternSize?.height || 16) *
                    (Number.isFinite(object.patternScale) && object.patternScale > 0 ? object.patternScale : 1) / 2
                : 0;
            const minX = Math.min(...xs) - padding;
            const minY = Math.min(...ys) - padding;
            return {
                x: minX,
                y: minY,
                width: Math.max(...xs) - Math.min(...xs) + padding * 2,
                height: Math.max(...ys) - Math.min(...ys) + padding * 2
            };
        }
        return null;
    }

    hitTest(object, point, tolerance) {
        if (object.type === 'image') return hitTestImageObject(object, point, tolerance);
        if (object.type === 'rect') {
            return point.x >= object.x - tolerance &&
                point.x <= object.x + object.width + tolerance &&
                point.y >= object.y - tolerance &&
                point.y <= object.y + object.height + tolerance;
        }
        if (object.type === 'circle') {
            return Math.hypot(point.x - object.x, point.y - object.y) <= object.radius + tolerance;
        }
        if (object.type === 'ellipse') {
            const rx = object.radiusX + tolerance;
            const ry = object.radiusY + tolerance;
            return ((point.x - object.x) ** 2) / (rx * rx) + ((point.y - object.y) ** 2) / (ry * ry) <= 1;
        }
        if (object.type === 'text' || object.type === 'icon') {
            const bounds = this.getBounds(object);
            return point.x >= bounds.x - tolerance &&
                point.x <= bounds.x + bounds.width + tolerance &&
                point.y >= bounds.y - tolerance &&
                point.y <= bounds.y + bounds.height + tolerance;
        }
        if (object.type === 'terrain') {
            return object.points.some(mark => Math.hypot(point.x - mark.x, point.y - mark.y) <= object.size / 2 + tolerance);
        }
        if (object.type === 'path') {
            return this.pathHitTest(object, point, tolerance);
        }
        return false;
    }

    pathHitTest(object, point, tolerance) {
        let previous = null;
        let first = null;
        let polygon = [];
        const polygons = [];
        for (const command of object.commands) {
            if (command.type === 'moveTo') {
                if (polygon.length) polygons.push(polygon);
                polygon = [command];
                previous = command;
                first = command;
            } else if (command.type === 'lineTo' && previous) {
                if (this.distanceToSegment(point, previous, command) <= tolerance) return true;
                previous = command;
                polygon.push(command);
            } else if (command.type === 'close' && previous && first) {
                if (this.distanceToSegment(point, previous, first) <= tolerance) return true;
                previous = first;
            }
        }
        if (polygon.length) polygons.push(polygon);
        if (object.closed && object.fill !== 'transparent') {
            for (const points of polygons) {
                if (points.length < 3) continue;
                let inside = false;
                for (let index = 0, previousIndex = points.length - 1;
                    index < points.length;
                    previousIndex = index, index += 1) {
                    const current = points[index];
                    const previousPoint = points[previousIndex];
                    const crosses = (current.y > point.y) !== (previousPoint.y > point.y) &&
                        point.x < ((previousPoint.x - current.x) * (point.y - current.y)) /
                        (previousPoint.y - current.y) + current.x;
                    if (crosses) inside = !inside;
                }
                if (inside) return true;
            }
        }
        return false;
    }

    distanceToSegment(point, start, end) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const lengthSquared = dx * dx + dy * dy;
        if (lengthSquared === 0) return Math.hypot(point.x - start.x, point.y - start.y);
        const projection = Math.max(0, Math.min(1,
            ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
        return Math.hypot(point.x - (start.x + projection * dx), point.y - (start.y + projection * dy));
    }
}
