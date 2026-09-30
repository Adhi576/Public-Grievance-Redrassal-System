'use strict';

const { Category, Department, SubCategory } = require('../models');

class CategoryService {
  static async getAll(department_id = null) {
    const where = department_id ? { department_id } : {};
    return Category.findAll({
      where,
      include: [
        { model: Department, as: 'department', attributes: ['department_id', 'name', 'sla_days'] },
        { model: SubCategory, as: 'subCategories', attributes: ['sub_category_id', 'category_id', 'name', 'description', 'is_active'] }
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
    await cat.update({
      ...(name !== undefined && { name }),
      ...(department_id !== undefined && { department_id }),
      ...(description !== undefined && { description }),
      ...(is_active !== undefined && { is_active })
    });
    return cat;
  }

  static async createSubCategory(categoryId, data) {
    const cat = await Category.findByPk(categoryId);
    if (!cat) throw Object.assign(new Error('Parent Category not found'), { status: 404 });
    const { name, description } = data;
    return SubCategory.create({ category_id: categoryId, name, description, is_active: true });
  }

  static async updateSubCategory(subCategoryId, data) {
    const subCat = await SubCategory.findByPk(subCategoryId);
    if (!subCat) throw Object.assign(new Error('SubCategory not found'), { status: 404 });
    const { name, description, is_active } = data;
    await subCat.update({
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(is_active !== undefined && { is_active })
    });
    return subCat;
  }
}

module.exports = CategoryService;
