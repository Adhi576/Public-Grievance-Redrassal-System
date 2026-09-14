'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('feedback', {
      feedback_id:  { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      grievance_id: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false, unique: true,
        references: { model: 'grievances', key: 'grievance_id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      citizen_id:   {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'users', key: 'user_id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      rating:       { type: Sequelize.TINYINT.UNSIGNED, allowNull: false },
      comment:      { type: Sequelize.TEXT, allowNull: true },
      submitted_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('feedback');
  },
};
