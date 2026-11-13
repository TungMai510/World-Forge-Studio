# World Forge Studio — Master Project Document

> **Tài liệu chuẩn duy nhất của dự án**  
> **Cập nhật:** 13/11/2026  
> **Repository:** TungMai510/World-Forge-Studio  
> **Nhánh:** main  
> **Ứng dụng:** worldforge_ui_prototype/  
> **Trạng thái:** Core Map Editor và Asset System đang phát triển; Phase 4 — Persistence & Archive đang thực hiện.
>
> Tài liệu này hợp nhất tầm nhìn sản phẩm, kiến trúc, đặc tả kỹ thuật, lộ trình, trạng thái triển khai và quy trình kiểm thử. Đây là nguồn Markdown tổng hợp chuẩn duy nhất. Ý tưởng tương lai không được hiểu là tính năng đã tồn tại; trạng thái hoàn thành phải có bằng chứng code/test hoặc xác nhận QA.

---

## 1. Tóm tắt dự án

World Forge Studio là môi trường sáng tạo thế giới giả tưởng theo kiến trúc modular. Mục tiêu không chỉ là vẽ bản đồ, mà là tạo và quản lý một thế giới có dữ liệu liên kết: địa lý, địa hình, khí hậu, quốc gia, dân cư, văn hóa, nhân vật, lịch sử, sức mạnh và câu chuyện.

Sản phẩm phát triển theo hướng **Local-first, Offline-capable, Modular, Extensible**. Người dùng có thể tạo và quản lý thế giới trên máy của mình; cloud, cộng tác và AI chỉ được bổ sung khi cần thiết, không trở thành điều kiện bắt buộc để dùng Core.

### 1.1 Định vị và đối tượng

- Nền tảng worldbuilding có dữ liệu cấu trúc, không đơn thuần là công cụ vẽ bản đồ.
- Các Studio chuyên biệt dùng chung một World Data Core và một project.
- Asset Pack là tài nguyên có thể chia sẻ, tái sử dụng và trao đổi giữa các công cụ.
- Đối tượng: nhà văn, tác giả truyện tranh, game/tabletop RPG designer, họa sĩ bản đồ, illustrator, asset creator và nhóm sáng tạo phim/hoạt hình.
- Phát triển theo hướng open-source-first cho Core; creator ecosystem và marketplace là lớp mở rộng về sau.

### 1.2 Nguyên tắc sản phẩm

1. **Offline-first:** chức năng cốt lõi dùng được không cần dịch vụ bên ngoài.
2. **Modular:** mỗi Studio có trách nhiệm và dữ liệu miền riêng, dùng chung project/nền tảng.
3. **Semantic data:** ưu tiên đối tượng có cấu trúc, ID và quan hệ; không flatten toàn bộ thành hình ảnh.
4. **Backward compatibility:** schema change cần versioning, migration hoặc reject rõ ràng.
5. **User ownership:** người dùng có thể export và backup dữ liệu/tài nguyên.
6. **Safe extensibility:** Pack/plugin không được thực thi code tùy ý trong Core.
7. **Human approval:** AI không tự ý ghi đè hoặc xuất bản dữ liệu.
8. **Evidence-based progress:** không đánh dấu hoàn thành chỉ vì code đã commit.

---

## 2. Kiến trúc tổng thể

### 2.1 Application Shell

Quản lý điều hướng Studio, Project Manager, tạo/mở/lưu project, cài đặt, trạng thái phiên, quyền truy cập, dịch vụ dùng chung, đăng ký module và kiểm tra tương thích.

### 2.2 World Data Core

World Data Core là nền tảng dữ liệu dùng chung, không phải Studio độc lập. Trách nhiệm:
- World/project identity và metadata.
- Stable IDs, quan hệ giữa thực thể.
- Schema versioning và migrations.
- Validation, import/export, persistence.
- Event/history hooks và API miền dùng chung.
- Phân biệt dữ liệu gốc/canonical với dữ liệu dẫn xuất/cache.

Studio sở hữu quy tắc nghiệp vụ của miền mình; không để Studio khác sửa trực tiếp dữ liệu nội bộ ngoài API/contract.

### 2.3 Các Studio dự kiến

| Studio | Trách nhiệm | Trạng thái |
|---|---|---|
| Map Studio / World Editor | Canvas, bản đồ, layer, địa hình, đối tượng địa lý, render/export | Đang phát triển; đã có nền tảng |
| Asset Library / Runtime | Validate, đăng ký, truy xuất và dùng asset từ Pack | Đã có nền tảng; đang hoàn thiện persistence/management |
| Asset Pack Manager | Cài/gỡ/bật/tắt/cập nhật, quản lý phiên bản Pack | Phase 5 |
| Asset Pack Studio | Tạo Pack, batch import, metadata, preview, validator, export | Phase 6 |
| Character Studio | Nhân vật, hồ sơ, quan hệ, thuộc tính | Tương lai |
| Civilization Studio | Chủng tộc, văn hóa, tôn giáo, quốc gia, tổ chức, xã hội | Tương lai |
| History & Timeline Studio | Lịch, kỷ nguyên, thời kỳ, sự kiện, timeline | Tương lai |
| World Environment Studio | Lục địa, địa chất, khí hậu, thời tiết, gió, mùa, thủy văn, sinh thái | Định hướng tương lai |
| Power System Studio | Sức mạnh, phép thuật, công nghệ và quy tắc | Tương lai |
| Story Studio | Cốt truyện, tuyến truyện, sự kiện, liên kết nhân vật/thế giới | Tương lai |
| Plugin Studio / Soundscape Studio | Mở rộng công cụ, âm thanh môi trường | Định hướng dài hạn |
| Creator Hub | Hồ sơ creator, đóng góp, showcase và cộng đồng | Định hướng dài hạn |

Các Studio tương lai không được xem là đã triển khai chỉ vì xuất hiện trong kiến trúc.

### 2.4 Ranh giới module và dữ liệu

- Một project có thể chứa một hoặc nhiều world/map tùy mô hình dữ liệu được chốt.
- Mỗi thực thể có ID ổn định; quan hệ dùng ID, không phụ thuộc tên hiển thị.
- Dữ liệu của module chưa cài vẫn phải được bảo toàn.
- Dữ liệu dẫn xuất có thể tái tạo từ dữ liệu gốc và tham số/seed.
- Chưa triển khai cloud sync/collaboration trước khi local persistence, schema migration và conflict model đủ ổn định.

---

## 3. Hiện trạng kỹ thuật

> Trạng thái phản ánh tài liệu và xác nhận gần nhất ngày 13/11/2026. Khi code thay đổi, cần kiểm tra repository và QA trước khi cập nhật.

### 3.1 Map Editor và World Data

Nền tảng Map Canvas được ghi nhận có:
- Canvas, hệ thống layer và các công cụ vẽ/chỉnh sửa.
- Các layer: Background, Ocean, Landmass, Elevation, Mountains, Forests, Rivers, Lakes, Borders, Cities, Locations, Text, Decorations.
- Các công cụ Select, Brush, Eraser, Landmass, Terrain, River, Lake, Border, Text, Icon và Place Asset; một số vẫn ở mức nền tảng/đang được hoàn thiện.
- Undo/Redo và thao tác chỉnh sửa đối tượng.
- Geography records: World, Continent, Country, City/Settlement, Location; quan hệ dùng ID.
- Civilization records được mô tả: Characters, Races, Cultures, Religions, Organizations.
- History/Timeline records được mô tả: Calendars, Eras, Periods, Records, Events.
- Marker bản đồ có thể liên kết geography records và đồng bộ tọa độ theo thiết kế.

**Lưu ý:** polygon Landmass, layer Ocean hoặc record Continent không đồng nghĩa đã có mô hình địa chất, mô phỏng khí hậu hay mô phỏng đại dương.

### 3.2 Asset System

Nền tảng đã triển khai:
- Asset Pack parser/validator, AssetPackService, AssetRegistry, AssetLoader.
- Namespaced identity: pack-id::asset-id.
- Capability metadata và ToolAssetBinding.
- Shared Asset Library: import trong phiên, preview, search, filter Pack/category, enable/disable/uninstall.
- Image Object renderer, transform metadata, cache lifecycle, export integration.
- Asset tích hợp với Icon, Terrain/Mountain, Lake texture-fill, Border pattern-stroke và generic Place Asset.
- Phase 3D được chủ dự án xác nhận hoàn tất ngày 13/11/2026.

Fixture được sinh bởi lệnh npm run assets:fixture, không nhất thiết lưu binary trong Git. Năm asset QA:
- MNT-001 — Sample Mountain — stamp.
- FST-001 — Sample Forest — generic placement.
- ICO-001 — Castle Icon — icon.
- WTR-001 — Lake Water Texture — texture-fill.
- BND-001 — Stone Border Pattern — pattern-stroke.

### 3.3 Persistence hiện có

- DatabaseManager sử dụng IndexedDB cho project và recent-project records.
- ProjectService kiểm tra project data, có schema versioning và migration v1 → v2.
- archive-service.js đọc/ghi ZIP STORE, kiểm tra CRC32 và có bảo vệ cơ bản cho path không an toàn, entry trùng, số lượng entry và expanded size.
- .wforge formatVersion 1 và import project JSON đã có.
- Image map objects giữ semantic assetRef gồm packId, assetId và packVersion nếu có.

Giới hạn còn lại: formatVersion 1 chưa đóng gói hoàn chỉnh snapshot asset được project sử dụng. Phase 4 đang giải quyết khoảng trống này.

---

## 4. Asset Pack — hợp đồng kỹ thuật

### 4.1 Nguyên tắc

- Core không phụ thuộc một Pack cụ thể.
- Pack chỉ chứa dữ liệu và file tài nguyên được hỗ trợ; không thực thi script, HTML, JavaScript hoặc module từ Pack.
- Asset identity chuẩn là pack-id::asset-id; asset ID chỉ cần duy nhất trong Pack.
- Category do Pack đóng góp, không khóa thành danh sách cứng trong Core.
- Pack phải khai báo license và compatibility.

### 4.2 Định dạng .wfpack

- Container: ZIP STORE (không nén) theo reader hiện tại.
- Manifest: pack.json.
- Cấu trúc:

~~~text
Example-Pack.wfpack
├── pack.json
├── assets/
│   ├── mountains/mountain-small.png
│   └── forests/pine-tree.webp
├── thumbnails/
│   └── MNT-001.webp
├── preview.png
└── LICENSE.txt
~~~

Manifest v1 yêu cầu:
- schemaVersion, id, name, version, author, description, license.
- compatibility.minWorldForgeVersion.
- categories và assets.
- Mỗi asset có id, name, category, type=image và file path trong assets/.

Thumbnail, MIME type, tags, usages/capabilities và default dimensions là tùy chọn. Capability hiện biết: stamp, icon, scatter, texture-fill, pattern-stroke, decoration. Asset cũ không có usages vẫn hợp lệ nhưng chỉ dùng generic placement; không suy đoán capability từ tên category.

### 4.3 Giới hạn an toàn v1

- Tổng archive input/expanded size tối đa 100 MB.
- Số entry tối đa 2.000.
- Manifest tối đa 1 MB.
- File asset/thumbnail riêng lẻ tối đa 15 MB.
- ZIP STORE only; từ chối entry mã hóa hoặc nén theo reader hiện tại.
- Từ chối absolute path, drive path, backslash, path segment rỗng, . / .., control character và duplicate entry.
- Kiểm tra chữ ký ảnh so với phần mở rộng.
- Hỗ trợ PNG, JPEG, WebP, GIF.
- SVG hoãn tới khi có chính sách sanitize/render an toàn.
- Không hỗ trợ script, HTML, executable code, remote URL, font, audio hoặc video trong schema v1.

### 4.4 Runtime, versioning và licensing

- AssetPackService inspect/validate trước khi đăng ký.
- AssetRegistry theo dõi Pack/asset; AssetLoader quản lý Blob URL và cache có giới hạn.
- Eviction/invalidation/clear phải revoke Object URL.
- Disable Pack loại asset khỏi lookup thông thường nhưng không xóa dữ liệu project.
- Pack version dùng Semantic Versioning; schemaVersion độc lập.
- Thay đổi manifest không tương thích cần schema version mới và migration hoặc reject rõ ràng.
- Creator phải có quyền phân phối mọi tài nguyên đóng gói; license trong manifest không tự động cấp quyền cho World Forge.

### 4.5 AI-generated assets trong tương lai

- AI-generated image được xem như input bên ngoài, không có quyền đặc biệt.
- Mọi file phải qua Asset Studio import/validation pipeline.
- AI không được bypass validator, ghi trực tiếp vào Pack đã cài hoặc âm thầm ghi đè asset.
- Người dùng duyệt asset thay thế và metadata.
- Có thể bổ sung provenance (nguồn tạo, thời điểm, model/provider nếu công khai, attribution) sau khi xác định privacy và format.
- AI không chứng minh người dùng có quyền phân phối output; license/attribution vẫn cần xử lý.
- Đây là yêu cầu tương lai, không phải AI support hiện tại.

---

## 5. Tool–Asset Integration

### 5.1 Bốn khái niệm

1. Asset Pack: gói tài nguyên được phân phối.
2. Asset Registry/Loader: đăng ký và truy xuất asset.
3. Tool capability: loại asset mà công cụ có thể sử dụng.
4. Map object: đối tượng semantic trên bản đồ, giữ tham chiếu asset.

Tool không tự đọc cấu trúc Pack hoặc xử lý archive; Tool truy vấn capability qua contract dùng chung.

### 5.2 Các tích hợp đã xác nhận

- Icon Tool: capability icon, lưu assetRef; icon vector vẫn là fallback.
- Terrain/Mountain: capability stamp; giữ polygon workflow khi không chọn stamp.
- Lake Tool: texture-fill được clip trong ellipse; solid-color fill là fallback.
- Border Tool: pattern-stroke lặp theo path; vector stroke là fallback.
- Generic Place Asset: click dùng defaultSize, drag định nghĩa bounding rectangle; rotation, opacity, fit (contain/cover/fill).
- Image Object Properties: Width, Height, Rotation, Opacity, Fit; hỗ trợ History/Undo/Redo và layer guard.

### 5.3 Nguyên tắc tích hợp

- Asset selection đi qua ToolAssetBinding/capability query.
- Không có asset phù hợp thì workflow vector/procedural hiện tại vẫn hoạt động.
- Object giữ semantic reference, metadata và transform; không flatten thành nền bản đồ.
- Disable/uninstall Pack không âm thầm xóa map object.
- Layer hidden/locked được bảo vệ ở UI và engine.
- Batch operation có History transaction rõ ràng.
- Export PNG/JPG/SVG/PDF cần quy tắc render/fallback nhất quán.

---

## 6. Persistence & Archive — Phase 4

### 6.1 Mục tiêu nghiệm thu

Project phải giữ nội dung và render được qua quy trình:

**Create/use asset → Save → Close/reopen → Export → Disable/uninstall source Pack → Import → Reopen and render.**

Không phụ thuộc Pack nguồn còn cài trên máy hoặc còn tồn tại trong phiên.

### 6.2 Snapshot model

Giữ nguyên canonical assetRef: packId, assetId, packVersion (nếu biết).

Thêm collection theo project (đề xuất project.data.assetSnapshots), key ổn định dạng pack-id::asset-id::pack-version. Mỗi snapshot lưu:
- Canonical asset reference.
- MIME type và extension an toàn.
- Byte length.
- SHA-256.
- Snapshot bytes ở dạng phù hợp với storage boundary.

Chỉ embed asset thực sự được map object tham chiếu; deduplicate reference giống nhau. Pack disable/uninstall không xóa snapshot. Pack version mới không âm thầm thay bytes của asset đã nhúng.

### 6.3 Thứ tự resolve khi render

1. Asset từ Pack enabled và tương thích version.
2. Project embedded snapshot đã xác minh.
3. Missing-asset fallback cùng trạng thái có thể khôi phục.

Không thay canonical assetRef chỉ vì dùng snapshot; không âm thầm thay bằng version khác.

### 6.4 Archive v2

Giữ ZIP STORE và manifest.json + project.json; bổ sung formatVersion 2 với:
- Project schema version.
- Số lượng asset snapshot.
- Path, canonical reference, MIME, byte length và SHA-256 của từng snapshot.
- Archive limits và metadata định dạng.

Binary snapshot lưu ở path deterministic an toàn, ví dụ assets/<sha256>.<ext>. Manifest không được cho phép path tùy ý. Import kiểm tra allowlist, số lượng, byte length, MIME/extension, checksum, duplicate reference, file thiếu, file dư và entry không khai báo.

Tiếp tục hỗ trợ import formatVersion 1 và legacy JSON. Import all-or-nothing: validate toàn bộ trước khi ghi IndexedDB.

### 6.5 Bảo mật và integrity

- Coi project/archive là untrusted input.
- Tái sử dụng ZIP path/CRC/entry/expanded-size defenses; bổ sung SHA-256.
- Chỉ chấp nhận raster MIME được Asset Pack v1 hỗ trợ.
- MIME metadata không đủ; đối chiếu extension và image signature.
- Không cho SVG/HTML/script/font/audio/remote URL qua snapshot.
- Enforce aggregate size và per-file limit; tránh base64 expansion không giới hạn.
- Save không mutate live map object graph.
- Import lỗi không được tạo project một phần.

### 6.6 Tiến độ Phase 4

| Slice | Nội dung | Trạng thái |
|---|---|---|
| 4.1 | Snapshot contract, capture, deduplication, SHA-256 metadata, Pack→snapshot runtime fallback | **Hoàn tất — chủ dự án xác nhận 13/11/2026** |
| 4.2 | Harden save/load, verify snapshot persistence/integrity on reload, regression tests | **Hoàn tất — chủ dự án xác nhận kiểm thử 14/11/2026** |
| 4.3 | Portable archive v2, binary snapshot entries, manifest integrity, v1 compatibility | **Đã triển khai; 91 automated tests pass; browser round-trip đã xác nhận** |
| 4.4 | Round-trip, clean-profile, offline, corruption/security và all-or-nothing QA | **Automated QA và offline browser QA đạt; clean browser profile độc lập còn lại** |

Phase 4.1 đã được browser QA xác nhận: save/reopen giữ ảnh; gỡ Pack ngay trong phiên không làm ảnh biến mất do snapshot fallback. Automated coverage được bổ sung cho deduplication, giữ snapshot sau uninstall và fallback khi Pack disable. Phase 4.2 đã hoàn tất theo xác nhận kiểm thử của chủ dự án ngày 14/11/2026, bao gồm hardening save/load, kiểm tra snapshot persistence/integrity sau reload và regression tests. Phase 4.3 đã thêm `.wforge` formatVersion 2 với snapshot binary entries deterministic theo SHA-256, manifest metadata, project-entry checksum, MIME/image-signature validation, phát hiện entry thừa/thiếu và vẫn hỗ trợ import v1. Automated suite hiện có 91 bài pass, bao gồm v1 compatibility, corrupted/missing/undeclared entries, MIME/signature, archive size limit và all-or-nothing import. Browser QA đã xác nhận export/import round-trip, snapshot fallback sau tắt/gỡ Pack và offline save/export khi project đã mở. Chỉ còn clean browser profile độc lập chưa thể xác nhận bằng browser context hiện tại.

Phase 4 chỉ được đóng khi project có Pack-backed assets render đúng sau save/reopen, disable/uninstall Pack, export/import và import trên browser profile sạch không có Pack gốc. Canonical references, Pack version và transform phải giữ nguyên.

Ngoài phạm vi Phase 4: Pack registry persistence/Manager UI (Phase 5), Pack authoring (Phase 6), cloud sync/collaboration, Tool Enhancement nâng cao.

---

## 7. Lộ trình triển khai

### 7.1 Ưu tiên trước Beta 0.1

Mục tiêu Beta 0.1: nền tảng tạo thế giới local-first ổn định gồm project/world core, map editing cơ bản, Asset System, persistence, export/import và QA. Mốc 31/01/2027 từng là mục tiêu tham khảo, không phải cam kết cứng.

| Thứ tự | Phase | Kết quả | Trạng thái |
|---|---|---|---|
| 1 | Core Map Editor + Asset Foundation | Map canvas, tools, asset runtime, .wfpack, tool integration | Nền tảng đã có; Phase 3D đóng |
| 2 | Phase 4 — Persistence/Archive | Save/load snapshots, .wforge v2, round-trip/offline | Đang thực hiện; 4.1, 4.2 và 4.3 hoàn tất; còn 4.4 QA |
| 3 | Phase 5 — Asset Pack Management | Pack Manager UI, install/disable/uninstall/update, version/dependency, persistence | Chưa bắt đầu |
| 4 | Phase 6 — Asset Pack Studio | Authoring, batch import, metadata, preview, validator, exporter | Chưa bắt đầu |
| 5 | Phase 7 — E2E/Offline/Stability QA | E2E, clean profile, offline, docs, accessibility, regression | Chưa bắt đầu |

Luồng nghiệm thu Asset System:

**Create Pack → Export .wfpack → Import → Use in tools → Save project → Reopen → Export .wforge → Import on clean profile → Render.**

Không triển khai Marketplace, payment, social network hoặc AI generation trước khi luồng trên ổn định.

### 7.2 Tool Enhancement — backlog sau Asset System

Sau khi Asset System ổn định:
- **3E Advanced Selection:** marquee, multi-select, primary selection, multi-move/duplicate/delete, atomic history, layer guards.
- **3F Brush:** smooth vector strokes, size, opacity, hardness, presets; textured brush sau deterministic stamping.
- **3G River:** editable curve/path, node/tangent, width profile, tributary links, style/texture.
- **3H Landmass:** vertex editing, smooth coastline, deterministic seeded noise, island presets; merge/split chỉ sau khi có polygon-boolean dependency đáng tin cậy.
- **3I Typography:** local font registry, Vietnamese glyph support, text properties, label presets, export parity.

Giữ semantic geometry, deterministic procedural generation, offline font support, export parity và Undo/Redo. Không raster hóa làm mất khả năng chỉnh sửa. Không thực hiện merge/split bằng thuật toán clipping tự chế thiếu kiểm chứng.

### 7.3 World Data Core và Studio kế tiếp

Sau Beta Core, theo nhu cầu:
1. Củng cố World Data Core, entity IDs, schema/versioning, relation validation.
2. Character Studio.
3. Civilization Studio.
4. History & Timeline Studio.
5. World Environment Studio.
6. Power System Studio.
7. Story Studio.
8. Tối ưu UX, plugin/creator infrastructure và ecosystem.

Thứ tự cụ thể có thể điều chỉnh theo dependency; không xây nhiều Studio cùng lúc khi Core data contracts chưa ổn định.

---

## 8. World Environment Studio — định hướng tương lai

### 8.1 Mục tiêu

Xây dựng môi trường tự nhiên của thế giới, không chỉ vẽ hình lục địa hoặc tô màu địa hình. Module liên kết dữ liệu địa lý với các quy luật vật lý/khí hậu ở mức phù hợp cho worldbuilding.

### 8.2 Hiện trạng và phần còn thiếu

Đã có nền tảng vẽ Landmass/Terrain, layer Ocean/Mountains/Forests/Rivers/Lakes và Geography record Continent. Tuy nhiên, các phần sau **chưa được xác nhận là đã triển khai**:
- Tectonic plates, continental drift, geological history.
- Ocean basin/depth model và elevation/altitude field đầy đủ.
- Atmospheric circulation và pressure systems.
- Wind fields, prevailing winds và seasonal wind reversal.
- Monsoon systems.
- Temperature, precipitation, humidity và seasonal climate.
- Ocean currents và heat transport.
- Hydrology simulation: watershed, runoff, river source/flow.
- Biome/ecosystem distribution và climate-driven vegetation.

### 8.3 Module chức năng đề xuất

1. **Continental & Ocean System:** lục địa, đảo, biển, đại dương, basin, tectonic plates và địa chất.
2. **Elevation & Terrain Model:** độ cao, độ sâu, slope, mountain ranges, plateaus và terrain classes.
3. **Atmospheric System:** latitude bands, pressure belts, circulation cells và atmospheric inputs.
4. **Wind System:** prevailing wind, seasonal wind, wind direction/speed fields.
5. **Monsoon & Seasonal System:** mùa, gió mùa, thời kỳ mưa/khô và biến đổi theo vùng.
6. **Climate System:** temperature, precipitation, humidity, aridity, seasonality và climate classification.
7. **Ocean System:** currents, upwelling, sea-surface temperature và ảnh hưởng đại dương tới khí hậu.
8. **Hydrology System:** watershed, runoff, river network, lakes, wetlands và drainage basins.
9. **Biome & Ecosystem System:** biome, vegetation, ecological zones và phân bố sinh vật.

### 8.4 Dependency logic

**World geometry → Continents/ocean basins → Elevation/geology → Atmosphere/pressure → Wind/seasonality/monsoon → Ocean currents & moisture transport → Climate → Hydrology & biomes.**

Đây là dependency logic để thiết kế dữ liệu, không bắt buộc mọi phép tính chạy tuyến tính. Các hệ thống trao đổi qua World Data Core; lưu riêng dữ liệu gốc, tham số mô phỏng và kết quả dẫn xuất.

### 8.5 Nguyên tắc triển khai

- Có Manual Authoring và Procedural/Simulation mode.
- Người dùng chỉnh sửa thủ công kết quả mô phỏng; lưu nguồn gốc và trạng thái override.
- Dùng spatial grid/field có độ phân giải phù hợp; tránh một giá trị duy nhất cho cả continent khi cần biến thiên không gian.
- Có seed và tham số để tái lập kết quả procedural.
- Hỗ trợ mức mô phỏng đơn giản/trung bình/nâng cao; không bắt buộc mô hình khí tượng khoa học đầy đủ ở bản đầu.
- Tách simulation engine khỏi UI; kiểm thử quy luật cốt lõi bằng test dữ liệu.
- Chưa đưa vào scope trước khi World Data Core và Persistence đủ ổn định.

---

## 9. WorldForge AI Layer — kiến trúc dài hạn

### 9.1 Vị trí và thành phần

WorldForge AI là lớp năng lực AI dùng chung, tùy chọn, phục vụ nhiều Studio. AI không thay thế Studio và không sở hữu dữ liệu canonical.

Thành phần khái niệm:
- **WorldForge AI Layer:** orchestration, prompt/context policy, permissions, history, approval.
- **AI Gateway:** API nội bộ thống nhất để gọi model provider.
- **Model adapters:** adapter cho các model/provider khác nhau.
- **Studio APIs:** AI thao tác qua contract của Studio và World Data Core.
- **Generation provenance:** nguồn tạo và lịch sử chỉnh sửa khi phù hợp.

### 9.2 Mức can thiệp

1. **Assist:** gợi ý, giải thích, tra cứu, hỗ trợ sáng tạo.
2. **Generate:** tạo bản nháp nhân vật, asset, mô tả, bản đồ hoặc dữ liệu thế giới.
3. **Controlled automation:** chuỗi thao tác có preview, validation và phê duyệt trước khi ghi dữ liệu quan trọng.

### 9.3 Quy tắc bắt buộc

- Core vẫn hoạt động khi AI tắt hoặc không có mạng.
- Không khóa vào một provider/model.
- AI không ghi thẳng database hoặc bypass validation.
- Có quota/cost, privacy, failure fallback và generation history.
- User duyệt thay đổi có tác động đến dữ liệu.
- AI-generated asset đi qua Asset Pack pipeline, license/attribution review và validator.
- Chưa triển khai AI generation trong giai đoạn Asset System hiện tại; đây là kiến trúc tương lai.

---

## 10. Creator Ecosystem và mô hình sản phẩm

### 10.1 Hướng phát triển

- **Core:** open-source-first, tập trung tạo thế giới và quản lý dữ liệu.
- **Creator infrastructure:** Asset Pack Studio, Plugin Studio, công cụ đóng góp tài nguyên.
- **Community:** chia sẻ tài nguyên, world showcase, hồ sơ tác phẩm, thảo luận và cộng tác theo quyền.
- **Marketplace:** phân phối Pack/plugin/world content có license rõ ràng.
- **Long-term expansion:** Story/Comic/Film/Animation workflows và công cụ sử dụng dữ liệu World Forge.

### 10.2 Nguyên tắc marketplace

- Creator giữ quyền sở hữu nội dung.
- License, attribution, provenance và quyền phân phối rõ ràng.
- Hỗ trợ tài nguyên miễn phí, trả phí và đóng góp cộng đồng.
- Người dùng được export/backup; không khóa dữ liệu vào marketplace.
- Commission là đề xuất kinh doanh cần thẩm định; tỷ lệ 10–15% từng được thảo luận nhưng chưa phải chính sách đã chốt.
- Có thể bổ sung donation/support cho creator và dự án.

### 10.3 Đóng góp cộng đồng

Lời kêu gọi đóng góp cần thân thiện, minh bạch và điều chỉnh theo từng cộng đồng creator. Nêu rõ loại tài nguyên cần, license mong muốn, cách ghi nhận tác giả, cách gửi và quy trình kiểm duyệt. Đóng góp là tự nguyện; không tạo cảm giác creator phải cung cấp tài nguyên miễn phí.

---

## 11. Sản phẩm đồng hành dài hạn: WorldForge Multiverse Conflict

Ý tưởng là sản phẩm độc lập sử dụng dữ liệu thế giới do WorldForge Studio tạo ra để tổ chức các cuộc xung đột bất đồng bộ giữa thế giới của người dùng.

Định hướng:
- Người dùng chọn world/profile được phép chia sẻ.
- Xung đột chia thành nhiều giai đoạn; mỗi giai đoạn có lựa chọn và kết quả.
- Kết quả phụ thuộc dữ liệu thế giới, luật chơi, trạng thái và lựa chọn.
- Cần compatibility layer, permission, snapshot/versioning và fairness rules.
- Sản phẩm phụ không được ghi ngược hoặc phá dữ liệu gốc.
- Đây là ý tưởng tương lai, không thuộc Core Beta và chưa triển khai.

---

## 12. Kiểm thử, QA và Definition of Done

### 12.1 Quy tắc báo cáo

Phân biệt:
- **Implemented:** code đã tồn tại.
- **Automated tested:** test thực sự chạy và pass trên checkout/commit tương ứng.
- **Browser verified:** chủ dự án đã thao tác thực tế và xác nhận.
- **CI verified:** workflow CI chạy thành công trên commit tương ứng.

Không suy diễn local thành CI hoặc ngược lại. Không đánh dấu hoàn thành chỉ vì commit thành công.

### 12.2 Lệnh kiểm thử

Yêu cầu Node.js 20 trở lên. Từ worldforge_ui_prototype/:

~~~bash
npm run assets:fixture
npm run test:assets
npm test
~~~

Browser harness khi cần:

~~~bash
npx --yes http-server . -p 8000 -c-1
~~~

Mở harness trong tests/assets/ hoặc ứng dụng theo checklist của phase. Ghi browser/version, OS, kết quả từng bước và lỗi console.

### 12.3 Nhóm kiểm thử Asset Foundation

- ZIP round-trip, manifest validation, path traversal, unsupported content rejection.
- Image signature, Core compatibility, Pack registration/namespace, duplicate installation.
- Enabled/disabled state, Blob URL loading, cache eviction/revocation.
- Image object schema, geometry/hit testing, renderer fit behavior, lifecycle invalidation.
- SVG image embedding và export integration.
- Tool capability filtering, Pack selection và tool-specific object creation.
- Snapshot deduplication, Pack uninstall retention và snapshot fallback.

Validator hiện được ghi nhận kiểm tra image signatures; production hardening cần decode ảnh trong worker/decoder đáng tin cậy và enforce pixel/dimension limits cho Pack không tin cậy.

### 12.4 E2E acceptance

- **E2E Asset:** Create/import Pack → browse/select → use in tools → render/export.
- **E2E Persistence:** Save → close/reopen → snapshot resolution.
- **E2E Portability:** Export → remove Pack → import clean profile → render.
- **E2E Offline:** mở project và render không cần network sau khi dữ liệu cần thiết đã lưu.
- **E2E Safety:** malformed/oversized/corrupt archives bị từ chối an toàn, không partial write.

### 12.5 Chất lượng chung

- Không regression workflow đã xác nhận.
- Undo/Redo phản ánh đúng thao tác.
- Layer hidden/locked không bị mutate trái phép.
- Export format giữ nội dung và transform.
- Dữ liệu cũ phải migration hoặc cảnh báo tương thích.
- Tính năng mới cần automated tests và browser QA phù hợp.

---

## 13. Quy trình làm việc và cập nhật tài liệu

### 13.1 Quy trình triển khai

1. Xác định mục tiêu và phạm vi phase.
2. Kiểm tra codebase trước khi thiết kế.
3. Ghi contract và acceptance criteria trong tài liệu này.
4. Chia công việc thành lát cắt nhỏ, độc lập, kiểm thử được.
5. Triển khai và chạy automated tests.
6. Chủ dự án pull và browser QA.
7. Chỉ cập nhật trạng thái hoàn tất khi có bằng chứng.
8. Cập nhật các mục hiện trạng, tiến độ và changelog tại đây.

### 13.2 Nguyên tắc kỹ thuật và tài liệu

- Ưu tiên thay đổi nhỏ, tương thích ngược.
- Không xây module tương lai trước khi dependency nền tảng ổn định.
- Không tạo nhiều nguồn sự thật cho cùng một trạng thái.
- Không ghi tiến độ lặp lại ở nhiều file Markdown.
- Mọi kiến trúc/roadmap/spec mới được tích hợp vào mục phù hợp trong file này thay vì tạo file tổng hợp riêng.
- README chuyên biệt chỉ tạo khi thật sự cần cho quy trình contributor hoặc công cụ tự động; không trùng lặp tài liệu tổng thể.

File này là nguồn Markdown tổng hợp chuẩn duy nhất ở repository root. Không duy trì song song các bản Vision, Roadmap, Specification hoặc Status tổng hợp khác.

---

## 14. Nhật ký quyết định và cập nhật

| Ngày | Quyết định / cập nhật |
|---|---|
| 12/11/2026 | Chốt modular Studio, World Data Core và Asset Pack dùng chung cho Tool System. |
| 12/11/2026 | Chốt thứ tự: Phase 3D → Phase 4 Persistence/Archive → Phase 5 Pack Management → Phase 6 Asset Studio → Phase 7 E2E/Offline QA. |
| 12/11/2026 | Chốt local-first, cloud-ready nhưng không triển khai cloud sync/collaboration sớm. |
| 12/11/2026 | WorldForge AI Layer là kiến trúc tương lai, không phải quyền triển khai AI ngay trong Asset System. |
| 13/11/2026 | Chủ dự án xác nhận Phase 3D hoàn tất. |
| 13/11/2026 | Phase 4.1 snapshot capture/runtime fallback hoàn tất sau browser QA; Phase 4.2 là việc tiếp theo. |
| 13/11/2026 | Triển khai Phase 4.3 `.wforge` formatVersion 2: binary snapshot entries theo SHA-256, manifest integrity, v1 compatibility; 91 automated tests pass sau bổ sung regression archive QA. |
| 14/11/2026 | Phase 4.4 automated QA đạt: corruption, missing/undeclared snapshot, stale project checksum và all-or-nothing import đều có regression tests. |
| 14/11/2026 | Browser QA Phase 4.4 xác nhận mở project không có Pack nguồn và save/export khi offline; clean browser profile độc lập còn chờ môi trường browser context phù hợp. |
| 13/11/2026 | Browser QA Phase 4.3 xác nhận export/import round-trip qua UI và snapshot fallback sau khi tắt/gỡ Pack; clean-profile/offline/security QA còn lại. |
| 14/11/2026 | Chủ dự án xác nhận Phase 4.2 hoàn tất sau khi chạy kiểm thử; chuyển trọng tâm sang Phase 4.4 QA acceptance. |
| 13/11/2026 | Bổ sung định hướng World Environment Studio: lục địa, địa chất, khí hậu, thời tiết, gió mùa, hải lưu, thủy văn và biome. |
| 13/11/2026 | Hợp nhất tài liệu Markdown tổng hợp thành file master duy nhất; loại bỏ các bản trùng lặp và lịch sử roadmap lặp lại. |

---

## 15. Trạng thái hiện tại và việc tiếp theo

**Milestone đang hoạt động: Phase 4.4 — Final Persistence/Archive Acceptance QA.**

Đã hoàn tất:
- Phase 4.1 — snapshot capture, deduplication và runtime fallback.
- Phase 4.2 — save/load hardening, snapshot persistence/integrity sau reload và regression tests; chủ dự án xác nhận kiểm thử hoàn tất ngày 14/11/2026.
- Phase 4.3 — `.wforge` formatVersion 2, binary snapshot entries, SHA-256 integrity, manifest validation và backward compatibility với formatVersion 1; 91 automated tests pass và browser round-trip đã xác nhận.

Việc cần làm trong Phase 4.4:
1. Import trên browser profile sạch không có Pack nguồn; xác nhận asset vẫn render từ embedded snapshot.
2. Kiểm tra offline: mở project, render, save và export khi không có network.
3. Browser QA trên archive hỏng/corrupt, snapshot thiếu/thừa, sai checksum/MIME/signature và archive vượt giới hạn.
4. Browser QA xác nhận import all-or-nothing: dữ liệu lỗi không tạo project một phần hoặc làm thay đổi project đang có.
5. Chạy clean browser profile độc lập và ghi nhận kết quả cuối cùng.
6. Đóng Phase 4 chỉ khi toàn bộ acceptance criteria đạt; sau đó mới chuyển sang Phase 5 — Asset Pack Management.

**Chưa chuyển trọng tâm sang:** marketplace, payment, AI generation, cloud sync, multiverse conflict hoặc World Environment simulation trước khi các nền tảng ưu tiên hoàn tất.

---

*Tài liệu này thay thế các file Markdown tổng hợp trước đó trong repository. Khi cập nhật dự án, hãy chỉnh sửa file này thay vì tạo thêm bản tổng quan/roadmap/specification song song.*
