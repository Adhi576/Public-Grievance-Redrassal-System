'use strict';

const STATUSES = ['SUBMITTED','UNDER_REVIEW','ASSIGNED','IN_PROGRESS','ESCALATED','RESOLVED','PENDING_CITIZEN_VERIFICATION','PENDING_CLOSURE_APPROVAL','REOPENED','CLOSED'];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('grievances', {
      grievance_id:  { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      grn:           { type: Sequelize.STRING(30), allowNull: false, unique: true },
      title:         { type: Sequelize.STRING(255), allowNull: false },
      description:   { type: Sequelize.TEXT, allowNull: false },
      sub_category_id: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'sub_categories', key: 'sub_category_id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      department_id: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'departments', key: 'department_id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      citizen_id:    {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'users', key: 'user_id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      location:      { type: Sequelize.STRING(255), allowNull: true },
      current_status:{ type: Sequelize.ENUM(...STATUSES), allowNull: false, defaultValue: 'SUBMITTED' },
      priority:      { type: Sequelize.ENUM('low','medium','high'), allowNull: false, defaultValue: 'medium' },
      sla_due_date:  { type: Sequelize.DATE, allowNull: true },
      assigned_at:   { type: Sequelize.DATE, allowNull: true },
      resolved_at:   { type: Sequelize.DATE, allowNull: true },
      closed_at:     { type: Sequelize.DATE, allowNull: true },
      created_at:    { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at:    { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('grievances', ['citizen_id']);
    await queryInterface.addIndex('grievances', ['department_id']);
    await queryInterface.addIndex('grievances', ['current_status']);
    await queryInterface.addIndex('grievances', ['sla_due_date']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('grievances');
  },
};
