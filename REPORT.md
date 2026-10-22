# BÁO CÁO BÀI TẬP LỚN / ĐỒ ÁN CHUYÊN ĐỀ
## ĐỀ TÀI: XÂY DỰNG & TRIỂN KHAI HỆ THỐNG ĐẶT PHÒNG KHÁCH SẠN AN TOÀN VỚI DOCKER, NGINX REVERSE PROXY, PROMETHEUS, GRAFANA VÀ LOKI

---

### THÔNG TIN SINH VIÊN VÀ ĐỀ TÀI
- **Họ và tên sinh viên**: Đào Trọng Đức Nhân
- **Mã số sinh viên (MSSV)**: DTC245200947
- **Đề số**: 06 - Hệ thống Đặt phòng Khách sạn
- **Môn học**: Quản trị Hệ thống & Công nghệ Triển khai Ứng dụng Cloud
- **Thời gian thực hiện**: Năm học 2025 - 2026

---

## MỤC LỤC
1. [CHƯƠNG 1: TỔNG QUAN VÀ MỤC TIÊU HỆ THỐNG](#chương-1-tổng-quan-và-mục-tiêu-hệ-thống)
2. [CHƯƠNG 2: KIẾN TRÚC TỔNG THỂ & THIẾT KẾ CƠ SỞ DỮ LIỆU](#chương-2-kiến-trúc-tổng-thể--thiết-kế-cơ-sở-dữ-liệu)
3. [CHƯƠNG 3: CẤU HÌNH NGINX REVERSE PROXY & HARDENING BẢO MẬT](#chương-3-cấu-hình-nginx-reverse-proxy--hardening-bảo-mật)
4. [CHƯƠNG 4: GIÁM SÁT HỆ THỐNG VỚI PROMETHEUS & GRAFANA](#chương-4-giám-sát-hệ-thống-với-prometheus--grafana)
5. [CHƯƠNG 5: QUẢN LÝ NHẬT KÝ TẬP TRUNG VỚI GRAFANA LOKI & PROMTAIL](#chương-5-quản-lý-nhật-ký-tập-trung-với-grafana-loki--promtail)
6. [CHƯƠNG 6: HƯỚNG DẪN CÀI ĐẶT, VẬN HÀNH & KIỂM THỬ HỆ THỐNG](#chương-6-hướng-dẫn-cài-đặt-vận-hành--kiểm-thử-hệ-thống)
7. [CHƯƠNG 7: KẾT LUẬN & HƯỚNG PHÁT TRIỂN](#chương-7-kết-luận--hướng-phát-triển)

---

## CHƯƠNG 1: TỔNG QUAN VÀ MỤC TIÊU HỆ THỐNG

### 1.1. Đặt vấn đề
Trong kỷ nguyên chuyển đổi số và công nghệ điện toán đám mây (Cloud Computing), các ứng dụng dịch vụ như thương mại điện tử, du lịch, và đặt phòng khách sạn trực tuyến đòi hỏi tính sẵn sàng cao (High Availability), khả năng mở rộng linh hoạt (Scalability), cùng với các tiêu chuẩn bảo mật nghiêm ngặt (Security Hardening).

Đề tài **"Hệ thống Đặt phòng Khách sạn (Đề 06)"** được triển khai nhằm mục tiêu giải quyết bài toán quản trị vận hành hạ tầng dịch vụ toàn diện (DevOps / SysAdmin), đóng gói ứng dụng bằng Docker Container, định tuyến lưu lượng bảo mật qua Nginx Reverse Proxy với chứng chỉ số SSL/TLS, tích hợp hệ sinh thái quan sát toàn diện (Observability) gồm Metric Monitoring (Prometheus + Grafana) và Centralized Logging (Loki + Promtail).

### 1.2. Mục tiêu đề tài
- **Đóng gói container hóa**: Toàn bộ hệ thống chạy đồng bộ thông qua Docker Compose, phân tách mạng nội bộ và cô lập dịch vụ.
- **Ứng dụng web đặt phòng hiện đại**: Cung cấp giao diện đặt phòng nghỉ dưỡng, khách sạn 34 tỉnh thành và 18 đường bay nội địa kết hợp kết nối cơ sở dữ liệu PostgreSQL.
- **Bảo mật và Tối ưu hóa**: Triển khai Nginx làm Reverse Proxy, chuyển hướng HTTP sang HTTPS, thiết lập SSL tự ký, cài đặt các Header bảo mật chống tấn công XSS, Clickjacking, MIME-sniffing.
- **Hệ thống Giám sát (Monitoring)**: Prometheus định kỳ thu thập chỉ số hiệu năng (Metrics) từ ứng dụng và hạ tầng, trực quan hóa trên Grafana Dashboard.
- **Hệ thống Quản lý Log tập trung**: Thu thập log thời gian thực từ các Docker container bằng Promtail gửi về Loki, hỗ trợ truy vấn nhanh bằng ngôn ngữ LogQL.

---

## CHƯƠNG 2: KIẾN TRÚC TỔNG THỂ & THIẾT KẾ CƠ SỞ DỮ LIỆU

### 2.1. Sơ đồ Kiến trúc Hệ thống
Hệ thống được thiết kế theo mô hình phân tầng hướng dịch vụ (Multi-tier Containerized Architecture):

```
                       [ TRÌNH DUYỆT KHÁCH HÀNG / USER ]
                                     |
                       HTTP (80) -> Chuyển hướng HTTPS (443)
                                     v
                       +---------------------------+
                       |    NGINX REVERSE PROXY    | (hotel_nginx)
                       |  - SSL Termination       |
                       |  - Security Headers       |
                       +-------------+-------------+
                                     |
                       Proxy Pass http://app:3000 (Mạng nội bộ hotel-net)
                                     v
                       +---------------------------+
                       |    NODE.JS WEB APP        | (hotel_app)
                       |  - RESTful APIs           |
                       |  - /metrics endpoint      |
                       +-------------+-------------+
                                     |
                                     v
                       +---------------------------+       +-------------------+
                       |    POSTGRESQL DATABASE    |<----->|      PGADMIN      |
                       |  - Port 5432              |       | - Cổng 5050       |
                       |  - Volume pgdata          |       +-------------------+
                       +---------------------------+
                                     ^
                                     |
    +--------------------------------+--------------------------------+
    |                                                                 |
    v                                                                 v
+-------------------------+                               +-------------------------+
|     PROMETHEUS          |                               |         PROMTAIL        |
|  - Cổng 9090            |                               |  - Thu thập Docker logs |
|  - Cào /metrics định kỳ |                               +------------+------------+
+------------+------------+                                            |
             |                                                         v
             |                                            +-------------------------+
             |                                            |          LOKI           |
             |                                            |  - Cổng 3100            |
             |                                            |  - Lưu trữ Log chuỗi    |
             |                                            +------------+------------+
             |                                                         |
             +-------------------->+--------------------+<-------------+
                                   |      GRAFANA       |
                                   |  - Cổng 3000       |
                                   |  - Dashboards      |
                                   |  - LogQL Explorer  |
                                   +--------------------+
```

### 2.2. Danh sách các Container Service trong hệ thống
| STT | Container Name | Dịch vụ / Công nghệ | Cổng Host | Vai trò chính |
| :---: | :--- | :--- | :---: | :--- |
| 1 | `hotel_nginx` | Nginx Alpine (Reverse Proxy) | `80`, `443` | Cổng đón traffic chính, SSL Termination, bảo mật Header |
| 2 | `hotel_app` | Node.js + Express + pg | `Nội bộ 3000` | Backend API, xử lý nghiệp vụ đặt phòng & phục vụ frontend |
| 3 | `hotel_postgres`| PostgreSQL 15 Alpine | `5432` | Hệ quản trị cơ sở dữ liệu quan hệ lưu trữ đơn đặt |
| 4 | `hotel_pgadmin` | pgAdmin 4 | `5050` | Giao diện đồ họa web quản trị CSDL PostgreSQL |
| 5 | `hotel_prometheus`| Prometheus Latest | `9090` | Thu thập (scrape) và lưu trữ time-series metrics |
| 6 | `hotel_grafana` | Grafana Latest | `3000` | Trực quan hóa dữ liệu chỉ số và khám phá logs |
| 7 | `hotel_loki` | Grafana Loki Latest | `3100` | Cơ sở dữ liệu lưu trữ nhật ký tập trung |
| 8 | `hotel_promtail`| Grafana Promtail Latest | `Nội bộ` | Shipper quét container log và đẩy (push) về Loki |

### 2.3. Thiết kế CSDL (Database Schema)
Cơ sở dữ liệu mang tên `hotel_db` chứa bảng chính `bookings`:
```sql
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    booking_code VARCHAR(50) NOT NULL UNIQUE,
    customer_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    service_name VARCHAR(150) NOT NULL,
    booking_date VARCHAR(50) NOT NULL,
    total_price VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'Đã xác nhận',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## CHƯƠNG 3: CẤU HÌNH NGINX REVERSE PROXY & HARDENING BẢO MẬT

### 3.1. Reverse Proxy và Tự động chuyển hướng SSL (HTTPS)
Nginx lắng nghe trên 2 cổng:
- **Port 80 (HTTP)**: Tự động phản hồi mã trạng thái `301 Moved Permanently` chuyển người dùng sang `https://$host$request_uri`.
- **Port 443 (HTTPS)**: Sử dụng cặp khóa mã hóa RSA 2048-bit (`cert.pem` và `key.pem`) thiết lập kênh truyền tin cậy bảo vệ dữ liệu nhạy cảm của khách hàng.

### 3.2. Cấu hình Hardening Security Headers
Nhằm đảm bảo an toàn cho ứng dụng theo chuẩn bảo mật OWASP, file `nginx.conf` được cấu hình các chỉ thị:
1. `X-Frame-Options "SAMEORIGIN"`: Chống tấn công Clickjacking bằng cách ngăn nhúng website vào thẻ `<iframe>` từ bên ngoài.
2. `X-XSS-Protection "1; mode=block"`: Kích hoạt bộ lọc chống tấn công Cross-Site Scripting trên trình duyệt cũ.
3. `X-Content-Type-Options "nosniff"`: Ngăn chặn tấn công khai thác kiểu nội dung MIME-sniffing.
4. `Referrer-Policy "strict-origin-when-cross-origin"`: Kiểm soát thông tin đường dẫn gốc khi điều hướng ra ngoài.
5. `Content-Security-Policy (CSP)`: Giới hạn các nguồn tài nguyên hợp lệ được phép tải vào trang.

---

## CHƯƠNG 4: GIÁM SÁT HỆ THỐNG VỚI PROMETHEUS & GRAFANA

### 4.1. Cơ chế hoạt động của Prometheus
Prometheus hoạt động theo cơ chế **Pull-based**: Định kỳ mỗi `5s` (`scrape_interval: 5s`), Prometheus gửi HTTP GET request đến các đích đăng ký trong file `prometheus.yml`:
- Scrape chính Prometheus: `localhost:9090`
- Scrape ứng dụng đặt phòng: `http://app:3000/metrics`

Tại ứng dụng Node.js, endpoint `/metrics` công bố các trường đo lường chuẩn Time-Series:
- `http_requests_total`: Đếm tổng số lượng request HTTP đã phục vụ.
- `app_active_sessions`: Theo dõi số phiên người dùng hiện hành đang tương tác.

### 4.2. Tích hợp Grafana tự động (Datasource Provisioning)
File cấu hình `grafana/provisioning/datasources/datasources.yml` tự động khởi tạo kết nối đến Prometheus và Loki ngay khi container khởi động, người quản trị không cần thao tác thêm nguồn dữ liệu thủ công:
- **Prometheus Datasource**: URL `http://prometheus:9090` (mặc định)
- **Loki Datasource**: URL `http://loki:3100`

---

## CHƯƠNG 5: QUẢN LÝ NHẬT KÝ TẬP TRUNG VỚI GRAFANA LOKI & PROMTAIL

### 5.1. Kiến trúc Centralized Logging
- **Promtail Daemon**: Đọc nhật ký từ socket `/var/run/docker.sock` và thư mục `/var/lib/docker/containers/`. Sau đó gán nhãn siêu dữ liệu (metadata labels: `container="hotel_app"`, `container="hotel_nginx"`,...) và chuyển tiếp qua giao thức HTTP POST đến Loki tại `http://loki:3100/loki/api/v1/push`.
- **Grafana Loki**: Lưu trữ các luồng log (Log streams) dưới dạng chỉ mục nhãn (Labels index) tối ưu dung lượng và tốc độ truy vấn vượt trội so với Elasticsearch truyền thống.

### 5.2. Các câu truy vấn LogQL thực tế phục vụ kiểm thử và giám sát
Trong Grafana -> Explore (chọn Datasource **Loki**):
1. **Truy vấn xem toàn bộ log ứng dụng đặt phòng**:
   ```logql
   {container="hotel_app"}
   ```
2. **Truy vấn tìm kiếm log lỗi trong hệ thống**:
   ```logql
   {container=~"hotel_.*"} |= "error"
   ```
3. **Truy vấn thống kê lưu lượng Nginx Reverse Proxy**:
   ```logql
   {container="hotel_nginx"} |= "GET"
   ```

---

## CHƯƠNG 6: HƯỚNG DẪN CÀI ĐẶT, VẬN HÀNH & KIỂM THỬ HỆ THỐNG

### 6.1. Hướng dẫn khởi động hệ thống
1. Đảm bảo ứng dụng **Docker Desktop** trên máy tính đang chạy (Trạng thái Engine Running màu xanh).
2. Mở cửa sổ dòng lệnh PowerShell hoặc Terminal tại thư mục dự án:
   ```powershell
   cd "C:\Users\DUC NHAN\OneDrive\Desktop\dtc245200947"
   ```
3. Khởi chạy toàn bộ hệ thống bằng một câu lệnh:
   ```powershell
   docker-compose up -d --build
   ```
4. Kiểm tra trạng thái các container đang chạy:
   ```powershell
   docker-compose ps
   ```

### 6.2. Danh mục URL và Thông tin đăng nhập các dịch vụ
| Dịch vụ | Địa chỉ URL Truy cập | Tài khoản / Mật khẩu | Chức năng kiểm thử |
| :--- | :--- | :--- | :--- |
| **Website Đặt phòng** | `http://localhost` (hoặc `https://localhost`) | Đăng nhập tài khoản khách: bất kỳ | Đặt phòng 34 tỉnh, chọn 18 đường bay |
| **pgAdmin Web** | `http://localhost:5050` | Email: `admin@admin.com`<br>Pass: `adminpassword` | Quản trị CSDL PostgreSQL, xem bảng `bookings` |
| **Grafana Monitoring**| `http://localhost:3000` | User: `admin`<br>Pass: `admin` | Xem Dashboard chỉ số và truy vấn LogQL |
| **Prometheus Dashboard**| `http://localhost:9090` | Không yêu cầu mật khẩu | Kiểm tra Targets, gõ thử `http_requests_total` |
| **Loki API** | `http://localhost:3100/ready` | N/A | Trả về chuỗi `ready` xác nhận dịch vụ log khỏe mạnh |

### 6.3. Kịch bản kiểm thử (Test Cases)
1. **Kiểm tra chuyển hướng HTTPS**:
   - Mở trình duyệt gõ: `http://localhost`
   - Quan sát trình duyệt tự động chuyển hướng sang `https://localhost`. Do dùng chứng chỉ SSL tự ký cho môi trường phát triển (self-signed), chọn *Advanced* -> *Proceed to localhost*.
2. **Kiểm tra cơ chế Lưu trữ Đặt phòng vào CSDL**:
   - Đăng nhập tài khoản trên giao diện web.
   - Chọn một tour khách sạn hoặc vé máy bay, bấm "Đặt Phòng", điền thông tin và xác nhận.
   - Truy cập pgAdmin tại `http://localhost:5050`, kết nối server CSDL (Host: `postgres`, DB: `hotel_db`, User: `postgres`, Pass: `secretpassword`), xem bảng `bookings` ghi nhận bản ghi mới.
3. **Kiểm tra Metrics trên Prometheus & Grafana**:
   - Truy cập `http://localhost:9090/targets` -> Cả hai target `prometheus` và `hotel-app` đều ở trạng thái `UP` (màu xanh).
4. **Kiểm tra LogQL trên Grafana Explore**:
   - Vào `http://localhost:3000` -> Explore -> Chọn **Loki** -> Nhập `{container="hotel_app"}` -> Bấm *Run query* -> Toàn bộ nhật ký khởi động và API calls hiển thị chi tiết.

---

## CHƯƠNG 7: KẾT LUẬN & HƯỚNG PHÁT TRIỂN

### 7.1. Kết quả đạt được
- Đã hoàn thành 100% các tiêu chí kỹ thuật theo yêu cầu đề bài Đề số 06 (MSSV: DTC245200947).
- Hệ thống hoạt động ổn định, mượt mà, phân tách container độc lập và chuẩn hóa bảo mật.
- Hệ sinh thái giám sát và ghi log tập trung hiện đại, đáp ứng tốt tiêu chuẩn quản trị hệ thống cloud thực tế.

### 7.2. Hướng phát triển
- Tích hợp thêm các bộ cảnh báo (Alertmanager) gửi thông báo qua Telegram / Slack khi container gặp sự cố hoặc CPU vượt ngưỡng.
- Nâng cấp hệ thống chứng chỉ số Let's Encrypt tự động cấp phát khi đưa ứng dụng lên tên miền chính thức trên Internet.
- Triển khai mô hình cụm Kubernetes (K8s) cho phép tự động co giãn tải (Auto-scaling).

