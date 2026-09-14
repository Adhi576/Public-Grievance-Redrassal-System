'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('resolutions', {
      resolution_id:          { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      grievance_id:           {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'grievances', key: 'grievance_id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      officer_id:              {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'users', key: 'user_id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      resolution_description: { type: Sequelize.TEXT, allowNull: false },
      action_taken:           { type: Sequelize.TEXT, allowNull: false },
      remarks:                { type: Sequelize.TEXT, allowNull: true },
      submitted_at:           { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('resolutions', ['grievance_id']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('resolutions');
  },
};
