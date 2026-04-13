const mongoose = require('mongoose');
require('dotenv').config();
const Company = require('../models/Company');
const Experience = require('../models/Experience');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Check Dish Company as a sample
    const company = await Company.findOne({ name: /Dish/i });
    if (!company) { console.log('Company not found'); return; }
    
    const exp = await Experience.findOne({ companyId: company._id });
    if (!exp) {
      console.log(`No experiences found for ${company.name}`);
    } else {
      console.log(`Sample experience for ${company.name}:`);
      console.log(`Role: ${exp.role}`);
      console.log(`Batch: ${exp.batch}`);
      console.log(`Rounds: ${exp.rounds.length}`);
      if (exp.rounds.length > 0) {
        console.log(`First round type: ${exp.rounds[0].type}`);
        console.log(`First round question count: ${exp.rounds[0].questions.length}`);
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
