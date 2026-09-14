'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('categories', {
      category_id:   { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      name:          { type: Sequelize.STRING(150), allowNull: false },
      department_id: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'departments', key: 'department_id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      description:   { type: Sequelize.TEXT, allowNull: true },
      is_active:     { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at:    { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at:    { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('categories', ['department_id']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('categories');
  },
};
