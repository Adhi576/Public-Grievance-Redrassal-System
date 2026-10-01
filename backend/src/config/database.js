'use strict';

const { Sequelize } = require('sequelize');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL || process.env.DB_URL;

// Determine dialect:
// 1. If DATABASE_URL is provided, infer from scheme (default postgres)
// 2. Otherwise use DB_DIALECT, or infer from DB_PORT (3306 -> mysql, 5432 -> postgres, default postgres)
let dialect = 'postgres';
if (databaseUrl) {
  if (databaseUrl.startsWith('mysql://')) {
    dialect = 'mysql';
  } else {
    dialect = 'postgres';
  }
} else if (process.env.DB_DIALECT) {
  dialect = process.env.DB_DIALECT.toLowerCase();
} else if (process.env.DB_PORT === '3306') {
  dialect = 'mysql';
}

// Determine if SSL is required (Supabase requires SSL; can be explicitly enabled with DB_SSL=true)
const isSslRequired = process.env.DB_SSL === 'true' ||
  (databaseUrl && (databaseUrl.includes('supabase') || databaseUrl.includes('sslmode=require'))) ||
  (process.env.DB_HOST && process.env.DB_HOST.includes('supabase'));

const dialectOptions = {};
if (dialect === 'postgres' && isSslRequired) {
  dialectOptions.ssl = {
    require: true,
    rejectUnauthorized: false,
  };
  dialectOptions.keepAlive = true;
}

let sequelize;

if (databaseUrl) {
  sequelize = new Sequelize(databaseUrl, {
    dialect,
    dialectOptions,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 2,
      acquire: 60000,
      idle: 10000,
    },
  });
} else {
  const defaultPort = dialect === 'mysql' ? 3306 : 5432;
  const port = parseInt(process.env.DB_PORT, 10) || defaultPort;

  sequelize = new Sequelize(
    process.env.DB_NAME || (dialect === 'postgres' ? 'postgres' : 'pgrs_db'),
    process.env.DB_USER || (dialect === 'postgres' ? 'postgres' : 'root'),
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST || 'localhost',
      port,
      dialect,
      dialectOptions,
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    }
  );
}

module.exports = sequelize;
