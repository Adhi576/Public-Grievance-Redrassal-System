'use strict';

const CategoryService = require('../services/categoryService');
const { log } = require('../services/auditService');

exports.getAll = async (req, res, next) => {
  try {
    const cats = await CategoryService.getAll(req.query.department_id);
    res.json({ success: true, data: cats });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const cat = await CategoryService.create(req.body);
    await log(req.user.user_id, 'CREATE_CATEGORY', 'category', cat.category_id, null, req.ip);
    res.status(201).json({ success: true, data: cat });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const cat = await CategoryService.update(req.params.id, req.body);
    await log(req.user.user_id, 'UPDATE_CATEGORY', 'category', cat.category_id, null, req.ip);
    res.json({ success: true, data: cat });
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const cat = await CategoryService.update(req.params.id, { is_active: req.body.is_active });
    await log(req.user.user_id, 'UPDATE_CATEGORY_STATUS', 'category', cat.category_id, { is_active: req.body.is_active }, req.ip);
    res.json({ success: true, data: cat });
  } catch (err) {
    next(err);
  }
};

exports.createSubCategory = async (req, res, next) => {
  try {
    const subCat = await CategoryService.createSubCategory(req.params.id, req.body);
    await log(req.user.user_id, 'CREATE_SUBCATEGORY', 'subcategory', subCat.sub_category_id, null, req.ip);
    res.status(201).json({ success: true, data: subCat });
  } catch (err) {
    next(err);
  }
};

exports.updateSubCategory = async (req, res, next) => {
  try {
    const subCat = await CategoryService.updateSubCategory(req.params.subId, req.body);
    await log(req.user.user_id, 'UPDATE_SUBCATEGORY', 'subcategory', subCat.sub_category_id, null, req.ip);
    res.json({ success: true, data: subCat });
  } catch (err) {
    next(err);
  }
};

exports.updateSubCategoryStatus = async (req, res, next) => {
  try {
    const subCat = await CategoryService.updateSubCategory(req.params.subId, { is_active: req.body.is_active });
    await log(req.user.user_id, 'UPDATE_SUBCATEGORY_STATUS', 'subcategory', subCat.sub_category_id, { is_active: req.body.is_active }, req.ip);
    res.json({ success: true, data: subCat });
  } catch (err) {
    next(err);
  }
};
