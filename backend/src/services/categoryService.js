'use strict';

const { Category, Department, SubCategory } = require('../models');

class CategoryService {
  static async getAll(department_id = null) {
    const where = department_id ? { department_id } : {};
    return Category.findAll({
      where,
      include: [
        { model: Department, as: 'department', attributes: ['name', 'sla_days'] },
        { model: SubCategory, as: 'subCategories', attributes: ['sub_category_id', 'name'] }
      ],
      order: [['name', 'ASC']]
    });
  }

  static async create(data) {
    const { name, department_id, description } = data;
    return Category.create({ name, department_id, description });
  }

  static async update(id, data) {
    const cat = await Category.findByPk(id);
    if (!cat) throw Object.assign(new Error('Category not found'), { status: 404 });
    const { name, department_id, description, is_active } = data;
    await cat.update({ name, department_id, description, is_active });
    return cat;
  }
}

module.exports = CategoryService;
