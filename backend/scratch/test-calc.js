require('dotenv').config();
const { processAcademicCalculation } = require('../services/academicCalculator');

async function test() {
    const q1 = "I have 50 CIE marks. How much SEE is required for O Grade?";
    const r1 = await processAcademicCalculation(q1);
    console.log("=== Q1 ===");
    console.log(r1);

    const q2 = "My attendance is 72%. Conducted is 60. How many to reach 75%?";
    const r2 = await processAcademicCalculation(q2);
    console.log("=== Q2 ===");
    console.log(r2);
}

test();
