const mongoose = require('mongoose');
require('dotenv').config();
const Company = require('../models/Company');
const Experience = require('../models/Experience');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');
    
    const companies = await Company.find();
    console.log(`Found ${companies.length} companies.`);
    
    for (const company of companies) {
      const count = await Experience.countDocuments({ companyId: company._id });
      console.log(`- ${company.name}: ${count} experiences`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

test();
