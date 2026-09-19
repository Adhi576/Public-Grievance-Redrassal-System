'use strict';

const db = require('./src/models');

async function testAssociations() {
  try {
    await db.sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // Test a basic query using the new associations
    const grievance = await db.Grievance.findOne({
      include: [
        { model: db.SubCategory, as: 'subCategory' },
        { model: db.GrievanceAssignment, as: 'assignments' },
      ]
    });

    console.log('Association test passed!');
  } catch (error) {
    console.error('Unable to connect to the database or association error:', error);
    process.exit(1);
  } finally {
    await db.sequelize.close();
  }
}

testAssociations();
