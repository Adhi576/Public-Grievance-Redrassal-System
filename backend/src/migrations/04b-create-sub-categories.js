'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sub_categories', {
      sub_category_id: { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      category_id:     {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'categories', key: 'category_id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      name:            { type: Sequelize.STRING(150), allowNull: false },
      description:     { type: Sequelize.TEXT, allowNull: true },
      is_active:       { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at:      { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at:      { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('sub_categories', ['category_id']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('sub_categories');
  },
};
