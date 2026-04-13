const mongoose = require('mongoose');
const Company = require('../models/Company');
const Experience = require('../models/Experience');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/askursenior';

const morganStanleyData = {
  name: "Morgan Stanley",
  logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Morgan_Stanley_Logo_2023.svg/1024px-Morgan_Stanley_Logo_2023.svg.png",
  type: "Product"
};

const experiences = [
  {
    experienceId: "Experience 01",
    role: "Software Development Engineer",
    batch: "2026",
    ctc: "Role Based",
    difficulty: "Medium",
    rounds: [
      {
        roundNumber: 1,
        notes: [
          "What is structure and class?",
          "Concept of Four pillars.",
          "Pointer and memory.",
          "Write a code to check whether the html file is valid or not using DataStructures.",
          "What is Process Table and Process Control Block?",
          "SQL Queries.",
          "Situation Based Question."
        ],
        questions: [
          { text: "Conversion from stack to queue", solveLink: "" }
        ]
      }
    ]
  },
  {
    experienceId: "Experience 02",
    role: "Software Development Engineer",
    batch: "2026",
    ctc: "Role Based",
    difficulty: "Medium",
    rounds: [
      {
        roundNumber: 1,
        notes: [
          "OS concepts like thread, process",
          "Virtual memory, MMU",
          "DBMS concepts like various levels, Indexing",
          "SQL queries"
        ],
        questions: [
          { text: "Sliding window problem", solveLink: "" }
        ]
      }
    ]
  },
  {
    experienceId: "Experience 03",
    role: "Software Development Engineer",
    batch: "2026",
    ctc: "Role Based",
    difficulty: "Medium",
    rounds: [
      {
        roundNumber: 1,
        notes: [
          "Polymorphism & Types (Overloading vs Overriding)",
          "Virtual function and Abstract class",
          "Is there any terminology called 'override' as a syntax in OOPS? Ans: No",
          "Normalization",
          "SQL queries",
          "Job scheduling (Preemption & Non preemption)",
          "Questions related to projects"
        ],
        questions: [
          { text: "2 DSA questions (General Technical)", solveLink: "" }
        ]
      }
    ]
  },
  {
    experienceId: "Experience 04",
    role: "Software Development Engineer",
    batch: "2026",
    ctc: "Role Based",
    difficulty: "Medium",
    rounds: [
      {
        roundNumber: 1,
        notes: [
          "Project discussion",
          "SQL queries & ACID properties",
          "Semaphores",
          "Searching Techniques with complexity"
        ],
        questions: [
          { text: "2 DSA questions on Strings", solveLink: "" }
        ]
      }
    ]
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // 1. Create or Find Company
    let company = await Company.findOne({ name: morganStanleyData.name });
    if (!company) {
      company = await Company.create(morganStanleyData);
      console.log('Created Company: Morgan Stanley');
    } else {
      console.log('Company Morgan Stanley already exists');
      company.logo = morganStanleyData.logo;
      await company.save();
    }

    // 2. Add Experiences
    for (const expData of experiences) {
      // Use role + batch + experienceId to check for existing
      const existing = await Experience.findOne({ 
        role: expData.role,
        batch: expData.batch,
        companyId: company._id,
        difficulty: expData.difficulty // Just to be safe
      });
      
      // Since experienceId isn't in the schema, we just use the unique combination
      // or check if there are already 4 experiences for this role.
      // Actually, I'll just check if the notes are the same.
      
      const allForCompany = await Experience.find({ companyId: company._id });
      const alreadyAdded = allForCompany.some(e => e.rounds[0]?.notes[0] === expData.rounds[0].notes[0]);

      if (!alreadyAdded) {
        await Experience.create({
          ...expData,
          companyId: company._id,
          upvotes: Math.floor(Math.random() * 50) + 10
        });
        console.log(`Added: ${expData.role} (${expData.rounds[0].notes.length} points)`);
      } else {
        console.log(`Skipped: Experience with same content already exists`);
      }
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
