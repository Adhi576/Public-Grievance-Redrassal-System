'use strict';

const { User } = require('../models');
const bcrypt = require('bcryptjs');

class UserService {
  static async getAllUsers(filters = {}) {
    return User.findAll({
      where: filters,
      attributes: { exclude: ['password_hash'] },
      order: [['created_at', 'DESC']]
    });
  }

  static async getUserById(userId) {
    const user = await User.findByPk(userId, { attributes: { exclude: ['password_hash'] } });
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
    return user;
  }

  static async createUser(data) {
    const { name, email, password, role, department_id, mobile } = data;
    const existing = await User.findOne({ where: { email } });
    if (existing) throw Object.assign(new Error('Email already registered'), { status: 400 });
    
    // Only citizens can self-register. Internal roles are made by admins, but this allows creating those.
    const password_hash = await bcrypt.hash(password, 12);
    return User.create({
      name, email, password_hash, role, department_id, mobile, is_active: true
    });
  }

  static async updateUser(userId, data) {
    const user = await this.getUserById(userId);
    // Don't update password here, handle separately if needed
    const { name, mobile, role, department_id } = data;
    await user.update({ name, mobile, role, department_id });
    return user;
  }

  static async changeStatus(userId, isActive) {
    const user = await this.getUserById(userId);
    await user.update({ is_active: isActive });
    return user;
  }
}

module.exports = UserService;
