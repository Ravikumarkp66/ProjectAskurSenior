const mongoose = require('mongoose');
const Company = require('../models/Company');
const Experience = require('../models/Experience');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/askursenior';

const tallyData = {
  name: "Tally Solutions",
  logo: "https://upload.wikimedia.org/wikipedia/en/thumb/1/1d/Tally_Solutions_Logo.svg/1200px-Tally_Solutions_Logo.svg.png",
  type: "Product"
};

const rawExps = [
  { id: "01", overview: ["Questions about projects", "Difference between SQL and nosql(mangodb)", "Oops concepts", "Diff b/w DBMS and traditional file system"], questions: ["Return strings which are matching"] },
  { id: "02", overview: ["Dbms related(in mongodb how the data is stored)", "More about the projects", "Difference bw sql and nosql"], questions: ["Convert integer to binary and count number of 1’s", "Validate string like <a><b><b></a> (missing closing tag detection)"] },
  { id: "03", overview: ["Hash mapping"], questions: [] },
  { id: "04", overview: ["Heap and stack memory"], questions: [] },
  { id: "05", overview: ["About project tech stack", "Deadlock conditions", "Stack and heap memory"], questions: ["Valid parentheses", "Second greater element in BST"] },
  { id: "06", overview: ["OS - deadlock", "Puzzle questions", "Time and space complexities"], questions: ["Valid parentheses", "Reverse string", "Detect loop in linked list"] },
  { id: "07", overview: ["Behavioral question", "About project", "Which language is better (c, cpp, python)", "About Nosql", "Puzzle"], questions: ["Left view of binary tree"] },
  { id: "08", overview: ["Difference between new and malloc", "System designing"], questions: ["Return kth node from last", "String to integer", "Bit manipulation"] },
  { id: "09", overview: ["Project discussions", "Puzzle", "CN: Protocol suite and collision techniques"], questions: ["Merge sort", "Convert decimal to binary and count set bits"] },
  { id: "10", overview: ["Scenario based DBMS questions", "Nosql and sql difference", "Client server architecture", "Behavioral question"], questions: ["Merge and sort two arrays", "Border sum of matrix"] }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for Tally seeding...');

    let company = await Company.findOne({ name: tallyData.name });
    if (!company) {
      company = await Company.create(tallyData);
      console.log('Created Company: Tally Solutions');
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
          ctc: "Role Based",
          difficulty: "Medium",
          upvotes: Math.floor(Math.random() * 20),
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

    console.log('Tally seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
