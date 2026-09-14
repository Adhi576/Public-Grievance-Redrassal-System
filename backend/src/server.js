'use strict';

const http = require('http');
const app = require('./app');
const sequelize = require('./config/database');
const { startSlaMonitor } = require('./jobs/slaMonitorJob');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    const server = http.createServer(app);
    server.listen(PORT, () => {
      console.log(`PGRS backend running on port ${PORT} (${process.env.NODE_ENV})`);
    });

    // Start SLA monitoring job (runs every hour)
    startSlaMonitor();

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        sequelize.close();
        process.exit(0);
      });
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
