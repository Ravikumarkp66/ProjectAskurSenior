const mongoose = require('mongoose');
const Company = require('../models/Company');
const Experience = require('../models/Experience');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/askursenior';

const redbusData = {
  name: "redBus",
  logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Redbus_logo.png/1200px-Redbus_logo.png",
  type: "Product"
};

const rawExps = [
  { id: "01", overview: ["Introduce yourself and highlight the technical skills", "Question based on your contribution to projects", "MongoDb query", "Sql query", "Concepts of OOPs and code of it", "A puzzle question"], questions: ["Find two adjacent elements of an array which gives the maximum sum"] },
  { id: "02", overview: ["Introduction", "Project details", "Tech stack used", "API and types", "OOPs concepts", "Types of sorting", "SQL queries (basics)", "Puzzles"], questions: ["Find largest element in array", "Prime numbers between 1 to n", "Sorting", "Reverse a string"] },
  { id: "03", overview: ["Introduction", "OOPS", "Tech stack", "CN basics", "types of testing", "java and python difference", "java data structures"], questions: ["Eliminate duplicates and merge lists"] },
  { id: "04", overview: ["Introduce yourself", "Project details", "Sql queries", "Oops concepts", "CN"], questions: ["Frequency of elements", "Remove duplicates without STL"] },
  { id: "05", overview: ["Intro", "Cpp vs java", "Query", "About project", "Puzzle", "Ternary operation"], questions: ["Bubble sort", "Fibonacci series", "String manipulation"] },
  { id: "06", overview: ["Intro", "Projects", "oops concepts", "Debugging", "Time complexity", "Puzzle"], questions: [] },
  { id: "07", overview: ["Introduction", "Project overview", "Oops principles", "Linked list, stack, queues", "Sql queries"], questions: ["Frequency of each character", "Reverse first word only"] },
  { id: "08", overview: ["Introduction", "Projects", "Inheritance", "Exceptions in java"], questions: ["Find greatest sum using two elements", "Highest occurring number in array"] },
  { id: "09", overview: ["Project review", "Situation based questions"], questions: ["First non-duplicate string"] },
  { id: "10", overview: ["Introduction", "Projects", "OOPS concepts", "Exception handling", "Puzzle"], questions: ["Count duplicates of each character", "Count vowels and consonants"] },
  { id: "11", overview: ["Explain project", "OOP concepts", "Searching techniques", "SQL queries"], questions: ["Reverse string", "Delete duplicate elements"] },
  { id: "12", overview: ["SQL queries", "OOP core concepts", "Linked list", "Puzzle"], questions: ["Remove duplicate elements"] },
  { id: "13", overview: ["Oops concept", "Projects", "Automation testing", "SQL", "Puzzles"], questions: ["Bubble sort", "Reverse string"] },
  { id: "14", overview: ["Introduction", "Project overview", "OOPs", "Testing", "API", "Topologies", "SQL", "Puzzles"], questions: ["String anagrams", "Remove duplicate from string", "Binary search"] },
  { id: "15", overview: ["Introduction", "Project overview", "Puzzle"], questions: ["Separate vowels and consonants", "String compression ('aaaabbbc' → 'a4b3c1')"] },
  { id: "16", overview: ["Introduction", "Project overview", "Oops", "API", "Testing", "IPV4", "LAN", "SQL", "Puzzle"], questions: ["Reverse string", "Count duplicates"] },
  { id: "17", overview: ["Introduction", "Project overview", "Oops", "SQL", "Infinite loop", "Puzzle"], questions: ["Reverse string", "Swap without third variable"] },
  { id: "18", overview: ["Introduction", "Projects", "Oops", "Testing", "DBMS", "SQL"], questions: ["Longest substring without repeating characters", "Character frequency"] },
  { id: "19", overview: ["Introduction", "Projects", "Oops", "Sorting", "SQL", "Hashing", "Linked list", "Puzzle"], questions: [] }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for redBus seeding...');

    let company = await Company.findOne({ name: redbusData.name });
    if (!company) {
      company = await Company.create(redbusData);
      console.log('Created Company: redBus');
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
          upvotes: Math.floor(Math.random() * 25),
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

    console.log('redBus seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
