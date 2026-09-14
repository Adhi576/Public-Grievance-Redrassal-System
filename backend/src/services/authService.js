'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

class AuthService {
  static async registerCitizen(data) {
    const { name, email, password, mobile } = data;
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      throw Object.assign(new Error('Email already registered'), { status: 400 });
    }
    const password_hash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      password_hash,
      role: 'citizen',
      mobile,
      is_active: true,
    });
    return user;
  }

  static async login(email, password) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    }
    if (!user.is_active) {
      throw Object.assign(new Error('Account inactive'), { status: 403 });
    }
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    }
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role, department_id: user.department_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    return { token, user: { user_id: user.user_id, name: user.name, email: user.email, role: user.role } };
  }
}

module.exports = AuthService;
