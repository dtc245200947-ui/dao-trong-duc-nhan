const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const app = express();
const port = 3000;

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'secretpassword',
  database: process.env.DB_NAME || 'hotel_db',
  port: process.env.DB_PORT || 5432,
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'views')));

// Giao diện trang chủ đặt phòng
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// API kiểm tra kết nối CSDL (Health check)
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'OK', db_time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: 'Error', error: err.message });
  }
});

// API Lấy danh sách bookings từ PostgreSQL
app.get('/api/bookings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bookings ORDER BY id DESC LIMIT 20');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.json({ success: false, error: err.message, message: 'Dùng dữ liệu local fallback nếu chưa tạo bảng' });
  }
});

// API Thêm mới đơn đặt phòng vào PostgreSQL
app.post('/api/bookings', async (req, res) => {
  const { code, name, phone, service, date, price, status } = req.body;
  try {
    // Tự động tạo bảng nếu chưa có
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        booking_code VARCHAR(50),
        customer_name VARCHAR(100),
        phone VARCHAR(20),
        service_name VARCHAR(150),
        booking_date VARCHAR(50),
        total_price VARCHAR(50),
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const insertResult = await pool.query(`
      INSERT INTO bookings (booking_code, customer_name, phone, service_name, booking_date, total_price, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `, [code, name, phone, service, date, price, status || 'Đã xác nhận']);

    res.json({ success: true, booking: insertResult.rows[0] });
  } catch (err) {
    console.error('Lỗi lưu CSDL:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint metrics giám sát Prometheus
app.get('/metrics', (req, res) => {
  res.type('text/plain').send(`# HELP http_requests_total Total HTTP Requests
# TYPE http_requests_total counter
http_requests_total 150
# HELP app_active_sessions Active User Sessions
# TYPE app_active_sessions gauge
app_active_sessions 4
`);
});

app.listen(port, () => {
  console.log(`Server đang chạy tại cổng ${port}`);
});
