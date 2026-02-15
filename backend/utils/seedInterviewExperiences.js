const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const InterviewExperience = require('../models/InterviewExperience');

const experiences = [
    {
        company: 'Amazon',
        role: 'Quality Assurance Engineer (Round 1)',
        questions: [
            'What does a QA do at amazon?',
            'What are the different types of testing?',
            'What is Regression testing, Black box, white box testing?',
            'What is bug life cycle?',
            'Have you implemented any of the testing methods before?',
            'Write the test data for a File upload system (like Google Drive).',
            'Write the test cases for Payment gateway.',
            'Write the test cases for login portal.',
            'How would you stress test whatsapp (messaging app)'
        ],
        focus: 'Testing Fundamentals, Test Case Design, Stress Testing',
        package: 'Not disclosed'
    },
    {
        company: 'Amazon',
        role: 'Support Engineer',
        questions: [
            'Max count of a particular string, if counts are equal of two strings then return the string which is lexicographically smaller one.',
            'Rotate the linked list from the kth node.'
        ],
        focus: 'DSA (Strings, Linked List)',
        package: 'Not disclosed'
    },
    {
        company: 'Amazon',
        role: 'Support Engineer - II',
        questions: [
            'Details about project tech stack.',
            'Boxes and packages problem.',
            'Conveyor belt string problem.'
        ],
        focus: 'Projects, Scenario-based problem solving',
        package: 'Not disclosed'
    },
    {
        company: 'Amazon',
        role: 'Support Engineer',
        questions: [
            'Celebrity problem.',
            'Given an array, find whether all elements are distinct or not.',
            'Team collaboration scenario: How did you help a team member with a problem and what did you learn?'
        ],
        focus: 'DSA (Arrays, Classic problems), Behavioral',
        package: 'Not disclosed'
    },
    {
        company: 'Amazon',
        role: 'Support Engineer',
        questions: [
            'Find the missing element in an array.',
            'Linux commands.',
            'Project discussion.'
        ],
        focus: 'DSA (Arrays), Linux, Projects',
        package: 'Not disclosed'
    },
    {
        company: 'Amazon',
        role: 'Support Engineer',
        questions: [
            'Basic programming concepts.',
            'OOPS related questions.',
            'Basic OS questions related to deadlock.',
            'Palindrome check.',
            'Finding nth largest element in BST.'
        ],
        focus: 'CS Fundamentals (OOPS, OS), DSA (Strings, Trees)',
        package: 'Not disclosed'
    },
    {
        company: 'Amazon',
        role: 'Quality Assurance Engineer',
        questions: [
            'What is regression testing?',
            'What is smoke testing?',
            'Differentiate between severity and priority.',
            'How will you notify developers when you raise a bug?',
            'Code to convert the cases of a string.',
            'Applied testing in your projects?'
        ],
        focus: 'Testing Methodology, Bug Lifecycle, Strings',
        package: 'Not disclosed'
    },
    {
        company: 'Amazon',
        role: 'System Development Engineer (Round 1)',
        questions: [
            'Find triplets which give maximum profit.',
            'Find the subarray which will give you maximum sum.',
            'Discussion on projects.'
        ],
        focus: 'DSA (Arrays, Optimization), Projects',
        package: 'Not disclosed'
    },
    {
        company: 'Amazon',
        role: 'Frontend Engineer',
        questions: [
            'Graph based: min semesters required to complete courses with prerequisites.',
            'Minimum number of conference rooms required for given time intervals.'
        ],
        focus: 'DSA (Graphs, Interval Scheduling)',
        package: 'Not disclosed'
    },
    {
        company: 'Amazon',
        role: 'Frontend Engineer',
        questions: [
            'LCA of binary tree.',
            'Why React? Difference between React and JS.',
            'React Hooks and syntax.',
            'Is Javascript interpreted or compiled? Is it sync or async?',
            'Currying and Callback functions in JS.'
        ],
        focus: 'DSA (Trees), React, JavaScript Internals',
        package: 'Not disclosed'
    },
    {
        company: 'Dish Company',
        role: 'Software Engineer',
        questions: [
            'Introduce yourself and highlight technical skills.',
            'Question based on your contribution to projects.',
            'MongoDB and SQL queries (2nd highest salary, joins).',
            'Concepts of OOPs and code implementation.',
            'Program to find two adjacent elements of an array which give maximum sum.',
            'A puzzle question.'
        ],
        focus: 'Full Stack Basics, OOPS, DSA (Arrays), SQL',
        package: 'Not disclosed'
    },
    {
        company: 'JPMorgan Chase',
        role: 'Summer Internship 2026',
        questions: [
            'What is structure and class?',
            'Four pillars of OOPS.',
            'Pointer and memory management.',
            'Check whether an HTML file is valid or not using Data Structures.',
            'Conversion from stack to queue.',
            'What is Process Table and Process Control Block?',
            'SQL Queries.'
        ],
        focus: 'CS Fundamentals, Data Structures, OS, SQL',
        package: 'Not disclosed'
    },
    {
        company: 'Oracle',
        role: 'Software Engineer (Round 1)',
        questions: [
            'Basic questions on project.',
            'Factorial of a number.',
            'Given an array of strings, print all anagrams.',
            'Puzzle: Find the lighter coin among 12 identical coins using a weighing scale.'
        ],
        focus: 'DSA, Puzzles, Projects',
        package: 'Not disclosed'
    },
    {
        company: 'British Telecom',
        role: 'Software Engineer',
        questions: [
            'Detect a loop in Linked List.',
            '2nd highest salary query.',
            'Normalization in DBMS.',
            'Waterfall and agile methodology.',
            'Working of CNN (if AI project mentioned).'
        ],
        focus: 'DSA, SQL, Software Engineering Process, AI/ML',
        package: 'Not disclosed'
    },
    {
        company: 'Impact Analytics',
        role: 'Data Analyst / Engineer',
        questions: [
            'Guesstimate questions.',
            'Probability and Statistics (mean, median, mode).',
            'SQL queries and Pandas operations.',
            'Business problem solving.',
            'Python basics.'
        ],
        focus: 'Data Science, Statistics, Analytical Thinking, SQL',
        package: '13 LPA'
    },
    {
        company: 'Juspay',
        role: 'Software Engineer',
        questions: [
            'Serialize and Deserialize Binary Tree using Preorder Traversal.',
            'Reverse a String.',
            'Find and display all pairs of elements in an array whose sum equals a target.',
            'OOPS concepts in depth.'
        ],
        focus: 'Hard DSA (Trees, Arrays), OOPS',
        package: '24 LPA'
    },
    {
        company: 'Netradyne',
        role: 'Software Engineer',
        questions: [
            'Reverse a linked list.',
            'SQL: 2nd highest salary, group by, having, joins.',
            'OS: paging, process/threads, deadlock.',
            'Method overloading/overriding with example code.',
            'Valid Parentheses question.'
        ],
        focus: 'DSA, SQL, OS, OOPS',
        package: '14 LPA'
    },
    {
        company: 'HSBC',
        role: 'Campus Hiring',
        questions: [
            'Stack and Queue implementations.',
            'React hooks and Virtual DOM.',
            'API calls and backend connections.',
            'Real world scenario based questions.'
        ],
        focus: 'DSA, Frontend (React), System Design',
        package: 'Not disclosed'
    }
];

const seedExperiences = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for seeding...');

        // Clear existing experiences
        await InterviewExperience.deleteMany({});
        console.log('Cleared existing interview experiences.');

        // Insert new data
        await InterviewExperience.insertMany(experiences);
        console.log('Successfully seeded interview experiences!');

        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedExperiences();
