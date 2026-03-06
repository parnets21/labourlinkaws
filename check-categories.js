/**
 * Check categories and their industry relationships
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('./Config/database');

async function checkCategories() {
  try {
    await connectDB();
    
    const Category = require('./Model/Admin/jobmanagment/Category');
    const Industry = require('./Model/Admin/jobmanagment/industrymanagment');
    const SubCategory = require('./Model/Admin/jobmanagment/SubCategory');

    console.log('📊 Database Analysis\n');

    // Get all industries
    const industries = await Industry.find({ isActive: true });
    console.log(`✅ Total Industries: ${industries.length}\n`);

    // Get all categories
    const categories = await Category.find({ isActive: true }).populate('industryId', 'industryName');
    console.log(`✅ Total Categories: ${categories.length}`);
    
    const categoriesWithIndustry = categories.filter(c => c.industryId);
    const categoriesWithoutIndustry = categories.filter(c => !c.industryId);
    
    console.log(`   - With Industry: ${categoriesWithIndustry.length}`);
    console.log(`   - Without Industry: ${categoriesWithoutIndustry.length}\n`);

    // Get all subcategories
    const subCategories = await SubCategory.find({ isActive: true })
      .populate('industryId', 'industryName')
      .populate('categoryId', 'categoryName');
    
    console.log(`✅ Total Job Roles (SubCategories): ${subCategories.length}`);
    
    const subCategoriesWithBoth = subCategories.filter(s => s.industryId && s.categoryId);
    const subCategoriesWithoutIndustry = subCategories.filter(s => !s.industryId);
    const subCategoriesWithoutCategory = subCategories.filter(s => !s.categoryId);
    
    console.log(`   - With Industry & Category: ${subCategoriesWithBoth.length}`);
    console.log(`   - Without Industry: ${subCategoriesWithoutIndustry.length}`);
    console.log(`   - Without Category: ${subCategoriesWithoutCategory.length}\n`);

    // Show breakdown by industry
    console.log('📋 Breakdown by Industry:\n');
    for (const industry of industries.slice(0, 10)) {
      const industryCategories = await Category.countDocuments({ 
        industryId: industry._id, 
        isActive: true 
      });
      const industryJobRoles = await SubCategory.countDocuments({ 
        industryId: industry._id, 
        isActive: true 
      });
      
      console.log(`   ${industry.industryName}`);
      console.log(`   └─ Categories: ${industryCategories}`);
      console.log(`   └─ Job Roles: ${industryJobRoles}\n`);
    }

    // Show categories without industry
    if (categoriesWithoutIndustry.length > 0) {
      console.log('⚠️  Categories without Industry assignment:');
      categoriesWithoutIndustry.slice(0, 10).forEach(c => {
        console.log(`   - ${c.categoryName} (ID: ${c._id})`);
      });
      console.log('\n💡 These categories need to be assigned to an industry!\n');
    }

    // Show subcategories without proper relationships
    if (subCategoriesWithoutIndustry.length > 0 || subCategoriesWithoutCategory.length > 0) {
      console.log('⚠️  Job Roles with missing relationships:');
      if (subCategoriesWithoutIndustry.length > 0) {
        console.log(`   - ${subCategoriesWithoutIndustry.length} without Industry`);
      }
      if (subCategoriesWithoutCategory.length > 0) {
        console.log(`   - ${subCategoriesWithoutCategory.length} without Category`);
      }
      console.log('\n💡 These job roles need proper industry and category assignments!\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkCategories();
