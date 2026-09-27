# Hệ thống Đặt phòng Khách sạn

## Công nghệ sử dụng
- **Backend**: Node.js (Express)
- **Database**: PostgreSQL + pgAdmin
- **Reverse Proxy**: Nginx (với SSL và Security Hardening)
- **Giám sát**: Prometheus, Grafana, Loki, Promtail

## Cách chạy dự án
1. Clone mã nguồn về máy.
2. Mở terminal tại thư mục gốc và chạy lệnh:
   ```bash
   docker-compose up --build -d