const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const app = express();
const port = 3000;

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Giao diện trang chủ đặt phòng
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// API kiểm tra kết nối CSDL
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'OK', db_time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: 'Error', error: err.message });
  }
});

app.get('/metrics', (req,res)=>res.type('text/plain').send('# HELP http_requests_total Total
# TYPE http_requests_total counter
http_requests_total 150
')); app.listen(port, () => {
  console.log(`Server đang chạy tại cổng ${port}`);
});
