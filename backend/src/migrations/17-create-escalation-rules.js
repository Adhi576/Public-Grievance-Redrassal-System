'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('escalation_rules', {
      rule_id:        { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      department_id:  {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: true, // If null, applies globally
        references: { model: 'departments', key: 'department_id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      category_id:    {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: true, // Optional specific category
        references: { model: 'categories', key: 'category_id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      priority:       { type: Sequelize.ENUM('low','medium','high'), allowNull: true }, // Optional specific priority
      sla_days:       { type: Sequelize.INTEGER, allowNull: false, defaultValue: 7 },
      is_active:      { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at:     { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at:     { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('escalation_rules', ['department_id']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('escalation_rules');
  },
};
