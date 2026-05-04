# Green Truth

## Giới thiệu

**Green Truth** là nền tảng web hướng đến lối sống bền vững, giúp người dùng chuyển từ nhận thức môi trường sang hành động thực tế. Dự án kết hợp thông tin giáo dục, công cụ theo dõi hành động xanh, bản đồ cây trồng, tính toán tác động CO₂, xác minh dọn rác bằng AI, chia sẻ tài nguyên và hệ thống thử thách cộng đồng.

> **Slogan:** Sự thật xanh – Hành động thật

## Mục đích

Green Truth được xây dựng nhằm:

- Khuyến khích hành động bảo vệ môi trường hằng ngày thay vì hoạt động mang tính phong trào.
- Giúp người dùng hiểu rõ tác động môi trường của lựa chọn cá nhân, sự kiện và vật liệu sử dụng.
- Tạo không gian theo dõi cây trồng, hoạt động dọn rác, chia sẻ đồ dùng và thực phẩm dư thừa.
- Ghi nhận nỗ lực xanh thông qua xu xanh, chuỗi ngày hoạt động, nhiệm vụ, huy hiệu và bảng xếp hạng.
- Giảm greenwashing bằng cách tập trung vào dữ liệu, bằng chứng và hành động có thể kiểm chứng.

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript thuần
- **Server:** Node.js HTTP server
- **Database/Auth/Storage:** Supabase
- **Bản đồ:** Leaflet
- **AI Chatbot:** Google Gemini API
- **Xác minh hình ảnh:** TensorFlow.js, Gemini, Supabase Edge Functions
- **Email/Green Alert:** Resend API
- **Game phụ:** Phaser, Vite

## Tính năng

- **Trang giới thiệu:** Trình bày sứ mệnh, triết lý, giải pháp và video giới thiệu Green Truth.
- **Đăng nhập/đăng ký:** Xác thực người dùng bằng Supabase Auth, hỗ trợ tạo hồ sơ và ảnh đại diện.
- **Dashboard:** Hiển thị tổng quan người dùng, ghi chú, mục tiêu và gửi báo cáo Green Alert.
- **Hồ sơ cá nhân:** Quản lý tên người dùng, avatar, xu xanh, chuỗi ngày và phần thưởng hằng ngày.
- **Digital Assets:** Tải lên, xem trước, mở liên kết và xoá tài sản số như hình ảnh, video, PDF.
- **Go Green Map:** Bản đồ Leaflet để trồng cây, xem cây đã trồng, cập nhật nhật ký chăm sóc và quản lý cây của người dùng.
- **Green Share:** Chia sẻ hoặc mượn đồ dùng tái sử dụng bằng cơ chế đặt cọc xu xanh.
- **Food Share:** Chia sẻ thực phẩm còn dùng được theo vị trí trên bản đồ nhằm giảm lãng phí.
- **Green Calculator:** Tính toán phát thải CO₂ cho hoạt động/sự kiện, hiển thị mức tác động và gợi ý cải thiện.
- **Confirm Action:** Dùng camera và AI để xác minh hành động dọn rác, sau đó thưởng xu nếu hợp lệ.
- **Chatbot Leaf:** Trợ lý AI tư vấn kiến thức môi trường và hướng dẫn sử dụng các tính năng trong Green Truth.
- **Green Combat:** Hệ thống nhiệm vụ xanh, đội nhóm, gửi bằng chứng, xét duyệt, điểm thưởng, huy hiệu và bảng xếp hạng.
- **Green Combat Admin/Review:** Khu vực quản trị để tạo nhiệm vụ, xét duyệt minh chứng và quản lý hoạt động thi đua.
