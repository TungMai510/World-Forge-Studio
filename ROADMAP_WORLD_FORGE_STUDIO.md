# WorldForge Studio — Tổng quan hiện trạng và lộ trình phát triển

> **Ngày rà soát:** 12/11/2026 (Phase 3C.4 hoàn tất; Phase 3D.1 đã triển khai, chờ kiểm thử local/browser)  
> **Repository:** https://github.com/TungMai510/World-Forge-Studio  
> **Nhánh:** `main`  
> **Phạm vi mã nguồn:** `worldforge_ui_prototype/`  
> **Mục tiêu tài liệu:** thống nhất định hướng sản phẩm, ghi nhận những gì có bằng chứng trong repository và chia nhỏ lộ trình phát triển tiếp theo.


> **Quyết định kiến trúc mới — 12/11/2026:** Asset Pack phải trở thành nguồn tài nguyên dùng chung cho Tool System. Các mục Phase 3–4 bên dưới được diễn giải lại theo tài liệu `TOOL_ASSET_INTEGRATION_SPECIFICATION.md`; PlaceAssetTool vẫn được giữ như công cụ đặt asset tổng quát, không phải con đường duy nhất để dùng asset.

## Cập nhật định hướng: hợp nhất Tool System và Asset System (12/11/2026)

### Vấn đề được xác định

Prototype hiện có hai luồng chưa kết nối đầy đủ:

- Tool System tạo các đối tượng bản đồ bằng hình học/vector (Landmass, Terrain/Mountain, River, Lake, Border, Icon, Brush...).
- Asset System nạp tài nguyên từ `.wfpack` và PlaceAssetTool đặt chúng dưới dạng Image Object độc lập.

Vì vậy, người dùng có thể vẽ núi/hồ/biên giới bằng công cụ cũ hoặc đặt một ảnh riêng lẻ, nhưng chưa thể chọn tài nguyên trong Asset Pack ngay trong ngữ cảnh của công cụ tương ứng. Đây là khoảng trống kiến trúc, không chỉ là thiếu giao diện Asset Library.

### Quyết định sản phẩm

**Asset Pack là nguồn tài nguyên chung của Map Editor; Tool là nơi người dùng chọn cách sử dụng tài nguyên đó.** Người dùng không phải rời công cụ chuyên biệt để chuyển sang Place Asset chỉ vì muốn dùng hình ảnh/texture/icon từ Pack.

- Giữ các công cụ hiện có và khả năng tạo hình học không cần Pack.
- Giữ PlaceAssetTool cho thao tác đặt ảnh tự do/generic stamp.
- Tích hợp Asset Library theo ngữ cảnh vào các công cụ phù hợp: Icon, Terrain/Mountain, Lake, Border; sau đó mở rộng River, Landmass và Brush.
- Một asset có thể hỗ trợ nhiều cách dùng; category/tên asset không được dùng thay cho capability.
- Không hardcode danh mục cụ thể của một Pack trong Core. Core cung cấp capability/usage chung; Pack khai báo metadata; Tool quyết định cách hiển thị và áp dụng.
- Không biến mọi asset thành Image Object. Công cụ tạo semantic map object tương ứng (ví dụ terrain, lake, border path) và gắn asset reference khi cách dùng yêu cầu.

### Mô hình kiến trúc bắt buộc

Tách rõ bốn khái niệm:

1. **Asset:** nội dung gốc và metadata trong Pack.
2. **Asset Usage/Capability:** các cách dùng được hỗ trợ, ví dụ `stamp`, `icon`, `scatter`, `texture-fill`, `pattern-stroke`.
3. **Tool Binding/Adapter:** cầu nối giữa Asset Library và một Tool; khai báo capability/filter, chuyển lựa chọn thành options của Tool và tạo semantic object.
4. **Map Object:** đối tượng thực tế trên bản đồ, có hình học/transform và assetRef khi cần.

Luồng chuẩn: Pack → Validator/Registry → Asset Library → Tool Binding → Tool → Semantic Map Object → Renderer/Export/Persistence.

### Lộ trình được điều chỉnh

- **Phase 1 — Asset Foundation:** giữ nguyên; bổ sung metadata capability ở schema tương thích, không phá Pack v1.
- **Phase 2 — Image Object & Renderer:** giữ nguyên; xem đây là nền tảng cho stamp/decor, không phải renderer duy nhất cho mọi asset-backed object.
- **Phase 3A — Tool–Asset Integration Contract:** thiết kế capability metadata, Tool binding API, asset selection state và semantic object references; viết test contract trước khi sửa UI.
- **Phase 3B — Shared Asset Library:** xây thư viện thumbnail/search/filter và panel theo ngữ cảnh; có thể dùng chung một component, nhưng filter/capability do Tool cung cấp.
- **Phase 3C — Specialized Tool Integration:** ưu tiên Icon → Terrain/Mountain → Lake → Border; giữ chế độ procedural/vector hiện có và bổ sung chế độ asset-backed tương ứng.
- **Phase 3D — Generic Placement & Advanced Use:** hoàn thiện PlaceAssetTool cho stamp tự do; sau đó mới thêm scatter/brush/texture-fill/pattern-stroke theo từng capability có kiểm thử.
- **Phase 4 — Persistence & Archive:** lưu semantic object + assetRef, snapshot/embed tài nguyên đang dùng và bảo đảm mở lại dự án khi Pack bị gỡ.
- **Phase 5 — Pack Management UI; Phase 6 — Asset Studio; Phase 7 — Community ecosystem.** Các phase sau dịch số so với lộ trình cũ và chỉ bắt đầu khi tích hợp công cụ cốt lõi ổn định.

### Trạng thái triển khai tại thời điểm quyết định

- Đã có Asset Foundation, Image Object/Renderer và PlaceAssetTool trong mã nguồn.
- ToolManager hiện đăng ký cả các tool vector cũ và PlaceAssetTool; Asset Pack selection hiện chủ yếu phục vụ PlaceAssetTool.
- Shared Asset Library và ToolAssetBinding hiện đã được triển khai.
- Icon, Terrain/Mountain và Lake đã được tích hợp; người dùng xác nhận browser QA hoàn tất. Lake hiện hỗ trợ texture-fill trên ellipse, chưa phải geometry editor nâng cao.
- Border Tool đã hoàn tất tích hợp pattern-stroke; automated tests và browser QA (vẽ path, chọn đối tượng, fallback và export PNG/JPG/SVG/PDF) đã được người dùng xác nhận.
- Trạng thái hiện tại được ghi chi tiết trong mục **Tiến độ Asset System** ở cuối tài liệu; các ghi chú cũ phía dưới là lịch sử triển khai và không thay thế trạng thái mới nhất.

Tài liệu thiết kế chi tiết và hợp đồng đề xuất: [`TOOL_ASSET_INTEGRATION_SPECIFICATION.md`](TOOL_ASSET_INTEGRATION_SPECIFICATION.md).

---


## Quyết định ưu tiên triển khai mới — Asset Pack Studio trước Tool Enhancement (12/11/2026)

Quyết định này **thay thế thứ tự triển khai cũ** ở những mục lộ trình phía dưới nếu có mâu thuẫn. Các đặc tả kỹ thuật của Tool Enhancement vẫn được giữ lại, nhưng chưa phải thứ tự công việc tiếp theo.

### Nguyên tắc

WorldForge Studio sẽ ưu tiên hoàn thiện chuỗi Asset System end-to-end trước khi đầu tư nâng cấp sâu các công cụ vẽ. Lý do: Asset Pack Studio cần một nền tảng lưu trữ, quản lý Pack, metadata, validation và luồng sử dụng thống nhất; khi nền tảng này ổn định, các Tool có thể dùng chung hệ thống thay vì phải sửa lại khi kiến trúc Asset thay đổi.

Không yêu cầu hoàn thiện mọi Tool trước Asset Pack Studio. Chỉ duy trì và kiểm thử các thao tác cốt lõi đang có để bảo đảm Asset Pack có thể được nhập, duyệt, áp dụng, render, chỉnh sửa và lưu trong dự án.

### Thứ tự triển khai được chốt

| Ưu tiên | Giai đoạn | Trọng tâm | Điều kiện đầu ra |
|---:|---|---|---|
| 1 | Hoàn tất Phase 3D | Xác minh Place Asset, chỉnh sửa Image Object đã chọn, Undo/Redo và SVG/tool icons | Automated tests và browser QA sau các cập nhật UI gần nhất |
| 2 | Phase 4 — Persistence/Archive | Lưu project cùng asset references và embedded snapshots; mở lại đúng khi Pack bị gỡ/cập nhật | Round-trip save/load/import/export không mất asset |
| 3 | Phase 5 — Asset Pack Management | Cài đặt, gỡ, bật/tắt, cập nhật, kiểm tra phiên bản và trạng thái Pack | Vòng đời Pack an toàn, có rollback và không phá project |
| 4 | Phase 6 — WorldForge Asset Studio | Tạo Pack, nhập ảnh hàng loạt, sửa metadata, preview, validate và xuất .wfpack | Pack tạo từ Studio có thể import lại vào Asset Library và dùng trên bản đồ |
| 5 | Phase 7 — Tích hợp và ổn định Asset System | Kiểm thử end-to-end, offline, tài liệu, tương thích và quy trình phát hành | Luồng Create → Export → Import → Use → Save Project → Reopen được xác minh |
| 6 | Phase 3E — Advanced Selection | Multi-selection, marquee, thao tác hàng loạt và atomic history | Hoàn thiện trên nền dữ liệu/object/persistence ổn định |
| 7 | Phase 3F — Brush Enhancement | Smoothing, size/opacity/hardness, presets | Không hồi quy vector stroke và export |
| 8 | Phase 3G — River Enhancement | Curve/node/tangent, width profile, tributaries, texture | Semantic river chỉnh sửa được và export nhất quán |
| 9 | Phase 3H — Landmass Enhancement | Vertex editing, coastline smoothing/procedural generation | Hình học ổn định, có seed và bảo toàn polygon |
| 10 | Phase 3I — Typography | Local fonts, Vietnamese glyphs, label presets và text styling | Hoạt động offline, bounds và export nhất quán |

### Phạm vi Tool cần giữ trước Asset Pack Studio

- Giữ Select, Icon, Terrain, Lake, Border và Place Asset ở trạng thái sử dụng được; không cần hoàn thành multi-select hoặc các tính năng nâng cao trước.
- Duy trì vector/procedural fallback để người dùng vẫn tạo bản đồ khi không cài Pack.
- Chỉ sửa lỗi hoặc bổ sung phần Tool trực tiếp cần thiết cho luồng Asset Pack, renderer, selection cơ bản, layer guards, export và persistence.
- Brush/River/Landmass/Text nâng cao được hoãn; không xóa đặc tả Phase 3E–3I đã thống nhất.

### Điều kiện nghiệm thu Asset Pack Studio

1. Tạo Asset Pack mới và khai báo Pack ID/version/metadata.
2. Thêm một hoặc nhiều ảnh từ máy tính; hỗ trợ quy trình nhập hàng loạt ở mức phù hợp.
3. Chỉnh sửa metadata từng asset: ID, tên, category, tags, usages/capabilities, mô tả, default size và license/attribution.
4. Xem trước asset và kiểm tra đường dẫn/tệp tương ứng.
5. Validate schema, file, kích thước, capability và các giới hạn an toàn; hiển thị lỗi có thể xử lý.
6. Xuất .wfpack theo đặc tả; không cho Pack thực thi mã tùy ý.
7. Import Pack vừa xuất vào Asset Library, kiểm tra asset xuất hiện đúng và dùng được trong Tool tương thích.
8. Lưu Project đang sử dụng asset, gỡ Pack nguồn, sau đó mở lại Project mà asset vẫn hiển thị nhờ embedded snapshot/fallback.
9. Sửa Pack đã có và xuất phiên bản mới mà không làm hỏng tham chiếu của Project cũ.

### Ranh giới giữa Phase 5 và Phase 6

Phase 5 là **runtime Pack Management** trong WorldForge Studio (cài đặt, gỡ, bật/tắt, cập nhật, trạng thái và tương thích). Phase 6 là **authoring workflow** trong Asset Studio (tạo/sửa/validate/export Pack). Hai phần dùng chung validator, schema và Pack service; không tạo hai định dạng hoặc hai quy tắc metadata riêng.

### Cập nhật trạng thái

- Phase 3C.1–3C.4 đã được người dùng xác nhận hoàn tất.
- Phase 3D đã có các chức năng đặt asset và chỉnh sửa thuộc tính Image Object được chọn; tuy nhiên, bộ kiểm thử 76/76 được chạy trước khi bổ sung UI chỉnh sửa đối tượng đã chọn, nên cần chạy lại npm test và browser QA cho bản cập nhật đó trước khi đóng Phase 3D.
- 11 SVG tool icons đã được thêm vào assets/tool-icons/ và toolbar đã được cập nhật; browser QA tải SVG và trạng thái active vẫn cần xác nhận.
- Phase 4–7 là ưu tiên kế tiếp; Phase 3E–3I chuyển sang backlog sau khi chuỗi Asset System end-to-end ổn định.

## Định hướng kiến trúc bổ sung — WorldForge AI Layer (12/11/2026)

WorldForge Studio được định hướng là một ứng dụng worldbuilding **hoạt động đầy đủ khi không có AI**, đồng thời có thể mở rộng năng lực sáng tạo và tự động hóa thông qua một lớp AI dùng chung. AI không thay thế các Studio và không được trở thành điều kiện bắt buộc để mở, chỉnh sửa, lưu hoặc xuất dự án.

### Nguyên tắc đã thống nhất

- Xây dựng **WorldForge AI Layer** dùng chung cho các Studio thay vì để từng Studio tích hợp trực tiếp và riêng lẻ với từng nhà cung cấp model.
- **AI Gateway** là lớp trung gian quản lý Model Adapter, định tuyến nhiệm vụ, cấu hình nhà cung cấp, API key, giới hạn sử dụng, theo dõi chi phí, retry/error handling và chuẩn hóa kết quả.
- Hỗ trợ nhiều nhà cung cấp và model; không khóa kiến trúc vào một model duy nhất.
- Giữ định hướng local-first: người dùng có thể không bật AI, tự cung cấp API key, hoặc dùng model local khi có adapter tương thích. Không mặc định mọi người dùng phải mua lượt AI từ WorldForge.
- AI đọc ngữ cảnh thế giới thông qua API/contract được cấp quyền của World Data Core; chỉ lấy dữ liệu cần thiết cho tác vụ.
- Kết quả AI mặc định là bản nháp/đề xuất. Các thay đổi vào dữ liệu chuẩn của thế giới phải có bước xem trước, xác nhận và có thể hoàn tác.
- Ghi nhận lịch sử tạo nội dung và nguồn gốc nội dung; không tự động ghi đè dữ liệu gốc hoặc xóa nội dung do người dùng tạo.
- Nội dung hình ảnh do AI sinh phải đi qua cùng pipeline kiểm tra, chuẩn hóa, metadata, license/provenance và Asset Pack Validator như nội dung nhập thủ công.

### Phạm vi năng lực dự kiến

| Studio / hệ thống | Hỗ trợ AI dự kiến |
|---|---|
| Map Studio | Gợi ý địa hình, bố cục, địa danh; tạo hình tham khảo bản đồ; đề xuất đối tượng nhưng không tự ý sửa geometry chuẩn |
| Asset Studio | Sinh icon, texture, vật thể, biến thể hình ảnh; tạo metadata; phân loại, kiểm tra và đóng gói .wfpack |
| Character Studio | Hồ sơ, tiểu sử, ngoại hình, tính cách, quan hệ, trang phục và hình minh họa nhân vật |
| Civilization Studio | Gợi ý quốc gia, văn hóa, phong tục, thể chế, tổ chức và quan hệ |
| History & Timeline Studio | Đề xuất sự kiện, nguyên nhân, hệ quả, dòng thời gian và các mốc liên quan |
| Power System Studio | Đề xuất nguồn sức mạnh, nhánh tiến triển, năng lực, giới hạn và quy tắc tương tác |
| Story Studio | Hỗ trợ ý tưởng, dàn ý, cảnh, hội thoại và kiểm tra tính nhất quán với dữ liệu thế giới |
| World Assistant | Trợ lý hội thoại có ngữ cảnh, có thể đề xuất chuỗi thao tác xuyên nhiều Studio nhưng phải trình bày kế hoạch và xin duyệt trước khi ghi dữ liệu |

### Ba cấp độ can thiệp

1. **AI Suggestion:** chỉ đưa ra gợi ý; người dùng tự quyết định và thao tác.
2. **AI Assisted Creation:** tạo bản nháp hoặc tài sản nháp; người dùng chỉnh sửa và duyệt.
3. **AI Agent:** thực hiện chuỗi bước có giới hạn qua các API được cấp quyền; hiển thị kế hoạch, tác động và bản xem trước trước khi commit.

Không cấp cho AI quyền chạy mã tùy ý, truy cập filesystem ngoài phạm vi được cho phép, hoặc ghi trực tiếp vào kho dữ liệu mà bỏ qua validation/History.

### Các điều kiện kiến trúc cần chuẩn bị

- World Data Core có API đọc theo ngữ cảnh, truy vấn entity/relationship và xác thực tham chiếu ổn định.
- Có schema/contract cho kết quả AI có cấu trúc; không chỉ dựa vào văn bản tự do.
- Có lớp kiểm tra dữ liệu (schema validation, relationship validation, asset validation) trước khi nhập kết quả.
- Có AI Generation History lưu tác vụ, model/provider, thời điểm, prompt hoặc tham chiếu prompt theo chính sách riêng tư, tham số cần thiết, kết quả, trạng thái duyệt và provenance.
- Có cơ chế Preview → Validate → Approve → Commit, tích hợp History/Undo/Redo và rollback.
- Có cấu hình quyền riêng tư, dữ liệu được gửi ra nhà cung cấp, giới hạn ngữ cảnh, quản lý API key an toàn và cảnh báo chi phí.
- Có thể tắt AI hoàn toàn mà không ảnh hưởng các workflow cốt lõi.
- Model Adapter phải tách khỏi UI và domain logic để thay model/nhà cung cấp không làm thay đổi schema dự án.

### AI Asset Pack workflow

1. Người dùng mô tả Pack hoặc nhóm asset cần tạo.
2. AI đề xuất danh sách asset, phong cách, kích thước và metadata dự kiến.
3. Tạo từng ảnh hoặc biến thể qua Image Model Adapter.
4. Người dùng chọn, chỉnh sửa hoặc yêu cầu tạo lại.
5. Pipeline chuẩn hóa định dạng/kích thước/thumbnail và kiểm tra file.
6. AI có thể đề xuất metadata; người dùng xác nhận category, usages, tags, license và attribution.
7. Asset Pack Validator kiểm tra manifest, đường dẫn, dung lượng, chữ ký file, capability và giới hạn bảo mật.
8. Asset Studio đóng gói .wfpack; người dùng import thử và kiểm tra trong Asset Library/Map Studio.

AI không được tự tuyên bố quyền sở hữu hoặc license hợp lệ cho hình ảnh. License, nguồn gốc, quyền phân phối và trách nhiệm xác nhận phải được thể hiện rõ; không xuất Pack nếu thiếu thông tin bắt buộc theo chính sách Pack.

### Phạm vi không làm ngay

- Chưa tích hợp model AI trong các Phase Asset System hiện tại.
- Chưa yêu cầu tài khoản AI, backend cloud hoặc marketplace.
- Chưa cho AI tự động sửa canonical world data không cần xác nhận.
- Chưa cam kết một nhà cung cấp, model, giá hoặc chất lượng đầu ra cụ thể.
- Chưa thay đổi thứ tự triển khai hiện tại: hoàn tất Phase 3D verification → Phase 4 Persistence/Archive → Phase 5 Pack Management → Phase 6 Asset Studio → Phase 7 end-to-end/offline/stability QA. AI Layer là định hướng kiến trúc dài hạn, không phải lý do trì hoãn hoặc đảo thứ tự công việc đang được duyệt.

Tài liệu đặc tả riêng: `WORLD_FORGE_AI_ARCHITECTURE_SPECIFICATION.md`.

---

## 1. Tầm nhìn sản phẩm đã thống nhất

### Cập nhật tiến độ Phase 3C — 12/11/2026

- **Đang triển khai 3C.1 — Icon Tool:** Icon Tool có thể nhận asset qua Asset Library, tạo semantic icon object kèm `assetRef` và render ảnh thông qua ImageObjectRenderer. Chế độ icon vector mặc định vẫn được giữ.
- Đã bổ sung automated tests cho vector fallback, asset-backed icon object và renderer delegation. Cần chạy lại `npm test` trên checkout mới nhất và thực hiện browser QA trước khi xác nhận lát cắt này hoàn tất.
- Terrain/Mountain, Lake và Border chưa được coi là tích hợp; tiếp tục triển khai lần lượt sau khi Icon Tool đạt QA.


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
- Repository công khai, nhánh `main`, có lịch sử commit cập nhật liên tục.
- Prototype có `worldforge_ui_prototype/package.json`, dùng Node.js 20+ và Node built-in test runner.
- Đã có GitHub Actions workflow cho test WorldForge.
- Tại lần cập nhật này, các thay đổi Phase 2 mới nhất đã được đẩy lên `main`; test mới cần được chạy lại trên checkout mới nhất trước khi xác nhận pass.
- Các kết quả test do người dùng chạy tại máy cục bộ được ghi nhận riêng, không suy diễn thành CI pass nếu chưa có kết quả workflow tương ứng.

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
- `src/engine/objects/ImageObjectRenderer.js` cho image object schema, bounds, hit testing, decode cache và drawing.
- `src/assets/` với Asset Pack validator, registry, loader và pack service.
- `src/services/` với archive-service, project-service, geography-service, civilization-service, history-service và map-export-service.
- `tests/assets/` với Node tests, fixture generator và browser QA harness.
- `src/ui/layout.js`

**Nhận xét kiến trúc:** một số phần nghiệp vụ đã được tách module, nhưng UI chính vẫn tập trung trong `layout.js` có kích thước lớn. Cần ưu tiên tách dần theo tính năng khi sửa, tránh một lần tái cấu trúc lớn gây hồi quy.

### 2.3. Các năng lực đã có bằng chứng mã nguồn

| Khu vực | Hiện trạng xác minh | Phân loại bằng chứng |
|---|---|---|
| Project Manager | IndexedDB lưu projects và recentProjects; CRUD dự án | Có mã nguồn |
| Project schema | `SCHEMA_VERSION = 2`, có migration từ schema 1 | Có mã nguồn |
| Map Engine | World map, layers/groups, viewport, render loop, selection/hit-test, object CRUD | Có mã nguồn |
| Map object types | Có rect, circle, path, ellipse, text, icon, terrain và image schema v1 | Có mã nguồn + unit tests |
| Renderer extension | Canvas renderer tích hợp ImageObjectRenderer; hỗ trợ fit, opacity, rotation và async decode | Có mã nguồn + unit tests |
| Tool system | ToolManager đăng ký các công cụ bản đồ hiện có; PlaceAssetTool thuộc Phase 3 | Có mã nguồn |
| Geography | Service quản lý worlds, continents, countries, cities, locations | Có mã nguồn và mô tả tài liệu |
| Civilization | Service quản lý characters, races, cultures, religions, organizations | Có mã nguồn và mô tả tài liệu |
| History | Service quản lý calendars, eras, periods, records, events | Có mã nguồn và mô tả tài liệu |
| Undo/Redo | HistoryManager và thao tác map/layer có tích hợp lịch sử theo tài liệu | Có mã nguồn; cần kiểm thử hồi quy |
| Project JSON | Có import/export và validate dữ liệu dự án | Có mã nguồn |
| WFORGE archive | ZIP STORE, manifest/project JSON, externalize Data URL assets, CRC/path/size checks | Có mã nguồn |
| Map export | Service xuất PNG/JPG/SVG/PDF theo tài liệu dự án | Có mã nguồn; cần kiểm tra trực tiếp các định dạng |
| Asset Pack | Manifest validator, registry, loader, pack service và fixture .wfpack | Có mã nguồn + integration tests |
| Asset Library UI | Chưa tìm thấy thư viện thumbnail/search/filter dựa trên Pack | Chưa triển khai theo bằng chứng hiện có |
| Image Renderer | Có image object/renderer, cache lifecycle invalidation, Pack-version check và SVG image embedding | Implemented; browser QA đang tiếp tục |
| Place Asset Tool | Chưa có công cụ đặt asset chuyên biệt | Chưa triển khai; thuộc Phase 3 |

### 2.4. Persistence hiện có: nền tảng tốt nhưng chưa phải Asset System

`database-manager.js` hiện tạo hai object store: `projects` và `recentProjects`. Chưa thấy object store riêng cho Asset Pack hay user assets.

`project-service.js` có cơ chế duyệt dữ liệu dự án, chuyển Data URL hình ảnh thành file trong archive và khôi phục lại khi import. Archive dùng các entry như `manifest.json`, `project.json` và `assets/000000.png`; có giới hạn kích thước, số entry, kiểm tra CRC và đường dẫn.

**Điều này có nghĩa:** đã có nền tảng nhúng ảnh vào file dự án, nhưng chưa có khái niệm Pack được cài đặt, phiên bản Pack, asset ID ổn định, dependency hay quản lý vòng đời Pack. Không được xem cơ chế archive dự án hiện tại là Asset Pack Manager.

### 2.5. QA và giới hạn xác minh

Repository có các file QA Import/Export: `.worldforge.json`, `.wforge`, `.png`, `.jpg`, `.svg`, `.pdf` và một ảnh bản đồ. Điều này cho thấy đã lưu lại bộ artifact phục vụ QA.

Hiện đã có Node test suite trong `worldforge_ui_prototype/tests/assets/`, lệnh `npm test`, fixture generator và browser QA harness cho Phase 2. Người dùng đã xác nhận lần chạy trước đạt 25/25 pass; sau đó bổ sung hai regression tests và fixture PNG nhiều kích thước, vì vậy bộ test mới nhất (dự kiến 27 tests) vẫn cần chạy lại. Browser QA được người dùng đánh giá sơ bộ là “khá ok”, nhưng chưa có checklist kết quả chi tiết cho mọi thao tác và định dạng export. Không xem đây là E2E đầy đủ hoặc CI pass.

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

**Trạng thái triển khai / xác minh tại 12/11/2026:**

- Image object schema v1, geometry validation, rotated bounds và hit testing: implemented.
- Canvas renderer hỗ trợ contain/cover/fill, opacity, rotation, placeholder khi chưa có ảnh và redraw sau decode: implemented; fit behavior có regression tests.
- AssetLoader lifecycle invalidation được nối với decoded-image cache; có kiểm thử disable/uninstall và Pack-version mismatch.
- Map export có đường xử lý image object cho PNG/JPG/PDF qua Canvas và SVG với embedded data URI; SVG image test kiểm tra fit/opacity/rotation.
- Automated tests trước lần hardening này: 25/25 pass do người dùng chạy. Hai test mới và fixture PNG nhiều kích thước vừa được thêm; cần chạy lại trên commit mới nhất.
- Browser QA harness đã được mở và người dùng đánh giá sơ bộ “khá ok”; chưa có biên bản xác nhận toàn bộ checklist PNG/JPG/SVG/PDF và thao tác layer/zoom/pan.

**Definition of Done còn lại:** chạy lại toàn bộ test suite; hoàn tất browser checklist với cả mountain (96×64) và forest (64×96), đặc biệt fit modes, layer visibility/opacity, pan/zoom và bốn định dạng export; ghi nhận browser/OS và lỗi console. Chưa đánh dấu Phase 2 complete cho đến khi các bước này được xác nhận.

### Phase 3 — Tool–Asset Integration

**Mục tiêu:** hợp nhất Asset System với các công cụ bản đồ hiện có. Asset Pack trở thành nguồn tài nguyên dùng chung; người dùng chọn asset ngay trong ngữ cảnh của công cụ phù hợp.

#### Phase 3A — Tool–Asset Integration Contract

1. Định nghĩa capability/usage vocabulary độc lập với category của Pack.
2. Thiết kế Tool Binding API để mỗi tool khai báo capability cần thiết, bộ lọc phụ và cách nhận asset selection.
3. Thiết kế semantic object/assetRef cho Icon, Terrain, Lake và Border; không biến tất cả thành Image Object.
4. Xác định renderer extension, export, hit-test, history và persistence contract.
5. Thêm contract tests cho capability matching, disabled Pack, stale/missing references và backward compatibility.
6. Giữ nguyên các chế độ vector/procedural đang có.

**Tiêu chí hoàn thành:** contract và schema được tài liệu hóa; test pass; tool cũ vẫn hoạt động không cần Pack.

#### Phase 3B — Shared Asset Library

1. Xây Asset Library thành component/module dùng chung, không triển khai riêng từng tool.
2. Duyệt thumbnail, tìm kiếm theo tên/ID/tag, lọc theo Pack/category.
3. Nhận capability query từ Tool Binding đang hoạt động.
4. Trả asset selection về đúng Tool Binding.
5. Có loading/error/empty state, trạng thái Pack/version và khả năng điều hướng bàn phím.

**Tiêu chí hoàn thành:** cùng một Asset Library phục vụ ít nhất hai tool với capability filter khác nhau; không có logic đọc Pack lặp lại trong từng tool.

#### Phase 3C — Tích hợp các công cụ chuyên biệt

Thứ tự ưu tiên:

1. **Icon Tool:** chọn asset có capability icon, giữ built-in icon làm fallback.
2. **Terrain/Mountain:** giữ vẽ polygon procedural; bổ sung asset stamp, sau đó mới scatter.
3. **Lake:** giữ ellipse/vector; bổ sung texture-fill được clip theo hình học hồ.
4. **Border:** giữ path/stroke/dash; bổ sung pattern-stroke lặp theo chiều dài đường biên.

Mỗi tích hợp phải có unit tests, renderer/export tests và browser QA trước khi chuyển sang tool tiếp theo.

**Tiêu chí hoàn thành:** asset selection tạo đúng semantic map object; thao tác chọn/sửa/duplicate/delete/Undo/Redo và export không làm mất asset reference.

#### Phase 3D — Generic Placement và mở rộng

1. Giữ PlaceAssetTool làm công cụ đặt stamp/decoration tự do.
2. Hoàn thiện generic placement và các thuộc tính transform.
3. Chỉ triển khai Scatter sau khi có thuật toán seeded/deterministic, spacing và grouped Undo/Redo.
4. Mở rộng Brush, River và Landmass sau khi các contract texture-fill/pattern-stroke/scatter được kiểm chứng.

**Tiêu chí hoàn thành:** PlaceAssetTool không còn là con đường bắt buộc để dùng asset trong các tool chuyên biệt; các chế độ nâng cao có kết quả lặp lại được và kiểm thử đầy đủ.

### Phase 4 — Persistence, Archive và khả năng khôi phục

**Mục tiêu:** project luôn mở lại đúng kể cả khi môi trường Pack thay đổi.

Công việc:
1. Chuẩn hóa Project asset references cho semantic object.
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

### Phase 5 — .wfpack Import/Export và Asset Pack Manager UI

**Mục tiêu:** người dùng cài và quản lý Pack an toàn.

Công việc:
1. Hoàn thiện .wfpack parser/writer dùng chung schema.
2. Import qua file picker và preview nội dung trước khi cài.
3. Validate toàn bộ Pack trước khi commit cài đặt.
4. Installed Packs: enable/disable, details, uninstall, update.
5. Phát hiện Pack đang được Project tham chiếu.
6. Quản lý version, duplicate pack ID và update policy.
7. Kiểm thử Pack lỗi, quá lớn, file trùng và path độc hại.

**Tiêu chí hoàn thành:**
- Người dùng import một .wfpack hợp lệ và asset xuất hiện trong Library.
- Pack không hợp lệ bị từ chối an toàn.
- Enable/disable/uninstall không làm hỏng Core.
- Project đã lưu không mất ảnh khi Pack bị gỡ.

### Phase 6 — WorldForge Asset Studio

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

### Phase 7 — Mã nguồn mở và hệ sinh thái cộng đồng

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


### Phase 2 hardening update — 12/11/2026

A focused code review identified a lifecycle gap: the AssetLoader revoked Blob URLs on Pack disable/uninstall, but the ImageObjectRenderer could retain already-decoded `HTMLImageElement` instances. This could leave an image visible from a disabled Pack until another renderer/cache event. The renderer also needed explicit handling for a Pack invalidation during an in-flight image decode and a redraw when an image was already decoded synchronously from cache.

Changes committed:
- AssetLoader now exposes a lightweight `subscribe()` event API and emits Pack invalidation / full-cache-clear events.
- ImageObjectRenderer subscribes to loader lifecycle events, clears decoded images for invalidated Packs, rejects stale in-flight preloads, and avoids stale load callbacks repopulating the cache.
- Immediate image decode now schedules a redraw.
- Image objects with an explicit `assetRef.packVersion` are checked against the actual loaded Pack version.
- MapCanvasEngine.destroy() now disposes the renderer subscription.
- Added regression tests for Pack disable/re-enable, in-flight invalidation, immediate decode redraw, and Pack-version mismatch.
- Added a development-only browser QA page at `tests/assets/image-renderer-browser.html`, using the real Pack parser/registry/loader, MapCanvasEngine, ImageObjectRenderer and MapExportService.
- Documented the manual browser QA workflow in `tests/assets/README.md`.

### Current Phase 2 status

**Implemented:** image object schema, renderer, async loading, rotation-aware hit testing/bounds, map export integration, cache lifecycle hardening, manual browser QA harness.

**Automated tests:** previous local evidence was 20/20 passing before the latest lifecycle hardening. The newly added regression tests have been committed but must be run locally after pulling the latest `main`. Do not carry forward the old 20/20 result as proof that the new tests pass.

**Manual verification:** pending. The browser harness must be run against the generated `classic-fantasy.wfpack`; verify actual image decode, selection/movement, pan/zoom, resize/rotation/opacity/fit, layer visibility/opacity, and PNG/JPG/SVG/PDF exports. Record browser and OS details with results.

Run from `worldforge_ui_prototype/`:

```powershell
npm run assets:fixture
npm test
py -m http.server 8000
```

Then open `http://localhost:8000/tests/assets/image-renderer-browser.html` and follow the checklist in `tests/assets/README.md`.

Phase 2 remains **in progress** until the updated Node test suite passes and the browser checklist is completed. The harness is QA-only and is not part of the production UI.
---

## 12. Quyết định kiến trúc: Local-first, Cloud-ready, Collaboration-ready (12/11/2026)

### Kết luận

**Chưa triển khai Real-time Sync hoặc Real-time Collaboration trong các Phase hiện tại.** Đây không phải là tính năng bị loại bỏ; đây là phần mở rộng được chủ động trì hoãn để tránh xây dựng đồng bộ nhiều người dùng trước khi vòng đời dữ liệu cục bộ ổn định.

### Lộ trình dữ liệu và cộng tác

1. **Local Persistence (ưu tiên trước):** hoàn thiện lưu/mở dự án, autosave, khôi phục sau lỗi, migration schema, asset snapshot và lịch sử chỉnh sửa cục bộ.
2. **Cloud Sync (giai đoạn sau):** đồng bộ dự án giữa nhiều thiết bị của cùng một tài khoản; cần định danh tài khoản, versioning, upload/download, conflict handling và bảo mật.
3. **Real-time Collaboration (giai đoạn tiếp theo):** nhiều người cùng chỉnh một dự án; cần presence, cursor/selection sharing, quyền truy cập, conflict resolution, locking hoặc mô hình CRDT/OT phù hợp, cùng chính sách collaborative undo.
4. **Advanced Collaboration:** workspace, comment, review, version history và chia sẻ nâng cao.

### Nguyên tắc kiến trúc áp dụng ngay

- **Local-first:** WorldForge phải hoạt động đầy đủ offline; thao tác chỉnh sửa không phụ thuộc mạng.
- **Cloud-ready:** dữ liệu và service có ranh giới rõ, có thể bổ sung adapter lưu trữ/đồng bộ mà không viết lại Map Engine.
- **Collaboration-ready:** các thao tác thay đổi dữ liệu nên đi qua API/command rõ ràng; không để UI sửa trực tiếp cấu trúc dữ liệu tùy tiện.
- Ghi nhận sự kiện và nguồn thay đổi ở mức cần thiết, nhưng chưa cần WebSocket, server realtime, presence hay CRDT.
- Không để Asset Pack phụ thuộc cloud; Pack cục bộ phải dùng được offline.

### Những việc không làm ở thời điểm này

- Không xây backend realtime hoặc WebSocket.
- Không xây đăng nhập/tài khoản chỉ để phục vụ đồng bộ.
- Không triển khai multi-user editing, cursor sharing, locks hoặc collaborative undo.
- Không hy sinh độ tin cậy của save/load và archive để chạy theo tính năng cộng tác.

### Điều kiện để mở Cloud Sync

Chỉ bắt đầu thiết kế Cloud Sync sau khi Project Persistence/Archive, schema migration, asset embedding/recovery và kiểm thử offline đạt tiêu chí hoàn thành. Real-time Collaboration chỉ được lên kế hoạch sau khi Cloud Sync có versioning và conflict handling được kiểm chứng.

### Phase 3 — tiến độ triển khai ban đầu

- Đã bổ sung PlaceAssetTool độc lập, hỗ trợ chọn asset qua assetRef, click để đặt theo defaultSize hoặc kéo để xác định bounding box.
- Tool tạo image object schema v1, mang theo Pack version, rotation, opacity và fit; preview hình chữ nhật xuất hiện trong lúc đặt.
- Đã đăng ký tool trong ToolManager với phím tắt P và thêm Node tests cho đăng ký, click placement, drag placement, validation và cancel.
- Phần này mới là nền tảng đặt asset. Di chuyển, resize/rotate handles, duplicate/delete UI và kiểm thử Undo/Redo tích hợp vẫn là các bước tiếp theo của Phase 3.
- Automated tests chưa được chạy trên checkout thực tế trong phiên cập nhật này; cần chạy `npm test` tại `worldforge_ui_prototype` trước khi xem implementation đã tested.


### Phase 3 — UI entry point and temporary Asset Pack selection (12/11/2026)

Đã bổ sung bước kết nối PlaceAssetTool với giao diện hiện tại:

- Thêm nút **Place Asset** vào thanh công cụ bên trái, cạnh Icon Tool.
- Nút chuyển sang Place Asset Tool và mở hộp chọn file `.wfpack`.
- Sau khi chọn file, ứng dụng dùng AssetPackService hiện có để inspect, validate và cài Pack vào Registry trong phiên làm việc.
- Hiển thị danh sách asset của Pack bằng hộp thoại chọn số thứ tự (prompt tạm thời).
- Asset được chọn sẽ được truyền vào PlaceAssetTool cùng Pack version; người dùng có thể click hoặc kéo trên Canvas để đặt.
- File input được reset sau mỗi lần xử lý để có thể chọn lại cùng một file.

**Giới hạn đã biết:** đây là luồng giao diện tối thiểu để kiểm chứng Place Asset end-to-end, chưa phải Asset Library UI. Danh sách asset hiện chọn bằng prompt; chưa có thumbnail/grid/search/filter, Pack Manager, hoặc lưu trạng thái cài Pack qua lần khởi động. Nếu hủy hộp chọn asset, Pack đã import vẫn nằm trong Registry của phiên hiện tại.

**Chưa xác minh:** các thay đổi giao diện vừa commit chưa được chạy trên trình duyệt và chưa có kết quả `npm test` sau hai commit UI. Cần pull, chạy test tự động, sau đó thử import Pack → chọn asset → click/drag đặt ảnh trên Canvas. Phase 3 vẫn In Progress.


### Phase 3 — Image selection, move, resize and rotate (12/11/2026)

Đã mở rộng SelectTool để thao tác trực tiếp với Image Object trên Canvas:

- Khi Image Object được chọn, SelectTool vẽ khung chọn theo đúng góc xoay của ảnh.
- Hiển thị các điểm điều khiển ở bốn góc và một tay nắm xoay bên ngoài cạnh trên.
- Kéo ảnh để di chuyển (tái sử dụng cơ chế move và edit group hiện có).
- Kéo tay nắm góc dưới bên phải để resize theo hai chiều, giữ tâm ảnh cố định và giới hạn kích thước tối thiểu 8 world units.
- Kéo tay nắm xoay để thay đổi rotation; phép tính tính đến tâm ảnh và góc xoay hiện tại.
- Resize/rotate/move sử dụng History edit group để tạo một thao tác Undo/Redo thay vì ghi một lịch sử cho từng pointer move.
- Từ chối resize/rotate trên layer bị khóa hoặc ẩn.
- Thêm `tests/assets/select-image-tool.test.js` với các kiểm thử move, resize, rotate, layer guard và cancel rollback.

**Giới hạn hiện tại:** các handle resize hiện tập trung ở góc dưới bên phải; chưa có aspect-ratio lock, resize từ từng cạnh/góc, snapping hoặc UI nhập kích thước. Duplicate/Delete vẫn là bước tiếp theo, chưa được bổ sung trong thay đổi này.

**Trạng thái xác minh:** code và regression tests đã được commit lên GitHub, nhưng chưa chạy trên checkout Node/browser của người dùng. Cần pull và chạy `npm test`; sau đó kiểm thử thao tác trên Canvas. Phase 3 vẫn In Progress.


### Phase 3 — Duplicate command and Image Object history (12/11/2026)

Sau khi người dùng xác nhận toàn bộ 37/37 kiểm thử hiện tại đã PASS, tiếp tục bổ sung thao tác nhân bản đối tượng:

- Thêm `MapCanvasEngine.duplicateObject()`: tạo ID mới, sao chép metadata đầy đủ và dịch chuyển bản sao theo offset mặc định 16 world units.
- Hỗ trợ dịch chuyển đúng hình học của Path (commands) và Terrain (points), ngoài các object có tọa độ x/y.
- Từ chối nhân bản khi Layer nguồn bị khóa hoặc ẩn; kiểm tra offset hợp lệ.
- Thêm phím tắt `Ctrl+D` / `Cmd+D` để nhân bản object đang chọn.
- Bổ sung test cho Image Object metadata, Path geometry, không mutate nguồn và layer guard.

**Lưu ý về trạng thái:** Delete đã có sẵn trong MapCanvasEngine qua `deleteObjects()` và phím Delete/Backspace; Undo/Redo dùng HistoryManager hiện hữu. Các thao tác duplicate mới được thêm mã nguồn và test, chưa có kết quả chạy từ checkout local. Chưa có nút Duplicate/Delete riêng trên toolbar hoặc context menu. Cần chạy `npm test` và kiểm tra browser trước khi đánh dấu các phần này đã verified.


### Phase 3 — Duplicate/Delete toolbar actions (12/11/2026)

Đã bổ sung các nút thao tác nhanh trong cụm điều khiển bản đồ:

- **Duplicate** gọi `MapCanvasEngine.duplicateObject()`, giữ nguyên metadata/geometry theo logic engine và chọn bản sao sau khi tạo.
- **Delete** gọi luồng xóa đối tượng hiện có.
- Hai nút tự vô hiệu hóa khi không có đối tượng được chọn hoặc layer chứa đối tượng đang ẩn/khóa.
- Giữ nguyên các phím tắt hiện có: `Ctrl+D` / `Cmd+D` để nhân bản; `Delete` / `Backspace` để xóa.

**Trạng thái:** mã giao diện đã được commit; kiểm tra nội dung repository xác nhận markup, event binding, handler và layer guard đều hiện diện. Chưa chạy npm test hoặc browser QA sau thay đổi giao diện. Cần xác minh thủ công: chọn một image → Duplicate → di chuyển bản sao → Undo → Redo → Delete → Undo; thử lại trên layer khóa/ẩn để xác nhận nút bị vô hiệu hóa và engine vẫn từ chối thao tác trái phép.

## Phase 3A — Tool–Asset Integration Contract: implementation update (12/11/2026)

Committed the first reusable runtime contract:

- Added capability query/matching and ToolAssetBinding.
- Registered capability queries for Icon, Terrain, Lake, Border and generic Place Asset in ToolManager.
- Added shared BaseTool asset-selection contract; PlaceAssetTool applies selected Pack reference and default size.
- Wired UIController's existing AssetRegistry into MapCanvasEngine/ToolManager.
- Routed the current generic Pack import/selection flow through ToolManager binding APIs.
- Extended the Pack v1.0 validator/specification with optional `usages` metadata. Existing Packs without it remain valid and generic-placement-only.
- Added tests for usage validation, capability matching, specialized filtering, generic fallback, disabled Pack/version mismatch and selection routing.

**Not yet verified locally:** run `npm run assets:fixture` and `npm test` from `worldforge_ui_prototype`. No test pass is claimed for this commit set yet.

**Remaining in Phase 3A:** inspect and approve the contract against all current tool/object schemas; decide whether the proposed usage names need refinement; run automated tests and fix regressions. Phase 3B UI and Phase 3C semantic tool integrations have not started.


### Phase 3B — Shared Asset Library (implementation started, 12/11/2026)

Implemented in the current `main` branch:

- Shared Asset Library dialog accessible from the editor navigation and Place Asset tool.
- Visual asset grid with image preview, metadata, search, category filter and Pack filter.
- Results are sourced from the active tool's ToolAssetBinding rather than a global unfiltered list.
- In-session Asset Pack import, enable/disable and uninstall controls.
- Pack disable/uninstall invalidates cached URLs and clears selected tool assets from that Pack.
- Replaced the temporary numeric prompt selection workflow.
- Added a pure filtering model and automated tests for query/category behavior and disabled assets.

**Still pending:** run `npm run assets:fixture` and `npm test`; browser QA for import, preview, filters, tool switching, selecting/placing, disabling and uninstalling Packs. Phase 3B is not complete until these checks pass. Persistence across reloads is intentionally deferred to later persistence/Pack Manager phases. Specialized Icon/Terrain/Lake/Border object creation remains Phase 3C.


### Phase 3C.1 — Icon Tool (đã kiểm thử)

- Icon Tool nhận asset có capability `icon`, lưu `assetRef` vào semantic Icon Object và render qua ImageObjectRenderer.
- Giữ nguyên icon vector làm fallback khi chưa chọn asset.
- Shared Asset Library cho phép áp dụng asset vào Icon Tool.
- Fixture Classic Fantasy có thêm Castle Icon (`ICO-001`). Người dùng đã xác nhận hoàn tất kiểm thử giao diện sau khi tạo lại Pack.

### Phase 3C.2 — Terrain/Mountain (đang triển khai)

- Giữ nguyên chế độ vẽ polygon vùng địa hình khi chưa chọn asset.
- Khi chọn asset capability `stamp`, click Canvas sẽ đặt Image Object ở tâm con trỏ, lấy kích thước mặc định từ metadata Pack và giữ namespaced `assetRef`.
- Mở quyền áp dụng asset trong Shared Asset Library cho Terrain Tool.
- Đã bổ sung kiểm thử unit cho fallback polygon, tạo terrain stamp và ủy quyền render; cần chạy `npm test` và browser QA trên checkout local trước khi xác nhận hoàn tất.


### Phase 3C.3 — Lake Tool texture fill (đang triển khai)

- Giữ nguyên chế độ tô màu đặc cho ellipse hồ khi chưa chọn texture.
- Khi chọn asset capability `texture-fill`, LakeTool lưu namespaced `textureAssetRef` trên Lake Object.
- CanvasLayerRenderer lặp texture bên trong vùng clip ellipse; đường viền hồ vẫn được render ở phía trên.
- Fixture Classic Fantasy bổ sung `WTR-001` Lake Water Texture với `usages: ["texture-fill"]`.
- Unit test đã được bổ sung; cần chạy test và browser QA trên máy local trước khi xác nhận hoàn tất.


---

## Tiến độ Asset System — cập nhật 12/11/2026

Phần này là **snapshot trạng thái mới nhất**, thay thế các trạng thái "chưa triển khai/đang bắt đầu" trong các ghi chú lịch sử ở những mục phía trên.

### Các phase đã hoàn thành

| Phase | Nội dung | Trạng thái hiện tại |
|---|---|---|
| 1 | Asset Foundation: Manifest, Registry, Loader, Validator, Pack Manager service | Implemented + tested |
| 2 | Image Object, Renderer, cache lifecycle, export integration | Implemented; browser harness đã được người dùng chạy |
| 3A | Tool–Asset Integration Contract, capability metadata, ToolAssetBinding | Implemented + tested |
| 3B | Shared Asset Library: thumbnail, search, Pack/category filter, import, enable/disable/uninstall | Implemented + tested + browser QA |
| 3C.1 | Icon Tool: semantic icon object + assetRef | User-confirmed browser QA |
| 3C.2 | Terrain Tool: asset stamp + procedural polygon fallback | User-confirmed browser QA |
| 3C.3 | Lake Tool: texture-fill trên ellipse + solid-color fallback | User-confirmed browser QA |
| 3C.4 | Border Tool: pattern-stroke lặp theo path | Completed; automated tests + user-confirmed browser QA |
| 3D.1 | Generic Place Asset: click/drag placement + transform options | Implemented + new automated tests committed; local/browser QA pending |

### Bằng chứng kiểm thử đã được người dùng báo cáo

- Phase 1: 12/12 tests PASS.
- Phase 2: 25/25 tests PASS sau hardening.
- Phase 3A: 52/52 tests PASS; browser smoke test thành công.
- Phase 3B: 57/57 tests PASS; browser QA Asset Library hoàn tất.
- Phase 3C.3 trước khi bắt đầu Border: 66/66 tests PASS; người dùng xác nhận Pack có đủ bốn asset và Lake Tool hoạt động đúng.
- Phase 3C.4: người dùng xác nhận kiểm thử hoàn tất. GitHub Actions workflow run #102 đã chạy thành công sau khi bổ sung Border pattern rendering, export và regression test; run #103 cho cập nhật tài liệu cũng thành công.
- Các kết quả trên là kết quả local do người dùng xác nhận, không được hiểu là GitHub Actions/CI đã chạy tương ứng.

### Fixture Pack hiện tại

Lệnh `npm run assets:fixture` sinh file `tests/assets/fixtures/classic-fantasy.wfpack` từ script, không phải fixture binary được theo dõi trong Git. Pack hiện được mở rộng thành năm asset:

| Asset ID | Nội dung | Capability |
|---|---|---|
| MNT-001 | Sample Mountain | stamp |
| FST-001 | Sample Forest | legacy generic placement |
| ICO-001 | Castle Icon | icon |
| WTR-001 | Lake Water Texture | texture-fill |
| BND-001 | Stone Border Pattern | pattern-stroke |

Nếu Pack đang được cài trong phiên browser cũ, cần gỡ Pack cũ rồi import lại file vừa sinh để Registry nhận manifest năm asset. Đóng tab/server nếu file archive đang bị khóa trên Windows trước khi ghi đè fixture.

### Trọng tâm sản phẩm đã thống nhất

Ưu tiên không phải nâng cấp sâu hình học riêng của Lake Tool ở thời điểm này. Trọng tâm là đưa Asset Pack thành tính năng người dùng có thể cài đặt và quản lý thuận tiện:

1. Hoàn tất Phase 3D — Generic Asset Placement và kiểm chứng luồng sử dụng asset xuyên các tool.
2. Phase 4 — Persistence & Archive: project phải giữ được asset đã sử dụng kể cả khi Pack bị gỡ hoặc không có mặt.
4. Phase 5 — Asset Pack Manager UI: cài đặt, xem trước, bật/tắt, cập nhật, gỡ, xem metadata/phiên bản/giấy phép, cảnh báo dependency và xử lý Pack trùng ID.
5. Phase 6 — WorldForge Asset Studio để người dùng tự tạo và xuất Pack.
6. Phase 7 — Community ecosystem, tài liệu công khai và quy trình phân phối Pack.

**Nguyên tắc UX:** người dùng cuối không cần chỉnh sửa JSON hoặc hiểu assetRef/capability. Họ chỉ cần import một file `.wfpack`, duyệt thumbnail, chọn asset tương thích và sử dụng ngay trong công cụ bản đồ.

### Phase 3C.4 — Border Tool pattern-stroke

**Đã triển khai trong mã nguồn:**
- Border Tool giữ nguyên vector path và dashed stroke nếu không chọn pattern.
- Khi chọn asset có capability `pattern-stroke`, tool lưu `patternAssetRef`, `patternSize`, `patternScale` trên semantic border path.
- CanvasLayerRenderer lặp ảnh theo chiều dài path, căn đều các tile và xoay theo hướng từng đoạn path.
- Renderer vẫn vẽ vector stroke làm fallback khi ảnh pattern chưa load hoặc không khả dụng.
- Bounds của patterned border được nới theo kích thước artwork để khung chọn bao trọn nội dung.
- Asset Library cho phép áp dụng lựa chọn vào Border Tool.
- Fixture generator thêm asset `BND-001 Stone Border Pattern`.

**Đã xác nhận hoàn tất:**
- Fixture Pack có đủ 5 asset, bao gồm `BND-001 Stone Border Pattern`.
- Automated tests đã được chạy; GitHub Actions run #102 xác nhận job Asset Foundation tests và all prototype tests đều PASS.
- Người dùng xác nhận kiểm thử Phase 3C.4 hoàn tất, bao gồm luồng Border Tool và các kiểm tra browser/export theo checklist.
- Border Tool giữ nguyên vector fallback, pattern-stroke được render theo path và asset reference được giữ trên semantic border object.

**Kết luận:** Phase 3C.4 hoàn tất. Có thể chuyển sang Phase 3D — Generic Asset Placement.

### Phase 3D — Generic Asset Placement

#### 3D.1 — Click/drag placement và transform options (đã triển khai, chờ xác minh)
- Place Asset hỗ trợ click để đặt theo `defaultSize` của Pack, căn giữa tại con trỏ; kéo để xác định bounding rectangle tùy chỉnh.
- Toolbar có tùy chọn default width/height, rotation, opacity và fit (`contain`, `cover`, `fill`). Các thuộc tính được lưu trực tiếp trên Image Object cùng namespaced `assetRef`.
- Từ chối thao tác nếu chưa chọn asset hoặc active layer đang ẩn/khóa.
- Đã thêm automated tests cho click, drag, transform metadata và validation; cần người dùng chạy `npm test` và browser QA theo `tests/assets/README.md`.

#### Các lát cắt tiếp theo
- Kiểm chứng selection, move, resize, rotation, opacity, fit, duplicate/delete và Undo/Redo cho generic asset objects; bổ sung UI chỉnh sửa opacity/fit nếu còn thiếu.
- Kiểm tra Asset Pack disable/uninstall khi map còn object đang tham chiếu; giữ nguyên object metadata và thể hiện missing-asset fallback rõ ràng.
- Không đưa scatter hoặc Brush texture nâng cao vào scope trước khi thiết kế deterministic placement và grouped history.

### Phase 4 — Persistence & Archive

- Lưu semantic object và asset references.
- Nhúng snapshot các asset thực sự được project sử dụng vào archive.
- Ghi nhận Pack ID/version/checksum và fallback cho missing/disabled Pack.
- Kiểm thử save → close → reopen, export → uninstall Pack → import project và offline use.

### Phase 5 — Asset Pack Manager UI

- Import preview trước khi cài.
- Installed Pack list và trang chi tiết.
- Enable/disable/uninstall/update/version compatibility.
- Duplicate Pack ID/update policy.
- Cảnh báo Pack đang được project tham chiếu.
- Persistence trạng thái cài đặt qua lần khởi động.
- Hướng dẫn lỗi rõ ràng, không yêu cầu người dùng sửa manifest thủ công.

### Phân biệt trạng thái

- **Implemented:** mã nguồn đã được cập nhật.
- **Automated tested:** test đã thực sự chạy trên checkout tương ứng.
- **Browser verified:** người dùng đã thao tác thực tế và xác nhận.
- Không suy diễn trạng thái CI từ kết quả local; không đánh dấu phase hoàn tất chỉ vì commit đã được tạo.


**Export integration detail:** patterned Border paths are included in Canvas-based PNG/JPG/PDF asset preloading. SVG export embeds the pattern PNG as a data URI and emits repeated image tiles along the path. A focused SVG regression test has been added; local execution and browser export QA remain pending.


### Phase 3D.2 — Selected Image Object properties (12/11/2026)

Đã bổ sung nhóm thuộc tính dành riêng cho Image Object trong Properties panel khi người dùng chọn ảnh đã đặt trên Canvas:

- Chỉnh sửa Width và Height độc lập.
- Chỉnh sửa Rotation bằng số độ.
- Chỉnh Opacity bằng slider có hiển thị phần trăm.
- Chọn Fit: contain, cover hoặc fill.
- Nút **Cập nhật** ghi các thuộc tính vào đúng Image Object đang chọn qua `MapCanvasEngine.updateObject()`, do đó thay đổi đi vào History và hỗ trợ Undo/Redo.
- Các control chỉ xuất hiện với Image Object; bị vô hiệu hóa nếu layer không thể chỉnh sửa.
- Các thông số trên Place Asset toolbar tiếp tục là mặc định cho lần đặt asset tiếp theo, tách biệt với thuộc tính của ảnh đã tạo.

Người dùng báo cáo bộ kiểm thử Phase 3D.2 đạt **76/76 PASS** trước khi phát hiện thiếu luồng chỉnh sửa thuộc tính sau khi tạo. Bản cập nhật UI này đã được commit; cần pull và browser QA các trường Width/Height/Rotation/Opacity/Fit trước khi xác nhận hoàn tất.


---

# Current Roadmap Addendum — Tool Enhancement Program (12/11/2026)

> Đây là kế hoạch điều chỉnh mới nhất cho nhóm công cụ chỉnh sửa bản đồ. Các ghi chú lịch sử ở phía trên được giữ nguyên để bảo toàn tiến trình; khi có khác biệt về trạng thái, sử dụng bảng snapshot trong phần này.

## Trạng thái Phase 3D

- **3D.1 Generic Place Asset:** implementation và automated tests đã được commit; cần xác nhận lại trên checkout local/browser theo checklist.
- **3D.2 Selected Image Object properties:** UI Width/Height/Rotation/Opacity/Fit đã được commit. Kết quả 76/76 PASS là trước bản sửa UI; cần chạy lại `npm test` và browser QA sau bản sửa. Chưa đánh dấu hoàn tất.

## Lộ trình điều chỉnh tiếp theo

| Phase | Hạng mục | Phạm vi chính | Phụ thuộc / tiêu chí chuyển phase |
|---|---|---|---|
| 3E | Advanced Selection System | Marquee selection, multi-select, group move, duplicate/delete nhiều object, history/layer guard | Hoàn tất kiểm thử selection và thao tác hàng loạt; là nền tảng dùng chung cho các tool khác |
| 3E.1 | Marquee Selection | Kéo trái→phải chọn object nằm hoàn toàn trong khung; phải→trái chọn object giao khung; Shift thêm; Ctrl/Cmd-click bật/tắt | Tọa độ màn hình/world chính xác ở mọi zoom/pan; không chọn object trên layer ẩn |
| 3E.2 | Multi-object operations | Primary selection, move cùng nhau, duplicate/delete nhiều object, một thao tác = một history transaction | Giữ nguyên khoảng cách tương đối và metadata; layer khóa/ẩn không bị sửa |
| 3E.3 | Multi-transform & group model | Bounding box chung, resize/rotate nhóm nếu geometry hỗ trợ; persistent Group/Ungroup tách khỏi temporary selection | Chỉ bật transform khi mọi object hợp lệ; group không phá semantic object |
| 3E.4 | Selection UX hardening | Escape, click nền để bỏ chọn, keyboard shortcuts, selection overlay, undo/redo và accessibility | Browser QA cho chuột, bàn phím, zoom/pan và layer guards |
| 3F | Brush Tool Enhancement | Smooth vector stroke, size, opacity, hardness, presets; textured brush sau khi có deterministic stamping | Giữ vector path làm dữ liệu gốc; texture/stamp phải có seed và grouped history |
| 3G | River Tool Enhancement | Bézier/curve path, chỉnh node/tangent, width profile từ nguồn đến hạ lưu, nhánh/sông phụ, style/texture | Dùng chung Path/Vertex Editor; nhánh là các segment liên kết bằng riverSystemId/parentSegmentId |
| 3H | Landmass Tool Enhancement | Vertex editing, smooth coastline, seeded coastline noise, island generation, styling; merge/split là phần sau | Giữ geometry gốc + seed/parameters; merge/split chỉ làm khi có giải pháp polygon boolean đáng tin cậy |
| 3I | Typography System | Font family local, hỗ trợ tiếng Việt, size/weight/style/spacing/alignment/color/outline/shadow, label presets | Font offline, license rõ ràng, fallback; Canvas và SVG export phải nhất quán |

### Nguyên tắc thiết kế chung

1. **Selection trước, geometry sau:** Phase 3E cung cấp API selection và history ổn định trước khi thêm chỉnh sửa sâu cho Brush/River/Landmass.
2. **Không phá tương thích:** tool vector/procedural hiện có tiếp tục hoạt động khi không cài Asset Pack.
3. **Một thao tác hàng loạt = một history transaction:** move/duplicate/delete nhiều object phải Undo/Redo như một hành động nguyên tử.
4. **Không biến multi-select thành persistent group:** selection tạm thời và Group/Ungroup lưu trong project là hai khái niệm riêng.
5. **Geometry có thể chỉnh sửa:** River/Landmass lưu path/points gốc; smoothing/noise là tham số có thể tái tạo, không chỉ raster hóa kết quả.
6. **Local-first typography:** không phụ thuộc Google Fonts/CDN lúc runtime; ưu tiên font được đóng gói cùng app, có license và glyph tiếng Việt.
7. **Asset Pack an toàn:** chỉ chứa dữ liệu/ảnh/font được phép; không thực thi JavaScript từ Pack.
8. **Export parity:** mọi thuộc tính mới phải có quy tắc render và export được mô tả, có test.

### Kiến trúc chức năng mục tiêu

- **Selection & Editing:** Select, marquee, multi-selection, transform, group, history.
- **Drawing:** Brush, Eraser, Landmass, River, Lake, Border.
- **Object:** Icon, Text, Place Asset.
- **Asset:** Asset Library, Pack Manager, Asset Studio.
- **Shared geometry:** Path/Vertex Editor dùng chung cho River, Landmass và các path tool khi phù hợp.

### Điều kiện bắt đầu triển khai

Trước Phase 3E, cần xác minh Phase 3D.2 trên checkout mới nhất. Khi bắt đầu 3E, kiểm tra kỹ MapCanvasEngine hiện chỉ có selection đơn qua `selectedObjectId`; thiết kế `selectedObjectIds` cùng primary selection nhưng duy trì API đơn hiện tại như compatibility wrapper. Không thêm group resize/rotate trong lát cắt đầu tiên nếu chưa có phép biến đổi geometry đúng cho mọi object type.

**Tài liệu đặc tả chi tiết:** `WORLD_FORGE_TOOL_ENHANCEMENT_SPECIFICATION.md`.


---

# Current Roadmap Addendum — Phase 3D verified; Phase 4 started (13/11/2026)

> This addendum supersedes earlier pending-verification notes where they conflict with the user-confirmed status below.

## Phase 3D — Complete

The project owner confirmed on 13 November 2026 that the Phase 3D review and verification are complete. Phase 3D is therefore closed and Phase 4 is the active milestone. This status is based on the user's explicit QA confirmation; detailed test counts are not restated here.

## Phase 4 — Persistence & Archive (IN PROGRESS)

A repository review found that Phase 4 already has a partial foundation:
- IndexedDB project storage and recent-project tracking in `DatabaseManager`.
- Project validation, schema v1→v2 migration, and save/open/import flows in `ProjectService`.
- ZIP STORE creation/reading with CRC32 checks and basic path, entry-count and expanded-size defenses in `archive-service.js`.
- `.wforge` formatVersion 1 export/import, including externalization of image data URLs.
- Image objects preserve semantic `assetRef` fields (`packId`, `assetId`, optional `packVersion`).

### Confirmed gap

The current archive exporter does not resolve Pack-backed `assetRef` values against the Asset Registry and does not embed the actual bytes of referenced Pack assets. Pack-backed images can therefore lose their rendered content when the source Pack is disabled/uninstalled or unavailable on another machine. The runtime Pack registry is currently in-memory.

### Active implementation sequence

1. **Phase 4.1 — Asset snapshot contract and resolution:** define project-scoped snapshots, capture referenced Pack asset bytes and integrity metadata, and provide snapshot fallback without rewriting semantic references.
2. **Phase 4.2 — Project save/load integration:** persist snapshots with project data and verify save/reopen plus disabled/uninstalled Pack behavior.
3. **Phase 4.3 — Portable archive v2:** export only referenced snapshots, add manifest declarations and SHA-256 integrity checks, retain formatVersion 1 and JSON import compatibility.
4. **Phase 4.4 — Round-trip hardening:** test import on a clean browser profile, offline use, corrupt/missing/unsafe entries, size limits, deduplication and all-or-nothing import.

### Phase 4 acceptance gate

A project containing Pack-backed images must remain renderable after save/reopen, Pack disable/uninstall, archive export/import, and import into a clean browser profile without the original Pack installed. Canonical `assetRef`, Pack version and image transforms must remain intact. Projects without Pack-backed images must retain existing behavior.

### Boundaries

- Pack installation persistence and Pack Manager UI remain Phase 5.
- Asset Pack authoring remains Phase 6.
- Cloud sync/collaboration are out of scope.
- Advanced Selection/Brush/River/Landmass/Typography enhancements remain deferred until the Asset System workflow is stable.

**Technical specification:** [`PHASE_4_PERSISTENCE_ARCHIVE_SPECIFICATION.md`](PHASE_4_PERSISTENCE_ARCHIVE_SPECIFICATION.md).


## Phase 4 implementation update — 13/11/2026

- Phase 4.1 code slice is committed: project-scoped snapshot capture, reference deduplication, SHA-256 metadata, AssetLoader Pack→snapshot fallback, and save/open wiring.
- Automated coverage added for duplicate references, Pack uninstall snapshot retention, and Pack-disabled fallback.
- Phase 4.1/4.2 are not signed off yet: latest GitHub Actions run must pass and browser QA is pending. SHA-256 re-verification on snapshot read and archive v2 portability remain open.
- Details and limitations: [Phase 4 Persistence & Archive Specification](PHASE_4_PERSISTENCE_ARCHIVE_SPECIFICATION.md).
