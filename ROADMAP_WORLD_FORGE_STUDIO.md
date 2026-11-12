# WorldForge Studio — Tổng quan hiện trạng và lộ trình phát triển

> **Ngày rà soát:** 12/11/2026  
> **Repository:** https://github.com/TungMai510/World-Forge-Studio  
> **Nhánh:** `main`  
> **Phạm vi mã nguồn:** `worldforge_ui_prototype/`  
> **Mục tiêu tài liệu:** thống nhất định hướng sản phẩm, ghi nhận những gì có bằng chứng trong repository và chia nhỏ lộ trình phát triển tiếp theo.

---

## 1. Tầm nhìn sản phẩm đã thống nhất

WorldForge Studio là công cụ **world-building và sáng tạo bản đồ**, hướng tới người viết tiểu thuyết và người xây dựng thế giới giả tưởng. Sản phẩm kết hợp:

- Map Editor để tạo bản đồ và bố trí đối tượng.
- Các cơ sở dữ liệu Geography, Civilization và History.
- Liên kết giữa đối tượng trên bản đồ và hồ sơ dữ liệu thế giới.
- Quản lý nhiều dự án, lưu trữ cục bộ, nhập/xuất.
- Kiến trúc offline-first, module hóa và có khả năng mở rộng.

### 1.1. Định hướng mã nguồn mở và hệ sinh thái Asset Pack

WorldForge không nên trở thành phần mềm phụ thuộc vào một thư viện hình ảnh cố định do tác giả cung cấp. Định hướng đã thống nhất:

1. **WorldForge Core** cung cấp engine, công cụ bản đồ, quản lý dữ liệu, dự án và hệ thống asset.
2. **Official Asset Pack** là bộ tài nguyên mẫu/chính thức do nhóm phát triển duy trì.
3. **Community Asset Packs** do người dùng tự sáng tạo, chia sẻ hoặc phân phối.
4. **WorldForge Asset Studio** là công cụ tạo, chỉnh sửa metadata, kiểm tra và xuất Asset Pack. Giai đoạn đầu có thể là module độc lập về kiến trúc; chưa cần phát hành thành ứng dụng riêng.
5. Core phải **Asset-Pack Agnostic**: không hardcode danh mục hay phụ thuộc vào bất kỳ Pack cụ thể nào.

### 1.2. Nguyên tắc sản phẩm

- Người dùng có thể tạo thế giới mà không cần cài thêm asset.
- Người dùng có thể thêm/gỡ Pack mà không phải sửa mã nguồn Core.
- Pack ban đầu chỉ chứa dữ liệu, hình ảnh và metadata; **không thực thi JavaScript tùy ý**.
- Project phải giữ được hình ảnh cần thiết kể cả khi Pack gốc bị gỡ hoặc không còn sẵn.
- Định dạng Pack, schema và quy tắc tương thích phải được tài liệu hóa công khai.
- Không sản xuất hàng trăm asset trước khi luồng kỹ thuật với một nhóm ảnh thử nghiệm hoạt động ổn định.

---

## 2. Hiện trạng repository đã xác minh

### 2.1. Snapshot GitHub

Tại thời điểm rà soát:

- Repository công khai, nhánh mặc định `main`.
- API commit trả về **một commit**: `57e3ea548d3bda05bc9ff6d51ff0e04d961ef1ea` — `first commit`.
- Chưa thấy Pull Request nào trong truy vấn danh sách PR.
- Không thấy `package.json` trong cây repository được truy xuất.
- Có tài liệu `worldforge_studio_documentation.md`, prototype ZIP, tài liệu DOCX và bộ file QA Import/Export ngày 11/11/2026.
- Vì repository hiện chỉ có một commit, chưa thể lập so sánh thay đổi giữa nhiều kỳ commit. Các file QA là bằng chứng có artifact kiểm thử, nhưng không tự chứng minh toàn bộ quy trình đã được chạy tự động hoặc đã pass.

### 2.2. Cấu trúc mã nguồn đang có

Trong `worldforge_ui_prototype/` đã thấy:

- `index.html`
- `src/app.js`
- `src/data/database-manager.js`
- `src/engine/MapCanvasEngine.js`
- `src/engine/ViewportTransform.js`
- `src/engine/HistoryManager.js`
- `src/engine/layers/CanvasLayerRenderer.js`
- `src/engine/layers/LayerManager.js`
- `src/engine/tools/` với Select, Brush, Eraser, Landmass, Terrain, River, Lake, Border, Text, Icon và ToolManager.
- `src/services/` với archive-service, project-service, geography-service, civilization-service, history-service và map-export-service.
- `src/ui/layout.js`

**Nhận xét kiến trúc:** một số phần nghiệp vụ đã được tách module, nhưng UI chính vẫn tập trung trong `layout.js` có kích thước lớn. Cần ưu tiên tách dần theo tính năng khi sửa, tránh một lần tái cấu trúc lớn gây hồi quy.

### 2.3. Các năng lực đã có bằng chứng mã nguồn

| Khu vực | Hiện trạng xác minh | Phân loại bằng chứng |
|---|---|---|
| Project Manager | IndexedDB lưu projects và recentProjects; CRUD dự án | Có mã nguồn |
| Project schema | `SCHEMA_VERSION = 2`, có migration từ schema 1 | Có mã nguồn |
| Map Engine | World map, layers/groups, viewport, render loop, selection/hit-test, object CRUD | Có mã nguồn |
| Map object types | Có rect, circle, path, ellipse, text, icon, terrain; chưa thấy image object | Có mã nguồn |
| Renderer extension | Engine có registry renderer theo layer renderer; mặc định Canvas renderer | Có mã nguồn |
| Tool system | ToolManager đăng ký các công cụ bản đồ hiện có; chưa có PlaceAssetTool | Có mã nguồn |
| Geography | Service quản lý worlds, continents, countries, cities, locations | Có mã nguồn và mô tả tài liệu |
| Civilization | Service quản lý characters, races, cultures, religions, organizations | Có mã nguồn và mô tả tài liệu |
| History | Service quản lý calendars, eras, periods, records, events | Có mã nguồn và mô tả tài liệu |
| Undo/Redo | HistoryManager và thao tác map/layer có tích hợp lịch sử theo tài liệu | Có mã nguồn; cần kiểm thử hồi quy |
| Project JSON | Có import/export và validate dữ liệu dự án | Có mã nguồn |
| WFORGE archive | ZIP STORE, manifest/project JSON, externalize Data URL assets, CRC/path/size checks | Có mã nguồn |
| Map export | Service xuất PNG/JPG/SVG/PDF theo tài liệu dự án | Có mã nguồn; cần kiểm tra trực tiếp các định dạng |
| Asset Pack | Chưa tìm thấy manifest Pack, registry, pack parser/manager hay định dạng .wfpack | Chưa triển khai theo bằng chứng hiện có |
| Asset Library UI | Chưa tìm thấy thư viện thumbnail/search/filter dựa trên Pack | Chưa triển khai theo bằng chứng hiện có |
| Image Renderer / Place Asset Tool | Chưa thấy image object/renderer/tool | Chưa triển khai theo bằng chứng hiện có |

### 2.4. Persistence hiện có: nền tảng tốt nhưng chưa phải Asset System

`database-manager.js` hiện tạo hai object store: `projects` và `recentProjects`. Chưa thấy object store riêng cho Asset Pack hay user assets.

`project-service.js` có cơ chế duyệt dữ liệu dự án, chuyển Data URL hình ảnh thành file trong archive và khôi phục lại khi import. Archive dùng các entry như `manifest.json`, `project.json` và `assets/000000.png`; có giới hạn kích thước, số entry, kiểm tra CRC và đường dẫn.

**Điều này có nghĩa:** đã có nền tảng nhúng ảnh vào file dự án, nhưng chưa có khái niệm Pack được cài đặt, phiên bản Pack, asset ID ổn định, dependency hay quản lý vòng đời Pack. Không được xem cơ chế archive dự án hiện tại là Asset Pack Manager.

### 2.5. QA và giới hạn xác minh

Repository có các file QA Import/Export: `.worldforge.json`, `.wforge`, `.png`, `.jpg`, `.svg`, `.pdf` và một ảnh bản đồ. Điều này cho thấy đã lưu lại bộ artifact phục vụ QA.

Tuy nhiên, trong lần rà soát này chưa xác minh được:
- Kịch bản test tự động và lệnh chạy test.
- CI workflow và kết quả GitHub Actions.
- Test coverage.
- Quy trình test E2E lặp lại từ đầu đến cuối.

Vì vậy, trạng thái chính xác là **có mã nguồn và có artifact QA**, không tự động kết luận tất cả test đều pass.

### 2.6. Rủi ro kỹ thuật thấy được

1. `index.html` tải Tailwind từ CDN; chưa đáp ứng mục tiêu offline hoàn toàn.
2. Chưa thấy `package.json`, lockfile, script build/test hoặc CI trong cây repository hiện tại.
3. `layout.js` là module UI rất lớn; thêm Asset Library trực tiếp vào đây sẽ làm tăng độ kết dính.
4. Chưa có image object nên Asset chưa thể đi xuyên suốt từ thư viện lên Canvas.
5. Lưu asset mặc định, asset người dùng và asset nhúng theo Project chưa được phân định.
6. Quy tắc ID, namespace, versioning, license, attribution và tương thích Pack chưa được chuẩn hóa.
7. SVG là định dạng có thể chứa nội dung chủ động/ngoại liên kết; cần sanitize hoặc giới hạn SVG an toàn trước khi render.
8. Gỡ/cập nhật Pack có thể làm hỏng tham chiếu của Project nếu không có snapshot/embedded fallback.

---

## 3. Kiến trúc đích

### 3.1. Sơ đồ tổng thể

```text
WorldForge Ecosystem
|
+-- WorldForge Core
|   +-- Map Engine / Viewport / Layer System
|   +-- Object Model / Selection / History
|   +-- Tool System
|   +-- Renderer System
|   +-- Project & Persistence
|   +-- Asset Runtime
|       +-- Pack Parser
|       +-- Asset Registry
|       +-- Asset Loader / Cache
|       +-- Asset Validator
|       +-- Pack Manager
|
+-- WorldForge Studio UI
|   +-- Map Editor
|   +-- Asset Library
|   +-- Installed Pack Manager
|   +-- World Databases
|
+-- WorldForge Asset Studio
|   +-- Pack Creator
|   +-- Batch Import
|   +-- Metadata Editor
|   +-- Preview / Thumbnail
|   +-- Validator
|   +-- .wfpack Exporter
|
+-- Official Asset Packs
|   +-- Official starter pack
|
+-- Community Asset Packs
    +-- Packs from users / repositories / community
```

### 3.2. Phân định dữ liệu

| Khái niệm | Ý nghĩa |
|---|---|
| Asset | Một tài nguyên có ID ổn định, metadata và nội dung file |
| Category | Nhóm phân loại linh hoạt, do Pack khai báo |
| Pack | Đơn vị phân phối/cài đặt tài nguyên, có ID và version riêng |
| Asset Library | Giao diện duyệt các asset khả dụng từ nhiều Pack |
| Project Asset Reference | Tham chiếu asset mà một map object đang sử dụng |
| Embedded Project Asset | Bản sao nội dung asset được nhúng vào Project để bảo toàn khả năng mở lại |

### 3.3. Định danh và tham chiếu

Không dùng ID ngắn như `MNT-001` làm khóa toàn cục duy nhất vì hai tác giả có thể tạo cùng ID. Đề xuất:

- Pack ID: reverse-domain hoặc namespace ổn định, ví dụ `org.example.classic-fantasy`.
- Asset ID toàn cục: `<packId>:<localAssetId>`, ví dụ `org.example.classic-fantasy:MNT-001`.
- Local ID chỉ cần duy nhất trong một Pack.
- Tên hiển thị và Category không phải khóa định danh.
- Project object lưu `assetRef` gồm packId, assetId và phiên bản/nguồn cần thiết; không chỉ lưu đường dẫn tương đối tùy tiện.

### 3.4. Định dạng .wfpack

Đề xuất .wfpack là ZIP có cấu trúc và schema version rõ ràng. Ví dụ:

```text
Example-Pack.wfpack
+-- pack.json
+-- preview.png
+-- LICENSE.txt
+-- assets/
|   +-- mountains/MNT-001.png
|   +-- forests/FST-001.png
+-- thumbnails/
    +-- MNT-001.webp
    +-- FST-001.webp
```

Metadata tối thiểu nên gồm:
- schemaVersion, id, name, version, author, description.
- license và attribution.
- min/max WorldForge compatibility.
- categories.
- assets: local id, name, displayName, category, type, format, path, thumbnail, tags, dimensions/defaultSize.
- checksum/hash cho từng file ở phiên bản schema phù hợp.

Quy tắc an toàn:
- Chặn path traversal, absolute path, duplicate path và file lạ.
- Giới hạn số file, kích thước nén/giải nén, kích thước ảnh và pixel count.
- Kiểm tra MIME thực tế, không chỉ tin extension.
- Không chạy script/plugin từ Pack.
- Sanitize SVG hoặc chỉ hỗ trợ SVG theo chính sách an toàn được định nghĩa rõ.
- Cài đặt theo kiểu staging → validate → commit; nếu lỗi phải rollback, không để Pack cài dở.
- Không ghi đè Pack đang cài nếu chưa xác nhận version và chính sách update.

### 3.5. Chính sách Project và Pack

Khi đặt asset lên bản đồ:
- Object giữ transform (x, y, width, height, rotation, opacity, flip nếu hỗ trợ) và asset reference.
- Runtime lấy ảnh từ Asset Loader.
- Khi export Project, đóng gói snapshot các asset thực sự được sử dụng hoặc lưu bản nhúng tương đương.
- Khi import Project, ưu tiên embedded asset để bảo toàn hiển thị; nếu thiếu embedded data mới tìm Pack tương thích.
- Gỡ Pack không được xóa dữ liệu đang nhúng trong Project.
- Cảnh báo rõ khi người dùng xóa Pack có asset đang được tham chiếu; không âm thầm làm mất hình.

---

## 4. Lộ trình phát triển theo giai đoạn

Thứ tự dưới đây ưu tiên tạo luồng hoạt động hoàn chỉnh trước khi xây công cụ cộng đồng. Không nên triển khai tất cả giai đoạn cùng lúc.

### Phase 0 — Ổn định nền tảng phát triển

**Mục tiêu:** đảm bảo dự án có thể chạy, kiểm tra và phát triển lặp lại.

Công việc:
1. Ghi lại cách chạy prototype hiện tại và yêu cầu môi trường.
2. Chọn chiến lược dependency/build phù hợp; thêm `package.json` nếu dự án thực sự cần package scripts.
3. Tự host Tailwind/CSS hoặc thay CDN bằng CSS build/local để hỗ trợ offline.
4. Thêm lint/format cơ bản nếu phù hợp với codebase.
5. Thiết lập test runner và GitHub Actions tối thiểu.
6. Viết smoke test cho khởi tạo database, project create/save/load và import/export.
7. Dọn các file QA tạm khỏi root hoặc chuyển vào `docs/qa-fixtures/` có giải thích; không xóa fixture còn cần dùng.

**Tiêu chí hoàn thành:**
- Có hướng dẫn chạy từ checkout sạch.
- Không cần CDN để hiển thị giao diện cốt lõi.
- Có lệnh test xác định và CI chạy được.
- Test project lifecycle cơ bản pass.

### Phase 1 — Asset Foundation

**Mục tiêu:** Core đọc và quản lý asset metadata mà chưa cần UI hoàn chỉnh.

Công việc:
1. Viết Asset Pack Specification v1 và JSON Schema.
2. Xây Manifest/Pack parser.
3. Xây AssetRegistry với lookup theo global ID, category, tag và pack.
4. Xây AssetLoader với lazy load, cache, lỗi load và giải phóng cache hợp lý.
5. Xây AssetValidator cho manifest, file path, MIME, size, duplicate IDs.
6. Xây Pack Manager service/API (install state, enable/disable, uninstall; chưa cần UI).
7. Tạo fixture Pack nhỏ với 5–10 ảnh kiểm thử.
8. Tách các module khỏi UI và không hardcode category.

**Tiêu chí hoàn thành:**
- Import/parse fixture Pack.
- Tra cứu asset theo global ID.
- Phát hiện ID trùng, path traversal, file thiếu, MIME sai và manifest sai.
- Không cần sửa code khi thêm asset mới vào manifest hợp lệ.
- Có unit tests cho parser, registry và validator.

### Phase 2 — Image Object và Renderer

**Mục tiêu:** một asset có thể được vẽ trên map bằng hệ thống object/renderer hiện tại.

Công việc:
1. Thiết kế schema object `image` có version.
2. Bổ sung validate/normalize object trong MapCanvasEngine.
3. Xây Image Renderer hoặc renderer object phù hợp với kiến trúc hiện tại; tránh nhầm renderer theo layer với renderer theo object.
4. Hỗ trợ alpha/opacity, rotation, sizing và aspect ratio.
5. Tích hợp hitTest, selection, z-order và layer visibility/opacity.
6. Xử lý ảnh chưa load, lỗi ảnh và cache.
7. Bảo đảm export PNG/JPG/SVG/PDF có chính sách rõ ràng cho image object.

**Tiêu chí hoàn thành:**
- Một PNG được render đúng ở world coordinates.
- Pan/zoom không làm sai vị trí.
- HitTest và chọn đúng vùng ảnh.
- Layer ẩn/khóa/opacity có hành vi đúng.
- Có test cho validate, draw/hitTest và export cơ bản.

### Phase 3 — Place Asset Tool và chỉnh sửa

**Mục tiêu:** người dùng đặt và chỉnh asset trực tiếp trên bản đồ.

Công việc:
1. Tạo PlaceAssetTool và đăng ký qua ToolManager.
2. Chọn asset từ thư viện hoặc trạng thái pending selection.
3. Click/drag để đặt asset.
4. Chỉnh vị trí, kích thước, rotation, opacity.
5. Nhân bản, xóa, multi-select nếu phù hợp với SelectTool.
6. Tích hợp Undo/Redo bằng command/snapshot hiện tại.
7. Quy định hành vi khi asset không load được.

**Tiêu chí hoàn thành:**
- Đặt, di chuyển, resize, rotate và delete asset được.
- Undo/Redo khôi phục chính xác.
- Tool không phá các tool hiện có.
- Có kiểm thử thao tác và regression test cho tool hiện hữu.

### Phase 4 — Asset Library UI

**Mục tiêu:** duyệt và tìm kiếm asset từ mọi Pack đang bật.

Công việc:
1. Tạo component riêng, không tiếp tục phình `layout.js`.
2. Hiển thị category động từ Pack metadata.
3. Search theo tên, ID và tag.
4. Filter theo Pack, category và type.
5. Thumbnail grid, preview và metadata panel.
6. Chọn/kéo thả asset lên map.
7. Empty/loading/error states và lazy thumbnail loading.

**Tiêu chí hoàn thành:**
- Pack mới cài tự xuất hiện trong UI không cần sửa code.
- Category do cộng đồng định nghĩa được hiển thị.
- Search/filter hoạt động trên nhiều Pack.
- Thư viện không tải toàn bộ ảnh gốc cùng lúc.

### Phase 5 — Persistence, Archive và khả năng khôi phục

**Mục tiêu:** project luôn mở lại đúng kể cả khi môi trường Pack thay đổi.

Công việc:
1. Chuẩn hóa Project asset references.
2. Bổ sung embedded asset snapshot vào archive hiện tại.
3. Bổ sung metadata Pack/version/checksum đã dùng.
4. Xử lý missing asset và fallback.
5. Thiết kế migration project schema.
6. Cân nhắc IndexedDB object store riêng cho user asset/cache sau khi đo nhu cầu; không thêm store nếu chưa có use case rõ.
7. Kiểm tra quota, giới hạn archive và hiệu năng import/export.

**Tiêu chí hoàn thành:**
- Tạo map bằng asset → lưu → đóng/mở lại vẫn đúng.
- Export Project → gỡ Pack → import Project vẫn hiển thị asset nhờ bản nhúng.
- Missing/corrupt asset có cảnh báo, không crash.
- Migration dữ liệu cũ không mất dữ liệu.

### Phase 6 — .wfpack Import/Export và Asset Pack Manager UI

**Mục tiêu:** người dùng cài và quản lý Pack an toàn.

Công việc:
1. Hoàn thiện .wfpack parser/writer dùng chung schema.
2. Import qua file picker.
3. Preview nội dung trước khi cài.
4. Validate toàn bộ Pack trước khi commit cài đặt.
5. Installed Packs: enable/disable, details, uninstall, update.
6. Phát hiện Pack đang được Project tham chiếu.
7. Quản lý version, duplicate pack ID và update policy.
8. Kiểm thử Pack lỗi, quá lớn, file trùng và path độc hại.

**Tiêu chí hoàn thành:**
- Người dùng import một .wfpack hợp lệ và asset xuất hiện trong Library.
- Pack không hợp lệ bị từ chối an toàn.
- Enable/disable/uninstall không làm hỏng Core.
- Project đã lưu không mất ảnh khi Pack bị gỡ.

### Phase 7 — WorldForge Asset Studio

**Mục tiêu:** người không biết lập trình tự tạo Pack.

Giai đoạn đầu làm module riêng về kiến trúc, có thể chạy trong cùng ứng dụng. Chỉ tách thành ứng dụng độc lập khi có nhu cầu thực tế.

Chức năng:
1. Create Pack: id, name, author, description, version, license, preview.
2. Batch import PNG/JPEG/WebP/SVG theo chính sách hỗ trợ.
3. Tự tạo thumbnail và đọc kích thước ảnh.
4. Sửa metadata, tags, category, default size.
5. Đổi tên, thay ảnh, xóa asset.
6. Validate Pack.
7. Export .wfpack.
8. Mở lại Pack đã tạo để chỉnh sửa (round-trip).

**Tiêu chí hoàn thành:**
- Người dùng tạo Pack hoàn chỉnh mà không sửa JSON bằng tay.
- Export .wfpack rồi import lại vào WorldForge Studio thành công.
- Metadata, file và thumbnail không bị mất sau round-trip.

### Phase 8 — Mã nguồn mở và hệ sinh thái cộng đồng

**Mục tiêu:** người dùng có thể đóng góp Core hoặc phân phối Pack độc lập.

Công việc:
1. Chọn license cho source code.
2. Chọn license riêng cho Official Asset Pack.
3. Viết CONTRIBUTING, Code of Conduct, Security Policy và issue templates.
4. Công bố Asset Pack Specification và hướng dẫn tạo Pack.
5. Tạo official sample pack có license/attribution rõ ràng.
6. Cung cấp Pack validation CLI hoặc test workflow cho tác giả cộng đồng.
7. Sau khi có nhu cầu, xây Community Pack Catalog/Repository; không cần xây marketplace ngay.
8. Có quy trình báo cáo Pack vi phạm bản quyền hoặc có nội dung độc hại.

**Tiêu chí hoàn thành:**
- Một người ngoài dự án có thể đọc tài liệu, tạo Pack và cài thành công.
- CI có thể validate sample Pack.
- License, attribution và chính sách bảo mật được công bố.

---

## 5. Thứ tự ưu tiên thực tế

Không nên bắt đầu WorldForge Asset Studio ngay. Thứ tự phát triển khuyến nghị:

1. **Phase 0 — Nền tảng build/test/offline.**
2. **Phase 1 — Asset Foundation.**
3. **Phase 2 — Image Object/Renderer.**
4. **Phase 3 — Place Asset Tool.**
5. **Phase 4 — Asset Library UI.**
6. **Phase 5 — Persistence/Archive.**
7. **Phase 6 — Pack Manager và .wfpack.**
8. **Phase 7 — Asset Studio.**
9. **Phase 8 — Community ecosystem.**

Lý do: cần chứng minh một asset hoạt động xuyên suốt luồng runtime trước khi đầu tư vào công cụ tạo Pack và cộng đồng.

---

## 6. Các quyết định kiến trúc cần chốt

| Quyết định | Khuyến nghị |
|---|---|
| Core có phụ thuộc Official Pack? | Không |
| Category có hardcode? | Không; category do Pack khai báo |
| Asset ID toàn cục? | `packId:localAssetId` |
| Pack có được chạy code? | Không trong phiên bản đầu |
| Định dạng Pack? | ZIP-based `.wfpack` với schema version |
| Project có chỉ lưu asset ID? | Không; cần embedded fallback/snapshot |
| Gỡ Pack có xóa asset khỏi Project? | Không |
| Asset Studio có là app riêng ngay? | Chưa; module độc lập trước |
| Có cần marketplace ngay? | Không |
| Official Pack? | Một bộ mẫu/chính thức do dự án duy trì |

---

## 7. Kiểm thử và Definition of Done chung

Mỗi phase phải có:
- Unit tests cho logic mới.
- Integration tests tại điểm nối với module hiện hữu.
- Regression tests cho chức năng liên quan.
- Hướng dẫn kiểm thử thủ công khi không thể tự động hóa.
- Báo cáo rõ test nào đã chạy, test nào chưa chạy.

Các luồng E2E quan trọng nhất:

### E2E A — Runtime Asset
`Pack fixture → Parse → Registry → Loader → Library → Place → Render → Edit → Undo/Redo`

### E2E B — Project Persistence
`Place asset → Save project → Export .wforge → Remove pack → Import project → Asset still visible`

### E2E C — Community Pack
`Create pack → Validate → Export .wfpack → Import → Browse → Place on map`

### E2E D — Offline
`Fresh launch without network → Open project → Browse installed assets → Edit → Save → Export`

Không đánh dấu phase hoàn thành chỉ vì file đã được tạo. Chỉ đánh dấu:
- **Implemented:** có mã nguồn.
- **Tested:** có test thực sự chạy và kết quả.
- **Verified manually:** đã chạy quy trình thủ công, có ghi nhận.
- **Not verified:** chưa có bằng chứng.

---

## 8. Ba nhiệm vụ ưu tiên ngay tiếp theo

### Ưu tiên 1 — Thiết lập test/build/offline baseline
**Kết quả cần có:** hướng dẫn chạy, dependency/script phù hợp, loại bỏ phụ thuộc CDN cho giao diện cốt lõi, smoke test và CI tối thiểu.

### Ưu tiên 2 — Viết Asset Pack Specification v1 và Asset Foundation
**Kết quả cần có:** schema JSON, fixture Pack 5 asset, parser, registry, validator và unit tests. Chưa cần giao diện.

### Ưu tiên 3 — Image Object + Image Renderer prototype
**Kết quả cần có:** đặt được một ảnh thử nghiệm lên Canvas, chọn/di chuyển/resize được, hoạt động với layer và Undo/Redo.

Sau ba nhiệm vụ này mới chuyển sang Asset Library UI và Pack Manager.

---

## 9. Danh sách kiểm tra cho các lần rà soát repository sau

Mỗi lần rà soát, kiểm tra:
1. Commit mới và file thay đổi kể từ báo cáo trước.
2. Các module Asset Foundation có tồn tại và được import thật không.
3. Schema/manifest fixture có được validate không.
4. Image object có được validate, render và hit-test không.
5. PlaceAssetTool có được ToolManager đăng ký không.
6. Library UI có đọc dữ liệu động từ Registry không.
7. Project archive có nhúng và phục hồi asset không.
8. .wfpack có parser/validator/import/export không.
9. Asset Studio có tạo được Pack round-trip không.
10. CI/test results và QA fixtures.
11. Tính offline, giới hạn dung lượng, an toàn SVG/path và license.
12. Phân biệt rõ mã nguồn, test đã chạy và tính năng đã xác minh thủ công.

---

## 10. Tuyên bố định hướng

**WorldForge Core must be Asset-Pack Agnostic.**

WorldForge cung cấp công cụ để người dùng sáng tạo thế giới; Official Asset Pack chỉ là bộ tài nguyên khởi đầu. Hệ thống phải cho phép cộng đồng tự tạo, chia sẻ và quản lý Asset Pack mà không cần sửa mã nguồn Core.

Tập trung xây một luồng asset đáng tin cậy trước, sau đó mới mở rộng số lượng tài nguyên và hệ sinh thái.


---

## 11. Cập nhật triển khai Phase 1 — Asset Foundation (12/11/2026)

Đã bắt đầu triển khai trực tiếp trên nhánh `main` với các module nền tảng sau:

| File | Trách nhiệm |
|---|---|
| `src/assets/asset-pack-validator.js` | Kiểm tra manifest, schema, SemVer, tương thích Core, category, asset metadata, đường dẫn, chữ ký định dạng ảnh và giới hạn kích thước |
| `src/assets/asset-registry.js` | Đăng ký/gỡ Pack, bật/tắt Pack, tra cứu asset bằng khóa namespace |
| `src/assets/asset-loader.js` | Tạo Blob URL, cache giới hạn số lượng, thu hồi URL khi cache eviction/invalidate/clear |
| `src/assets/asset-pack-service.js` | Đọc archive bằng archive service hiện có, parse manifest, validate trước khi đăng ký Pack |
| `ASSET_PACK_SPECIFICATION.md` | Đặc tả định dạng `.wfpack` v1 và manifest |

### Quyết định kỹ thuật Phase 1

- Canonical asset key: `<pack-id>::<asset-id>`, tránh xung đột ID giữa các Pack.
- Pack ID theo reverse-domain; asset ID chỉ cần duy nhất trong phạm vi Pack.
- Phase 1 chỉ hỗ trợ PNG, JPEG, WebP và GIF; SVG tạm hoãn để tránh rủi ro SVG không được sanitize.
- Archive sử dụng ZIP STORE không nén vì archive reader hiện tại chỉ hỗ trợ phương thức này.
- Giới hạn ban đầu: archive 100 MB, tối đa 2.000 entry, manifest 1 MB, mỗi ảnh tối đa 15 MB.
- Pack không được chứa hoặc thực thi script; validator chỉ cho phép manifest, ảnh trong `assets/`, thumbnail trong `thumbnails/`, `preview.png` và `LICENSE.txt`.
- Registry và loader hiện chạy trong bộ nhớ; chưa có IndexedDB persistence, UI quản lý Pack, image renderer hay Place Asset Tool.

### Trạng thái xác minh

Các file đã được ghi lên GitHub và đọc lại để kiểm tra nội dung. **Chưa có kết quả chạy unit test, browser test hoặc import .wfpack end-to-end**; không xem Phase 1 là hoàn tất cho đến khi có fixture Pack thực tế và test tự động.

### Việc cần làm tiếp theo trong Phase 1

1. Tạo bộ fixture Pack tối thiểu với 2–3 ảnh có chữ ký định dạng hợp lệ.
2. Bổ sung unit tests cho manifest hợp lệ/không hợp lệ, path traversal, duplicate entry, file giả định dạng, giới hạn kích thước và Pack ID collision.
3. Kiểm thử tạo archive → inspect → install → registry lookup → AssetLoader Blob URL → disable/uninstall.
4. Kiểm thử cache URL revoke và trường hợp ảnh lỗi.
5. Chỉ sau khi các test trên pass mới chuyển sang Phase 2: Image Object + Renderer.


### Cập nhật QA Phase 1 — bộ kiểm thử và Pack mẫu

Đã bổ sung:
- `worldforge_ui_prototype/package.json` với Node.js test scripts, yêu cầu Node.js 20+.
- `tests/assets/create-fixture.js` để sinh Pack mẫu `classic-fantasy.wfpack` (2 ảnh PNG 1×1, manifest và LICENSE).
- `tests/assets/asset-foundation.test.js` với các kiểm thử ZIP round-trip, manifest hợp lệ/không hợp lệ, path traversal, entry script không được phép, chữ ký ảnh, tương thích phiên bản, namespace asset, cài Pack trùng ID, cache eviction và luồng tích hợp Archive → Validator → Registry → Loader.
- `tests/assets/README.md` hướng dẫn chạy.
- `.github/workflows/worldforge-tests.yml` chạy test trên push/PR.
- AssetPackService nhận AssetLoader tùy chọn để thu hồi Blob URL khi Pack bị disable hoặc uninstall.

Lệnh chạy từ thư mục `worldforge_ui_prototype/`:
```bash
npm run assets:fixture
npm run test:assets
npm test
```

**Trạng thái:** Mã kiểm thử và CI đã được commit lên GitHub. Chưa xác nhận kết quả chạy thực tế từ môi trường này; cần kiểm tra GitHub Actions sau khi workflow hoàn tất hoặc chạy các lệnh trên máy local. Fixture là ảnh kỹ thuật 1×1, không phải bộ art chính thức. Validator hiện kiểm tra chữ ký file chứ chưa giải mã đầy đủ pixel/dimension; cần hardening trước khi phân phối Pack rộng rãi.


## Phase 1 QA result and Phase 2 start — 12/11/2026

### Phase 1 local QA evidence

The project owner ran the commands from `worldforge_ui_prototype/`:

- `npm run assets:fixture`: generated `tests/assets/fixtures/classic-fantasy.wfpack` (1,703 bytes).
- `npm run test:assets`: 12 passed, 0 failed.
- `npm test`: 12 passed, 0 failed.

This verifies the current Node test suite on the owner's local environment. It does not yet prove browser rendering, complete image decoding, project persistence, or production readiness.

The generated `.wfpack` is a disposable QA artifact. The repository ignores `worldforge_ui_prototype/tests/assets/fixtures/*.wfpack`; tests can regenerate it with `npm run assets:fixture`.

### Phase 2 implementation started

- Added versioned image-object schema v1 with Pack/asset reference, world-space position, dimensions, rotation, opacity, and fit mode (`contain`, `cover`, `fill`).
- Added a dedicated `ImageObjectRenderer` object renderer. The existing `CanvasLayerRenderer` delegates image drawing and image hit-testing to it; no image-specific layer renderer is introduced.
- Added asynchronous image loading through the existing AssetLoader URL, preloading for exports, and redraw notification after image load.
- Added rotation-aware hit testing and rotated axis-aligned selection bounds.
- Added `MapCanvasEngine.setAssetLoader(assetLoader)` and connected an in-memory AssetRegistry/AssetLoader/AssetPackService in the UI bootstrap.
- Connected the same image renderer to map export; PNG/JPG/PDF render through the Canvas renderer after image preloading, while SVG embeds image bytes as data URLs.

### Phase 2 verification status

Implemented code and automated tests are being added. Browser rendering, manual pan/zoom verification, and full user-facing Pack installation remain unverified until tested in the running app. Automated tests now cover image object validation, rotated bounds/hit-testing, asynchronous loading, and SVG data-URL embedding. Do not mark Phase 2 complete yet.
