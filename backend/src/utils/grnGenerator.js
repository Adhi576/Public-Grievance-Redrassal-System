'use strict';

const crypto = require('crypto');

/**
 * Generates a unique Grievance Reference Number (GRN).
 * Format: PGRS-YYYYMMDD-XXXX
 */
exports.generateGRN = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // 4 random uppercase alphanumeric characters
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();

  return `PGRS-${year}${month}${day}-${random}`;
};
