'use strict';

const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const storageDir = process.env.UPLOAD_PATH || './uploads';

// Ensure base upload dir exists
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

const getGrievanceDir = (req) => {
  const baseId = req.params.id || req.body.grievance_id || 'temp';
  const dest = path.join(storageDir, 'grievances', String(baseId));
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  return dest;
};

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    cb(null, getGrievanceDir(req));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = crypto.randomUUID() + path.extname(file.originalname);
    cb(null, uniqueSuffix);
  }
});

const fileFilter = (_req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/gif',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(Object.assign(new Error('Invalid file type'), { status: 400 }), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: fileFilter
});

module.exports = upload;
