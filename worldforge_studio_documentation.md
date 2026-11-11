# WORLDFORGE STUDIO - TÀI LIỆU DỰ ÁN TỔNG HỢP
**Phiên bản tài liệu:** 1.0
**Loại sản phẩm:** World Building & Fantasy Map Creation Software
**Nền tảng:** Web Application → Desktop Application (Electron)
**Định hướng:** Offline-first, Modular Architecture

---

## PHẦN 1. TỔNG QUAN DỰ ÁN VÀ MỤC TIÊU (PRODUCT OVERVIEW)

WorldForge Studio là phần mềm hỗ trợ xây dựng thế giới (World Building), kết hợp giữa công cụ thiết kế bản đồ địa lý và hệ thống quản lý dữ liệu thế giới giả tưởng. Phần mềm giúp nhà văn, người làm nội dung sáng tạo tạo ra một hệ thống dữ liệu có tính liên kết chặt chẽ (ví dụ: tạo một quốc gia trên bản đồ sẽ đồng thời tạo một thực thể dữ liệu có thể quản lý lịch sử, dân số, văn hóa...).

### Mục tiêu cốt lõi:
1. **Thiết kế bản đồ:** Đa phong cách (Medieval, Modern, Political).
2. **Xây dựng thế giới:** Quản lý địa lý, chính trị, văn hóa, lịch sử.
3. **Liên kết dữ liệu:** Kết nối chặt chẽ giữa đối tượng đồ họa và thực thể cơ sở dữ liệu.
4. **Quản lý dự án:** Hỗ trợ nhiều thế giới, nhiều bản đồ.
5. **Khả năng mở rộng:** Kiến trúc module hóa, không đập bỏ khi nâng cấp.

---

## PHẦN 2. KIẾN TRÚC KỸ THUẬT (TECHNICAL DESIGN DOCUMENT)

### 2.1. Ngăn xếp Công nghệ (Technology Stack)
*   **Frontend & Giao diện:** HTML5, Tailwind CSS (giao diện, Dark Theme), Vanilla JavaScript (ES Modules).
*   **Rendering & Đồ họa:** Canvas API (giới hạn tối đa 8192x8192px), SVG (icons, vectors).
*   **Lưu trữ (Storage):** IndexedDB (cục bộ), JSON (nhập/xuất dữ liệu).
*   **Đóng gói (Desktop):** Electron (Windows 10/11).

### 2.2. Nguyên tắc Thiết kế Kiến trúc
*   **Modular Architecture:** Phân tách rõ ràng giữa UI Layer, Business Logic Layer, và Data/Storage Layer.
*   **Tách biệt Dữ liệu và Hiển thị:** Dữ liệu địa lý (tọa độ, logic) tách biệt với Dữ liệu hiển thị (pixel, màu sắc).
*   **Định danh Thực thể:** Mọi đối tượng có UUID riêng, giao tiếp và liên kết qua UUID.
*   **Liên kết có kiểm soát:** Map object và bản ghi địa lý liên kết bằng ID. Xóa map marker chỉ gỡ liên kết và giữ nguyên hồ sơ; xóa một thực thể cha đang có dữ liệu con bị từ chối để tránh mất dữ liệu.

### 2.3. Cấu trúc Thư mục (Folder Structure)
```text
worldforge-studio/
├── index.html                 # Entry point, layout chính (HTML5).
├── tailwind.config.js         # Cấu hình Tailwind CSS.
├── package.json               # Quản lý thư viện (chuẩn bị cho Electron).
├── assets/                    # Hình ảnh, SVG, fonts.
└── src/
    ├── app.js                 # Entry script khởi tạo ứng dụng.
    ├── ui/                    # [Presentation Layer] Quản lý giao diện, sự kiện DOM.
    │   ├── layout.js          
    │   └── components/        
    ├── engine/                # [Rendering Engine] Lõi xử lý Canvas.
    │   ├── MapRenderer.js     # Quản lý Canvas context (8192x8192).
    │   ├── Camera.js          # Hệ thống Viewport, Zoom, Pan.
    │   ├── LayerManager.js    # Quản lý Z-index, ẩn/hiện lớp bản đồ.
    │   └── tools/             # BrushTool, SelectTool, LandmassTool...
    ├── core/                  # [Business Logic] Lõi xử lý nghiệp vụ.
    │   ├── StateManager.js    # Logic Undo/Redo (Command Pattern).
    │   ├── SyncManager.js     # Đồng bộ dữ liệu Canvas và IndexedDB.
    │   └── ExportEngine.js    # Xuất file (PNG, SVG, JSON).
    ├── data/                  # [Data Access Layer] 
    │   ├── db.js              # Cấu hình IndexedDB Schema.
    │   └── repositories/      # Các file CRUD (WorldRepo, CityRepo...).
    └── utils/                 # Các hàm tiện ích (Toán học, tạo UUID...).
```

### 2.4. Lược đồ Cơ sở Dữ liệu (IndexedDB Schema)
*   **projects:** `id` (PK), thông tin dự án.
*   **maps:** `id` (PK), `worldId` (FK), cấu hình bản đồ, style.
*   **map_objects:** `id` (PK), `mapId` (FK), `entityId` (FK), lưu tọa độ (x, y), hình học. Cầu nối bản đồ - thực thể.
*   **worlds, continents, countries, cities, locations:** Quản lý thực thể địa lý/hành chính.
*   **characters, events, relationships:** Quản lý thực thể văn hóa, lịch sử, nhân vật.

### 2.5. Project Manager
Project Manager lưu dự án và danh sách dự án gần đây trong IndexedDB (database `worldforge-studio`; object stores `projects` và `recentProjects`). Mỗi dự án có `id`, `name`, `description`, `coverImage`, `createdAt`, `updatedAt`, `schemaVersion` và `data`. Module nằm tại `src/data/database-manager.js`, `src/services/project-service.js` và `src/ui/layout.js`.

Các thao tác hỗ trợ: tạo, mở, đổi tên/chỉnh sửa thông tin, sao chép, xóa có xác nhận, lưu và xem thông tin. Schema dự án hiện tại là phiên bản 2; `ProjectService` nâng dự án schema 1 bằng migration, bổ sung dữ liệu lịch sử mặc định nhưng giữ nguyên dữ liệu lịch tùy chỉnh. Mở, lưu, đổi tên, nhân bản và nhập đều kiểm tra dữ liệu bản đồ, các cơ sở dữ liệu địa lý/văn minh/lịch sử và các liên kết trước khi ghi.

Dự án có thể xuất thành JSON hoặc gói `.wforge`. Gói `.wforge` là ZIP STORE UTF-8 gồm `manifest.json`, `project.json` và các ảnh ở `assets/`; có kiểm tra CRC, đường dẫn và giới hạn 100 MB khi đọc/ghi. Nhập JSON hoặc `.wforge` luôn xác thực trước khi ghi; nếu ID đã tồn tại, hệ thống tạo dự án mới với ID khác thay vì ghi đè. Có thể dùng `.wforge` làm bản sao lưu và khôi phục bằng cách nhập lại. Trình duyệt phải được chạy qua HTTP(S) để ES modules và IndexedDB hoạt động nhất quán.

Map Export hỗ trợ PNG, JPG, SVG vector và PDF một trang; người dùng chọn kích thước đầu ra, 96/150/300 DPI, phong cách, layer, nền trong suốt (PNG/SVG) và chú thích. Bản đồ giữ nguyên tỷ lệ; PNG/JPG/PDF giới hạn ở 32 megapixel để tránh cấp phát bộ nhớ quá lớn. PDF và JPG luôn có nền opaque.

### 2.6. Map Canvas Engine
Canvas Engine ở `src/engine/` tách world coordinates khỏi screen coordinates bằng `ViewportTransform`; zoom neo theo vị trí con trỏ, pan và đổi kích thước viewport chỉ cập nhật camera/backing resolution, không sửa map objects. Engine dùng `requestAnimationFrame`, `ResizeObserver` và device-pixel ratio để gộp render, phản hồi thay đổi kích thước và giữ nét trên màn hình HiDPI.

Map được lưu trong `project.data.map` với kích thước từ 256 đến 8192 world units, danh sách layers, groups và objects. Layer có ID riêng, tên, thứ tự vẽ, trạng thái hiển thị/khóa, opacity, group và renderer; object được lưu trực tiếp trong layer sở hữu. Bản đồ mới tạo gồm 13 layer mặc định: Background, Ocean, Landmass, Elevation, Mountains, Forests, Rivers, Lakes, Borders, Cities, Locations, Text và Decorations. Layer Manager hỗ trợ tạo, đổi tên, xóa, ẩn/hiện, khóa/mở khóa, chỉnh opacity, di chuyển thứ tự, nhóm/bỏ nhóm và chọn active layer. Xóa group sẽ bỏ nhóm các layer nhưng không xóa chúng. Thay đổi nội dung và thứ tự layer hỗ trợ Undo/Redo; cấu hình được lưu trong dữ liệu map của dự án. Layer Background vẽ nền bản đồ và cũng tuân theo hiển thị, opacity và thứ tự render.

Các công cụ độc lập ở `src/engine/tools/`: Select (V), Brush (B), Eraser (E), Landmass (L), Terrain (T), River (R), Lake (A), Border (D), Text (X), Icon (I). Công cụ vùng Landmass/Terrain tạo đa giác bằng click nhiều điểm, sau đó nhấn Enter hoặc double-click để hoàn tất; các công cụ vẽ đường/hồ dùng thao tác kéo chuột. Thuộc tính màu, kích thước, loại địa hình, biểu tượng và nội dung nhãn cấu hình trên thanh công cụ. Select hỗ trợ kéo đối tượng; Properties cho phép sửa màu, cỡ và nội dung văn bản, đồng thời xóa đối tượng. Undo/Redo (Ctrl+Z, Ctrl+Y hoặc Ctrl+Shift+Z) dùng snapshot history tối đa 100 thao tác; các thay đổi layer và kích thước bản đồ cũng nằm trong lịch sử. Chỉnh sửa bản đồ đánh dấu dự án chưa lưu; bấm Lưu hoặc Ctrl+S để ghi vào IndexedDB.

Zoom bằng wheel, `+`/`-`; pan bằng Space + kéo hoặc nút giữa; `F` fit-to-screen, `0` reset view, `Escape` hủy thao tác đang vẽ/bỏ chọn. Đổi kích thước bản đồ giữ nguyên tọa độ đối tượng và cần lưu dự án để ghi vào IndexedDB.

### 2.7. Geography Database
Geography Database được cài đặt trong `src/services/geography-service.js` và giao diện trong `src/ui/layout.js`. Năm loại bản ghi (`worlds`, `continents`, `countries`, `cities`, `locations`) được lưu cùng dự án tại `project.data.geography`; thao tác Lưu/Ctrl+S ghi chúng vào IndexedDB thông qua Project Service. Mỗi bản ghi có ID duy nhất, tên, mô tả, ngày tạo/cập nhật, tọa độ world tùy chọn và ID map object tùy chọn.

Quan hệ bắt buộc dùng ID: Continent → World, Country → Continent, City/Settlement → Country, Location → City. Mỗi Country có tối đa một capital; khi Country có City/Settlement thì phải có đúng một capital thuộc Country đó. Khi xóa capital, một settlement còn lại được tự động thăng thành capital; xóa bản ghi cha khi còn dữ liệu con khác bị từ chối. Search lọc theo tên/mô tả, filter theo parent, và detail view hiển thị quan hệ cùng các bản ghi con liên quan. Location nhận danh sách `eventIds`, được đồng bộ với sự kiện qua History Manager.

Khi lưu bản ghi có tọa độ, UI tạo map marker vector trên layer phù hợp và lưu `mapObjectId`; có thể liên kết thủ công bản ghi với object đang chọn. Chọn hồ sơ có tọa độ cho phép điều hướng/selection đến vị trí; chọn marker đã liên kết hiển thị nút mở hồ sơ. Di chuyển marker cập nhật world coordinates. Xóa marker trên Canvas chỉ gỡ `mapObjectId`, giữ hồ sơ và tọa độ; xóa hồ sơ được xác nhận và xóa marker liên kết, trong khi layer đang khóa hoặc bản ghi còn dữ liệu con ngăn thao tác. Những thay đổi Geography được đánh dấu chưa lưu và cần Lưu/Ctrl+S.

### 2.8. Civilization Database
`src/services/civilization-service.js` quản lý Characters, Races, Cultures, Religions và Organizations; hồ sơ nằm trong `project.data.civilization` và được lưu cùng dự án qua Project Service/IndexedDB. Mỗi module có danh sách, chi tiết, tạo/sửa/xóa, tìm kiếm theo tên/mô tả/trường mở rộng, lọc theo quan hệ và ảnh minh họa (URL hoặc tệp ảnh).

Các quan hệ dùng ID: Character có thể liên kết Country, City, Organization, Character, Race, Culture và Religion; Race liên kết các vùng địa lý; Culture/Religion liên kết Country; Organization liên kết Country/City. Service kiểm tra tham chiếu và ID duy nhất trong dự án, ngăn xóa hồ sơ đang được tham chiếu và ngăn tự liên kết Character. Các trường mở rộng là JSON object do người dùng tự định nghĩa; các liên kết cho phép chọn hồ sơ có sẵn hoặc nhập ID của hồ sơ khác trong dự án. Mô tả chi tiết và ảnh được lưu cùng hồ sơ; thay đổi đánh dấu dự án chưa lưu và cần Lưu/Ctrl+S.

### 2.9. History, Timeline & Event Manager
`src/services/history-service.js` quản lý `calendars`, `eras`, `periods`, `records` và `events` trong `project.data.history`. Mọi loại có CRUD, tìm kiếm, ID duy nhất trong dự án, timestamps và kiểm tra quan hệ. Period có thể thuộc Era; Historical Record và Event có thể thuộc Era/Period. Xóa lịch/era/period/record/event đang được tham chiếu sẽ bị từ chối; sự kiện được liên kết với `Location.eventIds`.

Event có tên/ID, Start/End Date, Location ID, mô tả, causes, consequences và các nhóm liên kết ID tới Country, Character, Organization, Race, Religion, Event và Historical Record. Chi tiết sự kiện cung cấp liên kết mở hồ sơ liên quan, điều hướng đến tọa độ của Location trên bản đồ, và lọc các sự kiện cùng Period hoặc có khoảng thời gian giao nhau.

Ngày được lưu nguyên dạng `{ calendarId, year, month?, day?, precision }`; precision gồm day, month, year, decade và century. Lịch tùy chỉnh có tên và danh sách tháng tùy chọn (mỗi tháng có thể khai báo số ngày). Không dùng `Date`, epoch hay quy đổi Gregorian cho thời điểm lịch sử. Sắp xếp chỉ so sánh ngày trong cùng calendar; timeline nhóm/sắp xếp các calendar độc lập, giữ nguyên year/month/day người dùng nhập. Thay đổi lịch sử được lưu cùng dự án qua Project Service/IndexedDB bằng Lưu/Ctrl+S.

---

## PHẦN 3. HỆ THỐNG THIẾT KẾ UI/UX (DESIGN SYSTEM)

### 3.1. Phong cách và Màu sắc (Dark Theme Mặc định)
*   **Background (Nền chính):** `#121212` (Vùng Canvas).
*   **Surface (Panel, Sidebar):** `#1E1E1E`.
*   **Border/Divider:** `#333333`.
*   **Primary Accent (Nhấn):** `#3B82F6` (Xanh dương).
*   **Text:** `#E5E5E5` (Chính), `#A3A3A3` (Phụ/Ghi chú).
*   **Typography:** Inter (hoặc sans-serif), Base size: 14px.

### 3.2. Đặc tả Bố cục (Layout Specifications)
Sử dụng Flexbox/Grid khép kín (overflow-hidden, không cuộn toàn trang). Màn hình chia 5 khu vực:
1.  **Top Navigation (Header):** Cao 48px. File menu, công cụ lưu/xuất.
2.  **Left Sidebar (Toolbox):** Rộng 64px. Chứa công cụ vẽ (Select, Brush, Landmass...) và gọi Database.
3.  **Right Panel (Properties/Layers):** Rộng ~300px. Hiển thị thuộc tính thực thể đang chọn hoặc quản lý Layer.
4.  **Bottom Panel (Console/Timeline):** Có thể thu gọn. Chứa lịch sử thao tác, console báo lỗi.
5.  **Central Workspace (Canvas):** Chiếm toàn bộ không gian còn lại (`flex-1`), hỗ trợ Zoom/Pan.

---

## PHẦN 4. LỘ TRÌNH PHÁT TRIỂN (DEVELOPMENT ROADMAP)

Dự án được chia thành 7 giai đoạn (Phases) nhằm đảm bảo hệ thống luôn có thể chạy được (Runnable) sau mỗi bước:

*   **Giai đoạn 1 – Foundation:** Xây dựng khung giao diện HTML/Tailwind, thiết lập cấu trúc thư mục, khởi tạo IndexedDB và chức năng quản lý dự án (Tạo/Mở Project).
*   **Giai đoạn 2 – Map Editor Core:** Khởi tạo Canvas (tối đa 8192x8192). Lập trình Camera (Zoom/Pan), LayerManager và các công cụ vẽ cơ bản (Select, Brush, Text). Tích hợp Undo/Redo (StateManager).
*   **Giai đoạn 3 – Map Styling & Layer:** Hoàn thiện 3 phong cách (Medieval, Modern, Political). Thêm Texture, Typography và thư viện biểu tượng.
*   **Giai đoạn 4 – World Database & Binding (Quan trọng):** Xây dựng form quản lý World, Continent, Country, City, Location. Hoàn thiện thuật toán liên kết Map Object (Kéo thả/click trên bản đồ sinh ra dữ liệu trong DB).
*   **Giai đoạn 5 – Civilization & History:** Mở rộng DB quản lý Character, Race, Culture, Religion, History, Timeline, Relationship.
*   **Giai đoạn 6 – Export & Optimization:** Lập trình ExportEngine (PNG, PDF, SVG, JSON). Tính năng Backup/Restore. Tối ưu bộ nhớ.
*   **Giai đoạn 7 – Desktop Application:** Tích hợp Electron, viết `main.js`, cấu hình tạo file cài đặt `.exe` cho Windows. 

---

## PHẦN 5. QUY TRÌNH & NGUYÊN TẮC LÀM VIỆC (WORKING PRINCIPLES)
1. Không triển khai toàn bộ phần mềm trong một lần; làm từng module.
2. Không viết chức năng giả để minh họa (trừ quá trình prototype ban đầu).
3. Đảm bảo kiểm tra lỗi (Error Handling) và kiểm thử đầu vào cho mọi module.
4. Các nút bấm giao diện phải có logic xử lý thực tế đính kèm.
5. Khi thiếu thông tin hoặc gặp rủi ro kiến trúc (như tràn RAM, logic xóa liên kết), phải xác nhận với Lead/Product Owner trước khi code.