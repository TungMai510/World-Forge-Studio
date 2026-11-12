export function normalizeImageObject(object) {
    if (!object || typeof object !== 'object' || Array.isArray(object)) {
        throw new Error('Image object must be an object.');
    }
    const { assetRef } = object;
    if (!assetRef || typeof assetRef !== 'object' || Array.isArray(assetRef) ||
        typeof assetRef.packId !== 'string' || !assetRef.packId.trim() ||
        typeof assetRef.assetId !== 'string' || !assetRef.assetId.trim()) {
        throw new Error('Image object requires a valid Asset Pack and asset reference.');
    }
    const x = object.x;
    const y = object.y;
    const width = object.width;
    const height = object.height;
    const rotation = object.rotation === undefined ? 0 : object.rotation;
    const opacity = object.opacity === undefined ? 1 : object.opacity;
    const fit = object.fit === undefined ? 'contain' : object.fit;
    if (![x, y, width, height, rotation, opacity].every(Number.isFinite) ||
        width <= 0 || height <= 0 || width > 8192 || height > 8192 ||
        Math.abs(rotation) > 36000 || opacity < 0 || opacity > 1) {
        throw new Error('Image object geometry, rotation or opacity is invalid.');
    }
    if (!['contain', 'cover', 'fill'].includes(fit)) {
        throw new Error('Image object fit must be contain, cover or fill.');
    }
    const normalizedRef = {
        packId: assetRef.packId.trim(),
        assetId: assetRef.assetId.trim()
    };
    if (assetRef.packVersion !== undefined) {
        if (typeof assetRef.packVersion !== 'string' || !assetRef.packVersion.trim()) {
            throw new Error('Image asset packVersion must be a non-empty string when provided.');
        }
        normalizedRef.packVersion = assetRef.packVersion.trim();
    }
    return {
        ...object,
        schemaVersion: 1,
        assetRef: normalizedRef,
        x, y, width, height,
        rotation: ((rotation % 360) + 360) % 360,
        opacity,
        fit
    };
}

export function getImageObjectCorners(object) {
    const centerX = object.x + object.width / 2;
    const centerY = object.y + object.height / 2;
    const angle = (object.rotation || 0) * Math.PI / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return [
        [-object.width / 2, -object.height / 2],
        [object.width / 2, -object.height / 2],
        [object.width / 2, object.height / 2],
        [-object.width / 2, object.height / 2]
    ].map(([dx, dy]) => ({
        x: centerX + dx * cos - dy * sin,
        y: centerY + dx * sin + dy * cos
    }));
}

export function getImageObjectBounds(object) {
    const corners = getImageObjectCorners(object);
    const xs = corners.map(point => point.x);
    const ys = corners.map(point => point.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    return {
        x: minX,
        y: minY,
        width: Math.max(...xs) - minX,
        height: Math.max(...ys) - minY
    };
}

export function hitTestImageObject(object, point, tolerance = 0) {
    const centerX = object.x + object.width / 2;
    const centerY = object.y + object.height / 2;
    const angle = -(object.rotation || 0) * Math.PI / 180;
    const dx = point.x - centerX;
    const dy = point.y - centerY;
    const localX = dx * Math.cos(angle) - dy * Math.sin(angle);
    const localY = dx * Math.sin(angle) + dy * Math.cos(angle);
    return Math.abs(localX) <= object.width / 2 + tolerance &&
        Math.abs(localY) <= object.height / 2 + tolerance;
}

export class ImageObjectRenderer {
    constructor({ assetLoader = null, onInvalidate = () => {}, onError = () => {}, createImage = () => new Image() } = {}) {
        this.assetLoader = assetLoader;
        this.onInvalidate = onInvalidate;
        this.onError = onError;
        this.createImage = createImage;
        this.images = new Map();
    }

    setAssetLoader(assetLoader) {
        this.assetLoader = assetLoader;
        this.images.clear();
        this.onInvalidate();
    }

    getImage(object) {
        if (!this.assetLoader) return null;
        const { packId, assetId } = object.assetRef;
        const key = `${packId}::${object.assetRef.packVersion || 'latest'}::${assetId}`;
        const cached = this.images.get(key);
        if (cached) return cached.status === 'ready' ? cached.image : null;
        const entry = { status: 'loading', image: null };
        this.images.set(key, entry);
        try {
            const loaded = this.assetLoader.load(packId, assetId);
            const image = this.createImage();
            entry.image = image;
            image.onload = () => {
                entry.status = 'ready';
                this.onInvalidate();
            };
            image.onerror = () => {
                entry.status = 'error';
                this.onError(new Error(`Unable to decode image asset "${packId}::${assetId}".`));
                this.onInvalidate();
            };
            image.src = loaded.url;
            if (image.complete && image.naturalWidth > 0) entry.status = 'ready';
        } catch (error) {
            entry.status = 'error';
            this.onError(error);
        }
        return entry.status === 'ready' ? entry.image : null;
    }

    draw(context, object) {
        const image = this.getImage(object);
        context.save();
        const centerX = object.x + object.width / 2;
        const centerY = object.y + object.height / 2;
        context.translate(centerX, centerY);
        context.rotate((object.rotation || 0) * Math.PI / 180);
        context.globalAlpha *= object.opacity === undefined ? 1 : object.opacity;
        const x = -object.width / 2;
        const y = -object.height / 2;
        if (image) {
            const sourceWidth = image.naturalWidth || image.width;
            const sourceHeight = image.naturalHeight || image.height;
            if (object.fit === 'fill' || !sourceWidth || !sourceHeight) {
                context.drawImage(image, x, y, object.width, object.height);
            } else {
                const scale = object.fit === 'cover'
                    ? Math.max(object.width / sourceWidth, object.height / sourceHeight)
                    : Math.min(object.width / sourceWidth, object.height / sourceHeight);
                const drawWidth = sourceWidth * scale;
                const drawHeight = sourceHeight * scale;
                if (object.fit === 'cover') {
                    context.beginPath();
                    context.rect(x, y, object.width, object.height);
                    context.clip();
                }
                context.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
            }
        } else {
            context.fillStyle = 'rgba(120, 100, 70, 0.16)';
            context.strokeStyle = '#9b8060';
            context.lineWidth = 2;
            context.fillRect(x, y, object.width, object.height);
            context.strokeRect(x, y, object.width, object.height);
            context.beginPath();
            context.moveTo(x, y);
            context.lineTo(-x, -y);
            context.moveTo(x + object.width, y);
            context.lineTo(-x, -y);
            context.stroke();
        }
        context.restore();
    }

    clear() {
        this.images.clear();
    }
}
