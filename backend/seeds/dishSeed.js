const mongoose = require('mongoose');
const Company = require('../models/Company');
const Experience = require('../models/Experience');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/askursenior';

const dishData = {
  name: "Dish Company",
  logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Dish_Network_logo.svg/1200px-Dish_Network_logo.svg.png",
  type: "Product"
};

const rawExps = [
  { id: "01", role: "SDE", overview: ["Brief explanation about myself", "Asked about Project", "Some analytical questions"], questions: ["Check palindrome program"] },
  { id: "02", role: "SDE", overview: ["Linux concepts", "Layers in computer networks", "Protocols used in everyday applications", "Questions on my projects", "Tools used", "Basic questions in c/c++"], questions: [] },
  { id: "03", role: "SDE", overview: ["questions on project", "basic sql", "diff between git and github"], questions: ["Pattern printing", "Quick sort", "Merge sort"] },
  { id: "04", role: "SDE", overview: ["Introduction", "Questions on project", "Difference between windows and Linux", "OSI models", "TCP and UDP", "HTTPS and Http difference"], questions: ["Print even numbers"] },
  { id: "05", role: "SDE", overview: ["Introduction", "My project", "Sorting", "Ml", "LLM"], questions: [] },
  { id: "06", role: "SDE", overview: ["Introduction", "CN", "OSI layers", "Projects"], questions: [] },
  { id: "07", role: "SDE", overview: ["Introduction", "Project", "Basics of c", "Computer networks", "Osi/TCP ip models", "5g/4g"], questions: [] },
  { id: "08", role: "SDE", overview: ["Introduction", "About projects", "Oops concept", "Question on Communication system", "Signal processing questions", "Osi layer discussion", "Modulation types", "Advantages of 5G compared to 4G,3G,2G,1G", "Applications of 5G"], questions: [] },
  { id: "09", role: "SDE", overview: ["Brief Introduction", "Questions on signals and systems", "Questions on IoT and networking", "Questions on cpp", "About my projects", "Questions on communication system"], questions: [] },
  { id: "10", role: "SDE", overview: ["Introduction", "About projects", "Oops concept", "Difference between http and https", "Difference between structure and class", "Osi layers", "TCP handshaking", "Linux commands", "About Operating systems", "Python basics"], questions: [] },
  { id: "11", role: "SDE", overview: ["Introduction", "About project", "IoT and networks", "Digital signal processing", "Matlab commands", "About gates", "Difference between tcp and UDP", "Osi model", "About linux", "Python basics"], questions: [] },
  { id: "12", role: "SDE", overview: ["Introduction", "About projects", "Oops concepts", "Difference between http and https", "Osi layers", "TCP handshaking", "Advantages and applications of 5G", "Python basics"], questions: [] },
  { id: "13", role: "SDE", overview: ["Introduction", "About projects", "3 puzzle based questions", "5G applications", "Cloud deployment models", "Difference between a pointer and array"], questions: ["Reverse a string"] },
  { id: "14", role: "SDE", overview: ["Introduction", "About projects", "TCP and UDP"], questions: ["Pattern printing", "Quick sort", "Merge sort"] },
  { id: "15", role: "SDE", overview: ["Introduction to projects", "Difference between HTTP AND HTTPS", "ABOUT 5G", "Basic c++", "About OSI model and protocol", "About the assessment questions"], questions: ["Find majority element"] },
  { id: "16", role: "SDE", overview: ["Introduction", "About Projects", "OSI model and difference between TCP and udp protocol"], questions: ["Merge sort"] },
  { id: "17", role: "Managerial Round", overview: ["Introduction", "Projects", "CN", "Cloud"], questions: [] },
  { id: "18", role: "Manager Round", overview: ["Introduction", "Projects", "API's, CN", "Public and private IP's", "Decimal, hexadecimal numbers system", "capacitor,Resistor", "Cloud,Hypervisors", "behavioural questions"], questions: [] },
  { id: "19", role: "SDE", overview: ["Introduction", "Osi model", "Ipv4", "Data type in c++", "Function overwriting", "oops", "Os"], questions: ["Print odd numbers", "Sum of two sorted array"] },
  { id: "20", role: "SDE", overview: ["Introduction", "projects", "technologies used in project", "OS Layers", "TCP applications", "5G applications", "ASK FSK PSK", "CDMA, FDMA", "Methods like GET, POST", "Difference between pointer and array", "cloud deployment model"], questions: ["Palindrome"] },
  { id: "21", role: "SDE", overview: ["Introduction", "About Projects", "Oops", "OSI model", "TCP and udp protocol"], questions: ["Pattern printing", "Merge sort"] },
  { id: "22", role: "SDE", overview: ["Introduction", "projects", "OSI Layers", "TCP applications", "5G application", "Comparison from 1G to 5G", "Modulation techniques", "HTTP AND DHCP"], questions: [] }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for Dish seeding...');

    let company = await Company.findOne({ name: dishData.name });
    if (!company) {
      company = await Company.create(dishData);
      console.log('Created Company: Dish Company');
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
          role: data.role,
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

    console.log('Dish seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
