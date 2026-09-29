'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reports', {
      report_id:    { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      report_type:  { type: Sequelize.ENUM('status','department','category','sla','escalation','resolution','closure'), allowNull: false },
      generated_by: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'users', key: 'user_id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      parameters:   { type: Sequelize.JSON, allowNull: true },
      generated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('reports');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_reports_report_type";');
  },
};
