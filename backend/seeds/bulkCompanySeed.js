const mongoose = require('mongoose');
const Company = require('../models/Company');
const Experience = require('../models/Experience');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/askursenior';

const companiesData = [
  { name: "HSBC", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/HSBC_logo_%282018%29.svg/1200px-HSBC_logo_%282018%29.svg.png", type: "Service" },
  { name: "Impact Analytics", logo: "https://www.impactanalytics.co/wp-content/uploads/2021/04/IA-Logo-New.png", type: "Product" },
  { name: "British Telecom", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/0/03/BT_logo_2019.svg/1200px-BT_logo_2019.svg.png", type: "Product" },
  { name: "Oracle", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Oracle_logo.svg/1200px-Oracle_logo.svg.png", type: "Product" },
  { name: "ZS Associates", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/ZS_Associates_Logo.svg/1200px-ZS_Associates_Logo.svg.png", type: "Service" },
  { name: "Visa", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/1200px-Visa_Inc._logo.svg.png", type: "Product" }
];

const hsbcExps = [
  { rid: "01", overview: ["About project"], questions: ["Leader in array"] },
  { rid: "02", overview: ["About project", "git commands", "oops", "Os"], questions: ["Number of islands", "Remove nth node"] },
  { rid: "03", overview: ["React components", "Jsx code", "Implementation of code in your project", "Management"], questions: [] },
  { rid: "04", overview: ["Project", "SQL queries", "OS questions", "Oops"], questions: [] },
  { rid: "05", overview: ["About projects", "Azure fundamentals", "Mongodb questions"], questions: ["Maximum two-digit substring"] },
  { rid: "06", overview: ["About projects", "Coding concepts", "Stack, Queue"], questions: ["Reverse linked list", "Binary search"] },
  { rid: "07", overview: ["About projects", "React hooks", "Role in your project", "Conditional rendering", "Memorization in React", "Props and states", "Why React uses Virtual DOM", "Why React is used"], questions: [] },
  { rid: "08", overview: ["About projects", "API calls", "Real world scenario based questions", "Backend connections and implementation"], questions: ["Binary search"] }
];

const impactExps = [
  { rid: "01", overview: ["About projects", "Coding concepts", "Stack, Queue"], questions: ["Reverse linked list", "Binary search"] },
  { rid: "02", overview: ["About projects", "React hooks", "Role in your project", "Conditional rendering", "Memorization in React", "Props and states", "Why React uses Virtual DOM", "Why React is used"], questions: [] },
  { rid: "03", overview: ["About projects", "API calls", "Real world scenario based questions", "Backend connections and implementation"], questions: ["Binary search"] },
  { rid: "04", overview: ["Projects", "Api", "Jwt token", "Express", "Disadvantages of jwt"], questions: [] },
  { rid: "05", overview: ["Intro", "Sql query", "Pandas query", "Puzzle", "Probability question", "Statistics question", "Guesstimates", "Business problem"], questions: [] },
  { rid: "06", overview: ["Intro", "About projects", "Sql queries", "Github commands", "Aptitude question", "Sorting algorithms", "Puzzle", "Statistics questions"], questions: ["Sorting algorithms"] },
  { rid: "07", overview: ["Intro", "Sql query", "Questions on sql commands", "Pandas", "Types of ml", "Questions on project", "Statistics and probability", "Guesstimate"], questions: [] },
  { rid: "08", overview: ["Intro", "Projects", "Statistics and Probability question", "Guesstimate question"], questions: ["Reverse words in a string"] },
  { rid: "09", overview: ["Intro", "Projects", "Statistics and probability", "Python", "SQL", "Guesstimate", "Excel"], questions: [] },
  { rid: "10", overview: ["Intro", "Project", "SQL", "Python", "Puzzle", "Guesstimate"], questions: [] },
  { rid: "11", overview: ["Intro", "Project", "SQL", "python", "Puzzle"], questions: [] },
  { rid: "12", overview: ["Intro", "Project", "Probability", "Sql", "Python", "Business related questions"], questions: [] },
  { rid: "13", overview: ["Intro", "Sql queries", "Statistics", "Probability", "Python, Pandas", "Guesstimate"], questions: [] },
  { rid: "14", overview: ["Intro", "Projects", "Statistics", "Pandas", "Guesstimates", "Business problem"], questions: [] },
  { rid: "15", overview: ["Intro", "Projects", "Statistics", "Guesstimates", "Puzzle", "SQL basics"], questions: [] },
  { rid: "16", overview: ["Intro", "Sql query", "Questions on sql commands", "Pandas", "Project", "Statistics and probability", "Guesstimate", "Reasoning"], questions: [] },
  { rid: "17", overview: ["Sql query", "Business problem", "Reasoning"], questions: ["2 coding questions (not specified)"] },
  { rid: "18", overview: ["2 puzzle", "Guesstimate", "Statistics"], questions: ["2 coding questions (not specified)"] },
  { rid: "19", overview: ["Introduction", "Deep dive into project", "Guess estimation", "Probability", "Pseudo code of projects"], questions: ["Next sequence problem"] },
  { rid: "20", overview: ["Intro", "Projects", "Python", "algorithm explanation", "Excel", "Sql query", "Statistics and probability", "Guesstimate"], questions: ["2 coding questions (not specified)"] },
  { rid: "21", overview: ["Intro", "Sql queries: Joins, Like clause", "Aptitude", "Statistics"], questions: [] },
  { rid: "22", overview: ["Intro", "Projects", "Time and work reasoning", "Puzzle", "Guesstimate"], questions: ["DSA (not specified)"] },
  { rid: "23", overview: ["Intro", "Mean, median, mode", "Python", "Puzzle", "Time and work", "Guesstimate"], questions: [] },
  { rid: "24", overview: ["Intro", "Projects", "Puzzles", "Guesstimate", "SQL queries"], questions: [] },
  { rid: "25", overview: ["Intro", "Why ML", "Data interpretation", "Puzzle"], questions: [] },
  { rid: "26", overview: ["Intro", "Project", "Data interpretation", "Puzzle", "Sql"], questions: [] },
  { rid: "27", overview: ["Intro", "Projects", "Puzzles", "Guesstimate", "Business questions"], questions: [] },
  { rid: "28", overview: ["Intro", "Guesstimate", "Hackathon", "Sports questions", "Puzzle"], questions: [] }
];

const btExps = [
  { rid: "01", overview: ["2nd highest salary", "Normalization", "Project brief"], questions: ["Detect a loop in linked list"] },
  { rid: "02", overview: ["Brief explanation about projects", "Oops concepts", "About AI"], questions: ["Merge sort"] },
  { rid: "03", overview: ["Brief explanation about project", "About stack, queue and priority queue"], questions: ["Delete kth node in linked list", "Merge sort", "Palindrome"] },
  { rid: "04", overview: ["Projects", "Favorite subject and questions related to that", "SQL queries", "One proud moment", "Why BT", "Career plans"], questions: [] },
  { rid: "05", overview: ["Introduction", "Projects in depth discussion", "ML DL algorithms, CNN", "Behavioural questions", "Oops codes", "Sql queries", "Waterfall and agile", "OS concepts"], questions: [] }
];

const oracleExps = [
  { 
    rid: "01", 
    rounds: [
      { r: 1, o: ["Introduction", "In depth all projects along with some machine learning algorithms", "They ask me to write some codes of projects also", "In depth CS fundamentals", "Easy and medium level sql queries based on joins", "Scenario questions"], q: ["Reverse string", "Quick sort"] },
      { r: 2, o: ["Introduction", "Overview of projects", "General discussion", "Basics of SQL", "Windows, git, GitHub, linux", "Behavioral and rhetorical questions", "Family background"], q: [] }
    ]
  },
  { 
    rid: "02", 
    rounds: [
      { r: 1, o: ["Asked about java, arraylist, strings, hashmap", "Springboot concepts", "Questions on projects", "SQL query"], q: ["2 logical questions (not specified)"] },
      { r: 2, o: ["Questions based on resume", "Project architecture discussion", "DBMS", "Strengths and weakness"], q: [] }
    ]
  },
  { 
    rid: "03", 
    rounds: [
      { r: 1, o: ["Introduction", "Project explain", "OOPs concepts", "SQL queries", "ML situation questions"], q: ["Reverse linked list", "Two sum"] },
      { r: 2, o: ["Project explanation", "Java concepts", "Spring boot", "DBMS", "SQL", "Behavioral"], q: [] }
    ]
  },
  { 
    rid: "04", 
    rounds: [
      { r: 1, o: ["Project basics", "DSA basics", "Puzzle"], q: ["Factorial", "Group anagrams"] },
      { r: 2, o: ["Introduction", "Tech stack discussion", "System design", "Project architecture", "Behavioral", "AI discussion"], q: ["One DSA question (Java coding, not specified)"] }
    ]
  },
  { 
    rid: "05", 
    rounds: [
      { r: 1, o: ["Project explanation", "Gen AI tools", "Kafka", "OOP abstraction"], q: ["Find middle node in linked list", "Bubble sort", "Merge sort"] },
      { r: 2, o: ["Project explanation", "Linux commands", "Language comparison", "Behavioral"], q: [] }
    ]
  },
  { 
    rid: "06", 
    rounds: [
      { r: 1, o: ["Introduction", "OOP", "Express", "SQL", "OS"], q: ["DSA question (not specified)"] },
      { r: 2, o: ["Scenario based deep discussion"], q: [] }
    ]
  },
  { 
    rid: "07", 
    rounds: [
      { r: 1, o: ["Introduction", "Project", "OOP"], q: ["Reverse string", "Sorting algorithms"] },
      { r: 2, o: ["Scenario discussion", "Project", "ML algorithms"], q: [] }
    ]
  },
  { 
    rid: "08", 
    rounds: [
      { r: 1, o: ["OOP in Java", "React", "Springboot", "Puzzle"], q: ["Palindrome", "Prime number", "Check if BST is balanced"] },
      { r: 2, o: ["Project discussion", "SQL", "Scenario questions"], q: [] }
    ]
  },
  { 
    rid: "09", 
    rounds: [
      { r: 1, o: ["Project discussion", "React API", "Puzzle", "C/C++ difference", "DBMS"], q: ["Fibonacci", "Bubble sort", "Evaluate postfix expression"] },
      { r: 2, o: ["Scenario questions", "ML, NLP", "Language comparison"], q: [] }
    ]
  },
  { 
    rid: "10", 
    rounds: [
      { r: 1, o: ["Project discussion", "SQL joins", "Scenario questions", "Java error handling", "LLM working"], q: [] },
      { r: 2, o: ["Project (NLP)", "DBMS", "OOP", "Java collections", "SQL"], q: [] }
    ]
  },
  { 
    rid: "11", 
    rounds: [
      { r: 1, o: ["Project explanation", "ML models", "LLM", "OOP concepts", "SQL joins", "Situational questions"], q: ["Sorting algorithm"] },
      { r: 2, o: ["Core questions", "Transistors", "C/C++", "Compiler vs interpreter", "OOP", "Behavioral"], q: [] }
    ]
  }
];

const zsExps = [
  { rid: "01", overview: ["Intro, projects", "Sql joins, window functions, transaction query", "Python data cleaning", "Excel formatting and functions"], questions: [] },
  { rid: "02", overview: ["Intro", "Projects", "Sql queries", "Primary, foreign, composite key", "Diff on rank, dense rank, rownumber"], questions: [] },
  { rid: "03", overview: ["Introduction", "Project", "Sql queries advanced", "Case study"], questions: [] },
  { rid: "04", overview: ["Intro, Projects", "Sql Queries", "Python basics", "Star schema", "Dbms basics : primary key, composite key, foreign key"], questions: ["Reverse a string"] },
  { rid: "05", rounds: [{ r: 2, o: ["Intro", "Projects", "Sql queries", "Real world problems"], q: [] }] },
  { 
    rid: "06", 
    rounds: [
      { r: 1, o: ["Intro", "Projects", "Sql queries"], q: [] },
      { r: 2, o: ["Intro", "Projects", "Guessimates", "Puzzle", "Business problems"], q: [] }
    ]
  },
  { rid: "07", overview: ["introduction", "projects", "sql queries", "case study"], questions: [] }
];

const visaExps = [
  { rid: "01", overview: ["Brief introduction", "Projects", "Coding in comfortable language", "Sql", "Depends - how u r explaining seniors and all", "Final words from interviewer: coding is everything"], questions: [] },
  { rid: "02", overview: ["About projects in brief"], questions: ["Maximum consecutive ones", "Best time to buy and sell stock"] },
  { rid: "03", overview: ["About projects in brief", "Scenario based questions"], questions: ["Linked list problem (not specified)", "Binary tree problem (not specified)"] },
  { rid: "04", overview: ["Introduction", "Projects", "OOPS concepts", "Linked list", "Scenario based questions"], questions: ["File system related DSA problem"] },
  { rid: "05", overview: ["OOPS concepts", "Projects"], questions: ["Serialize and Deserialize Binary Tree (preorder)", "Reverse string", "Pair sum in array"] }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for Multi-Company seeding...');

    for (const compData of companiesData) {
      let company = await Company.findOne({ name: compData.name });
      if (!company) {
        company = await Company.create(compData);
        console.log(`Created Company: ${compData.name}`);
      } else {
        company.logo = compData.logo; // Update logo if changed
        await company.save();
      }

      let targetExps = [];
      let ctc = "Role Based";
      let difficulty = "Medium";

      if (compData.name === "HSBC") targetExps = hsbcExps;
      if (compData.name === "Impact Analytics") { targetExps = impactExps; ctc = "10+ LPA"; }
      if (compData.name === "British Telecom") targetExps = btExps;
      if (compData.name === "Oracle") { targetExps = oracleExps; ctc = "15-20 LPA"; difficulty = "Hard"; }
      if (compData.name === "ZS Associates") { targetExps = zsExps; ctc = "15 LPA"; }
      if (compData.name === "Visa") { targetExps = visaExps; ctc = "20+ LPA"; difficulty = "Hard"; }

      for (const data of targetExps) {
        const experienceId = `Exp ${data.rid}`;
        
        // Simple search logic to avoid dups
        const alreadyAdded = await Experience.findOne({ 
          experienceId, 
          companyId: company._id,
          batch: "2025"
        });

        if (!alreadyAdded) {
          const rounds = data.rounds ? data.rounds.map(r => ({
            roundNumber: r.r,
            notes: r.o,
            questions: r.q ? r.q.map(qText => ({ text: qText, solveLink: "" })) : []
          })) : [
            {
              roundNumber: 1,
              notes: data.overview,
              questions: data.questions ? data.questions.map(qText => ({ text: qText, solveLink: "" })) : []
            }
          ];

          await Experience.create({
            experienceId,
            companyId: company._id,
            role: "Software Development Engineer",
            batch: "2025",
            ctc,
            difficulty,
            upvotes: Math.floor(Math.random() * 20),
            rounds
          });
          console.log(`Added ${experienceId} for ${compData.name}`);
        }
      }
    }

    console.log('Bulk seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
