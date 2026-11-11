export class ViewportTransform {
    constructor({ zoom = 1, offsetX = 0, offsetY = 0, minZoom = 0.0001, maxZoom = 8 } = {}) {
        this.zoom = zoom;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.minZoom = minZoom;
        this.maxZoom = maxZoom;
    }

    screenToWorld(point) {
        return {
            x: (point.x - this.offsetX) / this.zoom,
            y: (point.y - this.offsetY) / this.zoom
        };
    }

    worldToScreen(point) {
        return {
            x: point.x * this.zoom + this.offsetX,
            y: point.y * this.zoom + this.offsetY
        };
    }

    zoomAt(screenPoint, nextZoom) {
        if (!Number.isFinite(screenPoint.x) || !Number.isFinite(screenPoint.y) ||
            !Number.isFinite(nextZoom) || nextZoom <= 0) {
            throw new Error('Zoom requires a finite screen point and a positive scale.');
        }
        const anchor = this.screenToWorld(screenPoint);
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, nextZoom));
        this.offsetX = screenPoint.x - anchor.x * this.zoom;
        this.offsetY = screenPoint.y - anchor.y * this.zoom;
    }

    panBy(deltaX, deltaY) {
        if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY)) {
            throw new Error('Pan offsets must be finite numbers.');
        }
        this.offsetX += deltaX;
        this.offsetY += deltaY;
    }

    fitToScreen(mapWidth, mapHeight, viewportWidth, viewportHeight, padding = 48) {
        if (![mapWidth, mapHeight, viewportWidth, viewportHeight, padding].every(Number.isFinite) ||
            mapWidth <= 0 || mapHeight <= 0 || viewportWidth <= 0 || viewportHeight <= 0 || padding < 0) {
            throw new Error('Fit to Screen requires positive map and viewport dimensions.');
        }
        const availableWidth = Math.max(1, viewportWidth - padding * 2);
        const availableHeight = Math.max(1, viewportHeight - padding * 2);
        this.zoom = Math.min(this.maxZoom, availableWidth / mapWidth, availableHeight / mapHeight);
        this.offsetX = (viewportWidth - mapWidth * this.zoom) / 2;
        this.offsetY = (viewportHeight - mapHeight * this.zoom) / 2;
    }

    reset() {
        this.zoom = 1;
        this.offsetX = 0;
        this.offsetY = 0;
    }
}
