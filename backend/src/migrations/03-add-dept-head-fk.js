'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add FK from departments.head_user_id → users.user_id (deferred after users table exists)
    await queryInterface.addConstraint('departments', {
      fields: ['head_user_id'],
      type: 'foreign key',
      name: 'fk_departments_head_user',
      references: { table: 'users', field: 'user_id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },
  async down(queryInterface) {
    await queryInterface.removeConstraint('departments', 'fk_departments_head_user');
  },
};
