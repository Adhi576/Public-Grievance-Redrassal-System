'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('grievance_status_history', {
      history_id:   { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      grievance_id: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'grievances', key: 'grievance_id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      changed_by:   {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: true,
        references: { model: 'users', key: 'user_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      old_status:   { type: Sequelize.STRING(50), allowNull: true },
      new_status:   { type: Sequelize.STRING(50), allowNull: false },
      note:         { type: Sequelize.TEXT, allowNull: true },
      changed_at:   { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('grievance_status_history', ['grievance_id']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('grievance_status_history');
  },
};
