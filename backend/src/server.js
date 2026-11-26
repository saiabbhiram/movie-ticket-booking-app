const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const pool = require('./config/db');

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    await pool.query('SELECT 1');
    console.log('Connected to MySQL database successfully.');
  } catch (err) {
    console.warn('Warning: Initial MySQL connection check failed:', err.message);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CineBook API server running on port ${PORT}`);
  });
}

startServer();
