const mongoose = require('mongoose');
const Company = require('../models/Company');
const Experience = require('../models/Experience');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/askursenior';

const juspayData = {
  name: "Juspay",
  logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Juspay_logo.png/1200px-Juspay_logo.png",
  type: "Product"
};

const rawExps = [
  { id: "01", overview: ["Introduce yourself briefly", "Explain all projects on your resume", "About Langchain and how to use it", "Error handling questions at server based on real world example"], questions: ["Daily Temperature", "DP question", "Graph problem"] },
  { id: "02", overview: ["Introduction", "Projects explanation"], questions: ["Merging rain droplets and finding components"] },
  { id: "03", overview: ["Asked to optimise solution"], questions: ["One DSA question (optimization focused)"] },
  { id: "04", overview: ["Introduction", "Explanation about project", "OS (paging, deadlock, schedulers, threads)", "Network (UDP, TCP, DNS, NAT)"], questions: ["Graph problem", "Array problem"] },
  { id: "05", overview: ["Introduction", "Project explanation", "Hackathon question approach"], questions: ["Two sum"] },
  { id: "06", overview: ["Introduction"], questions: ["Permutation problem", "Graph problem"] },
  { id: "07", overview: ["Introduction", "Projects explanation"], questions: ["Subarray where endpoints are not max/min"] },
  { id: "08", overview: ["Introduction"], questions: ["Binary Tree Right Side View", "Restore IP Addresses"] },
  { id: "09", overview: ["Introduction"], questions: ["Graph problem"] },
  { id: "10", overview: ["Introduction"], questions: ["Largest rectangle in histogram (with negatives)"] },
  { id: "11", overview: ["Introduction"], questions: ["Most profitable path in a tree"] }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for Juspay seeding...');

    let company = await Company.findOne({ name: juspayData.name });
    if (!company) {
      company = await Company.create(juspayData);
      console.log('Created Company: Juspay');
    }

    for (const data of rawExps) {
      const experienceId = `Experience ${data.id}`;
      
      const alreadyAdded = await Experience.findOne({ 
        experienceId, 
        companyId: company._id 
      });

      if (!alreadyAdded) {
        await Experience.create({
          experienceId,
          companyId: company._id,
          role: "Software Development Engineer",
          batch: "2025",
          ctc: "24 LPA",
          difficulty: "Hard",
          upvotes: Math.floor(Math.random() * 30) + 10,
          rounds: [
            {
              roundNumber: 1,
              notes: data.overview,
              questions: data.questions.map(q => ({ text: q, solveLink: "" }))
            }
          ]
        });
        console.log(`Added: ${experienceId}`);
      }
    }

    console.log('Juspay seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
