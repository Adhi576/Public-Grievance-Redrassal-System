'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('attachments', {
      attachment_id:   { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      grievance_id:    {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'grievances', key: 'grievance_id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      file_name:       { type: Sequelize.STRING(255), allowNull: false },
      stored_name:     { type: Sequelize.STRING(255), allowNull: false },
      file_path:       { type: Sequelize.STRING(512), allowNull: false },
      file_type:       { type: Sequelize.STRING(100), allowNull: false },
      file_size:       { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      attachment_type: { type: Sequelize.ENUM('citizen_document','resolution_proof'), allowNull: false, defaultValue: 'citizen_document' },
      uploaded_by:     {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'users', key: 'user_id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      uploaded_at:     { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('attachments', ['grievance_id']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('attachments');
  },
};
