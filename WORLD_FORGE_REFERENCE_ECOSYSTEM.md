# World Forge Studio — Reference Ecosystem

> **Loại tài liệu:** Bản đồ nghiên cứu sản phẩm, kiến trúc và hệ sinh thái tham khảo  
> **Cập nhật:** 16/11/2026  
> **Repository:** TungMai510/World-Forge-Studio · branch main  
> **Ứng dụng:** worldforge_ui_prototype/  
> **Trạng thái:** Tài liệu nghiên cứu định hướng; không phải kế hoạch triển khai đã được phê duyệt.  
> **Nguồn vận hành:** CURRENT_PHASE_CONTEXT.md  
> **Nguồn sản phẩm/kiến trúc:** WORLD_FORGE_STUDIO_MASTER.md

---

## 1. Mục đích và nguyên tắc sử dụng

Tài liệu này tập hợp các sản phẩm, dự án mã nguồn mở và hệ sinh thái có thể giúp World Forge Studio (WFS) nghiên cứu về trải nghiệm người dùng, mô hình dữ liệu, kiến trúc module, quy trình sáng tạo, quản lý tài nguyên, plugin và cộng đồng creator.

Mục tiêu không phải sao chép một sản phẩm khác hoặc biến mọi tính năng tham khảo thành yêu cầu của WFS. Mỗi nền tảng chỉ là nguồn để đặt câu hỏi, kiểm chứng giả thuyết và rút ra bài học có giới hạn.

### 1.1 Quy tắc bắt buộc

1. **Roadmap WFS là nguồn quyết định phạm vi.** Reference không tự tạo quyền bắt đầu Phase hoặc thêm tính năng.
2. **Tách nghiên cứu khỏi triển khai.** AI có thể nghiên cứu Phase tương lai trong phạm vi được giao, nhưng không tự ý sửa code, schema, roadmap hay tạo commit triển khai nếu chưa được phê duyệt.
3. **Không suy luận từ tên hoặc ảnh chụp.** Phải kiểm tra repository, tài liệu, demo hoặc mã nguồn thực tế trước khi kết luận một chức năng tồn tại.
4. **Không đồng nhất tương đồng sản phẩm với tương đồng kiến trúc.** Cùng có Asset Library không có nghĩa cùng schema, lifecycle hoặc storage model.
5. **Không đồng nhất học ý tưởng với tái sử dụng code.** Mọi hành vi sao chép mã, asset, tài liệu hoặc thiết kế phải qua kiểm tra license và điều kiện attribution.
6. **Ưu tiên hợp đồng của WFS.** Mọi đề xuất phải tương thích với local-first/offline-capable, modular monolith, stable IDs, canonical data, backward compatibility, user ownership và safe extensibility.
7. **Không khóa kiến trúc dài hạn bằng suy đoán.** Phase 8–16+ vẫn là roadmap tương lai; kiến trúc chỉ được chốt sau bằng chứng từ First Usable Build, architecture discovery và vertical slice theo CURRENT_PHASE_CONTEXT.md.
8. **Không dùng reference để biện minh cho scope creep.** Chỉ đề xuất những gì giải quyết nhu cầu, khoảng trống hoặc rủi ro đã xác định.

### 1.2 Phân biệt trạng thái

- **Đã xác minh:** có bằng chứng trực tiếp từ mã nguồn, tài liệu chính thức hoặc demo có thể tái hiện.
- **Quan sát giao diện:** nhìn thấy trong UI/demo; chưa xác nhận kiến trúc bên dưới.
- **Giả thuyết cần kiểm tra:** suy luận ban đầu, chưa có bằng chứng đủ mạnh.
- **Đề xuất cho WFS:** bài học đã được chuyển thành đề xuất, chưa đồng nghĩa được duyệt.
- **Đã phê duyệt:** chủ dự án chấp thuận đưa vào phạm vi/roadmap.
- **Đã triển khai / đã kiểm thử:** chỉ dùng khi có commit và bằng chứng kiểm thử tương ứng.

---

## 2. Thứ tự ưu tiên nghiên cứu theo trạng thái WFS

### 2.1 Trạng thái hiện tại

Theo CURRENT_PHASE_CONTEXT.md, WFS đang ở **First Usable Build — Batch 1 / Phase 4.4**. Phạm vi hiện tại tập trung vào:

- Storage persistence request và xử lý kết quả thực tế.
- Safe IndexedDB writes, lỗi quota và bảo toàn bản lưu hợp lệ trước đó.
- Unknown-field preservation qua load/edit/save/export/import, bao gồm dữ liệu lồng nhau.
- ST-02, ST-03, ST-04 và clean independent browser profile ST-05.
- Không mở rộng tính năng tạo thế giới trong lúc đóng các cổng nghiệm thu.

Các batch đã được định hướng trong context:

| Batch | Phase | Trọng tâm |
|---|---|---|
| 1 | 4.4 | Persistence, safe save, unknown fields, kiểm thử archive/clean profile |
| 2 | 5 preparation | Dependency/import map thực tế; tách một AssetPackApplicationService hẹp |
| 3 | 5 | Persistent Asset Pack Registry/Manager, pinning và ST-10/11 |
| 4 | 6 | Asset Pack Studio, batch import, metadata/license/capabilities, validation và export |
| 5 | 7 | First Usable Build E2E, offline, save/reopen, archive và clean-profile acceptance |

**Quy tắc:** không bắt đầu Phase 5 UI trước khi Batch 1 thoát; không tạo sample Packs trước khi Phase 6 exporter hoạt động; không mở rộng Phase 8–16+ trước khi Phase 7 hoàn tất.

### 2.2 Bản đồ tham khảo theo Phase

| Phase / nhóm | Nền tảng tham khảo | Mục tiêu nghiên cứu | Mức ưu tiên |
|---|---|---|---|
| 4.4 — Persistence & Archive | Test suite và browser workflow của chính WFS | Safe save, quota failure, unknown fields, archive integrity, clean profile | P0 — làm ngay |
| 5 — Asset Pack Management | Godot, Unity; Azgaar chỉ để tham khảo trải nghiệm bản đồ | Import/enable/disable/update, metadata, version compatibility, UX trạng thái | Sau Batch 1 |
| 6 — Asset Pack Studio | Godot, Unity, Unreal, Blender; Shire Map Builder | Batch import, preview, inspector, metadata, license/provenance, validation, export | Sau Phase 5 |
| 7 — First Usable Build QA | Interactive Fantasy Map Wiki, Azgaar, Shire Map Builder | Luồng hoàn chỉnh map + nội dung; usability; E2E test scenarios | Sau Phase 6 |
| 8 — World Data Core | MAPKEEPER, Megacosm Generator | Entity/relationship, IDs, layer, dữ liệu worldbuilding có cấu trúc | Chỉ nghiên cứu sau Phase 7 |
| 9 — Time, History & Event Foundation | Megacosm Generator, Interactive Fantasy Map Wiki | Liên kết location, lore, event; nhu cầu timeline và history UI | Chỉ nghiên cứu sau Phase 7 |
| 10 — World Genesis MVP | Azgaar, mewo2/terrain | Procedural map/terrain, seed, parameters, reproducibility | Tương lai |
| 11 — World Environment | mewo2/terrain, Nortantis, rlguy/FantasyMapGenerator | Terrain, địa hình, biểu diễn môi trường và phong cách bản đồ | Tương lai |
| 12–13 — Life/Ecosystem & Intelligent Life | Megacosm Generator, fantasy-world-generator | Phạm vi dữ liệu civilization, economy, environment và sinh thái | Tương lai |
| 14 — Nations & Story | Scenario Forge, Azgaar | Political map, scenario editing, quan hệ và stable IDs | Tương lai |
| 15 — Free World Mode & Advanced Evolution | Scenario Forge | Kịch bản, branch, so sánh trạng thái và chỉnh sửa nâng cao | Tương lai |
| 16+ — Showcase & Creator Ecosystem | Azgaar, Interactive Fantasy Map Wiki và marketplace/creator platforms | Publication, discovery, creator profiles, moderation, community | Chỉ sau khi nền tảng sẵn sàng |

Các Phase trong bảng là mapping nghiên cứu, không xác nhận Phase đã bắt đầu hoặc kiến trúc đã được chốt.

---

## 3. Worldbuilding, bản đồ và procedural generation

### 3.1 Azgaar — Fantasy Map Generator

- Repository: https://github.com/Azgaar/Fantasy-Map-Generator
- Nên nghiên cứu: trải nghiệm bản đồ web nhiều lớp, tùy chọn tạo bản đồ, dữ liệu hiển thị, thao tác chỉnh sửa và export.
- Phase liên quan: 5, 7, 10, 14, 16+.
- Không được mặc định: schema, asset lifecycle, persistence hoặc mô hình canonical state của Azgaar tương thích với WFS.
- Câu hỏi: người dùng khám phá và chỉnh sửa các lớp bản đồ ra sao? Những trạng thái nào cần lưu? Generator output được phân biệt với dữ liệu người dùng chỉnh sửa thế nào?

### 3.2 Shire Map Builder

- Repository: https://github.com/Kidpech-code/shire-map-builder
- Nên nghiên cứu: thao tác editor, luồng import/export JSON và xuất PNG theo mô tả dự án; cần kiểm chứng trực tiếp trên repository hiện tại.
- Phase liên quan: 6–7.
- Không được mặc định: đây là mẫu cho manifest, license/provenance, validation hoặc .wfpack.
- Câu hỏi: luồng tạo/chỉnh sửa/xuất bản đồ có ít bước và dễ hiểu không? Những thao tác nào nên có undo/redo hoặc preview?

### 3.3 Interactive Fantasy Map Wiki

- Repository: https://github.com/fenrir22/interactive-fantasy-map-wiki
- Nên nghiên cứu: kết hợp bản đồ, marker và nội dung wiki/lore; cách người đọc điều hướng giữa địa điểm và nội dung.
- Phase liên quan: 7, 9, 16+.
- Không được mặc định: có causal event graph, replay state hoặc timeline đa thang thời gian.
- Câu hỏi: người dùng đi từ bản đồ đến hồ sơ địa điểm và bài viết thế nào? Làm sao tránh nội dung bị tách rời khỏi entity ID?

### 3.4 MAPKEEPER

- Repository: https://github.com/plutork/MAPKEEPER
- Nên nghiên cứu: tư duy hex map, layer và cấu trúc dữ liệu worldbuilding; xác minh trực tiếp schema, khả năng mở rộng và trạng thái dự án.
- Phase liên quan: 8.
- Câu hỏi: dữ liệu map/layer/hex được tổ chức ra sao? Ranh giới giữa geometry, annotation và lore ở đâu?

### 3.5 Megacosm Generator

- Repository: https://github.com/CityGenerator/Megacosm-Generator
- Nên nghiên cứu: phạm vi worldbuilding rộng gồm vùng, thành phố, NPC, lore và các loại dữ liệu liên quan; kiểm tra mã nguồn để phân biệt tính năng thực tế với mô tả.
- Phase liên quan: 8, 9, 12–13.
- Câu hỏi: các miền dữ liệu được liên kết ra sao? Có stable IDs, relationship types, temporal validity hoặc dependency model không?

### 3.6 mewo2/terrain

- Repository: https://github.com/mewo2/terrain
- Nên nghiên cứu: ý tưởng và thuật toán procedural terrain; xem xét biểu diễn dữ liệu, seed, tham số và pipeline.
- Phase liên quan: 10–11.
- Câu hỏi: thuật toán nhận input gì, tạo output gì, tính tái lập ra sao và có thể tách generator khỏi canonical world data thế nào?

### 3.7 Nortantis

- Repository: https://github.com/jeheydorn/nortantis
- Nên nghiên cứu: phong cách bản đồ vẽ tay, biểu diễn địa hình, ký hiệu và trình bày bản đồ.
- Phase liên quan: 11.
- Lưu ý: tập trung vào cách trình bày và thuật toán có thể kiểm chứng; không mặc định mô hình môi trường vật lý.

### 3.8 FantasyMapGenerator (rlguy)

- Repository: https://github.com/rlguy/FantasyMapGenerator
- Nên nghiên cứu: quy trình tạo địa hình/bản đồ và các lựa chọn biểu diễn.
- Phase liên quan: 11.
- Câu hỏi: phần nào là thuật toán, phần nào là presentation? Có thể học độc lập mà không kéo theo kiến trúc hoặc dependency không cần thiết không?

### 3.9 fantasy-world-generator

- Repository: https://github.com/kallhoffa/fantasy-world-generator
- Nên nghiên cứu: phạm vi sinh civilization, economy và environment theo mô tả; xác minh từng khía cạnh trong code.
- Phase liên quan: 12–13.
- Lưu ý: không coi output heuristic/procedural là mô hình xã hội hoặc sinh thái đã được xác thực.

### 3.10 Scenario Forge

- Repository: https://github.com/raederhans/scenario-forge
- Nên nghiên cứu: biên tập bản đồ chính trị/kịch bản và workflow chỉnh sửa.
- Phase liên quan: 14–15.
- Câu hỏi: thay đổi lãnh thổ/chính trị được biểu diễn ra sao? Có lịch sử thay đổi, branch hoặc so sánh trạng thái không? Không giả định có merge/branch contract tương đương WFS.

---

## 4. Asset Management và Asset Pack Studio

### 4.1 Mục tiêu nghiên cứu

Asset Pack Studio không phải phần mềm vẽ 2D/3D. Vai trò dự kiến là cầu nối giữa công cụ sáng tạo bên ngoài và Asset System của WFS:

**Import → Organize → Configure → Validate → Preview → Package → Export**

Tập trung vào khả năng để creator không biết lập trình vẫn chuẩn hóa và đóng gói được tài nguyên hợp lệ.

### 4.2 Godot Engine

- Repository: https://github.com/godotengine/godot
- Tài liệu: https://docs.godotengine.org/
- Nên nghiên cứu: filesystem/resource workflow, import settings, asset inspection, resource references và editor plugin/extension boundaries.
- Phase liên quan: 5–6 và kiến trúc extension về sau.
- Câu hỏi: import metadata được lưu và cập nhật thế nào? Thay đổi file nguồn ảnh hưởng resource reference ra sao? UX báo lỗi import như thế nào?

### 4.3 Unity

- Tài liệu: https://docs.unity3d.com/
- Asset Store: https://assetstore.unity.com/
- Nên nghiên cứu: Project/Asset Browser, Inspector, import settings, package/version management, dependencies và marketplace listing.
- Phase liên quan: 5–6, 16+.
- Câu hỏi: người dùng khám phá, lọc, preview và kiểm tra thuộc tính asset thế nào? Package update có ảnh hưởng dependency và project đang dùng không?

### 4.4 Unreal Engine

- Tài liệu: https://dev.epicgames.com/documentation/en-us/unreal-engine
- Nên nghiên cứu: Content Browser, Asset Metadata, asset organization, references và import pipeline.
- Phase liên quan: 6.
- Giới hạn: chỉ lấy các pattern phù hợp với công cụ nhẹ/local-first; không sao chép độ phức tạp của editor 3D chuyên nghiệp.

### 4.5 Blender

- Repository: https://github.com/blender/blender
- Extensions: https://extensions.blender.org/
- Nên nghiên cứu: asset/resource workflow và cách tổ chức, phân phối extension; không xây công cụ modeling trong Asset Pack Studio.
- Phase liên quan: 6 và nghiên cứu Plugin Studio.
- Lưu ý: Blender là ứng dụng sáng tạo nội dung; WFS chỉ cần học workflow trao đổi tài nguyên và extension.

### 4.6 Krita

- Repository: https://github.com/KDE/krita
- Nên nghiên cứu: góc nhìn creator, quy trình chuẩn bị/xuất ảnh, định dạng và metadata liên quan.
- Phase liên quan: 6.
- Giới hạn: không xây layer editor, brush engine hay painting workflow trong WFS.

### 4.7 Hợp đồng Asset Pack của WFS cần đối chiếu

Trước khi lấy ý tưởng hoặc xây chức năng, đối chiếu trực tiếp với source và validator hiện tại:

- Manifest và tên file manifest chính thức của WFS.
- Pack ID, Asset ID, version và compatibility.
- Category, tags, capabilities/usages và default size.
- MIME/type, file signature, image decode và giới hạn dung lượng.
- License, author, attribution và provenance.
- Duplicate detection và asset reference stability.
- Preview và render trong context bản đồ.
- .wfpack import/export và round-trip.
- Snapshot pinning: project đã lưu phải giữ đúng bytes của asset đã sử dụng; Pack update/disable/uninstall không được âm thầm thay đổi project.
- Unknown fields và backward compatibility.

**Không giả định schema của Godot/Unity/Unreal hoặc một dự án bản đồ khác tương thích với .wfpack.** WFS manifest/validator là hợp đồng cần tuân thủ.

### 4.8 Mốc nghiên cứu Asset Pack Studio

| Mốc | Kết quả nghiên cứu cần có |
|---|---|
| Phase 5 | UX quản lý Pack, version, enable/disable/update và trạng thái |
| Phase 6 | Batch import, metadata editor, license/provenance, preview, validation, export |
| Sau exporter | Tạo sample Packs để kiểm thử bằng chính pipeline đã hoàn thiện |

Không tạo sample Packs chính thức trước khi Phase 6 exporter hoạt động và có kiểm thử import/export.

---

## 5. Plugin Ecosystem và Plugin Studio

### 5.1 Định vị

Plugin Studio là môi trường để creator/developer tạo, cấu hình, kiểm thử, đóng gói và phát hành phần mở rộng hành vi của WFS. Nó không phải một IDE tổng quát và không được cho phép code bên thứ ba chạy với quyền của Core.

Nghiên cứu phải phân biệt:

- **Declarative extension:** khai báo command, panel, tool contribution hoặc metadata theo schema được WFS cho phép.
- **Low-code builder:** ghép các hành động/blocks có sẵn, giới hạn trong capability đã công bố.
- **Code-based plugin:** code chạy trong runtime được sandbox và truy cập Core qua API bridge có kiểm soát.

Không mặc định cả ba loại phải được hỗ trợ ngay từ phiên bản đầu.

### 5.2 Visual Studio Code

- Repository: https://github.com/microsoft/vscode
- Tài liệu Extension API: https://code.visualstudio.com/api
- Nên nghiên cứu: extension manifest, activation events, contribution points, API versioning, extension host, debugging, packaging và marketplace.
- Câu hỏi: extension khai báo đóng góp UI/command thế nào? API compatibility được quản lý ra sao? Extension lỗi được cô lập thế nào?
- Giới hạn: VS Code có extension host và mô hình sản phẩm khác WFS; không sao chép nguyên kiến trúc runtime.

### 5.3 Obsidian

- Developer docs: https://docs.obsidian.md/
- Plugin API/sample: https://github.com/obsidianmd/obsidian-sample-plugin
- Community plugins: https://github.com/obsidianmd/obsidian-releases
- Nên nghiên cứu: plugin lifecycle, API bề mặt ứng dụng, cách cộng đồng phân phối plugin, README/versioning và UX bật/tắt.
- Câu hỏi: tác giả bắt đầu một plugin mới thế nào? API nào được public? Người dùng cài đặt, cập nhật và tin cậy plugin ra sao?
- Giới hạn: không lấy việc plugin chạy trong cùng môi trường quyền hạn làm mặc định an toàn cho WFS.

### 5.4 Figma

- Developer platform: https://www.figma.com/developers/
- Plugin samples: https://github.com/figma/plugin-samples
- Nên nghiên cứu: plugin manifest, quyền truy cập, UI/runtime separation, messaging và quy trình review/phân phối.
- Câu hỏi: manifest khai báo quyền gì? Plugin UI giao tiếp với host ra sao? Người dùng được thông báo về quyền và hành vi nào?
- Giới hạn: chỉ dùng làm tham khảo về API/permission UX; không giả định runtime hoặc data model tương đương.

### 5.5 Godot Engine — Editor Plugins

- Repository: https://github.com/godotengine/godot
- Tài liệu: https://docs.godotengine.org/
- Nên nghiên cứu: editor plugin registration, custom tools, inspector integration, lifecycle và version compatibility.
- Câu hỏi: plugin mở rộng editor bằng điểm đăng ký nào? Tách editor extension với runtime game thế nào? Khi plugin bị tắt, dữ liệu project được bảo toàn ra sao?

### 5.6 Blender Extensions

- Repository: https://github.com/blender/blender
- Extensions platform: https://extensions.blender.org/
- Nên nghiên cứu: extension packaging, metadata, version compatibility, review/distribution và quản lý extension.
- Câu hỏi: package có cấu trúc gì? Quy trình cập nhật và gỡ extension ảnh hưởng user data ra sao?

### 5.7 Plugin API/Runtime — các câu hỏi WFS phải tự giải quyết

Reference chỉ cung cấp pattern; WFS phải có contract riêng, tối thiểu cần nghiên cứu:

- Plugin manifest, plugin ID, version, API/contract version.
- Dependency declaration, version range và cycle detection.
- Capability allowlist và permission consent.
- Runtime isolation, API bridge và message validation.
- Lifecycle: install, enable, activate, deactivate, disable, update, uninstall, failed.
- Error boundary, logging, timeout, cancellation và resource limits.
- Không cho phép plugin tự ý truy cập IndexedDB/Core state hoặc file system.
- Network access bị hạn chế mặc định; quyền nhạy cảm phải khai báo và cấp riêng.
- Plugin lỗi không làm sập Core; disable/uninstall không xóa dữ liệu canonical hoặc dữ liệu do plugin chưa hiểu.
- Compatibility, migration, rollback và kiểm thử với project hiện có.
- Signing/review/trust model chỉ được quyết định sau khi có threat model và yêu cầu phân phối rõ ràng.

### 5.8 Thứ tự phát triển Plugin Studio — đề xuất chưa phê duyệt

| Mốc nghiên cứu/thiết kế | Phạm vi |
|---|---|
| PS-0 | Kiểm kê Core API thực tế, xác định use case và threat model |
| PS-1 | Manifest, schema, Registry, Validator và package format |
| PS-2 | Public API, contract versioning và capability model |
| PS-3 | Runtime isolation, API bridge, lifecycle và resource limits |
| PS-4 | Plugin Studio UI, templates, API Explorer và code editor nhẹ |
| PS-5 | Sandbox testing, logs/debugging, dependency và compatibility checks |
| PS-6 | Package import/export, release metadata và publishing workflow |
| PS-7 | Community Plugin Marketplace, review, moderation và update distribution |

Đây là khung nghiên cứu để đánh giá sau First Usable Build, không phải Phase đã được thêm vào roadmap chính thức. Không triển khai Plugin Runtime trước khi Core API và security boundary đủ rõ.

---

## 6. WorldForge SDK và Core API

SDK không phải một Studio độc lập thay thế Core. Đây là lớp hợp đồng và công cụ giúp creator/developer tích hợp với WFS một cách có kiểm soát.

Nghiên cứu từ VS Code, Obsidian, Figma và Godot cần giúp trả lời:

1. Public API nào thực sự cần thiết?
2. API thuộc Core, domain module hay UI contribution?
3. API versioning và deprecation policy ra sao?
4. Plugin đọc/ghi dữ liệu qua application service/contract nào?
5. Làm thế nào để API không để lộ storage implementation?
6. Có mock/test harness và sample plugin không?
7. Làm sao giữ backward compatibility mà không đóng băng kiến trúc quá sớm?

**Nguyên tắc WFS:** public contract phải nhỏ, có tài liệu, có test và có owner. Không công bố API nội bộ chỉ vì tiện cho một plugin cụ thể.

Trước khi có SDK cho bên thứ ba, cần architecture discovery và reference vertical slice theo CURRENT_PHASE_CONTEXT.md. Không khóa API dài hạn dựa trên cấu trúc hiện tại của layout.js hoặc các module chưa ổn định.

---

## 7. Community, Marketplace và Creator Ecosystem

### 7.1 Unity Asset Store

- URL: https://assetstore.unity.com/
- Nghiên cứu: trang sản phẩm, category, search/filter, ratings/reviews, publisher identity, version history, license và support.
- Áp dụng tiềm năng: Asset Pack Marketplace/Showcase.
- Không giả định mô hình thương mại, license hoặc review của Unity phù hợp trực tiếp với WFS.

### 7.2 Godot Asset Library

- URL: https://godotengine.org/asset-library/
- Repository: https://github.com/godotengine/godot
- Nghiên cứu: discovery, project/source linking, version compatibility, asset/plugin categorization và đóng góp cộng đồng.
- Áp dụng tiềm năng: thư viện Asset Pack và Plugin miễn phí/open-source.

### 7.3 VS Code Marketplace

- URL: https://marketplace.visualstudio.com/vscode
- Nghiên cứu: extension listing, publisher identity, compatibility, versioning, install/update, ratings và trust signals.
- Áp dụng tiềm năng: Plugin Marketplace.

### 7.4 Blender Extensions Platform

- URL: https://extensions.blender.org/
- Nghiên cứu: extension listing, metadata, version, license, review/distribution và cách trình bày yêu cầu tương thích.
- Áp dụng tiềm năng: Plugin publishing và creator distribution.

### 7.5 WFS Creator Ecosystem — các vấn đề phải giải quyết trước khi phát hành công khai

- Publication snapshot bất biến và có thể tái lập.
- Quyền riêng tư, quyền chia sẻ và quyền rút nội dung.
- License, attribution, provenance và quyền đối với asset bên thứ ba.
- Moderation, report/appeal và xử lý nội dung độc hại.
- Plugin security review, permission transparency và trust indicators.
- Versioning, update channel, rollback và dependency availability.
- Creator identity, đóng góp, changelog, feedback và support.
- Backup/export và quyền sở hữu dữ liệu của creator.
- Chính sách nội dung, bảo vệ người dùng và quy trình xử lý vi phạm.

Marketplace không phải điều kiện để hoàn thiện First Usable Build. Không bắt đầu public distribution trước khi publication, license, security và moderation policy được thiết kế đủ rõ.

---

## 8. Quy trình nghiên cứu chuẩn cho AI agents

Mỗi nhiệm vụ nghiên cứu một reference phải thực hiện các bước sau.

### Bước 1 — Product Analysis

- Xác định đối tượng người dùng và vấn đề sản phẩm giải quyết.
- Quan sát workflow chính, navigation, empty/error/loading states.
- Ghi nhận các thao tác phổ biến và điểm ma sát.
- Phân biệt tính năng đã quan sát với tính năng chỉ được mô tả.

### Bước 2 — Source & Architecture Analysis

Khi repository truy cập được:

- Xác định ngôn ngữ, framework, entry points và module boundaries.
- Đọc manifest/config/schema và public API.
- Truy vết data flow, persistence, import/export và lifecycle.
- Kiểm tra test suite, CI và release history.
- Ghi lại commit/tag hoặc revision đã đọc để kết quả có thể tái lập.
- Nếu không đọc được code, phải ghi rõ là product/UI research; không suy luận kiến trúc.

### Bước 3 — License & Provenance Review

- Kiểm tra file LICENSE ở revision đang nghiên cứu.
- Đọc điều khoản cho code, asset, font, icon, tài liệu và thương hiệu riêng biệt.
- Ghi license identifier, URL, revision và ngày kiểm tra.
- Nếu không tìm thấy license hoặc phạm vi quyền không rõ, ghi **Unknown / Not verified**; chỉ dùng để tham khảo ý tưởng, không sao chép code/assets.
- Không kết luận “open source” chỉ dựa vào việc repository công khai.
- Khi cần tái sử dụng, chuyển sang quy trình review license riêng trước khi copy hoặc phân phối.

### Bước 4 — Gap Analysis

So sánh với WFS theo các chiều:

- Product fit và user workflow.
- Data ownership, stable IDs và relationship model.
- API/contract và module boundaries.
- Persistence, archive và offline behavior.
- Compatibility, migration và backward compatibility.
- Performance, lifecycle và resource cleanup.
- Security, permissions và trust.
- Accessibility, usability và maintenance cost.

### Bước 5 — Adaptation Proposal

Mỗi đề xuất phải nêu:

- Vấn đề WFS cần giải quyết và bằng chứng.
- Reference pattern quan sát được.
- Điều gì nên học.
- Điều gì không nên sao chép và vì sao.
- Phạm vi code/docs dự kiến bị ảnh hưởng.
- Dependencies, rủi ro và chi phí bảo trì.
- Tiêu chí nghiệm thu có thể kiểm chứng.
- Phase/batch phù hợp.
- Trạng thái: idea, proposed, approved, deferred hoặc rejected.

### Bước 6 — Báo cáo và bàn giao

Mẫu báo cáo tối thiểu:

| Trường | Nội dung |
|---|---|
| Reference | Tên và URL |
| Revision checked | Commit/tag hoặc ngày truy cập |
| Research scope | Product/UI, source, tests, license |
| Verified findings | Phát hiện có bằng chứng |
| Unverified assumptions | Những điều chưa xác minh |
| Reusable patterns | Pattern có thể học |
| WFS gap | Khoảng trống cụ thể |
| Proposal | Đề xuất có giới hạn |
| Risks/dependencies | Rủi ro và phụ thuộc |
| License status | License, phạm vi, ngày kiểm tra |
| Recommendation | Adopt / Adapt / Defer / Reject |
| Approval | Chưa duyệt / Đã duyệt bởi chủ dự án |

Không cập nhật roadmap hoặc code chỉ từ báo cáo nghiên cứu. Cần chủ dự án phê duyệt riêng.

---

## 9. Tiêu chí chọn và xếp hạng reference

Có thể chấm điểm tham khảo để quyết định thứ tự đọc sâu; điểm số không phải đánh giá chất lượng tuyệt đối của dự án.

| Tiêu chí | Trọng số gợi ý |
|---|---:|
| Mức liên quan trực tiếp đến Phase/use case | 30% |
| Có thể kiểm chứng bằng source/docs/demo | 20% |
| Chất lượng và độ rõ của API/schema/test | 15% |
| Khả năng chuyển giao pattern sang WFS | 15% |
| Tình trạng hoạt động và khả năng bảo trì | 10% |
| License/provenance rõ ràng | 10% |

Nếu license chưa rõ, không nhất thiết loại bỏ reference khỏi nghiên cứu sản phẩm, nhưng phải chặn việc tái sử dụng mã/tài sản cho đến khi xác minh.

Ngôn ngữ/framework không phải tiêu chí loại trừ tuyệt đối. Có thể học thuật toán hoặc mô hình dữ liệu từ Java/C++/Rust, nhưng khi chọn implementation pattern cần ưu tiên khả năng tích hợp, dependency, license và môi trường JavaScript/TypeScript hiện tại của WFS.

---

## 10. Danh sách ưu tiên nghiên cứu

### Ngay bây giờ — không mở rộng scope triển khai

1. Hoàn tất Phase 4.4 và lấy bằng chứng ST-02/03/04/05.
2. Chỉ nghiên cứu reference nếu nó giúp giải quyết một blocker hiện tại; ưu tiên test và browser workflow của chính WFS.
3. Không bắt đầu Asset Pack Studio, Plugin Studio hoặc Marketplace trước batch tương ứng.

### Khi thực hiện Batch 2–3 / Phase 5

1. Nghiên cứu Godot/Unity resource workflow và package lifecycle.
2. Đối chiếu các thao tác Asset Pack với Registry, Loader, snapshot pinning và compatibility của WFS.
3. Không mở rộng UI ngoài phạm vi Phase 5 đã duyệt.

### Khi thực hiện Batch 4 / Phase 6

1. Nghiên cứu Asset Browser/Inspector và import pipeline của Godot, Unity, Unreal.
2. Nghiên cứu creator workflow của Krita/Blender ở góc độ xuất tài nguyên.
3. Thiết kế batch import, metadata/license/provenance, preview, validation và .wfpack export theo hợp đồng WFS.

### Sau First Usable Build / Phase 7

1. Đọc sâu MAPKEEPER, Megacosm và các dự án worldbuilding có cấu trúc.
2. Nghiên cứu VS Code, Obsidian, Figma, Godot và Blender cho Plugin API/runtime.
3. Xác định WorldForge SDK và public Core API dựa trên architecture discovery + reference vertical slice.
4. Chỉ sau đó mới đề xuất Plugin Studio roadmap chính thức.

### Giai đoạn dài hạn

1. Nghiên cứu procedural terrain/environment và simulation theo từng domain.
2. Nghiên cứu marketplace, showcase và creator community.
3. Chỉ mở public distribution khi publication snapshot, privacy, license, security và moderation đã có chính sách và kiểm thử.

---

## 11. Danh mục nguồn tham khảo nhanh

### Worldbuilding / Maps

- Azgaar: https://github.com/Azgaar/Fantasy-Map-Generator
- Shire Map Builder: https://github.com/Kidpech-code/shire-map-builder
- Interactive Fantasy Map Wiki: https://github.com/fenrir22/interactive-fantasy-map-wiki
- MAPKEEPER: https://github.com/plutork/MAPKEEPER
- Megacosm Generator: https://github.com/CityGenerator/Megacosm-Generator
- mewo2/terrain: https://github.com/mewo2/terrain
- Nortantis: https://github.com/jeheydorn/nortantis
- FantasyMapGenerator: https://github.com/rlguy/FantasyMapGenerator
- fantasy-world-generator: https://github.com/kallhoffa/fantasy-world-generator
- Scenario Forge: https://github.com/raederhans/scenario-forge

### Asset Creation / Management

- Godot: https://github.com/godotengine/godot
- Godot docs: https://docs.godotengine.org/
- Unity docs: https://docs.unity3d.com/
- Unity Asset Store: https://assetstore.unity.com/
- Unreal Engine docs: https://dev.epicgames.com/documentation/en-us/unreal-engine
- Blender: https://github.com/blender/blender
- Blender Extensions: https://extensions.blender.org/
- Krita: https://github.com/KDE/krita

### Plugin / Developer Ecosystem

- VS Code: https://github.com/microsoft/vscode
- VS Code Extension API: https://code.visualstudio.com/api
- Obsidian Developer Docs: https://docs.obsidian.md/
- Obsidian Sample Plugin: https://github.com/obsidianmd/obsidian-sample-plugin
- Obsidian Community Plugins: https://github.com/obsidianmd/obsidian-releases
- Figma Developer Platform: https://www.figma.com/developers/
- Figma Plugin Samples: https://github.com/figma/plugin-samples
- Godot: https://github.com/godotengine/godot
- Blender Extensions: https://extensions.blender.org/

### Marketplace / Community

- Unity Asset Store: https://assetstore.unity.com/
- Godot Asset Library: https://godotengine.org/asset-library/
- VS Code Marketplace: https://marketplace.visualstudio.com/vscode
- Blender Extensions: https://extensions.blender.org/

### GitHub repository discovery

- Procedural fantasy map generator search: https://github.com/search/repositories?q=procedural+fantasy+map+generator&sort=stars&order=desc

**Lưu ý:** Danh sách nguồn là điểm bắt đầu nghiên cứu, không phải chứng nhận repository còn hoạt động, chất lượng, bảo mật hoặc license. Tình trạng phải được kiểm tra tại revision cụ thể trước mỗi lần nghiên cứu/tái sử dụng.

---

## 12. Quy tắc cập nhật tài liệu

- Chỉ thêm reference khi có use case/Phase cụ thể hoặc khoảng trống nghiên cứu đã xác định.
- Ghi ngày kiểm tra và revision cho kết quả nghiên cứu sâu.
- Không xóa reference chỉ vì ít phổ biến; ghi rõ lý do defer/reject.
- Khi một reference đổi license, archived hoặc không còn truy cập được, cập nhật trạng thái.
- Không biến danh sách tham khảo thành backlog tính năng.
- Khi đề xuất ảnh hưởng đến roadmap, phải cập nhật tài liệu master/context bằng một thay đổi riêng sau khi được chủ dự án phê duyệt.
- Giữ tài liệu này là bản đồ tham khảo; WORLD_FORGE_STUDIO_MASTER.md vẫn là nguồn chuẩn về sản phẩm/kiến trúc và CURRENT_PHASE_CONTEXT.md vẫn là nguồn chuẩn về thứ tự công việc đang thực hiện.

---

## 13. Trạng thái phê duyệt

| Hạng mục | Trạng thái |
|---|---|
| Reference framework và phân nhóm | Đề xuất nghiên cứu |
| Danh sách dự án worldbuilding/map | Nguồn tham khảo ban đầu |
| Asset ecosystem references | Đề xuất nghiên cứu |
| Plugin ecosystem references | Đề xuất nghiên cứu |
| SDK/Core API research | Chưa bắt đầu triển khai |
| Marketplace/Creator ecosystem | Định hướng dài hạn |
| Thay đổi roadmap chính thức | Không được tự động phê duyệt bởi tài liệu này |
| Phase 8–16+ architecture freeze | Chưa được xác nhận |

**Kết luận:** Tài liệu này giúp các AI và contributor nghiên cứu có hệ thống, truy vết được bằng chứng và đưa ra đề xuất có giới hạn. Nó không thay thế roadmap, không xác nhận tính năng đã triển khai và không cho phép mở rộng scope trước khi các cổng First Usable Build được nghiệm thu.
