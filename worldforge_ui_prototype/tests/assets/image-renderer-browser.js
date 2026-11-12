import { MapCanvasEngine, createEmptyMap } from '../../src/engine/MapCanvasEngine.js';
import { AssetRegistry } from '../../src/assets/asset-registry.js';
import { AssetLoader } from '../../src/assets/asset-loader.js';
import { AssetPackService } from '../../src/assets/asset-pack-service.js';
import { CanvasLayerRenderer } from '../../src/engine/layers/CanvasLayerRenderer.js';
import { MapExportService } from '../../src/services/map-export-service.js';

const $ = id => document.getElementById(id);
const status = message => { $('status').textContent = message; };
const registry = new AssetRegistry();
const loader = new AssetLoader(registry);
let selectedObjectId = null;
let imageLayerVisible = true;
let engine;

engine = new MapCanvasEngine($('map-canvas'), {
    onSelectionChange: selection => {
        selectedObjectId = selection?.type === 'image' ? selection.id : null;
        syncControls();
    },
    onError: error => status(`Renderer error: ${error.message}`)
});
engine.setMap(createEmptyMap(1600, 1000));
engine.setActiveLayer('layer-decorations');
engine.setAssetLoader(loader);
const packService = new AssetPackService({ registry, loader });
const exportService = new MapExportService(new CanvasLayerRenderer({ imageRenderer: engine.imageRenderer }));
const controls = ['image-width','image-height','image-rotation','image-opacity','image-fit','apply-image','toggle-layer','layer-opacity'];
function syncControls() {
    const active = Boolean(selectedObjectId && engine.findObject(selectedObjectId)?.type === 'image');
    controls.forEach(id => { $(id).disabled = !active; });
    document.querySelectorAll('[data-export]').forEach(button => { button.disabled = !engine.getMapData().layers.some(layer => layer.objects.some(object => object.type === 'image')); });
    if (!active) return;
    const object = engine.findObject(selectedObjectId);
    $('image-width').value = object.width;
    $('image-height').value = object.height;
    $('image-rotation').value = object.rotation;
    $('image-opacity').value = object.opacity;
    $('image-fit').value = object.fit;
    const layer = engine.getMapData().layers.find(item => item.objects.some(object => object.id === selectedObjectId));
    $('toggle-layer').textContent = layer?.visible ? 'Hide image layer' : 'Show image layer';
}
function addImage() {
    const asset = registry.getAsset(...$('asset-select').value.split('::'));
    if (!asset) return;
    const layerId = 'layer-decorations';
    engine.setActiveLayer(layerId);
    const width = asset.defaultSize?.width || 240;
    const height = asset.defaultSize?.height || 180;
    const object = engine.addObject(layerId, {
        id: crypto.randomUUID(), type: 'image', schemaVersion: 1,
        assetRef: { packId: asset.packId, assetId: asset.id, packVersion: asset.packVersion },
        x: 800 - width / 2 + Math.random() * 80,
        y: 500 - height / 2 + Math.random() * 80,
        width, height, rotation: 0, opacity: 1, fit: 'contain'
    }, 'Add QA image');
    selectedObjectId = object.id;
    syncControls();
    status(`Added ${asset.name} (${asset.key}). Wait for image decode, then test click/drag, zoom and export.`);
}
$('pack-file').addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const pack = packService.installPack(bytes);
        const assets = registry.listAssets({ packId: pack.manifest.id });
        $('asset-select').replaceChildren(...assets.map(asset => {
            const option = document.createElement('option');
            option.value = `${asset.packId}::${asset.id}`;
            option.textContent = `${asset.name} — ${asset.id}`;
            return option;
        }));
        $('asset-select').disabled = assets.length === 0;
        $('add-image').disabled = assets.length === 0;
        $('add-another').disabled = assets.length === 0;
        status(`Installed Pack: ${pack.manifest.name} v${pack.manifest.version}. Assets: ${assets.length}. Select one and add it to the map.`);
    } catch (error) {
        status(`Pack install failed: ${error.message}`);
    }
});
$('add-image').addEventListener('click', addImage);
$('add-another').addEventListener('click', addImage);
$('apply-image').addEventListener('click', () => {
    if (!selectedObjectId) return;
    try {
        engine.updateObject(selectedObjectId, {
            width: Number($('image-width').value),
            height: Number($('image-height').value),
            rotation: Number($('image-rotation').value),
            opacity: Number($('image-opacity').value),
            fit: $('image-fit').value
        }, 'Edit QA image');
        status('Updated selected image. Check its rendered dimensions, rotation, opacity and fit mode.');
    } catch (error) { status(`Update failed: ${error.message}`); }
});
$('toggle-layer').addEventListener('click', () => {
    imageLayerVisible = !imageLayerVisible;
    engine.setLayerVisibility('layer-decorations', imageLayerVisible);
    $('toggle-layer').textContent = imageLayerVisible ? 'Hide image layer' : 'Show image layer';
    status(`Image layer visible: ${imageLayerVisible}. Hidden layers should not render or receive hit tests.`);
});
$('layer-opacity').addEventListener('click', () => {
    engine.setLayerOpacity('layer-decorations', 0.5);
    status('Image layer opacity set to 50%. Compare with opacity 1 on the same image.');
});
$('zoom-in').addEventListener('click', () => engine.zoomIn());
$('zoom-out').addEventListener('click', () => engine.zoomOut());
$('fit-map').addEventListener('click', () => engine.fitToScreen());
document.querySelectorAll('[data-export]').forEach(button => button.addEventListener('click', async () => {
    try {
        const format = button.dataset.export;
        const blob = await exportService.exportMap(engine.getMapData(), {
            format, width: 1600, height: 1000, dpi: 96, style: 'standard', transparent: false
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `worldforge-phase2-test.${format}`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        status(`Exported ${format.toUpperCase()} (${blob.size.toLocaleString()} bytes). Open the file and verify the image is present, correctly placed and rotated.`);
    } catch (error) { status(`Export failed: ${error.message}`); }
}));
window.addEventListener('beforeunload', () => { engine.destroy(); loader.clear(); });
syncControls();
