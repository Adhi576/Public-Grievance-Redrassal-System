'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('departments', {
      department_id: { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      name:          { type: Sequelize.STRING(150), allowNull: false, unique: true },
      head_user_id:  { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      sla_days:      { type: Sequelize.INTEGER, allowNull: false, defaultValue: 7 },
      description:   { type: Sequelize.TEXT, allowNull: true },
      is_active:     { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at:    { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at:    { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('departments');
  },
};
