'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('audit_logs', {
      log_id:      { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      user_id:     {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: true,
        references: { model: 'users', key: 'user_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      action:      { type: Sequelize.STRING(100), allowNull: false },
      entity_type: { type: Sequelize.STRING(50), allowNull: true },
      entity_id:   { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      details:     { type: Sequelize.JSON, allowNull: true },
      ip_address:  { type: Sequelize.STRING(45), allowNull: true },
      timestamp:   { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('audit_logs', ['user_id']);
    await queryInterface.addIndex('audit_logs', ['entity_type', 'entity_id']);
    await queryInterface.addIndex('audit_logs', ['timestamp']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('audit_logs');
  },
};
