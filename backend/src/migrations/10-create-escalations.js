'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('escalations', {
      escalation_id:       { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      grievance_id:        {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'grievances', key: 'grievance_id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      department_head_id:  {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: true,
        references: { model: 'users', key: 'user_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      escalated_by_system: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      escalated_at:        { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      resolved_at:         { type: Sequelize.DATE, allowNull: true },
      resolution_note:     { type: Sequelize.TEXT, allowNull: true },
    });
    await queryInterface.addIndex('escalations', ['grievance_id']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('escalations');
  },
};
