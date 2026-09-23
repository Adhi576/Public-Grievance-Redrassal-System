const sequelize = require('./src/config/database');
const { Department, Category, SubCategory, User } = require('./src/models');

async function checkDb() {
  try {
    const deptCount = await Department.count();
    const catCount = await Category.count();
    const subCatCount = await SubCategory.count();
    const userCount = await User.count();
    
    console.log(`Departments: ${deptCount}`);
    console.log(`Categories: ${catCount}`);
    console.log(`SubCategories: ${subCatCount}`);
    console.log(`Users: ${userCount}`);

    if (deptCount > 0 && catCount > 0 && subCatCount > 0) {
      const depts = await Department.findAll({ raw: true });
      const cats = await Category.findAll({ raw: true });
      const subCats = await SubCategory.findAll({ raw: true });
      console.log('Departments:', JSON.stringify(depts, null, 2));
      console.log('Categories:', JSON.stringify(cats, null, 2));
      console.log('SubCategories:', JSON.stringify(subCats, null, 2));
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkDb();
