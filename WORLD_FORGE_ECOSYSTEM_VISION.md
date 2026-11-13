# World Forge — Product Vision & Ecosystem Strategy

> **Tài liệu định hướng sản phẩm và chiến lược dài hạn**  
> **Ngày cập nhật:** 13/11/2026  
> **Repository:** `TungMai510/World-Forge-Studio`  
> **Trạng thái:** Product vision / proposal — không phải cam kết triển khai hoặc mô tả các tính năng đã hoàn thành.

## 1. Mục đích tài liệu

Tài liệu này ghi nhận các định hướng mở rộng đã thảo luận cho World Forge. Nó bổ sung cho roadmap kỹ thuật hiện tại, không thay thế roadmap, specification hay trạng thái kiểm thử trong repository.

Cần phân biệt rõ:

- **Core hiện tại:** World Editor, Asset System và các phase đang được triển khai/kiểm thử.
- **Định hướng sản phẩm kế tiếp:** Creator Infrastructure, các Studio bổ sung và World Community.
- **Tầm nhìn dài hạn:** marketplace, nền kinh tế sáng tạo, Stories, chuyển thể đa phương tiện và các dịch vụ hỗ trợ.
- Mọi tính năng được mô tả là “đề xuất”, “dự kiến” hoặc “định hướng” đều chưa được xem là đã triển khai nếu không có bằng chứng mã nguồn và kiểm thử tương ứng.

## 2. Tầm nhìn và định vị

### 2.1 Định vị

**World Forge — A Global Ecosystem for Creative Minds.**

World Forge hướng tới trở thành một hệ sinh thái nơi những người có trí tưởng tượng và kỹ năng sáng tạo khác nhau có thể tạo ra thế giới, tác phẩm và tài nguyên; tìm thấy nhau; cộng tác; chia sẻ tri thức; và phát triển giá trị từ sản phẩm sáng tạo.

World Forge khởi nguồn tại Việt Nam nhưng định hướng thiết kế cho cộng đồng quốc tế. Không giới hạn người dùng theo quốc gia, ngôn ngữ hay lĩnh vực sáng tạo.

### 2.2 Thông điệp thương hiệu

- **Every World Begins With an Imagination.** — Mọi thế giới đều bắt đầu từ trí tưởng tượng.
- **Where Imagination Meets Creation.** — Nơi trí tưởng tượng gặp gỡ sự sáng tạo.
- **Create Freely. Share Knowledge. Grow Together.** — Tự do sáng tạo. Chia sẻ tri thức. Cùng nhau phát triển.

Đây là các thông điệp định hướng; việc chọn thông điệp chính thức và hệ thống nhận diện cần được quyết định riêng.

### 2.3 Nguyên tắc cộng đồng

1. **Imagine** — Tưởng tượng.
2. **Create** — Sáng tạo.
3. **Connect** — Kết nối.
4. **Collaborate** — Hợp tác.
5. **Share** — Chia sẻ.
6. **Grow** — Phát triển.

World Forge không cần tự sản xuất mọi nội dung. Vai trò cốt lõi là cung cấp công cụ, dữ liệu, hạ tầng và môi trường để Creator và các studio/đối tác tạo ra sản phẩm.

## 3. Đối tượng sáng tạo

Hệ sinh thái có thể phục vụ nhiều vai trò, một người dùng có thể đảm nhận nhiều vai trò cùng lúc:

- Worldbuilder và nhà thiết kế bản đồ.
- Nhà văn, tác giả tiểu thuyết và biên kịch.
- Họa sĩ, illustrator, concept artist và comic creator.
- Nhà thiết kế nhân vật, trang phục, kiến trúc và môi trường.
- Game developer và plugin developer.
- Nhạc sĩ, nhà soạn nhạc, producer và sound designer.
- Nhà làm phim, animator và studio sản xuất.
- Người nghiên cứu, biên tập, dịch thuật và cộng tác viên.

## 4. Cấu trúc sản phẩm: các Studio

Các Studio nên là những module có giao diện và nghiệp vụ chuyên biệt, nhưng dùng chung các dịch vụ nền tảng khi phù hợp. Không mặc định tất cả phải nằm trong một ứng dụng đơn khối; một số nhánh có thể trở thành ứng dụng hoặc website riêng kết nối qua tài khoản và API chung.

### 4.1 World Editor / World Studio

Nền tảng kiến tạo và quản lý thế giới:

- Bản đồ, địa hình, sông, hồ, biên giới, địa danh và lớp bản đồ.
- Geography, climate và natural resources.
- Countries, civilizations, cultures, religions, languages.
- Politics, economy, military và organizations.
- Characters, events, history, timeline và lore.
- Liên kết dữ liệu giữa các thực thể trong thế giới.

World Editor hiện tại vẫn là sản phẩm lõi. World Studio ở phạm vi dữ liệu thế giới rộng hơn là định hướng mở rộng, không đồng nghĩa mọi loại dữ liệu trên đã có trong prototype.

### 4.2 Asset Pack Studio

Module authoring cho tài nguyên dùng trong World Forge:

- Tạo và quản lý Asset Pack.
- Nhập một hoặc nhiều tệp ảnh.
- Chỉnh sửa metadata, tags, category và usages/capabilities.
- Khai báo license và attribution.
- Preview, validate và export `.wfpack`.
- Quản lý phiên bản và kiểm tra khả năng import lại vào Asset Library.

Asset Pack tiếp tục là định dạng dữ liệu tài nguyên; không chứa mã thực thi tùy ý. Các capability như `stamp`, `icon`, `scatter`, `texture-fill`, `pattern-stroke` và `decoration` cần được quản lý theo schema/contract thống nhất.

### 4.3 Plugin Studio

Không gian dành cho nhà phát triển công cụ mở rộng:

- Tạo, cấu hình, kiểm thử và quản lý plugin.
- Khai báo metadata, phiên bản, dependency và quyền truy cập.
- Đóng gói, tải lên và xuất bản plugin.
- Quản lý cập nhật, tương thích, tài liệu và changelog.
- Theo dõi lượt sử dụng, đánh giá và hiệu quả phân phối khi có hạ tầng phù hợp.

Nhóm plugin tiềm năng:

- World/Map Generator.
- Character, Faction và Civilization Generator.
- Lore, Language và History Generator.
- Simulation Generator.
- AI Asset Generator.
- Workflow và productivity tools.

Định dạng `.wfplugin` là đề xuất. Plugin có mã thực thi phải có sandbox, permission model, validation, versioning và quy trình bảo mật. Không được coi `.wfplugin` tương đương `.wfpack`; Asset Pack là dữ liệu, Plugin có thể chứa mã thực thi.

### 4.4 Soundscape Studio

Không gian dành cho nhạc sĩ và nhà sáng tạo âm thanh:

- Soundtrack, background music và ambient music.
- Environmental sound và sound effects.
- Character, civilization, faction, event và battle themes.
- Album, track, loop, stems và phiên bản mix.
- Audio preview, metadata, attribution và license.
- Quản lý xuất bản, cập nhật và thống kê khi nền tảng hỗ trợ.

Cần ghi nhận rõ quyền composition, master recording, sample, arrangement, quyền sử dụng thương mại và việc có sử dụng AI hay không. Không mặc định người tải lên sở hữu mọi thành phần trong bản thu.

### 4.5 Story Studio

Định hướng xuất bản và quản lý tác phẩm kể chuyện:

- Web novel, tiểu thuyết, truyện ngắn và light novel.
- Manga, manhwa, manhua, webtoon và comic.
- Interactive stories và visual novel.
- World chronicles, lịch sử, truyền thuyết và hồ sơ nhân vật.
- Quản lý series, chương/tập, bản nháp và xuất bản.
- Theo dõi độc giả, quyền sử dụng và tùy chọn thương mại hóa khi có hạ tầng phù hợp.

Tác phẩm có thể liên kết với World Profile nhưng không bắt buộc phải thuộc một thế giới đã tồn tại trong World Forge. Đây là nhánh dài hạn, chưa phải phạm vi core hiện tại.

### 4.6 Creator Studio / Creator Hub

Trung tâm quản lý cho nhà sáng tạo:

- Creator Profile và portfolio.
- Sản phẩm đã tạo/xuất bản.
- Worlds, Asset Packs, Plugins, Soundtracks và Stories.
- Dự án cộng tác và lời mời hợp tác.
- Trạng thái xuất bản, phiên bản và license.
- Thống kê, doanh thu và chi trả khi có hoạt động thương mại.

## 5. World Community

World Community không nên chỉ là một diễn đàn văn bản truyền thống. Nó nên kết hợp showcase, thảo luận, phản hồi và tìm cộng sự.

### 5.1 World Showcase và World Profile

Mỗi thế giới có thể có một trang giới thiệu gồm:

- Tên, mô tả, ảnh bìa và trạng thái phát triển.
- Bản đồ và thông tin địa lý.
- Quốc gia, nền văn minh, phe phái và tổ chức.
- Nhân vật, văn hóa, ngôn ngữ, lịch sử, timeline và lore.
- Tác giả, cộng tác viên và nguồn đóng góp.
- Các tác phẩm/tài nguyên liên quan.
- Quyền truy cập, license và tình trạng sẵn sàng hợp tác.

Cần hỗ trợ cả thế giới công khai, riêng tư, đang phát triển và chỉ chia sẻ một phần dữ liệu.

### 5.2 Các khu vực cộng đồng đề xuất

| Khu vực | Mục đích |
|---|---|
| World Showcase | Trưng bày thế giới của Creator |
| Worldbuilding Forum | Thảo luận kỹ thuật và nghệ thuật worldbuilding |
| Feedback & Critique | Nhận góp ý có cấu trúc |
| Collaboration Hub | Tìm cộng sự và đăng nhu cầu dự án |
| WIP Showcase | Chia sẻ tiến độ đang phát triển |
| Knowledge Exchange | Chia sẻ hướng dẫn, tài liệu và kinh nghiệm |
| Challenges & Events | Thử thách, sự kiện và hoạt động cộng đồng |

Các chức năng theo dõi, bình luận, đánh giá, báo cáo và kiểm duyệt cần được thiết kế cùng hệ thống danh tính và quyền riêng tư.

## 6. Creator Ecosystem — Hệ sinh thái Nhà sáng tạo

Creator Ecosystem là khái niệm kết nối các Studio, cộng đồng và hoạt động thương mại. Creator có một tài khoản và hồ sơ thống nhất, nhưng có thể tham gia nhiều vai trò và xuất bản nhiều loại sản phẩm.

### 6.1 Hạ tầng dùng chung cần nghiên cứu

- **Creator Account:** tài khoản, xác thực và cài đặt.
- **Creator Profile:** hồ sơ, portfolio và vai trò.
- **Publishing System:** quy trình tạo bản nháp, kiểm tra, xuất bản, cập nhật và gỡ.
- **Content Management:** metadata, phiên bản, tệp và trạng thái nội dung.
- **License & IP Management:** tác giả, chủ sở hữu, quyền sử dụng và điều khoản.
- **Community Interaction:** follow, comment, reaction, review và report.
- **Moderation & Trust:** kiểm duyệt, chống spam, xử lý vi phạm và khiếu nại.
- **Notification System:** thông báo và hoạt động.
- **Search & Discovery:** tìm kiếm và khám phá đa loại nội dung.
- **Payment & Payout:** thanh toán, đối soát và chi trả nếu/when mở thương mại.

Không cần triển khai toàn bộ cùng lúc. Ưu tiên thiết kế contract và tái sử dụng các thành phần thực sự chung; tránh tạo một backend lớn trước khi có nhu cầu xác thực.

## 7. Marketplace và Creator Economy

Marketplace là một lớp thương mại có thể phát triển khi có đủ Creator, sản phẩm, người mua, moderation và hỗ trợ giao dịch.

Các nhánh tiềm năng:

| Marketplace | Nội dung |
|---|---|
| Asset Marketplace | Asset Packs, textures, icons, brushes và templates |
| Plugin Marketplace | Plugin và công cụ mở rộng |
| Soundscape Marketplace | Nhạc, ambience và sound effects |
| Stories & Comics | Truyện chữ và truyện tranh |
| Knowledge Marketplace | Tài liệu, hướng dẫn và nội dung chuyên môn |
| Commission Marketplace | Dịch vụ map, art, writing, music và development |
| Campaign & Scenario Marketplace | Kịch bản, campaign và nội dung tabletop/game |
| World Forge Exchange | Giới thiệu và giao dịch/cấp phép quyền khai thác World IP |

### 7.1 Nguyên tắc marketplace

- Miễn phí, trả phí hoặc cấp phép theo lựa chọn của Creator và chính sách từng danh mục.
- Fixed price có thể là phương thức mặc định; hình thức đấu giá chỉ nên cân nhắc cho trường hợp đặc biệt.
- Hiển thị rõ tác giả, chủ sở hữu quyền, license, phạm vi sử dụng, attribution và hạn chế.
- Tách quyền sở hữu nội dung khỏi quyền phân phối trên nền tảng.
- Có quy trình báo cáo vi phạm, tranh chấp, hoàn tiền và xử lý nội dung bị gỡ.
- Không hứa hẹn thu nhập hoặc bảo đảm nhu cầu mua cho Creator.
- Tỷ lệ chia doanh thu chỉ được chốt sau khi tính phí thanh toán, thuế, chi phí vận hành, hoàn tiền và nghĩa vụ pháp lý.

### 7.2 World Forge Exchange và World IP

World Forge Exchange có thể là nơi Creator giới thiệu thế giới và tìm đối tác khai thác IP.

Các hình thức có thể nghiên cứu: non-exclusive license, exclusive license, option agreement và IP acquisition. Mỗi giao dịch cần hợp đồng nêu rõ phạm vi quyền, thời hạn, lãnh thổ, quyền phái sinh, độc quyền, chuyển nhượng và điều kiện chấm dứt.

Cần phân biệt ý tưởng chung với biểu đạt cụ thể được bảo hộ. Nền tảng không nên tự xác nhận quyền sở hữu thay cho quy trình kiểm tra và thỏa thuận giữa các bên.

## 8. World Forge Credits — ý tưởng cần thẩm định

Tên đề xuất cho đơn vị giá trị nội bộ là **World Forge Credits (WFC)**. Đây là ý tưởng nghiên cứu, chưa phải quyết định phát hành và không phải cryptocurrency.

Các hướng sử dụng từng được cân nhắc:
- Đơn vị hiển thị giá hoặc điểm sử dụng trong một số dịch vụ.
- Mua nội dung hoặc tính năng đủ điều kiện.
- Thanh toán dịch vụ sáng tạo nếu mô hình được phép.
- Hỗ trợ quy trình ghi nhận thu nhập và chi trả Creator.

Các khái niệm cần phân biệt:
- **Spending balance/credits:** số dư hoặc quyền sử dụng dịch vụ đã mua/được cấp.
- **Creator earnings:** khoản phải trả cho Creator phát sinh từ giao dịch.
- **Creator payout:** quy trình chi trả bằng phương thức thanh toán hợp pháp.
- **Wallet interface:** giao diện hiển thị lịch sử và trạng thái; không mặc nhiên đồng nghĩa nền tảng được phép cung cấp dịch vụ ví hoặc trung gian thanh toán.

Không mặc định cho phép chuyển nhượng, mua bán bên ngoài, đổi tiền mặt hoặc chuyển số dư giữa người dùng. Không cố định tỷ giá WFC/VND khi chưa có mô hình và thẩm định.

**Nguyên tắc:** giai đoạn đầu ưu tiên thanh toán qua nhà cung cấp dịch vụ phù hợp và ghi nhận giao dịch minh bạch. Chỉ nghiên cứu WFC sau khi có nhu cầu thực tế và được tư vấn pháp lý về thanh toán, thương mại điện tử, thuế, bảo vệ người tiêu dùng và các quy định liên quan tại từng thị trường. Không dùng blockchain chỉ để tạo cảm giác có một đồng tiền riêng.

## 9. Tầm nhìn mở rộng đa phương tiện

Một thế giới có thể phát triển thành nhiều hình thức tác phẩm. Đây là tầm nhìn hệ sinh thái dài hạn, không phải danh sách sản phẩm cần tự xây dựng ngay.

### 9.1 Các lĩnh vực có thể kết nối

- **World Forge Stories / Publishing:** tiểu thuyết, truyện tranh, sách và artbook.
- **World Forge Cinema:** phim ngắn, phim điện ảnh và series.
- **World Forge Animation:** hoạt hình 2D/3D, anime và motion comic.
- **World Forge Games:** RPG, strategy, sandbox và game nhiều người chơi.
- **World Forge Tabletop:** tabletop RPG, board game, miniature wargame và campaign.
- **World Forge Audio:** audiobook, audio drama, podcast và soundtrack.
- **World Forge Immersive:** VR, AR, triển lãm và trải nghiệm thế giới ảo.
- **World Forge Experiences:** LARP, escape room, sự kiện và trải nghiệm theo chủ đề.
- **World Forge Merchandising:** figure, collectible, poster, art toy và sản phẩm lưu niệm.

### 9.2 Dịch vụ hỗ trợ có thể kết nối

- Production/studio directory.
- Talent directory và tuyển cộng tác viên.
- Academy và tài liệu đào tạo.
- Localization, dịch thuật, phụ đề và lồng tiếng.
- Crowdfunding và tài trợ dự án.
- Distribution và phát hành.
- Creator PR, IP marketing và kết nối đối tác.

World Forge nên bắt đầu bằng công cụ, danh bạ, quy trình kết nối và đối tác. Không nên mặc định tự thành lập studio sản xuất phim/game/animation hoặc công ty truyền thông cho mọi lĩnh vực.

## 10. World IP Universe Profile — điểm kết nối đa phương tiện

Đề xuất xây dựng một hồ sơ trung tâm cho mỗi World IP. Hồ sơ có thể liên kết:

- World data, bản đồ, quốc gia và nhân vật.
- Lore, lịch sử và timeline.
- Tiểu thuyết, truyện tranh và kịch bản.
- Phim, animation và game.
- Soundtrack, audio và asset.
- Creator, studio, cộng tác viên và license.

Một World IP có thể có nhiều tác phẩm độc lập hoặc chuyển thể, với quan hệ và quyền sử dụng được ghi nhận rõ. Không phải mọi tác phẩm trong hệ sinh thái đều cần gắn với một World IP.

## 11. World Forge AI Layer

AI là lớp năng lực dùng chung, không phải điều kiện để sử dụng World Forge.

Các nguyên tắc kiến trúc đã định hướng trong tài liệu AI riêng:
- AI Gateway và Model Adapters tách khỏi UI/domain logic.
- Hỗ trợ nhiều nhà cung cấp và model; cân nhắc model local.
- World Data được truy cập qua API/permission có kiểm soát.
- Kết quả mặc định là draft/suggestion.
- Luồng **Preview → Validate → Approve → Commit** trước khi thay đổi dữ liệu chuẩn.
- Lưu generation history và provenance phù hợp chính sách riêng tư.
- AI có thể hỗ trợ tạo asset, lore, nhân vật, nền văn minh, câu chuyện và mô phỏng.
- Không cho AI ghi đè dữ liệu gốc, chạy mã tùy ý hoặc vượt qua validation.
- Nội dung AI cần tuân thủ chính sách nguồn gốc, quyền sử dụng và disclosure.

Tham chiếu: `WORLD_FORGE_AI_ARCHITECTURE_SPECIFICATION.md`.

## 12. Chiến lược thu hút Creator và đóng góp tài nguyên

Khi có bản demo và quy trình đóng góp đủ rõ, World Forge có thể mời các cộng đồng:
- Tiểu thuyết, worldbuilding và viết sáng tác.
- Phát triển game và plugin.
- Âm nhạc, soundtrack và sound design.
- Minh họa, concept art và truyện tranh.
- Thiết kế, tài liệu và các lĩnh vực sáng tạo liên quan.

Các loại đóng góp có thể gồm Asset Pack, bản đồ, lore, world data, plugin, soundtrack, ambient, sound effects, hướng dẫn và tài liệu.

### 12.1 Nguyên tắc đóng góp

- Ghi nhận tác giả và nguồn gốc.
- Nêu rõ license và quyền được cấp.
- Creator tự chọn nội dung nào được chia sẻ, ở phạm vi nào và theo điều kiện nào.
- Không yêu cầu gửi tài nguyên gốc hoặc chuyển giao quyền sở hữu chỉ để tham gia cộng đồng.
- Có quy trình kiểm tra nội dung, malware đối với gói có mã, và báo cáo vi phạm.
- Phân biệt đóng góp miễn phí, nội dung giới thiệu, nội dung cấp phép và sản phẩm thương mại.

Chiến dịch cộng đồng chỉ nên bắt đầu khi có demo đủ thuyết phục, trang giới thiệu, hướng dẫn đóng góp, điều khoản rõ ràng và đầu mối hỗ trợ.

## 13. Kiến trúc sản phẩm cấp cao

Có thể nhóm tầm nhìn thành sáu khối:

1. **World Creation & Intelligence** — World Editor, Asset System, World Studio và World Data.
2. **World Simulation & AI** — Generator, Simulation Engine và AI Layer.
3. **Stories & Publishing** — Story Studio, web novel, comics và publishing.
4. **Film, Animation & Games** — các công cụ, nội dung và đối tác chuyển thể.
5. **Music & Experiences** — Soundscape, audio và trải nghiệm immersive.
6. **Creator & Business Ecosystem** — Creator Hub, Community, Marketplace, IP, license và payout.

Các khối chia sẻ những nền tảng phù hợp như account, creator identity, world profile, content publishing, search, permission, IP/license, notification và payment integration. Chúng không nhất thiết phải cùng triển khai hoặc cùng phát hành.

## 14. Ưu tiên và lộ trình theo tầng

Lộ trình dưới đây là định hướng sản phẩm, không thay thế phase kỹ thuật trong `ROADMAP_WORLD_FORGE_STUDIO.md`.

### Tầng A — Core Product (ưu tiên hiện tại)

- Hoàn thiện World Editor và Asset System.
- Hoàn thiện persistence/archive và Pack Management theo roadmap kỹ thuật.
- Hoàn thiện Asset Pack Studio theo tiêu chí nghiệm thu.
- Giữ compatibility, offline workflow, import/export và kiểm thử end-to-end.
- Tiếp tục phát triển World Data Architecture theo nhu cầu cốt lõi.

### Tầng B — Creator Infrastructure (sau khi core ổn định)

- Xác định Creator Account/Profile.
- Thiết kế content/publishing contracts dùng chung.
- Xây World Profile và World Showcase phiên bản đầu.
- Thiết kế quyền riêng tư, license, attribution và moderation cơ bản.
- Chỉ triển khai backend/cloud khi có yêu cầu sản phẩm rõ ràng.

### Tầng C — Creator Ecosystem (phát triển theo nhu cầu)

- Creator Hub.
- World Community và Collaboration Hub.
- Plugin Studio.
- Soundscape Studio.
- Asset/Plugin/Soundscape publishing và marketplace từng phần.

Không nhất thiết phải đợi mọi module hoàn thành mới phát hành beta; có thể thử nghiệm từng lát cắt nhỏ với nhóm Creator phù hợp.

### Tầng D — Long-term Expansion

- Story Studio.
- World Forge Exchange.
- Generative Plugin Store.
- Simulation và các trải nghiệm đa phương tiện.
- Production/Talent/Academy/Localization/Distribution.
- Nghiên cứu WFC nếu có nhu cầu và cơ sở pháp lý.

## 15. Nguyên tắc bảo vệ phạm vi và nguồn lực

World Forge hiện được phát triển bởi một founder solo. Vì vậy:

1. Không biến mọi ý tưởng trong tài liệu này thành task kỹ thuật ngay lập tức.
2. Không phát triển nhiều Studio cùng lúc khi core chưa ổn định.
3. Ưu tiên tính năng tạo giá trị sử dụng trực tiếp và có thể kiểm thử.
4. Dùng chung hạ tầng khi thực sự có domain/contract chung; không trừu tượng hóa quá sớm.
5. Có thể dùng đối tác và nền tảng bên ngoài cho thanh toán, lưu trữ, phân phối hoặc sản xuất khi phù hợp.
6. Tuyển người hoặc lập pháp nhân theo nhu cầu vận hành, pháp lý và kinh doanh thực tế, không chỉ vì tầm nhìn lớn.
7. Đánh giá tiến độ bằng workflow người dùng hoạt động được, độ tin cậy, retention và creator participation; không chỉ bằng số module hoặc lượt tải.
8. Giữ roadmap kỹ thuật có tiêu chí hoàn thành, test và trạng thái bằng chứng riêng.

## 16. Trạng thái hiện tại và ranh giới tài liệu

Tại thời điểm ghi tài liệu, trạng thái Asset System và Phase 3D được mô tả trong `ROADMAP_WORLD_FORGE_STUDIO.md`. Không sao chép hoặc tự nâng trạng thái hoàn thành từ tài liệu định hướng này.

Các nhánh Plugin Studio, Soundscape Studio, World Community, Creator Hub, Marketplace, Story Studio, World Forge Exchange, WFC và các nhánh đa phương tiện trong tài liệu này là **đề xuất/tầm nhìn**, trừ khi một tài liệu kỹ thuật hoặc commit riêng xác nhận đã triển khai.

## 17. Tuyên ngôn tổng thể

> World Forge được xây dựng với mong muốn trở thành nơi những bộ óc sáng tạo và trí tưởng tượng từ khắp nơi trên thế giới có thể gặp gỡ, giao thoa và cùng nhau kiến tạo.
>
> Một ý tưởng có thể bắt đầu từ một cá nhân, nhưng khi được chia sẻ và phát triển cùng những người khác, nó có thể trở thành điều lớn lao hơn.
>
> World Forge hướng đến một môi trường nơi mọi người có thể tạo ra thế giới, kể những câu chuyện, phát triển tác phẩm, chia sẻ tri thức, tìm kiếm cộng sự và tạo dựng giá trị từ chính khả năng sáng tạo của mình.
>
> **Every World Begins With an Imagination.**

---

## Tài liệu liên quan

- `ROADMAP_WORLD_FORGE_STUDIO.md` — trạng thái và roadmap kỹ thuật.
- `ASSET_PACK_SPECIFICATION.md` — định dạng Asset Pack.
- `TOOL_ASSET_INTEGRATION_SPECIFICATION.md` — contract tích hợp Asset với Tool System.
- `WORLD_FORGE_AI_ARCHITECTURE_SPECIFICATION.md` — định hướng AI Layer.
- `WORLD_FORGE_TOOL_ENHANCEMENT_SPECIFICATION.md` — đặc tả nâng cấp Tool.

