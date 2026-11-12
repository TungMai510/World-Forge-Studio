import { MapCanvasEngine, createEmptyMap } from '../engine/MapCanvasEngine.js';
import { CanvasLayerRenderer } from '../engine/layers/CanvasLayerRenderer.js';
import { AssetRegistry } from '../assets/asset-registry.js';
import { AssetLoader } from '../assets/asset-loader.js';
import { AssetPackService } from '../assets/asset-pack-service.js';
import { filterAssetLibraryAssets, listAssetLibraryCategories } from '../assets/asset-library-model.js';
import { TOOL_DEFINITIONS } from '../engine/tools/ToolManager.js';
import { ENTITY_TYPES, GeographyService } from '../services/geography-service.js';
import { CIVILIZATION_TYPES, CivilizationService, TYPE_LABELS } from '../services/civilization-service.js';
import { DATE_PRECISIONS, HistoryService, HISTORY_TYPES, LABELS, RELATION_TYPES } from '../services/history-service.js';
import { MapExportService } from '../services/map-export-service.js';

const MAX_COVER_FILE_SIZE = 2 * 1024 * 1024;
const MAX_IMPORT_SIZE = 100 * 1024 * 1024;

export class UIController {
    constructor(projectService) {
        this.projectService = projectService;
        this.bottomPanel = document.getElementById('bottom-panel');
        this.currentProject = null;
        this.geographyService = null;
        this.civilizationService = null;
        this.historyService = null;
        this.activeGeographyType = 'worlds';
        this.activeCivilizationType = 'characters';
        this.activeHistoryType = 'timeline';
        this.selectedHistoryId = null;
        this.editingHistoryId = null;
        this.historyTimelineFilter = null;
        this.selectedCivilizationId = null;
        this.editingCivilizationId = null;
        this.selectedGeographyId = null;
        this.editingGeographyId = null;
        this.geographyCityTypeTouched = false;
        this.editingProjectId = null;
        this.toastTimeout = null;
        this.assetRegistry = new AssetRegistry();
        this.assetLoader = new AssetLoader(this.assetRegistry);
        this.assetPackService = new AssetPackService({
            registry: this.assetRegistry,
            loader: this.assetLoader
        });
        this.assetLibraryState = { packId: '', category: '', query: '', selectedKey: null };
        this.canvasEngine = new MapCanvasEngine(document.getElementById('map-canvas'), {
            onSelectionChange: selection => this.renderSelection(selection),
            onPointerMove: point => this.renderCoordinates(point),
            onViewportChange: viewport => this.renderViewport(viewport),
            getViewportInsets: () => ({ bottom: this.bottomPanel.offsetHeight }),
            onMapChange: (map, reason) => this.handleMapChange(map, reason),
            onHistoryChange: state => this.renderHistory(state),
            onToolChange: id => this.renderTools(id),
            onError: error => this.notify(`Lỗi Canvas: ${error.message}`, true)
        });
        this.canvasEngine.setAssetLoader(this.assetLoader);
        this.canvasEngine.setAssetRegistry(this.assetRegistry);
        this.mapExportService = new MapExportService(
            new CanvasLayerRenderer({ imageRenderer: this.canvasEngine.imageRenderer })
        );
    }

    async init() {
        this.setupTooltips();
        this.bindProjectManager();
        this.renderTools(this.canvasEngine.toolManager.activeToolId);
        this.renderLayers();
        await this.renderProjectLists();
    }

    setupTooltips() {
        // Native title attributes are used by the prototype.
    }

    bindProjectManager() {
        document.getElementById('create-project-button').addEventListener('click', () => this.openProjectForm());
        document.getElementById('cancel-project-form').addEventListener('click', () => {
            document.getElementById('project-form-dialog').close();
        });
        document.getElementById('project-form').addEventListener('submit', event => this.handleProjectFormSubmit(event));
        document.getElementById('project-cover-file').addEventListener('change', event => this.handleCoverFile(event));
        document.getElementById('import-project-button').addEventListener('click', () => {
            document.getElementById('import-project-file').click();
        });
        document.getElementById('import-project-file').addEventListener('change', event => this.handleImportFile(event));
        document.getElementById('project-list').addEventListener('click', event => this.handleProjectAction(event));
        document.getElementById('recent-project-list').addEventListener('click', event => this.handleProjectAction(event));
        document.getElementById('project-info-content').addEventListener('click', event => this.handleInfoAction(event));
        document.getElementById('export-project-json').addEventListener('click', () => this.downloadProject('json'));
        document.getElementById('export-project-wforge').addEventListener('click', () => this.downloadProject('wforge'));
        document.getElementById('cancel-project-export').addEventListener('click', () => {
            document.getElementById('project-export-dialog').close();
        });
        document.getElementById('map-export-button').addEventListener('click', () => this.openMapExportDialog());
        document.getElementById('map-export-format').addEventListener('change', () => this.updateExportTransparency());
        document.getElementById('map-export-form').addEventListener('submit', event => this.handleMapExport(event));
        document.getElementById('cancel-map-export').addEventListener('click', () => {
            document.getElementById('map-export-dialog').close();
        });
        document.getElementById('project-manager-button').addEventListener('click', () => this.showProjectManager());
        document.getElementById('open-geography-database').addEventListener('click', () => this.openGeographyDatabase());
        document.getElementById('open-geography-database-side').addEventListener('click', () => this.openGeographyDatabase());
        document.getElementById('close-geography-dialog').addEventListener('click', () => {
            document.getElementById('geography-dialog').close();
        });
        document.getElementById('geography-tabs').addEventListener('click', event => {
            const button = event.target.closest('button[data-geo-type]');
            if (button) this.setGeographyType(button.dataset.geoType);
        });
        document.getElementById('geography-search').addEventListener('input', () => this.renderGeographyList());
        document.getElementById('geography-filter').addEventListener('change', () => this.renderGeographyList());
        document.getElementById('geography-list').addEventListener('click', event => {
            const button = event.target.closest('button[data-geo-id]');
            if (button) this.showGeographyDetail(button.dataset.geoId);
        });
        document.getElementById('create-geography-record').addEventListener('click', () => this.openGeographyForm());
        document.getElementById('geography-detail').addEventListener('click', event => this.handleGeographyAction(event));
        document.getElementById('geography-form').addEventListener('submit', event => this.handleGeographySubmit(event));
        document.getElementById('geography-form').addEventListener('change', event => {
            if (event.target.name === 'settlementType') this.geographyCityTypeTouched = true;
            if (!event.target.matches('[data-geo-parent]')) return;
            if (this.activeGeographyType === 'cities' && !this.editingGeographyId && !this.geographyCityTypeTouched) {
                const country = this.geographyService.get('countries', event.target.value);
                const type = document.querySelector('#geography-form [name="settlementType"]');
                if (type) type.value = country && country.capitalCityId ? 'settlement' : 'capital';
            }
            this.renderGeographyFormFields();
        });
        document.getElementById('selection-details').addEventListener('click', event => {
            if (!event.target.closest('[data-open-geography]')) return;
            const linked = this.geographyService && this.geographyService.getByMapObjectId(this.canvasEngine.selectedObjectId);
            if (linked) this.openGeographyDatabase(linked.type, linked.record.id);
        });
        document.getElementById('open-civilization-database').addEventListener('click', () => this.openCivilizationDatabase());
        document.getElementById('close-civilization-dialog').addEventListener('click', () => {
            document.getElementById('civilization-dialog').close();
        });
        document.getElementById('civilization-tabs').addEventListener('click', event => {
            const button = event.target.closest('button[data-civ-type]');
            if (button) this.setCivilizationType(button.dataset.civType);
        });
        document.getElementById('civilization-search').addEventListener('input', () => this.renderCivilizationList());
        document.getElementById('civilization-filter').addEventListener('change', () => this.renderCivilizationList());
        document.getElementById('civilization-list').addEventListener('click', event => {
            const button = event.target.closest('button[data-civ-id]');
            if (button) this.showCivilizationDetail(button.dataset.civId);
        });
        document.getElementById('create-civilization-record').addEventListener('click', () => this.openCivilizationForm());
        document.getElementById('civilization-detail').addEventListener('click', event => this.handleCivilizationAction(event));
        document.getElementById('civilization-form').addEventListener('submit', event => this.handleCivilizationSubmit(event));
        document.getElementById('civilization-form').addEventListener('click', event => {
            if (event.target.closest('[data-select-civ-image]')) document.getElementById('civilization-image-file').click();
            if (event.target.closest('[data-civ-action="cancel-form"]')) this.cancelCivilizationForm();
        });
        document.getElementById('civilization-image-file').addEventListener('change', event => this.handleCivilizationImageFile(event));
        document.getElementById('open-history-database').addEventListener('click', () => this.openHistoryDatabase());
        document.getElementById('close-history-dialog').addEventListener('click', () => {
            document.getElementById('history-dialog').close();
        });
        document.getElementById('history-tabs').addEventListener('click', event => {
            const button = event.target.closest('button[data-history-type]');
            if (button) this.setHistoryType(button.dataset.historyType);
        });
        document.getElementById('history-search').addEventListener('input', () => this.renderHistoryList());
        document.getElementById('create-history-record').addEventListener('click', () => this.openHistoryForm());
        document.getElementById('history-list').addEventListener('click', event => {
            const button = event.target.closest('button[data-history-id]');
            if (button) this.showHistoryDetail(button.dataset.historyId);
        });
        document.getElementById('history-detail').addEventListener('click', event => this.handleHistoryAction(event));
        document.getElementById('history-form').addEventListener('submit', event => this.handleHistorySubmit(event));
        document.getElementById('history-form').addEventListener('change', event => {
            if (event.target.matches('[data-history-date-precision]')) this.updateHistoryDateFields(event.target.dataset.historyDatePrecision);
        });
        document.getElementById('history-form').addEventListener('click', event => {
            if (event.target.closest('[data-history-action="cancel-form"]')) this.cancelHistoryForm();
        });
        document.getElementById('save-project-button').addEventListener('click', () => this.saveCurrentProject());
        document.getElementById('zoom-in').addEventListener('click', () => this.canvasEngine.zoomIn());
        document.getElementById('zoom-out').addEventListener('click', () => this.canvasEngine.zoomOut());
        document.getElementById('fit-view').addEventListener('click', () => this.canvasEngine.fitToScreen());
        document.getElementById('reset-view').addEventListener('click', () => this.canvasEngine.resetView());
        document.getElementById('map-size-button').addEventListener('click', () => this.openMapSizeDialog());
        document.getElementById('cancel-map-size').addEventListener('click', () => {
            document.getElementById('map-size-dialog').close();
        });
        document.getElementById('map-size-form').addEventListener('submit', event => this.handleMapSizeSubmit(event));
        document.getElementById('properties-tab').addEventListener('click', () => this.showPanelTab('properties'));
        document.getElementById('layers-tab').addEventListener('click', () => this.showPanelTab('layers'));
        document.getElementById('add-layer-button').addEventListener('click', () => this.addLayer());
        document.getElementById('remove-layer-button').addEventListener('click', () => this.removeActiveLayer());
        document.getElementById('add-layer-group-button').addEventListener('click', () => this.addLayerGroup());
        document.getElementById('rename-layer-group-button').addEventListener('click', () => this.renameLayerGroup());
        document.getElementById('delete-layer-group-button').addEventListener('click', () => this.deleteLayerGroup());
        document.getElementById('layer-list').addEventListener('click', event => this.handleLayerClick(event));
        document.getElementById('layer-list').addEventListener('change', event => this.handleLayerChange(event));
        document.getElementById('layer-group-manager').addEventListener('change', () => {
            const enabled = Boolean(document.getElementById('layer-group-manager').value);
            document.getElementById('rename-layer-group-button').disabled = !enabled;
            document.getElementById('delete-layer-group-button').disabled = !enabled;
        });
        document.getElementById('bottom-panel-toggle').addEventListener('click', () => this.toggleBottomPanel());
        document.getElementById('place-asset-button').addEventListener('click', () => {
            this.canvasEngine.setTool('place-asset');
            this.openAssetLibrary();
        });
        document.getElementById('open-asset-library').addEventListener('click', () => this.openAssetLibrary());
        document.getElementById('asset-pack-file').addEventListener('change', event => this.handleAssetPackFile(event));
        document.getElementById('asset-library-search').addEventListener('input', event => {
            this.assetLibraryState.query = event.target.value;
            this.assetLibraryState.selectedKey = null;
            this.renderAssetLibrary();
        });
        document.getElementById('asset-library-pack-filter').addEventListener('change', event => {
            this.assetLibraryState.packId = event.target.value;
            this.assetLibraryState.selectedKey = null;
            this.renderAssetLibrary();
        });
        document.getElementById('asset-library-category-filter').addEventListener('change', event => {
            this.assetLibraryState.category = event.target.value;
            this.assetLibraryState.selectedKey = null;
            this.renderAssetLibrary();
        });
        document.getElementById('asset-library-import').addEventListener('click', () => document.getElementById('asset-pack-file').click());
        document.getElementById('asset-library-close').addEventListener('click', () => document.getElementById('asset-library-dialog').close());
        document.getElementById('asset-library-list').addEventListener('click', event => this.handleAssetLibraryListClick(event));
        document.getElementById('asset-library-pack-list').addEventListener('click', event => this.handleAssetPackAction(event));
        document.getElementById('asset-library-select').addEventListener('click', () => this.applyAssetLibrarySelection());
        document.querySelectorAll('[data-tool]').forEach(button => {
            button.addEventListener('click', () => this.canvasEngine.setTool(button.dataset.tool));
        });
        for (const id of ['tool-color', 'tool-size', 'tool-terrain', 'tool-icon', 'tool-text']) {
            document.getElementById(id).addEventListener('input', () => this.updateActiveToolOptions());
            document.getElementById(id).addEventListener('change', () => this.updateActiveToolOptions());
        }
        document.getElementById('undo-action').addEventListener('click', () => this.canvasEngine.undo());
        document.getElementById('redo-action').addEventListener('click', () => this.canvasEngine.redo());
        document.getElementById('selection-form').addEventListener('submit', event => this.handleSelectionSubmit(event));
        document.getElementById('delete-selection').addEventListener('click', () => this.deleteSelection());
        document.getElementById('duplicate-selection-action').addEventListener('click', () => this.duplicateSelection());
        document.getElementById('delete-selection-action').addEventListener('click', () => this.deleteSelection());
        document.getElementById('export-project-button').addEventListener('click', () => {
            if (this.currentProject) this.exportProject(this.currentProject);
        });
        document.addEventListener('keydown', event => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
                event.preventDefault();
                if (this.currentProject) this.saveCurrentProject();
            }
        });
    }

    openAssetLibrary() {
        const dialog = document.getElementById('asset-library-dialog');
        this.assetLibraryState.selectedKey = null;
        document.getElementById('asset-library-search').value = this.assetLibraryState.query;
        this.renderAssetLibrary();
        if (!dialog.open) dialog.showModal();
    }

    renderAssetLibrary() {
        const toolId = this.canvasEngine.toolManager.activeToolId;
        const definition = TOOL_DEFINITIONS.find(item => item.id === toolId);
        const binding = this.canvasEngine.toolManager.getAssetBinding(toolId);
        const tool = this.canvasEngine.toolManager.getTool(toolId);
        const canSelect = Boolean(binding && ['place-asset', 'icon', 'terrain', 'lake', 'border'].includes(toolId) && typeof tool.setAssetSelection === 'function');
        const packs = this.assetRegistry.listPacks();
        const packFilter = document.getElementById('asset-library-pack-filter');
        const previousPack = this.assetLibraryState.packId;
        packFilter.innerHTML = '<option value="">Tất cả Asset Pack</option>' + packs.map(pack =>
            `<option value="${this.escapeHtml(pack.id)}">${this.escapeHtml(pack.name)} (${pack.assetCount})</option>`
        ).join('');
        if (packs.some(pack => pack.id === previousPack)) packFilter.value = previousPack;
        else this.assetLibraryState.packId = '';
        const compatibleAssets = binding
            ? this.canvasEngine.toolManager.listAssetsForTool(toolId, {
                packId: this.assetLibraryState.packId || null
            })
            : this.assetRegistry.listAssets({ packId: this.assetLibraryState.packId || null });
        const assets = filterAssetLibraryAssets(compatibleAssets, {
            category: this.assetLibraryState.category,
            query: this.assetLibraryState.query
        });
        const categories = listAssetLibraryCategories(compatibleAssets);
        const categoryFilter = document.getElementById('asset-library-category-filter');
        const previousCategory = this.assetLibraryState.category;
        categoryFilter.innerHTML = '<option value="">Tất cả danh mục</option>' + categories.map(category =>
            `<option value="${this.escapeHtml(category)}">${this.escapeHtml(category)}</option>`
        ).join('');
        if (categories.includes(previousCategory)) categoryFilter.value = previousCategory;
        else this.assetLibraryState.category = '';
        document.getElementById('asset-library-active-tool').textContent =
            `Công cụ hiện tại: ${definition?.label || toolId}`;
        document.getElementById('asset-library-compatibility').textContent = canSelect
            ? 'Các tài nguyên bên dưới tương thích và có thể chọn cho công cụ hiện tại.'
            : binding
                ? 'Đã lọc theo khả năng của công cụ. Tích hợp asset-backed cho công cụ này sẽ được mở khóa theo từng bước trong Phase 3C.'
                : 'Đang hiển thị toàn bộ tài nguyên đã bật. Hãy chọn một công cụ có hỗ trợ Asset Pack để áp dụng.';
        document.getElementById('asset-library-select').disabled = !canSelect || !this.assetLibraryState.selectedKey;
        document.getElementById('asset-library-count').textContent = `${assets.length} tài nguyên phù hợp`;
        const list = document.getElementById('asset-library-list');
        list.innerHTML = assets.map(asset => {
            const key = `${asset.packId}::${asset.id}`;
            let thumbnail = '';
            try {
                const loaded = this.assetLoader.load(asset.packId, asset.id);
                thumbnail = `<img src="${loaded.url}" alt="" loading="lazy" class="h-24 w-full object-contain">`;
            } catch {}
            return `<button type="button" data-asset-key="${this.escapeHtml(key)}"
                class="min-w-0 rounded border p-2 text-left transition ${this.assetLibraryState.selectedKey === key ? 'border-wfs-primary bg-blue-950/40' : 'border-wfs-border bg-wfs-bg hover:border-gray-500'}">
                <div class="flex h-24 items-center justify-center overflow-hidden rounded bg-black/20">${thumbnail || '<span class="text-xs text-wfs-muted">No preview</span>'}</div>
                <div class="mt-2 truncate text-xs font-medium text-white">${this.escapeHtml(asset.name)}</div>
                <div class="mt-1 truncate text-[10px] text-wfs-muted">${this.escapeHtml(asset.category)} · ${this.escapeHtml(asset.packName)}</div>
            </button>`;
        }).join('') || '<div class="col-span-full rounded border border-dashed border-wfs-border p-8 text-center text-xs text-wfs-muted">Không có tài nguyên phù hợp. Hãy đổi bộ lọc hoặc nhập Asset Pack khác.</div>';
        const selected = this.assetLibraryState.selectedKey
            ? this.assetRegistry.getAsset(...this.assetLibraryState.selectedKey.split('::'))
            : null;
        const preview = document.getElementById('asset-library-preview');
        if (selected) {
            try {
                const loaded = this.assetLoader.load(selected.packId, selected.id);
                preview.innerHTML = `<div class="flex h-48 items-center justify-center rounded bg-black/20 p-3"><img src="${loaded.url}" alt="" class="max-h-full max-w-full object-contain"></div>
                    <h3 class="mt-3 font-semibold text-white">${this.escapeHtml(selected.name)}</h3>
                    <p class="mt-1 text-xs text-wfs-muted">${this.escapeHtml(selected.packName)} · ${this.escapeHtml(selected.category)}</p>
                    <p class="mt-2 text-xs text-wfs-muted">${this.escapeHtml(selected.description || 'Không có mô tả.')}</p>
                    <p class="mt-2 break-all text-[10px] text-wfs-muted">${this.escapeHtml(selected.packId)}::${this.escapeHtml(selected.id)}</p>`;
            } catch (error) {
                preview.textContent = `Không thể xem trước: ${error.message}`;
            }
        } else {
            preview.innerHTML = '<div class="flex h-48 items-center justify-center rounded border border-dashed border-wfs-border text-xs text-wfs-muted">Chọn một tài nguyên để xem trước</div>';
        }
        document.getElementById('asset-library-select').disabled = !canSelect || !selected;
        this.renderAssetPackList(packs);
    }

    renderAssetPackList(packs = this.assetRegistry.listPacks()) {
        const host = document.getElementById('asset-library-pack-list');
        host.innerHTML = packs.map(pack => `<div class="flex items-center justify-between gap-2 border-b border-wfs-border py-2 last:border-0">
            <div class="min-w-0"><div class="truncate text-xs font-medium text-white">${this.escapeHtml(pack.name)}</div>
            <div class="truncate text-[10px] text-wfs-muted">${this.escapeHtml(pack.version)} · ${pack.assetCount} assets · ${pack.enabled ? 'Đang bật' : 'Đang tắt'}</div></div>
            <div class="flex shrink-0 gap-1">
                <button type="button" data-pack-action="toggle" data-pack-id="${this.escapeHtml(pack.id)}" class="rounded border border-wfs-border px-2 py-1 text-[10px] hover:bg-wfs-hover">${pack.enabled ? 'Tắt' : 'Bật'}</button>
                <button type="button" data-pack-action="remove" data-pack-id="${this.escapeHtml(pack.id)}" class="rounded border border-red-900 px-2 py-1 text-[10px] text-red-300 hover:bg-red-950">Gỡ</button>
            </div>
        </div>`).join('') || '<p class="py-3 text-xs text-wfs-muted">Chưa có Asset Pack nào được nhập.</p>';
    }

    handleAssetLibraryListClick(event) {
        const button = event.target.closest('button[data-asset-key]');
        if (!button) return;
        this.assetLibraryState.selectedKey = button.dataset.assetKey;
        this.renderAssetLibrary();
    }

    handleAssetPackAction(event) {
        const button = event.target.closest('button[data-pack-action]');
        if (!button) return;
        const { packAction, packId } = { packAction: button.dataset.packAction, packId: button.dataset.packId };
        try {
            if (packAction === 'toggle') {
                const pack = this.assetRegistry.getPack(packId);
                if (!pack) return;
                const wasEnabled = pack.enabled;
                this.assetPackService.setPackEnabled(packId, !wasEnabled);
                if (wasEnabled) this.clearToolAssetSelections(packId);
                this.notify(`Đã ${wasEnabled ? 'tắt' : 'bật'} Asset Pack "${pack.manifest.name}".`);
            } else if (packAction === 'remove') {
                const pack = this.assetRegistry.getPack(packId);
                if (!pack) return;
                if (!window.confirm(`Gỡ Asset Pack "${pack.manifest.name}" khỏi phiên làm việc hiện tại?`)) return;
                this.assetPackService.uninstallPack(packId);
                this.clearToolAssetSelections(packId);
                if (this.assetLibraryState.packId === packId) this.assetLibraryState.packId = '';
                this.notify(`Đã gỡ Asset Pack "${pack.manifest.name}".`);
            }
            this.assetLibraryState.selectedKey = null;
            this.renderAssetLibrary();
        } catch (error) {
            this.notify(`Không thể quản lý Asset Pack: ${error.message}`, true);
        }
    }

    clearToolAssetSelections(packId) {
        for (const definition of TOOL_DEFINITIONS) {
            const tool = this.canvasEngine.toolManager.getTool(definition.id);
            if (tool?.assetSelection?.asset?.packId === packId) tool.clearAssetSelection?.();
        }
    }

    applyAssetLibrarySelection() {
        const key = this.assetLibraryState.selectedKey;
        if (!key) return;
        const [packId, assetId] = key.split('::');
        try {
            const resolved = this.canvasEngine.toolManager.selectAssetForActiveTool({
                packId, assetId
            });
            const toolId = this.canvasEngine.toolManager.activeToolId;
            if (toolId === 'icon') {
                this.notify(`Đã chọn biểu tượng "${resolved.asset.name}". Click trên bản đồ để đặt icon.`);
            } else if (toolId === 'lake') {
                this.notify(`Đã chọn texture mặt nước "${resolved.asset.name}". Kéo trên bản đồ để tạo hồ.`);
            } else if (toolId === 'border') {
                this.notify(`Đã chọn họa tiết đường biên "${resolved.asset.name}". Vẽ đường biên trên bản đồ để áp dụng.`);
            } else if (toolId === 'terrain') {
                this.notify(`Đã chọn địa hình "${resolved.asset.name}". Click trên bản đồ để đặt dấu địa hình.`);
            } else if (toolId === 'place-asset') {
                this.notify(`Đã chọn "${resolved.asset.name}". Click hoặc kéo trên bản đồ để đặt asset.`);
            } else {
                this.notify(`Đã gắn asset "${resolved.asset.name}" với công cụ hiện tại.`);
            }
            document.getElementById('asset-library-dialog').close();
        } catch (error) {
            this.notify(`Không thể chọn asset: ${error.message}`, true);
        }
    }

    async handleAssetPackFile(event) {
        const input = event.currentTarget;
        const file = input.files?.[0];
        if (!file) return;
        try {
            const pack = this.assetPackService.installPack(await file.arrayBuffer());
            this.assetLibraryState.packId = pack.manifest.id;
            this.assetLibraryState.category = '';
            this.assetLibraryState.query = '';
            this.assetLibraryState.selectedKey = null;
            document.getElementById('asset-library-search').value = '';
            this.renderAssetLibrary();
            this.notify(`Đã nhập Asset Pack "${pack.manifest.name}" với ${pack.manifest.assets.length} tài nguyên.`);
        } catch (error) {
            this.notify(`Không thể nhập Asset Pack: ${error.message}`, true);
        } finally {
            input.value = '';
        }
    }

    async renderProjectLists() {
        try {
            const [projects, recentProjects] = await Promise.all([
                this.projectService.getProjects(),
                this.projectService.getRecentProjects()
            ]);
            document.getElementById('project-list').innerHTML = projects.map(project => this.projectCard(project)).join('');
            document.getElementById('recent-project-list').innerHTML = recentProjects
                .map(project => this.projectCard(project, true))
                .join('');
            document.getElementById('project-count').textContent = `${projects.length} dự án`;
            document.getElementById('project-empty').classList.toggle('hidden', projects.length > 0);
            document.getElementById('recent-project-empty').classList.toggle('hidden', recentProjects.length > 0);
        } catch (error) {
            this.notify(`Không thể tải danh sách dự án: ${error.message}`, true);
        }
    }

    projectCard(project, recent = false) {
        const cover = project.coverImage
            ? `<img src="${this.escapeHtml(project.coverImage)}" alt="" class="h-full w-full object-cover">`
            : '<div class="project-cover flex h-full items-center justify-center text-3xl font-semibold text-white/80">W</div>';
        const updated = this.formatDate(project.updatedAt);
        const actions = recent
            ? `<button data-action="open" data-id="${this.escapeHtml(project.id)}" class="rounded bg-wfs-primary px-3 py-1.5 text-xs text-white hover:bg-blue-600">Mở gần đây</button>
               <button data-action="info" data-id="${this.escapeHtml(project.id)}" class="rounded border border-wfs-border px-3 py-1.5 text-xs hover:bg-wfs-hover">Thông tin</button>`
            : `<button data-action="open" data-id="${this.escapeHtml(project.id)}" class="rounded bg-wfs-primary px-3 py-1.5 text-xs text-white hover:bg-blue-600">Mở</button>
               <button data-action="info" data-id="${this.escapeHtml(project.id)}" class="rounded border border-wfs-border px-3 py-1.5 text-xs hover:bg-wfs-hover">Thông tin</button>
               <button data-action="rename" data-id="${this.escapeHtml(project.id)}" class="rounded border border-wfs-border px-3 py-1.5 text-xs hover:bg-wfs-hover">Đổi tên</button>
               <button data-action="duplicate" data-id="${this.escapeHtml(project.id)}" class="rounded border border-wfs-border px-3 py-1.5 text-xs hover:bg-wfs-hover">Sao chép</button>
               <button data-action="export" data-id="${this.escapeHtml(project.id)}" class="rounded border border-wfs-border px-3 py-1.5 text-xs hover:bg-wfs-hover">Xuất</button>
               <button data-action="delete" data-id="${this.escapeHtml(project.id)}" class="rounded border border-red-900 px-3 py-1.5 text-xs text-red-300 hover:bg-red-950">Xóa</button>`;

        return `<article class="overflow-hidden rounded-lg border border-wfs-border bg-wfs-panel">
            <div class="project-cover h-32 overflow-hidden">${cover}</div>
            <div class="space-y-3 p-4">
                <div>
                    <h3 class="truncate font-semibold text-white">${this.escapeHtml(project.name)}</h3>
                    <p class="mt-1 h-10 overflow-hidden text-xs text-wfs-muted">${this.escapeHtml(project.description || 'Chưa có mô tả')}</p>
                </div>
                <div class="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-wfs-muted">
                    <span>Cập nhật: ${this.escapeHtml(updated)}</span>
                    ${recent ? '<span>Gần đây</span>' : ''}
                </div>
                <div class="flex flex-wrap gap-2 border-t border-wfs-border pt-3">${actions}</div>
            </div>
        </article>`;
    }

    openProjectForm(project = null) {
        this.editingProjectId = project ? project.id : null;
        document.getElementById('project-form-title').textContent = project ? 'Chỉnh sửa dự án' : 'Tạo dự án';
        document.getElementById('project-name').value = project ? project.name : '';
        document.getElementById('project-description').value = project ? project.description : '';
        document.getElementById('project-cover').value = project ? project.coverImage : '';
        document.getElementById('project-cover-file').value = '';
        document.getElementById('project-form-dialog').showModal();
        document.getElementById('project-name').focus();
    }

    async handleProjectFormSubmit(event) {
        event.preventDefault();
        const input = {
            name: document.getElementById('project-name').value,
            description: document.getElementById('project-description').value,
            coverImage: document.getElementById('project-cover').value
        };
        try {
            const project = this.editingProjectId
                ? await this.projectService.updateProject(this.editingProjectId, input)
                : await this.projectService.createProject(input);
            document.getElementById('project-form-dialog').close();
            await this.renderProjectLists();
            this.notify(this.editingProjectId ? 'Đã cập nhật thông tin dự án.' : 'Đã tạo dự án thành công.');
            if (this.currentProject && this.currentProject.id === project.id) this.currentProject = project;
        } catch (error) {
            this.notify(`Không thể lưu dự án: ${error.message}`, true);
        }
    }

    async handleCoverFile(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        if (file.size > MAX_COVER_FILE_SIZE) {
            event.target.value = '';
            this.notify('Ảnh bìa vượt quá giới hạn 2 MB.', true);
            return;
        }
        try {
            const cover = await this.readFileAsDataURL(file);
            document.getElementById('project-cover').value = cover;
        } catch (error) {
            this.notify(`Không thể đọc ảnh bìa: ${error.message}`, true);
        }
    }

    async handleProjectAction(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const { action, id } = button.dataset;
        try {
            const project = action === 'open'
                ? await this.projectService.openProject(id)
                : await this.projectService.getProject(id);
            if (!project) throw new Error('Project not found.');
            if (action === 'open') {
                this.openInStudio(project);
            } else if (action === 'info') {
                this.showProjectInfo(project);
            } else if (action === 'rename') {
                this.openProjectForm(project);
            } else if (action === 'duplicate') {
                const copy = await this.projectService.duplicateProject(id);
                await this.renderProjectLists();
                this.notify(`Đã sao chép dự án thành "${copy.name}".`);
            } else if (action === 'export') {
                this.exportProject(project);
            } else if (action === 'delete') {
                if (window.confirm(`Xóa vĩnh viễn dự án "${project.name}"? Thao tác này không thể hoàn tác.`)) {
                    await this.projectService.deleteProject(id);
                    if (this.currentProject && this.currentProject.id === id) this.currentProject = null;
                    await this.renderProjectLists();
                    this.notify(`Đã xóa dự án "${project.name}".`);
                }
            }
        } catch (error) {
            this.notify(`Thao tác thất bại: ${error.message}`, true);
        }
    }

    async handleInfoAction(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        if (button.dataset.action === 'close') {
            document.getElementById('project-info-dialog').close();
            return;
        }
        if (button.dataset.action === 'edit') {
            try {
                const project = await this.projectService.getProject(button.dataset.id);
                if (!project) throw new Error('Project not found.');
                document.getElementById('project-info-dialog').close();
                this.openProjectForm(project);
            } catch (error) {
                this.notify(`Không thể mở thông tin dự án: ${error.message}`, true);
            }
        }
    }

    showProjectInfo(project) {
        document.getElementById('project-info-content').innerHTML = `
            <div class="mb-5 flex items-start justify-between gap-4">
                <div><h2 class="text-lg font-semibold text-white">${this.escapeHtml(project.name)}</h2>
                <p class="mt-1 text-xs text-wfs-muted">Thông tin dự án</p></div>
                <button data-action="close" class="rounded px-2 py-1 text-wfs-muted hover:bg-wfs-hover" aria-label="Đóng">✕</button>
            </div>
            ${project.coverImage ? `<img src="${this.escapeHtml(project.coverImage)}" alt="Ảnh bìa" class="mb-4 max-h-48 w-full rounded object-cover">` : ''}
            <p class="mb-5 whitespace-pre-wrap text-sm text-wfs-muted">${this.escapeHtml(project.description || 'Chưa có mô tả')}</p>
            <dl class="grid grid-cols-[130px_1fr] gap-y-3 border-t border-wfs-border pt-4 text-xs">
                <dt class="text-wfs-muted">Project ID</dt><dd class="break-all font-mono">${this.escapeHtml(project.id)}</dd>
                <dt class="text-wfs-muted">Ngày tạo</dt><dd>${this.escapeHtml(this.formatDate(project.createdAt))}</dd>
                <dt class="text-wfs-muted">Cập nhật</dt><dd>${this.escapeHtml(this.formatDate(project.updatedAt))}</dd>
                <dt class="text-wfs-muted">Schema Version</dt><dd>${this.escapeHtml(String(project.schemaVersion))}</dd>
            </dl>
            <div class="mt-6 flex justify-end gap-2">
                <button data-action="close" class="rounded border border-wfs-border px-4 py-2 hover:bg-wfs-hover">Đóng</button>
                <button data-action="edit" data-id="${this.escapeHtml(project.id)}" class="rounded bg-wfs-primary px-4 py-2 text-white hover:bg-blue-600">Chỉnh sửa</button>
            </div>`;
        document.getElementById('project-info-dialog').showModal();
    }

    async handleImportFile(event) {
        const file = event.target.files && event.target.files[0];
        event.target.value = '';
        if (!file) return;
        if (file.size > MAX_IMPORT_SIZE) {
            this.notify('Tệp nhập vượt quá giới hạn 100 MB.', true);
            return;
        }
        try {
            const prefix = new Uint8Array(await file.slice(0, 4).arrayBuffer());
            const isZip = file.name.toLowerCase().endsWith('.wforge') ||
                prefix[0] === 0x50 && prefix[1] === 0x4b;
            const result = isZip
                ? await this.projectService.importProjectPackage(new Uint8Array(await file.arrayBuffer()))
                : await this.projectService.importProject(JSON.parse(await file.text()));
            await this.renderProjectLists();
            this.notify(result.idChanged
                ? `Đã nhập dự án với ID mới để tránh ghi đè: "${result.project.name}".`
                : `Đã nhập dự án "${result.project.name}" thành công.`);
        } catch (error) {
            this.notify(`Không thể nhập dự án: ${error.message}`, true);
        }
    }

    openInStudio(project) {
        const geographyService = new GeographyService(project.data && project.data.geography
            ? project.data.geography
            : {});
        const civilizationService = new CivilizationService(
            project.data && project.data.civilization ? project.data.civilization : {},
            geographyService.data
        );
        const historyService = new HistoryService(
            project.data && project.data.history ? project.data.history : {},
            geographyService.data,
            civilizationService.data
        );
        this.currentProject = project;
        this.geographyService = geographyService;
        this.civilizationService = civilizationService;
        this.historyService = historyService;
        project.data = {
            ...(project.data || {}),
            geography: this.geographyService.data,
            civilization: this.civilizationService.data,
            history: this.historyService.data
        };
        this.canvasEngine.setMap(project.data.map || createEmptyMap());
        document.getElementById('current-project-name').textContent = project.name;
        document.getElementById('project-manager').classList.add('hidden');
        const shell = document.getElementById('studio-shell');
        shell.classList.remove('hidden');
        shell.classList.add('flex');
        this.canvasEngine.resizeCanvas();
        this.canvasEngine.fitToScreen();
        this.updateMapDimensions();
        this.renderLayers();
        document.getElementById('save-status').textContent = 'Đã lưu';
        this.notify(`Đã mở dự án "${project.name}".`);
    }

    showProjectManager() {
        const shell = document.getElementById('studio-shell');
        shell.classList.add('hidden');
        shell.classList.remove('flex');
        document.getElementById('project-manager').classList.remove('hidden');
        this.renderProjectLists();
    }

    async saveCurrentProject() {
        if (!this.currentProject) {
            this.notify('Mở một dự án trước khi lưu.', true);
            return;
        }
        const status = document.getElementById('save-status');
        status.textContent = 'Đang lưu...';
        try {
            if (this.historyService) {
                this.historyService.geography = this.geographyService ? this.geographyService.data : {};
                this.historyService.civilization = this.civilizationService ? this.civilizationService.data : {};
                this.historyService.validateRelations();
            }
            const data = {
                ...(this.currentProject.data || {}),
                map: this.canvasEngine.getMapData(),
                geography: this.geographyService ? this.geographyService.data : {},
                civilization: this.civilizationService ? this.civilizationService.data : {},
                history: this.historyService ? this.historyService.data : {}
            };
            this.currentProject = await this.projectService.saveProject(this.currentProject.id, data);
            status.textContent = 'Đã lưu';
            await this.renderProjectLists();
            this.notify(`Đã lưu dự án "${this.currentProject.name}".`);
        } catch (error) {
            status.textContent = 'Lưu thất bại';
            this.notify(`Không thể lưu dự án: ${error.message}`, true);
        }
    }

    handleMapChange(map, reason) {
        if (!this.currentProject) return;
        this.syncGeographyWithMap(map);
        if (this.civilizationService) this.civilizationService.geography = this.geographyService.data;
        if (this.historyService) {
            this.historyService.geography = this.geographyService.data;
            this.historyService.civilization = this.civilizationService.data;
        }
        this.currentProject.data = {
            ...(this.currentProject.data || {}),
            map,
            geography: this.geographyService ? this.geographyService.data : {},
            civilization: this.civilizationService ? this.civilizationService.data : {},
            history: this.historyService ? this.historyService.data : {}
        };
        document.getElementById('save-status').textContent = 'Chưa lưu';
        this.updateMapDimensions();
        if (!['move-object', 'edit-object'].includes(reason)) this.renderLayers();
    }

    openGeographyDatabase(type = this.activeGeographyType, id = null) {
        if (!this.currentProject || !this.geographyService) {
            this.notify('Mở một dự án trước khi truy cập Geography Database.', true);
            return;
        }
        this.setGeographyType(type);
        const dialog = document.getElementById('geography-dialog');
        if (!dialog.open) dialog.showModal();
        if (id) this.showGeographyDetail(id);
    }

    setGeographyType(type) {
        if (!ENTITY_TYPES.includes(type)) return;
        this.activeGeographyType = type;
        this.selectedGeographyId = null;
        this.editingGeographyId = null;
        document.getElementById('geography-search').value = '';
        document.getElementById('geography-form').innerHTML = '';
        document.querySelectorAll('#geography-tabs [data-geo-type]').forEach(button => {
            const active = button.dataset.geoType === type;
            button.className = active
                ? 'rounded bg-wfs-primary px-3 py-1.5 text-xs text-white'
                : 'rounded border border-wfs-border px-3 py-1.5 text-xs text-wfs-muted';
        });
        document.getElementById('geography-form').classList.add('hidden');
        document.getElementById('geography-detail').classList.remove('hidden');
        document.getElementById('geography-detail').textContent = 'Chọn một bản ghi để xem chi tiết hoặc tạo bản ghi mới.';
        this.renderGeographyFilter();
        this.renderGeographyList();
    }

    geographyParent(type = this.activeGeographyType) {
        return {
            worlds: null,
            continents: { field: 'worldId', type: 'worlds', label: 'World', relation: 'world' },
            countries: { field: 'continentId', type: 'continents', label: 'Continent', relation: 'continent' },
            cities: { field: 'countryId', type: 'countries', label: 'Country', relation: 'country' },
            locations: { field: 'cityId', type: 'cities', label: 'City', relation: 'city' }
        }[type];
    }

    geographySingular(type) {
        return {
            worlds: 'world',
            continents: 'continent',
            countries: 'country',
            cities: 'city / settlement',
            locations: 'location'
        }[type] || type;
    }

    renderGeographyFilter() {
        const select = document.getElementById('geography-filter');
        const parent = this.geographyParent();
        select.innerHTML = parent
            ? `<option value="">All ${this.escapeHtml(parent.type)}</option>${this.geographyService.getAll(parent.type)
                .map(item => `<option value="${this.escapeHtml(item.id)}">${this.escapeHtml(item.name)}</option>`).join('')}`
            : '<option value="">All worlds</option>';
        select.disabled = !parent;
    }

    renderGeographyList() {
        if (!this.geographyService) return;
        const parent = this.geographyParent();
        const filters = parent && document.getElementById('geography-filter').value
            ? { [parent.field]: document.getElementById('geography-filter').value }
            : {};
        const records = this.geographyService.search(this.activeGeographyType, {
            query: document.getElementById('geography-search').value,
            filters
        });
        document.getElementById('geography-list').innerHTML = records.length
            ? records.map(record => `
                <button data-geo-id="${this.escapeHtml(record.id)}" class="block w-full rounded border ${record.id === this.selectedGeographyId ? 'border-wfs-primary bg-wfs-hover' : 'border-wfs-border'} px-3 py-2 text-left hover:bg-wfs-hover">
                    <span class="block truncate text-xs font-medium text-white">${this.escapeHtml(record.name)}</span>
                    <span class="mt-1 block truncate text-[10px] text-wfs-muted">${this.escapeHtml(record.description || record.id)}</span>
                </button>`).join('')
            : '<p class="rounded border border-dashed border-wfs-border p-5 text-center text-xs text-wfs-muted">Không có bản ghi phù hợp.</p>';
    }

    showGeographyDetail(id) {
        const detail = this.geographyService.getDetail(this.activeGeographyType, id);
        if (!detail) {
            this.notify('Không tìm thấy bản ghi địa lý.', true);
            return;
        }
        this.selectedGeographyId = id;
        this.editingGeographyId = null;
        document.getElementById('geography-form').classList.add('hidden');
        const panel = document.getElementById('geography-detail');
        panel.classList.remove('hidden');
        const parent = this.geographyParent();
        const relatedName = parent ? detail[parent.relation]?.name : null;
        const extra = this.activeGeographyType === 'countries'
            ? `<dt class="text-wfs-muted">Thủ đô</dt><dd>${this.escapeHtml(detail.settlements.find(city => city.id === detail.capitalCityId)?.name || 'Chưa thiết lập')}</dd>
                <dt class="text-wfs-muted">Settlements</dt><dd>${this.escapeHtml(detail.settlements.map(city => city.name).join(', ') || '—')}</dd>`
            : this.activeGeographyType === 'cities'
                ? `<dt class="text-wfs-muted">Loại settlement</dt><dd>${detail.settlementType === 'capital' ? 'Capital' : 'Settlement'}</dd>
                    <dt class="text-wfs-muted">Locations</dt><dd>${detail.locations.length}</dd>`
                : this.activeGeographyType === 'locations'
                    ? `<dt class="text-wfs-muted">Event IDs</dt><dd class="break-all">${this.escapeHtml(detail.eventIds.join(', ') || '—')}</dd>`
                    : '';
        const position = detail.mapPosition
            ? `${detail.mapPosition.x.toFixed(1)}, ${detail.mapPosition.y.toFixed(1)}`
            : 'Chưa liên kết';
        panel.innerHTML = `
            <div class="mb-4 flex items-start justify-between gap-3">
                <div><h3 class="text-base font-semibold text-white">${this.escapeHtml(detail.name)}</h3>
                <p class="mt-1 text-[10px] text-wfs-muted">${this.escapeHtml(this.geographySingular(this.activeGeographyType))} · ${this.escapeHtml(detail.id)}</p></div>
                <button data-geo-action="edit" class="rounded border border-wfs-border px-2 py-1 text-xs hover:bg-wfs-hover">Sửa</button>
            </div>
            <p class="mb-4 whitespace-pre-wrap text-xs text-wfs-muted">${this.escapeHtml(detail.description || 'Chưa có mô tả')}</p>
            <dl class="grid grid-cols-[110px_1fr] gap-y-2 border-t border-wfs-border pt-3 text-xs">
                ${parent ? `<dt class="text-wfs-muted">${this.escapeHtml(parent.label)}</dt><dd>${this.escapeHtml(relatedName || '—')}</dd>` : ''}
                ${extra}
                <dt class="text-wfs-muted">Tọa độ bản đồ</dt><dd>${this.escapeHtml(position)}</dd>
                <dt class="text-wfs-muted">Map Object ID</dt><dd class="break-all font-mono">${this.escapeHtml(detail.mapObjectId || '—')}</dd>
                <dt class="text-wfs-muted">Tạo lúc</dt><dd>${this.escapeHtml(this.formatDate(detail.createdAt))}</dd>
                <dt class="text-wfs-muted">Cập nhật</dt><dd>${this.escapeHtml(this.formatDate(detail.updatedAt))}</dd>
            </dl>
            <div class="mt-5 flex flex-wrap gap-2">
                ${detail.mapPosition ? '<button data-geo-action="focus" class="rounded bg-wfs-primary px-3 py-2 text-xs text-white">Đến vị trí trên bản đồ</button>' : ''}
                ${this.canvasEngine.selectedObjectId ? '<button data-geo-action="link" class="rounded border border-wfs-border px-3 py-2 text-xs hover:bg-wfs-hover">Liên kết đối tượng đang chọn</button>' : ''}
                <button data-geo-action="delete" class="rounded border border-red-900 px-3 py-2 text-xs text-red-300">Xóa</button>
            </div>`;
        this.renderGeographyList();
    }

    openGeographyForm(record = null) {
        if (!this.geographyService) return;
        this.editingGeographyId = record ? record.id : null;
        this.geographyCityTypeTouched = false;
        document.getElementById('geography-detail').classList.add('hidden');
        const form = document.getElementById('geography-form');
        form.innerHTML = '';
        form.classList.remove('hidden');
        this.renderGeographyFormFields(record);
    }

    renderGeographyFormFields(record = null) {
        const form = document.getElementById('geography-form');
        const values = Object.fromEntries(new FormData(form).entries());
        const existing = record || (this.editingGeographyId
            ? this.geographyService.get(this.activeGeographyType, this.editingGeographyId)
            : null);
        const parent = this.geographyParent();
        const selectedParentId = parent
            ? (values[parent.field] || existing?.[parent.field] || '')
            : '';
        const parentSelect = parent
            ? `<label class="block text-xs text-wfs-muted">${this.escapeHtml(parent.label)} *
                <select required name="${parent.field}" data-geo-parent class="mt-1 w-full rounded border border-wfs-border bg-wfs-bg px-3 py-2 text-white">
                    <option value="">Chọn ${this.escapeHtml(parent.label)}</option>
                    ${this.geographyService.getAll(parent.type).map(item =>
                        `<option value="${this.escapeHtml(item.id)}" ${item.id === selectedParentId ? 'selected' : ''}>${this.escapeHtml(item.name)}</option>`).join('')}
                </select>
            </label>`
            : '';
        const selectedCountry = this.activeGeographyType === 'cities' && selectedParentId
            ? this.geographyService.get('countries', selectedParentId)
            : null;
        const defaultSettlementType = existing?.settlementType ||
            (selectedCountry && selectedCountry.capitalCityId ? 'settlement' : 'capital');
        const capitalField = this.activeGeographyType === 'countries'
            ? `<label class="block text-xs text-wfs-muted">Capital city
                <select name="capitalCityId" class="mt-1 w-full rounded border border-wfs-border bg-wfs-bg px-3 py-2 text-white">
                    <option value="">Chưa thiết lập</option>
                    ${this.geographyService.getAll('cities').filter(city => city.countryId === selectedParentId)
                        .map(city => `<option value="${this.escapeHtml(city.id)}" ${city.id === (values.capitalCityId || existing?.capitalCityId) ? 'selected' : ''}>${this.escapeHtml(city.name)}</option>`).join('')}
                </select>
            </label>`
            : '';
        const cityKindField = this.activeGeographyType === 'cities'
            ? `<label class="block text-xs text-wfs-muted">Loại settlement
                <select name="settlementType" class="mt-1 w-full rounded border border-wfs-border bg-wfs-bg px-3 py-2 text-white">
                    <option value="settlement" ${(values.settlementType || defaultSettlementType) !== 'capital' ? 'selected' : ''}>Settlement</option>
                    <option value="capital" ${(values.settlementType || defaultSettlementType) === 'capital' ? 'selected' : ''}>Capital</option>
                </select>
            </label>`
            : '';
        const eventField = this.activeGeographyType === 'locations'
            ? `<label class="block text-xs text-wfs-muted">Event IDs (phân cách bằng dấu phẩy)
                <input name="eventIds" value="${this.escapeHtml(values.eventIds ?? (existing?.eventIds || []).join(', '))}" class="mt-1 w-full rounded border border-wfs-border bg-wfs-bg px-3 py-2 text-white" placeholder="event-id-1, event-id-2">
            </label>`
            : '';
        const mapPosition = existing?.mapPosition || {};
        form.innerHTML = `
            <div class="flex items-center justify-between">
                <h3 class="font-semibold text-white">${existing ? 'Chỉnh sửa' : 'Tạo'} ${this.escapeHtml(this.geographySingular(this.activeGeographyType))}</h3>
                <button type="button" data-geo-action="cancel-form" class="rounded px-2 py-1 text-xs text-wfs-muted hover:bg-wfs-hover">Hủy</button>
            </div>
            <label class="block text-xs text-wfs-muted">Tên *
                <input name="name" required maxlength="120" value="${this.escapeHtml(values.name ?? existing?.name ?? '')}" class="mt-1 w-full rounded border border-wfs-border bg-wfs-bg px-3 py-2 text-white">
            </label>
            ${parentSelect}
            ${capitalField}
            ${cityKindField}
            ${eventField}
            <label class="block text-xs text-wfs-muted">Mô tả
                <textarea name="description" maxlength="4000" rows="3" class="mt-1 w-full rounded border border-wfs-border bg-wfs-bg px-3 py-2 text-white">${this.escapeHtml(values.description ?? existing?.description ?? '')}</textarea>
            </label>
            <fieldset class="rounded border border-wfs-border p-3">
                <legend class="px-1 text-xs text-wfs-muted">Tọa độ bản đồ (world coordinates, tùy chọn)</legend>
                <div class="grid grid-cols-2 gap-2">
                    <label class="text-[10px] text-wfs-muted">X<input name="mapX" type="number" step="any" value="${values.mapX ?? mapPosition.x ?? ''}" class="mt-1 w-full rounded border border-wfs-border bg-wfs-bg px-2 py-1.5 text-white"></label>
                    <label class="text-[10px] text-wfs-muted">Y<input name="mapY" type="number" step="any" value="${values.mapY ?? mapPosition.y ?? ''}" class="mt-1 w-full rounded border border-wfs-border bg-wfs-bg px-2 py-1.5 text-white"></label>
                </div>
            </fieldset>
            <div class="flex justify-end gap-2 pt-2">
                <button type="button" data-geo-action="cancel-form" class="rounded border border-wfs-border px-3 py-2 text-xs hover:bg-wfs-hover">Hủy</button>
                <button type="submit" class="rounded bg-wfs-primary px-3 py-2 text-xs text-white">Lưu bản ghi</button>
            </div>`;
    }

    handleGeographySubmit(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        const x = formData.get('mapX');
        const y = formData.get('mapY');
        let mapPosition = null;
        if (x !== '' || y !== '') {
            mapPosition = { x: Number(x), y: Number(y) };
            if (x === '' || y === '' || !Number.isFinite(mapPosition.x) || !Number.isFinite(mapPosition.y)) {
                this.notify('Hãy nhập cả tọa độ X và Y hợp lệ.', true);
                return;
            }
        }
        const input = {
            name: formData.get('name'),
            description: formData.get('description'),
            mapPosition
        };
        const parent = this.geographyParent();
        if (parent) input[parent.field] = formData.get(parent.field);
        if (this.activeGeographyType === 'countries') input.capitalCityId = formData.get('capitalCityId') || null;
        if (this.activeGeographyType === 'cities') input.settlementType = formData.get('settlementType');
        if (this.activeGeographyType === 'locations') {
            input.eventIds = String(formData.get('eventIds') || '').split(',').map(id => id.trim()).filter(Boolean);
            const missingEvent = input.eventIds.find(id => !this.historyService || !this.historyService.get('events', id));
            if (missingEvent) {
                this.notify(`Event ID "${missingEvent}" không tồn tại trong dự án.`, true);
                return;
            }
        }
        const previous = this.editingGeographyId
            ? this.geographyService.get(this.activeGeographyType, this.editingGeographyId)
            : null;
        try {
            if (mapPosition || (previous && previous.mapObjectId)) {
                const linkedObject = previous && previous.mapObjectId
                    ? this.canvasEngine.findObject(previous.mapObjectId)
                    : null;
                const layer = linkedObject
                    ? this.canvasEngine.getMapData().layers.find(item => item.id === linkedObject.layerId)
                    : this.geographyLayer(this.activeGeographyType);
                if (!layer) throw new Error('Không có layer bản đồ phù hợp để tạo marker địa lý.');
                if (layer.locked || !layer.visible) throw new Error(`Layer "${layer.name}" phải hiển thị và được mở khóa.`);
            }
            const record = previous
                ? this.geographyService.update(this.activeGeographyType, previous.id, input)
                : this.geographyService.create(this.activeGeographyType, input);
            if (this.civilizationService) this.civilizationService.geography = this.geographyService.data;
            this.syncGeographyMapMarker(this.activeGeographyType, record, previous);
            this.markGeographyDirty();
            this.editingGeographyId = null;
            this.showGeographyDetail(record.id);
            this.notify(previous ? 'Đã cập nhật bản ghi địa lý.' : 'Đã tạo bản ghi địa lý.');
        } catch (error) {
            this.notify(`Không thể lưu bản ghi địa lý: ${error.message}`, true);
        }
    }

    syncGeographyMapMarker(type, record, previous) {
        if (!record.mapPosition) {
            if (record.mapObjectId) {
                const object = this.canvasEngine.findObject(record.mapObjectId);
                if (object) this.canvasEngine.updateObject(object.id, { entityType: null, entityId: null }, 'Unlink geography');
                this.geographyService.setMapLink(type, record.id, null, null);
            }
            return;
        }
        if (record.mapObjectId) {
            const object = this.canvasEngine.findObject(record.mapObjectId);
            if (!object) {
                this.geographyService.setMapLink(type, record.id, null, null);
                return this.syncGeographyMapMarker(type, this.geographyService.get(type, record.id), null);
            }
            const layer = this.canvasEngine.getMapData().layers.find(item => item.id === object.layerId);
            if (layer && layer.locked) throw new Error(`Layer "${layer.name}" is locked; the linked map object cannot be moved.`);
            this.canvasEngine.updateObject(object.id, {
                entityType: type,
                entityId: record.id,
                name: record.name
            }, 'Update geography link');
            const anchor = this.mapObjectAnchor(object);
            if (anchor && (anchor.x !== record.mapPosition.x || anchor.y !== record.mapPosition.y)) {
                this.canvasEngine.translateObject(object.id, record.mapPosition.x - anchor.x, record.mapPosition.y - anchor.y);
            }
            this.geographyService.setMapLink(type, record.id, object.id, record.mapPosition);
            return;
        }
        const layer = this.geographyLayer(type);
        if (!layer) throw new Error('Không có layer bản đồ phù hợp để tạo marker địa lý.');
        if (layer.locked || !layer.visible) throw new Error(`Layer "${layer.name}" phải hiển thị và được mở khóa để tạo marker.`);
        this.canvasEngine.setActiveLayer(layer.id);
        const marker = this.canvasEngine.addObject(layer.id, {
            id: `geo-map-${globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`}`,
            type: 'icon',
            icon: type === 'cities' && record.settlementType === 'capital'
                ? 'capital'
                : type === 'locations' ? 'village' : 'city',
            x: record.mapPosition.x,
            y: record.mapPosition.y,
            size: 18,
            color: '#fbbf24',
            name: record.name,
            entityType: type,
            entityId: record.id
        }, 'Create geography marker');
        this.geographyService.setMapLink(type, record.id, marker.id, record.mapPosition);
    }

    geographyLayer(type) {
        const targetId = {
            worlds: 'layer-borders',
            continents: 'layer-landmass',
            countries: 'layer-borders',
            cities: 'layer-cities',
            locations: 'layer-locations'
        }[type];
        const layers = this.canvasEngine.getMapData().layers;
        return layers.find(layer => layer.id === targetId) || layers.find(layer =>
            layer.id !== 'layer-background' && !layer.locked && layer.visible);
    }

    mapObjectAnchor(object) {
        if (object.type === 'rect') return { x: object.x + object.width / 2, y: object.y + object.height / 2 };
        if (object.type === 'path') return object.commands.find(command => command.type !== 'close') || null;
        if (object.type === 'terrain') return object.points[0] || null;
        return { x: object.x, y: object.y };
    }

    syncGeographyWithMap(map) {
        if (!this.geographyService) return;
        const objects = new Map(map.layers.flatMap(layer => layer.objects.map(object => [object.id, object])));
        for (const type of ENTITY_TYPES) {
            for (const record of this.geographyService.getAll(type)) {
                if (!record.mapObjectId) continue;
                const object = objects.get(record.mapObjectId);
                if (!object) {
                    this.geographyService.setMapLink(type, record.id, null, record.mapPosition);
                    continue;
                }
                const position = this.mapObjectAnchor(object);
                if (position && (!record.mapPosition || position.x !== record.mapPosition.x || position.y !== record.mapPosition.y)) {
                    this.geographyService.setMapLink(type, record.id, record.mapObjectId, position);
                }
            }
        }
        for (const object of objects.values()) {
            if (!ENTITY_TYPES.includes(object.entityType) || typeof object.entityId !== 'string') continue;
            const record = this.geographyService.get(object.entityType, object.entityId);
            if (!record || (record.mapObjectId && record.mapObjectId !== object.id)) continue;
            const position = this.mapObjectAnchor(object);
            if (position) this.geographyService.setMapLink(object.entityType, record.id, object.id, position);
        }
    }

    markGeographyDirty() {
        if (!this.currentProject) return;
        if (this.civilizationService) this.civilizationService.geography = this.geographyService.data;
        if (this.historyService) this.historyService.geography = this.geographyService.data;
        this.currentProject.data = {
            ...(this.currentProject.data || {}),
            geography: this.geographyService.data,
            history: this.historyService ? this.historyService.data : {}
        };
        document.getElementById('save-status').textContent = 'Chưa lưu';
    }

    handleGeographyAction(event) {
        const button = event.target.closest('button[data-geo-action]');
        if (!button) return;
        const action = button.dataset.geoAction;
        if (action === 'cancel-form') {
            this.editingGeographyId = null;
            document.getElementById('geography-form').classList.add('hidden');
            document.getElementById('geography-detail').classList.remove('hidden');
            return;
        }
        if (action === 'edit') {
            this.openGeographyForm(this.geographyService.get(this.activeGeographyType, this.selectedGeographyId));
            return;
        }
        const record = this.geographyService.get(this.activeGeographyType, this.selectedGeographyId);
        if (!record) return;
        try {
            if (action === 'focus' && record.mapPosition) {
                this.canvasEngine.centerOnWorld(record.mapPosition);
                if (record.mapObjectId) this.canvasEngine.setSelection(record.mapObjectId);
                return;
            }
            if (action === 'link') {
                const object = this.canvasEngine.findObject(this.canvasEngine.selectedObjectId);
                if (!object) throw new Error('Chọn một đối tượng trên bản đồ trước khi liên kết.');
                const existing = this.geographyService.getByMapObjectId(object.id);
                if (existing && (existing.type !== this.activeGeographyType || existing.record.id !== record.id)) {
                    throw new Error('Đối tượng bản đồ đã được liên kết với một bản ghi khác.');
                }
                const layer = this.canvasEngine.getMapData().layers.find(item => item.id === object.layerId);
                if (layer && layer.locked) throw new Error(`Layer "${layer.name}" đang khóa.`);
                const position = this.mapObjectAnchor(object);
                if (!position) throw new Error('Không xác định được tọa độ đối tượng.');
                this.canvasEngine.updateObject(object.id, {
                    entityType: this.activeGeographyType,
                    entityId: record.id,
                    name: record.name
                }, 'Link geography record');
                this.geographyService.setMapLink(this.activeGeographyType, record.id, object.id, position);
                this.markGeographyDirty();
                this.showGeographyDetail(record.id);
                this.notify('Đã liên kết bản ghi địa lý với đối tượng trên bản đồ.');
                return;
            }
            if (action === 'delete') {
                if (!window.confirm(`Xóa "${record.name}"? Thao tác này không thể hoàn tác.`)) return;
                const civilizationReferences = this.civilizationService.findReferences(this.activeGeographyType, record.id);
                if (civilizationReferences.length) {
                    throw new Error(`Không thể xóa vì đang được liên kết từ ${civilizationReferences[0]}.`);
                }
                const historyReferences = this.historyService.findReferences(this.activeGeographyType, record.id);
                if (historyReferences.length) {
                    throw new Error(`Không thể xóa vì đang được liên kết từ ${historyReferences[0]}.`);
                }
                if (record.mapObjectId) {
                    const object = this.canvasEngine.findObject(record.mapObjectId);
                    const layer = object && this.canvasEngine.getMapData().layers.find(item => item.id === object.layerId);
                    if (layer && layer.locked) throw new Error(`Layer "${layer.name}" đang khóa; không thể xóa marker đã liên kết.`);
                }
                this.geographyService.delete(this.activeGeographyType, record.id);
                if (record.mapObjectId) this.canvasEngine.deleteObjects([record.mapObjectId], 'Delete geography marker');
                this.markGeographyDirty();
                this.selectedGeographyId = null;
                document.getElementById('geography-detail').textContent = 'Chọn một bản ghi để xem chi tiết hoặc tạo bản ghi mới.';
                this.renderGeographyList();
                this.notify('Đã xóa bản ghi địa lý.');
            }
        } catch (error) {
            this.notify(`Thao tác địa lý thất bại: ${error.message}`, true);
        }
    }

    openCivilizationDatabase(type = this.activeCivilizationType, id = null) {
        if (!this.currentProject || !this.civilizationService) {
            this.notify('Mở một dự án trước khi truy cập Civilization Database.', true);
            return;
        }
        this.setCivilizationType(type);
        const dialog = document.getElementById('civilization-dialog');
        if (!dialog.open) dialog.showModal();
        if (id) this.showCivilizationDetail(id);
    }

    setCivilizationType(type) {
        if (!CIVILIZATION_TYPES.includes(type)) return;
        this.activeCivilizationType = type;
        this.selectedCivilizationId = null;
        this.editingCivilizationId = null;
        document.getElementById('civilization-search').value = '';
        document.getElementById('civilization-form').innerHTML = '';
        document.getElementById('civilization-form').classList.add('hidden');
        document.getElementById('civilization-detail').classList.remove('hidden');
        document.getElementById('civilization-detail').textContent = 'Chọn đối tượng để xem chi tiết hoặc tạo đối tượng mới.';
        document.getElementById('civilization-image-file').value = '';
        document.querySelectorAll('#civilization-tabs [data-civ-type]').forEach(button => {
            const active = button.dataset.civType === type;
            button.className = active
                ? 'rounded bg-wfs-primary px-3 py-1.5 text-xs text-white'
                : 'rounded border border-wfs-border px-3 py-1.5 text-xs text-wfs-muted';
        });
        this.renderCivilizationFilter();
        this.renderCivilizationList();
    }

    civilizationRelations(type = this.activeCivilizationType) {
        return {
            characters: [
                ['countryIds', 'countries', 'Countries'],
                ['cityIds', 'cities', 'Cities'],
                ['organizationIds', 'organizations', 'Organizations'],
                ['characterIds', 'characters', 'Related characters'],
                ['raceIds', 'races', 'Races'],
                ['cultureIds', 'cultures', 'Cultures'],
                ['religionIds', 'religions', 'Religions']
            ],
            races: [['regionIds', null, 'Distribution regions']],
            cultures: [['countryIds', 'countries', 'Countries']],
            religions: [['countryIds', 'countries', 'Countries']],
            organizations: [['countryIds', 'countries', 'Countries'], ['cityIds', 'cities', 'Cities']]
        }[type] || [];
    }

    civilizationTargets(targetType) {
        if (targetType && CIVILIZATION_TYPES.includes(targetType)) {
            return this.civilizationService.getAll(targetType);
        }
        const geography = this.geographyService ? this.geographyService.data : {};
        return Object.entries(geography).flatMap(([type, records]) =>
            Array.isArray(records) ? records.map(record => ({ ...record, kind: type })) : []);
    }

    renderCivilizationFilter() {
        const select = document.getElementById('civilization-filter');
        const relation = this.civilizationRelations()[0];
        if (!relation) {
            select.innerHTML = '<option value="">All records</option>';
            select.disabled = true;
            return;
        }
        const targets = this.civilizationTargets(relation[1]);
        select.innerHTML = `<option value="">All ${this.escapeHtml(relation[2].toLocaleLowerCase())}</option>${targets
            .map(record => `<option value="${this.escapeHtml(record.id)}">${this.escapeHtml(record.name)}</option>`).join('')}`;
        select.disabled = false;
    }

    renderCivilizationList() {
        if (!this.civilizationService) return;
        const relation = this.civilizationRelations()[0];
        const filterValue = document.getElementById('civilization-filter').value;
        const filters = relation && filterValue ? { [relation[0]]: filterValue } : {};
        const records = this.civilizationService.search(this.activeCivilizationType, {
            query: document.getElementById('civilization-search').value,
            filters
        });
        document.getElementById('civilization-list').innerHTML = records.length
            ? records.map(record => `
                <button data-civ-id="${this.escapeHtml(record.id)}" class="flex w-full items-center gap-3 rounded border ${record.id === this.selectedCivilizationId ? 'border-wfs-primary bg-wfs-hover' : 'border-wfs-border'} p-2 text-left hover:bg-wfs-hover">
                    ${record.image ? `<img src="${this.escapeHtml(record.image)}" alt="" class="h-12 w-12 shrink-0 rounded object-cover">` : '<span class="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-wfs-bg text-lg text-wfs-muted">◇</span>'}
                    <span class="min-w-0"><span class="block truncate text-xs font-medium text-white">${this.escapeHtml(record.name)}</span>
                    <span class="mt-1 block line-clamp-2 text-[10px] text-wfs-muted">${this.escapeHtml(record.description || record.id)}</span></span>
                </button>`).join('')
            : '<p class="rounded border border-dashed border-wfs-border p-5 text-center text-xs text-wfs-muted">Không có đối tượng phù hợp.</p>';
    }

    showCivilizationDetail(id) {
        const detail = this.civilizationService.getDetail(this.activeCivilizationType, id);
        if (!detail) {
            this.notify('Không tìm thấy đối tượng Civilization.', true);
            return;
        }
        this.selectedCivilizationId = id;
        this.editingCivilizationId = null;
        document.getElementById('civilization-form').classList.add('hidden');
        const relations = this.civilizationRelations().map(([field, targetType, label]) => {
            const linked = detail.relations[field] || [];
            const names = linked.map(record => `${record.name} (${record.id})`).join(', ') || '—';
            return `<dt class="text-wfs-muted">${this.escapeHtml(label)}</dt><dd class="break-all">${this.escapeHtml(names)}</dd>`;
        }).join('');
        const attributes = Object.entries(detail.attributes).map(([key, value]) =>
            `<dt class="text-wfs-muted">${this.escapeHtml(key)}</dt><dd class="break-all whitespace-pre-wrap">${this.escapeHtml(typeof value === 'string' ? value : JSON.stringify(value))}</dd>`
        ).join('');
        const panel = document.getElementById('civilization-detail');
        panel.classList.remove('hidden');
        panel.innerHTML = `
            <div class="mb-4 flex items-start justify-between gap-3">
                <div><h3 class="text-base font-semibold text-white">${this.escapeHtml(detail.name)}</h3>
                <p class="mt-1 break-all text-[10px] text-wfs-muted">${this.escapeHtml(TYPE_LABELS[this.activeCivilizationType])} · ${this.escapeHtml(detail.id)}</p></div>
                <button data-civ-action="edit" class="rounded border border-wfs-border px-2 py-1 text-xs hover:bg-wfs-hover">Sửa</button>
            </div>
            ${detail.image ? `<img src="${this.escapeHtml(detail.image)}" alt="${this.escapeHtml(detail.name)}" class="mb-4 max-h-56 w-full rounded border border-wfs-border object-contain">` : ''}
            <p class="mb-4 whitespace-pre-wrap text-xs text-wfs-muted">${this.escapeHtml(detail.description || 'Chưa có mô tả')}</p>
            <dl class="grid grid-cols-[130px_1fr] gap-y-2 border-t border-wfs-border pt-3 text-xs">
                ${relations}
                ${attributes}
                <dt class="text-wfs-muted">Tạo lúc</dt><dd>${this.escapeHtml(this.formatDate(detail.createdAt))}</dd>
                <dt class="text-wfs-muted">Cập nhật</dt><dd>${this.escapeHtml(this.formatDate(detail.updatedAt))}</dd>
            </dl>
            <div class="mt-5 flex justify-end">
                <button data-civ-action="delete" class="rounded border border-red-900 px-3 py-2 text-xs text-red-300">Xóa</button>
            </div>`;
        this.renderCivilizationList();
    }

    openCivilizationForm(record = null) {
        if (!this.civilizationService) return;
        this.editingCivilizationId = record ? record.id : null;
        this.selectedCivilizationId = record ? record.id : null;
        document.getElementById('civilization-detail').classList.add('hidden');
        document.getElementById('civilization-image-file').value = '';
        const form = document.getElementById('civilization-form');
        form.classList.remove('hidden');
        const relationFields = this.civilizationRelations().map(([field, targetType, label]) => {
            const targets = this.civilizationTargets(targetType);
            const selectedIds = record ? record[field] || [] : [];
            const selectedOptions = new Set(selectedIds);
            const options = targets.map(target => `
                <option value="${this.escapeHtml(target.id)}" ${selectedOptions.has(target.id) ? 'selected' : ''}>
                    ${this.escapeHtml(target.name)}${target.kind ? ` · ${this.escapeHtml(target.kind)}` : ''}
                </option>`).join('');
            const targetLabel = targetType ? TYPE_LABELS[targetType] || targetType : 'Geography';
            return `<fieldset class="rounded border border-wfs-border p-3">
                <legend class="px-1 text-xs text-wfs-muted">${this.escapeHtml(label)}</legend>
                <select name="relation:${field}" multiple size="${Math.min(Math.max(targets.length, 2), 5)}" class="w-full rounded border border-wfs-border bg-wfs-bg px-2 py-2 text-xs text-white">
                    ${options}
                </select>
                <label class="mt-2 block text-[10px] text-wfs-muted">Thêm ID ${this.escapeHtml(targetLabel)} (phân cách bằng dấu phẩy)
                    <input name="extra:${field}" value="${this.escapeHtml(selectedIds.filter(value => !targets.some(target => target.id === value)).join(', '))}" class="mt-1 w-full rounded border border-wfs-border bg-wfs-bg px-2 py-1.5 text-xs text-white" placeholder="ID đã có trong project">
                </label>
            </fieldset>`;
        }).join('');
        form.innerHTML = `
            <div class="flex items-center justify-between">
                <h3 class="font-semibold text-white">${record ? 'Chỉnh sửa' : 'Tạo'} ${this.escapeHtml(TYPE_LABELS[this.activeCivilizationType])}</h3>
                <button type="button" data-civ-action="cancel-form" class="rounded px-2 py-1 text-xs text-wfs-muted hover:bg-wfs-hover">Hủy</button>
            </div>
            <label class="block text-xs text-wfs-muted">Tên *
                <input name="name" required maxlength="160" value="${this.escapeHtml(record?.name || '')}" class="mt-1 w-full rounded border border-wfs-border bg-wfs-bg px-3 py-2 text-white">
            </label>
            <label class="block text-xs text-wfs-muted">Mô tả chi tiết
                <textarea name="description" maxlength="12000" rows="5" class="mt-1 w-full rounded border border-wfs-border bg-wfs-bg px-3 py-2 text-white">${this.escapeHtml(record?.description || '')}</textarea>
            </label>
            <label class="block text-xs text-wfs-muted">Ảnh minh họa (URL)
                <input name="image" maxlength="3145728" value="${this.escapeHtml(record?.image || '')}" placeholder="https://... hoặc chọn tệp ảnh" class="mt-1 w-full rounded border border-wfs-border bg-wfs-bg px-3 py-2 text-white">
            </label>
            <button type="button" data-select-civ-image class="rounded border border-wfs-border px-3 py-2 text-xs text-wfs-muted hover:bg-wfs-hover">Chọn tệp ảnh (tối đa 2 MB)</button>
            ${relationFields}
            <label class="block text-xs text-wfs-muted">Trường mở rộng (JSON object)
                <textarea name="attributes" rows="6" spellcheck="false" class="mt-1 w-full rounded border border-wfs-border bg-wfs-bg px-3 py-2 font-mono text-xs text-white" placeholder='{"title":"...","customField":"..."}'>${this.escapeHtml(JSON.stringify(record?.attributes || {}, null, 2))}</textarea>
                <span class="mt-1 block text-[10px]">Thêm bất kỳ thuộc tính nào; các trường không bị giới hạn vào danh sách dựng sẵn.</span>
            </label>
            <div class="flex justify-end gap-2 pt-2">
                <button type="button" data-civ-action="cancel-form" class="rounded border border-wfs-border px-3 py-2 text-xs hover:bg-wfs-hover">Hủy</button>
                <button type="submit" class="rounded bg-wfs-primary px-3 py-2 text-xs text-white">Lưu</button>
            </div>`;
    }

    cancelCivilizationForm() {
        this.editingCivilizationId = null;
        document.getElementById('civilization-form').classList.add('hidden');
        document.getElementById('civilization-detail').classList.remove('hidden');
        if (this.selectedCivilizationId) this.showCivilizationDetail(this.selectedCivilizationId);
        else document.getElementById('civilization-detail').textContent = 'Chọn đối tượng để xem chi tiết hoặc tạo đối tượng mới.';
    }

    async handleCivilizationImageFile(event) {
        const file = event.target.files && event.target.files[0];
        event.target.value = '';
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            this.notify('Ảnh minh họa vượt quá giới hạn 2 MB.', true);
            return;
        }
        if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) {
            this.notify('Định dạng ảnh minh họa không được hỗ trợ.', true);
            return;
        }
        try {
            const image = await this.readFileAsDataURL(file);
            const input = document.querySelector('#civilization-form [name="image"]');
            if (input) input.value = image;
        } catch (error) {
            this.notify(`Không thể đọc ảnh minh họa: ${error.message}`, true);
        }
    }

    handleCivilizationSubmit(event) {
        event.preventDefault();
        this.civilizationService.geography = this.geographyService ? this.geographyService.data : {};
        const form = event.currentTarget;
        const values = new FormData(form);
        let attributes;
        try {
            attributes = JSON.parse(String(values.get('attributes') || '{}'));
        } catch (error) {
            this.notify(`Trường mở rộng phải là JSON hợp lệ: ${error.message}`, true);
            return;
        }
        const input = {
            name: values.get('name'),
            description: values.get('description'),
            image: values.get('image'),
            attributes
        };
        for (const [field] of this.civilizationRelations()) {
            const selectedIds = values.getAll(`relation:${field}`);
            const addedIds = String(values.get(`extra:${field}`) || '').split(',').map(id => id.trim()).filter(Boolean);
            input[field] = [...new Set([...selectedIds, ...addedIds])];
        }
        const previous = this.editingCivilizationId
            ? this.civilizationService.get(this.activeCivilizationType, this.editingCivilizationId)
            : null;
        try {
            const record = previous
                ? this.civilizationService.update(this.activeCivilizationType, previous.id, input)
                : this.civilizationService.create(this.activeCivilizationType, input);
            this.markCivilizationDirty();
            this.editingCivilizationId = null;
            this.showCivilizationDetail(record.id);
            this.notify(previous ? 'Đã cập nhật đối tượng Civilization.' : 'Đã tạo đối tượng Civilization.');
        } catch (error) {
            this.notify(`Không thể lưu Civilization: ${error.message}`, true);
        }
    }

    markCivilizationDirty() {
        if (!this.currentProject) return;
        if (this.geographyService) this.civilizationService.geography = this.geographyService.data;
        if (this.historyService) this.historyService.civilization = this.civilizationService.data;
        this.currentProject.data = {
            ...(this.currentProject.data || {}),
            civilization: this.civilizationService.data,
            history: this.historyService ? this.historyService.data : {}
        };
        document.getElementById('save-status').textContent = 'Chưa lưu';
    }

    handleCivilizationAction(event) {
        const button = event.target.closest('button[data-civ-action]');
        if (!button) return;
        if (button.dataset.civAction === 'cancel-form') {
            this.cancelCivilizationForm();
            return;
        }
        const record = this.civilizationService.get(this.activeCivilizationType, this.selectedCivilizationId);
        if (!record) return;
        if (button.dataset.civAction === 'edit') {
            this.openCivilizationForm(record);
            return;
        }
        if (button.dataset.civAction === 'delete') {
            if (!window.confirm(`Xóa "${record.name}"?`)) return;
            try {
                const historyReferences = this.historyService.findReferences(this.activeCivilizationType, record.id);
                if (historyReferences.length) {
                    throw new Error(`Không thể xóa vì đang được liên kết từ ${historyReferences[0]}.`);
                }
                this.civilizationService.delete(this.activeCivilizationType, record.id);
                this.markCivilizationDirty();
                this.selectedCivilizationId = null;
                document.getElementById('civilization-detail').textContent =
                    'Chọn đối tượng để xem chi tiết hoặc tạo đối tượng mới.';
                this.renderCivilizationFilter();
                this.renderCivilizationList();
                this.notify('Đã xóa đối tượng Civilization.');
            } catch (error) {
                this.notify(`Không thể xóa đối tượng: ${error.message}`, true);
            }
        }
    }

    openHistoryDatabase(type = this.activeHistoryType, id = null) {
        if (!this.currentProject || !this.historyService) {
            this.notify('Mở một dự án trước khi truy cập History & Timeline.', true);
            return;
        }
        this.historyService.geography = this.geographyService.data;
        this.historyService.civilization = this.civilizationService.data;
        this.setHistoryType(type);
        const dialog = document.getElementById('history-dialog');
        if (!dialog.open) dialog.showModal();
        if (id) this.showHistoryDetail(id);
    }

    setHistoryType(type) {
        if (type !== 'timeline' && !HISTORY_TYPES.includes(type)) return;
        this.activeHistoryType = type;
        this.selectedHistoryId = null;
        this.editingHistoryId = null;
        if (type !== 'timeline') this.historyTimelineFilter = null;
        document.getElementById('history-search').value = '';
        document.getElementById('history-form').innerHTML = '';
        document.getElementById('history-form').classList.add('hidden');
        document.getElementById('history-detail').classList.remove('hidden');
        document.getElementById('history-detail').textContent = 'Chọn một mục để xem chi tiết hoặc tạo mục mới.';
        document.querySelectorAll('#history-tabs [data-history-type]').forEach(button => {
            const active = button.dataset.historyType === type;
            button.className = active
                ? 'rounded bg-wfs-primary px-3 py-1.5 text-xs text-white'
                : 'rounded border border-wfs-border px-3 py-1.5 text-xs text-wfs-muted';
        });
        const create = document.getElementById('create-history-record');
        create.textContent = `+ Tạo ${LABELS[type === 'timeline' ? 'events' : type]}`;
        this.renderHistoryList();
    }

    historyItems() {
        if (this.activeHistoryType !== 'timeline') {
            return this.historyService.search(this.activeHistoryType, {
                query: document.getElementById('history-search').value
            });
        }
        const query = document.getElementById('history-search').value.trim().toLocaleLowerCase();
        const filteredIds = this.historyTimelineFilter ? new Set(this.historyTimelineFilter) : null;
        return this.historyService.timeline().filter(event =>
            (!filteredIds || filteredIds.has(event.id)) &&
            (!query || `${event.name} ${event.description} ${this.historyDateRange(event)}`.toLocaleLowerCase().includes(query)));
    }

    renderHistoryList() {
        if (!this.historyService) return;
        const records = this.historyItems();
        const container = document.getElementById('history-list');
        if (!records.length) {
            container.innerHTML = '<p class="rounded border border-dashed border-wfs-border p-5 text-center text-xs text-wfs-muted">Không có mục phù hợp.</p>';
            return;
        }
        container.innerHTML = records.map(record => {
            const isEvent = this.activeHistoryType === 'timeline' || this.activeHistoryType === 'events';
            const date = isEvent ? this.historyDateRange(record) : '';
            const calendarName = isEvent ? this.historyCalendarName(record.startDate) : '';
            const active = record.id === this.selectedHistoryId
                ? 'border-wfs-primary bg-wfs-hover'
                : 'border-wfs-border';
            return `<button data-history-id="${this.escapeHtml(record.id)}" class="block w-full rounded border ${active} p-3 text-left hover:bg-wfs-hover">
                <span class="block truncate text-xs font-medium text-white">${this.escapeHtml(record.name)}</span>
                ${date ? `<span class="mt-1 block text-[10px] text-wfs-primary">${this.escapeHtml(date)} · ${this.escapeHtml(calendarName)}</span>` : ''}
                <span class="mt-1 block truncate text-[10px] text-wfs-muted">${this.escapeHtml(record.description || record.id)}</span>
            </button>`;
        }).join('');
    }

    historyDateRange(record) {
        const start = record.startDate ? this.historyDateText(record.startDate) : '';
        const end = record.endDate ? this.historyDateText(record.endDate) : '';
        return end && end !== start ? `${start} – ${end}` : start;
    }

    historyCalendarName(date) {
        return date && this.historyService.get('calendars', date.calendarId)?.name || 'Unknown calendar';
    }

    historyDateText(date) {
        if (!date) return '—';
        const calendar = this.historyService.get('calendars', date.calendarId);
        const month = date.month === null
            ? ''
            : calendar && calendar.months[date.month - 1]
                ? calendar.months[date.month - 1].name
                : `Month ${date.month}`;
        const year = date.precision === 'decade' ? `${date.year}–${date.year + 9}`
            : date.precision === 'century' ? `Century ${date.year}`
                : String(date.year);
        if (date.precision === 'day') return `${date.day} ${month} ${year}`;
        if (date.precision === 'month') return `${month} ${year}`;
        return year;
    }

    showHistoryDetail(id) {
        const detail = this.historyService.getDetail(this.activeHistoryType === 'timeline' ? 'events' : this.activeHistoryType, id);
        if (!detail) {
            this.notify('Không tìm thấy mục History.', true);
            return;
        }
        const type = this.activeHistoryType === 'timeline' ? 'events' : this.activeHistoryType;
        this.selectedHistoryId = id;
        this.editingHistoryId = null;
        document.getElementById('history-form').classList.add('hidden');
        const relationMarkup = Object.entries(detail.relations).map(([field, targets]) => {
            const items = Array.isArray(targets) ? targets : targets ? [targets] : [];
            if (!items.length) return '';
            const label = field === 'era' ? 'Era' : field === 'period' ? 'Period' : field === 'location' ? 'Location' : field;
            return `<dt class="text-wfs-muted">${this.escapeHtml(label)}</dt><dd class="space-y-1">${items.map(target => {
                const targetType = field === 'era' ? 'eras' : field === 'period' ? 'periods' : field === 'location' ? 'locations'
                    : RELATION_TYPES[field]?.[0];
                const isHistoryTarget = targetType && (HISTORY_TYPES.includes(targetType));
                const idAttribute = isHistoryTarget
                    ? `data-related-history="${this.escapeHtml(targetType)}"`
                    : `data-related-external="${this.escapeHtml(targetType || '')}"`;
                return `<button ${idAttribute} data-related-id="${this.escapeHtml(target.id)}" class="block break-all text-left text-wfs-primary hover:underline">${this.escapeHtml(target.name)} (${this.escapeHtml(target.id)})</button>`;
            }).join('')}</dd>`;
        }).join('');
        const dateMarkup = detail.startDate
            ? `<dt class="text-wfs-muted">Start</dt><dd>${this.escapeHtml(this.historyDateText(detail.startDate))} · ${this.escapeHtml(this.historyCalendarName(detail.startDate))}</dd>
               ${detail.endDate ? `<dt class="text-wfs-muted">End</dt><dd>${this.escapeHtml(this.historyDateText(detail.endDate))}</dd>` : ''}`
            : '';
        const months = type === 'calendars'
            ? `<dt class="text-wfs-muted">Months</dt><dd>${detail.months.length ? detail.months.map(month =>
                `${this.escapeHtml(month.name)}${month.days ? ` (${month.days} days)` : ''}`).join(', ') : 'Numeric month index (1–12); no Gregorian conversion.'}</dd>`
            : '';
        const listMarkup = key => Array.isArray(detail[key]) && detail[key].length
            ? `<dt class="text-wfs-muted">${this.escapeHtml(key)}</dt><dd class="whitespace-pre-wrap">${this.escapeHtml(detail[key].join('\n'))}</dd>`
            : '';
        const eventLocation = detail.relations.location;
        const locationObject = eventLocation && eventLocation.mapObjectId
            ? this.canvasEngine.findObject(eventLocation.mapObjectId)
            : null;
        const locationPosition = eventLocation && (eventLocation.mapPosition ||
            (locationObject && this.mapObjectAnchor(locationObject)));
        const panel = document.getElementById('history-detail');
        panel.classList.remove('hidden');
        panel.innerHTML = `
            <div class="mb-4 flex items-start justify-between gap-3">
                <div><h3 class="text-base font-semibold text-white">${this.escapeHtml(detail.name)}</h3>
                <p class="mt-1 break-all text-[10px] text-wfs-muted">${this.escapeHtml(LABELS[type])} · ${this.escapeHtml(detail.id)}</p></div>
                <button data-history-action="edit" class="rounded border border-wfs-border px-2 py-1 text-xs hover:bg-wfs-hover">Sửa</button>
            </div>
            <p class="mb-4 whitespace-pre-wrap text-xs text-wfs-muted">${this.escapeHtml(detail.description || 'Chưa có mô tả')}</p>
            <dl class="grid grid-cols-[120px_1fr] gap-y-2 border-t border-wfs-border pt-3 text-xs">
                ${dateMarkup}${months}${relationMarkup}
                ${listMarkup('causes')}${listMarkup('consequences')}
                <dt class="text-wfs-muted">Tạo lúc</dt><dd>${this.escapeHtml(this.formatDate(detail.createdAt))}</dd>
                <dt class="text-wfs-muted">Cập nhật</dt><dd>${this.escapeHtml(this.formatDate(detail.updatedAt))}</dd>
            </dl>
            <div class="mt-5 flex flex-wrap justify-end gap-2">
                ${type === 'events' && locationPosition ? '<button data-history-action="focus-location" class="rounded bg-wfs-primary px-3 py-2 text-xs text-white">Đến vị trí trên bản đồ</button>' : ''}
                ${type === 'events' ? '<button data-history-action="concurrent" class="rounded border border-wfs-border px-3 py-2 text-xs">Cùng thời kỳ</button>' : ''}
                <button data-history-action="delete" class="rounded border border-red-900 px-3 py-2 text-xs text-red-300">Xóa</button>
            </div>`;
        this.renderHistoryList();
    }

    historyTargets(type) {
        if (HISTORY_TYPES.includes(type)) return this.historyService.getAll(type);
        if (this.civilizationService && this.civilizationService.data[type]) return this.civilizationService.getAll(type);
        return this.geographyService ? this.geographyService.getAll(type) : [];
    }

    historyRelationshipField(field, record) {
        const [targetType, label] = RELATION_TYPES[field];
        const targets = this.historyTargets(targetType);
        const selected = new Set(record ? record[field] || [] : []);
        return `<fieldset class="rounded border border-wfs-border p-3">
            <legend class="px-1 text-xs text-wfs-muted">${this.escapeHtml(label)}${field.endsWith('Ids') ? ' (multiple)' : ''}</legend>
            <select name="relation:${field}" multiple size="${Math.min(Math.max(targets.length, 2), 5)}" class="w-full rounded border border-wfs-border bg-wfs-bg px-2 py-2 text-xs text-white">
                ${targets.map(target => `<option value="${this.escapeHtml(target.id)}" ${selected.has(target.id) ? 'selected' : ''}>${this.escapeHtml(target.name)}</option>`).join('')}
            </select>
        </fieldset>`;
    }

    historyDateEditor(field, date = null, required = false) {
        const calendars = this.historyService.getAll('calendars');
        const firstCalendar = calendars[0] && calendars[0].id || '';
        const selectedCalendar = date ? date.calendarId : firstCalendar;
        const selectedPrecision = date ? date.precision : 'year';
        const monthHidden = ['year', 'decade', 'century'].includes(selectedPrecision);
        const dayHidden = selectedPrecision !== 'day';
        return `<fieldset class="rounded border border-wfs-border p-3">
            <legend class="px-1 text-xs text-wfs-muted">${field === 'startDate' ? 'Start date' : 'End date'} · calendar-native</legend>
            <label class="block text-[10px] text-wfs-muted">Calendar
                <select name="${field}.calendarId" class="mt-1 w-full rounded border border-wfs-border bg-wfs-bg px-2 py-1.5 text-xs text-white" ${required ? 'required' : ''}>
                    ${calendars.map(calendar => `<option value="${this.escapeHtml(calendar.id)}" ${calendar.id === selectedCalendar ? 'selected' : ''}>${this.escapeHtml(calendar.name)}</option>`).join('')}
                </select>
            </label>
            <div class="mt-2 grid grid-cols-2 gap-2">
                <label class="text-[10px] text-wfs-muted">Year
                    <input name="${field}.year" type="number" step="1" value="${date ? date.year : ''}" ${required ? 'required' : ''} class="mt-1 w-full rounded border border-wfs-border bg-wfs-bg px-2 py-1.5 text-xs text-white">
                </label>
                <label class="text-[10px] text-wfs-muted">Precision
                    <select name="${field}.precision" data-history-date-precision="${field}" class="mt-1 w-full rounded border border-wfs-border bg-wfs-bg px-2 py-1.5 text-xs text-white">
                        ${DATE_PRECISIONS.map(precision => `<option value="${precision}" ${precision === selectedPrecision ? 'selected' : ''}>${precision}</option>`).join('')}
                    </select>
                </label>
                <label data-history-month="${field}" class="text-[10px] text-wfs-muted ${monthHidden ? 'hidden' : ''}">Month index
                    <input name="${field}.month" type="number" step="1" min="1" value="${date && date.month !== null ? date.month : ''}" class="mt-1 w-full rounded border border-wfs-border bg-wfs-bg px-2 py-1.5 text-xs text-white">
                </label>
                <label data-history-day="${field}" class="text-[10px] text-wfs-muted ${dayHidden ? 'hidden' : ''}">Day
                    <input name="${field}.day" type="number" step="1" min="1" value="${date && date.day !== null ? date.day : ''}" class="mt-1 w-full rounded border border-wfs-border bg-wfs-bg px-2 py-1.5 text-xs text-white">
                </label>
            </div>
            <p class="mt-2 text-[10px] text-wfs-muted">Year values and month indexes are stored as entered; they are never converted to Gregorian dates.</p>
        </fieldset>`;
    }

    openHistoryForm(record = null) {
        if (!this.historyService) return;
        const type = this.activeHistoryType === 'timeline' ? 'events' : this.activeHistoryType;
        this.editingHistoryId = record ? record.id : null;
        this.selectedHistoryId = record ? record.id : null;
        document.getElementById('history-detail').classList.add('hidden');
        const form = document.getElementById('history-form');
        form.classList.remove('hidden');
        const dateFields = ['eras', 'periods', 'records'].includes(type)
            ? `${this.historyDateEditor('startDate', record && record.startDate)}${this.historyDateEditor('endDate', record && record.endDate)}`
            : type === 'events'
                ? `${this.historyDateEditor('startDate', record && record.startDate, true)}${this.historyDateEditor('endDate', record && record.endDate)}`
                : '';
        const eraSelect = ['periods', 'records', 'events'].includes(type)
            ? `<label class="block text-xs text-wfs-muted">Era
                <select name="eraId" class="mt-1 w-full rounded border border-wfs-border bg-wfs-bg px-3 py-2 text-white">
                    <option value="">No era</option>${this.historyService.getAll('eras').map(era =>
                `<option value="${this.escapeHtml(era.id)}" ${record?.eraId === era.id ? 'selected' : ''}>${this.escapeHtml(era.name)}</option>`).join('')}
                </select>
            </label>`
            : '';
        const periodSelect = ['records', 'events'].includes(type)
            ? `<label class="block text-xs text-wfs-muted">Period
                <select name="periodId" class="mt-1 w-full rounded border border-wfs-border bg-wfs-bg px-3 py-2 text-white">
                    <option value="">No period</option>${this.historyService.getAll('periods').map(period =>
                `<option value="${this.escapeHtml(period.id)}" ${record?.periodId === period.id ? 'selected' : ''}>${this.escapeHtml(period.name)}</option>`).join('')}
                </select>
            </label>`
            : '';
        const locationSelect = type === 'events'
            ? `<label class="block text-xs text-wfs-muted">Location
                <select name="locationId" class="mt-1 w-full rounded border border-wfs-border bg-wfs-bg px-3 py-2 text-white">
                    <option value="">No linked location</option>${this.historyService.geography.locations.map(location =>
                `<option value="${this.escapeHtml(location.id)}" ${record?.locationId === location.id ? 'selected' : ''}>${this.escapeHtml(location.name)}</option>`).join('')}
                </select>
            </label>`
            : '';
        const relationFields = ['events', 'records'].includes(type)
            ? ['countryIds', 'characterIds', 'organizationIds', 'raceIds', 'religionIds', 'eventIds', 'recordIds']
                .filter(field => field !== 'eventIds' || type === 'events')
                .filter(field => field !== 'recordIds' || type === 'events')
                .map(field => this.historyRelationshipField(field, record)).join('')
            : '';
        const calendarField = type === 'calendars'
            ? `<label class="block text-xs text-wfs-muted">Months (JSON array; optional days per month)
                <textarea name="months" rows="6" class="mt-1 w-full rounded border border-wfs-border bg-wfs-bg px-3 py-2 font-mono text-xs text-white">${this.escapeHtml(JSON.stringify(record?.months || [], null, 2))}</textarea>
                <span class="mt-1 block text-[10px]">Example: [{"name":"Frost","days":30},{"name":"Thaw","days":25}]</span>
            </label>`
            : '';
        form.innerHTML = `
            <div class="flex items-center justify-between">
                <h3 class="font-semibold text-white">${record ? 'Edit' : 'Create'} ${this.escapeHtml(LABELS[type])}</h3>
                <button type="button" data-history-action="cancel-form" class="rounded px-2 py-1 text-xs text-wfs-muted hover:bg-wfs-hover">Cancel</button>
            </div>
            <label class="block text-xs text-wfs-muted">Name *
                <input name="name" required maxlength="160" value="${this.escapeHtml(record?.name || '')}" class="mt-1 w-full rounded border border-wfs-border bg-wfs-bg px-3 py-2 text-white">
            </label>
            ${calendarField}${dateFields}${eraSelect}${periodSelect}${locationSelect}
            ${type === 'events' ? `<label class="block text-xs text-wfs-muted">Causes (one per line)<textarea name="causes" rows="3" class="mt-1 w-full rounded border border-wfs-border bg-wfs-bg px-3 py-2 text-white">${this.escapeHtml((record?.causes || []).join('\n'))}</textarea></label>
                <label class="block text-xs text-wfs-muted">Consequences (one per line)<textarea name="consequences" rows="3" class="mt-1 w-full rounded border border-wfs-border bg-wfs-bg px-3 py-2 text-white">${this.escapeHtml((record?.consequences || []).join('\n'))}</textarea></label>` : ''}
            ${relationFields}
            <label class="block text-xs text-wfs-muted">Description
                <textarea name="description" maxlength="12000" rows="4" class="mt-1 w-full rounded border border-wfs-border bg-wfs-bg px-3 py-2 text-white">${this.escapeHtml(record?.description || '')}</textarea>
            </label>
            <div class="flex justify-end gap-2 pt-2">
                <button type="button" data-history-action="cancel-form" class="rounded border border-wfs-border px-3 py-2 text-xs hover:bg-wfs-hover">Cancel</button>
                <button type="submit" class="rounded bg-wfs-primary px-3 py-2 text-xs text-white">Save ${this.escapeHtml(LABELS[type])}</button>
            </div>`;
        for (const precision of ['startDate', 'endDate']) this.updateHistoryDateFields(precision);
    }

    updateHistoryDateFields(field) {
        const precision = document.querySelector(`#history-form [data-history-date-precision="${field}"]`);
        if (!precision) return;
        const showMonth = !['year', 'decade', 'century'].includes(precision.value);
        const showDay = precision.value === 'day';
        document.querySelector(`[data-history-month="${field}"]`)?.classList.toggle('hidden', !showMonth);
        document.querySelector(`[data-history-day="${field}"]`)?.classList.toggle('hidden', !showDay);
    }

    readHistoryDate(formData, field, required = false) {
        const yearText = String(formData.get(`${field}.year`) || '').trim();
        const calendarId = String(formData.get(`${field}.calendarId`) || '').trim();
        if (!yearText && !required) return null;
        if (!/^-?\d+$/.test(yearText)) {
            if (!required && !yearText && !calendarId) return null;
            throw new Error(`${field === 'startDate' ? 'Start' : 'End'} date needs a whole-number year.`);
        }
        const precision = String(formData.get(`${field}.precision`) || 'year');
        const monthText = String(formData.get(`${field}.month`) || '').trim();
        const dayText = String(formData.get(`${field}.day`) || '').trim();
        return {
            calendarId,
            year: Number(yearText),
            month: ['day', 'month'].includes(precision) && monthText ? Number(monthText) : null,
            day: precision === 'day' && dayText ? Number(dayText) : null,
            precision
        };
    }

    handleHistorySubmit(event) {
        event.preventDefault();
        const type = this.activeHistoryType === 'timeline' ? 'events' : this.activeHistoryType;
        const formData = new FormData(event.currentTarget);
        const input = {
            name: formData.get('name'),
            description: formData.get('description')
        };
        try {
            if (type === 'calendars') {
                input.months = JSON.parse(String(formData.get('months') || '[]'));
            } else {
                input.startDate = this.readHistoryDate(formData, 'startDate', type === 'events');
                input.endDate = this.readHistoryDate(formData, 'endDate');
            }
            if (['periods', 'records', 'events'].includes(type)) input.eraId = formData.get('eraId') || null;
            if (['records', 'events'].includes(type)) input.periodId = formData.get('periodId') || null;
            if (type === 'events') {
                input.locationId = formData.get('locationId') || null;
                input.causes = formData.get('causes');
                input.consequences = formData.get('consequences');
            }
            if (['events', 'records'].includes(type)) {
                for (const field of ['countryIds', 'characterIds', 'organizationIds', 'raceIds', 'religionIds', 'eventIds', 'recordIds']) {
                    if (type === 'records' && ['eventIds', 'recordIds'].includes(field)) continue;
                    input[field] = formData.getAll(`relation:${field}`);
                }
            }
            this.historyService.geography = this.geographyService.data;
            this.historyService.civilization = this.civilizationService.data;
            const previous = this.editingHistoryId ? this.historyService.get(type, this.editingHistoryId) : null;
            const record = previous
                ? this.historyService.update(type, previous.id, input)
                : this.historyService.create(type, input);
            if (type === 'events') this.syncHistoryLocationEvents();
            this.markHistoryDirty();
            this.editingHistoryId = null;
            this.showHistoryDetail(record.id);
            this.notify(previous ? 'History record updated.' : 'History record created.');
        } catch (error) {
            this.notify(`Could not save History record: ${error.message}`, true);
        }
    }

    syncHistoryLocationEvents() {
        if (!this.geographyService || !this.historyService) return;
        for (const location of this.geographyService.getAll('locations')) {
            const eventIds = this.historyService.getAll('events')
                .filter(event => event.locationId === location.id)
                .map(event => event.id);
            if (eventIds.length !== (location.eventIds || []).length ||
                eventIds.some((id, index) => id !== location.eventIds[index])) {
                this.geographyService.update('locations', location.id, { eventIds });
            }
        }
        this.historyService.geography = this.geographyService.data;
    }

    markHistoryDirty() {
        if (!this.currentProject) return;
        this.historyService.geography = this.geographyService.data;
        this.historyService.civilization = this.civilizationService.data;
        this.historyService.validateRelations();
        this.currentProject.data = {
            ...(this.currentProject.data || {}),
            geography: this.geographyService.data,
            civilization: this.civilizationService.data,
            history: this.historyService.data
        };
        document.getElementById('save-status').textContent = 'Chưa lưu';
    }

    cancelHistoryForm() {
        const id = this.editingHistoryId || this.selectedHistoryId;
        this.editingHistoryId = null;
        if (id) this.showHistoryDetail(id);
        else {
            document.getElementById('history-form').classList.add('hidden');
            document.getElementById('history-detail').classList.remove('hidden');
            document.getElementById('history-detail').textContent = 'Chọn một mục để xem chi tiết hoặc tạo mục mới.';
        }
    }

    handleHistoryAction(event) {
        const button = event.target.closest('button[data-history-action], button[data-related-history], button[data-related-external]');
        if (!button) return;
        const type = this.activeHistoryType === 'timeline' ? 'events' : this.activeHistoryType;
        if (button.dataset.relatedHistory) {
            this.openHistoryDatabase(button.dataset.relatedHistory, button.dataset.relatedId);
            return;
        }
        if (button.dataset.relatedExternal) {
            const relatedType = button.dataset.relatedExternal;
            document.getElementById('history-dialog').close();
            if (CIVILIZATION_TYPES.includes(relatedType)) this.openCivilizationDatabase(relatedType, button.dataset.relatedId);
            else this.openGeographyDatabase(relatedType, button.dataset.relatedId);
            return;
        }
        if (button.dataset.historyAction === 'cancel-form') {
            this.cancelHistoryForm();
            return;
        }
        const record = this.historyService.get(type, this.selectedHistoryId);
        if (!record) return;
        if (button.dataset.historyAction === 'edit') {
            this.openHistoryForm(record);
        } else if (button.dataset.historyAction === 'focus-location') {
            const location = this.geographyService.get('locations', record.locationId);
            const position = location && (location.mapPosition ||
                (location.mapObjectId && this.mapObjectAnchor(this.canvasEngine.findObject(location.mapObjectId))));
            if (!position) {
                this.notify('Sự kiện chưa có vị trí bản đồ được liên kết.', true);
                return;
            }
            this.canvasEngine.centerOnWorld(position);
            document.getElementById('history-dialog').close();
            this.notify(`Đã chuyển đến vị trí của sự kiện "${record.name}".`);
        } else if (button.dataset.historyAction === 'concurrent') {
            this.historyTimelineFilter = this.historyService.concurrentEvents(record.id).map(item => item.id);
            this.setHistoryType('timeline');
            this.showHistoryDetail(record.id);
        } else if (button.dataset.historyAction === 'delete') {
            if (!window.confirm(`Delete "${record.name}"? This cannot be undone.`)) return;
            try {
                const usages = this.historyService.findReferences(type, record.id);
                if (usages.length) throw new Error(`Cannot delete while linked from ${usages[0]}.`);
                if (type === 'events') {
                    for (const location of this.geographyService.getAll('locations')) {
                        if ((location.eventIds || []).includes(record.id)) {
                            this.geographyService.update('locations', location.id, {
                                eventIds: location.eventIds.filter(id => id !== record.id)
                            });
                        }
                    }
                    this.historyService.geography = this.geographyService.data;
                }
                this.historyService.delete(type, record.id);
                if (type === 'events') this.syncHistoryLocationEvents();
                this.markHistoryDirty();
                this.selectedHistoryId = null;
                document.getElementById('history-detail').textContent = 'Chọn một mục để xem chi tiết hoặc tạo mục mới.';
                this.renderHistoryList();
                this.notify('History record deleted.');
            } catch (error) {
                this.notify(`Could not delete History record: ${error.message}`, true);
            }
        }
    }

    renderViewport({ zoom }) {
        const percentage = zoom < 0.01 ? (zoom * 100).toFixed(2) : Math.round(zoom * 100);
        document.getElementById('zoom-percent').textContent = `${percentage}%`;
    }

    toggleBottomPanel() {
        const collapsed = this.bottomPanel.classList.contains('h-8');
        this.bottomPanel.classList.toggle('h-8', !collapsed);
        this.bottomPanel.classList.toggle('h-48', collapsed);
        const offset = this.bottomPanel.offsetHeight + 24;
        document.getElementById('view-controls').style.bottom = `${offset}px`;
        document.getElementById('coordinate-panel').style.bottom = `${offset}px`;
        this.canvasEngine.scheduleRender();
    }

    renderCoordinates(point) {
        document.getElementById('coordinate-status').textContent =
            `X: ${point.x.toFixed(1)} · Y: ${point.y.toFixed(1)}`;
    }

    updateMapDimensions() {
        const map = this.canvasEngine.getMapData();
        document.getElementById('map-dimensions').textContent = `${map.width} × ${map.height}`;
    }

    renderSelection(selection) {
        const details = document.getElementById('selection-details');
        const form = document.getElementById('selection-form');
        const duplicateButton = document.getElementById('duplicate-selection-action');
        const deleteButton = document.getElementById('delete-selection-action');
        if (!selection) {
            details.textContent = 'Chọn một đối tượng trên bản đồ để xem tọa độ.';
            form.classList.add('hidden');
            duplicateButton.disabled = true;
            deleteButton.disabled = true;
            return;
        }
        const selectedEntry = this.canvasEngine.findObjectEntry(selection.id);
        const canEditSelection = Boolean(selectedEntry && selectedEntry.layer.visible && !selectedEntry.layer.locked);
        duplicateButton.disabled = !canEditSelection;
        deleteButton.disabled = !canEditSelection;
        const linkedGeography = this.geographyService && this.geographyService.getByMapObjectId(selection.id);
        const pathStart = selection.type === 'path'
            ? selection.commands.find(command => command.type !== 'close')
            : selection.type === 'terrain' ? selection.points[0] : null;
        const position = selection.type === 'rect'
            ? `X: ${selection.x}, Y: ${selection.y} · ${selection.width} × ${selection.height}`
            : selection.type === 'ellipse'
                ? `X: ${selection.x}, Y: ${selection.y} · ${selection.radiusX * 2} × ${selection.radiusY * 2}`
                : pathStart
                    ? `Điểm đầu: X: ${pathStart.x.toFixed(1)}, Y: ${pathStart.y.toFixed(1)}`
                    : `X: ${selection.x}, Y: ${selection.y}`;
        details.innerHTML = `
            <h2 class="mb-3 text-sm font-semibold text-white">${this.escapeHtml(selection.name || selection.feature || selection.type)}</h2>
            <dl class="grid grid-cols-[90px_1fr] gap-y-2 text-xs">
                <dt class="text-wfs-muted">Loại</dt><dd>${this.escapeHtml(selection.type)}</dd>
                <dt class="text-wfs-muted">Tọa độ</dt><dd>${this.escapeHtml(position)}</dd>
                <dt class="text-wfs-muted">Layer</dt><dd>${this.escapeHtml(selection.layerName)}</dd>
                <dt class="text-wfs-muted">Object ID</dt><dd class="break-all font-mono">${this.escapeHtml(selection.id)}</dd>
            </dl>
            ${linkedGeography ? '<button data-open-geography class="mt-3 rounded border border-wfs-border px-3 py-2 text-xs text-white hover:bg-wfs-hover">Mở hồ sơ địa lý</button>' : ''}`;
        form.classList.remove('hidden');
        const color = selection.color || (selection.fill && selection.fill !== 'transparent'
            ? selection.fill
            : selection.stroke || '#334155');
        document.getElementById('selection-color').value = /^#[\da-f]{6}$/i.test(color) ? color : '#334155';
        const isText = selection.type === 'text';
        const isSized = ['path', 'ellipse', 'icon', 'terrain', 'text'].includes(selection.type);
        document.getElementById('selection-text-control').classList.toggle('hidden', !isText);
        document.getElementById('selection-size-control').classList.toggle('hidden', !isSized);
        if (isText) document.getElementById('selection-text').value = selection.text;
        if (isSized) {
            document.getElementById('selection-size').value =
                selection.type === 'text' ? selection.fontSize :
                    selection.type === 'icon' || selection.type === 'terrain' ? selection.size :
                        selection.strokeWidth || 3;
            document.getElementById('selection-size').min =
                selection.type === 'text' ? '6' : selection.type === 'icon' ? '8' : '1';
            document.getElementById('selection-size').max = selection.type === 'icon' ? '256' : '512';
        }
    }

    renderHistory(state) {
        const undo = document.getElementById('undo-action');
        const redo = document.getElementById('redo-action');
        undo.disabled = !state.canUndo;
        redo.disabled = !state.canRedo;
        undo.title = state.undoLabel ? `Undo: ${state.undoLabel} (Ctrl+Z)` : 'Undo (Ctrl+Z)';
        redo.title = state.redoLabel ? `Redo: ${state.redoLabel} (Ctrl+Y)` : 'Redo (Ctrl+Y)';
    }

    renderTools(activeId) {
        for (const button of document.querySelectorAll('[data-tool]')) {
            button.setAttribute('aria-pressed', String(button.dataset.tool === activeId));
        }
        const definition = TOOL_DEFINITIONS.find(tool => tool.id === activeId);
        const optionsPanel = document.getElementById('tool-options');
        optionsPanel.classList.toggle('hidden', activeId === 'select');
        optionsPanel.classList.toggle('flex', activeId !== 'select');
        document.getElementById('active-tool-name').textContent = `${definition.label} (${definition.shortcut})`;
        document.getElementById('tool-color-control').classList.toggle('hidden', ['eraser', 'select'].includes(activeId));
        document.getElementById('tool-size-control').classList.toggle('hidden', activeId === 'select');
        document.getElementById('tool-terrain-control').classList.toggle('hidden', activeId !== 'terrain');
        document.getElementById('tool-icon-control').classList.toggle('hidden', activeId !== 'icon');
        document.getElementById('tool-text-control').classList.toggle('hidden', activeId !== 'text');
        const tool = this.canvasEngine.toolManager.getTool(activeId);
        document.getElementById('tool-color').value = /^#[\da-f]{6}$/i.test(tool.options.color) ? tool.options.color : '#334155';
        document.getElementById('tool-size').value = tool.options.size;
        document.getElementById('tool-terrain').value = tool.options.terrain;
        document.getElementById('tool-icon').value = tool.options.icon;
        document.getElementById('tool-text').value = tool.options.text;
        const placeAssetOptions = document.getElementById('place-asset-options');
        placeAssetOptions.classList.toggle('hidden', activeId !== 'place-asset');
        placeAssetOptions.classList.toggle('flex', activeId === 'place-asset');
        if (activeId === 'place-asset') {
            document.getElementById('place-asset-width').value = tool.options.defaultSize.width;
            document.getElementById('place-asset-height').value = tool.options.defaultSize.height;
            document.getElementById('place-asset-rotation').value = tool.options.rotation;
            document.getElementById('place-asset-opacity').value = tool.options.opacity;
            document.getElementById('place-asset-fit').value = tool.options.fit;
        }
        document.getElementById('tool-size').min = activeId === 'text' ? '6' : activeId === 'icon' ? '8' : '1';
        document.getElementById('tool-size').max = activeId === 'icon' ? '256' : '512';
    }

    updateActiveToolOptions() {
        const id = this.canvasEngine.toolManager.activeToolId;
        const options = {
            color: document.getElementById('tool-color').value,
            size: Number(document.getElementById('tool-size').value),
            terrain: document.getElementById('tool-terrain').value,
            icon: document.getElementById('tool-icon').value,
            text: document.getElementById('tool-text').value
        };
        if (id === 'place-asset') {
            const width = Number(document.getElementById('place-asset-width').value);
            const height = Number(document.getElementById('place-asset-height').value);
            const rotation = Number(document.getElementById('place-asset-rotation').value);
            const opacity = Number(document.getElementById('place-asset-opacity').value);
            if (![width, height, rotation, opacity].every(Number.isFinite) ||
                width < 1 || height < 1 || width > 8192 || height > 8192 ||
                Math.abs(rotation) > 36000 || opacity < 0 || opacity > 1) return;
            options.defaultSize = { width, height };
            options.rotation = rotation;
            options.opacity = opacity;
            options.fit = document.getElementById('place-asset-fit').value;
            try {
                this.canvasEngine.setToolOptions(id, options);
            } catch (error) {
                this.notify(`Không thể cập nhật thuộc tính đặt asset: ${error.message}`, true);
            }
            return;
        }
        if (!Number.isFinite(options.size) || options.size <= 0) return;
        const sizeInput = document.getElementById('tool-size');
        if (options.size < Number(sizeInput.min) || options.size > Number(sizeInput.max)) return;
        try {
            this.canvasEngine.setToolOptions(id, options);
        } catch (error) {
            this.notify(`Không thể cập nhật thuộc tính công cụ: ${error.message}`, true);
        }
    }

    handleSelectionSubmit(event) {
        event.preventDefault();
        if (!this.canvasEngine.selectedObjectId) return;
        const selected = this.canvasEngine.findObject(this.canvasEngine.selectedObjectId);
        if (!selected) return;
        const color = document.getElementById('selection-color').value;
        const changes = selected.type === 'text' ? { color } :
            selected.type === 'icon' ? { color } :
                selected.type === 'terrain' ? { color } :
                    selected.fill === 'transparent' ? { stroke: color } : { fill: color, stroke: color };
        if (selected.type === 'text') changes.text = document.getElementById('selection-text').value;
        const sizeControl = document.getElementById('selection-size-control');
        if (!sizeControl.classList.contains('hidden')) {
            const size = Number(document.getElementById('selection-size').value);
            if (!Number.isFinite(size) || size <= 0) {
                this.notify('Kích thước đối tượng phải là số dương.', true);
                return;
            }
            if (selected.type === 'text') changes.fontSize = size;
            else if (selected.type === 'icon' || selected.type === 'terrain') changes.size = size;
            else changes.strokeWidth = size;
        }
        try {
            this.canvasEngine.updateObject(selected.id, changes);
            this.notify('Đã cập nhật đối tượng.');
        } catch (error) {
            this.notify(`Không thể cập nhật đối tượng: ${error.message}`, true);
        }
    }

    duplicateSelection() {
        const id = this.canvasEngine.selectedObjectId;
        if (!id) return;
        try {
            this.canvasEngine.duplicateObject(id);
            this.notify('Đã nhân bản đối tượng.');
        } catch (error) {
            this.notify(`Không thể nhân bản đối tượng: ${error.message}`, true);
        }
    }

    deleteSelection() {
        const id = this.canvasEngine.selectedObjectId;
        if (!id) return;
        try {
            this.canvasEngine.deleteObjects([id], 'Delete object');
            this.notify('Đã xóa đối tượng.');
        } catch (error) {
            this.notify(`Không thể xóa đối tượng: ${error.message}`, true);
        }
    }

    renderLayers() {
        const manager = this.canvasEngine.layerManager;
        const activeLayer = manager.getActiveLayer();
        const layers = manager.getLayers();
        const groups = manager.getGroups();
        document.getElementById('layer-list').innerHTML = layers.map((layer, index) => `
            <div class="rounded border ${layer.id === (activeLayer && activeLayer.id) ? 'border-wfs-primary bg-wfs-hover' : 'border-wfs-border'} p-2" data-layer-row="${this.escapeHtml(layer.id)}">
                <div class="flex items-center gap-1">
                    <input type="checkbox" data-layer-visibility="${this.escapeHtml(layer.id)}" ${layer.visible ? 'checked' : ''} aria-label="Hiện layer ${this.escapeHtml(layer.name)}">
                    <button data-layer-select="${this.escapeHtml(layer.id)}" class="min-w-0 flex-1 truncate text-left text-xs ${layer.locked ? 'text-wfs-muted' : 'text-white'}" ${layer.locked || !layer.visible ? 'disabled' : ''}>${this.escapeHtml(layer.name)}</button>
                    <span class="text-[10px] text-wfs-muted">${layer.objects.length}</span>
                    <button data-layer-move="up" data-layer-id="${this.escapeHtml(layer.id)}" title="Đưa layer lên" aria-label="Đưa ${this.escapeHtml(layer.name)} lên" ${index === layers.length - 1 ? 'disabled' : ''} class="rounded px-1 text-xs text-wfs-muted hover:bg-wfs-hover disabled:opacity-30">↑</button>
                    <button data-layer-move="down" data-layer-id="${this.escapeHtml(layer.id)}" title="Đưa layer xuống" aria-label="Đưa ${this.escapeHtml(layer.name)} xuống" ${index === 0 ? 'disabled' : ''} class="rounded px-1 text-xs text-wfs-muted hover:bg-wfs-hover disabled:opacity-30">↓</button>
                    <button data-layer-rename="${this.escapeHtml(layer.id)}" title="Đổi tên layer" aria-label="Đổi tên ${this.escapeHtml(layer.name)}" class="rounded px-1 text-xs text-wfs-muted hover:bg-wfs-hover">✎</button>
                    <button data-layer-lock="${this.escapeHtml(layer.id)}" title="${layer.locked ? 'Mở khóa layer' : 'Khóa layer'}" aria-label="${layer.locked ? 'Mở khóa' : 'Khóa'} ${this.escapeHtml(layer.name)}" aria-pressed="${layer.locked}" class="rounded px-1 text-xs text-wfs-muted hover:bg-wfs-hover">${layer.locked ? 'Mở khóa' : 'Khóa'}</button>
                </div>
                <div class="mt-2 grid grid-cols-[auto_1fr_auto] items-center gap-2">
                    <label class="text-[10px] text-wfs-muted" for="layer-group-${this.escapeHtml(layer.id)}">Group</label>
                    <select id="layer-group-${this.escapeHtml(layer.id)}" data-layer-group="${this.escapeHtml(layer.id)}" class="min-w-0 rounded border border-wfs-border bg-wfs-bg px-1 py-1 text-[10px] text-white">
                        <option value="">Không nhóm</option>
                        ${groups.map(group => `<option value="${this.escapeHtml(group.id)}" ${layer.groupId === group.id ? 'selected' : ''}>${this.escapeHtml(group.name)}</option>`).join('')}
                    </select>
                    <span class="text-[10px] text-wfs-muted">${Math.round(layer.opacity * 100)}%</span>
                    <label class="col-span-3 grid grid-cols-[auto_1fr] items-center gap-2 text-[10px] text-wfs-muted">
                        Opacity
                        <input type="range" min="0" max="1" step="0.05" value="${layer.opacity}" data-layer-opacity="${this.escapeHtml(layer.id)}" aria-label="Opacity ${this.escapeHtml(layer.name)}" class="w-full accent-blue-500">
                    </label>
                </div>
            </div>`).reverse().join('');
        const groupSelect = document.getElementById('layer-group-manager');
        const selectedGroup = groupSelect.value;
        groupSelect.innerHTML = `<option value="">Chọn group...</option>${groups.map(group =>
            `<option value="${this.escapeHtml(group.id)}">${this.escapeHtml(group.name)}</option>`).join('')}`;
        if (groups.some(group => group.id === selectedGroup)) groupSelect.value = selectedGroup;
        const enabled = Boolean(groupSelect.value);
        document.getElementById('rename-layer-group-button').disabled = !enabled;
        document.getElementById('delete-layer-group-button').disabled = !enabled;
    }

    showPanelTab(tab) {
        const properties = tab === 'properties';
        document.getElementById('properties-content').classList.toggle('hidden', !properties);
        document.getElementById('layers-content').classList.toggle('hidden', properties);
        document.getElementById('properties-tab').className = properties
            ? 'flex-1 border-b-2 border-wfs-primary py-3 text-center font-medium text-white'
            : 'flex-1 border-b-2 border-transparent py-3 text-center text-wfs-muted hover:text-white';
        document.getElementById('layers-tab').className = properties
            ? 'flex-1 border-b-2 border-transparent py-3 text-center text-wfs-muted hover:text-white'
            : 'flex-1 border-b-2 border-wfs-primary py-3 text-center font-medium text-white';
    }

    openMapSizeDialog() {
        const map = this.canvasEngine.getMapData();
        document.getElementById('map-width').value = map.width;
        document.getElementById('map-height').value = map.height;
        document.getElementById('map-size-dialog').showModal();
    }

    handleMapSizeSubmit(event) {
        event.preventDefault();
        try {
            const width = Number(document.getElementById('map-width').value);
            const height = Number(document.getElementById('map-height').value);
            this.canvasEngine.setMapSize(width, height);
            document.getElementById('map-size-dialog').close();
            this.notify(`Đã đổi kích thước bản đồ thành ${width} × ${height}.`);
        } catch (error) {
            this.notify(`Không thể đổi kích thước bản đồ: ${error.message}`, true);
        }
    }

    addLayer() {
        const name = window.prompt('Tên layer mới:');
        if (name === null) return;
        try {
            this.canvasEngine.addLayer(name);
            this.renderLayers();
        } catch (error) {
            this.notify(`Không thể thêm layer: ${error.message}`, true);
        }
    }

    addLayerGroup() {
        const name = window.prompt('Tên group mới:');
        if (name === null) return;
        try {
            const group = this.canvasEngine.createLayerGroup(name);
            this.renderLayers();
            document.getElementById('layer-group-manager').value = group.id;
            document.getElementById('layer-group-manager').dispatchEvent(new Event('change'));
        } catch (error) {
            this.notify(`Không thể tạo group: ${error.message}`, true);
        }
    }

    renameLayerGroup() {
        const select = document.getElementById('layer-group-manager');
        const group = this.canvasEngine.layerManager.getGroups().find(item => item.id === select.value);
        if (!group) return;
        const name = window.prompt('Tên group:', group.name);
        if (name === null) return;
        try {
            this.canvasEngine.renameLayerGroup(group.id, name);
            this.renderLayers();
        } catch (error) {
            this.notify(`Không thể đổi tên group: ${error.message}`, true);
        }
    }

    deleteLayerGroup() {
        const select = document.getElementById('layer-group-manager');
        const group = this.canvasEngine.layerManager.getGroups().find(item => item.id === select.value);
        if (!group) return;
        if (!window.confirm(`Xóa group "${group.name}"? Các layer sẽ được giữ nguyên và bỏ khỏi group.`)) return;
        try {
            this.canvasEngine.deleteLayerGroup(group.id);
            this.renderLayers();
        } catch (error) {
            this.notify(`Không thể xóa group: ${error.message}`, true);
        }
    }

    removeActiveLayer() {
        const layer = this.canvasEngine.layerManager.getActiveLayer();
        if (!layer) return;
        if (!window.confirm(`Xóa layer "${layer.name}" và toàn bộ đối tượng trong layer?`)) return;
        try {
            this.canvasEngine.removeLayer(layer.id);
            this.canvasEngine.setSelection(null);
            this.renderLayers();
        } catch (error) {
            this.notify(`Không thể xóa layer: ${error.message}`, true);
        }
    }

    handleLayerClick(event) {
        const rename = event.target.closest('button[data-layer-rename]');
        if (rename) {
            const layer = this.canvasEngine.layerManager.getLayers().find(item => item.id === rename.dataset.layerRename);
            if (!layer) return;
            const name = window.prompt('Tên layer:', layer.name);
            if (name === null) return;
            try {
                this.canvasEngine.renameLayer(layer.id, name);
                this.renderLayers();
            } catch (error) {
                this.notify(`Không thể đổi tên layer: ${error.message}`, true);
            }
            return;
        }
        const lock = event.target.closest('button[data-layer-lock]');
        if (lock) {
            const layer = this.canvasEngine.layerManager.getLayers().find(item => item.id === lock.dataset.layerLock);
            if (!layer) return;
            try {
                this.canvasEngine.setLayerLocked(layer.id, !layer.locked);
                this.renderLayers();
            } catch (error) {
                this.notify(`Không thể đổi trạng thái khóa: ${error.message}`, true);
            }
            return;
        }
        const move = event.target.closest('button[data-layer-move]');
        if (move) {
            const layers = this.canvasEngine.layerManager.getLayers();
            const index = layers.findIndex(layer => layer.id === move.dataset.layerId);
            const targetIndex = index + (move.dataset.layerMove === 'up' ? 1 : -1);
            try {
                this.canvasEngine.reorderLayer(move.dataset.layerId, targetIndex);
                this.renderLayers();
            } catch (error) {
                this.notify(`Không thể đổi thứ tự layer: ${error.message}`, true);
            }
            return;
        }
        const button = event.target.closest('button[data-layer-select]');
        if (!button) return;
        try {
            this.canvasEngine.setActiveLayer(button.dataset.layerSelect);
            this.renderLayers();
        } catch (error) {
            this.notify(`Không thể chọn layer: ${error.message}`, true);
        }
    }

    handleLayerChange(event) {
        const checkbox = event.target.closest('input[data-layer-visibility]');
        if (checkbox) {
            try {
                this.canvasEngine.setLayerVisibility(checkbox.dataset.layerVisibility, checkbox.checked);
                this.renderLayers();
            } catch (error) {
                this.notify(`Không thể đổi hiển thị layer: ${error.message}`, true);
            }
            return;
        }
        const group = event.target.closest('select[data-layer-group]');
        if (group) {
            try {
                this.canvasEngine.setLayerGroup(group.dataset.layerGroup, group.value || null);
                this.renderLayers();
            } catch (error) {
                this.notify(`Không thể nhóm layer: ${error.message}`, true);
            }
            return;
        }
        const opacity = event.target.closest('input[data-layer-opacity]');
        if (opacity) {
            try {
                this.canvasEngine.setLayerOpacity(opacity.dataset.layerOpacity, Number(opacity.value));
                this.renderLayers();
            } catch (error) {
                this.notify(`Không thể đổi opacity: ${error.message}`, true);
            }
        }
    }

    exportProject(project) {
        this.exportingProject = project;
        document.getElementById('project-export-title').textContent = `Xuất dự án: ${project.name}`;
        document.getElementById('project-export-dialog').showModal();
    }

    downloadProject(format) {
        const project = this.exportingProject;
        if (!project) {
            this.notify('Không có dự án để xuất.', true);
            return;
        }
        try {
            const isPackage = format === 'wforge';
            const blob = isPackage
                ? new Blob([this.projectService.exportProjectPackage(project)], { type: 'application/zip' })
                : new Blob([JSON.stringify(this.projectService.validateProject(project), null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const safeName = project.name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
            link.download = `${safeName}${isPackage ? '.wforge' : '.worldforge.json'}`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
            document.getElementById('project-export-dialog').close();
            this.notify(`Đã xuất dự án "${project.name}" (${isPackage ? '.wforge' : 'JSON'}).`);
        } catch (error) {
            this.notify(`Không thể xuất dự án: ${error.message}`, true);
        }
    }

    openMapExportDialog() {
        if (!this.currentProject) {
            this.notify('Mở một dự án trước khi xuất bản đồ.', true);
            return;
        }
        const map = this.canvasEngine.getMapData();
        document.getElementById('map-export-width').value = map.width;
        document.getElementById('map-export-height').value = map.height;
        document.getElementById('map-export-layers').innerHTML = map.layers.map(layer => `
            <label class="flex items-center gap-2 text-xs text-wfs-muted">
                <input type="checkbox" name="layerIds" value="${this.escapeHtml(layer.id)}" ${layer.visible ? 'checked' : ''}>
                <span>${this.escapeHtml(layer.name)}</span>
            </label>`).join('');
        document.getElementById('map-export-format').value = 'png';
        document.getElementById('map-export-transparent').checked = false;
        this.updateExportTransparency();
        document.getElementById('map-export-dialog').showModal();
    }

    updateExportTransparency() {
        const format = document.getElementById('map-export-format').value;
        const transparency = document.getElementById('map-export-transparent');
        transparency.disabled = !['png', 'svg'].includes(format);
        if (transparency.disabled) transparency.checked = false;
    }

    async handleMapExport(event) {
        event.preventDefault();
        if (!this.currentProject) {
            this.notify('Mở một dự án trước khi xuất bản đồ.', true);
            return;
        }
        const form = event.currentTarget;
        const formData = new FormData(form);
        const options = {
            format: formData.get('format'),
            width: formData.get('width'),
            height: formData.get('height'),
            dpi: formData.get('dpi'),
            style: formData.get('style'),
            layerIds: formData.getAll('layerIds'),
            transparent: formData.get('transparent') === 'on',
            caption: formData.get('caption')
        };
        try {
            const blob = await this.mapExportService.exportMap(this.canvasEngine.getMapData(), options);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const safeName = this.currentProject.name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
            link.href = url;
            link.download = `${safeName}-map.${options.format}`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
            document.getElementById('map-export-dialog').close();
            this.notify(`Đã xuất bản đồ "${this.currentProject.name}" (${options.format.toUpperCase()}, ${options.dpi} DPI).`);
        } catch (error) {
            this.notify(`Không thể xuất bản đồ: ${error.message}`, true);
        }
    }

    notify(message, isError = false) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.remove('hidden', 'border-wfs-border', 'border-red-800', 'text-white', 'text-red-200');
        toast.classList.add(isError ? 'border-red-800' : 'border-wfs-border', isError ? 'text-red-200' : 'text-white');
        window.clearTimeout(this.toastTimeout);
        this.toastTimeout = window.setTimeout(() => toast.classList.add('hidden'), 5000);
        if (isError) console.error(message);
    }

    formatDate(value) {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? 'Không xác định' : date.toLocaleString('vi-VN');
    }

    escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, character => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[character]);
    }

    readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error || new Error('File reading failed.'));
            reader.readAsDataURL(file);
        });
    }
}
