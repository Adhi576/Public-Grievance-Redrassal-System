'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('grievance_assignments', {
      assignment_id: { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      grievance_id:  {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'grievances', key: 'grievance_id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      officer_id:    {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'users', key: 'user_id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      assigned_by:   {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: true,
        references: { model: 'users', key: 'user_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      assigned_at:   { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      unassigned_at: { type: Sequelize.DATE, allowNull: true },
      reason:        { type: Sequelize.TEXT, allowNull: true },
    });
    await queryInterface.addIndex('grievance_assignments', ['grievance_id']);
    await queryInterface.addIndex('grievance_assignments', ['officer_id']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('grievance_assignments');
  },
};
