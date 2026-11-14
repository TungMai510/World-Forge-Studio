# World Forge Studio — AI Workflow & Model Responsibilities

> **Mục đích:** Quy định cách phân công công việc giữa các mô hình AI và công cụ hỗ trợ phát triển World Forge Studio, tránh trùng lặp, tiêu hao hạn mức không cần thiết và làm lệch định hướng sản phẩm.
>
> **Trạng thái:** Quy ước vận hành hiện tại — có thể điều chỉnh sau khi đánh giá hiệu quả thực tế.
>
> **Phạm vi:** Áp dụng cho thiết kế sản phẩm, phát triển code, UI/UX, kiểm thử, tài liệu và chuẩn bị Asset Pack Library.

---

## 1. Nguyên tắc vận hành

1. **Một nguồn định hướng:** Chủ dự án quyết định; ChatGPT hỗ trợ phân tích, đề xuất và chuyển quyết định thành specification.
2. **Một AI triển khai chính cho mỗi task:** Không để nhiều agent cùng sửa một nhóm file hoặc cùng triển khai một tính năng.
3. **Review độc lập, không tạo thêm luồng phát triển:** Model phụ chỉ đánh giá, tìm thiếu sót hoặc xử lý task độc lập khi được giao.
4. **Specification là căn cứ triển khai:** Không tự mở rộng phạm vi, thay đổi kiến trúc hoặc thêm tính năng ngoài yêu cầu đã thống nhất.
5. **Kiểm thử trước khi nghiệm thu:** Kết quả do AI báo cáo không thay thế kết quả test thực tế.
6. **Tài liệu dự án là nguồn sự thật:** Các quyết định sản phẩm và roadmap chính thức phải được phản ánh trong `WORLD_FORGE_STUDIO_MASTER.md`. File này chỉ quy định cách phối hợp AI, không thay thế master document.
7. **Tiết kiệm credit:** Dùng model có năng lực vừa đủ cho task; không gọi nhiều model chỉ để nhận các câu trả lời tương tự.
8. **Bảo vệ dữ liệu và lịch sử:** Không xóa dữ liệu người dùng, IndexedDB, asset hoặc project thật khi kiểm thử nếu chưa có bản sao/profile độc lập và sự cho phép rõ ràng.

## 2. Bản đồ phân công AI hiện tại

Các vai trò dưới đây là cách phân công vận hành ban đầu, **không phải bảng xếp hạng năng lực model**. Hiệu quả từng model cần được đánh giá bằng task thực tế. Tên model, hạn mức và quyền lợi có thể thay đổi theo tài khoản hoặc chính sách nhà cung cấp.

| Công cụ / model | Vai trò | Nhiệm vụ chính | Không giao / giới hạn |
|---|---|---|---|
| **ChatGPT (GPT-6 Free Trial)** | Product Architect, Specification & QA Reviewer | Phân tích định hướng; đánh giá sản phẩm và UX; viết specification; đề xuất roadmap; xác định acceptance criteria; review kết quả triển khai; phân tích lỗi và đề xuất kiểm thử; chuẩn bị prompt tạo hình ảnh và tiêu chuẩn Asset Pack | Không tự ý quyết định thay chủ dự án; không mặc định kết quả chưa chạy test là đã đạt; không triển khai song song với coding agent trên cùng task |
| **Codex — Luna 6** | Primary Complex Coding Agent | Ưu tiên xử lý task code nhiều file, module phức tạp, lỗi khó, refactor có phạm vi và triển khai theo specification | Không tự thiết kế lại kiến trúc hoặc mở rộng scope; phải nêu file thay đổi, test đã chạy và giới hạn còn lại |
| **Codex — Terra 5.6** | Secondary Agent & Independent Code Reviewer | Review phương án/code; tìm lỗi logic; đề xuất giải pháp thay thế; thực hiện task độc lập không trùng file với agent chính | Không cùng sửa một task với Luna 6 nếu chưa chia ranh giới file/module rõ ràng |
| **Codex — Luna 5.6** | Routine Coding Agent | Component nhỏ, chỉnh UI/CSS, sửa lỗi cục bộ, cập nhật tài liệu kỹ thuật và task có phạm vi hẹp | Không giao refactor lớn hoặc thay đổi schema lõi nếu chưa có specification và review |
| **GitHub Copilot Free** | IDE Assistant & Current Implementation Tool | Hỗ trợ code trực tiếp trong VS Code; sửa lỗi; thao tác terminal; chạy automated tests; hỗ trợ kiểm tra nhanh | Hạn mức hiện đã sử dụng khoảng **62% credit tháng** theo ghi nhận của chủ dự án; ưu tiên task thực sự cần thao tác trong IDE, tránh dùng cho thảo luận dài hoặc việc có thể làm bằng model khác |
| **GitHub Copilot Student/Pro (dự kiến sau khi Student Pack được kích hoạt)** | Main IDE Agent / Development Workflow | Khi quyền lợi được xác nhận: ưu tiên coding agent, thao tác nhiều file, terminal, test, sửa lỗi và triển khai các task theo specification | Chỉ chuyển vai trò sau khi tài khoản thực sự được cấp quyền; không giả định mọi tính năng hoặc hạn mức Pro đã được kích hoạt |
| **Gemini Free Trial** | Secondary Reviewer & Image Generation Option | Đọc/đánh giá tài liệu; review độc lập; đề xuất phương án; thử tạo hình ảnh và biến thể asset khi kết quả phù hợp | Chủ dự án đánh giá công cụ này hiện dễ lỗi và chất lượng code chưa ổn định; không giao triển khai code quan trọng hoặc làm nguồn quyết định duy nhất |
| **Google AI Plus (trên Chrome)** | Document & Code Reviewer | Đọc code, file Markdown và tài liệu; rà soát specification; đánh giá tính đầy đủ, phát hiện điểm chưa rõ; đưa ra phản biện độc lập | Không có workflow can thiệp trực tiếp vào VS Code theo thiết lập hiện tại; không giao triển khai code hoặc thay đổi repository |
| **Claude (dự kiến sử dụng qua GitHub Copilot)** | Future Independent Reviewer / Complex Reasoning Support | Có thể dùng để review kiến trúc, logic và code phức tạp sau khi được tích hợp và quyền truy cập được xác nhận | Chưa thuộc workflow hiện tại; không đưa vào dependency của roadmap hoặc chờ Claude mới tiếp tục task |

### 2.1. Thông tin hạn mức hiện tại do chủ dự án cung cấp

| Công cụ | Thông tin ghi nhận | Cách sử dụng |
|---|---|---|
| Codex | Luna 5.6, Terra 5.6 và Luna 6 Free Trial; chủ dự án ghi nhận khoảng 720 giờ/tháng cho 3 mô hình | Phân chia task theo độ phức tạp; theo dõi dashboard thực tế vì cách tính và hạn mức có thể thay đổi |
| GitHub Copilot Free | Đã dùng khoảng 62% credit tháng tại thời điểm lập tài liệu | Dùng tiết kiệm cho IDE, terminal, sửa code và test |
| Gemini Free Trial | Chủ dự án ghi nhận khoảng 1.1M credit/tháng | Dùng chủ yếu cho review tài liệu và thử nghiệm tạo hình ảnh; kiểm tra quota thực tế |
| Google AI Plus | Có thể hoạt động trên Chrome để đọc và đánh giá tài liệu/code; không can thiệp trực tiếp VS Code theo thiết lập hiện tại | Reviewer phụ |
| ChatGPT Free Trial | Đang dùng cho định hướng, review, kiểm thử, đề xuất và mở rộng ý tưởng | Giữ vai trò kiến trúc sản phẩm và QA review |
| Claude | Dự kiến có thể sử dụng sau khi tích hợp qua Copilot | Chưa phân bổ công việc thường xuyên |

> Các số liệu trên là ghi nhận tại thời điểm lập tài liệu, không phải cam kết quota chính thức của nhà cung cấp. Khi lập kế hoạch dài hạn, kiểm tra lại trang usage/billing và quyền lợi tài khoản.

## 3. Quy trình phối hợp tiêu chuẩn

Mỗi tính năng nên đi qua quy trình sau:

| Bước | Phụ trách | Đầu ra bắt buộc |
|---|---|---|
| 1. Xác định nhu cầu | Chủ dự án + ChatGPT | Mục tiêu, vấn đề người dùng, lý do ưu tiên |
| 2. Thiết kế giải pháp | ChatGPT cùng chủ dự án | Specification, phạm vi, dependency, rủi ro |
| 3. Review độc lập (khi cần) | Gemini / Google AI Plus / model Codex thứ hai | Các thiếu sót, mâu thuẫn và đề xuất; không tự triển khai |
| 4. Chọn agent triển khai | Chủ dự án | Một agent chính và phạm vi file/module rõ ràng |
| 5. Triển khai | Codex hoặc Copilot | Code, migration nếu có, tài liệu kỹ thuật cần thiết |
| 6. Kiểm thử | Agent triển khai + công cụ test | Lệnh test, kết quả, lỗi còn lại |
| 7. Review nghiệm thu | ChatGPT + chủ dự án | Đối chiếu specification và acceptance criteria |
| 8. Hoàn thiện & lưu trữ | Agent triển khai; GitHub | Sửa lỗi, commit, cập nhật tài liệu liên quan |

### 3.1. Quy tắc chọn model

- Task nhỏ, rõ ràng, ít file: Luna 5.6 hoặc Copilot Free.
- Task nhiều file hoặc logic phức tạp: ưu tiên Luna 6 hoặc Copilot Agent khi đã được cấp quyền.
- Cần ý kiến phản biện: dùng Terra 5.6 hoặc một reviewer độc lập; không yêu cầu mọi model cùng trả lời.
- Cần đọc và đánh giá tài liệu dài: Google AI Plus hoặc Gemini.
- Cần quyết định sản phẩm, UX, scope và acceptance criteria: ChatGPT cùng chủ dự án.
- Cần tạo hình ảnh: chọn công cụ tạo ảnh dựa trên chất lượng đầu ra, khả năng giữ phong cách và tính nhất quán; không mặc định một model luôn tốt nhất.

### 3.2. Quy tắc bàn giao task cho coding agent

Mỗi yêu cầu triển khai cần cung cấp:
- Mục tiêu và vấn đề cần giải quyết.
- Phạm vi bao gồm và không bao gồm.
- File/module liên quan nếu đã biết.
- Quy tắc kiến trúc hoặc schema phải tuân thủ.
- Acceptance criteria có thể kiểm chứng.
- Test cần chạy.
- Những dữ liệu hoặc hành vi không được phép phá vỡ.

Sau khi triển khai, agent phải báo cáo:
- File đã tạo/sửa/xóa.
- Hành vi đã triển khai.
- Test đã chạy và kết quả thực tế.
- Test chưa chạy hoặc chưa thể xác minh.
- Rủi ro, giới hạn và việc còn lại.
- Commit SHA nếu đã commit thành công.

Không đánh dấu task hoàn tất chỉ dựa trên lời khẳng định của agent. Phải phân biệt rõ: **code đã viết**, **automated test đã chạy**, **browser acceptance đã kiểm tra**, và **đã xác minh trên môi trường sạch/CI**.

## 4. Phân công riêng cho UI/UX

Giao diện là một phần quan trọng của First Usable Build. Không chỉ tối ưu vẻ ngoài; cần đảm bảo người dùng hiểu công cụ, biết trạng thái và nhận phản hồi sau thao tác.

| Hạng mục | Phụ trách | Kết quả mong muốn |
|---|---|---|
| Product flow và định hướng UX | Chủ dự án + ChatGPT | User flow, navigation, nguyên tắc trải nghiệm |
| Đánh giá giao diện hiện tại | ChatGPT; Gemini/Google AI Plus review khi cần | Danh sách vấn đề theo mức độ ưu tiên |
| Design specification | ChatGPT | Component states, interaction, empty/loading/error states |
| Triển khai component | Một coding agent được chỉ định | Component tái sử dụng, nhất quán với kiến trúc hiện có |
| Responsive và accessibility cơ bản | Coding agent | Layout phù hợp, thao tác bàn phím và trạng thái dễ nhận biết |
| Icon, illustration và visual assets | Image generation hoặc nguồn asset có giấy phép phù hợp | Bộ hình ảnh nhất quán |
| UI interaction và regression tests | Copilot/Codex | Kiểm tra hành vi thực tế |
| UX acceptance review | ChatGPT + chủ dự án | Đánh giá tính rõ ràng, khả năng tìm thấy tính năng và phản hồi |

### 4.1. Ba nguyên tắc UX

1. **Discoverability:** Người dùng dễ tìm thấy công cụ và biết bước tiếp theo.
2. **Clarity:** Người dùng hiểu đối tượng, thuộc tính và phạm vi đang chỉnh sửa.
3. **Feedback:** Thao tác quan trọng có phản hồi trực quan; trạng thái lưu, lỗi và kết quả không mơ hồ.

Không tạo thêm UI chỉ để trưng bày tính năng tương lai. Ưu tiên hoàn thiện luồng người dùng thực sự cần cho First Usable Build.

## 5. Kế hoạch hình ảnh và Asset Pack Library mẫu

### 5.1. Mục tiêu

Chuẩn bị các Asset Pack đủ chất lượng để kiểm tra quy trình quản lý thư viện, cài đặt, sử dụng trong Map Studio, lưu/mở lại dự án và export/import. Bộ mẫu là dữ liệu kiểm thử và trình diễn, không thay thế thiết kế marketplace hoặc hệ sinh thái creator trong tương lai.

### 5.2. Các pack đề xuất

| Pack | Nội dung dự kiến | Mục tiêu kiểm thử |
|---|---|---|
| **Pack 01 — Natural Terrain** | Đồng bằng, đồi, núi, sa mạc, rừng, tuyết, băng, đất đá và các loại terrain phù hợp | Hiển thị terrain, phân loại, lựa chọn và sử dụng trong Map Studio |
| **Pack 02 — World Symbols** | Thành phố, làng, lâu đài, cảng biển, núi lửa, di tích, landmark và marker | Icon, marker, vị trí và metadata |
| **Pack 03 — World Decorations** *(mở rộng, không bắt buộc cho tiêu chí tối thiểu)* | Cây, công trình, tàn tích, vật thể và chi tiết trang trí môi trường | Kiểm thử nhiều loại asset, mở rộng thư viện và tính nhất quán phong cách |

**Tiêu chí tối thiểu First Usable Build:** Có ít nhất hai Asset Libraries/Asset Packs có thể quản lý và sử dụng trong Map Studio. Pack 03 là phần mở rộng nếu không làm chậm các tiêu chí nghiệm thu cốt lõi.

### 5.3. Quy chuẩn trước khi tạo hàng loạt

Cần thống nhất một Asset Style Guide, tối thiểu gồm:

- Phong cách đồ họa và bảng màu.
- Góc nhìn: top-down, isometric hoặc perspective; không trộn tùy tiện trong cùng một pack.
- Tỷ lệ, kích thước canvas và quy tắc padding.
- Định dạng phù hợp: PNG, SVG hoặc định dạng được ứng dụng hỗ trợ.
- Quy tắc nền trong suốt cho asset cần tách nền.
- Quy tắc đặt tên file, category và stable ID.
- Metadata, preview/thumbnail và phiên bản pack.
- Nguồn tạo, tác giả và thông tin license/usage rights.
- Quy tắc kiểm tra asset lỗi, trùng lặp, sai kích thước hoặc sai định dạng.

Không đưa asset có nguồn gốc hoặc quyền sử dụng không rõ ràng vào pack phát hành. Tài nguyên AI-generated cũng cần được kiểm tra điều khoản sử dụng của công cụ tạo ảnh và chính sách phân phối áp dụng tại thời điểm phát hành.

### 5.4. Phân công tạo Asset Pack

| Công việc | Phụ trách | Đầu ra |
|---|---|---|
| Xác định nhu cầu sử dụng và phong cách | Chủ dự án + ChatGPT | Asset Style Guide |
| Viết prompt và hướng dẫn tạo biến thể | ChatGPT | Prompt set và tiêu chí hình ảnh |
| Tạo ảnh | ImageGen của ChatGPT hoặc Gemini, chọn theo chất lượng thực tế | Ảnh gốc và biến thể |
| Review độ đồng nhất | ChatGPT; Gemini/Google AI Plus có thể phản biện | Danh sách asset đạt/chưa đạt |
| Chuẩn hóa file, kích thước và định dạng | Codex/Copilot | Asset files đã chuẩn hóa |
| Tạo manifest, metadata và stable IDs | Codex/Copilot | Manifest hợp lệ |
| Đóng gói và validation | Codex/Copilot | Asset Pack có thể import |
| Kiểm tra import, sử dụng, save/reopen, export/import | Copilot/Codex | Kết quả kiểm thử |
| Đánh giá cuối | ChatGPT + chủ dự án | Acceptance report |

### 5.5. Kiểm thử Asset Pack bắt buộc

Với tối thiểu hai pack:

1. Import hoặc cài đặt pack.
2. Kiểm tra metadata, preview và danh sách asset.
3. Sử dụng asset trong Map Studio.
4. Lưu project và tải lại trang.
5. Mở lại project, xác minh asset vẫn hiển thị.
6. Thử disable/uninstall theo hành vi thiết kế; xác minh dữ liệu project không bị mất ngoài dự kiến.
7. Export và import lại project/archive.
8. Xác minh liên kết asset, ID và metadata không bị hỏng.
9. Kiểm tra lỗi pack không làm hỏng trạng thái các pack/project khác.

## 6. Phân bổ AI theo roadmap hiện tại

| Giai đoạn | ChatGPT | Codex | Copilot | Gemini / Google AI Plus |
|---|---|---|---|---|
| **Phase 4.4 — Persistence & Archive QA** | Review acceptance criteria, phân tích kết quả và rủi ro dữ liệu | Sửa lỗi khó hoặc task độc lập | Chạy test, terminal, sửa lỗi cục bộ | Review tài liệu/QA plan khi cần |
| **Phase 5 — Asset Pack Management** | Specification, UX, schema review, nghiệm thu | Triển khai module hoặc xử lý task phức tạp | Coding trong IDE, terminal và tests | Review thiết kế và edge cases |
| **Chuẩn bị Asset Pack mẫu** | Style guide, prompt, tiêu chí hình ảnh và review | Metadata, manifest, validation | Chuẩn hóa workflow, import/export tests | Review hình ảnh/tài liệu; tạo ảnh nếu phù hợp |
| **Phase 6 — Asset Pack Studio** | Specification, UX, acceptance criteria | Triển khai module | Coding, terminal, automated tests | Review độc lập khi cần |
| **First Usable Build QA** | Tổng hợp QA, UX review, quyết định đề xuất | Sửa lỗi có phạm vi | Regression và browser/terminal tests | Review checklist hoặc tài liệu khi cần |

Không trì hoãn các kiểm thử nhỏ đến giai đoạn release. Mỗi Phase phải có automated tests, browser acceptance phù hợp và regression checks riêng.

## 7. Thứ tự ưu tiên công việc trước mắt

1. Hoàn tất và xác nhận Phase 4.4 theo các tiêu chí đã thống nhất.
2. Đánh giá UI hiện tại, ghi nhận các vấn đề ảnh hưởng trực tiếp đến First Usable Build.
3. Thống nhất Asset Style Guide và cấu trúc Asset Pack.
4. Tạo Pack 01 — Natural Terrain.
5. Tạo Pack 02 — World Symbols.
6. Triển khai Phase 5 — Asset Pack Management.
7. Import hai pack vào Map Studio; kiểm tra save/reopen và export/import.
8. Triển khai Phase 6 — Asset Pack Studio.
9. Hoàn thiện UI/UX và kiểm thử First Usable Build.

Các hệ thống World Genesis, Climate, Biology, Civilization, Showcase, Marketplace và AI Generation nâng cao vẫn theo roadmap tổng thể; không được tự động đưa vào phạm vi First Usable Build chỉ vì có thêm model AI.

## 8. Quy tắc tránh phân tán và xung đột

- Không tìm thêm model AI mới trong giai đoạn hiện tại trừ khi xuất hiện một nhu cầu cụ thể mà bộ công cụ hiện có không đáp ứng được.
- Không yêu cầu tất cả model review mọi task.
- Không để hai coding agent cùng chỉnh sửa một file hoặc cùng triển khai một module trong cùng thời điểm.
- Nếu cần review chéo, reviewer phải đưa ra nhận xét và bằng chứng; coding agent chính chịu trách nhiệm thực hiện thay đổi.
- Không coi số lượng model được sử dụng là thước đo năng suất.
- Đánh giá hiệu quả theo chất lượng code, tỷ lệ test đạt, số lỗi hồi quy, thời gian hoàn thành và lượng credit tiêu thụ.
- Mọi đề xuất thay đổi sản phẩm phải được chủ dự án chấp thuận và cập nhật vào master document nếu đó là quyết định chính thức.

## 9. Mẫu giao việc ngắn cho AI

Có thể dùng cấu trúc sau khi giao task:

```text
PROJECT: World Forge Studio

TASK:
[Một mục tiêu cụ thể]

CONTEXT:
[Phase hiện tại, module liên quan, trạng thái hiện có]

SCOPE:
- Included:
- Excluded:

CONSTRAINTS:
- Tuân thủ WORLD_FORGE_STUDIO_MASTER.md.
- Không tự ý mở rộng scope.
- Không phá vỡ dữ liệu/project hiện có.
- Không sửa file ngoài phạm vi nếu chưa giải thích và được chấp thuận.

ACCEPTANCE CRITERIA:
1.
2.
3.

TESTS:
[Các automated/browser tests cần chạy]

REPORT:
- Files changed:
- Implementation:
- Tests run and actual results:
- Tests not run:
- Risks / remaining issues:
- Commit SHA (if committed):
```

---

## 10. Nguyên tắc kết luận

World Forge Studio hiện có đủ công cụ AI để tiếp tục phát triển theo lộ trình First Usable Build. Trọng tâm không phải bổ sung thêm model, mà là:

- Dùng ChatGPT và chủ dự án để giữ định hướng và specification.
- Dùng một coding agent chính cho mỗi task.
- Dùng reviewer độc lập có chọn lọc.
- Dùng automated tests và browser QA để xác minh kết quả.
- Dùng công cụ tạo ảnh phù hợp để xây dựng Asset Libraries nhất quán.
- Giữ GitHub và tài liệu dự án làm nơi lưu trữ quyết định và kết quả.

**Mục tiêu cuối cùng:** AI giúp tăng tốc phát triển, nhưng kiến trúc, chất lượng, phạm vi và quyết định sản phẩm vẫn phải nằm trong quyền kiểm soát của chủ dự án.
