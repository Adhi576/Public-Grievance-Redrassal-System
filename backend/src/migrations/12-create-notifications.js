'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      notification_id: { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      user_id:         {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'users', key: 'user_id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      message:         { type: Sequelize.TEXT, allowNull: false },
      type:            { type: Sequelize.STRING(50), allowNull: true },
      grievance_id:    {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: true,
        references: { model: 'grievances', key: 'grievance_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      is_read:         { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at:      { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('notifications', ['user_id', 'is_read']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
  },
};
