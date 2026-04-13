const mongoose = require('mongoose');
require('dotenv').config();
const Company = require('../models/Company');
const Experience = require('../models/Experience');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const ms = await Company.findOne({ name: /Morgan Stanley/i });
    if (!ms) { console.log('MS not found'); return; }
    
    const exps = await Experience.find({ companyId: ms._id });
    console.log(`Found ${exps.length} experiences for Morgan Stanley:`);
    exps.forEach(e => {
        console.log(`- Role: "${e.role}", Batch: "${e.year || e.batch}"`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
