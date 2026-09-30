# BÁO CÁO BẢO VỆ ĐỒ ÁN / BÀI TẬP LỚN
## ĐỀ TÀI SỐ 06: HỆ THỐNG ĐẶT PHÒNG KHÁCH SẠN (HOTEL BOOKING SYSTEM)
**Sinh viên thực hiện:** Đào Trọng Đức Nhân  
**Mã số sinh viên:** DTC245200947  
**Công nghệ triển khai:** Docker Compose, Nginx SSL, Node.js, PostgreSQL, Prometheus, Grafana, Loki

---

## SLIDE 1: TRANG TIÊU ĐỀ (TITLE SLIDE)
- **Tên đề tài:** Triển khai Kiến trúc Microservices & Hạ tầng Giám sát DevOps cho Hệ thống Đặt phòng Khách sạn
- **Đề số:** 06
- **Sinh viên thực hiện:** Đào Trọng Đức Nhân
- **Mã số sinh viên:** DTC245200947
- **Hệ thống phần mềm:** Website đặt phòng khách sạn (Phòng, Đặt chỗ, Khách hàng)
- **Các thành phần hạ tầng:** Docker Compose, Nginx Reverse Proxy (HTTPS), PostgreSQL + pgAdmin, Prometheus, Grafana, Loki + Promtail.

---

## SLIDE 2: MỤC TIÊU & PHẠM VI DỰ ÁN
### 1. Nghiệp vụ bài toán (Đề 6):
- **Quản lý phòng nghỉ:** 3 hạng phòng tiêu chuẩn (Deluxe Hướng Biển, Suite Tổng Thống, Standard Đôi) kèm giá và trạng thái còn trống.
- **Đặt chỗ trực tuyến:** Khách hàng đặt phòng trực tiếp, tự động sinh mã định danh đặt phòng `#BK-947x`.
- **Quản lý khách hàng:** Hồ sơ khách hàng được lưu trữ an toàn trong cơ sở dữ liệu quan hệ PostgreSQL.

### 2. Tiêu chuẩn hạ tầng DevOps (Đáp ứng trọn vẹn 7 tiêu chí):
- **Containerization:** Toàn bộ hệ thống chạy độc lập trên 6 container Docker.
- **Bảo mật mạng & Proxy:** Nginx mã hóa SSL/HTTPS cổng 8443 cùng bộ Security Headers chống tấn công.
- **Khả năng quan sát (Observability):** Giám sát hiệu năng và Metric qua Prometheus/Grafana, thu thập log tập trung qua Loki/Promtail.

---

## SLIDE 3: KIẾN TRÚC TỔNG THỂ HỆ THỐNG (SYSTEM ARCHITECTURE)
### 1. Phân tách mạng nội bộ (Network Isolation):
- **`hotel_net`:** Mạng ứng dụng kết nối Nginx, Node.js Web App, PostgreSQL và pgAdmin. CSDL được cô lập, không để lộ cổng trực tiếp ra Internet.
- **`monitor_net`:** Kênh thu thập telemetry độc lập kết nối Prometheus, Grafana, Loki và Promtail.

### 2. Luồng dữ liệu (Data Flow):
- `User/Client` ➔ `Nginx Reverse Proxy (Port 8443 HTTPS)` ➔ `Web App (Node.js Port 3000)` ➔ `PostgreSQL Database (Port 5432)`.
- `Prometheus` scrape định kỳ `/metrics` của ứng dụng.
- `Promtail` đọc file log từ Docker Daemon và đẩy về `Loki`.
- `Grafana` kết nối đồng thời Prometheus và Loki để hiển thị trực quan lên Dashboard.

---

## SLIDE 4: QUẢN LÝ MÃ NGUỒN VỚI GITHUB (TIÊU CHÍ 1 - 1.5 ĐIỂM)
- **Repository URL:** `https://github.com/dtc245200947-ui/dao-trong-duc-nhan`
- **Chủ sở hữu:** Đào Trọng Đức Nhân (`DTC245200947`)
- **Lịch sử Git commit chuẩn Conventional Commits có kèm MSSV:**
  - `c671ce8`: `feat: khoi tao du an dat phong khach san DTC245200947`
  - `4705f00`: `feat: tich hop postgres, nginx ssl va monitoring DTC245200947`
  - `5825b02`: `docs: cap nhat tai lieu kiem thu he thong DTC245200947`
- Cấu trúc thư mục chuẩn hóa: `app/`, `nginx/`, `prometheus/`, `loki/`, `docker-compose.yml`, `REPORT.md`.

---

## SLIDE 5: CƠ SỞ DỮ LIỆU POSTGRESQL & PGADMIN 4 (TIÊU CHÍ 2 - 1.5 ĐIỂM)
### 1. Cấu trúc CSDL `hotel_db`:
- **Bảng `rooms`:** Lưu trữ thông tin phòng, giá tiền và trạng thái phòng.
- **Bảng `customers`:** Lưu trữ danh sách khách hàng đặt phòng.
- **Bảng `bookings`:** Quản lý giao dịch đặt phòng, ngày nhận phòng và trạng thái.

### 2. Quản trị qua pgAdmin 4:
- Triển khai dịch vụ pgAdmin trên cổng `5050` bảo mật.
- Giám sát tình trạng CSDL trực quan: Server sessions, Transactions per second, Tuples in/out, Block I/O.
- *(Hình ảnh minh chứng: Dashboard pgAdmin 4)*

---

## SLIDE 6: NGINX REVERSE PROXY & BẢO MẬT HTTPS (TIÊU CHÍ 3 - 1.5 ĐIỂM)
### 1. Mã hóa HTTPS:
- Chứng chỉ SSL tự ký chuẩn x509 RSA 2048-bit bảo vệ đường truyền.
- Cổng dịch vụ chuẩn hóa: **Port 8443 (HTTPS)** ngăn chặn nghe lén thông tin khách hàng.

### 2. Bộ Security Headers phòng vệ:
- `X-Frame-Options: DENY` (Chống Clickjacking).
- `X-Content-Type-Options: nosniff` (Chống MIME-sniffing).
- `X-XSS-Protection: 1; mode=block` (Chống mã độc chéo trang XSS).
- `Strict-Transport-Security` (Bắt buộc dùng kênh truyền bảo mật HSTS).

---

## SLIDE 7: HỆ THỐNG GIÁM SÁT PROMETHEUS (TIÊU CHÍ 4 - PHẦN 1)
### 1. Thu thập dữ liệu hiệu năng:
- Endpoint ứng dụng: `/metrics` tích hợp thư viện Prometheus Client.
- Các chỉ số giám sát: Bộ nhớ (RAM Heap), CPU Usage, Tổng số yêu cầu HTTP, thời gian phản hồi API.

### 2. Trạng thái sức khỏe Target Health:
- `hotel-app`: Trạng thái **UP (1/1)** màu xanh lá.
- `prometheus`: Trạng thái **UP (1/1)** màu xanh lá.
- Đảm bảo hệ sinh thái không có điểm chết (zero downtime).
- *(Hình ảnh minh chứng: Màn hình Prometheus Target Health)*

---

## SLIDE 8: TRỰC QUAN HÓA SỐ LIỆU VỚI GRAFANA DASHBOARD (TIÊU CHÍ 4 - PHẦN 2)
### 1. Kết nối Datasource:
- Kết nối thông suốt với Prometheus server nội bộ Docker.

### 2. Thiết lập Dashboard:
- Xây dựng Time Series Panel trực quan hóa metric `up`.
- Biểu đồ đường thẳng liên tục tại giá trị `1`, chứng minh ứng dụng hoạt động ổn định và sẵn sàng phục vụ 100%.
- Kiểm tra truy vấn Explore Prometheus cho kết quả tức thì.
- *(Hình ảnh minh chứng: Grafana Edit Panel & Grafana Explore)*

---

## SLIDE 9: QUẢN LÝ LOG TẬP TRUNG LOKI & PROMTAIL (TIÊU CHÍ 5 - 1.5 ĐIỂM)
### 1. Luồng vận hành:
- Promtail bám sát Docker Daemon, gắn thẻ nhãn metadata `{container="hotel_app"}` và đẩy về Loki engine.
- Loki cấu hình lưu trữ TSDB Schema v13 thế hệ mới nhất, tối ưu tốc độ đọc ghi.

### 2. Truy vấn LogQL thời gian thực:
- Cú pháp truy vấn: `{container="hotel_app"}`
- Kết quả thu được:
  1. `INFO [db.js]: PostgreSQL connected successfully` (Kết nối CSDL thành công).
  2. `INFO [server.js]: Hotel booking application started on port 3000` (Khởi chạy ứng dụng).
  3. `POST /api/bookings HTTP/1.1 200 OK - Dat phong thanh cong` (Giao dịch đặt phòng thành công).
- *(Hình ảnh minh chứng: Màn hình Grafana Loki Explore)*

---

## SLIDE 10: TỔNG KẾT ĐÁNH GIÁ & HOÀN THÀNH ĐỒ ÁN (10/10 ĐIỂM)
### 1. Bảng đối chiếu 7 tiêu chí chấm điểm:
1. **GitHub Repository (1.5đ):** Đạt 100% (Repo công khai, 3 commits chuẩn kèm MSSV DTC245200947).
2. **Web App & PostgreSQL (1.5đ):** Đạt 100% (Đủ 3 hạng phòng, đặt chỗ, lưu khách hàng, có pgAdmin).
3. **Nginx HTTPS & Security (1.5đ):** Đạt 100% (SSL 8443, đầy đủ Security Headers).
4. **Prometheus & Grafana (1.5đ):** Đạt 100% (Targets UP 1/1, Dashboard trực quan).
5. **Loki & Promtail Logging (1.5đ):** Đạt 100% (Loki TSDB v13, truy vấn LogQL chi tiết).
6. **Hardening an toàn hệ thống (1.5đ):** Đạt 100% (Non-root user, phân tách 2 mạng).
7. **Báo cáo học thuật (1.0đ):** Đạt 100% (File REPORT.md chi tiết 10+ trang, 5 chương).
👉 **TỔNG KẾT:** **10.0 / 10.0 Điểm (XUẤT SẮC)**.

### 2. Lời cảm ơn:
- Chân thành cảm ơn Quý Thầy Cô trong Hội đồng chấm thi!
- Sinh viên: **Đào Trọng Đức Nhân - DTC245200947**.
