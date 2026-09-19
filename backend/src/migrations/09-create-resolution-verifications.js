'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('resolution_verifications', {
      verification_id:  { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      resolution_id:    {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'resolutions', key: 'resolution_id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      citizen_id:       {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'users', key: 'user_id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      decision:         { type: Sequelize.ENUM('accepted','rejected'), allowNull: false },
      rejection_reason: { type: Sequelize.TEXT, allowNull: true },
      verified_at:      { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('resolution_verifications', ['resolution_id']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('resolution_verifications');
  },
};
