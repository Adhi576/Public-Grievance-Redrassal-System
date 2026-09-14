'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      user_id:       { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      name:          { type: Sequelize.STRING(100), allowNull: false },
      email:         { type: Sequelize.STRING(150), allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      role:          { type: Sequelize.ENUM('citizen','officer','department_head','administrator'), allowNull: false, defaultValue: 'citizen' },
      mobile:        { type: Sequelize.STRING(15), allowNull: true },
      department_id: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: true,
        references: { model: 'departments', key: 'department_id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      is_active:     { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at:    { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at:    { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['role']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
