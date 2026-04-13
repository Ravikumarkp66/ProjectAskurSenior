const mongoose = require('mongoose');
const Company = require('../models/Company');
const Experience = require('../models/Experience');
require('dotenv').config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Company.deleteMany({});
    await Experience.deleteMany({});

    // Create Companies
      {
        name: 'AMAZON',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
        type: 'Product'
      }
    ]);

    const amazonId = companies[0]._id;

    // 106 Amazon Experiences (Extracted from Frontend)
    const amazonExperiences = [
      {
        companyId: amazonId,
        role: "QAE",
        batch: "2026",
        ctc: "Role Based",
        upvotes: 42,
        rounds: [{
          roundNumber: 1,
          notes: ["What does a QA do at amazon?", "What are the different types of testing?", "What is Regression testing, Black box, white box testing?", "What is bug life cycle?", "Have you implemented any of the testing methods before?", "Write the test data for a File upload system (like Google Drive).", "Write the test cases for Payment gateway.", "Write the test cases for login portal.", "How would you stress test whatsapp (messaging app)"],
          questions: ["No DSA questions asked in this round"]
        }]
      },
      {
        companyId: amazonId,
        role: "SUPPORT ENGINEER",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["No overview provided for this round."],
          questions: ["Max count of a particular string (lexicographically smaller if equal)", "Rotate the linked list from kth node"]
        }]
      },
      {
        companyId: amazonId,
        role: "SUPPORT ENGINEER II",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["He asked me more about my project tech stack.", "Boxes and packages.", "Intro."],
          questions: ["Conveyor belt string problem", "Celebrity problem", "Check if all elements in array are distinct"]
        }]
      },
      {
        companyId: amazonId,
        role: "SUPPORT ENGINEER",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduction.", "About the linux commands and the projects.", "intro.", "some basic programming concepts.", "oops related question.", "basic OS question related to deadlock."],
          questions: ["Find missing element in an array", "Palindrome check", "Find nth largest element in BST"]
        }]
      },
      {
        companyId: amazonId,
        role: "QAE",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["what is regression testing?", "what is smoke testing?", "Differentiate between sevirty and priority.", "how will you notify developers when you raise the debug?", "Have you applied any testing in your projects?"],
          questions: ["Code to convert the cases of string"]
        }]
      },
      {
        companyId: amazonId,
        role: "QAE",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Topic : all about test case like test case for e commerce website", "And for app booking like uber rapido", "To write test data for train booking application"],
          questions: ["No DSA questions asked"]
        }]
      },
      {
        companyId: amazonId,
        role: "SUPPORT ENGINEER",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Situation based questions", "Questions on projects.", "Questions on databases."],
          questions: ["Two sum related problems", "Find missing element"]
        }]
      },
      {
        companyId: amazonId,
        role: "QAE",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["They are only asking about the test cases for different scenarios", "Test data for different scenarios", "Types of testing", "What is software testing", "What QAE do in amazon", "Scenarios like payment gateway , search bar, pen, wall clock, website"],
          questions: ["No DSA questions asked"]
        }]
      },
      {
        companyId: amazonId,
        role: "BUSINESS INTEL",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["How is data integrity maintained in SQL databases?", "DDL and DML commands", "About your projects"],
          questions: ["Find duplicates"]
        }]
      },
      {
        companyId: amazonId,
        role: "SYSTEM DEVELOPMENT ENGINEER",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduction", "Projects"],
          questions: ["Find triplets which gives maximum profit", "Maximum subarray sum"]
        }]
      },
      {
        companyId: amazonId,
        role: "PROGRAMMER",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["No overview provided for this round."],
          questions: ["Sum of diagonal elements of matrix", "Product of array except self"]
        }]
      },
      {
        companyId: amazonId,
        role: "DATA ENGINEER",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["They have asked only dsa problems"],
          questions: ["Longest common suffix", "String without duplicates"]
        }]
      },
      {
        companyId: amazonId,
        role: "SYSTEM DEVELOPMENT ENGINEER",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduction", "Projects"],
          questions: ["Find triplets which gives maximum profit", "Maximum subarray sum"]
        }]
      },
      {
        companyId: amazonId,
        role: "SUPPORT ENGINEER",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["About projects"],
          questions: ["Multiply two arrays as numbers", "Password validation"]
        }]
      },
      {
        companyId: amazonId,
        role: "FEE",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduce your self"],
          questions: ["Graph based (min semesters problem)", "Minimum conference rooms"]
        }]
      },
      {
        companyId: amazonId,
        role: "FEE",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduce your self"],
          questions: ["Zigzag iterator", "Rod cutting problem"]
        }]
      },
      {
        companyId: amazonId,
        role: "SDE",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["How to you pursue your friend in a project to implement ur idea when u had a conflict"],
          questions: ["Insert position in sorted array", "Group anagrams"]
        }]
      },
      {
        companyId: amazonId,
        role: "FRONTEND ENGINEER",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["No overview provided for this round."],
          questions: ["Random pointer linked list", "Diagonal elements of binary tree", "Boundary traversal"]
        }]
      },
      {
        companyId: amazonId,
        role: "SYSTEM DEVELOPMENT ENGINEER",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduction", "Project discussion", "Tech stack based question", "3 situation based questions"],
          questions: ["Valid parenthesis"]
        }]
      },
      {
        companyId: amazonId,
        role: "SYSTEM DEVELOPMENT ENGINEER",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduction", "Unix commands", "OS basics", "CN concepts", "Project discussion"],
          questions: ["Destination validation problem", "Arrival departure (greedy)"]
        }]
      },
      {
        companyId: amazonId,
        role: "SDE",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Project related questions"],
          questions: ["Array increment", "Insert and sort array"]
        }]
      },
      {
        companyId: amazonId,
        role: "PROGRAMMER ANALYST",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduce yourself", "OOPs concepts"],
          questions: ["Top K frequent elements", "Sum of root to leaf numbers"]
        }]
      },
      {
        companyId: amazonId,
        role: "FE",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Why React", "Difference between React and JS", "React hooks and syntax", "JS concepts"],
          questions: ["LCA of binary tree"]
        }]
      },
      {
        companyId: amazonId,
        role: "FEE",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["React questions"],
          questions: ["Find index where arr[i] == i", "Largest smaller key in BST"]
        }]
      },
      {
        companyId: amazonId,
        role: "FEE",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["No overview provided for this round."],
          questions: ["Merge two strings alternately", "Fibonacci"]
        }]
      },
      {
        companyId: amazonId,
        role: "SDE",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introductions", "OS, OOPS, networking concepts", "Behavioural questions", "About projects"],
          questions: ["No DSA questions clearly mentioned"]
        }]
      },
      {
        companyId: amazonId,
        role: "SDE",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Intro", "Detailed project discussions", "OS questions", "Scenarios in projects"],
          questions: ["Generate random numbers", "Reverse integer", "Password strength check"]
        }]
      },
      {
        companyId: amazonId,
        role: "SYSTEM DEVELOPMENT ENGINEER",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Intro", "OS and networking questions", "Linux commands"],
          questions: ["Reverse sentence"]
        }]
      },
      {
        companyId: amazonId,
        role: "FEE",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["No overview provided for this round."],
          questions: ["Next greater element", "Sliding window problem"]
        }]
      },
      {
        companyId: amazonId,
        role: "SDE",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduce yourself", "Project discussion"],
          questions: ["Frequency of characters", "Longest common prefix"]
        }]
      },
      {
        companyId: amazonId,
        role: "FEE",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduce yourself"],
          questions: ["Rain water trapping", "Minimum jumps"]
        }]
      },
      {
        companyId: amazonId,
        role: "SDE I",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Intro", "Project details", "Scenario based question"],
          questions: ["Stock buy and sell", "Maximum subarray sum", "Sort linked list"]
        }]
      },
      {
        companyId: amazonId,
        role: "SYSTEM DEVELOPMENT ENGINEER",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Intro", "About projects"],
          questions: ["Valid parenthesis", "Sort string by frequency"]
        }]
      },
      {
        companyId: amazonId,
        role: "FEE",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Intro", "Projects"],
          questions: ["Next greater number", "Distinct subsequences", "Digit product condition problem"]
        }]
      },
      {
        companyId: amazonId,
        role: "FEE",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduce yourself"],
          questions: ["Merge k linked lists", "Tree cost calculation"]
        }]
      },
      {
        companyId: amazonId,
        role: "FEE",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Intro", "Projects", "Difficulty faced during project"],
          questions: ["Koko eating bananas", "Trim BST"]
        }]
      },
      {
        companyId: amazonId,
        role: "DATA ENGINEER",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Intro", "Structures in C++", "Types of linked lists"],
          questions: ["No clear DSA problems mentioned"]
        }]
      },
      {
        companyId: amazonId,
        role: "SDE",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["What is firewall", "OSI model", "Session layer"],
          questions: ["Coin combination", "kth greater element", "Fix swapped nodes in binary tree"]
        }]
      },
      {
        companyId: amazonId,
        role: "FEE",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduction"],
          questions: ["Top K frequent elements", "Zigzag traversal"]
        }]
      },
      {
        companyId: amazonId,
        role: "FEE",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduction"],
          questions: ["Minimum jumps", "Monster elimination problem"]
        }]
      },
      {
        companyId: amazonId,
        role: "FEE",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduce yourself"],
          questions: ["Minimum subarray length", "Product of array except self"]
        }]
      },
      {
        companyId: amazonId,
        role: "FEE",
        batch: "2026",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduction"],
          questions: ["Smallest missing positive", "Server connectivity / min hops"]
        }]
      },
      // 2027 Batch
      {
        companyId: amazonId,
        role: "QAE",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["writing the test case for a checkout page including new widget", "Test data for an address id instead of full address", "Types of testing", "Testing used in the project", "Bug found in the project", "Regression testing"],
          questions: ["No DSA questions"]
        }]
      },
      {
        companyId: amazonId,
        role: "SYSTEM DEVELOPER",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Questions related to projects(difficulties faced, tech stack related questions etc.)", "Behavioral questions like one time you were not able to meet a commitment etc."],
          questions: ["Trapping Rainwater"]
        }]
      },
      {
        companyId: amazonId,
        role: "QAE",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Write test cases for an automated parking system.", "Write test cases for Amazon cart value discount feature", "Defect life cycle", "STLC"],
          questions: ["No DSA questions"]
        }]
      },
      {
        companyId: amazonId,
        role: "SYSTEM DEVELOPER",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["projects(tech stack and all , how you implemented , whats the use of this and all)", "sorting algorithms (code and complexity discussions)"],
          questions: ["Binary trees identical", "Search in a rotated sorted array"]
        }]
      },
      {
        companyId: amazonId,
        role: "QAE",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Writing the test case for a checkout page including new widget", "Test data for an address id instead of full address", "Types of testing", "Testing used in the project", "Bug found in the project", "Integration testing"],
          questions: ["No DSA questions"]
        }]
      },
      {
        companyId: amazonId,
        role: "PROGRAMMER ANALYST",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Oops concepts", "Basic DBMS and sql", "BSTs how it works"],
          questions: ["Find maximum consecutive numbers in an array", "Check if strings are anagrams"]
        }]
      },
      {
        companyId: amazonId,
        role: "BIE",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Mainly about the project the data cleaning and web scraping process that i have used in my project", "The visualization used in my second project", "Two sql queries one a basic level ond advanced level needed to be use a cte and window function", "About python basics : pandas , numpy and datagrams"],
          questions: ["No DSA questions"]
        }]
      },
      {
        companyId: amazonId,
        role: "QAE",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Explain the project", "Testing used in project", "Scenario given for the project and asked for testcases", "Test data for scenarios", "-amazon profile photo and user id upload", "grade system"],
          questions: ["No DSA questions"]
        }]
      },
      {
        companyId: amazonId,
        role: "QAE",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Why QAE?", "Explain the project", "Different Types of Testing", "given for the project and asked for testcases", "regression testing", "diff between functional and non functional testing", "diff between sanity and regression testing", "full form of API", "full form of HTTP how do use software testing"],
          questions: ["No DSA questions"]
        }]
      },
      {
        companyId: amazonId,
        role: "QAE",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Swiggy food delivery app different stakeholders and test scenarios and test cases for each of it", "multiple scenario based questions testing methods for it"],
          questions: ["Coding scenario based problem"]
        }]
      },
      {
        companyId: amazonId,
        role: "SYSTEM DEVELOPER",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduction", "introduction of each project", "project based questions for each project(scalability, whats the use in real world or larger environment)", "Linux -situation based question"],
          questions: ["Longest repeating character replacement"]
        }]
      },
      {
        companyId: amazonId,
        role: "QAE",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduction", "projects", "write testcases and test data for : search bar,cart,zip/pin code", "sql query", "compatibility testing", "automation testing tools"],
          questions: ["No DSA questions"]
        }]
      },
      {
        companyId: amazonId,
        role: "SDET",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduction", "projects"],
          questions: ["Min time for k servers problem"]
        }]
      },
      {
        companyId: amazonId,
        role: "PROGRAMMER ANALYST",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduction"],
          questions: ["Level order traversal of BST"]
        }]
      },
      {
        companyId: amazonId,
        role: "SDET",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["No overview provided for this round."],
          questions: ["Queue using stack", "Max revenue in k window"]
        }]
      },
      {
        companyId: amazonId,
        role: "SYS DEV",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduction", "Behavioral Question"],
          questions: ["Next greater element", "Climbing stairs", "Next permutation"]
        }]
      },
      {
        companyId: amazonId,
        role: "PROGRAMMER ANALYST",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduction", "CS fundamentals covering topics like deadlocks, thrashing, ACID, CRUD, RDBMS, caching, OOP, Procedural programming, basic backend terminologies", "DSA questions won't be direct, they will give the question and we have to match it with the standard leetcode problem approach"],
          questions: ["Two sum", "Longest subarray with increasing elements", "Group anagram"]
        }]
      },
      {
        companyId: amazonId,
        role: "SYSDEV",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduction", "Explanation about projects and Tech Stacks", "Difference between SQL and mongoDB with features", "Behavioural questions like Instance where you faced difficulty in your project and Instance when you disagree with you peers in project development", "System Scalabilty logic"],
          questions: ["Container with most water", "Jump Game II"]
        }]
      },
      {
        companyId: amazonId,
        role: "QAE",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduction", "Project in depth questions", "Why did I chose to make so and so project", "REST API", "HTTP status codes", "Test login functionality with appropriate scenarios", "Difference between Role based and session based authentication and what scenarios should we use it", "Many follow up questions based on test cases written", "Test Payment method page with (In depth follow up questions)", "All the test cases were asked to write on the editor"],
          questions: ["Smallest positive integer"]
        }]
      },
      {
        companyId: amazonId,
        role: "BIE",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Sql query on finding the nth salary", "Finding the count of repeated alphabets in an example", "How do you handle large set of data", "Left join, right Join"],
          questions: ["Count repeated alphabets"]
        }]
      },
      {
        companyId: amazonId,
        role: "QAE",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Why QAE", "Difference between test stratergy and test plan", "Explain briefly about test plan", "Debit card/Credit card integration with Gpay-test cases", "Scenario based questions like if you are working in multiple projects how will you handle it"],
          questions: ["No DSA questions"]
        }]
      },
      {
        companyId: amazonId,
        role: "PA",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduction", "Oops, OS"],
          questions: ["Word break problem", "Search in rotated sorted array"]
        }]
      },
      {
        companyId: amazonId,
        role: "BIE",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Application of normalization on a table", "Two advanced SQL queries", "The difference between a database and a data warehouse", "Different schemas used in a data warehouse", "An explanation of the ETL (Extract, Transform, Load) process"],
          questions: ["No DSA questions"]
        }]
      },
      {
        companyId: amazonId,
        role: "QAE",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Write test cases for login page and explain different scenarios", "Write test data for login page", "Types of testing", "Difference between Sanity and regression testing and where we use and why", "SDLC AND STLC Explanation", "Bug life cycle", "Project Explanation and what difficulty while implementation", "Non functional testing", "Boundary value analysis explanation", "What things you will automate and how will u automate"],
          questions: ["No DSA questions"]
        }]
      },
      {
        companyId: amazonId,
        role: "QAE",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Why QAE", "What is the difference between a Test Strategy and a Test Plan", "Explain briefly about a Test Plan", "Write test cases for adding a new card-based transaction feature", "How to automate the testing for card functionality", "Scenario-based question: How will you handle multiple high-priority test cases", "How do you think AI will affect the QAE role, and how will you use it"],
          questions: ["No DSA questions"]
        }]
      },
      {
        companyId: amazonId,
        role: "QAE",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Brief introduction", "Types of non-functional testing", "Explain the above said types", "Test scenarios for a payment page", "Test data for a google drive website"],
          questions: ["No DSA questions"]
        }]
      },
      {
        companyId: amazonId,
        role: "SDE",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduction", "Explanation about projects", "Behavioural questions like", "-a situation where u faced criticism and how u handled", "-how u worked as a team and completed the project"],
          questions: ["Sort a deck of cards", "Reverse a sentence"]
        }]
      },
      {
        companyId: amazonId,
        role: "QAE",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 2,
          notes: ["Introduction", "Importance of testing", "Amazon leadership priniples", "Different types of testing", "HTTP Status code", "HTTP methods get, post, put, delete which method used in project", "SDLC and STLC", "About CI/CD pipeline", "Tools used selenium", "About GIT hub and git commands used", "About api testing"],
          questions: ["Reverse words in string", "Gas station"]
        }]
      },
      {
        companyId: amazonId,
        role: "QAE",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 2,
          notes: ["Project Explanation", "Testing in Projects", "Difference between different Testing", "Seleneium and automation questions", "Behavioural questions", "Bug related questions"],
          questions: ["Reverse integer", "Sum of largest and second largest"]
        }]
      },
      {
        companyId: amazonId,
        role: "PROGRAMMER ANALYST",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduce Your Self", "what major difference between c and c++", "Real world examples- linked list,tree,graph", "difference between array and linked list", "About API", "what is deadlock and conditions", "DBMS- explain join types", "Oops", "Memory types"],
          questions: ["kth best fighter problem"]
        }]
      },
      {
        companyId: amazonId,
        role: "SYSTEM DEVELOPMENT ENGINEER",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduction", "Project discussions (architecture, caching, CDN, AWS, IAM, etc.)"],
          questions: ["Count and Say"]
        }]
      },
      {
        companyId: amazonId,
        role: "QAE",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduction", "Project", "Why QAE", "Functional testing and regression testing difference", "Non functional testing types", "Test case scenarios", "Automation tools", "API tools"],
          questions: ["No DSA questions"]
        }]
      },
      {
        companyId: amazonId,
        role: "SDET",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduction", "Project", "Types of testing", "Manual vs automated testing"],
          questions: ["No DSA questions"]
        }]
      },
      {
        companyId: amazonId,
        role: "QAE",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduction", "Project Explanation & Technologies Used", "Types of Testing", "Test Cases and Test Data", "Automation Testing", "Behavioral"],
          questions: ["No DSA questions"]
        }]
      },
      {
        companyId: amazonId,
        role: "SDET",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["About Project", "AI tools"],
          questions: ["Check if binary tree is BST"]
        }]
      },
      {
        companyId: amazonId,
        role: "BIE",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Self introduction", "Project", "ACID", "SQL joins", "OOPS", "Behavioural"],
          questions: ["No DSA questions"]
        }]
      },
      {
        companyId: amazonId,
        role: "PROGRAMMER ANALYST",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduction", "Oops", "OS", "Pointers", "Latency"],
          questions: ["Max count in increasing array"]
        }]
      },
      {
        companyId: amazonId,
        role: "SUPPORT ENGINEER",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Intro", "Behavioural"],
          questions: ["Reverse vowels", "Reverse words"]
        }]
      },
      {
        companyId: amazonId,
        role: "SYSTEM DEVELOPMENT",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduction", "Behavioral questions"],
          questions: ["Remove adjacent duplicates string", "Insert in sorted array"]
        }]
      },
      {
        companyId: amazonId,
        role: "QAE",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduction", "Testing concepts", "Test scenarios", "Behavioral"],
          questions: ["No DSA questions"]
        }]
      },
      {
        companyId: amazonId,
        role: "SUPPORT ENGINEER",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 2,
          notes: ["Intro", "OS", "CN", "Projects"],
          questions: ["No DSA questions"]
        }]
      },
      {
        companyId: amazonId,
        role: "SE",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Self introduction", "Project explanations", "Behavioral questions"],
          questions: ["Minimum coins problem"]
        }]
      },
      {
        companyId: amazonId,
        role: "BUSINESS INTEL ENGINEER",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Table based SQL questions", "ETL", "ACID", "Python DB interaction"],
          questions: ["Even numbers squared sorted"]
        }]
      },
      {
        companyId: amazonId,
        role: "QAE",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 2,
          notes: ["Scenario based + testing", "Test case design"],
          questions: ["Remove duplicates from array", "Merge arrays sorted"]
        }]
      },
      {
        companyId: amazonId,
        role: "QAE",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 2,
          notes: ["Classes and objects", "Testing concepts", "Bug lifecycle"],
          questions: ["Palindrome"]
        }]
      },
      {
        companyId: amazonId,
        role: "BIE",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduction", "Project", "SQL", "Python basics"],
          questions: ["No DSA questions"]
        }]
      },
      {
        companyId: amazonId,
        role: "QAE",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduction", "Projects", "Scenario based testing"],
          questions: ["No DSA questions"]
        }]
      },
      {
        companyId: amazonId,
        role: "PROGRAMMER ANALYST",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 2,
          notes: ["Introduction", "Code debugging", "Path string explanation"],
          questions: ["No DSA questions"]
        }]
      },
      {
        companyId: amazonId,
        role: "SUPPORT ENGINEER",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Project based", "OS", "CN"],
          questions: ["3 sum", "Segregate even odd"]
        }]
      },
      {
        companyId: amazonId,
        role: "DATA ENGINEER",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduction", "Project", "SQL"],
          questions: ["Reverse vowels"]
        }]
      },
      {
        companyId: amazonId,
        role: "SDET",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Intro", "Project"],
          questions: ["Longest palindromic substring"]
        }]
      },
      {
        companyId: amazonId,
        role: "PROGRAMMER ANALYST",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 2,
          notes: ["Introduction", "Behavioural"],
          questions: ["Max width of binary tree", "Next greater element circular"]
        }]
      },
      {
        companyId: amazonId,
        role: "SYS DEV",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduction", "Project", "Behavioural"],
          questions: ["Rotate matrix", "Frequency sort"]
        }]
      },
      {
        companyId: amazonId,
        role: "DATA ANALYST",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Intro", "Projects", "DBMS"],
          questions: ["Valid parenthesis", "Two sum"]
        }]
      },
      {
        companyId: amazonId,
        role: "SYS DEV",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduction", "Coding", "Behavioural"],
          questions: ["Smallest missing number", "Shift array k times"]
        }]
      },
      {
        companyId: amazonId,
        role: "SYS DEV",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Intro", "Behavioural"],
          questions: ["Valid parenthesis", "Move zeros"]
        }]
      },
      {
        companyId: amazonId,
        role: "SYSTEM DEVELOPMENT",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduction", "Project explanation"],
          questions: ["Valid anagram", "3 sum"]
        }]
      },
      {
        companyId: amazonId,
        role: "SDET",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduction", "Project", "Problem solving"],
          questions: ["Find duplicates", "Parse log file result"]
        }]
      },
      {
        companyId: amazonId,
        role: "SDET",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduction"],
          questions: ["Stack implementation with increment"]
        }]
      },
      {
        companyId: amazonId,
        role: "SDET",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduction", "Projects"],
          questions: ["Valid parenthesis", "Binary search infinite array"]
        }]
      },
      {
        companyId: amazonId,
        role: "SDET",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduction", "Project"],
          questions: ["Palindromic substrings"]
        }]
      },
      {
        companyId: amazonId,
        role: "SDET",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["Introduction", "Behavioural"],
          questions: ["Intersection of linked list", "Search in rotated array"]
        }]
      },
      {
        companyId: amazonId,
        role: "SDET",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["No overview provided for this round."],
          questions: ["Kth maximum element", "Capacity to ship packages"]
        }]
      },
      {
        companyId: amazonId,
        role: "DATA ENGINEER",
        batch: "2027",
        ctc: "Role Based",
        rounds: [{
          roundNumber: 1,
          notes: ["SQL", "OOPS", "Hadoop"],
          questions: ["Sliding window problems"]
        }]
      }
    ];

    await Experience.insertMany(amazonExperiences);

    // No other companies seeded for now.

    console.log('Database Seeded Successfully with 106 Amazon experiences!');
    process.exit();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
