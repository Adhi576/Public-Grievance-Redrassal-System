'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reassignments', {
      reassignment_id: { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      grievance_id:    {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'grievances', key: 'grievance_id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      from_officer_id: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: true,
        references: { model: 'users', key: 'user_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      to_officer_id:   {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'users', key: 'user_id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      reason:          { type: Sequelize.TEXT, allowNull: true },
      reassigned_by:   {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'users', key: 'user_id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      reassigned_at:   { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('reassignments', ['grievance_id']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('reassignments');
  },
};
