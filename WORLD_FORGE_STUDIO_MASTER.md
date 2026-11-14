# World Forge Studio — Master Project Document

> **Tài liệu chuẩn duy nhất của dự án**  
> **Cập nhật:** 14/11/2026  
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
| History & Timeline / Event System | Lịch, time scales, kỷ nguyên, thời kỳ, sự kiện và timeline; nền tảng khả dụng từ lúc tạo world | Tương lai |
| World Environment Studio | Lục địa, địa chất, khí hậu, thời tiết, gió, mùa, thủy văn, sinh thái | Định hướng tương lai |
| Power System Studio | Sức mạnh, phép thuật, công nghệ và quy tắc | Tương lai |
| Story & Event Studio | Authoring cốt truyện, tuyến truyện, nhân vật, quan hệ và xung đột; mặc định mở khóa ở Milestone 4 | Tương lai |
| Plugin Studio / Soundscape Studio | Mở rộng công cụ, âm thanh môi trường | Định hướng dài hạn |
| World Forge Showcase | Xuất bản, trưng bày, khám phá và trải nghiệm các thế giới do creator tạo | Định hướng dài hạn; đặc tả sản phẩm ban đầu tại mục 10.4 |\n| Creator Hub | Hồ sơ creator, đóng góp, showcase và cộng đồng | Định hướng dài hạn |

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
| 4.3 | Portable archive v2, binary snapshot entries, mixed embedded assets, manifest integrity, v1 compatibility | **Đã triển khai; 95 automated tests pass; browser round-trip đã xác nhận** |
| 4.4 | Round-trip, clean-profile, offline, corruption/security và all-or-nothing QA | **Automated, clean-origin, offline và corruption/all-or-nothing browser QA đạt; clean browser profile độc lập còn lại** |

Phase 4.1 đã được browser QA xác nhận: save/reopen giữ ảnh; gỡ Pack ngay trong phiên không làm ảnh biến mất do snapshot fallback. Automated coverage được bổ sung cho deduplication, giữ snapshot sau uninstall và fallback khi Pack disable. Phase 4.2 đã hoàn tất theo xác nhận kiểm thử của chủ dự án ngày 14/11/2026, bao gồm hardening save/load, kiểm tra snapshot persistence/integrity sau reload và regression tests. Phase 4.3 đã thêm `.wforge` formatVersion 2 với snapshot binary entries deterministic theo SHA-256, manifest metadata, project-entry checksum, mixed Data URL + snapshot entries, tổng giới hạn archive entries, MIME/image-structure validation và vẫn hỗ trợ import v1. Automated suite hiện có 95 bài pass, bao gồm v1 compatibility, same-size snapshot mutation, corrupted/missing/undeclared entries, mixed-asset round-trip, tổng entry limit, WebP VP8/VP8L/VP8X dimension checks, MIME/structure checks, archive size limit và all-or-nothing import. Khi mở project và khi AssetLoader kích hoạt snapshot, SHA-256 thực tế được xác minh lại. Browser QA đã xác nhận export/import round-trip, snapshot fallback sau tắt/gỡ Pack, import trên clean origin không có Pack nguồn, offline save/export và từ chối archive corrupt mà không tạo project một phần. Independent clean browser profile thật sự vẫn chưa được xác nhận.

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

### 7.3 World Data Core và các Studio kế tiếp

Sau First Usable Build, phát triển theo miền dữ liệu và dependency thay vì mở nhiều Studio độc lập cùng lúc:

1. Củng cố World Data Core: stable IDs, schema/versioning, quan hệ, validation, event hooks, snapshot/patch và migration.
2. History & Timeline + Event System ở mức nền tảng; phải có từ đầu và ghi nhận được các thang thời gian/sự kiện trước khi có civilization.
3. World Environment / Planetary Systems cho Milestone 1.
4. Biology, Organism và Ecosystem cho Milestone 2.
5. Species, Civilization Foundations và Power System cho Milestone 3.
6. Nations, Politics, Conflict và Story & Event Studio cho Milestone 4.
7. Free World Mode, sau đó mới mở rộng mô phỏng chuyên sâu, Showcase và creator ecosystem.

Không cần triển khai tất cả giao diện cùng lúc: ưu tiên data contract, một vertical slice chạy xuyên suốt, rồi mở rộng capability. History & Timeline/Event System là nền tảng xuyên suốt, không phải một Studio chỉ xuất hiện ở giai đoạn cuối.


### 7.4 Đề xuất roadmap sau khi đánh giá dependency

Đánh giá: chuỗi Phase 3D → 4 → 5 → 6 → 7 hiện tại **vẫn phù hợp cho giai đoạn hoàn thiện First Usable Build**. Không nên đảo thứ tự Phase 5 và Phase 6: Asset Pack Manager cần có trước hoặc có một phần tối thiểu để Asset Pack Studio có thể cài/kiểm tra Pack an toàn. Tuy nhiên, cần điều chỉnh cách tổ chức Phase 7 và roadmap dài hạn:

- QA không nên dồn toàn bộ đến cuối Phase 7. Mỗi Phase 5/6 cần automated tests, browser acceptance và regression tương ứng; Phase 7 là vòng E2E/stability tổng thể.
- Sau Phase 4.4, Phase 5 và Phase 6 vẫn là ưu tiên hợp lý để hoàn thành trải nghiệm Asset Library. Nhưng cần chốt **First Usable Build acceptance** ngay từ đầu: người dùng có thể quản lý/import ít nhất hai Asset Libraries/Pack, dùng tài nguyên trong Map Studio, save/reopen và export/import project mà không mất asset.
- Phase 7 nên đóng vai trò **Release Readiness & First Usable Build QA**, không phải lần đầu mới kiểm thử tích hợp.
- Chỉ sau khi First Usable Build đạt mới chuyển sang các hệ thống worldbuilding lớn. Trước khi tạo các Studio chuyên biệt, phải xây World Data Core contracts và một vertical slice xuyên suốt.

#### Roadmap đề xuất

| Giai đoạn đề xuất | Phạm vi | Kết quả cần đạt / cổng chuyển tiếp |
|---|---|---|
| Current — Phase 4.4 | Kết thúc Persistence/Archive acceptance, gồm clean browser profile độc lập | Save/reopen/export/import/offline và archive safety đạt; không còn phụ thuộc Pack nguồn |
| Phase 5 — Asset Pack Management | Pack Manager, install/disable/uninstall/update, version/dependency, trạng thái thư viện được lưu bền vững | Hai hoặc nhiều Pack/Asset Libraries được quản lý ổn định; uninstall không làm mất project snapshots |
| Phase 6 — Asset Pack Studio | Tạo Pack, batch import, metadata, preview, validator, exporter và license fields | Creator có thể tạo Pack hợp lệ, export/import lại và dùng ngay trong Map Studio |
| Phase 7 — First Usable Build QA & Release Readiness | E2E xuyên suốt, clean profile, offline, accessibility cơ bản, regression, lỗi dữ liệu và usability | Đạt First Usable Build acceptance; không mở rộng sang world simulation trước khi workflow cốt lõi đáng tin cậy |
| Phase 8 — World Data Core Foundation | Chuẩn hóa World/Continent/Location/Entity IDs, relations, schema migrations, domain boundaries, validation và event/state interfaces | Một world có dữ liệu cấu trúc nhất quán; modules có thể đọc/ghi qua contract; project cũ được bảo toàn |
| Phase 9 — Time, History & Event Foundation | Time Scale, Calendar, Timeline, Era/Period, Event schema, causal links, event-to-world references | Ghi nhận được planetary, biological và historical events từ Year 0; timeline không phụ thuộc Story Studio |
| Phase 10 — Milestone Engine + World Genesis MVP | Bốn milestone definitions, dependency/gate engine, wizard khởi tạo, state preview/patch, override và checkpoint cơ bản | Có thể tạo world từ Year 0, xem trạng thái và chuyển milestone theo ruleset cấu hình; chưa cần mô phỏng vật lý chính xác |
| Phase 11 — Milestone 1 Environment | Planetary/star settings, map/geology authoring, atmosphere, climate presets, hazards và natural cycles | Creator tạo được một hành tinh có thông số và môi trường nhất quán ở mức rule-based/authoring |
| Phase 12 — Milestone 2 Life & Ecosystem | Organism/Flora Creator, population, habitat, food web, ecosystem validation, tectonic movement | Tạo và theo dõi hệ sinh thái; cảnh báo minh bạch, có thể sửa/branch/recover |
| Phase 13 — Milestone 3 Intelligent Life | Species/Race, civilization foundations, knowledge/culture, Location Advisor và Power System Studio | Có thể tạo loài có trí tuệ và các hệ thống xã hội/năng lượng phù hợp với canon |
| Phase 14 — Milestone 4 Nations & Story | Nation/political map, flags, national history, diplomacy/conflict, Story & Event Studio | Lịch sử xã hội và câu chuyện liên kết được với world entities và timeline |
| Phase 15 — Free World Mode & Advanced Evolution | Tự do chỉnh sửa, alternate timelines, simulation depth, catastrophe/recovery và branch comparison | Creator không bị giới hạn bởi milestone sequence; mọi thay đổi có thể truy vết |
| Phase 16+ — Showcase & Creator Ecosystem | Published snapshots, Showcase MVP, creator profiles, community, marketplace/plugin ecosystem | Chỉ phát triển khi publication contract, quyền riêng tư, moderation và dữ liệu world ổn định |

Các số Phase 8+ là **đề xuất roadmap mới**, không phải cam kết lịch hoặc tuyên bố đã bắt đầu. Có thể gộp các Phase liền kề nếu cùng một vertical slice và dependency đã ổn định; không nên chia nhỏ thành nhiều Studio chỉ vì khác tên miền.

#### Quy tắc triển khai theo vertical slice

Mỗi đợt phát triển worldbuilding nên hoàn thiện một luồng xuyên suốt, ví dụ:

**Create world → configure time scale → create/edit entity → record event → preview state change → apply transition → save/reopen → export/import → verify relationships.**

Không phát triển riêng UI của tất cả milestone trước rồi mới xây data model. Mỗi vertical slice cần:
1. Data schema và stable IDs.
2. Validation/ruleset có version.
3. UI tối thiểu để tạo/chỉnh sửa.
4. Liên kết map/timeline/entity.
5. Persistence và archive compatibility.
6. Automated tests + browser acceptance.
7. Migration và recovery path nếu schema thay đổi.


#### Định hướng trải nghiệm sau First Usable Build

Sau khi Core và First Usable Build ổn định, roadmap cần phát triển không chỉ năng lực tạo dữ liệu mà cả trải nghiệm trước, trong và sau khi hoàn thành một thế giới. Các hạng mục dưới đây được đặc tả tại mục 10.5 và không làm thay đổi thứ tự ưu tiên Phase hiện tại:

- World Overview và World Bible Export cần dựa trên World Data Core, schema và quan hệ ổn định.
- World Consistency Advisor cần được xây theo từng miền dữ liệu, phân biệt lỗi dữ liệu, cảnh báo/heuristic và quy tắc hư cấu do creator định nghĩa.
- World Evolution Preview cần có luồng Preview → Compare → Apply → Record to Timeline, có checkpoint/branch và không tự ghi đè canon.
- World Presentation là lớp trình bày/xuất bản trực quan, phụ thuộc Map, Timeline và publication contract.
- Templates có thể xuất hiện sớm ở mức preset an toàn; World Comparison/Branch Comparison phụ thuộc snapshot và branching.
- Collaboration, AI generation, Marketplace và tích hợp xuất sang game/story là dài hạn; không chen vào First Usable Build.

Nguyên tắc giữ chân người dùng: sau khi hoàn thành một world, họ phải có lý do để quay lại tiếp tục phát triển lịch sử, tạo nhánh giả định, hoàn thiện nội dung, chia sẻ hoặc khám phá thế giới khác. Đây là mục tiêu trải nghiệm, không phải yêu cầu biến mọi dự án thành mô phỏng liên tục.


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


### 8.6 World Genesis & Evolution System

Đây là lớp kiến trúc dài hạn kết nối World Environment, Planetary Physics, History & Timeline và World Data Core. Mục tiêu là cho phép creator định nghĩa thế giới ở thời điểm khởi nguyên, theo dõi quá trình hình thành/phát triển/biến đổi và mô tả cả khả năng suy thoái hoặc hủy diệt. **Đây là đặc tả tương lai, chưa được triển khai và không thuộc First Usable Build.**

#### 8.6.1 World Genesis — thiết lập thế giới ban đầu

Khi tạo world mới, người dùng có thể chọn một trong các luồng:
- **Quick Start:** bắt đầu bằng preset hoặc cấu hình tối giản; có thể bổ sung thông số sau.
- **Guided Genesis:** wizard từng bước để thiết lập nguồn gốc, mốc thời gian khởi đầu, cấu trúc hành tinh và trạng thái ban đầu.
- **Advanced Custom:** tự định nghĩa các tham số, quy luật và giả định của thế giới.

Wizard có thể gồm các nhóm:
1. **Origin & Initial State:** nguồn gốc thế giới, trạng thái ban đầu, epoch/time zero, điều kiện hình thành và giả định canon.
2. **Time Model:** hệ lịch, độ dài ngày/năm, đơn vị thời gian, mùa, vệ tinh và các mốc epoch.
3. **Planetary Physics:** khối lượng/bán kính, trọng lực, tốc độ tự quay, độ nghiêng trục, quỹ đạo, ngôi sao chủ, vệ tinh, lõi, lớp vỏ và từ trường.
4. **Geology & Tectonics:** cấu trúc vỏ, mảng kiến tạo, trạng thái ban đầu, núi lửa, địa chấn và chu trình địa chất.
5. **World Environment:** khí quyển, nhiệt độ, áp suất, độ ẩm, gió, mưa, đại dương, dòng hải lưu, thủy văn và biome.
6. **Hazards & Life Conditions:** thiên tai tự nhiên, rủi ro thiên văn, điều kiện cho sự sống và mức độ ổn định ban đầu.

Các nhóm nâng cao phải có thể bỏ qua hoặc cấu hình về sau. Không bắt mọi creator hoàn thành một bảng thông số khoa học phức tạp trước khi được tạo bản đồ. Preset chỉ là điểm khởi đầu, không phải luật bắt buộc.

#### 8.6.2 Time Model — nhiều thang thời gian

Phải phân biệt rõ:
- **Planetary/Geological Time:** hình thành hành tinh, nguội đi, kiến tạo, hình thành lục địa và đại dương; có thể kéo dài hàng triệu hoặc hàng tỷ năm.
- **Biological/Evolutionary Time:** nguồn gốc sự sống, tiến hóa, tuyệt chủng và biến đổi hệ sinh thái.
- **Civilizational/Historical Time:** kỷ nguyên, thời kỳ, triều đại, chiến tranh và sự kiện xã hội.
- **Local Calendar Time:** ngày, tháng, năm và cách ghi ngày theo lịch riêng của thế giới.

Không được mặc định một năm lịch của nền văn minh tương đương một năm địa chất. Timeline cần hỗ trợ đơn vị tùy chỉnh, giá trị thời gian lớn, độ chính xác khác nhau và chuyển đổi giữa các thang khi người dùng định nghĩa được quy tắc. Ví dụ “năm 0–100 triệu” phải được hiểu là khoảng thời gian địa chất theo đơn vị đã chọn, không phải 100 triệu năm lịch dân sự nếu chưa có quy ước tương ứng.

#### 8.6.3 Historical Era Constraints — điều kiện tồn tại theo giai đoạn

Mỗi Era/Period có thể khai báo:
- Khoảng thời gian và thang thời gian áp dụng.
- Điều kiện môi trường/địa chất tối thiểu hoặc tối đa.
- Nhóm entity/asset được phép xuất hiện, bị khóa hoặc chỉ được phép khi có điều kiện.
- Điều kiện mở khóa theo sự kiện, trạng thái thế giới hoặc tiến trình tiến hóa.
- Quy tắc ngoại lệ do creator tự định nghĩa.

Ví dụ bộ preset minh họa:
- **Genesis / Early Geological:** địa hình, lục địa, biển, hồ, sông, núi, núi lửa; chưa mở khóa cây cối, động vật, dân cư, nhà cửa hay thành quách.
- **Primitive Life:** cho phép các dạng sống sơ khai và hệ sinh thái đơn giản khi điều kiện phù hợp.
- **Biological Diversification:** mở rộng thực vật, động vật và biome.
- **Prehistoric:** cho phép các nhóm sinh vật tiền sử theo canon của thế giới.
- **Civilization:** mở khóa settlement, dân cư, công trình, quốc gia và tổ chức khi có điều kiện nền tảng.
- **Industrial/Modern/Future:** mở khóa công nghệ và asset theo tiến trình do creator định nghĩa.

Đây là preset tùy biến, không phải dòng tiến hóa bắt buộc hay mô hình lịch sử phổ quát. Mỗi Asset Pack asset/asset definition trong tương lai có thể khai báo metadata như earliest/latest era, prerequisites, required environment, entity category và compatibility tags. Runtime kiểm tra metadata này với thời điểm/trạng thái hiện tại để cảnh báo hoặc ngăn đặt asset theo policy của project.

Cần có các chế độ:
- **Enforce:** chặn thao tác vi phạm quy tắc.
- **Warn:** cho phép nhưng hiển thị cảnh báo.
- **Creative Override:** creator chủ động bỏ qua giới hạn và ghi nhận ngoại lệ.

Không được khóa asset chỉ dựa vào tên category hoặc giả định cứng trong Core; dùng metadata có schema, validation và versioning.

#### 8.6.4 World State Evolution — sự kiện làm thay đổi thế giới

History & Timeline không chỉ lưu văn bản mô tả. Một event có thể mang thay đổi trạng thái có cấu trúc:
- thời điểm, thời lượng và time scale;
- nguyên nhân, điều kiện kích hoạt và quan hệ nhân quả;
- entity/region/layer bị ảnh hưởng qua stable IDs;
- loại thao tác thay đổi (thêm, cập nhật, xóa/đánh dấu tuyệt chủng, biến đổi thuộc tính, thay đổi quan hệ);
- tham số và phạm vi ảnh hưởng;
- tham chiếu trạng thái trước/sau hoặc patch có thể đảo ngược;
- hậu quả tức thời, hậu quả dây chuyền và mức độ chắc chắn;
- nguồn tạo: manual, assisted hoặc simulation; seed và phiên bản quy tắc nếu có.

Ví dụ chuỗi địa chất: hình thành hành tinh → vỏ nguội và ổn định → mảng kiến tạo phân tách/dịch chuyển → hình thành lục địa, núi và bồn đại dương → thay đổi khí hậu/hải lưu. Event có thể được creator viết thủ công, tạo bằng công cụ hỗ trợ hoặc sinh từ mô phỏng. Hệ thống không được tự giả định kết quả mô phỏng là canon cho tới khi creator chấp nhận.

#### 8.6.5 World State Manager — trạng thái, snapshot và nhánh lịch sử

Mô hình khái niệm:

**World State(t) = Initial State + các Event/Patch có hiệu lực đến t + các Derived Results được tính từ tham số và quy tắc có version.**

Yêu cầu:
- Không phá hủy dữ liệu gốc khi áp dụng event; lưu patch/delta có thể kiểm tra và hoàn tác.
- Snapshot theo mốc quan trọng để tăng tốc truy xuất trạng thái.
- Có thể xem/so sánh before–after, tua timeline và tái dựng trạng thái tại một thời điểm.
- Undo/redo cho thao tác chỉnh sửa; event đã công bố/được tham chiếu phải có chính sách sửa đổi minh bạch.
- Versioning cho schema, simulation rules và snapshot.
- Hỗ trợ branch/alternate timeline trong tương lai mà không ghi đè canon chính.
- Dữ liệu dẫn xuất phải có provenance, tham số và seed để tái lập; không nhầm cache với canonical data.

#### 8.6.6 Evolution Engine — ba chế độ điều khiển

1. **Manual:** creator tự chỉnh sửa trạng thái và ghi nhận event; engine chỉ kiểm tra hợp lệ.
2. **Assisted:** hệ thống đề xuất hậu quả, event liên quan, điều kiện mở khóa hoặc cảnh báo; creator duyệt trước khi áp dụng.
3. **Simulation:** engine tính kết quả dựa trên rule set, tham số, độ phân giải và seed được chọn; creator có thể chấp nhận, chỉnh sửa hoặc loại bỏ kết quả.

Không yêu cầu mọi event đều được mô phỏng tự động. Các quy luật fantasy/sci-fi tùy chỉnh phải được hỗ trợ; quy tắc vật lý Trái Đất chỉ là preset tùy chọn.

#### 8.6.7 Temporal UI — trải nghiệm theo thời gian

Định hướng UI:
- Genesis Wizard khi tạo world, có thể bỏ qua cấu hình nâng cao.
- Era/Period selector và trạng thái khóa/mở asset trong Asset Library/Tool.
- Timeline scrubber hoặc time navigator để chọn mốc và xem bản đồ ở trạng thái tương ứng.
- Lớp hiển thị bật/tắt cho địa chất, khí hậu, thủy văn, sinh thái và văn minh.
- Before/After comparison, danh sách event, cảnh báo và preview thay đổi trước khi commit.
- Chế độ xem lịch sử và hiện tại; nhánh timeline thay thế là tính năng tương lai.

#### 8.6.8 Phụ thuộc và nguyên tắc dữ liệu

- World Data Core quản lý stable IDs, schema, relation và temporal references; không nhúng toàn bộ logic mô phỏng vào UI.
- History & Timeline sở hữu event/time records; World Environment sở hữu dữ liệu môi trường; Planetary Configuration sở hữu tham số hành tinh; World State Manager điều phối trạng thái theo thời gian.
- Mở rộng event schema hiện có bằng affected entity IDs, typed state operations, causal links, time scale, before/after references và simulation metadata.
- Validation phải phân biệt lỗi cấu trúc, mâu thuẫn vật lý theo preset, cảnh báo rủi ro và ngoại lệ sáng tạo.
- Kết quả mô phỏng cần deterministic khi cùng input/rule version/seed; nếu dùng yếu tố ngẫu nhiên phải có seed và hiển thị rõ.
- Không để import/export, snapshot hoặc migration làm mất lịch sử, branch hay liên kết temporal.

### 8.7 World Survival & Catastrophe System

Hệ thống đánh giá khả năng duy trì trạng thái của hành tinh, môi trường, sinh quyển và nền văn minh theo bộ quy tắc của world. Đây là công cụ cảnh báo/hỗ trợ sáng tác, không phải chứng nhận khoa học tuyệt đối.

#### 8.7.1 World State Validation

Khi creator thiết lập thông số hoặc thêm event, validator đánh giá:
- Giá trị ngoài giới hạn schema hoặc đơn vị không hợp lệ.
- Mâu thuẫn giữa các thông số và điều kiện tồn tại đã khai báo.
- Mâu thuẫn giữa môi trường với entity/asset đang tồn tại.
- Điều kiện tiên quyết của event không được đáp ứng.
- Rủi ro có thể dẫn đến suy thoái môi trường, tuyệt chủng hoặc mất ổn định.

Ví dụ: creator khai báo nhiệt độ bề mặt cực cao, không có khí quyển nhưng đồng thời muốn duy trì hệ sinh thái phong phú. Validator cần chỉ ra mâu thuẫn theo rule set hiện hành, nhưng vẫn cho phép ngoại lệ nếu creator xác định đây là thế giới có quy luật giả tưởng.

Ba lựa chọn xử lý:
1. **Accept Anyway / Creative Override:** giữ thông số và ghi nhận ngoại lệ.
2. **Auto Adjust:** xem đề xuất thay đổi thông số; không tự áp dụng nếu chưa được duyệt.
3. **Simulate Consequences:** giữ nguyên đầu vào và xem chuỗi hậu quả có thể xảy ra.

#### 8.7.2 Survival indicators

Có thể cung cấp các chỉ báo độc lập, không gộp bắt buộc thành một điểm duy nhất:
- Planetary Stability — ổn định tổng thể của hành tinh.
- Orbital Stability — ổn định quỹ đạo và hệ vệ tinh.
- Geological Stability — trạng thái địa chất/kiến tạo.
- Climate Stability — mức ổn định khí hậu.
- Atmospheric Stability — khả năng duy trì khí quyển theo rule set.
- Magnetic Field Status — trạng thái từ trường.
- Biological Viability — khả năng duy trì sự sống.
- Civilization Viability — khả năng duy trì nền văn minh.

Mỗi chỉ báo cần định nghĩa thang đo, phạm vi áp dụng, độ tin cậy và dữ liệu đầu vào. Không tạo ra con số phần trăm có vẻ chính xác nếu mô hình chưa đủ căn cứ. Một thế giới có thể ổn định về địa chất nhưng nguy hiểm về khí hậu; cần hiển thị từng chiều riêng.

#### 8.7.3 Catastrophe & Extinction Events

Nhóm event tiềm năng:
- **Astronomical:** thiên thạch/comet va chạm, thay đổi quỹ đạo, bất ổn vệ tinh, nguy cơ vệ tinh va chạm hoặc bị phá hủy.
- **Geological:** siêu phun trào, động đất lớn, hoạt động kiến tạo cực đoan, tái cấu trúc bề mặt.
- **Magnetic:** suy giảm/biến đổi từ trường, đảo cực địa từ.
- **Climatic:** băng hà, nóng lên cực đoan, đóng băng hoặc mất cân bằng khí hậu.
- **Oceanic/Hydrological:** thay đổi mực nước biển, đại hồng thủy, suy giảm/bốc hơi đại dương, biến đổi dòng hải lưu.
- **Biological:** dịch bệnh, sụp đổ hệ sinh thái, đại tuyệt chủng.
- **Civilizational:** chiến tranh, sụp đổ xã hội, thảm họa công nghệ hoặc hạt nhân theo bối cảnh thế giới.

Hậu quả phải phụ thuộc vào thời điểm và World State khi event xảy ra. Cùng một vụ va chạm thiên thạch có thể chỉ thay đổi địa hình ở thế giới chưa có sự sống, gây tuyệt chủng sinh học ở thế giới có hệ sinh thái, hoặc làm sụp đổ nền văn minh ở thế giới có xã hội phát triển.

Ví dụ rủi ro như hành tinh quá gần sao chủ, quỹ đạo không ổn định, vệ tinh mất ổn định hoặc trọng lực/khí quyển không phù hợp phải được đánh giá bằng rule set có phạm vi và giả định rõ. Đảo cực địa từ không được mặc định là tận thế; chỉ tạo các hậu quả tương ứng với mô hình từ trường, khí quyển và môi trường đã chọn. Tương tự, không suy diễn một vệ tinh chắc chắn rơi vào hành tinh chỉ từ một thông số khoảng cách đơn lẻ nếu chưa có mô hình quỹ đạo.

#### 8.7.4 Severity và World Failure

Mức trạng thái tham khảo:
- **Stable:** chưa phát hiện rủi ro vượt ngưỡng.
- **Warning:** có bất thường hoặc rủi ro cần theo dõi.
- **Critical:** nguy cơ nghiêm trọng, một số hệ thống có thể mất ổn định.
- **Catastrophic:** thảm họa đang diễn ra hoặc nhiều hệ thống suy sụp.
- **Extinction:** nhóm sự sống được theo dõi đã tuyệt chủng hoặc không còn khả năng tồn tại theo tiêu chí đã chọn.
- **World Failure:** thế giới không còn đáp ứng điều kiện tồn tại/khả năng mô phỏng do creator định nghĩa.

World Failure không nhất thiết xóa project hoặc chặn người dùng tiếp tục sáng tác. Đó là trạng thái của thế giới trong mô hình; creator vẫn có thể xem lịch sử, tạo nhánh thay thế, sửa canon hoặc tiếp tục sau thảm họa. Cần phân biệt “không thể duy trì sự sống”, “nền văn minh sụp đổ” và “hành tinh bị phá hủy hoàn toàn”.

#### 8.7.5 Causal chain và Timeline integration

Khi simulation tạo thảm họa, quy trình khái niệm:
1. Engine phát hiện điều kiện kích hoạt hoặc creator yêu cầu event.
2. Tạo event và chuỗi hậu quả dự kiến có quan hệ nhân quả.
3. Preview phạm vi, mức độ, đối tượng bị ảnh hưởng và độ tin cậy.
4. Creator duyệt hoặc chỉnh sửa.
5. World State Manager áp dụng patch và tạo snapshot phù hợp.
6. Environment/Biological/Civilization modules tính lại các dữ liệu dẫn xuất liên quan.
7. Era Constraints đánh giá lại asset/entity có còn thỏa điều kiện.
8. History & Timeline ghi nhận event, hậu quả và trạng thái sinh tồn mới.

Chuỗi hậu quả phải có thể truy vết và hoàn tác/điều chỉnh theo chính sách dữ liệu. Không tự động biến một cảnh báo thành thảm họa đã xảy ra nếu creator chưa chọn chế độ simulation tự động và chưa chấp thuận policy tương ứng.

### 8.8 Lộ trình triển khai riêng cho Genesis, Evolution và Survival

Các cấp độ phát triển đề xuất, chỉ bắt đầu sau khi First Usable Build và các dependency dữ liệu đã đủ ổn định:

| Level | Phạm vi | Kết quả mong muốn |
|---|---|---|
| 1 | Era Constraints | Metadata điều kiện theo Era/Period; cảnh báo/khóa asset có thể cấu hình |
| 2 | World Genesis & Planetary Configuration | Wizard, time model, preset và lưu tham số hành tinh ban đầu |
| 3 | World Validation | Phát hiện dữ liệu không hợp lệ, mâu thuẫn và rủi ro; override có kiểm soát |
| 4 | Catastrophe Events | Event thảm họa thủ công/assisted, hậu quả có cấu trúc và liên kết Timeline |
| 5 | World State Manager | Patch, snapshot, before/after, rewind và versioning |
| 6 | Assisted Evolution | Đề xuất thay đổi môi trường, sinh học, địa chất và văn minh để creator duyệt |
| 7 | Deterministic Simulation | Mô phỏng từng miền với rule set, độ phân giải, seed và phạm vi được giới hạn |
| 8 | Advanced Simulation | Mô hình chuyên sâu cho quỹ đạo, kiến tạo, khí hậu, thủy văn và sinh thái |

Không xây mô phỏng vật lý toàn diện ngay từ đầu. Tách rõ:
- **Authored evolution:** creator tự mô tả và áp dụng thay đổi.
- **Rule-based/assisted evolution:** hệ thống kiểm tra hoặc đề xuất hậu quả theo quy tắc.
- **Scientific simulation:** mô hình tính toán chuyên dụng có giới hạn, dữ liệu và validation riêng.

Các ví dụ “năm 0–100 triệu, các mảng kiến tạo phân tách” là kịch bản minh họa. Kết quả địa chất thực tế phụ thuộc mô hình và điều kiện đầu vào; không hard-code một trình tự duy nhất cho mọi world.

**Acceptance criteria dài hạn**
- Tạo world bằng Quick Start mà không bắt buộc cấu hình nâng cao.
- Lưu được time scale, genesis parameters và trạng thái ban đầu có version.
- Era constraints có thể khóa/cảnh báo asset theo metadata và có Creative Override.
- Timeline event có thể mô tả thay đổi state có cấu trúc, nguyên nhân và hậu quả.
- Xem được trạng thái trước/sau và tái dựng một mốc thời gian từ snapshot + patches.
- Validation phân biệt lỗi dữ liệu, cảnh báo rủi ro và ngoại lệ do creator chủ động.
- Thảm họa có thể được ghi nhận thành event, hậu quả liên kết và có thể kiểm tra/hoàn tác.
- Cùng input, rule version và seed cho kết quả deterministic trong phạm vi engine đã công bố.
- Import/export và schema migration bảo toàn temporal data, stable IDs và snapshot references.

**Scope note:** Toàn bộ mục 8.6–8.8 là định hướng và đặc tả tương lai. History & Timeline hiện tại mới lưu calendars, eras, periods, records, events và một số quan hệ tham chiếu; chưa có Genesis Wizard, Era Constraint enforcement, planetary physics, survival scoring, world-state patching hay catastrophe/evolution simulation. Không được mô tả các tính năng này là đã triển khai. First Usable Build vẫn là ưu tiên hiện tại.

---


### 8.9 World Evolution Milestones — Cột mốc và chế độ tiến hóa thế giới

#### 8.9.1 Mục tiêu và quan hệ với History & Timeline

World Evolution Milestones là lớp trải nghiệm tiến hóa có định hướng, xây dựng trên World Genesis & Evolution, World State Manager và History & Timeline. Mỗi milestone không chỉ là một dòng sự kiện để đọc: nó mở một **chế độ sáng tạo chuyên biệt**, cung cấp công cụ bản đồ, cấu hình, loại asset, hướng dẫn và điều kiện đánh giá phù hợp với giai đoạn phát triển thế giới.

History & Timeline tiếp tục là hệ thống ghi nhận thời gian và sự kiện. Milestone Engine là lớp điều phối tiến trình: xác định milestone hiện tại, điều kiện đủ để chuyển tiếp, các lựa chọn có ảnh hưởng, nhánh phát triển và kết quả đánh giá. Khi milestone làm thay đổi thế giới, thay đổi phải được ghi thành state transition/patch có cấu trúc và liên kết về Timeline; không chỉ lưu một nhãn “đã hoàn thành”.

Đây là đặc tả tương lai, chưa được triển khai và không thuộc First Usable Build.

#### 8.9.2 Bộ milestone mặc định — mô hình bốn giai đoạn

World Forge Studio sử dụng bốn milestone lớn làm **lộ trình mặc định dễ hiểu**, thay cho chuỗi mười milestone nhỏ. Các công đoạn khoa học/kỹ thuật chi tiết vẫn tồn tại dưới dạng bước con, workspace hoặc checklist bên trong milestone tương ứng. Bốn milestone không phải quy luật tiến hóa bắt buộc: creator có thể tùy chỉnh, bỏ qua, thêm nhánh hoặc bắt đầu từ một trạng thái có sẵn.

| Milestone | Giai đoạn | Mục tiêu chính | Công cụ được mở khóa / phạm vi |
|---|---|---|---|
| 1 | **Year 0 — World Formation** | Hình thành hành tinh, hệ thiên thể và môi trường tự nhiên ban đầu | Planetary/Star System, collision & celestial-body tools, địa hình/lục địa/đại dương, địa chất, khí quyển, khí hậu, thiên tai và chu kỳ tự nhiên |
| 2 | **Life Forms — Sự sống xuất hiện và phát triển** | Hình thành sinh vật, thực vật và hệ sinh thái | Tectonic Movement, Organism/Creature Creator, Flora & Biome tools, population/habitat placement, food webs và ecosystem advisor |
| 3 | **Intelligent Life — Sự sống có trí tuệ** | Phát triển loài có trí tuệ, xã hội sơ khai, văn hóa và các hệ thống năng lượng/sức mạnh | Species & Race tools, Civilization foundations, Location Advisor, **Power System Studio**, kiến thức và truyền thừa |
| 4 | **Nations — Các quốc gia và lịch sử xã hội** | Hình thành quốc gia, thể chế, lãnh thổ, xung đột và câu chuyện | Nation/Political Map tools, flags, national history, conflict tools, **Story & Event Studio** và công cụ nhân vật/cốt truyện nâng cao |

##### Milestone 1 — Year 0: World Formation

Creator có thể bắt đầu từ một đám mây bụi, hệ sao, hành tinh sơ khai hoặc preset/custom initial state. Các nhóm công cụ gồm:

- **Astronomical & Planetary Formation:** tạo/chỉnh sửa ngôi sao, hành tinh, vệ tinh và thiên thể; mô tả va chạm, bồi tụ bụi/vật chất và các sự kiện hình thành. Tham số có thể gồm khối lượng, bán kính, mật độ, trọng lực, quỹ đạo, khoảng cách tới sao, chu kỳ tự quay, độ nghiêng trục, số lượng/vai trò vệ tinh và cấu trúc hệ sao.
- **Geography & Geological Authoring:** vẽ/chỉnh sửa lục địa, đảo, biển, đại dương, núi, cao nguyên, sông, hồ, núi lửa và các vùng địa chất. Công cụ mô phỏng va chạm thiên thể hoặc kiến tạo phải có preview và cho phép creator sửa kết quả.
- **Planetary Environment:** cấu hình khí quyển theo hỗn hợp khí/phân tử, tỷ lệ, áp suất riêng phần và tổng áp suất; cấu hình nhiệt độ, độ ẩm, gió, mưa, mùa và các yếu tố môi trường.
- **Climate & Natural Cycles:** thiết lập vĩ độ/đới khí hậu, hoàn lưu khí quyển, gió mùa, dòng hải lưu, chu kỳ mùa, thủy văn và các chu kỳ tự nhiên có tính định kỳ.
- **Geophysical & Catastrophe Settings:** từ trường, hoạt động địa chất, núi lửa, động đất, bão, va chạm thiên thể và các thiên tai khác theo rule set.

UI cần trực quan: bản đồ và sơ đồ thiên thể là trung tâm; tham số nâng cao nằm trong panel theo ngữ cảnh, có preset, giải thích và preview. Không buộc người mới phải nhập toàn bộ thông số vật lý trước khi bắt đầu.

Scientific Advisor phải phân biệt nguyên tố với khí/phân tử/hợp chất và giải thích hệ quả theo giả định. Không được kết luận “không có oxygen thì không thể có sự sống”: sự sống kỵ khí có thể tồn tại; điều kiện sống phải được đánh giá theo hóa sinh, dung môi, nguồn năng lượng và ruleset creator chọn. Cảnh báo không tự động trở thành điều kiện chặn, trừ khi được khai báo là Required Condition trong ruleset.

##### Milestone 2 — Life Forms: Origin, Evolution & Ecosystems

Milestone này mở công cụ dịch chuyển mảng kiến tạo qua các khoảng thời gian địa chất và xây dựng sinh quyển:

- **Tectonic Movement:** cấu hình mảng kiến tạo, hướng/tốc độ dịch chuyển, va chạm/tách giãn và preview thay đổi lục địa qua thời gian. Timeline phải xử lý khoảng thời gian hàng triệu hoặc hàng tỷ năm.
- **Flora & Organism Creator:** tạo thực vật, vi sinh vật, động vật và sinh vật custom; có thư viện loài mặc định lẫn loài do creator thiết kế.
- **Species Parameters:** hình thái, kích thước, môi trường sống, nhu cầu năng lượng/dinh dưỡng, khả năng sinh sản, tuổi thọ, di chuyển, thích nghi và các đặc tính sinh học liên quan.
- **Population & Habitat Placement:** xác định quần thể, mật độ/phạm vi, điểm xuất hiện, vùng cư trú, sức chứa môi trường và biến động theo thời gian.
- **Ecosystem & Food Web:** mô tả quan hệ săn mồi, con mồi, cạnh tranh, cộng sinh, ký sinh, nguồn thức ăn, phân bố sinh khối và tác động môi trường.
- **Evolution Advisor:** cảnh báo hệ quả có thể xảy ra với quần thể, con mồi, đối thủ cạnh tranh, môi trường sống, tuyệt chủng cục bộ và độ ổn định hệ sinh thái.

Không được mặc định một đặc điểm như móng vuốt, sức mạnh săn mồi hoặc vai trò predator tự động ngăn cản trí tuệ xuất hiện. Advisor phải đánh giá tác động sinh thái theo dữ liệu, giả định và ruleset; không dùng quy tắc đạo đức hóa hoặc một chỉ số đơn giản để kết luận đường tiến hóa. Nếu một hệ sinh thái mất ổn định, hệ thống có thể cảnh báo, đánh dấu không đủ điều kiện theo Challenge Mode hoặc gợi ý phục hồi. Creator có thể thay đổi môi trường, điều chỉnh quần thể, tạo sự kiện thảm họa, quay về checkpoint, tạo nhánh hoặc bắt đầu thế giới khác; không bao giờ xóa world/project tự động.

##### Milestone 3 — Intelligent Life: Species, Society & Power Systems

Khi creator xác nhận xuất hiện loài có trí tuệ theo định nghĩa/ruleset của thế giới, các công cụ sau được mở khóa:

- **Species & Race Studio:** mô tả giải phẫu, giác quan, khả năng vận động, vòng đời, sinh sản, thích nghi và các đặc điểm sinh học của loài/chủng tộc.
- **Civilization Foundations:** mô tả tổ chức xã hội sơ khai, hình thức cư trú, ngôn ngữ, tri thức, tập quán, văn hóa, giáo dục và phương thức truyền thừa kiến thức.
- **Location Advisor:** đề xuất khu vực phù hợp để định cư/phát triển dựa trên khí hậu, địa hình, nguồn nước, tài nguyên, rủi ro, khả năng tiếp cận và đặc điểm sinh học. Mỗi đề xuất phải nêu lý do và mức độ chắc chắn; creator luôn có thể chọn vị trí khác hoặc override.
- **Power System Studio:** mở khóa công cụ thiết kế hệ thống sức mạnh, năng lượng hoặc phép thuật của thế giới. Có thể cấu hình nguồn, quy tắc tiếp nhận, chuyển đổi, lưu trữ, truyền tải, tiêu thụ, giới hạn, chi phí, rủi ro và tương tác với môi trường/sinh vật.
- **Energy & Technology Progression:** với thế giới không có phép thuật, Power System Studio vẫn có thể mô tả việc khai thác và kiểm soát năng lượng: lửa/sinh khối, sức nước/gió, nhiên liệu, hơi nước, điện, hạt nhân, tái tạo hoặc công nghệ giả tưởng. Mở khóa công cụ không đồng nghĩa mọi nền văn minh phải lập tức sử dụng công nghệ đó.
- **World Objects & Structures:** mở rộng công cụ đặt nơi cư trú, nhà cửa, công trình, vật dụng, trang phục và nhân vật phù hợp với thời đại.

Phân biệt đặc điểm sinh học của loài với văn hóa, hành vi học được và tính cách cá nhân. Không gán một tính cách duy nhất cho toàn bộ một chủng loài. “Intelligent life” không bắt buộc phải phát triển thành nền văn minh giống con người; tiêu chí trí tuệ, xã hội và công nghệ phải do creator định nghĩa hoặc chọn preset.

##### Milestone 4 — Nations: Politics, Conflict & Storytelling

Khi các cộng đồng phát triển thành thực thể chính trị/xã hội theo canon của creator, mở khóa:

- **Nation & Political Map:** quốc gia, lãnh thổ, biên giới, thủ đô, đơn vị hành chính, biểu tượng và cờ.
- **National History:** nguồn gốc quốc gia, hình thành thể chế, thay đổi lãnh thổ, triều đại/chính quyền, liên minh, phân tách và các mốc lịch sử.
- **Conflict & Diplomacy:** tranh chấp, chiến tranh, xung đột nội bộ, ngoại giao, chinh phục, hiệp ước và hậu quả theo thời gian.
- **Story & Event Studio:** công cụ sáng tác cốt truyện, tuyến truyện, nhân vật, quan hệ, động cơ, xung đột, arc, chương/cảnh và nhánh lựa chọn.
- **Character & Narrative Tools:** tạo nhân vật, nguồn gốc/tuổi thơ, quê hương, hành trình, quan hệ và liên kết với sự kiện, địa điểm, tổ chức, quốc gia.

Sau khi đạt hoặc chủ động bỏ qua Milestone 4, creator có thể bật **Free World Mode**: không còn milestone gate bắt buộc; có thể chỉnh sửa mọi miền dữ liệu đã mở khóa, quay lại thời kỳ trước, thêm sự kiện, viết lịch sử thay thế hoặc tiếp tục phát triển thế giới theo bất kỳ hướng nào. Free World Mode không xóa milestone, lịch sử hay các nhánh trước đó.

##### History & Timeline và Event System — khả dụng từ đầu

History & Timeline không bị khóa đến Milestone 4. Hệ thống lịch sử/thời gian phải tồn tại ngay từ lúc tạo project/world để ghi nhận toàn bộ quá trình, kể cả khi chưa có sự sống hoặc nền văn minh:

- **History & Timeline:** tạo timeline từ đầu; hỗ trợ planetary/geological, biological/evolutionary và civilizational/historical time scales cùng local calendar. Người dùng có thể tạo, đặt tên, sắp xếp và liên kết các mốc.
- **Event System:** khả dụng xuyên suốt mọi milestone. Có thể ghi nhận va chạm thiên thể, hình thành đại dương, dịch chuyển mảng, phun trào núi lửa, biến đổi khí hậu, xuất hiện/tuyệt chủng loài, di cư, phát minh, chiến tranh hoặc sự kiện cá nhân tùy giai đoạn.
- **Story & Event Studio:** là bộ công cụ authoring nâng cao, chỉ mở khóa mặc định ở Milestone 4. Nó tiêu thụ và tạo dữ liệu Event/Timeline, nhưng không phải điều kiện để Event System ghi nhận sự kiện ở các milestone trước.

Sự kiện cần lưu thời điểm/thời lượng theo time scale, loại, nguyên nhân, thực thể liên quan, vị trí/phạm vi, tác động, nguồn dữ liệu và quan hệ nhân quả nếu có. Không ép sự kiện địa chất vào lịch dân sự hoặc giả định mọi event đều do nhân vật tạo ra.

##### Quy tắc tuyến tiến hóa và quyền tự do

- Milestone mặc định là hướng dẫn; creator có thể đổi thứ tự, thêm/bỏ/gộp milestone, tạo milestone tùy chỉnh, chọn alternate starting point hoặc bật Creative Mode.
- Milestone mở capability/tool phù hợp; không tự động bắt creator sử dụng toàn bộ công cụ đã mở.
- Gate phân biệt Required Conditions, Recommended Conditions và Warnings; chỉ Required Conditions trong ruleset hiện hành mới có thể chặn chuyển tiếp.
- Có thể đánh dấu Skipped/Overridden và ghi lại quyết định; mọi override phải có thể truy vết.
- Không có giả định phổ quát rằng mọi thế giới phải có nước, oxygen, sự sống carbon, loài người, quốc gia hoặc phép thuật.

#### 8.9.3 Milestone Mode và bản đồ chuyên biệt

Khi mở một milestone, Studio chuyển sang một workspace có cấu hình phù hợp:
- **World View:** bản đồ/toàn cảnh và trạng thái thế giới tại thời điểm đang xét.
- **Milestone Workspace:** công cụ chuyên biệt cho miền đang phát triển, ví dụ tectonic editor, atmosphere composer, ocean/solvent editor hoặc life/ecosystem editor.
- **Configuration Panel:** các tham số, lựa chọn, metadata và preset.
- **Scientific/Worldbuilding Advisor:** giải thích điều kiện, giả định, mâu thuẫn, hệ quả có thể xảy ra và mức độ chắc chắn.
- **Evolution Preview:** xem trước thay đổi dự kiến trước khi áp dụng.
- **Milestone Progress:** trạng thái hoàn thành, điều kiện còn thiếu, asset/tool được mở khóa và các rủi ro.

Không cần xây một editor hoàn toàn riêng biệt cho mỗi milestone nếu các editor dùng chung được. Milestone nên khai báo capability/tool set, schema cấu hình và policy; workspace ghép các công cụ hiện có với module chuyên biệt khi cần.

#### 8.9.4 Origin of Life — cấu hình nguồn gốc sự sống

Đây là milestone có thể tạo khác biệt cho World Forge Studio. Creator có thể khai báo nền tảng sinh học:
- **Carbon-based life:** sự sống dựa trên hóa học carbon; đây là dạng sự sống duy nhất đã được xác nhận hiện nay.
- **Hypothetical silicon-based life:** giả thuyết/sáng tạo suy đoán, không được trình bày như một dạng sự sống đã được khoa học xác nhận.
- **Alternative/custom biochemistry:** hóa sinh khác do creator định nghĩa, có thể dựa trên luật khoa học suy đoán hoặc quy tắc hư cấu.

Không dùng một lựa chọn đơn lẻ kiểu “chọn một nguyên tố để quyết định toàn bộ khí quyển/đất”. Cần cho phép mô tả **hỗn hợp và thành phần**:
- Khí quyển: các khí/phân tử, tỷ lệ thành phần, áp suất riêng phần, tổng áp suất và nhiệt độ.
- Vỏ hành tinh/đất/đá: khoáng vật, hợp chất, nguyên tố hoặc nhóm vật chất theo tỷ lệ/độ phong phú.
- Dung môi: nước, ammonia hoặc dung môi do creator định nghĩa.
- Nguồn năng lượng: ánh sáng, địa nhiệt, phản ứng hóa học hoặc nguồn giả tưởng.
- Môi trường sống: đại dương, miệng phun thủy nhiệt, bề mặt, dưới lòng đất, khí quyển hoặc môi trường tùy chỉnh.
- Điều kiện: nhiệt độ, áp suất, độ ổn định, tính sẵn có của nguyên liệu và các điều kiện khác do rule set yêu cầu.

Scientific Advisor cần phân biệt nguyên tố, phân tử, hợp chất và khoáng vật. Ví dụ:
- Helium là nguyên tố/khí đơn nguyên tử, không phải một hợp chất; do nhẹ và trơ về mặt hóa học, khí quyển giàu helium trên hành tinh giống Trái Đất có thể khó giữ ổn định qua thời gian địa chất. Đây là cảnh báo theo giả định vật lý, không phải lệnh cấm thế giới hư cấu.
- CO₂ là phân tử/hợp chất, không phải nguyên tố.
- Silicate là nhóm khoáng vật/hợp chất chứa silicon và oxygen, không phải một nguyên tố.
- “Đất giàu lưu huỳnh” cần được mô hình hóa bằng thành phần lưu huỳnh và các hợp chất/khoáng vật liên quan; lưu huỳnh nguyên tố không mặc nhiên là nền đất màu mỡ.

Các ví dụ carbon-based/water-based hoặc silicon-based/ammonia-based chỉ là preset minh họa. Engine phải nêu rõ giả định, không tuyên bố đã mô phỏng được quá trình abiogenesis thực tế nếu chưa có mô hình chuyên dụng.

#### 8.9.5 Milestone Gate và điều kiện chuyển tiếp

Mỗi milestone có thể khai báo:
- Required conditions: điều kiện bắt buộc để đủ chuẩn.
- Recommended conditions: khuyến nghị nhằm tăng độ ổn định/khả năng phát triển.
- Warnings and risks: điều kiện đáng lưu ý nhưng không nhất thiết chặn tiến trình.
- Unlock rules: asset, tool hoặc loại entity được phép sử dụng từ milestone này.
- Transition effects: các state patch/event được tạo khi milestone được xác nhận.
- Validation ruleset: bộ quy tắc, phiên bản và mức độ nghiêm ngặt được sử dụng.

Trạng thái milestone:
- **Locked:** chưa thể bắt đầu do dependency hoặc điều kiện trước đó.
- **Available:** có thể bắt đầu.
- **In Progress:** đang cấu hình/sáng tạo.
- **Qualified:** đạt điều kiện chuyển tiếp theo rule set đang dùng.
- **Failed:** không đạt hoặc đường tiến hóa hiện tại bị đứt gãy theo điều kiện challenge đã định nghĩa.
- **Skipped/Overridden:** creator chủ động bỏ qua hoặc ghi đè trong Creative Mode; phải lưu lại quyết định và lý do nếu cần.

Phân biệt hai loại thất bại:
- **Soft Failure / Not Qualified:** thiếu điều kiện hoặc có mâu thuẫn có thể sửa; creator có thể quay lại chỉnh cấu hình, thêm điều kiện hoặc thử phương án khác.
- **Hard Failure:** trạng thái/đường tiến hóa hiện tại không thể tiếp tục theo luật đã chọn, ví dụ một thảm họa làm mất môi trường cần thiết. Không xóa world/project; giữ nguyên trạng thái, giải thích nguyên nhân và cho phép phục hồi từ checkpoint hoặc tạo nhánh timeline khác.

Không khóa tiến trình chỉ vì một khuyến nghị khoa học chưa được đáp ứng. Gate chỉ được chặn khi rule set của creator xác định điều kiện đó là bắt buộc. Luôn hiển thị rõ điều kiện nào đang chặn và cách khắc phục/override.

#### 8.9.6 Hai chế độ trải nghiệm

**Creative Mode**
- Ưu tiên tự do sáng tạo; có thể bỏ qua milestone và dùng luật vật lý/hóa sinh hư cấu.
- Advisor đưa cảnh báo và giải thích nhưng không tự ý ngăn creator.
- Override phải được lưu như một quyết định có chủ đích; không sửa hoặc xóa dữ liệu gốc âm thầm.

**Evolution Challenge Mode**
- Milestone gate và điều kiện chuyển tiếp được bật.
- Lựa chọn có thể mở/đóng các con đường phát triển và tạo hậu quả.
- Asset/tool có thể được mở khóa theo milestone và metadata.
- Thất bại, tuyệt chủng hoặc sụp đổ môi trường có thể xảy ra theo rule set đã chọn.
- Creator được xem mục tiêu, điều kiện, mức độ rủi ro và quy tắc đánh giá trước khi bắt đầu challenge.

Có thể bổ sung **Guided/Assisted Mode** như một mức trung gian: hệ thống gợi ý lựa chọn và hậu quả, nhưng creator duyệt trước khi áp dụng.

#### 8.9.7 Branching Evolution và alternate timelines

Mỗi lựa chọn quan trọng có thể tạo ra các hướng phát triển khác nhau. Hệ thống cần hỗ trợ:
- Main Timeline: nhánh tiến hóa chính.
- Experimental Branch: nhánh thử nghiệm không thay đổi nhánh chính.
- What-if Branch: giả định “nếu lựa chọn khác đi”.
- Recovery Branch: phục hồi sau một trạng thái thất bại từ checkpoint hợp lệ.

Mỗi branch cần tham chiếu parent branch/checkpoint, thời điểm phân nhánh, state snapshot/patch, lựa chọn nguyên nhân, milestone/rule version và stable IDs. Không nhân bản toàn bộ project một cách không cần thiết nếu snapshot + patch có thể biểu diễn khác biệt. Creator có thể so sánh trạng thái, đổi nhánh đang xem và chọn nhánh làm canon/primary theo quyền kiểm soát của mình.

#### 8.9.8 Milestone Configuration Schema và Milestone Engine

Trước khi phát triển UI đầy đủ hoặc mô phỏng chuyên sâu, cần thiết kế schema và engine độc lập với giao diện. Một milestone definition nên có tối thiểu:
- `milestoneId`, `schemaVersion`, `name`, `description`, `category`, `order`.
- `timeScale` và khoảng thời gian/điều kiện áp dụng.
- `prerequisites` và dependency graph; hỗ trợ milestone phi tuyến.
- `workspaceCapabilities`/tool requirements và asset categories được phép/mở khóa.
- `configurationSchema` cho tham số đầu vào.
- `requiredConditions`, `recommendedConditions`, `warningRules` và `failureRules`.
- `transitionOperations` mô tả state patches/events được tạo khi xác nhận.
- `rulesetId`, `rulesetVersion`, mức độ chắc chắn/nguồn giả định và seed nếu có tính ngẫu nhiên.
- `branchPolicy`, override policy và khả năng phục hồi.
- Trạng thái thực thi của milestone được lưu riêng với definition/template để cập nhật template không làm thay đổi lịch sử đã chạy.

Milestone Engine phải:
1. Đọc milestone definitions và trạng thái world/checkpoint hiện tại.
2. Xác định milestone khả dụng theo dependency graph.
3. Validate cấu hình theo schema và rule set.
4. Phân loại kết quả: error, warning, risk, qualified, soft failure hoặc hard failure.
5. Tạo preview các state changes và hậu quả dự kiến.
6. Chỉ áp dụng transition khi creator xác nhận, trừ automation đã được cho phép rõ ràng.
7. Ghi event, before/after references, causal links, branch và rule version vào World State Manager/History & Timeline.
8. Có thể replay/revalidate theo đúng rule version; không âm thầm thay đổi kết quả lịch sử khi rule set mới được cập nhật.

#### 8.9.9 Nguyên tắc khoa học, minh bạch và an toàn dữ liệu

- Hỗ trợ nhiều rule profile: Earth-like scientific assumptions, speculative science và custom fictional rules.
- Scientific Advisor là công cụ hỗ trợ quyết định, không phải chân lý tuyệt đối; phải nêu giả định và giới hạn.
- Phân biệt dữ kiện đã xác nhận, giả thuyết khoa học, heuristic của engine và luật hư cấu do creator đặt ra.
- Không tuyên bố mô phỏng chính xác khí hậu, địa chất, nguồn gốc sự sống hoặc tiến hóa nếu hệ thống chỉ dùng rule-based heuristic.
- Cùng input + ruleset version + seed phải cho kết quả deterministic trong phạm vi engine cam kết.
- Mọi transition, override và failure đều có thể truy vết; không tự xóa project hoặc timeline.
- Milestone state, branch, snapshot và patches phải tương thích với save/load, archive import/export và schema migration.

#### 8.9.10 Thứ tự triển khai và acceptance criteria

Đề xuất thứ tự:
1. Thiết kế Milestone Configuration Schema và dependency graph.
2. Xây Milestone Engine ở mức declarative/rule-based, chưa cần mô phỏng vật lý.
3. Tạo một số milestone mẫu có cấu hình và validation minh họa.
4. Liên kết milestone transition với World State Manager và History & Timeline.
5. Xây Milestone Progress UI và workspace capability composition.
6. Thêm Creative/Guided/Challenge modes và branch/recovery.
7. Chỉ sau đó mới bổ sung mô hình chuyên sâu theo từng miền.

**Acceptance criteria dài hạn**
- Creator có thể tạo, chỉnh sửa và sắp xếp milestone; hỗ trợ chuỗi tuyến tính lẫn dependency graph.
- Mỗi milestone mở đúng workspace/tool capability và điều kiện asset tương ứng.
- Cấu hình milestone được validate và Advisor giải thích rõ lỗi/cảnh báo/giả định.
- Có thể xem preview trước khi áp dụng transition.
- Qualified/Failed/Skipped/Overridden có trạng thái và lý do rõ ràng.
- Soft Failure có thể sửa; Hard Failure giữ nguyên world và hỗ trợ checkpoint/recovery/branch.
- Mỗi transition được ghi vào Timeline với before/after, nguyên nhân, hậu quả và ruleset version.
- Có thể tạo và so sánh các nhánh tiến hóa mà không làm hỏng nhánh chính.
- Creative Mode không ép challenge gates; Challenge Mode chỉ áp dụng gate đã công bố trước.
- Save/reopen/export/import bảo toàn milestone definitions, run state, branches và lịch sử.

**Scope note:** Mục 8.9 là định hướng tương lai, chưa triển khai. History & Timeline hiện tại không tự điều khiển milestone, không đánh giá điều kiện tiến hóa và không thay đổi bản đồ theo thời gian. Không đưa Milestone Engine vào phạm vi First Usable Build; trước mắt vẫn ưu tiên hoàn thiện Core Studio và workflow Asset Library → Map Studio → save/reopen → export/import.

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

### 10.4 World Forge Showcase — nền tảng trưng bày và khám phá thế giới

#### 10.4.1 Tầm nhìn và định vị

World Forge Showcase là không gian triển lãm số dành cho các thế giới được tạo bằng World Forge Studio. Đây không chỉ là thư viện ảnh bản đồ hoặc trang đăng project, mà là nơi người xem có thể khám phá một thế giới, hiểu địa lý, nền văn minh, lịch sử và câu chuyện của nó thông qua trải nghiệm trực quan, có chiều sâu.

Thông điệp định hướng:
**“Every World Has a Story. Every Creator Has a Universe.”**

Ba mục tiêu chính:
- **Discover:** khám phá thế giới mới theo thể loại, chủ đề, creator và xu hướng.
- **Experience:** trải nghiệm thế giới qua bản đồ, hoạt ảnh, dữ liệu và câu chuyện.
- **Share:** creator giới thiệu tác phẩm, cập nhật tiến trình và xây dựng cộng đồng người theo dõi.

Showcase là sản phẩm web/community layer về sau; không phải điều kiện để dùng World Forge Studio. Không chuyển trọng tâm khỏi First Usable Build của Studio để triển khai Showcase quá sớm.

#### 10.4.2 Cấu trúc trải nghiệm

**Trang chủ**
- Featured Worlds: thế giới nổi bật với hero cover/animated preview, tên, tagline, creator, thể loại, số lục địa/nền văn minh và kỷ nguyên hiện tại.
- Explore Worlds: lưới thẻ thế giới với ảnh/hoạt ảnh xem trước, mô tả ngắn, creator và metadata cơ bản.
- Trending, Recently Published và Recommended: các khu vực khám phá theo mức độ quan tâm, cập nhật và gợi ý.
- Bộ lọc thể loại gợi ý: Fantasy, Sci-Fi, Medieval, Modern, Post-apocalyptic, Mythology, Historical Fiction và Other.
- Sắp xếp gợi ý: mới cập nhật, mới xuất bản, phổ biến và mức độ hoàn thiện. Các chỉ số phổ biến phải có định nghĩa rõ ràng, không chỉ dựa vào lượt xem.

**Trang chi tiết của một thế giới**
1. **World Introduction:** hero toàn màn hình, tên thế giới, tagline, creator, thể loại, ngày tạo/ngày cập nhật và lời giới thiệu.
2. **World Geography:** bản đồ tương tác pan/zoom; hiển thị lục địa, đại dương, địa hình, sông, hồ và địa điểm quan trọng. Chọn một lục địa để xem hồ sơ, vùng, địa hình, khí hậu và các nền văn minh liên quan nếu dữ liệu đã được công bố.
3. **Civilizations:** thẻ nền văn minh với tên, biểu tượng/cờ, loài/chủng tộc, thể chế, thủ đô, thời điểm thành lập và lãnh thổ. Trang chi tiết có thể mở rộng sang văn hóa, kiến trúc, trang phục, tôn giáo, quân đội và lịch sử.
4. **History & Timeline:** dòng thời gian có mốc sự kiện, thời kỳ, kỷ nguyên và thay đổi lãnh thổ; về sau có thể liên kết sự kiện với trạng thái bản đồ theo thời điểm.
5. **World Gallery:** ảnh bản đồ, phong cảnh, thành phố, kiến trúc, nhân vật, sinh vật, vật phẩm và minh họa sự kiện.
6. **Creator Notes:** cảm hứng sáng tác, ghi chú, tiến độ, nội dung có spoiler và kế hoạch cập nhật. Creator có thể đánh dấu nội dung spoiler trước khi hiển thị.

Không hiển thị các miền dữ liệu chưa được tạo hoặc chưa được creator công bố như thể chúng đã tồn tại. Trang Showcase cần có trạng thái rỗng/“chưa được cung cấp” rõ ràng.

#### 10.4.3 Animated World Presentation

Hoạt ảnh là một điểm nhận diện quan trọng, nhưng không nên dùng GIF cho mọi thành phần. GIF có thể lớn, giới hạn màu và thiếu hiệu quả với hoạt ảnh dài. Định hướng định dạng:
- WebP animated hoặc GIF cho preview ngắn, loop đơn giản.
- MP4/WebM cho cinematic sequence dài hoặc nhiều chuyển động.
- PNG/JPEG cho ảnh tĩnh.
- SVG chỉ khi có pipeline sanitize và render an toàn được thiết kế riêng; không mặc định cho phép SVG tùy ý từ người dùng.
- Poster/thumbnail tĩnh luôn có để fallback, tải nhanh và hỗ trợ thiết bị không phát animation.

Một bản giới thiệu thế giới có thể gồm 5 cảnh:
1. **World Reveal:** mở đầu bằng hình ảnh hành tinh/thế giới và tên.
2. **Geography Reveal:** lần lượt làm nổi bật lục địa, đại dương và địa hình.
3. **Civilization Reveal:** giới thiệu biểu tượng và thông tin các nền văn minh.
4. **History Reveal:** hiển thị một số mốc lịch sử nổi bật trên timeline.
5. **Present Day:** chuyển về bản đồ/trạng thái hiện tại và lời giới thiệu của creator.

Creator có thể chọn template, phong cách trình bày, thứ tự cảnh, nội dung công khai và tài nguyên minh họa. Về lâu dài, Showcase có thể tự tạo phần lớn presentation từ World Project data, thay vì bắt creator dựng toàn bộ thủ công. Không tự sinh hoặc công khai nội dung chưa được creator duyệt.

#### 10.4.4 Publish workflow và quyền riêng tư

Luồng dự kiến: **World Forge Studio → Prepare for Showcase → Preview publication → Publish snapshot → Public World Page.**

Khi xuất bản, creator chọn:
- Tên, tagline, mô tả, thể loại và cover/animated preview.
- Các lục địa, nền văn minh, sự kiện lịch sử và gallery muốn công khai.
- Creator notes và nội dung có spoiler.
- Quyền truy cập và license/attribution cho nội dung đính kèm.

Mức hiển thị:
- **Public:** xuất hiện trong Explore và có thể được tìm thấy.
- **Unlisted:** có đường dẫn trực tiếp nhưng không xuất hiện trong khám phá công khai.
- **Private:** chỉ creator và người được cấp quyền xem.
- **Collaborative:** chia sẻ có kiểm soát cho cộng tác viên; quyền đọc/đóng góp cần được xác định riêng.

**Bắt buộc dùng published snapshot:** Showcase không được đọc trực tiếp project đang chỉnh sửa hoặc tự động làm lộ dữ liệu nội bộ. Creator chọn thời điểm xuất bản và nội dung được đưa vào một snapshot có version. Thay đổi trong Studio không làm thay đổi publication hiện tại cho tới khi creator preview và publish phiên bản mới. Có thể giữ lịch sử publication/rollback về phiên bản trước.

#### 10.4.5 World Publication Data Contract

Showcase phải tiêu thụ dữ liệu cấu trúc đã được xuất bản từ World Project, không chỉ dựa vào ảnh và văn bản nhập tay. Cần thiết kế một publication package/manifest có version riêng, tương thích với World Data Core và archive, gồm tối thiểu:
- Publication ID, World ID, project/schema version, publication version và thời điểm tạo.
- Metadata công khai: title, tagline, description, genre, creator attribution, cover/poster.
- Danh sách entity được chọn công khai và các trường được phép hiển thị.
- Quan hệ giữa World, Continent, Civilization, Location, Event và Timeline record qua stable IDs.
- Gallery media references, media type, thumbnail/poster, kích thước và checksum.
- Presentation scenes/timeline, thứ tự, thời lượng và tham chiếu nội dung.
- Visibility, spoiler flags, license/attribution và publication status.

Nguyên tắc:
- Chỉ serialize entity/field được creator chọn công khai; không export private notes, draft hoặc dữ liệu không được cấp quyền.
- Giữ stable IDs và quan hệ để trang Showcase có thể điều hướng từ bản đồ tới lục địa, nền văn minh và sự kiện.
- Dữ liệu publication là snapshot bất biến theo version; update là publication version mới.
- Dùng schema versioning, validation, checksum và migration/compatibility policy.
- Media phải qua giới hạn dung lượng, kiểm tra MIME/signature và xử lý nội dung không tin cậy; không cho phép script hoặc HTML tùy ý.
- Tách canonical project data, published snapshot và media derivatives/cache.
- Không yêu cầu toàn bộ hệ Studio tương lai phải hoàn tất mới có thể xuất bản một world cơ bản; Showcase chỉ hiển thị các miền dữ liệu có sẵn.

#### 10.4.6 Community và creator features

Các tính năng có thể triển khai theo từng giai đoạn:
- Appreciate/Like, bookmark và share.
- Follow creator và feed cập nhật từ creator đang theo dõi.
- Comment/discussion có moderation, report và block.
- Collections để người xem lưu nhóm thế giới theo chủ đề.
- Creator profile, danh sách tác phẩm và publication history.
- Analytics cơ bản cho creator: lượt xem hợp lệ, lượt lưu, tương tác và nguồn khám phá, đi kèm chính sách privacy.
- World Connections: creator tự liên kết các thế giới trong cùng multiverse, alternate timeline, shared universe hoặc dự án đồng sáng tác.

Các liên kết giữa thế giới phải là metadata do creator chủ động khai báo và có quyền kiểm soát; không tự suy luận rằng hai thế giới có chung canon. Social features, comments, moderation, analytics và marketplace cần có chính sách abuse/privacy trước khi phát hành.

#### 10.4.7 Phạm vi MVP và thứ tự phát triển

Không xây Showcase trước khi Studio có thể tạo và lưu một thế giới đủ hoàn chỉnh. Thứ tự phụ thuộc:
1. Hoàn thiện First Usable Build của World Forge Studio: Asset Pack Manager/Studio MVP, dùng được hai Asset Libraries trong Map Studio, save/reopen và export/import ổn định.
2. Tạo World Data Core/publication contract tối thiểu cho World, Continent, Location và metadata.
3. Hoàn thiện luồng chọn dữ liệu, preview và xuất published snapshot.
4. Xây Showcase MVP: trang Explore đơn giản, World Page, animated/static cover, bản đồ/ảnh gallery và metadata cơ bản.
5. Bổ sung Civilization/History sections khi các Studio và schema tương ứng sẵn sàng.
6. Sau đó mới mở rộng community, creator profiles, comments, analytics, collections, world connections và marketplace.

**Showcase MVP acceptance criteria**
- Creator có thể chọn một world và các dữ liệu cụ thể để công khai.
- Có preview trước khi publish và lựa chọn Public/Unlisted/Private.
- Published snapshot không làm lộ dữ liệu private/draft.
- Trang World Page đọc được metadata và các entity/relations trong snapshot.
- Có cover tĩnh fallback; animation tải theo cơ chế phù hợp và không chặn nội dung chính.
- Publication version không đổi khi project gốc được chỉnh sửa; chỉ đổi sau lần publish mới.
- Có thể unpublish hoặc đổi visibility theo quyền của creator.
- Import/validation lỗi không tạo publication dở dang.

Đây là đặc tả ý tưởng và yêu cầu tương lai, **chưa phải tính năng đã triển khai hoặc phase được cam kết lịch**. Ưu tiên hiện tại vẫn là hoàn thành Core Studio và First Usable Build.


### 10.5 World Completion & Return Experience — trải nghiệm hoàn thành và tiếp tục phát triển thế giới

#### 10.5.1 Mục tiêu trải nghiệm

World Forge Studio không nên kết thúc trải nghiệm ở thao tác lưu hoặc đóng project. Khi creator cảm thấy một world đã đạt trạng thái có thể giới thiệu, Studio cần giúp họ nhìn lại thành quả, hiểu các miền dữ liệu đã xây dựng, trình bày thế giới và chọn bước tiếp theo.

Cảm xúc mục tiêu: **“Mình đã tạo ra cả một thế giới — nó có quá khứ, hiện tại, những quy luật riêng và một tương lai còn có thể khám phá.”**

Không ép người dùng phải hoàn thành mọi miền dữ liệu. “Finish World” là một mốc do creator chủ động chọn, không khóa project, không tuyên bố thế giới hoàn chỉnh tuyệt đối và không ngăn chỉnh sửa tiếp.

#### 10.5.2 World Overview — hồ sơ tổng quan

Một trang tổng quan tập hợp dữ liệu đã có và được phép hiển thị:
- Planetary: thông số hành tinh/thiên thể, trọng lực và khí quyển nếu đã khai báo.
- Geography: lục địa, đại dương, địa hình, địa danh.
- Climate: vùng khí hậu và dữ liệu môi trường đã tạo.
- Biology: loài, quần thể, môi trường sống và hệ sinh thái.
- Civilization: loài có trí tuệ, nền văn minh, văn hóa và tổ chức.
- Nations: quốc gia, lãnh thổ và thể chế.
- History: thời kỳ, sự kiện và quan hệ nhân quả.
- Story: nhân vật, tuyến truyện và sự kiện được creator liên kết.

Overview phải thể hiện rõ số liệu/miền dữ liệu chưa được cung cấp; không tự bịa nội dung để lấp trạng thái trống. Ngoài thống kê, có thể tạo phần tóm lược dạng văn bản từ dữ liệu cấu trúc, nhưng creator phải được xem trước và chỉnh sửa trước khi xuất bản/chia sẻ.

#### 10.5.3 World Consistency Advisor — cố vấn tính nhất quán

Advisor kiểm tra quan hệ liên miền và đưa ra kết quả theo ba mức:
1. **Data conflict:** vi phạm schema, ID/relationship hoặc quy tắc bắt buộc của ruleset đang chọn.
2. **Plausibility warning:** có vẻ bất thường theo heuristic/giả định đã khai báo, nhưng không khẳng định là bất khả thi.
3. **Custom canon rule:** quy tắc hư cấu do creator đặt ra; chỉ kiểm tra theo luật mà creator đã chọn.

Ví dụ kiểm tra: khí hậu và biome; dân số, diện tích và nguồn lực; công nghệ và hạ tầng năng lượng; đặc điểm sinh học và habitat; thứ tự thời gian giữa sự kiện và thực thể. Mỗi cảnh báo cần nêu dữ liệu liên quan, lý do, mức độ tin cậy, giả định/ruleset và cách khắc phục hoặc miễn trừ.

Không áp đặt Earth-like science lên Fantasy/Sci-Fi/custom worlds. Creator có thể chấp nhận, bỏ qua, miễn trừ hoặc sửa cảnh báo; việc miễn trừ nên lưu lý do tùy chọn và có thể truy vết. Advisor không tự sửa canon.

#### 10.5.4 World Evolution Preview — xem trước thay đổi

Cho phép thử thay đổi trước khi áp dụng, theo luồng:

**Preview → Compare → Apply → Record to Timeline**

Ví dụ: dịch chuyển địa chất, biến đổi khí hậu, tuyệt chủng loài, phát minh nguồn năng lượng, thay đổi biên giới hoặc kết quả một cuộc chiến. Kết quả phải chỉ rõ:
- Những thực thể/trường dữ liệu bị ảnh hưởng trực tiếp và gián tiếp.
- Giả định, quy tắc, tham số hoặc seed đã sử dụng.
- Mức độ chắc chắn: deterministic rule, heuristic hay speculative outcome.
- Các khác biệt giữa trạng thái hiện tại và trạng thái preview.

Apply phải tạo transition/patch có thể kiểm tra, lưu và undo/recover theo contract; chỉ ghi sự kiện vào Timeline khi creator xác nhận. Preview không được âm thầm mutate dữ liệu canonical. Có thể tạo branch What-if/Experimental để thử các kịch bản mà không ảnh hưởng Main canon.

#### 10.5.5 World Presentation — trình diễn thế giới

World Presentation là công cụ tạo hành trình khám phá trực quan, có thể dùng trong Studio hoặc xuất thành publication cho Showcase. Một presentation cơ bản có thể gồm:
1. World Reveal — toàn cảnh và giới thiệu thế giới.
2. Geography Reveal — lục địa, đại dương và địa hình.
3. Civilization Reveal — nền văn minh, địa danh và biểu tượng.
4. History Reveal — các mốc nổi bật trên Timeline.
5. Present Day — trạng thái hiện tại và lời giới thiệu của creator.

Creator chọn camera/view, lớp dữ liệu, cảnh, thứ tự, thời lượng, nội dung công khai và media. Hỗ trợ poster/thumbnail tĩnh làm fallback; video/animation là phương thức trình bày, không phải điều kiện để xem nội dung. Không tự động công khai private notes, draft hoặc dữ liệu chưa được chọn. Tái sử dụng publication snapshot/data contract ở mục 10.4 thay vì tạo một pipeline dữ liệu công khai song song.

#### 10.5.6 Công cụ hỗ trợ sáng tạo và tái sử dụng

- **World Templates:** preset để bắt đầu nhanh (ví dụ fantasy map, archipelago, desert world, sci-fi colony); template phải khai báo phần nào là dữ liệu mẫu và cho phép creator tùy chỉnh.
- **World Bible Export:** xuất hồ sơ thế giới có cấu trúc, gồm overview, bản đồ/ảnh, entity, quan hệ, timeline và ghi chú được chọn; hỗ trợ định dạng tài liệu phù hợp khi schema đã ổn định. Export phải ghi rõ version/schema và không bao gồm dữ liệu private bị loại trừ.
- **World Comparison:** so sánh hai world hoặc hai snapshot theo dữ liệu, bản đồ, timeline và các miền được chọn; tránh chỉ so ảnh tổng thể.
- **Branch Comparison:** so sánh Main với What-if/Experimental/Recovery branch và hỗ trợ chọn thay đổi để hợp nhất nếu contract cho phép.
- **World Collaboration:** nhiều creator cùng làm việc với quyền, attribution, versioning và conflict resolution rõ ràng; chỉ triển khai sau khi local persistence, migration, snapshot và permission model ổn định.
- **AI World Assistance:** gợi ý/tạo nháp entity, asset, mô tả hoặc sự kiện theo schema; mọi output qua validation và human approval, không tự ghi đè canon.
- **World-to-Story/Game Integration:** xuất dữ liệu có cấu trúc cho quy trình viết truyện, truyện tranh, tabletop hoặc game; cần adapter/version contract riêng, không làm World Data Core phụ thuộc một engine cụ thể.

#### 10.5.7 Finish World — điểm tổng kết không khóa dự án

Khi creator chọn Finish World, Studio mở một World Completion Review:
- Tóm tắt các miền đã có dữ liệu và các miền còn trống.
- Hiển thị các consistency findings chưa giải quyết, không bắt buộc tất cả phải bằng 0.
- Cho xem World Overview và Timeline highlights.
- Đề xuất tạo World Presentation, xuất World Bible hoặc chuẩn bị publication.
- Cho phép đánh dấu world là Ready to Present/Published/Personal Milestone theo trạng thái riêng.
- Luôn có lựa chọn Continue Editing, tạo branch hoặc quay lại bất cứ Studio nào.

Không dùng một nút Finish World để tự động publish, đóng băng hoặc thay đổi quyền riêng tư. Việc công bố phải theo publish workflow và published snapshot tại mục 10.4.

#### 10.5.8 Lý do quay lại và nguyên tắc giảm độ phức tạp

Các vòng lặp quay lại có giá trị gồm: tiếp tục lịch sử, tạo nền văn minh/nhân vật, thử nhánh giả định, cập nhật presentation, chuyển world thành tác phẩm khác, cộng tác hoặc khám phá tác phẩm creator khác.

Để tránh quá tải:
- Không mở tất cả Studio nâng cao ngay lần đầu; dùng progressive disclosure và contextual entry points.
- Có Quick Start/Templates nhưng không bắt buộc dùng wizard hoặc milestone.
- Ưu tiên trực quan hóa kết quả trên bản đồ, Timeline, overview và preview thay vì buộc người dùng đọc quá nhiều thông số.
- Giữ Creative/Free World Mode và custom rulesets; milestone là hướng dẫn/challenge tùy chọn, không phải rào cản sáng tạo.
- Không biến Consistency Advisor thành cơ chế phán xét mọi lựa chọn hư cấu.
- Không yêu cầu mô phỏng khoa học chi tiết để một world được xem là có thể trình bày.

#### 10.5.9 Ưu tiên và acceptance criteria

| Hạng mục | Phụ thuộc | Ưu tiên định hướng |
|---|---|---|
| World Overview | World Data Core và các domain contracts | Rất cao, sau nền tảng dữ liệu |
| World Bible Export | Schema/relations ổn định, export permissions | Cao |
| World Consistency Advisor | Domain validation, ruleset/versioning, provenance | Rất cao nhưng triển khai tăng dần theo từng miền |
| World Evolution Preview | State/patch, timeline, checkpoint/branch | Cao, sau Milestone Engine foundation |
| World Presentation | Map/Timeline views và publication contract | Cao, sau khi có dữ liệu trực quan đủ dùng |
| World Templates | Import/schema compatibility và template validation | Trung bình; preset cơ bản có thể làm sớm |
| World/Branch Comparison | Snapshot và branch model | Trung bình |
| Collaboration | Permission, concurrency/conflict resolution | Dài hạn |
| AI assistance | Stable schema, validator, approval workflow | Dài hạn |
| Marketplace và tích hợp game/story | Creator ecosystem, licensing và adapter contracts | Dài hạn |

Acceptance cho trải nghiệm tổng kết ở phiên bản đầu:
- Creator có thể mở World Overview và chỉ thấy dữ liệu thực sự tồn tại/được phép xem.
- Có thể xem trạng thái hoàn thiện theo miền mà không bị ép hoàn thành mọi miền.
- Advisor phân loại conflict/warning/custom rule và giải thích được căn cứ.
- Preview không thay đổi canonical project trước khi creator Apply.
- Finish World không khóa chỉnh sửa, không tự publish và không thay đổi visibility.
- World Bible/Presentation chỉ xuất dữ liệu được creator chọn; export có version/schema metadata.
- Có thể tiếp tục chỉnh sửa hoặc tạo branch sau khi đánh dấu hoàn thành.

Đây là đặc tả sản phẩm và roadmap định hướng, **chưa phải tính năng đã triển khai**. Không làm thay đổi phạm vi First Usable Build hoặc ưu tiên Phase 4.4 → 5 → 6 → 7.

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

Validator hiện kiểm tra cấu trúc raster tối thiểu, kích thước và pixel limit; snapshot còn được xác minh lại bằng SHA-256 trước khi mở/kích hoạt. Giải mã ảnh bằng decoder đáng tin cậy trong Worker vẫn là hardening backlog trước khi nhận tài nguyên cộng đồng không tin cậy.

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
| 14/11/2026 | Sửa archive v2 để phân biệt embedded Data URL assets với snapshot entries, kiểm tra tổng entry limit và thêm mixed-asset round-trip regression; bộ test đạt 94/94. |
| 14/11/2026 | Bổ sung đọc dimension cho WebP VP8, VP8L và VP8X, áp dụng giới hạn pixel chung; bộ test đạt 95/95. |
| 14/11/2026 | Phase 4.4 browser acceptance: clean-origin import không có Pack nguồn vẫn giữ 1 snapshot/1 image object; offline save/export đạt; corrupt archive bị từ chối theo checksum và project count không đổi. Clean browser profile độc lập thật sự vẫn pending. |
| 14/11/2026 | Bổ sung SHA-256 revalidation khi validate/open project và khi AssetLoader kích hoạt snapshot; thêm kiểm tra cấu trúc ảnh, dimension/pixel limit và regression same-size mutation. |
| 14/11/2026 | Phase 4.4 automated QA đạt: corruption, missing/undeclared snapshot, stale project checksum và all-or-nothing import đều có regression tests. |
| 14/11/2026 | Browser QA Phase 4.4 xác nhận mở project không có Pack nguồn và save/export khi offline; clean browser profile độc lập còn chờ môi trường browser context phù hợp. |\n| 14/11/2026 | Bổ sung đặc tả World Genesis & Evolution: Genesis Wizard, nhiều thang thời gian, Era Constraints/Asset unlock, World State Manager, Evolution Engine, World Survival Validation và Catastrophe Events; xác định rõ đây là định hướng dài hạn, chưa triển khai và không thuộc First Usable Build. |\n| 14/11/2026 | Bổ sung đặc tả World Evolution Milestones: milestone-specific workspaces, Origin of Life/biochemistry configuration, milestone gates, Creative/Guided/Challenge modes, branching evolution và Milestone Configuration Schema/Engine; xác định là định hướng tương lai, chưa triển khai và không thuộc First Usable Build. |
| 14/11/2026 | Tái cấu trúc World Evolution Milestones thành bốn giai đoạn mặc định: Year 0/World Formation, Life Forms, Intelligent Life và Nations; quy định History & Timeline/Event System khả dụng từ đầu, Power System Studio mở ở Milestone 3, Story & Event Studio mở ở Milestone 4 và Free World Mode sau Milestone 4. |\n| 14/11/2026 | Đánh giá roadmap: giữ nguyên thứ tự Phase 4.4 → 5 → 6 → 7 cho First Usable Build, nhưng đưa QA vào từng phase; đề xuất roadmap sau đó theo World Data Core → Time/History/Event → Milestone/Genesis → bốn milestone → Free World Mode → Showcase. |\n| 14/11/2026 | Bổ sung trải nghiệm World Completion & Return: World Overview, Consistency Advisor, Evolution Preview, World Presentation, World Bible Export, Templates, World/Branch Comparison và Finish World không khóa chỉnh sửa; xác định ưu tiên, acceptance criteria và các giới hạn chống quá tải. |
| 14/11/2026 | Bổ sung đặc tả ý tưởng World Forge Showcase: trải nghiệm triển lãm thế giới, Animated World Presentation, World Page, published snapshot/data contract, quyền riêng tư, community và lộ trình MVP phụ thuộc First Usable Build. |
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
- Phase 4.3 — `.wforge` formatVersion 2, binary snapshot entries, mixed Data URL assets, SHA-256 integrity, manifest validation và backward compatibility với formatVersion 1; 95 automated tests pass và browser round-trip đã xác nhận.

Việc cần làm trong Phase 4.4:
1. Đã pass trên clean origin: import không có Pack nguồn giữ snapshot và image object; cần lặp lại trên browser profile độc lập thật sự.
2. Đã pass: mở project, save và export khi offline.
3. Đã pass một archive corrupt có checksum lỗi; tiếp tục kiểm tra snapshot thiếu/thừa và MIME/structure qua browser nếu cần mở rộng coverage.
4. Đã pass: corrupt archive bị từ chối và project count không đổi, không tạo project một phần.
5. Chạy clean browser profile độc lập thật sự và ghi nhận kết quả cuối cùng.
6. Đóng Phase 4 chỉ khi toàn bộ acceptance criteria đạt; sau đó mới chuyển sang Phase 5 — Asset Pack Management.

**Chưa chuyển trọng tâm sang:** marketplace, payment, AI generation, cloud sync, multiverse conflict hoặc World Environment simulation trước khi First Usable Build hoàn tất. Roadmap worldbuilding bốn milestone tại mục 7.4 là định hướng sau First Usable Build, chưa phải phase đang triển khai.

---

*Tài liệu này thay thế các file Markdown tổng hợp trước đó trong repository. Khi cập nhật dự án, hãy chỉnh sửa file này thay vì tạo thêm bản tổng quan/roadmap/specification song song.*
