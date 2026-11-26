const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'movie_booking_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
};

// Enable SSL when connecting to AWS RDS MySQL in production
if (process.env.DB_SSL === 'true') {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = mysql.createPool(poolConfig);

module.exports = pool;
