# Hệ thống Đặt phòng Khách sạn (Hotel Booking System)
**Sinh viên thực hiện**: Đào Trọng Đức Nhân  
**MSSV**: DTC245200947  
**Đề số**: 06  

---

## 🚀 Công nghệ sử dụng
- **Backend & Frontend**: Node.js (Express), HTML5/CSS3/JavaScript (Khách sạn 34 tỉnh thành & 18 đường bay)
- **Database**: PostgreSQL 15 + pgAdmin 4
- **Reverse Proxy**: Nginx (Tự động chuyển hướng HTTPS, SSL Certificate, Security Headers)
- **Giám sát (Monitoring)**: Prometheus + Grafana (Dashboard tự động liên kết nguồn dữ liệu)
- **Nhật ký tập trung (Logging)**: Grafana Loki + Promtail (Thu thập Docker container logs)

---

## 🛠️ Hướng dẫn khởi động hệ thống

### Bước 1: Khởi động Docker Desktop
Hãy chắc chắn rằng ứng dụng **Docker Desktop** trên máy tính của bạn đã được mở và đang chạy.

### Bước 2: Chạy hệ thống bằng Docker Compose
Mở PowerShell hoặc Command Prompt tại thư mục dự án và chạy:
```bash
docker-compose up -d --build
```

Kiểm tra trạng thái các container:
```bash
docker-compose ps
```

---

## 🌐 Danh sách các dịch vụ & Đường dẫn truy cập

| Dịch vụ | Địa chỉ URL Truy cập | Tài khoản / Mật khẩu | Chức năng |
| :--- | :--- | :--- | :--- |
| **Website Đặt phòng** | **[http://localhost](http://localhost)** hoặc **[https://localhost](https://localhost)** | Đăng nhập tài khoản bất kỳ | Xem khách sạn 34 tỉnh thành, 18 đường bay, đặt phòng |
| **pgAdmin 4** | **[http://localhost:5050](http://localhost:5050)** | Email: `admin@admin.com`<br>Pass: `adminpassword` | Quản trị CSDL PostgreSQL |
| **Grafana** | **[http://localhost:3000](http://localhost:3000)** | User: `admin`<br>Pass: `admin` | Trực quan hóa Metrics & truy vấn Logs |
| **Prometheus** | **[http://localhost:9090](http://localhost:9090)** | Không cần mật khẩu | Kiểm tra chỉ số giám sát Time-series |
| **Loki Log API** | **[http://localhost:3100/ready](http://localhost:3100/ready)** | N/A | API máy chủ nhật ký tập trung |

---

## 📊 Truy vấn mẫu trong Grafana (Loki LogQL & Prometheus)

### 1. Prometheus Metrics:
- Tổng số request: `http_requests_total`
- Số phiên hoạt động: `app_active_sessions`

### 2. Loki LogQL (Vào Grafana -> Explore -> Chọn Loki):
- Xem log của ứng dụng:
  ```logql
  {container="hotel_app"}
  ```
- Lọc log lỗi toàn hệ thống:
  ```logql
  {container=~"hotel_.*"} |= "error"
  ```
- Xem nhật ký truy cập Nginx:
  ```logql
  {container="hotel_nginx"} |= "GET"
  ```

---

## 🛑 Dừng hệ thống
Để dừng toàn bộ dịch vụ:
```bash
docker-compose down
```
Để dừng và xóa sạch dữ liệu volume:
```bash
docker-compose down -v
```
